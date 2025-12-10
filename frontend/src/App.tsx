// PUSH - Full App with Payment Links
import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { useStore } from './store';
import { useInitData, useChat, useWallet, useAutoScroll } from './hooks';
import { formatAddress, signPayment } from './utils/api';

export default function App() {
  useInitData();
  const { sidebarOpen, setSidebarOpen } = useStore();
  const [currentPage, setCurrentPage] = useState<'chat' | 'pay' | 'create'>('chat');
  const [paymentLinkId, setPaymentLinkId] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/pay/')) {
      setPaymentLinkId(path.replace('/pay/', ''));
      setCurrentPage('pay');
    }
  }, []);

  return (
    <div className="app-container">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="main-layout">
        <Sidebar setCurrentPage={setCurrentPage} />
        <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} setCurrentPage={setCurrentPage} />
        <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
        <main className="main-content">
          {currentPage === 'chat' && <ChatArea />}
          {currentPage === 'pay' && <PaymentPage linkId={paymentLinkId} onBack={() => { setCurrentPage('chat'); window.history.pushState({}, '', '/'); }} />}
          {currentPage === 'create' && <CreatePaymentLink onBack={() => setCurrentPage('chat')} />}
        </main>
      </div>
      <Footer />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Payment Link Components
// ═══════════════════════════════════════════════════════════════════════════════

