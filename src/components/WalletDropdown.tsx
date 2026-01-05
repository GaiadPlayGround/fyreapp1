import { useState, useRef, useEffect } from 'react';
import { Wallet, Moon, Sun, Volume2, VolumeX, Sparkles, HelpCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import OnboardingGuide from './OnboardingGuide';

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
  const { theme, toggleTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-sans text-foreground">Menu</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-lg shadow-lg z-50 animate-fade-in max-h-[80vh] overflow-y-auto">
            <div className="p-3 border-b border-border">
              <p className="text-[10px] font-sans text-muted-foreground">
                Wallet features are temporarily disabled.
              </p>
            </div>

            {/* Theme & Effects Toggles */}
            <div className="p-3 border-b border-border space-y-1">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="w-3.5 h-3.5" />
                  ) : (
                    <Sun className="w-3.5 h-3.5" />
                  )}
                  <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">Click to toggle</span>
              </button>

              <button
                onClick={onToggleAnimation}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className={cn('w-3.5 h-3.5', animationEnabled && 'text-primary')} />
                  <span>Animations</span>
                </span>
                <span className={cn('text-[10px]', animationEnabled ? 'text-primary' : 'text-muted-foreground')}>
                  {animationEnabled ? 'On' : 'Off'}
                </span>
              </button>

              <button
                onClick={onToggleSound}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-sans text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <span className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                  <span>Wildlife Sounds</span>
                </span>
                <span className={cn('text-[10px]', soundEnabled ? 'text-primary' : 'text-muted-foreground')}>
                  {soundEnabled ? 'On' : 'Off'}
                </span>
              </button>
            </div>

            {/* Replay Onboarding */}
            <div className="p-3">
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

