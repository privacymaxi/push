<div align="center">

# PUSH

```
██████╗ ██╗   ██╗███████╗██╗  ██╗
██╔══██╗██║   ██║██╔════╝██║  ██║
██████╔╝██║   ██║███████╗███████║
██╔═══╝ ██║   ██║╚════██║██╔══██║
██║     ╚██████╔╝███████║██║  ██║
╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝
```

**AI-Powered Blockchain Intelligence**

*30+ Tools • 7 Networks • x402 Payments*

[![x402 Hackathon](https://img.shields.io/badge/x402-Hackathon-brightgreen)](https://www.x402hackathon.com/)
[![Twitter](https://img.shields.io/badge/Twitter-@privacy__maxi-blue)](https://x.com/privacy_maxi)

</div>

---

## 🎯 What is PUSH?

PUSH is an AI-powered blockchain intelligence service that lets users query real-time data across **7 EVM networks** using natural language. Powered by **Claude AI** with **30+ specialized blockchain tools**, users pay per request using the **x402 payment protocol** with USDC.

### Built for [x402 Hackathon](https://www.x402hackathon.com/)
*December 8, 2025 - January 5, 2026*

---

## 💰 How Payments Work

```
┌─────────────┐      $0.10 USDC      ┌─────────────┐
│    USER     │  ──────────────────► │     YOU     │
│  (Customer) │                      │  (Merchant) │
│             │      EIP-3009        │             │
│  Signs tx   │  transferWithAuth    │ Receives $  │
└─────────────┘                      └─────────────┘
```

1. User connects their wallet (MetaMask)
2. User sends a message to the AI
3. Server returns HTTP 402 "Payment Required"
4. User signs EIP-3009 authorization (**gasless for user!**)
5. Merchant wallet submits the transaction
6. USDC transfers from user → merchant
7. AI processes the request and responds

**Users pay $0.10 USDC per request. You receive it instantly.**

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Anthropic API Key ([get one here](https://console.anthropic.com/settings/keys))
- Two EVM Wallets:
  - **PAY_TO_ADDRESS** - Where you receive USDC payments
  - **MERCHANT_PRIVATE_KEY** - Submits transactions (needs ~$0.01 ETH for gas)

### Installation

```bash
git clone https://github.com/yourusername/push.git
cd push
npm run install:all
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Where you receive USDC payments
PAY_TO_ADDRESS=0xYourWalletAddress

# Claude API key
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Wallet that submits transactions (needs ETH for gas)
MERCHANT_PRIVATE_KEY=0xYourPrivateKey
```

### Run Development

```bash
npm run dev:all
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

---

## 🚀 Deploy to Render

1. Push to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Connect your repository
4. Set environment variables:
   - `PAY_TO_ADDRESS`
   - `ANTHROPIC_API_KEY`
   - `MERCHANT_PRIVATE_KEY`
5. Deploy!

**Build Command:** `npm run install:all && npm run build:all`

**Start Command:** `npm start`

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PAY_TO_ADDRESS` | ✅ | Your wallet address to receive USDC |
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `MERCHANT_PRIVATE_KEY` | ⚠️ | Private key for submitting transactions |
| `DEFAULT_PRICE` | ❌ | Price per request (default: 100000 = $0.10) |
| `NETWORK` | ❌ | Payment network (default: base) |
| `PORT` | ❌ | Server port (default: 3000) |

⚠️ **Without `MERCHANT_PRIVATE_KEY`**, the app runs in **demo mode** (signatures verified but no real transfers).

---

## 🌐 Supported Networks

| Network | Chain ID | Native Token |
|---------|----------|--------------|
| Base | 8453 | ETH |
| Ethereum | 1 | ETH |
| Polygon | 137 | POL |
| Arbitrum | 42161 | ETH |
| Optimism | 10 | ETH |
| Avalanche | 43114 | AVAX |
| BNB Chain | 56 | BNB |

---

## 🔧 30+ Blockchain Tools

| Category | Tools |
|----------|-------|
| **Price & Market** | Token prices, market overview, Fear & Greed Index |
| **Wallet Analysis** | Balance, tokens, history, NFTs, whale detection |
| **DeFi** | Protocol TVL, yields, token swaps |
| **NFTs** | Metadata, collections, floor prices |
| **Transactions** | Status, decode, simulate |
| **Contracts** | Security analysis, verification |
| **Gas** | Real-time prices, estimates |
| **ENS** | Name resolution |

---

## 📡 API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /health` | No | Service status |
| `GET /merchant-status` | No | Check merchant wallet |
| `GET /payment-info` | No | x402 payment requirements |
| `POST /process` | x402 | AI chat (paid) |
| `POST /test` | No | AI chat (free, for testing) |
| `GET /api/*` | No | Free blockchain data APIs |

---

## 📊 Economics

| Item | Amount |
|------|--------|
| User pays per request | $0.10 USDC |
| Gas cost (Base) | ~$0.001 |
| Claude API cost | ~$0.01 |
| **Your profit per request** | **~$0.09** |

---

## 🔐 Security Notes

- ⚠️ **NEVER** commit `.env` to git
- Use a **dedicated merchant wallet**, not your main wallet
- Keep **minimal ETH** in merchant wallet (just for gas)
- USDC goes directly to `PAY_TO_ADDRESS`, not merchant wallet

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Zustand (state management)
- Tailwind CSS

**Backend:**
- Node.js + Express
- TypeScript
- Anthropic Claude API
- ethers.js v6

**Blockchain:**
- EIP-3009 (transferWithAuthorization)
- x402 Payment Protocol
- USDC on multiple networks

---

## 📁 Project Structure

```
push/
├── src/                    # Backend source
│   ├── server.ts          # Express server
│   ├── claudeService.ts   # AI integration
│   ├── blockchainTools.ts # 30+ tools
│   ├── merchantExecutor.ts # Payment settlement
│   └── types.ts           # TypeScript types
├── frontend/              # Frontend source
│   └── src/
│       ├── App.tsx        # Main component
│       ├── hooks/         # React hooks
│       ├── store.ts       # Zustand store
│       └── styles/        # CSS
├── .env.example           # Environment template
├── render.yaml            # Render deployment
└── package.json           # Dependencies
```

---

## 📄 License

MIT

---

<div align="center">

**Built with ❤️ for the [x402 Hackathon](https://www.x402hackathon.com/)**

[Twitter](https://x.com/privacy_maxi)

</div>
