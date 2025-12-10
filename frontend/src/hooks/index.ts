// ═══════════════════════════════════════════════════════════════════════════════
// PUSH - Custom React Hooks
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useCallback, useRef, useState } from 'react';
import { useStore } from '../store';
import {
  fetchHealth,
  fetchNetworks,
  fetchGasPrice,
  sendMessage,
  sendPaidMessage,
  signPayment,
  connectWallet as connectWalletApi,
  onAccountsChanged,
  onChainChanged,
} from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// Initial Data Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useInitData() {
  const { setHealth, setNetworks, setGasPrice, selectedNetwork } = useStore();

  useEffect(() => {
    fetchHealth().then(setHealth).catch(console.error);
    fetchNetworks().then(setNetworks).catch(console.error);
  }, [setHealth, setNetworks]);

  useEffect(() => {
    const fetchGas = () => {
      fetchGasPrice(selectedNetwork)
        .then((price) => setGasPrice(selectedNetwork, price))
        .catch(console.error);
    };

    fetchGas();
    const interval = setInterval(fetchGas, 30000);
    return () => clearInterval(interval);
  }, [selectedNetwork, setGasPrice]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat Hook (with x402 Payment)
// ─────────────────────────────────────────────────────────────────────────────

export function useChat() {
  const { messages, isLoading, addMessage, setLoading } = useStore();

  const sendChatMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Get FRESH wallet state (not stale from closure)
    const wallet = useStore.getState().wallet;

    addMessage({ role: 'user', content: text });
    addMessage({ role: 'assistant', content: '', isStreaming: true });
    setLoading(true);

    try {
      let response;

      // If wallet is connected, require payment
      if (wallet.isConnected && wallet.address) {
        // Get payment requirements
        const paymentInfoRes = await fetch('/payment-info');
        const paymentInfo = await paymentInfoRes.json();

        // Update message to show payment pending
        useStore.setState((state) => {
          const msgs = [...state.messages];
          if (msgs.length > 0) {
            msgs[msgs.length - 1] = {
              ...msgs[msgs.length - 1],
              content: '💳 Requesting payment signature ($0.10 USDC)...',
            };
          }
          return { messages: msgs };
        });

        // Sign the payment authorization
        const paymentHeader = await signPayment(paymentInfo, wallet.address);

        // Update message to show processing
        useStore.setState((state) => {
          const msgs = [...state.messages];
          if (msgs.length > 0) {
            msgs[msgs.length - 1] = {
              ...msgs[msgs.length - 1],
              content: '⏳ Processing payment & AI request...',
            };
          }
          return { messages: msgs };
        });

        // Send paid request
        response = await sendPaidMessage(text, paymentHeader, true);
      } else {
        // No wallet connected - use free test endpoint
        response = await sendMessage(text, true);
      }

      if (response.status === 'completed' && response.response) {
        useStore.setState((state) => {
          const messages = [...state.messages];
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content: response.response!.text,
              toolsUsed: response.response!.toolsUsed,
              tokensUsed: response.response!.tokensUsed,
              isStreaming: false,
            };
          }
          return { messages };
        });
      } else if (response.status === 'payment_required') {
        useStore.setState((state) => {
          const messages = [...state.messages];
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content: '💳 Payment required. Please connect your wallet to use this service.',
              isStreaming: false,
            };
          }
          return { messages };
        });
      } else if (response.status === 'payment_failed') {
        useStore.setState((state) => {
          const messages = [...state.messages];
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content: `❌ Payment failed: ${response.error || 'Unknown error'}`,
              isStreaming: false,
            };
          }
          return { messages };
        });
      } else {
        useStore.setState((state) => {
          const messages = [...state.messages];
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content: response.error || 'An error occurred',
              isStreaming: false,
            };
          }
          return { messages };
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      
      // Check if user rejected the signature
      const isUserRejection = errorMessage.toLowerCase().includes('rejected') ||
                             errorMessage.toLowerCase().includes('denied') ||
                             errorMessage.toLowerCase().includes('cancelled');

      useStore.setState((state) => {
        const messages = [...state.messages];
        if (messages.length > 0) {
          messages[messages.length - 1] = {
            ...messages[messages.length - 1],
            content: isUserRejection 
              ? '❌ Payment cancelled by user' 
              : `❌ Error: ${errorMessage}`,
            isStreaming: false,
          };
        }
        return { messages };
      });
    } finally {
      setLoading(false);
    }
  }, [isLoading, addMessage, setLoading]);

  return { messages, isLoading, sendChatMessage };
}

// ─────────────────────────────────────────────────────────────────────────────
// Wallet Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useWallet() {
  const { wallet, setWallet, disconnectWallet } = useStore();

  const connect = useCallback(async () => {
    setWallet({ isConnecting: true });
    try {
      const { address, chainId } = await connectWalletApi();
      setWallet({
        address,
        chainId,
        isConnected: true,
        isConnecting: false,
      });
    } catch (error) {
      setWallet({ isConnecting: false });
      throw error;
    }
  }, [setWallet]);

  const disconnect = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  // Listen for account/chain changes
  useEffect(() => {
    const unsubAccounts = onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setWallet({ address: accounts[0] });
      }
    });

    const unsubChain = onChainChanged((chainId) => {
      setWallet({ chainId });
    });

    return () => {
      unsubAccounts();
      unsubChain();
    };
  }, [setWallet, disconnectWallet]);

  return { wallet, connect, disconnect };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto Scroll Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAutoScroll(dependency: unknown) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [dependency]);

  return scrollRef;
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy to Clipboard Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  return { copied, copy };
}

// ─────────────────────────────────────────────────────────────────────────────
// Media Query Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
