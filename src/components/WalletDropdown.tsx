import { useState, useRef, useEffect } from 'react';
import { Wallet, LogOut, Vote, Copy, Check, Users, Share2, Moon, Sun, Volume2, VolumeX, Sparkles, HelpCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useWalletIdentity } from '@/hooks/useWalletIdentity';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { cn } from '@/lib/utils';
import OnboardingGuide from './OnboardingGuide';
import { ConnectWallet, Wallet as OnchainWallet } from '@coinbase/onchainkit/wallet';
import { Avatar, Name, Identity } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

interface WalletDropdownProps {
  animationEnabled?: boolean;
  soundEnabled?: boolean;
  onToggleAnimation?: () => void;
  onToggleSound?: () => void;
}

const WalletDropdown = ({
  animationEnabled = true,
  soundEnabled = false,
  onToggleAnimation,
  onToggleSound,
}: WalletDropdownProps) => {
  const { votes, shares, invites, disconnect, inviteCode, totalVotes, totalShares } = useWallet();
  const { address, shortAddress, basename, isConnected } = useWalletIdentity();
  const { usdcBalance, fcbccBalance, isLoading: balancesLoading } = useWalletBalances();
  const { theme, toggleTheme } = useTheme();
  
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
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

  const copyInviteLink = () => {
    const code = inviteCode || 'ABC123';
    navigator.clipboard.writeText(`https://fcbc.fun/invite/${code}`);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <OnchainWallet>
        <ConnectWallet className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-sans border border-border rounded-md hover:bg-muted transition-colors">
          <Wallet className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Connect</span>
        </ConnectWallet>
      </OnchainWallet>
    );
  }

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors">
          <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-sans text-foreground truncate max-w-[80px]">
            {basename || shortAddress || '349m'}
          </span>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-lg shadow-lg z-50 animate-fade-in max-h-[80vh] overflow-y-auto">
            {/* Wallet Identity */}
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground font-sans">Wallet Address</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {address && (
                    <Identity address={address} chain={base} className="!bg-transparent !p-0">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6" />
                        <div className="flex-1 min-w-0">
                          <Name className="text-xs font-medium text-foreground" />
                          <p className="font-mono text-[10px] text-muted-foreground truncate">{shortAddress}</p>
                        </div>
                      </div>
                    </Identity>
                  )}
                </div>
                <button onClick={copyAddress} className="p-1.5 hover:bg-muted rounded transition-colors flex-shrink-0">
                  {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                </button>
              </div>
            </div>

            {/* Balances */}
            <div className="p-3 space-y-2 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">Total DNA Tokens held:</span>
                <span className="text-xs font-sans font-medium text-foreground">
                  {balancesLoading ? '...' : '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">USDC Balance:</span>
                <span className="text-xs font-sans font-medium text-foreground">
                  ${balancesLoading ? '...' : usdcBalance}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">$FCBCC balance:</span>
                <span className="text-xs font-sans font-medium text-foreground">
                  {balancesLoading ? '...' : fcbccBalance}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">Owned DNA genomes:</span>
                <span className="text-xs font-sans font-medium text-foreground">0</span>
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
              <button onClick={copyInviteLink} className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Invites ({invites})</span>
                </span>
                {inviteCopied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
              </button>
              <button className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors">
                <Vote className="w-3.5 h-3.5" />
                <span>Total Votes Cast: {totalVotes}</span>
              </button>
              <button className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors">
                <Share2 className="w-3.5 h-3.5" />
                <span>Total Shares: {totalShares}</span>
              </button>
            </div>

            {/* Replay Onboarding */}
            <div className="p-3 border-b border-border">
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
            </div>

            {/* Disconnect */}
            <div className="p-3">
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
      
      {showOnboarding && (
        <OnboardingGuide forceShow={true} onClose={() => setShowOnboarding(false)} />
      )}
    </>
  );
};

export default WalletDropdown;
