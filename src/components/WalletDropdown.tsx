import { useState, useRef, useEffect } from 'react';
import { Wallet, LogOut, Vote, Copy, Check } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';

const WalletDropdown = () => {
  const { isConnected, address, dnaBalance, usdcBalance, votes, connect, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-sans border border-border rounded-md hover:bg-muted transition-colors"
      >
        <Wallet className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">Connect</span>
      </button>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
      >
        <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-sans text-foreground">{dnaBalance.toLocaleString()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground font-sans">Wallet Address</span>
              <button onClick={copyAddress} className="p-1 hover:bg-muted rounded transition-colors">
                {copied ? (
                  <Check className="w-3 h-3 text-primary" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="font-mono text-xs text-foreground truncate">{address}</p>
          </div>

          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-muted-foreground">FCBC DNA</span>
              <span className="text-xs font-sans font-medium text-foreground">{dnaBalance.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-muted-foreground">USDC Balance</span>
              <span className="text-xs font-sans font-medium text-foreground">${usdcBalance.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-3 border-t border-border">
            <button className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors">
              <Vote className="w-3.5 h-3.5" />
              <span>See My Votes ({votes.length})</span>
            </button>
          </div>

          <div className="p-3 border-t border-border">
            <button
              onClick={() => {
                disconnect();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-sans text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDropdown;
