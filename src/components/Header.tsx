import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import WalletDropdown from './WalletDropdown';
import LeaderboardDialog from './LeaderboardDialog';
import FyreMissionsDialog from './FyreMissionsDialog';

import logo from '@/assets/logo.png';
import logoLight from '@/assets/logo-light.png';
import { useTheme } from '@/contexts/ThemeContext';
import { useWallet } from '@/contexts/WalletContext';

interface HeaderProps {
  animationEnabled?: boolean;
  soundEnabled?: boolean;
  onToggleAnimation?: () => void;
  onToggleSound?: () => void;
}

const TITLE_OPTIONS = ['FyreApp 1', 'Slideshows and Votes'];

const Header = ({
  animationEnabled = true,
  soundEnabled = false,
  onToggleAnimation,
  onToggleSound,
}: HeaderProps) => {
  const { theme } = useTheme();
  const { votes, shares } = useWallet();
  const currentLogo = theme === 'dark' ? logo : logoLight;
  const [titleIndex, setTitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % TITLE_OPTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
      <div className="px-3 h-14 flex items-center justify-between">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-2">
          <img src={currentLogo} alt="Fyre App 1" className="w-9 h-9 rounded-lg object-contain" />
          <h1 className="font-serif font-semibold text-foreground leading-tight text-base transition-all duration-300">
            {TITLE_OPTIONS[titleIndex]}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <FyreMissionsDialog>
            <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Flame className="w-3.5 h-3.5" />
              <span className="font-sans">{votes.length + shares}/27</span>
            </button>
          </FyreMissionsDialog>
          
          <LeaderboardDialog />

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
