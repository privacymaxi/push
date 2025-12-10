// ═══════════════════════════════════════════════════════════════════════════════
// PUSH - API Utilities & Wallet Connection
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = '/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatResponse {
  status: 'completed' | 'error' | 'payment_required' | 'payment_failed';
  response?: {
    text: string;
    toolsUsed?: string[];
    tokensUsed?: number;
  };
  error?: string;
  paymentInfo?: PaymentRequirements;
}

export interface PaymentRequirements {
  x402Version: number;
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  asset: string;
  extra?: {
    facilitatorUrl?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchHealth() {
  const res = await fetch('/health');
  return res.json();
}

export async function fetchNetworks() {
  const res = await fetch(`${API_BASE}/networks`);
  return res.json();
}

export async function fetchGasPrice(network: string) {
  const res = await fetch(`${API_BASE}/gas/${network}`);
  return res.json();
}

export async function fetchMarketOverview() {
  const res = await fetch(`${API_BASE}/market`);
  return res.json();
}

export async function fetchFearGreed() {
  const res = await fetch(`${API_BASE}/fear-greed`);
  return res.json();
}

export async function fetchTopProtocols(limit = 10) {
  const res = await fetch(`${API_BASE}/protocols?limit=${limit}`);
  return res.json();
}

export async function sendMessage(text: string, tools = true): Promise<ChatResponse> {
  const res = await fetch('/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, tools }),
  });
  return res.json();
}

export async function sendPaidMessage(
  text: string,
  paymentHeader: string,
  tools = true
): Promise<ChatResponse> {
  const res = await fetch('/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Payment': paymentHeader,
    },
    body: JSON.stringify({ message: text, tools }),
  });
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Wallet Connection (MetaMask / EIP-1193)
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export async function connectWallet(): Promise<{ address: string; chainId: number }> {
  if (!window.ethereum) {
    throw new Error('No wallet found. Please install MetaMask.');
  }

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  }) as string[];

  const chainIdHex = await window.ethereum.request({
    method: 'eth_chainId',
  }) as string;

  return {
    address: accounts[0],
    chainId: parseInt(chainIdHex, 16),
  };
}

export async function switchNetwork(chainId: number): Promise<void> {
  if (!window.ethereum) throw new Error('No wallet found');

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: unknown) {
    // Chain not added, try to add it
    if ((error as { code?: number })?.code === 4902) {
      throw new Error('Please add this network to your wallet');
    }
    throw error;
  }
}

export function onAccountsChanged(callback: (accounts: string[]) => void): () => void {
  if (!window.ethereum) return () => {};
  
  const handler = (accounts: unknown) => callback(accounts as string[]);
  window.ethereum.on('accountsChanged', handler);
  return () => window.ethereum?.removeListener('accountsChanged', handler);
}

export function onChainChanged(callback: (chainId: number) => void): () => void {
  if (!window.ethereum) return () => {};
  
  const handler = (chainIdHex: unknown) => callback(parseInt(chainIdHex as string, 16));
  window.ethereum.on('chainChanged', handler);
  return () => window.ethereum?.removeListener('chainChanged', handler);
}

// ─────────────────────────────────────────────────────────────────────────────
// x402 Payment Signing
// ─────────────────────────────────────────────────────────────────────────────

export async function signPayment(
  paymentInfo: PaymentRequirements | { network: string; maxAmountRequired: string; payTo: string; asset: string },
  senderAddress: string
): Promise<string> {
  if (!window.ethereum) throw new Error('No wallet found');

  // Determine the required chain ID based on network
  const networkChainIds: Record<string, number> = {
    base: 8453,
    ethereum: 1,
    polygon: 137,
    arbitrum: 42161,
    optimism: 10,
    avalanche: 43114,
    bsc: 56,
  };

  const requiredChainId = networkChainIds[paymentInfo.network] || 8453;

  // Check current chain
  const currentChainHex = await window.ethereum.request({
    method: 'eth_chainId',
  }) as string;
  const currentChainId = parseInt(currentChainHex, 16);

  // Switch network if needed
  if (currentChainId !== requiredChainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${requiredChainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Chain not added to wallet - try to add it
      if (switchError.code === 4902) {
        const chainConfigs: Record<number, any> = {
          8453: {
            chainId: '0x2105',
            chainName: 'Base',
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org'],
          },
          137: {
            chainId: '0x89',
            chainName: 'Polygon',
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpcUrls: ['https://polygon-rpc.com'],
            blockExplorerUrls: ['https://polygonscan.com'],
          },
          42161: {
            chainId: '0xa4b1',
            chainName: 'Arbitrum One',
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io'],
          },
          10: {
            chainId: '0xa',
            chainName: 'Optimism',
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.optimism.io'],
            blockExplorerUrls: ['https://optimistic.etherscan.io'],
          },
        };

        if (chainConfigs[requiredChainId]) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [chainConfigs[requiredChainId]],
          });
        } else {
          throw new Error(`Please switch to the ${paymentInfo.network} network in your wallet`);
        }
      } else {
        throw switchError;
      }
    }
  }

  // Generate nonce and timestamps
  const nonce = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const validAfter = '0';
  const validBefore = Math.floor(Date.now() / 1000 + 3600).toString(); // 1 hour

  // EIP-3009 transferWithAuthorization domain
  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: requiredChainId,
    verifyingContract: paymentInfo.asset,
  };

  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };

  const message = {
    from: senderAddress,
    to: paymentInfo.payTo,
    value: paymentInfo.maxAmountRequired,
    validAfter,
    validBefore,
    nonce,
  };

  // Sign with wallet
  const signature = await window.ethereum.request({
    method: 'eth_signTypedData_v4',
    params: [
      senderAddress,
      JSON.stringify({
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          ...types,
        },
        primaryType: 'TransferWithAuthorization',
        domain,
        message,
      }),
    ],
  }) as string;

  // Create payment payload
  const payload = {
    x402Version: 1,
    scheme: 'exact',
    network: paymentInfo.network,
    payload: {
      signature,
      authorization: {
        from: senderAddress,
        to: paymentInfo.payTo,
        value: paymentInfo.maxAmountRequired,
        validAfter,
        validBefore,
        nonce,
      },
    },
  };

  return btoa(JSON.stringify(payload));
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────────────────────

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function formatGwei(value: string): string {
  const num = parseFloat(value);
  return num < 0.01 ? '<0.01' : num.toFixed(2);
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function getExplorerUrl(network: string, type: 'tx' | 'address', value: string): string {
  const explorers: Record<string, string> = {
    base: 'https://basescan.org',
    ethereum: 'https://etherscan.io',
    polygon: 'https://polygonscan.com',
    arbitrum: 'https://arbiscan.io',
    optimism: 'https://optimistic.etherscan.io',
    avalanche: 'https://snowtrace.io',
    bsc: 'https://bscscan.com',
  };
  const base = explorers[network] || explorers.base;
  return `${base}/${type}/${value}`;
}
