'use client';

import { useAccount, useConnect, useDisconnect, useBalance, useEnsName } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther, parseUnits } from 'viem';
import { useBridgeContract } from '../hooks/useBridgeContract';

/**
 * Unified Wallet Authentication Button
 * 
 * Features:
 * - CDP Email authentication (Coinbase Smart Wallet)
 * - WalletConnect QR modal
 * - Connected state with address + Basename
 * - Test deposit functionality
 */
export function WalletAuthButton() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });
  
  const {
    depositUSDC,
    isPending: isDepositPending,
    isConfirming,
    isConfirmed,
    txHash,
  } = useBridgeContract();

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showWCModal, setShowWCModal] = useState(false);
  const [wcUri, setWcUri] = useState<string>('');
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Test deposit form state
  const [depositRecipient, setDepositRecipient] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle WalletConnect connection with QR
  const handleWalletConnect = async () => {
    const wcConnector = connectors.find(c => 
      c.name.toLowerCase().includes('walletconnect')
    );

    if (!wcConnector) {
      alert('WalletConnect not available');
      return;
    }

    try {
      setShowWCModal(true);
      
      // Get WalletConnect provider
      const provider = await wcConnector.getProvider();
      
      // Subscribe to display_uri event for QR code
      if (provider && 'on' in provider) {
        provider.on('display_uri', (uri: string) => {
          setWcUri(uri);
        });
      }

      // Initiate connection
      await connect({ connector: wcConnector });
      
      setShowWCModal(false);
      setShowConnectModal(false);
    } catch (err) {
      console.error('WalletConnect error:', err);
      setShowWCModal(false);
    }
  };

  // Handle CDP (Coinbase Smart Wallet) connection
  const handleCDPConnect = async () => {
    const cdpConnector = connectors.find(c => 
      c.name.toLowerCase().includes('coinbase')
    );

    if (!cdpConnector) {
      alert('Coinbase Smart Wallet not available');
      return;
    }

    try {
      await connect({ connector: cdpConnector });
      setShowConnectModal(false);
    } catch (err) {
      console.error('CDP connection error:', err);
    }
  };

  // Handle test deposit
  const handleTestDeposit = async () => {
    if (!depositRecipient || !depositAmount) {
      alert('Please fill recipient and amount');
      return;
    }

    try {
      await depositUSDC(
        depositRecipient as `0x${string}`,
        depositAmount,
        `TEST-${Date.now()}`
      );
      
      // Reset form after successful deposit
      setDepositRecipient('');
      setDepositAmount('');
      setShowDepositForm(false);
    } catch (err) {
      console.error('Deposit error:', err);
    }
  };

  if (!mounted) {
    return (
      <div className="wallet-auth-button">
        <button className="btn-primary" disabled>
          Loading...
        </button>
      </div>
    );
  }

  // Connected State
  if (isConnected && address) {
    return (
      <div className="wallet-connected-container">
        {/* Connected Info Card */}
        <div className="connected-card">
          <div className="connected-header">
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span className="status-text">Connected</span>
            </div>
            <button
              onClick={() => disconnect()}
              className="btn-disconnect"
            >
              Disconnect
            </button>
          </div>

          <div className="wallet-info-grid">
            {/* Wallet Address / ENS */}
            <div className="info-item">
              <label className="info-label">Wallet</label>
              <div className="info-value">
                {ensName || `${address.slice(0, 6)}...${address.slice(-4)}`}
              </div>
              <div className="info-subtext">{connector?.name}</div>
            </div>

            {/* Balance */}
            {balance && (
              <div className="info-item">
                <label className="info-label">Balance</label>
                <div className="info-value">
                  {parseFloat(formatEther(balance.value)).toFixed(4)} ETH
                </div>
                <div className="info-subtext">Base Sepolia</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              onClick={() => setShowDepositForm(!showDepositForm)}
              className="btn-action"
            >
              {showDepositForm ? '✕ Cancel' : '💰 Test Deposit'}
            </button>
            <a
              href={`https://sepolia.basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-action-secondary"
            >
              🔍 View on BaseScan
            </a>
          </div>

          {/* Deposit Form */}
          {showDepositForm && (
            <div className="deposit-form">
              <h3 className="deposit-title">Test USDC Deposit</h3>
              
              <div className="form-group">
                <label className="form-label">Recipient Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={depositRecipient}
                  onChange={(e) => setDepositRecipient(e.target.value)}
                  className="form-input"
                  disabled={isDepositPending || isConfirming}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (USDC)</label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="10.0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="form-input"
                  disabled={isDepositPending || isConfirming}
                />
              </div>

              <button
                onClick={handleTestDeposit}
                disabled={isDepositPending || isConfirming}
                className="btn-submit"
              >
                {isDepositPending && '⏳ Preparing...'}
                {isConfirming && '⏳ Confirming...'}
                {!isDepositPending && !isConfirming && '✓ Submit Deposit'}
              </button>

              {isConfirmed && txHash && (
                <div className="success-message">
                  ✅ Deposit successful!
                  <a
                    href={`https://sepolia.basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    View Transaction →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Not Connected - Show Auth Options
  return (
    <div className="wallet-auth-button">
      {/* Main Connect Button */}
      {!showConnectModal && (
        <button
          onClick={() => setShowConnectModal(true)}
          className="btn-connect"
          disabled={isPending}
        >
          <span className="btn-icon">🔐</span>
          <span className="btn-text">Connect Wallet</span>
        </button>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="connect-modal-overlay">
          <div className="connect-modal">
            {/* Header */}
            <div className="modal-header">
              <h2 className="modal-title">Connect Your Wallet</h2>
              <button
                onClick={() => setShowConnectModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {/* Connection Options */}
            <div className="connection-options">
              {/* CDP - Email Option */}
              <button
                onClick={handleCDPConnect}
                disabled={isPending}
                className="connect-option"
              >
                <div className="option-icon">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="20" fill="#0052FF"/>
                    <path d="M20 8C13.37 8 8 13.37 8 20C8 26.63 13.37 32 20 32C26.63 32 32 26.63 32 20C32 13.37 26.63 8 20 8ZM20 24C17.79 24 16 22.21 16 20C16 17.79 17.79 16 20 16C22.21 16 24 17.79 24 20C24 22.21 22.21 24 20 24Z" fill="white"/>
                  </svg>
                </div>
                <div className="option-content">
                  <div className="option-name">Coinbase Smart Wallet</div>
                  <div className="option-description">
                    📧 Login with email - No download needed
                  </div>
                </div>
                {isPending && <div className="option-loading">⏳</div>}
              </button>

              {/* WalletConnect Option */}
              <button
                onClick={handleWalletConnect}
                disabled={isPending}
                className="connect-option"
              >
                <div className="option-icon">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="10" fill="#3B99FC"/>
                    <path d="M12 15C17 10 23 10 28 15L29 16L26 19L25 18C21 14 15 14 11 18L10 19L7 16L12 15Z" fill="white"/>
                    <path d="M17 23C18.5 21.5 21.5 21.5 23 23L24 24L21 27L20 26C19.5 25.5 18.5 25.5 17 26L16 27L13 24L17 23Z" fill="white"/>
                  </svg>
                </div>
                <div className="option-content">
                  <div className="option-name">WalletConnect</div>
                  <div className="option-description">
                    📱 MetaMask, Trust Wallet & 300+ wallets
                  </div>
                </div>
                {isPending && <div className="option-loading">⏳</div>}
              </button>
            </div>

            {/* Features */}
            <div className="modal-features">
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span className="feature-text">Secure & Non-custodial</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span className="feature-text">Fast on Base L2</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <span className="feature-text">Low gas fees</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="error-message">
                ⚠️ {error.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WalletConnect QR Modal */}
      {showWCModal && (
        <div className="connect-modal-overlay">
          <div className="connect-modal qr-modal">
            <div className="modal-header">
              <h2 className="modal-title">Scan QR Code</h2>
              <button
                onClick={() => {
                  setShowWCModal(false);
                  setWcUri('');
                }}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="qr-container">
              {wcUri ? (
                <>
                  <div className="qr-code">
                    {/* Generate QR Code from URI */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(wcUri)}`}
                      alt="WalletConnect QR Code"
                      className="qr-image"
                    />
                  </div>
                  <p className="qr-instructions">
                    Scan with your mobile wallet
                  </p>
                  <div className="supported-wallets">
                    <span>MetaMask</span>
                    <span>Trust Wallet</span>
                    <span>Rainbow</span>
                    <span>Coinbase Wallet</span>
                  </div>
                </>
              ) : (
                <div className="qr-loading">
                  <div className="spinner"></div>
                  <p>Generating QR code...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Main Container */
        .wallet-auth-button {
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }

        /* Connect Button */
        .btn-connect {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #0052ff 0%, #0041cc 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0, 82, 255, 0.3);
        }

        .btn-connect:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 82, 255, 0.4);
        }

        .btn-connect:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-icon {
          font-size: 1.5rem;
        }

        /* Modal Overlay */
        .connect-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        /* Modal */
        .connect-modal {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Modal Header */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .modal-close {
          width: 36px;
          height: 36px;
          border: none;
          background: #f5f7fa;
          border-radius: 8px;
          font-size: 1.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #e0e0e0;
        }

        /* Connection Options */
        .connection-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .connect-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .connect-option:hover:not(:disabled) {
          border-color: #0052ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 82, 255, 0.1);
        }

        .connect-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .option-icon {
          flex-shrink: 0;
        }

        .option-content {
          flex: 1;
        }

        .option-name {
          font-weight: 600;
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
          color: #1a1a1a;
        }

        .option-description {
          font-size: 0.875rem;
          color: #666;
        }

        .option-loading {
          font-size: 1.25rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Modal Features */
        .modal-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e0e0e0;
        }

        .feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.5rem;
        }

        .feature-icon {
          font-size: 1.5rem;
        }

        .feature-text {
          font-size: 0.75rem;
          color: #666;
        }

        /* QR Modal */
        .qr-modal {
          max-width: 400px;
        }

        .qr-container {
          text-align: center;
        }

        .qr-code {
          padding: 1.5rem;
          background: white;
          border-radius: 16px;
          border: 2px solid #e0e0e0;
          margin-bottom: 1rem;
        }

        .qr-image {
          width: 100%;
          max-width: 300px;
          height: auto;
          border-radius: 12px;
        }

        .qr-instructions {
          font-size: 1rem;
          color: #666;
          margin-bottom: 1rem;
        }

        .supported-wallets {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }

        .supported-wallets span {
          padding: 0.375rem 0.75rem;
          background: #f5f7fa;
          border-radius: 8px;
          font-size: 0.75rem;
          color: #666;
        }

        .qr-loading {
          padding: 3rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e0e0e0;
          border-top-color: #0052ff;
          border-radius: 50%;
          margin: 0 auto 1rem;
          animation: spin 1s linear infinite;
        }

        /* Connected State */
        .wallet-connected-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .connected-card {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .connected-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #05c168;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-text {
          font-size: 0.875rem;
          color: #05c168;
          font-weight: 600;
        }

        .btn-disconnect {
          padding: 0.5rem 1rem;
          background: #ffebee;
          color: #f44336;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-disconnect:hover {
          background: #f44336;
          color: white;
        }

        /* Wallet Info Grid */
        .wallet-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          padding: 1.5rem;
          background: #f5f7fa;
          border-radius: 12px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          font-size: 0.75rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a1a;
          word-break: break-all;
        }

        .info-subtext {
          font-size: 0.75rem;
          color: #999;
        }

        /* Action Buttons */
        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .btn-action,
        .btn-action-secondary {
          padding: 0.875rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          text-decoration: none;
          display: block;
        }

        .btn-action {
          background: #0052ff;
          color: white;
          border: none;
        }

        .btn-action:hover {
          background: #0041cc;
          transform: translateY(-1px);
        }

        .btn-action-secondary {
          background: white;
          color: #0052ff;
          border: 2px solid #0052ff;
        }

        .btn-action-secondary:hover {
          background: #f5f7fa;
        }

        /* Deposit Form */
        .deposit-form {
          padding: 1.5rem;
          background: #f5f7fa;
          border-radius: 12px;
          margin-top: 1.5rem;
        }

        .deposit-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1a1a1a;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #0052ff;
        }

        .form-input:disabled {
          background: #f5f7fa;
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-submit {
          width: 100%;
          padding: 1rem;
          background: #0052ff;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-submit:hover:not(:disabled) {
          background: #0041cc;
          transform: translateY(-1px);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success-message {
          margin-top: 1rem;
          padding: 1rem;
          background: #e8f5e9;
          color: #05c168;
          border-radius: 8px;
          font-size: 0.875rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .tx-link {
          color: #0052ff;
          text-decoration: none;
          font-weight: 600;
        }

        .tx-link:hover {
          text-decoration: underline;
        }

        .error-message {
          margin-top: 1rem;
          padding: 1rem;
          background: #ffebee;
          color: #f44336;
          border-radius: 8px;
          font-size: 0.875rem;
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .connect-modal {
            padding: 1.5rem;
          }

          .modal-features {
            grid-template-columns: 1fr;
          }

          .wallet-info-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
