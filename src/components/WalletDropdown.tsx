import { useState, useRef, useEffect } from 'react';
import { Wallet, LogOut, Vote, Copy, Check, Users, Share2, Moon, Sun, Trophy } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

// Mock leaderboard data - Top 25
const MOCK_VOTERS = Array.from({ length: 25 }, (_, i) => ({
  rank: i + 1,
  name: `0x${Math.random().toString(16).slice(2, 5)}...${Math.random().toString(16).slice(2, 5)}`,
  score: Math.floor(3000 - i * 100 + Math.random() * 50)
}));

const MOCK_SHARERS = Array.from({ length: 25 }, (_, i) => ({
  rank: i + 1,
  name: `0x${Math.random().toString(16).slice(2, 5)}...${Math.random().toString(16).slice(2, 5)}`,
  score: Math.floor(200 - i * 7 + Math.random() * 5)
}));

const WalletDropdown = () => {
  const { isConnected, address, dnaBalance, usdcBalance, fcbccBalance, votes, shares, invites, connect, disconnect, inviteCode } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showVoters, setShowVoters] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowLeaderboard(false);
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

  const leaderboardData = showVoters ? MOCK_VOTERS : MOCK_SHARERS;

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
        <span className="text-xs font-sans text-foreground">349m</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-lg shadow-lg z-50 animate-fade-in max-h-[80vh] overflow-y-auto">
          {/* Wallet Address */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground font-sans">Wallet Address</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-xs text-foreground truncate flex-1">{address}</p>
              <button onClick={copyAddress} className="p-1.5 hover:bg-muted rounded transition-colors flex-shrink-0">
                {copied ? (
                  <Check className="w-3 h-3 text-primary" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Balances */}
          <div className="p-3 space-y-2 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-muted-foreground">Total DNA Tokens:</span>
              <span className="text-xs font-sans font-medium text-foreground">349m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-muted-foreground">USDC Balance:</span>
              <span className="text-xs font-sans font-medium text-foreground">${usdcBalance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-muted-foreground">$FCBCC balance:</span>
              <span className="text-xs font-sans font-medium text-foreground">{fcbccBalance.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-muted-foreground">Owned FCBC DNA units:</span>
              <span className="text-xs font-sans font-medium text-foreground">{dnaBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="p-3 border-b border-border">
            <button 
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <span className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </span>
              <span className="text-[10px] text-muted-foreground">Click to toggle</span>
            </button>
          </div>

          {/* Actions */}
          <div className="p-3 space-y-1 border-b border-border">
            <button 
              onClick={copyInviteLink}
              className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                <span>Invites ({invites})</span>
              </span>
              {inviteCopied ? (
                <Check className="w-3 h-3 text-primary" />
              ) : (
                <Copy className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
            <button className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors">
              <Vote className="w-3.5 h-3.5" />
              <span>Vote tickets ({votes.length})</span>
            </button>
            <button className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors">
              <Share2 className="w-3.5 h-3.5" />
              <span>My shares ({shares})</span>
            </button>
          </div>

          {/* Leaderboard Toggle */}
          <div className="p-3 border-b border-border">
            <button 
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <span className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5" />
                <span>Leaderboard (Top 25)</span>
              </span>
              <span className="text-[10px] text-muted-foreground">{showLeaderboard ? 'Hide' : 'Show'}</span>
            </button>
          </div>

          {/* Leaderboard */}
          {showLeaderboard && (
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-sans text-muted-foreground">
                  Top 25
                </label>
                <div className="flex bg-muted rounded-full p-0.5">
                  <button
                    onClick={() => setShowVoters(true)}
                    className={cn(
                      "px-2 py-0.5 text-[9px] font-sans rounded-full transition-colors",
                      showVoters ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    Voters
                  </button>
                  <button
                    onClick={() => setShowVoters(false)}
                    className={cn(
                      "px-2 py-0.5 text-[9px] font-sans rounded-full transition-colors",
                      !showVoters ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    Sharers
                  </button>
                </div>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {leaderboardData.map((entry) => (
                  <div key={entry.rank} className="flex items-center justify-between text-[10px] font-sans py-1 px-1.5 bg-muted/50 rounded">
                    <span className="text-muted-foreground w-4">{entry.rank}.</span>
                    <span className="text-foreground flex-1 ml-1.5 truncate">{entry.name}</span>
                    <span className="text-muted-foreground">{entry.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
  );
};

export default WalletDropdown;
