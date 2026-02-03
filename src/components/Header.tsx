import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import WalletDropdown from './WalletDropdown';
import LeaderboardDialog from './LeaderboardDialog';
import FyreMissionsDialog from './FyreMissionsDialog';
import { useTheme } from '@/contexts/ThemeContext';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  animationEnabled?: boolean;
  soundEnabled?: boolean;
  onToggleAnimation?: () => void;
  onToggleSound?: () => void;
  showTitle?: boolean; // Control whether to show title text
}

const TITLE_OPTIONS = ['FyreApp 1', 'Slideshow and Rankings'];

const Header = ({
  animationEnabled = true,
  soundEnabled = false,
  onToggleAnimation,
  onToggleSound,
  showTitle = true, // Default to true for backward compatibility
}: HeaderProps) => {
  const { theme } = useTheme();
  const { votes, shares, isConnected, ownedDnaTickers } = useWallet();
  // Use logos from public folder: logo.png for dark mode, logo-black.png for light mode
  const currentLogo = theme === 'dark' ? '/logo.png' : '/logo-black.png';
  const [titleIndex, setTitleIndex] = useState(0);

  useEffect(() => {
    if (!showTitle) return; // Don't rotate titles if not showing
    
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % TITLE_OPTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [showTitle]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 overflow-y-clip bg-background/95 backdrop-blur-sm border-b border-border safe-area-top w-full max-w-full overflow-x-hidden">
      <div className="px-3 h-14 flex items-center justify-between w-full max-w-full">
        {/* Left: Logo and Title */}
        <a href="/" className="flex items-start gap-2 hover:opacity-80 transition-opacity">
          <img src={currentLogo} alt="Fyre App 1" className="w-[5em] h-[3em] rounded-lg object-contain" />
          {showTitle && (
            <h1 className="font-serif font-semibold text-foreground leading-tight text-[0.7em] sm:text-base transition-all duration-300">
              {TITLE_OPTIONS[titleIndex]}
            </h1>
          )}
        </a>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <FyreMissionsDialog>
            <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
              <span className="font-sans">{votes.length + shares}/27</span>
            </button>
          </FyreMissionsDialog>
          
          <LeaderboardDialog />

          {/* Connection Status Indicator */}
          {isConnected && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
              <div className="relative">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-primary rounded-full animate-ping opacity-75" />
              </div>
              <span className="text-[10px] font-sans text-primary font-medium hidden xs:inline">Connected</span>
            </div>
          )}

          <WalletDropdown
            animationEnabled={animationEnabled}
            soundEnabled={soundEnabled}
            onToggleAnimation={onToggleAnimation}
            onToggleSound={onToggleSound}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
