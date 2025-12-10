// ═══════════════════════════════════════════════════════════════════════════════
// PUSH - Claude AI Service
// 30+ Blockchain Tools Integration
// ═══════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { Tool, Message, ToolUse, ToolResult } from "./types.js";
import * as blockchain from "./blockchainTools.js";

// ─────────────────────────────────────────────────────────────────────────────
// Initialize Anthropic Client
// ─────────────────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
const MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS || "4096");

// ─────────────────────────────────────────────────────────────────────────────
// System Prompt
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Push, an advanced AI assistant specialized in blockchain and cryptocurrency operations.

You have access to 30+ powerful tools for interacting with 7 EVM networks: Base, Ethereum, Polygon, Arbitrum, Optimism, Avalanche, and BNB Chain.

Your capabilities include:
• Real-time token prices and market data
• Wallet balances and transaction history
• NFT metadata and collections
• DeFi protocol analytics and yields
• Smart contract analysis
• ENS resolution
• Gas estimation
• Market sentiment

When users ask about blockchain data:
1. Use the appropriate tool to fetch real-time data
2. Present information clearly and concisely
3. Include relevant context (network, addresses, values)
4. Format numbers appropriately (USD values, percentages)

Always be helpful, accurate, and efficient. If a tool fails, explain what happened and suggest alternatives.

