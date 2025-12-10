// ═══════════════════════════════════════════════════════════════════════════════
// PUSH - Comprehensive Type Definitions
// 30+ Blockchain Tools | 7 Networks | x402 Payments
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// x402 Payment Protocol Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentRequirements {
  x402Version: number;
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: {
    name?: string;
    facilitatorUrl?: string;
  };
}

export interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    signature: string;
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

export interface SettlementResponse {
  success: boolean;
  transaction?: string;
  network?: string;
  error?: string;
  blockNumber?: number;
  gasUsed?: string;
  note?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Claude AI Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolUse {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string | Array<{ type: string; text?: string; tool_use_id?: string; content?: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Blockchain Types
// ─────────────────────────────────────────────────────────────────────────────

export interface NetworkConfig {
  name: string;
  shortName: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  usdcAddress: string;
  wethAddress?: string;
  multicallAddress?: string;
  coingeckoId: string;
  defiLlamaId: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
  logoUrl?: string;
}

export interface TokenPrice {
  token: string;
  network: string;
  priceUsd: number;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
  timestamp: number;
}

export interface WalletBalance {
  address: string;
  network: string;
  nativeBalance: string;
  nativeSymbol: string;
  nativeValueUsd?: number;
  tokens: Array<{
    address: string;
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    valueUsd?: number;
  }>;
}

export interface GasPrice {
  network: string;
  standard: string;
  fast: string;
  instant: string;
  baseFee?: string;
  timestamp: number;
}

export interface Transaction {
  hash: string;
  network: string;
  from: string;
  to: string;
  value: string;
  gasUsed?: string;
  gasPrice?: string;
  status: "pending" | "success" | "failed";
  blockNumber?: number;
  timestamp?: number;
  method?: string;
}

export interface ContractInfo {
  address: string;
  network: string;
  name?: string;
  isContract: boolean;
  isVerified?: boolean;
  contractType?: string;
  createdAt?: number;
  creator?: string;
  bytecodeHash?: string;
}

export interface NFTMetadata {
  contract: string;
  tokenId: string;
  network: string;
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  owner?: string;
  collection?: {
    name: string;
    symbol?: string;
    totalSupply?: number;
  };
}

export interface NFTCollection {
  address: string;
  network: string;
  name: string;
  symbol: string;
  totalSupply?: number;
  floorPrice?: number;
  volume24h?: number;
  holders?: number;
  verified?: boolean;
}

export interface DeFiPosition {
  protocol: string;
  network: string;
  type: string;
  tokens: Array<{
    symbol: string;
    amount: string;
    valueUsd?: number;
  }>;
  totalValueUsd?: number;
  apy?: number;
}

export interface LiquidityPool {
  address: string;
  network: string;
  dex: string;
  token0: TokenInfo;
  token1: TokenInfo;
  reserve0: string;
  reserve1: string;
  totalValueLocked?: number;
  volume24h?: number;
  fee?: number;
  apy?: number;
}

export interface SwapQuote {
  network: string;
  dex: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact?: number;
  route?: string[];
  gasEstimate?: string;
}

export interface TokenHolder {
  address: string;
  balance: string;
  percentage: number;
  isContract?: boolean;
  label?: string;
}

export interface WhaleTransaction {
  hash: string;
  network: string;
  token: string;
  from: string;
  to: string;
  amount: string;
  valueUsd: number;
  timestamp: number;
  type: "buy" | "sell" | "transfer";
}

export interface TrendingToken {
  address: string;
  network: string;
  name: string;
  symbol: string;
  priceUsd: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  rank: number;
  trending_score?: number;
}

export interface TokenSentiment {
  token: string;
  network: string;
  sentiment: "bullish" | "bearish" | "neutral";
  score: number;
  mentions24h?: number;
  socialVolume?: number;
  sources: Array<{
    platform: string;
    sentiment: string;
    mentions: number;
  }>;
}

export interface MarketOverview {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
  topGainers: TrendingToken[];
  topLosers: TrendingToken[];
  trending: TrendingToken[];
}

export interface ENSData {
  name?: string;
  address?: string;
  avatar?: string;
  contentHash?: string;
  records?: Record<string, string>;
}

export interface WalletAnalysis {
  address: string;
  network: string;
  firstTxDate?: number;
  txCount: number;
  uniqueTokens: number;
  totalValueUsd: number;
  nftCount?: number;
  defiPositions?: number;
  labels?: string[];
  riskScore?: number;
}

export interface ProtocolTVL {
  protocol: string;
  network: string;
  tvl: number;
  change24h: number;
  change7d: number;
  category: string;
  chains: string[];
}

export interface YieldFarm {
  protocol: string;
  network: string;
  pool: string;
  tokens: string[];
  tvl: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  rewardTokens?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Supported Networks Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  base: {
    name: "Base",
    shortName: "BASE",
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    wethAddress: "0x4200000000000000000000000000000000000006",
    coingeckoId: "base",
    defiLlamaId: "base",
  },
  ethereum: {
    name: "Ethereum",
    shortName: "ETH",
    chainId: 1,
    rpcUrl: process.env.ETH_RPC_URL || "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    wethAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    coingeckoId: "ethereum",
    defiLlamaId: "ethereum",
  },
  polygon: {
    name: "Polygon",
    shortName: "MATIC",
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    wethAddress: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    coingeckoId: "polygon-pos",
    defiLlamaId: "polygon",
  },
  arbitrum: {
    name: "Arbitrum One",
    shortName: "ARB",
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    wethAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    coingeckoId: "arbitrum-one",
    defiLlamaId: "arbitrum",
  },
  optimism: {
    name: "Optimism",
    shortName: "OP",
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    usdcAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    wethAddress: "0x4200000000000000000000000000000000000006",
    coingeckoId: "optimistic-ethereum",
    defiLlamaId: "optimism",
  },
  avalanche: {
    name: "Avalanche",
    shortName: "AVAX",
    chainId: 43114,
    rpcUrl: process.env.AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc",
    explorerUrl: "https://snowtrace.io",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    wethAddress: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
    coingeckoId: "avalanche",
    defiLlamaId: "avax",
  },
  bsc: {
    name: "BNB Chain",
    shortName: "BSC",
    chainId: 56,
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    usdcAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    wethAddress: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    coingeckoId: "binance-smart-chain",
    defiLlamaId: "bsc",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tool Categories
// ─────────────────────────────────────────────────────────────────────────────

export const TOOL_CATEGORIES = {
  PRICE_DATA: ["getTokenPrice", "getPriceHistory", "getMultipleTokenPrices"],
  MARKET_DATA: ["getMarketOverview", "getTrendingTokens", "getTopGainers", "getTopLosers", "getFearGreedIndex"],
  WALLET: ["getWalletBalance", "getWalletHistory", "getWalletTokens", "getWalletNFTs", "analyzeWallet"],
  TOKENS: ["getTokenInfo", "searchTokens", "getTokenHolders", "getTokenMetadata"],
  NFT: ["getNFTMetadata", "getNFTCollection", "getNFTFloorPrice", "checkNFTOwnership"],
  DEFI: ["getDeFiPositions", "getLiquidityPools", "getYieldFarms", "getProtocolTVL", "estimateSwap"],
  TRANSACTIONS: ["getTransactionStatus", "getWhaleTransactions", "decodeTransaction", "simulateTransaction"],
  CONTRACTS: ["analyzeContract", "getContractABI", "verifyContractSecurity"],
  GAS: ["getGasPrice", "estimateGas"],
  ENS: ["resolveENS", "reverseResolveENS"],
  SENTIMENT: ["getTokenSentiment", "getSocialMentions"],
};

// ─────────────────────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────────────────────

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface ChatRequest {
  message: string;
  tools?: boolean;
  stream?: boolean;
}

export interface ChatResponse {
  status: "completed" | "error" | "payment_required";
  response?: {
    text: string;
    toolsUsed?: string[];
    tokensUsed?: number;
  };
  error?: string;
  paymentInfo?: PaymentRequirements;
}
