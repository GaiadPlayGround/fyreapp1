import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Wallet, Loader2 } from 'lucide-react';
import { useConnect } from 'wagmi';
import { base } from 'wagmi/chains';
import { cn } from '@/lib/utils';

interface WalletSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Wallet icons/logos mapping
const getWalletIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('metamask')) return '🦊';
  if (lowerName.includes('phantom')) return '👻';
  if (lowerName.includes('coinbase')) return '🔵';
  if (lowerName.includes('rabby')) return '🦝';
  if (lowerName.includes('trust')) return '🔷';
  if (lowerName.includes('walletconnect')) return '🔗';
  return '💼';
};

const WalletSelectDialog = ({ isOpen, onClose }: WalletSelectDialogProps) => {
  const { connect, connectors, isPending, error } = useConnect();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Check for wallet providers directly in window
  const detectWallets = () => {
    const detected: string[] = [];
    if (typeof window !== 'undefined') {
      if ((window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        if (ethereum.isMetaMask) detected.push('MetaMask');
        if (ethereum.isCoinbaseWallet) detected.push('Coinbase Wallet');
        if (ethereum.isRabby) detected.push('Rabby');
        if (ethereum.isTrust) detected.push('Trust Wallet');
        if (ethereum.providers) {
          ethereum.providers.forEach((provider: any) => {
            if (provider.isMetaMask) detected.push('MetaMask');
            if (provider.isCoinbaseWallet) detected.push('Coinbase Wallet');
          });
        }
        if (!ethereum.isMetaMask && !ethereum.isCoinbaseWallet && !ethereum.isRabby && !ethereum.isTrust) {
          detected.push('Injected Wallet');
        }
      }
      if ((window as any).phantom?.ethereum) detected.push('Phantom');
      if ((window as any).solana) detected.push('Phantom (Solana)');
    }
    return detected;
  };

  const handleConnect = async (connector: any) => {
    try {
      setConnectingId(connector.id || 'injected');
      
      // If it's a fallback injected connector, try direct connection
      if (connector.id === 'injected' && typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const ethereum = (window as any).ethereum;
          // Request account access
          await ethereum.request({ method: 'eth_requestAccounts' });
          // Then use wagmi connect
          connect(
            {
              connector,
              chainId: base.id,
            },
            {
              onSuccess: () => {
                onClose();
                setConnectingId(null);
              },
              onError: (err) => {
                console.error('Connection error:', err);
                setConnectingId(null);
              },
            }
          );
        } catch (err: any) {
          console.error('Direct connection error:', err);
          if (err.code !== 4001) { // Not user rejection
            alert(`Connection failed: ${err.message || 'Please try again'}`);
          }
          setConnectingId(null);
        }
      } else {
        connect(
          {
            connector,
            chainId: base.id,
          },
          {
            onSuccess: () => {
              onClose();
              setConnectingId(null);
            },
            onError: (err) => {
              console.error('Connection error:', err);
              setConnectingId(null);
            },
          }
        );
      }
    } catch (err) {
      console.error('Failed to connect:', err);
      setConnectingId(null);
    }
  };

  // Show all connectors - even if not ready, they might still work
  // Also check window.ethereum directly
  const availableConnectors = connectors.length > 0 
    ? connectors 
    : (typeof window !== 'undefined' && (window as any).ethereum) 
      ? [{ id: 'injected', name: 'Browser Wallet', ready: true }] 
      : [];
  const detectedWallets = detectWallets();

  console.log('All connectors:', connectors.map(c => ({ id: c.id, name: c.name, ready: c.ready })));
  console.log('Detected wallets:', detectedWallets);
  console.log('window.ethereum:', typeof window !== 'undefined' ? (window as any).ethereum : 'N/A');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-center font-serif text-lg">Connect Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 mt-4">
          {availableConnectors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground font-sans mb-2">
                No wallets detected
              </p>
              {detectedWallets.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-muted-foreground/70 font-sans mb-2">
                    Detected wallets: {detectedWallets.join(', ')}
                  </p>
                  {typeof window !== 'undefined' && (window as any).ethereum && (
                    <button
                      onClick={async () => {
                        try {
                          setConnectingId('manual');
                          const ethereum = (window as any).ethereum;
                          await ethereum.request({ method: 'eth_requestAccounts' });
                          // Force page reload to let wagmi detect the connection
                          window.location.reload();
                        } catch (err: any) {
                          console.error('Manual connection error:', err);
                          setConnectingId(null);
                          if (err.code !== 4001) {
                            alert(`Connection failed: ${err.message || 'Please try again'}`);
                          }
                        }
                      }}
                      disabled={connectingId === 'manual'}
                      className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-sans text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {connectingId === 'manual' ? (
                        <>
                          <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Try Connecting Manually'
                      )}
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground/70 font-sans">
                    Or try refreshing the page
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/70 font-sans">
                  Please install a wallet extension like MetaMask, Phantom, or Coinbase Wallet
                </p>
              )}
            </div>
          ) : (
            availableConnectors.map((connector: any) => {
              const isConnecting = connectingId === connector.id || (isPending && connectingId === connector.id);
              const walletName = connector.name || 'Unknown Wallet';
              
              return (
                <button
                  key={connector.id || 'injected'}
                  onClick={() => handleConnect(connector)}
                  disabled={isConnecting || isPending}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    "hover:bg-muted/50 active:scale-[0.98]",
                    isConnecting && "border-primary bg-primary/10",
                    !isConnecting && "border-border/50 bg-background/50",
                    !connector.ready && "opacity-75"
                  )}
                >
                  <div className="text-2xl flex-shrink-0">
                    {getWalletIcon(walletName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-medium text-sm text-foreground truncate">
                      {walletName}
                    </div>
                    {(connector.id === 'injected' || !connector.ready) && (
                      <div className="text-[10px] text-muted-foreground font-sans">
                        {connector.ready ? 'Browser extension' : 'May require refresh'}
                      </div>
                    )}
                  </div>
                  {isConnecting && (
                    <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-destructive font-sans">
              {error.message || 'Connection failed. Please try again.'}
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground text-center font-sans">
            By connecting, you agree to our Terms of Service
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelectDialog;

