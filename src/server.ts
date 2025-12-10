// ═══════════════════════════════════════════════════════════════════════════════
// PUSH - Express Server
// x402 Payment-Enabled Blockchain AI Service
// ═══════════════════════════════════════════════════════════════════════════════

// IMPORTANT: Load environment variables FIRST before any other imports
import "dotenv/config";

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { processMessage, streamMessage, getAvailableTools, getToolCount } from "./claudeService.js";
import { createPaymentRequirements, verifyAndSettle, checkMerchantBalance } from "./merchantExecutor.js";
import * as blockchain from "./blockchainTools.js";
import { SUPPORTED_NETWORKS, PaymentPayload } from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || "3000");
const PAY_TO = process.env.PAY_TO_ADDRESS || "0x0000000000000000000000000000000000000000";
const PRICE = process.env.DEFAULT_PRICE || "100000";
const NETWORK = process.env.NETWORK || "base";

// ─────────────────────────────────────────────────────────────────────────────
// Express App Setup
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// ─────────────────────────────────────────────────────────────────────────────
// Health & Info Endpoints
// ─────────────────────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  const networkConfig = SUPPORTED_NETWORKS[NETWORK];
  res.json({
    status: "healthy",
    service: "Push",
    version: "2.0.0",
    ai: {
      provider: "Anthropic",
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
    },
    payment: {
      network: NETWORK,
      networkName: networkConfig?.name || NETWORK,
      chainId: networkConfig?.chainId,
      price: `$${(parseInt(PRICE) / 1000000).toFixed(2)}`,
      priceRaw: PRICE,
      asset: "USDC",
      productionMode: !!process.env.MERCHANT_PRIVATE_KEY,
    },
    tools: getAvailableTools(),
    toolCount: getToolCount(),
    networks: Object.keys(SUPPORTED_NETWORKS),
    networkCount: Object.keys(SUPPORTED_NETWORKS).length,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Merchant Status (Check wallet balance for gas)
// ─────────────────────────────────────────────────────────────────────────────

app.get("/merchant-status", async (_req: Request, res: Response) => {
  try {
    if (!process.env.MERCHANT_PRIVATE_KEY) {
      res.json({
        mode: "demo",
        message: "Running in demo mode - MERCHANT_PRIVATE_KEY not configured",
        productionReady: false,
      });
      return;
    }

    const balance = await checkMerchantBalance(NETWORK);
    res.json({
      mode: "production",
      ...balance,
      productionReady: balance.hasGas,
      warning: balance.hasGas ? null : "Merchant wallet needs ETH for gas fees",
    });
  } catch (error) {
    res.status(500).json({
      mode: "error",
      error: error instanceof Error ? error.message : "Failed to check merchant status",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Payment Info (x402 Requirements)
// ─────────────────────────────────────────────────────────────────────────────

app.get("/payment-info", (_req: Request, res: Response) => {
  const requirements = createPaymentRequirements(
    "/process",
    "Push AI - Blockchain Intelligence",
    PRICE,
    PAY_TO,
    NETWORK
  );
  res.json(requirements);
});

// ─────────────────────────────────────────────────────────────────────────────
// Payment Links - Create & Share Payment Requests
// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/payment-link/create", async (req: Request, res: Response) => {
  try {
    const { amount, recipient, description, network = "base" } = req.body;

    if (!amount || !recipient) {
      res.status(400).json({ error: "Amount and recipient are required" });
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      res.status(400).json({ error: "Invalid recipient address" });
      return;
    }

    const amountInDecimals = Math.floor(parseFloat(amount) * 1000000).toString();

    const linkData = {
      v: 1,
      r: recipient,
      a: amountInDecimals,
      n: network,
      d: description || "",
      t: Date.now(),
    };

    const encoded = Buffer.from(JSON.stringify(linkData)).toString("base64url");
    
    res.json({
      success: true,
      linkId: encoded,
      link: `/pay/${encoded}`,
      data: {
        recipient,
        amount,
        amountRaw: amountInDecimals,
        network,
        description,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create payment link" });
  }
});

app.get("/api/payment-link/:linkId", async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const decoded = JSON.parse(Buffer.from(linkId, "base64url").toString("utf-8"));
    const networkConfig = SUPPORTED_NETWORKS[decoded.n || "base"];
    
    res.json({
      success: true,
      recipient: decoded.r,
      amount: (parseInt(decoded.a) / 1000000).toFixed(2),
      amountRaw: decoded.a,
      network: decoded.n || "base",
      networkName: networkConfig?.name || decoded.n,
      description: decoded.d || "",
      asset: networkConfig?.usdcAddress,
      createdAt: decoded.t,
    });
  } catch (error) {
    res.status(400).json({ error: "Invalid payment link" });
  }
});

app.post("/api/payment-link/execute", async (req: Request, res: Response) => {
  try {
    const { linkId, paymentHeader } = req.body;

    if (!linkId || !paymentHeader) {
      res.status(400).json({ error: "Link ID and payment header required" });
      return;
    }

    const linkData = JSON.parse(Buffer.from(linkId, "base64url").toString("utf-8"));
    const payment = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf-8"));
    const result = await verifyAndSettle(payment, linkData.a, linkData.r);

    if (result.success) {
      res.json({
        success: true,
        transaction: result.transaction,
        network: result.network,
        message: `Successfully paid ${(parseInt(linkData.a) / 1000000).toFixed(2)} USDC to ${linkData.r}`,
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: "Payment execution failed" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Main AI Endpoint (Payment Required)
// ─────────────────────────────────────────────────────────────────────────────

app.post("/process", async (req: Request, res: Response) => {
  const paymentHeader = req.headers["x-payment"] as string;
  
  if (!paymentHeader) {
    const requirements = createPaymentRequirements(
      "/process",
      "Push AI - Blockchain Intelligence",
      PRICE,
      PAY_TO,
      NETWORK
    );
    
    res.status(402).json({
      status: "payment_required",
      message: "Payment required to access this endpoint",
      paymentInfo: requirements,
    });
    return;
  }

  try {
    const payment: PaymentPayload = JSON.parse(
      Buffer.from(paymentHeader, "base64").toString()
    );
    
    const settlement = await verifyAndSettle(payment, PRICE, PAY_TO);
    
    if (!settlement.success) {
      res.status(402).json({
        status: "payment_failed",
        error: settlement.error || "Payment verification failed",
      });
      return;
    }

    const { message, tools = true } = req.body;
    
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const result = await processMessage(message, [], tools);
    
    res.json({
      status: "completed",
      response: result,
      payment: {
        settled: true,
        transaction: settlement.transaction,
      },
    });
  } catch (error) {
    console.error("Process error:", error);
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Processing failed",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Endpoint (Free)
// ─────────────────────────────────────────────────────────────────────────────

app.post("/test", async (req: Request, res: Response) => {
  try {
    const { message, tools = true } = req.body;
    
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const result = await processMessage(message, [], tools);
    
    res.json({
      status: "completed",
      response: result,
    });
  } catch (error) {
    console.error("Test error:", error);
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Processing failed",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Blockchain API Endpoints (Free)
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/networks", (_req: Request, res: Response) => {
  res.json(SUPPORTED_NETWORKS);
});

app.get("/api/gas/:network", async (req: Request, res: Response) => {
  try {
    const result = await blockchain.getGasPrice(req.params.network);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/price/:network/:token", async (req: Request, res: Response) => {
  try {
    const result = await blockchain.getTokenPrice(req.params.network, req.params.token);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/balance/:network/:address", async (req: Request, res: Response) => {
  try {
    const result = await blockchain.getWalletBalance(req.params.network, req.params.address);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/token/:network/:address", async (req: Request, res: Response) => {
  try {
    const result = await blockchain.getTokenInfo(req.params.network, req.params.address);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/tx/:network/:hash", async (req: Request, res: Response) => {
  try {
    const result = await blockchain.getTransactionStatus(req.params.network, req.params.hash);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/contract/:network/:address", async (req: Request, res: Response) => {
  try {
    const result = await blockchain.analyzeContract(req.params.network, req.params.address);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/nft/:network/:contract/:tokenId", async (req: Request, res: Response) => {
  try {
    const result = await blockchain.getNFTMetadata(
      req.params.network,
      req.params.contract,
      req.params.tokenId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/market", async (_req: Request, res: Response) => {
  try {
    const result = await blockchain.getMarketOverview();
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/fear-greed", async (_req: Request, res: Response) => {
  try {
    const result = await blockchain.getFearGreedIndex();
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/protocols", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await blockchain.getTopProtocols(limit);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/yields/:network", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await blockchain.getYieldFarms(req.params.network, limit);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/ens/:name", async (req: Request, res: Response) => {
  try {
    const result = await blockchain.resolveENS(req.params.name);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/tvl/:network", async (req: Request, res: Response) => {
  try {
    const result = await blockchain.getChainTVL(req.params.network);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/api/stablecoins", async (_req: Request, res: Response) => {
  try {
    const result = await blockchain.getStablecoinInfo();
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Catch-all for SPA
// ─────────────────────────────────────────────────────────────────────────────

app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket Server
// ─────────────────────────────────────────────────────────────────────────────

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws: WebSocket) => {
  console.log("WebSocket client connected");

  ws.on("message", async (data: Buffer) => {
    try {
      const { message, tools = true } = JSON.parse(data.toString());
      
      if (!message) {
        ws.send(JSON.stringify({ type: "error", error: "Message required" }));
        return;
      }

      for await (const chunk of streamMessage(message, [], tools)) {
        ws.send(JSON.stringify(chunk));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: "error", error: String(error) }));
    }
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     ██████╗ ██╗   ██╗███████╗██╗  ██╗                                        ║
║     ██╔══██╗██║   ██║██╔════╝██║  ██║                                        ║
║     ██████╔╝██║   ██║███████╗███████║                                        ║
║     ██╔═══╝ ██║   ██║╚════██║██╔══██║                                        ║
║     ██║     ╚██████╔╝███████║██║  ██║                                        ║
║     ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝                                        ║
║                                                                               ║
║     Blockchain AI Service v2.0                                               ║
║     ─────────────────────────────────────────────────────────────────────    ║
║     Port: ${PORT}                                                              ║
║     Tools: ${getToolCount()}                                                             ║
║     Networks: ${Object.keys(SUPPORTED_NETWORKS).length}                                                           ║
║     Payment: $${(parseInt(PRICE) / 1000000).toFixed(2)} USDC                                                      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);
});

export default app;
