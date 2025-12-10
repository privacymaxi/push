<div align="center">

# 🚀 PUSH

**AI-Powered Blockchain Intelligence with x402 Payments**

[![x402 Hackathon](https://img.shields.io/badge/x402-Hackathon_2025-00D084?style=for-the-badge)](https://www.x402hackathon.com/)
[![Twitter](https://img.shields.io/badge/Twitter-@privacy__maxi-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://x.com/privacy_maxi)

```
██████╗ ██╗   ██╗███████╗██╗  ██╗
██╔══██╗██║   ██║██╔════╝██║  ██║
██████╔╝██║   ██║███████╗███████║
██╔═══╝ ██║   ██║╚════██║██╔══██║
██║     ╚██████╔╝███████║██║  ██║
╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝
```

**30+ Tools • 7 Networks • Pay-Per-Request**

[Demo](#demo) • [Features](#features) • [Quick Start](#-quick-start) • [API Guide](EXAMPLES.md) • [Deploy](#-deploy-to-render)

</div>

---

## 🎯 What is PUSH?

PUSH is an AI-powered blockchain intelligence service where users query real-time data across **7 EVM networks** using natural language. Powered by **Claude AI** with **30+ specialized tools**, users pay **$0.10 USDC per request** using the **x402 payment protocol**.

### 💡 Key Innovation

- **Gasless payments for users** - Users only sign, merchant pays gas
- **Instant settlement** - USDC transfers on-chain via EIP-3009
- **Pay-per-use AI** - No subscriptions, pay only when you use it
- **Payment Links** - Create shareable links to receive payments

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Chat** | Natural language queries for blockchain data |
| 💰 **x402 Payments** | Pay $0.10 USDC per AI request |
| 🔗 **Payment Links** | Create & share payment request links |
| 📊 **30+ Tools** | Prices, wallets, DeFi, NFTs, gas, contracts |
| 🌐 **7 Networks** | Base, Ethereum, Polygon, Arbitrum, Optimism, Avalanche, BSC |
| ⛽ **Gasless UX** | Users sign, you pay the tiny gas fee |

---

## 💸 How Payments Work

```
┌──────────────────────────────────────────────────────────────┐
│                      PAYMENT FLOW                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   👤 USER                           💼 MERCHANT (You)        │
│                                                              │
│   1. Sends message                                           │
│   2. Signs EIP-3009 ─────────────►  3. Submits tx           │
│      (no gas!)                         (pays ~$0.001)        │
│                                                              │
│   4. $0.10 USDC ─────────────────►  Goes to your wallet     │
│                                                              │
│   5. Gets AI response ◄────────────  6. AI processes        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Economics per request:**
| Item | Amount |
|------|--------|
| User pays | $0.10 USDC |
| Gas cost (Base) | ~$0.001 |
| Claude API | ~$0.01 |
| **Your profit** | **~$0.09** |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- [Anthropic API Key](https://console.anthropic.com/)
- Two wallets:
  - `PAY_TO_ADDRESS` - Receives USDC payments
  - `MERCHANT_PRIVATE_KEY` - Submits transactions (needs ~$0.01 ETH for gas)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/push.git
cd push
npm run install:all
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env`:
```env
PAY_TO_ADDRESS=0xYourWalletAddress
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
MERCHANT_PRIVATE_KEY=0xYourMerchantPrivateKey
```

### Run Development

```bash
npm run dev:all
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

---

## 🌐 Deploy to Render

1. Push this repo to GitHub
2. Go to [Render](https://render.com) → New → Web Service
3. Connect your repository
4. Configure:

| Setting | Value |
|---------|-------|
| Build Command | `npm run install:all && npm run build:all` |
| Start Command | `npm start` |

5. Add Environment Variables:
   - `PAY_TO_ADDRESS`
   - `ANTHROPIC_API_KEY`
   - `MERCHANT_PRIVATE_KEY`

6. Deploy! 🚀

---

## 🔧 30+ AI Tools

See **[EXAMPLES.md](EXAMPLES.md)** for complete usage guide.

### Quick Examples

```
"What's the ETH price?"
"Analyze vitalik.eth"
"Top 10 DeFi protocols by TVL"
"Gas prices on Arbitrum"
"Show me Bored Ape #1234"
"Is contract 0x... safe?"
```

### Categories

| Category | Tools |
|----------|-------|
| **Prices** | Token prices, history, market overview, Fear & Greed |
| **Wallets** | Balance, tokens, NFTs, history, whale analysis |
| **DeFi** | Protocol TVL, yields, positions, swap estimates |
| **NFTs** | Metadata, collections, floor prices, ownership |
| **Gas** | Real-time prices, estimates across networks |
| **Contracts** | Security analysis, verification status |
| **ENS** | Name resolution, reverse lookup |

---

## 🔗 Payment Links

Create shareable payment links:

1. Click **"PAY LINK"** in the header
2. Enter amount, recipient, description
3. Share the generated link
4. Anyone can pay via the link!

**Example link:**
```
https://your-app.com/pay/eyJ2IjoxLCJyIjoiMHguLi4ifQ
```

---

## 📁 Project Structure

```
push/
├── src/                      # Backend
│   ├── server.ts            # Express API + Payment endpoints
│   ├── claudeService.ts     # AI + 30 tools
│   ├── blockchainTools.ts   # Blockchain functions
│   ├── merchantExecutor.ts  # EIP-3009 settlement
│   └── types.ts             # TypeScript types
├── frontend/                 # React Frontend
│   └── src/
│       ├── App.tsx          # Main app + Payment pages
│       ├── hooks/           # React hooks
│       ├── store.ts         # Zustand state
│       └── styles/          # CSS
├── EXAMPLES.md              # AI command guide
├── .env.example             # Environment template
└── render.yaml              # Render deployment
```

---

## 🔐 Security

- ⚠️ **NEVER** commit `.env` to git
- Use a **dedicated merchant wallet** with minimal ETH
- USDC goes directly to `PAY_TO_ADDRESS`
- Nonce replay attack prevention built-in

---

## 🛠️ Tech Stack

**Frontend:** React 18, TypeScript, Vite, Zustand, Tailwind CSS

**Backend:** Node.js, Express, TypeScript, ethers.js v6

**AI:** Anthropic Claude Sonnet

**Payments:** x402 Protocol, EIP-3009, USDC

---

## 📜 License

MIT

---

<div align="center">

**Built with ❤️ for [x402 Hackathon](https://www.x402hackathon.com/)**

December 2025 - January 2026

[🐦 @privacy_maxi](https://x.com/privacy_maxi)

</div>
