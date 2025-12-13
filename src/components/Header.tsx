import TasksDrawer from './TasksDrawer';
import WalletDropdown from './WalletDropdown';
import ThemeToggle from './ThemeToggle';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

interface HeaderProps {
  onFilterToggle: () => void;
  isFilterOpen: boolean;
}

const Header = ({ onFilterToggle, isFilterOpen }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
      <div className="px-3 h-14 flex items-center justify-between">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-2">
          <img 
            src={logo} 
            alt="PureBreed Navigator" 
            className="w-9 h-9 rounded-lg object-contain"
          />
          <h1 className="font-serif text-sm font-semibold text-foreground leading-tight">
            Fyre App 1
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <TasksDrawer />
          <ThemeToggle />
          
          <Button
            variant="outline"
            size="sm"
            onClick={onFilterToggle}
            className="text-[10px] font-sans h-8 px-2"
          >
            {isFilterOpen ? 'Close' : 'Filter'}
          </Button>

          <WalletDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;
