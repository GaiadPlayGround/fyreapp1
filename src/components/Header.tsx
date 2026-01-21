import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import WalletDropdown from './WalletDropdown';
import LeaderboardDialog from './LeaderboardDialog';
import FyreMissionsDialog from './FyreMissionsDialog';

import logo from '@/assets/logo.png';
import logoLight from '@/assets/logo-light.png';
import { useTheme } from '@/contexts/ThemeContext';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  animationEnabled?: boolean;
  soundEnabled?: boolean;
  onToggleAnimation?: () => void;
  onToggleSound?: () => void;
}

const TITLE_OPTIONS = ['FyreApp 1', 'Slideshow and Rankings'];

const Header = ({
  animationEnabled = true,
  soundEnabled = false,
  onToggleAnimation,
  onToggleSound,
}: HeaderProps) => {
  const { theme } = useTheme();
  const { votes, shares, isConnected, ownedDnaTickers } = useWallet();
  const currentLogo = theme === 'dark' ? logo : logoLight;
  const [titleIndex, setTitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % TITLE_OPTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top w-full max-w-full overflow-x-hidden">
      <div className="px-3 h-14 flex items-center justify-between w-full max-w-full">
        {/* Left: Logo and Title */}
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={currentLogo} alt="Fyre App 1" className="w-9 h-9 rounded-lg object-contain" />
          <h1 className="font-serif font-semibold text-foreground leading-tight text-base transition-all duration-300">
            {TITLE_OPTIONS[titleIndex]}
          </h1>
        </a>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <FyreMissionsDialog>
            <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Flame className="w-3.5 h-3.5" />
 
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
