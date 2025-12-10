// ═══════════════════════════════════════════════════════════════════════════════
// PUSH - State Management with Wallet Support
// ═══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';

// Types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  tokensUsed?: number;
  isStreaming?: boolean;
}

export interface NetworkInfo {
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
}

export interface GasPrice {
  network: string;
  standard: string;
  fast: string;
  instant: string;
  baseFee?: string;
  timestamp: number;
}

export interface ServiceHealth {
  status: string;
  service: string;
  version: string;
  ai: {
    provider: string;
    model: string;
  };
  payment: {
    network: string;
    networkName: string;
    chainId: number;
    price: string;
    priceRaw: string;
    asset: string;
  };
  tools: string[];
  toolCount: number;
  networks: string[];
  networkCount: number;
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
}

interface AppState {
  // Messages
  messages: Message[];
  isLoading: boolean;
  inputValue: string;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setInputValue: (value: string) => void;

  // Service
  health: ServiceHealth | null;
  setHealth: (health: ServiceHealth) => void;

  // Network
  networks: Record<string, NetworkInfo>;
  selectedNetwork: string;
  setNetworks: (networks: Record<string, NetworkInfo>) => void;
  setSelectedNetwork: (network: string) => void;

  // Gas prices
  gasPrices: Record<string, GasPrice>;
  setGasPrice: (network: string, price: GasPrice) => void;

  // Wallet
  wallet: WalletState;
  setWallet: (wallet: Partial<WalletState>) => void;
  disconnectWallet: () => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // Messages
  messages: [],
  isLoading: false,
  inputValue: '',
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),
  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
          isStreaming: false,
        };
      }
      return { messages };
    }),
  clearMessages: () => set({ messages: [] }),
  setLoading: (isLoading) => set({ isLoading }),
  setInputValue: (inputValue) => set({ inputValue }),

  // Service
  health: null,
  setHealth: (health) => set({ health }),

  // Network
  networks: {},
  selectedNetwork: 'base',
  setNetworks: (networks) => set({ networks }),
  setSelectedNetwork: (selectedNetwork) => set({ selectedNetwork }),

  // Gas prices
  gasPrices: {},
  setGasPrice: (network, price) =>
    set((state) => ({
      gasPrices: { ...state.gasPrices, [network]: price },
    })),

  // Wallet
  wallet: {
    address: null,
    chainId: null,
    isConnecting: false,
    isConnected: false,
  },
  setWallet: (wallet) =>
    set((state) => ({
      wallet: { ...state.wallet, ...wallet },
    })),
  disconnectWallet: () =>
    set({
      wallet: {
        address: null,
        chainId: null,
        isConnecting: false,
        isConnected: false,
      },
    }),

  // UI
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