Default to Base network unless specified otherwise.`;

// ─────────────────────────────────────────────────────────────────────────────
// Tool Definitions (30+ tools)
// ─────────────────────────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PRICE & MARKET TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "getTokenPrice",
    description: "Get current price of a token in USD. Supports all EVM networks.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network: base, ethereum, polygon, arbitrum, optimism, avalanche, bsc" },
        tokenAddress: { type: "string", description: "Token contract address or 'native' for native token" },
      },
      required: ["network", "tokenAddress"],
    },
  },
  {
    name: "getPriceHistory",
    description: "Get historical price data for a token over specified days.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        tokenAddress: { type: "string", description: "Token contract address" },
        days: { type: "number", description: "Number of days of history (default: 7)" },
      },
      required: ["network", "tokenAddress"],
    },
  },
  {
    name: "getMultipleTokenPrices",
    description: "Get prices for multiple tokens at once.",
    input_schema: {
      type: "object",
      properties: {
        tokens: {
          type: "array",
          items: {
            type: "object",
            properties: {
              network: { type: "string" },
              address: { type: "string" },
            },
          },
          description: "Array of {network, address} objects",
        },
      },
      required: ["tokens"],
    },
  },
  {
    name: "getMarketOverview",
    description: "Get overall crypto market data including fear/greed index, market cap, and volume.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "getFearGreedIndex",
    description: "Get the current Fear & Greed Index for crypto markets.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAS TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "getGasPrice",
    description: "Get current gas prices (standard, fast, instant) for a network.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
      },
      required: ["network"],
    },
  },
  {
    name: "estimateGas",
    description: "Estimate gas for a transaction.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        to: { type: "string", description: "Destination address" },
        data: { type: "string", description: "Transaction data (optional)" },
        value: { type: "string", description: "ETH value to send (optional)" },
      },
      required: ["network", "to"],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WALLET TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "getWalletBalance",
    description: "Get native token balance and USD value for a wallet. Supports ENS names.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        address: { type: "string", description: "Wallet address or ENS name" },
      },
      required: ["network", "address"],
    },
  },
  {
    name: "getWalletTokens",
    description: "Get all ERC20 tokens held by a wallet.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        address: { type: "string", description: "Wallet address" },
      },
      required: ["network", "address"],
    },
  },
  {
    name: "getWalletHistory",
    description: "Get recent transaction history for a wallet.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        address: { type: "string", description: "Wallet address" },
        limit: { type: "number", description: "Number of transactions (default: 10)" },
      },
      required: ["network", "address"],
    },
  },
  {
    name: "analyzeWallet",
    description: "Get comprehensive analysis of a wallet including activity, holdings, and labels.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        address: { type: "string", description: "Wallet address" },
      },
      required: ["network", "address"],
    },
  },
  {
    name: "getWalletNFTs",
    description: "Get all NFTs owned by a wallet.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        address: { type: "string", description: "Wallet address" },
      },
      required: ["network", "address"],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOKEN TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "getTokenInfo",
    description: "Get detailed information about a token (name, symbol, decimals, supply).",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        tokenAddress: { type: "string", description: "Token contract address" },
      },
      required: ["network", "tokenAddress"],
    },
  },
  {
    name: "searchTokens",
    description: "Search for tokens by name, symbol, or address.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        network: { type: "string", description: "Optional: filter by network" },
      },
      required: ["query"],
    },
  },
  {
    name: "getTokenHolders",
    description: "Get top holders of a token.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        tokenAddress: { type: "string", description: "Token contract address" },
      },
      required: ["network", "tokenAddress"],
    },
  },
  {
    name: "getTokenAllowance",
    description: "Check token approval/allowance for a spender.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        tokenAddress: { type: "string", description: "Token contract address" },
        owner: { type: "string", description: "Token owner address" },
        spender: { type: "string", description: "Spender contract address" },
      },
      required: ["network", "tokenAddress", "owner", "spender"],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NFT TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "getNFTMetadata",
    description: "Get metadata for a specific NFT (name, image, attributes, owner).",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        contractAddress: { type: "string", description: "NFT contract address" },
        tokenId: { type: "string", description: "NFT token ID" },
      },
      required: ["network", "contractAddress", "tokenId"],
    },
  },
  {
    name: "getNFTCollection",
    description: "Get information about an NFT collection.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        contractAddress: { type: "string", description: "NFT contract address" },
      },
      required: ["network", "contractAddress"],
    },
  },
  {
    name: "checkNFTOwnership",
    description: "Check if a wallet owns a specific NFT.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        contractAddress: { type: "string", description: "NFT contract address" },
        tokenId: { type: "string", description: "NFT token ID" },
        walletAddress: { type: "string", description: "Wallet to check" },
      },
      required: ["network", "contractAddress", "tokenId", "walletAddress"],
    },
  },
  {
    name: "getNFTFloorPrice",
    description: "Get floor price for an NFT collection.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        contractAddress: { type: "string", description: "NFT contract address" },
      },
      required: ["network", "contractAddress"],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFI TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "estimateSwap",
    description: "Get estimated output for a token swap.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        tokenIn: { type: "string", description: "Input token address" },
        tokenOut: { type: "string", description: "Output token address" },
        amountIn: { type: "string", description: "Input amount" },
      },
      required: ["network", "tokenIn", "tokenOut", "amountIn"],
    },
  },
  {
    name: "getDeFiPositions",
    description: "Get DeFi positions for a wallet across protocols.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        address: { type: "string", description: "Wallet address" },
      },
      required: ["network", "address"],
    },
  },
  {
    name: "getProtocolTVL",
    description: "Get Total Value Locked (TVL) for a DeFi protocol.",
    input_schema: {
      type: "object",
      properties: {
        protocol: { type: "string", description: "Protocol name (e.g., aave, uniswap, compound)" },
      },
      required: ["protocol"],
    },
  },
  {
    name: "getTopProtocols",
    description: "Get top DeFi protocols by TVL.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of protocols (default: 10)" },
      },
    },
  },
  {
    name: "getYieldFarms",
    description: "Get top yield farming opportunities on a network.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        limit: { type: "number", description: "Number of results (default: 10)" },
      },
      required: ["network"],
    },
  },
  {
    name: "getChainTVL",
    description: "Get total TVL for a blockchain network.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
      },
      required: ["network"],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSACTION TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "getTransactionStatus",
    description: "Get status and details of a transaction by hash.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        txHash: { type: "string", description: "Transaction hash" },
      },
      required: ["network", "txHash"],
    },
  },
  {
    name: "decodeTransaction",
    description: "Decode transaction data and logs.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        txHash: { type: "string", description: "Transaction hash" },
      },
      required: ["network", "txHash"],
    },
  },
  {
    name: "simulateTransaction",
    description: "Simulate a transaction without executing it.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        to: { type: "string", description: "Target address" },
        data: { type: "string", description: "Call data" },
        value: { type: "string", description: "ETH value (optional)" },
        from: { type: "string", description: "Sender address (optional)" },
      },
      required: ["network", "to", "data"],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRACT TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "analyzeContract",
    description: "Analyze a smart contract (type, bytecode, verification status).",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        address: { type: "string", description: "Contract address" },
      },
      required: ["network", "address"],
    },
  },
  {
    name: "verifyContractSecurity",
    description: "Run basic security checks on a contract.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network name" },
        address: { type: "string", description: "Contract address" },
      },
      required: ["network", "address"],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENS TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "resolveENS",
    description: "Resolve an ENS name to an Ethereum address.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "ENS name (e.g., vitalik.eth)" },
      },
      required: ["name"],
    },
  },
  {
    name: "reverseResolveENS",
    description: "Get ENS name for an Ethereum address.",
    input_schema: {
      type: "object",
      properties: {
        address: { type: "string", description: "Ethereum address" },
      },
      required: ["address"],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKET & SENTIMENT TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "getTrendingTokens",
    description: "Get currently trending tokens.",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Optional: filter by network" },
      },
    },
  },
  {
    name: "getTokenSentiment",
    description: "Get social sentiment analysis for a token.",
    input_schema: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token symbol or address" },
      },
      required: ["token"],
    },
  },
  {
    name: "getStablecoinInfo",
    description: "Get information about top stablecoins (market cap, peg status).",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tool Executor
// ─────────────────────────────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    let result: unknown;

    switch (name) {
      // Price & Market
      case "getTokenPrice":
        result = await blockchain.getTokenPrice(input.network as string, input.tokenAddress as string);
        break;
      case "getPriceHistory":
        result = await blockchain.getPriceHistory(input.network as string, input.tokenAddress as string, input.days as number);
        break;
      case "getMultipleTokenPrices":
        result = await blockchain.getMultipleTokenPrices(input.tokens as Array<{ network: string; address: string }>);
        break;
      case "getMarketOverview":
        result = await blockchain.getMarketOverview();
        break;
      case "getFearGreedIndex":
        result = await blockchain.getFearGreedIndex();
        break;

      // Gas
      case "getGasPrice":
        result = await blockchain.getGasPrice(input.network as string);
        break;
      case "estimateGas":
        result = await blockchain.estimateGas(input.network as string, input.to as string, input.data as string, input.value as string);
        break;

      // Wallet
      case "getWalletBalance":
        result = await blockchain.getWalletBalance(input.network as string, input.address as string);
        break;
      case "getWalletTokens":
        result = await blockchain.getWalletTokens(input.network as string, input.address as string);
        break;
      case "getWalletHistory":
        result = await blockchain.getWalletHistory(input.network as string, input.address as string, input.limit as number);
        break;
      case "analyzeWallet":
        result = await blockchain.analyzeWallet(input.network as string, input.address as string);
        break;
      case "getWalletNFTs":
        result = await blockchain.getWalletNFTs(input.network as string, input.address as string);
        break;

      // Token
      case "getTokenInfo":
        result = await blockchain.getTokenInfo(input.network as string, input.tokenAddress as string);
        break;
      case "searchTokens":
        result = await blockchain.searchTokens(input.query as string, input.network as string);
        break;
      case "getTokenHolders":
        result = await blockchain.getTokenHolders(input.network as string, input.tokenAddress as string);
        break;
      case "getTokenAllowance":
        result = await blockchain.getTokenAllowance(input.network as string, input.tokenAddress as string, input.owner as string, input.spender as string);
        break;

      // NFT
      case "getNFTMetadata":
        result = await blockchain.getNFTMetadata(input.network as string, input.contractAddress as string, input.tokenId as string);
        break;
      case "getNFTCollection":
        result = await blockchain.getNFTCollection(input.network as string, input.contractAddress as string);
        break;
      case "checkNFTOwnership":
        result = await blockchain.checkNFTOwnership(input.network as string, input.contractAddress as string, input.tokenId as string, input.walletAddress as string);
        break;
      case "getNFTFloorPrice":
        result = await blockchain.getNFTFloorPrice(input.network as string, input.contractAddress as string);
        break;

      // DeFi
      case "estimateSwap":
        result = await blockchain.estimateSwap(input.network as string, input.tokenIn as string, input.tokenOut as string, input.amountIn as string);
        break;
      case "getDeFiPositions":
        result = await blockchain.getDeFiPositions(input.network as string, input.address as string);
        break;
      case "getProtocolTVL":
        result = await blockchain.getProtocolTVL(input.protocol as string);
        break;
      case "getTopProtocols":
        result = await blockchain.getTopProtocols(input.limit as number);
        break;
      case "getYieldFarms":
        result = await blockchain.getYieldFarms(input.network as string, input.limit as number);
        break;
      case "getChainTVL":
        result = await blockchain.getChainTVL(input.network as string);
        break;

      // Transaction
      case "getTransactionStatus":
        result = await blockchain.getTransactionStatus(input.network as string, input.txHash as string);
        break;
      case "decodeTransaction":
        result = await blockchain.decodeTransaction(input.network as string, input.txHash as string);
        break;
      case "simulateTransaction":
        result = await blockchain.simulateTransaction(input.network as string, input.to as string, input.data as string, input.value as string, input.from as string);
        break;

      // Contract
      case "analyzeContract":
        result = await blockchain.analyzeContract(input.network as string, input.address as string);
        break;
      case "verifyContractSecurity":
        result = await blockchain.verifyContractSecurity(input.network as string, input.address as string);
        break;

      // ENS
      case "resolveENS":
        result = await blockchain.resolveENS(input.name as string);
        break;
      case "reverseResolveENS":
        result = await blockchain.reverseResolveENS(input.address as string);
        break;

      // Market & Sentiment
      case "getTrendingTokens":
        result = await blockchain.getTrendingTokens(input.network as string);
        break;
      case "getTokenSentiment":
        result = await blockchain.getTokenSentiment(input.token as string);
        break;
      case "getStablecoinInfo":
        result = await blockchain.getStablecoinInfo();
        break;

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return JSON.stringify({ error: `Tool execution failed: ${error}` });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Process Message (Non-streaming)
// ─────────────────────────────────────────────────────────────────────────────

export async function processMessage(
  userMessage: string,
  conversationHistory: Message[] = [],
  useTools: boolean = true
): Promise<{ text: string; toolsUsed: string[]; tokensUsed: number }> {
  const messages = [
    ...conversationHistory,
    { role: "user" as const, content: userMessage },
  ];

  const toolsUsed: string[] = [];
  let totalTokens = 0;

  let response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    tools: useTools ? TOOLS : undefined,
    messages: messages as any,
  });

  totalTokens += (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  // Handle tool use loop
  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (block): block is ToolUse => block.type === "tool_use"
    );

    const toolResults: ToolResult[] = [];
    for (const toolUse of toolUseBlocks) {
      toolsUsed.push(toolUse.name);
      const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>);
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    // Continue conversation with tool results
    messages.push({ role: "assistant", content: response.content as Message["content"] });
    messages.push({ role: "user", content: toolResults as unknown as Message["content"] });

    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: messages as any,
    });

    totalTokens += (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
  }

  // Extract text response
  const textBlocks = response.content.filter(
    (block) => block.type === "text"
  );
  const text = textBlocks.map((b) => "text" in b ? b.text : "").join("\n");

  return { text, toolsUsed: [...new Set(toolsUsed)], tokensUsed: totalTokens };
}

// ─────────────────────────────────────────────────────────────────────────────
// Streaming Message
// ─────────────────────────────────────────────────────────────────────────────

export async function* streamMessage(
  userMessage: string,
  conversationHistory: Message[] = [],
  useTools: boolean = true
): AsyncGenerator<{ type: string; content?: string; tool?: string; done?: boolean }> {
  const messages = [
    ...conversationHistory,
    { role: "user" as const, content: userMessage },
  ];

  const stream = await anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    tools: useTools ? TOOLS : undefined,
    messages: messages as any,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta") {
      const delta = event.delta;
      if ("text" in delta) {
        yield { type: "text", content: delta.text };
      }
    } else if (event.type === "content_block_start") {
      if (event.content_block.type === "tool_use") {
        yield { type: "tool_start", tool: event.content_block.name };
      }
    } else if (event.type === "message_stop") {
      yield { type: "done", done: true };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Tools List
// ─────────────────────────────────────────────────────────────────────────────

export function getAvailableTools(): string[] {
  return TOOLS.map((t) => t.name);
}

export function getToolCount(): number {
  return TOOLS.length;
}
