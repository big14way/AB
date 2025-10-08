'use client';

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { useEffect, useState } from 'react';
import { formatEther } from 'viem';

/**
 * Wallet Connect Component
 * 
 * Features:
 * - Multiple wallet options (CDP Email + WalletConnect)
 * - Account display with balance
 * - Connection status
 * - Disconnect functionality
 */
export function WalletConnect() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address: address,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="wallet-connect">
        <button className="wallet-button" disabled>
          Loading...
        </button>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <div className="wallet-details">
            <div className="wallet-connector">
              {connector?.name || 'Connected'}
            </div>
            <div className="wallet-address">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            {balance && (
              <div className="wallet-balance">
                {parseFloat(formatEther(balance.value)).toFixed(4)} ETH
              </div>
            )}
          </div>
          <button
            className="wallet-button disconnect"
            onClick={() => disconnect()}
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <div className="wallet-options">
        <h3 className="wallet-title">Connect Your Wallet</h3>
        <p className="wallet-subtitle">
          Choose your preferred wallet to get started
        </p>
        
        <div className="connector-grid">
          {connectors.map((connector) => {
            const isLoading = isPending;
            const isCoinbase = connector.name.toLowerCase().includes('coinbase');
            const isWalletConnect = connector.name.toLowerCase().includes('walletconnect');

            return (
              <button
                key={connector.id}
                className={`connector-button ${isLoading ? 'loading' : ''}`}
                onClick={() => connect({ connector })}
                disabled={isLoading}
              >
                <div className="connector-content">
                  <div className="connector-icon">
                    {isCoinbase && (
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="#0052FF"/>
                        <path d="M16 6C10.48 6 6 10.48 6 16C6 21.52 10.48 26 16 26C21.52 26 26 21.52 26 16C26 10.48 21.52 6 16 6ZM16 20C13.79 20 12 18.21 12 16C12 13.79 13.79 12 16 12C18.21 12 20 13.79 20 16C20 18.21 18.21 20 16 20Z" fill="white"/>
                      </svg>
                    )}
                    {isWalletConnect && (
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect width="32" height="32" rx="8" fill="#3B99FC"/>
                        <path d="M9.5 12.5C13.5 8.5 19.5 8.5 23.5 12.5L24 13L22 15L21.5 14.5C18.5 11.5 13.5 11.5 10.5 14.5L10 15L8 13L9.5 12.5Z" fill="white"/>
                        <path d="M14 18C15.1 16.9 16.9 16.9 18 18L18.5 18.5L16.5 20.5L16 20C15.5 19.5 14.5 19.5 14 20L13.5 20.5L11.5 18.5L14 18Z" fill="white"/>
                      </svg>
                    )}
                  </div>
                  <div className="connector-text">
                    <div className="connector-name">{connector.name}</div>
                    <div className="connector-description">
                      {isCoinbase && 'Login with email - No download needed'}
                      {isWalletConnect && 'Use MetaMask, Trust Wallet, etc.'}
                      {!isCoinbase && !isWalletConnect && 'Connect wallet'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="wallet-features">
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <div className="feature-text">
              <div className="feature-title">Secure</div>
              <div className="feature-desc">Non-custodial wallets</div>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <div className="feature-text">
              <div className="feature-title">Fast</div>
              <div className="feature-desc">Base L2 network</div>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">💰</div>
            <div className="feature-text">
              <div className="feature-title">Low Fees</div>
              <div className="feature-desc">Minimal gas costs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
