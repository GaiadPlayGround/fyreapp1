import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, LogOut, Vote, Copy, Check, Users, Share2, Moon, Sun, Volume2, VolumeX, Sparkles, HelpCircle, Ticket } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { getDisplayName, formatAddressForDisplay } from '@/lib/nameResolution';
import OnboardingGuide from './OnboardingGuide';

interface WalletDropdownProps {
  animationEnabled?: boolean;
  soundEnabled?: boolean;
  onToggleAnimation?: () => void;
  onToggleSound?: () => void;
}

// Format large numbers
const formatBalance = (num: number): string => {
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toLocaleString();
};

const WalletDropdown = ({
  animationEnabled = true,
  soundEnabled = false,
  onToggleAnimation,
  onToggleSound,
}: WalletDropdownProps) => {
  const {
    isConnected,
    address,
    dnaBalance,
    usdcBalance,
    fcbccBalance,
    ownedGenomes,
    ownedDnaTickers,
    voteTickets,
    votes,
    shares,
    invites,
    connect,
    disconnect,
    inviteCode,
    fyreKeys
  } = useWallet();
  const {
    theme,
    toggleTheme
  } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [displayName, setDisplayName] = useState<{ displayName: string; type: 'base' | 'ens' | 'address' }>({ displayName: '', type: 'address' });
  const [isLoadingName, setIsLoadingName] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);

  // Resolve display name when address changes
  useEffect(() => {
    if (address) {
      setIsLoadingName(true);
      getDisplayName(address)
        .then((name) => {
          setDisplayName(name);
        })
        .catch((error) => {
          console.error('Error resolving display name:', error);
          setDisplayName({
            displayName: formatAddressForDisplay(address),
            type: 'address',
          });
        })
        .finally(() => {
          setIsLoadingName(false);
        });
    } else {
      setDisplayName({ displayName: 'Not Connected', type: 'address' });
    }
  }, [address]);
  
  // Calculate dropdown position when opening (fixed positioning relative to viewport)
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px spacing below button
        right: window.innerWidth - rect.right, // Distance from right edge
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
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

  const copyInviteLink = () => {
    navigator.clipboard.writeText('https://fyreapp1.fcbc.fun/connect');
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  return (
    <>
      <div className="relative">
        <button 
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)} 
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors",
            isConnected 
              ? "bg-secondary hover:bg-secondary/80"
              : "border border-border hover:bg-muted"
          )}
        >
          <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
          {isConnected ? (
            isLoadingName ? (
              <span className="text-xs font-sans text-muted-foreground">...</span>
            ) : displayName.type !== 'address' ? (
              <span className={cn(
                "text-xs font-sans truncate max-w-[100px]",
                displayName.type === 'base' && "text-primary",
                displayName.type === 'ens' && "text-primary"
              )}>
                {displayName.displayName}
              </span>
            ) : (
              <span className="text-xs font-sans text-foreground">{formatBalance(fcbccBalance)}</span>
            )
          ) : (
            <span className="text-xs font-sans text-muted-foreground hidden xs:inline">Connect</span>
          )}
        </button>

        {isOpen && dropdownPosition && createPortal(
          <div 
            ref={dropdownRef}
            className="fixed w-72 bg-card border border-border rounded-lg shadow-lg z-[100] animate-fade-in max-h-[80vh] overflow-y-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
          >
            {/* Not connected state - show prominent connect button */}
            {!isConnected && (
              <div className="p-4 border-b border-border">
                <button
                  onClick={() => {
                    connect();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg font-sans font-medium hover:bg-primary/90 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              </div>
            )}

            {/* Wallet Address with Base name/ENS */}
            <div className={cn("p-3 border-b border-border", !isConnected && "opacity-50")}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground font-sans">Wallet Address</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {isConnected ? (
                    isLoadingName ? (
                      <p className="text-xs text-muted-foreground font-sans">Loading...</p>
                    ) : (
                      <>
                        {/* Display name with priority: Base name > ENS name > truncated address */}
                        <p className={cn(
                          "text-xs font-sans truncate",
                          displayName.type === 'base' && "text-primary font-medium",
                          displayName.type === 'ens' && "text-primary",
                          displayName.type === 'address' && "font-mono text-foreground"
                        )}>
                          {displayName.displayName}
                        </p>
                        {/* Show full address below if we have a name */}
                        {displayName.type !== 'address' && address && (
                          <p className="font-mono text-[10px] text-muted-foreground truncate mt-0.5">
                            {formatAddressForDisplay(address)}
                          </p>
                        )}
                      </>
                    )
                  ) : (
                    <p className="text-xs text-muted-foreground font-sans">Not connected</p>
                  )}
                </div>
                <button 
                  onClick={copyAddress} 
                  className="p-1.5 hover:bg-muted rounded transition-colors flex-shrink-0"
                  disabled={!isConnected}
                >
                  {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                </button>
              </div>
            </div>

            {/* Balances */}
            <div className={cn("p-3 space-y-2 border-b border-border", !isConnected && "opacity-50")}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">Total DNA Tokens:</span>
                <span className="text-xs font-sans font-medium text-foreground">{isConnected ? formatBalance(dnaBalance) : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">USDC Balance:</span>
                <span className="text-xs font-sans font-medium text-foreground">{isConnected ? `$${usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">$FCBCC balance:</span>
                <span className="text-xs font-sans font-medium text-foreground">{isConnected ? formatBalance(fcbccBalance) : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">Owned DNA genomes:</span>
                <span className="text-xs font-sans font-medium text-foreground">{isConnected ? ownedGenomes.toLocaleString() : '-'}</span>
              </div>
              {isConnected && ownedDnaTickers.length > 0 && (
                <div className="flex flex-col gap-1 pt-1 border-t border-border">
                  <span className="text-[10px] font-sans text-muted-foreground">
                    DNA Tickers ({ownedDnaTickers.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {ownedDnaTickers.slice(0, 5).map((ticker, idx) => (
                      <span key={idx} className="text-[10px] font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {ticker}
                      </span>
                    ))}
                    {ownedDnaTickers.length > 5 && (
                      <span className="text-[10px] font-sans text-muted-foreground px-1.5 py-0.5">
                        +{ownedDnaTickers.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">Fyre Keys Balance:</span>
                <span className="text-xs font-sans font-medium text-foreground">{isConnected ? fyreKeys.toLocaleString() : '-'}</span>
              </div>
            </div>

            {/* Theme & Effects Toggles */}
            <div className="p-3 border-b border-border space-y-1">
              <button onClick={toggleTheme} className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors">
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">Click to toggle</span>
              </button>
              <button onClick={onToggleAnimation} className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors">
                <span className="flex items-center gap-2">
                  <Sparkles className={cn("w-3.5 h-3.5", animationEnabled && "text-primary")} />
                  <span>Animations</span>
                </span>
                <span className={cn("text-[10px]", animationEnabled ? "text-primary" : "text-muted-foreground")}>
                  {animationEnabled ? 'On' : 'Off'}
                </span>
              </button>
              <button onClick={onToggleSound} className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors">
                <span className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-primary" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>Wildlife Sounds</span>
                </span>
                <span className={cn("text-[10px]", soundEnabled ? "text-primary" : "text-muted-foreground")}>
                  {soundEnabled ? 'On' : 'Off'}
                </span>
              </button>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-1 border-b border-border">
              {invites > 0 && (
                <button onClick={copyInviteLink} className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors">
                  <span className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    <span>Invites ({invites})</span>
                  </span>
                  {inviteCopied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                </button>
              )}
              <button className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors">
                <Ticket className="w-3.5 h-3.5" />
                <span>Vote tickets {isConnected ? `(${voteTickets})` : '-'}</span>
              </button>
              <button 
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isConnected}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>My shares {isConnected ? `(${shares})` : '-'}</span>
              </button>
            </div>

            {/* Replay Onboarding */}
            <div className="p-3 border-b border-border space-y-1">
              <button 
                onClick={() => {
                  setShowOnboarding(true);
                  setIsOpen(false);
                }} 
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Replay Onboarding Guide</span>
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('enzymeAd:open'));
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>View FCbRWA Enzyme Ad</span>
              </button>
            </div>

            {/* Disconnect */}
            {isConnected && (
              <div className="p-3">
                <button onClick={() => {
              disconnect();
              setIsOpen(false);
            }} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-sans text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
      </div>
      
      {showOnboarding && (
        <OnboardingGuide forceShow={true} onClose={() => setShowOnboarding(false)} />
      )}
    </>
  );
};

export default WalletDropdown;