function CreatePaymentLink({ onBack }: { onBack: () => void }) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [network, setNetwork] = useState('base');
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { wallet } = useWallet();

  useEffect(() => {
    if (wallet.address) setRecipient(wallet.address);
  }, [wallet.address]);

  const createLink = async () => {
    if (!amount || !recipient) {
      setError('Amount and recipient are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment-link/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, recipient, description, network }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedLink(window.location.origin + data.link);
      } else {
        setError(data.error || 'Failed to create link');
      }
    } catch (e) {
      setError('Failed to create payment link');
    }
    setLoading(false);
  };

  const copyLink = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-card">
        <div className="payment-header">
          <button onClick={onBack} className="back-btn">← BACK</button>
          <h2 className="payment-title">CREATE PAYMENT LINK</h2>
        </div>

        {!createdLink ? (
          <div className="payment-form">
            <div className="form-group">
              <label>Amount (USDC)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.00"
                className="form-input"
                step="0.01"
                min="0.01"
              />
            </div>

            <div className="form-group">
              <label>Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="form-input"
              />
              <span className="form-hint">Your connected wallet is auto-filled</span>
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment for..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Network</label>
              <select value={network} onChange={(e) => setNetwork(e.target.value)} className="form-input">
                <option value="base">Base</option>
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="optimism">Optimism</option>
              </select>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button onClick={createLink} disabled={loading} className="btn-primary">
              {loading ? 'CREATING...' : 'CREATE PAYMENT LINK'}
            </button>
          </div>
        ) : (
          <div className="link-created">
            <div className="success-icon">✓</div>
            <h3>Payment Link Created!</h3>
            <p className="link-amount">${amount} USDC</p>
            <div className="link-box">
              <input type="text" value={createdLink} readOnly className="link-input" />
              <button onClick={copyLink} className="btn-copy">COPY</button>
            </div>
            <p className="link-hint">Share this link to receive payment</p>
            <div className="link-actions">
              <button onClick={() => { setCreatedLink(null); setAmount(''); setDescription(''); }} className="btn-secondary">
                CREATE ANOTHER
              </button>
              <a href={`https://twitter.com/intent/tweet?text=Pay me ${amount} USDC: ${createdLink}`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                SHARE ON X
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentPage({ linkId, onBack }: { linkId: string | null; onBack: () => void }) {
  const [linkData, setLinkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const { wallet, connect } = useWallet();

  useEffect(() => {
    if (linkId) {
      fetch(`/api/payment-link/${linkId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setLinkData(data);
          else setError('Invalid payment link');
          setLoading(false);
        })
        .catch(() => { setError('Failed to load payment link'); setLoading(false); });
    }
  }, [linkId]);

  const executePayment = async () => {
    if (!wallet.address || !linkData) return;
    setPaying(true);
    setError('');
    try {
      const paymentInfo = {
        network: linkData.network,
        maxAmountRequired: linkData.amountRaw,
        payTo: linkData.recipient,
        asset: linkData.asset,
      };
      const paymentHeader = await signPayment(paymentInfo, wallet.address);
      const res = await fetch('/api/payment-link/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId, paymentHeader }),
      });
      const data = await res.json();
      if (data.success) {
        setPaid(true);
        setTxHash(data.transaction);
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (e: any) {
      setError(e.message || 'Payment failed');
    }
    setPaying(false);
  };

  if (loading) return <div className="payment-page"><div className="payment-card"><p>Loading...</p></div></div>;

  return (
    <div className="payment-page">
      <div className="payment-card">
        <div className="payment-header">
          <button onClick={onBack} className="back-btn">← BACK</button>
          <h2 className="payment-title">PAYMENT REQUEST</h2>
        </div>

        {error && !linkData ? (
          <div className="payment-error">{error}</div>
        ) : paid ? (
          <div className="payment-success">
            <div className="success-icon">✓</div>
            <h3>Payment Sent!</h3>
            <p>${linkData.amount} USDC sent to {formatAddress(linkData.recipient)}</p>
            {txHash && <p className="tx-hash">TX: {formatAddress(txHash)}</p>}
          </div>
        ) : (
          <div className="payment-details">
            <div className="payment-amount">${linkData?.amount}</div>
            <div className="payment-currency">USDC</div>
            <div className="payment-recipient">
              <span className="label">TO:</span>
              <span className="address">{formatAddress(linkData?.recipient || '')}</span>
            </div>
            {linkData?.description && (
              <div className="payment-description">{linkData.description}</div>
            )}
            <div className="payment-network">
              <span className="label">NETWORK:</span>
              <span>{linkData?.networkName}</span>
            </div>
            {error && <div className="form-error">{error}</div>}
            {wallet.isConnected ? (
              <button onClick={executePayment} disabled={paying} className="btn-primary btn-pay">
                {paying ? 'SIGNING...' : `PAY $${linkData?.amount} USDC`}
              </button>
            ) : (
              <button onClick={connect} className="btn-primary">
                CONNECT WALLET TO PAY
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Header, Sidebar, Footer
// ═══════════════════════════════════════════════════════════════════════════════

function Header({ onMenuClick, currentPage, setCurrentPage }: { onMenuClick: () => void; currentPage: string; setCurrentPage: (p: any) => void }) {
  const { health } = useStore();
  const { wallet, connect, disconnect } = useWallet();

  return (
    <header className="header">
      <div className="header-left">
        <button onClick={onMenuClick} className="menu-btn">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="logo" onClick={() => setCurrentPage('chat')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">P</div>
          <span className="logo-text">PUSH</span>
        </div>
      </div>

      <div className="header-nav">
        <button onClick={() => setCurrentPage('chat')} className={`nav-btn ${currentPage === 'chat' ? 'active' : ''}`}>AI</button>
        <button onClick={() => setCurrentPage('create')} className={`nav-btn ${currentPage === 'create' ? 'active' : ''}`}>PAY LINK</button>
      </div>

      <div className="header-stats">
        {health && (
          <>
            <span className="flex items-center gap-1"><span className="status-dot" /> ONLINE</span>
            <span>{health.toolCount} TOOLS</span>
            <span>{health.payment.price}</span>
          </>
        )}
      </div>

      <div>
        {wallet.isConnected ? (
          <div className="wallet-display">
            <span className="wallet-addr">{formatAddress(wallet.address!)}</span>
            <button onClick={disconnect} className="btn-disconnect">×</button>
          </div>
        ) : (
          <button onClick={connect} disabled={wallet.isConnecting} className="btn-connect">
            {wallet.isConnecting ? '...' : 'CONNECT'}
          </button>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <a href="https://www.x402hackathon.com/" target="_blank" rel="noopener noreferrer" className="footer-badge">
            <span className="footer-badge-icon">◎</span>
            <span className="footer-badge-text">x402 HACKATHON</span>
          </a>
          <span className="footer-divider">•</span>
          <span className="footer-subtitle">Built for the next era of internet-native payments</span>
        </div>
        <div className="footer-right">
          <a href="https://x.com/privacy_maxi" target="_blank" rel="noopener noreferrer" className="footer-social">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>@privacy_maxi</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

function SidebarContent({ onAction, setCurrentPage }: { onAction?: () => void; setCurrentPage?: (p: any) => void }) {
  const { health, networks, selectedNetwork, setSelectedNetwork, gasPrices, setInputValue } = useStore();
  const quickActions = ["What's the ETH price?", "Show Fear & Greed Index", "Gas prices on Base", "Top DeFi protocols", "Analyze vitalik.eth"];

  return (
    <>
      <div className="sidebar-section">
        <div className="sidebar-title">Networks</div>
        <div className="network-grid">
          {Object.entries(networks).map(([key, network]) => (
            <button key={key} onClick={() => setSelectedNetwork(key)} className={`network-btn ${selectedNetwork === key ? 'active' : ''}`}>
              {network.shortName}
            </button>
          ))}
        </div>
      </div>

      {gasPrices[selectedNetwork] && (
        <div className="sidebar-section">
          <div className="sidebar-title">Gas ({networks[selectedNetwork]?.shortName})</div>
          <div className="gas-grid">
            <div className="gas-item"><div className="gas-value">{parseFloat(gasPrices[selectedNetwork].standard).toFixed(1)}</div><div className="gas-label">STD</div></div>
            <div className="gas-item"><div className="gas-value">{parseFloat(gasPrices[selectedNetwork].fast).toFixed(1)}</div><div className="gas-label">FAST</div></div>
            <div className="gas-item"><div className="gas-value">{parseFloat(gasPrices[selectedNetwork].instant).toFixed(1)}</div><div className="gas-label">INST</div></div>
          </div>
        </div>
      )}

      <div className="sidebar-section">
        <div className="sidebar-title">Quick Actions</div>
        {quickActions.map((action, i) => (
          <button key={i} onClick={() => { setInputValue(action); setCurrentPage?.('chat'); onAction?.(); }} className="quick-action">→ {action}</button>
        ))}
      </div>

      <div className="sidebar-section">
        <button onClick={() => { setCurrentPage?.('create'); onAction?.(); }} className="sidebar-pay-btn">💳 CREATE PAY LINK</button>
      </div>

      {health && (
        <div className="sidebar-section">
          <div className="sidebar-title">Tools ({health.toolCount})</div>
          <div className="tools-list">
            {health.tools.slice(0, 8).map((tool) => (<span key={tool} className="tool-badge">{tool}</span>))}
            {health.tools.length > 8 && <span className="tool-badge">+{health.tools.length - 8}</span>}
          </div>
        </div>
      )}
      <div className="sidebar-footer">PUSH v2.0 • x402</div>
    </>
  );
}

function Sidebar({ setCurrentPage }: { setCurrentPage?: (p: any) => void }) {
  return <aside className="sidebar"><SidebarContent setCurrentPage={setCurrentPage} /></aside>;
}

function MobileSidebar({ open, onClose, setCurrentPage }: { open: boolean; onClose: () => void; setCurrentPage?: (p: any) => void }) {
  return (
    <div className={`sidebar-mobile ${open ? 'open' : ''}`}>
      <button onClick={onClose} className="sidebar-close">×</button>
      <SidebarContent onAction={onClose} setCurrentPage={setCurrentPage} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Chat Components
// ═══════════════════════════════════════════════════════════════════════════════

function ChatArea() {
  const { messages } = useStore();
  return messages.length === 0 ? <WelcomeScreen /> : <ChatView />;
}

function WelcomeScreen() {
  const { health, setInputValue } = useStore();
  const { wallet } = useWallet();
  const features = [
    { icon: '◈', title: 'PRICES' }, { icon: '◇', title: 'WALLETS' }, { icon: '△', title: 'DEFI' },
    { icon: '○', title: 'NFTS' }, { icon: '□', title: 'GAS' }, { icon: '▽', title: 'CONTRACTS' },
  ];
  const suggestions = ["ETH price?", "Analyze vitalik.eth", "Top DeFi protocols", "Fear & Greed", "Gas on Arbitrum", "Trending tokens"];

  return (
    <div className="welcome-screen">
      <div className="welcome-hero">
        <div className="welcome-logo"><span className="welcome-logo-text">P</span></div>
        <h1 className="welcome-title">PUSH</h1>
        <p className="welcome-subtitle">AI-POWERED BLOCKCHAIN INTELLIGENCE</p>
        <p className="welcome-subtitle">30+ TOOLS • 7 NETWORKS • x402</p>
        {!wallet.isConnected && <div className="welcome-hint">CONNECT WALLET TO PAY WITH USDC</div>}
      </div>
      <div className="features-grid">
        {features.map((f, i) => (<div key={i} className="feature-card"><div className="feature-icon">{f.icon}</div><div className="feature-title">{f.title}</div></div>))}
      </div>
      <div className="suggestions-grid">
        {suggestions.map((s, i) => (<button key={i} onClick={() => setInputValue(s)} className="suggestion-btn">{s}</button>))}
      </div>
      <ChatInput />
      {health && (
        <div className="networks-row" style={{ marginTop: '0.5rem' }}>
          {health.networks.map((n) => (<span key={n} className="network-badge">{n.toUpperCase()}</span>))}
        </div>
      )}
    </div>
  );
}

function ChatView() {
  const { messages, clearMessages } = useStore();
  const scrollRef = useAutoScroll(messages);
  return (
    <div className="chat-container">
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg) => (<Message key={msg.id} message={msg} />))}
      </div>
      <ChatInput />
      {messages.length > 0 && <button onClick={clearMessages} className="clear-btn">CLEAR</button>}
    </div>
  );
}

function Message({ message }: { message: import('./store').Message }) {
  return (
    <div className="message">
      <div className="message-header">
        <span className="message-role">{message.role === 'user' ? 'YOU' : 'PUSH'}</span>
        <span className="message-time">{message.timestamp.toLocaleTimeString()}</span>
      </div>
      <div className="message-content">
        {message.content ? (
          <Markdown components={{ strong: ({ children }) => <strong>{children}</strong>, code: ({ children }) => <code>{children}</code>, p: ({ children }) => <p>{children}</p>, ul: ({ children }) => <ul>{children}</ul>, ol: ({ children }) => <ol>{children}</ol>, li: ({ children }) => <li>{children}</li> }}>
            {message.content}
          </Markdown>
        ) : message.isStreaming ? <span className="loading-dots">Processing</span> : null}
      </div>
      {message.toolsUsed && message.toolsUsed.length > 0 && (
        <div className="message-tools">
          <div className="message-tools-label">TOOLS</div>
          <div className="message-tools-list">{message.toolsUsed.map((t, i) => (<span key={i} className="tool-badge">{t}</span>))}</div>
        </div>
      )}
    </div>
  );
}

function ChatInput() {
  const { inputValue, setInputValue, isLoading } = useStore();
  const { sendChatMessage } = useChat();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const handleSubmit = () => { if (inputValue.trim() && !isLoading) { sendChatMessage(inputValue); setInputValue(''); } };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };
  useEffect(() => { if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 100) + 'px'; } }, [inputValue]);

  return (
    <div className="chat-input-container">
      <div className="chat-input-row">
        <textarea ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about blockchain data..." disabled={isLoading} rows={1} className="chat-input" />
        <button onClick={handleSubmit} disabled={!inputValue.trim() || isLoading} className="btn-send">{isLoading ? '...' : 'SEND'}</button>
      </div>
      <div className="chat-input-hint"><span>SHIFT+ENTER for new line</span><span>CLAUDE SONNET</span></div>
    </div>
  );
}
