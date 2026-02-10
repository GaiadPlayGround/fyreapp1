import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, LogOut, Vote, Copy, Check, Users, Share2, Moon, Sun, Volume2, VolumeX, Sparkles, HelpCircle, Ticket, Settings, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { getDisplayName, formatAddressForDisplay } from '@/lib/nameResolution';
import OnboardingGuide from './OnboardingGuide';
import type { PaymentCurrency } from '@/components/InlineFilterBar';
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
  const [showHoldingsDialog, setShowHoldingsDialog] = useState(false);
  const [holdingsExpanded, setHoldingsExpanded] = useState(50);
  const [displayName, setDisplayName] = useState<{ displayName: string; type: 'base' | 'ens' | 'address' }>({ displayName: '', type: 'address' });
  const [isLoadingName, setIsLoadingName] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  
  // Buy settings state
  const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency>(() => {
    const saved = localStorage.getItem('fyreapp-payment-currency');
    return (saved as PaymentCurrency) || 'USDC';
  });
  const [quickBuyAmount, setQuickBuyAmount] = useState<number>(() => {
    const saved = localStorage.getItem('fyreapp-quick-buy-amount');
    return saved ? parseFloat(saved) : 1;
  });
  const [showBuySettings, setShowBuySettings] = useState(false);
  const quickBuyAmounts = [0.5, 1, 2, 3, 5, 10];

  // Save buy settings to localStorage and notify other components
  useEffect(() => {
    localStorage.setItem('fyreapp-payment-currency', paymentCurrency);
    window.dispatchEvent(new CustomEvent('buySettingsChanged'));
  }, [paymentCurrency]);

  useEffect(() => {
    localStorage.setItem('fyreapp-quick-buy-amount', quickBuyAmount.toString());
    window.dispatchEvent(new CustomEvent('buySettingsChanged'));
  }, [quickBuyAmount]);

  // Listen for buy settings changes from other components
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCurrency = localStorage.getItem('fyreapp-payment-currency') as PaymentCurrency;
      const savedAmount = localStorage.getItem('fyreapp-quick-buy-amount');
      if (savedCurrency && savedCurrency !== paymentCurrency) setPaymentCurrency(savedCurrency);
      if (savedAmount && parseFloat(savedAmount) !== quickBuyAmount) setQuickBuyAmount(parseFloat(savedAmount));
    };
    window.addEventListener('buySettingsChanged', handleStorageChange);
    return () => window.removeEventListener('buySettingsChanged', handleStorageChange);
  }, [paymentCurrency, quickBuyAmount]);

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
    const link = inviteCode 
      ? `https://1.fcbc.fun/connect?ref=${inviteCode}`
      : 'https://1.fcbc.fun/connect';
    navigator.clipboard.writeText(link);
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
            "flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors relative",
            isConnected 
              ? "bg-secondary hover:bg-secondary/80"
              : "border border-border hover:bg-muted"
          )}
        >
          <div className="relative">
            <Wallet className={cn("w-3.5 h-3.5", isConnected ? "text-primary" : "text-muted-foreground")} />
            {isConnected && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
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
              <span className="text-xs font-sans text-foreground">{formatBalance(dnaBalance)} DNA</span>
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
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-sans font-medium text-foreground">{isConnected ? formatBalance(dnaBalance) : '-'}</span>
                  {isConnected && ownedDnaTickers.length > 0 && (
                    <button 
                      onClick={() => setShowHoldingsDialog(true)}
                      className="p-0.5 hover:bg-muted rounded transition-colors"
                      title="View holdings breakdown"
                    >
                      <BarChart3 className="w-3 h-3 text-primary" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">USDC Balance:</span>
                <span className="text-xs font-sans font-medium text-foreground">{isConnected ? `$${usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">Warplette balance:</span>
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
              <button className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors">
                <span className="flex items-center gap-2">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Vote Tickets</span>
                </span>
                <span className="text-xs font-medium">{isConnected ? voteTickets : '-'}</span>
              </button>
              <button 
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>My Shares</span>
                </span>
                <span className="text-xs font-medium">{isConnected ? shares : '-'}</span>
              </button>
              <div className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground rounded-md">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>My Invites</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{isConnected ? invites : '-'}</span>
                  <button onClick={copyInviteLink} className="p-0.5 hover:bg-muted rounded transition-colors">
                    {inviteCopied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Buy Settings Section */}
            <div className="p-3 border-b border-border space-y-2">
              <button 
                onClick={() => setShowBuySettings(!showBuySettings)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Buy Settings</span>
                </span>
                <span className="text-[10px] text-primary font-medium">${quickBuyAmount} {paymentCurrency}</span>
              </button>
              
              {showBuySettings && (
                <div className="space-y-3 px-2 py-2 bg-muted/30 rounded-lg">
                  {/* Currency Selection */}
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">Currency</div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setPaymentCurrency('USDC')}
                        className={cn(
                          "flex-1 px-2 py-1 text-[10px] font-sans rounded-md border transition-all",
                          paymentCurrency === 'USDC' 
                            ? "border-primary bg-primary/10 text-foreground" 
                            : "border-border text-muted-foreground hover:border-border"
                        )}
                      >
                        USDC
                      </button>
                      <button
                        onClick={() => setPaymentCurrency('ETH')}
                        className={cn(
                          "flex-1 px-2 py-1 text-[10px] font-sans rounded-md border transition-all",
                          paymentCurrency === 'ETH' 
                            ? "border-primary bg-primary/10 text-foreground" 
                            : "border-border text-muted-foreground hover:border-border"
                        )}
                      >
                        ETH
                      </button>
                    </div>
                  </div>
                  
                  {/* Amount Selection */}
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">Amount</div>
                    <div className="grid grid-cols-3 gap-1">
                      {quickBuyAmounts.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setQuickBuyAmount(amount)}
                          className={cn(
                            "px-2 py-1 text-[10px] font-sans rounded-md border transition-all",
                            quickBuyAmount === amount 
                              ? "border-primary bg-primary/10 text-foreground" 
                              : "border-border text-muted-foreground hover:border-border"
                          )}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
      
      {/* Holdings Breakdown Dialog */}
      {showHoldingsDialog && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowHoldingsDialog(false)}>
          <div className="w-72 max-h-[70vh] bg-card border border-border rounded-lg shadow-lg animate-fade-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans font-medium text-foreground">Holdings Breakdown</span>
                <button onClick={() => setShowHoldingsDialog(false)} className="text-muted-foreground hover:text-foreground">
                  <span className="text-xs">✕</span>
                </button>
              </div>
              <div className="text-lg font-serif font-bold text-foreground mt-1">{formatBalance(dnaBalance)} DNA</div>
              <span className="text-[10px] text-muted-foreground">{ownedDnaTickers.length} genomes held</span>
            </div>
            <div className="p-2 overflow-y-auto max-h-[50vh]">
              <div className="space-y-1">
                {ownedDnaTickers.slice(0, holdingsExpanded).map((ticker, idx) => (
                  <div key={idx} className="flex items-center justify-between px-2 py-1 text-[10px] font-mono rounded hover:bg-muted/50">
                    <span className="text-primary font-medium">{ticker}</span>
                    <span className="text-muted-foreground">#{idx + 1}</span>
                  </div>
                ))}
              </div>
              {ownedDnaTickers.length > holdingsExpanded && (
                <button
                  onClick={() => setHoldingsExpanded((prev) => prev + 50)}
                  className="w-full mt-2 py-1.5 text-[10px] font-sans text-primary hover:bg-primary/10 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronDown className="w-3 h-3" />
                  Show more ({ownedDnaTickers.length - holdingsExpanded} remaining)
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default WalletDropdown;
