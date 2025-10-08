'use client';

import { WalletAuthButton } from '../components/WalletAuthButton';
import { useBridgeContract } from '../hooks/useBridgeContract';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { formatUnits } from 'viem';
import * as React from 'react';

export default function Home() {
  const { isConnected, address, connector } = useAccount();
  const {
    contractAddress,
    contractBalance,
    depositUSDC,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    txHash,
    refetchBalance,
  } = useBridgeContract();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);

  // Test function to detect and log connector type
  const logConnectionDetails = () => {
    if (!isConnected || !connector) {
      const log = `❌ Not connected`;
      console.log(log);
      setConnectionLogs(prev => [...prev, log]);
      return;
    }

    const connectorName = connector.name;
    const isCDP = connectorName.toLowerCase().includes('coinbase');
    const isWC = connectorName.toLowerCase().includes('walletconnect');
    
    let connectorType = 'Unknown';
    let emoji = '❓';
    
    if (isCDP) {
      connectorType = 'CDP (Coinbase Smart Wallet)';
      emoji = '📧';
    } else if (isWC) {
      connectorType = 'WalletConnect';
      emoji = '📱';
    }

    const log = `${emoji} Connected via ${connectorType}\n` +
                `   Address: ${address}\n` +
                `   Connector ID: ${connector.id}\n` +
                `   Connector Name: ${connectorName}`;
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(log);
    console.log(`${'='.repeat(50)}\n`);
    
    setConnectionLogs(prev => [...prev, log]);
  };

  // Auto-log on connection change
  React.useEffect(() => {
    if (isConnected && connector) {
      logConnectionDetails();
    }
  }, [isConnected, connector, address]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !amount || !reference) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await depositUSDC(recipient as `0x${string}`, amount, reference);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      
      // Reset form
      setRecipient('');
      setAmount('');
      setReference('');
      
      // Refetch balance after deposit
      setTimeout(() => refetchBalance(), 2000);
    } catch (err) {
      console.error('Deposit failed:', err);
    }
  };

  return (
    <main className="main-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <h1>🌍 AfriBridge</h1>
            <p>WhatsApp Stablecoin Remittance</p>
          </div>
        </div>
      </header>

      {/* Wallet Authentication Section */}
      <section className="wallet-auth-section">
        <div className="wallet-auth-container">
          <h2 className="section-title">Connect Your Wallet</h2>
          <p className="section-subtitle">
            Choose email login or mobile wallet to get started
          </p>
          <WalletAuthButton />
        </div>
      </section>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h2 className="hero-title">
            Send Money from Mobile Money to USDC
          </h2>
          <p className="hero-subtitle">
            Bridge African mobile money to crypto in seconds via WhatsApp
          </p>
          
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">⚡ Instant</div>
              <div className="stat-label">Transfers</div>
            </div>
            <div className="stat">
              <div className="stat-value">💰 Low Fees</div>
              <div className="stat-label">Base L2</div>
            </div>
            <div className="stat">
              <div className="stat-value">🔒 Secure</div>
              <div className="stat-label">Smart Contracts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bridge Info */}
      <section className="bridge-info">
        <div className="info-card">
          <h3>Bridge Contract</h3>
          <p className="contract-address">
            <a 
              href={`https://sepolia.basescan.org/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {contractAddress}
            </a>
          </p>
          {contractBalance !== undefined && (
            <p className="contract-balance">
              Balance: {formatUnits(contractBalance, 6)} USDC
            </p>
          )}
        </div>
      </section>

      {/* Connection Test Panel */}
      {isConnected && (
        <section className="test-panel-section">
          <div className="test-panel">
            <h3 className="test-panel-title">🧪 Connection Test Panel</h3>
            <div className="test-info">
              <div className="test-item">
                <span className="test-label">Connector:</span>
                <span className="test-value">
                  {connector?.name || 'Unknown'}
                  {connector?.name.toLowerCase().includes('coinbase') && ' 📧 (CDP)'}
                  {connector?.name.toLowerCase().includes('walletconnect') && ' 📱 (WC)'}
                </span>
              </div>
              <div className="test-item">
                <span className="test-label">Type:</span>
                <span className="test-value">
                  {connector?.name.toLowerCase().includes('coinbase') && 'Email-based Wallet'}
                  {connector?.name.toLowerCase().includes('walletconnect') && 'Mobile Wallet (QR)'}
                </span>
              </div>
              <div className="test-item">
                <span className="test-label">Address:</span>
                <span className="test-value mono">{address}</span>
              </div>
            </div>
            
            <button 
              onClick={logConnectionDetails}
              className="test-button"
            >
              📋 Log Connection Details to Console
            </button>

            {connectionLogs.length > 0 && (
              <div className="connection-logs">
                <h4>Connection Log:</h4>
                {connectionLogs.map((log, i) => (
                  <pre key={i} className="log-entry">{log}</pre>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Content */}
      {isConnected ? (
        <section className="deposit-section">
          <div className="deposit-card">
            <h2>Deposit USDC</h2>
            <p className="deposit-subtitle">
              Send USDC to the bridge contract
            </p>

            <form onSubmit={handleDeposit} className="deposit-form">
              <div className="form-group">
                <label htmlFor="recipient">Recipient Address</label>
                <input
                  id="recipient"
                  type="text"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="form-input"
                  disabled={isPending || isConfirming}
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount (USDC)</label>
                <input
                  id="amount"
                  type="number"
                  step="0.000001"
                  placeholder="10.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="form-input"
                  disabled={isPending || isConfirming}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reference">Transaction Reference</label>
                <input
                  id="reference"
                  type="text"
                  placeholder="ABR-123456-ABC"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="form-input"
                  disabled={isPending || isConfirming}
                />
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={isPending || isConfirming}
              >
                {isPending && 'Preparing...'}
                {isConfirming && 'Confirming...'}
                {!isPending && !isConfirming && 'Deposit USDC'}
              </button>

              {isError && (
                <div className="error-message">
                  Error: {error?.message || 'Transaction failed'}
                </div>
              )}

              {isConfirmed && showSuccess && (
                <div className="success-message">
                  ✅ Deposit successful!
                  {txHash && (
                    <a
                      href={`https://sepolia.basescan.org/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      View on BaseScan →
                    </a>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Transaction Status */}
          {(isPending || isConfirming) && (
            <div className="status-card">
              <div className="status-content">
                <div className="spinner"></div>
                <div className="status-text">
                  {isPending && 'Waiting for wallet approval...'}
                  {isConfirming && 'Transaction confirming on Base Sepolia...'}
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="connect-section">
          <div className="connect-card">
            <h2>Get Started</h2>
            <p>Connect your wallet to start using AfriBridge</p>
            
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">📧</span>
                <span>Email login with Coinbase Smart Wallet</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>Connect MetaMask, Trust Wallet & more</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💬</span>
                <span>Send via WhatsApp bot</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Connect Wallet</h3>
            <p>Use email or mobile wallet</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Send via WhatsApp</h3>
            <p>Text our bot to initiate transfer</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Pay with M-Pesa</h3>
            <p>Use mobile money or card</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Receive USDC</h3>
            <p>Get stablecoins on Base blockchain</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>AfriBridge</h4>
            <p>Bridging African mobile money to crypto</p>
          </div>
          <div className="footer-section">
            <h4>Network</h4>
            <p>Base Sepolia Testnet</p>
            <p>Chain ID: 84532</p>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <a href="https://docs.base.org" target="_blank" rel="noopener noreferrer">
              Base Docs
            </a>
            <a href={`https://sepolia.basescan.org/address/${contractAddress}`} target="_blank" rel="noopener noreferrer">
              Contract on BaseScan
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 AfriBridge. Built on Base.</p>
        </div>
      </footer>
    </main>
  );
}
