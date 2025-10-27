'use client';

import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useEffect, useState } from 'react';
import { useBalance } from 'wagmi';
import { formatEther } from 'viem';

/**
 * AppKit Button Component
 *
 * Uses Reown AppKit for enhanced WalletConnect integration
 * Features:
 * - Email login via Coinbase Smart Wallet
 * - WalletConnect for mobile wallets
 * - Built-in modal UI
 * - Account management
 */
export function AppKitButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { data: balance } = useBalance({
    address: address as `0x${string}` | undefined,
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
            onClick={() => open()}
          >
            Manage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <button
        className="wallet-button connect"
        onClick={() => open()}
      >
        Connect Wallet
      </button>
      <p className="wallet-hint">
        Email login or mobile wallet supported
      </p>
    </div>
  );
}
