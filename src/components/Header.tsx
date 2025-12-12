import { Leaf, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import TasksDrawer from './TasksDrawer';

interface HeaderProps {
  onFilterToggle: () => void;
  isFilterOpen: boolean;
}

const Header = ({ onFilterToggle, isFilterOpen }: HeaderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [dnaCount] = useState(1250);

  const handleConnect = () => {
    setIsConnected(!isConnected);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-serif text-lg font-semibold text-foreground hidden sm:inline">
            PureBreed Explorer
          </span>
        </div>

        {/* Center: Title (visible on larger screens) */}
        <h1 className="font-serif text-xl font-medium text-foreground absolute left-1/2 -translate-x-1/2 hidden md:block">
          Endangered Species Gallery
        </h1>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <TasksDrawer />
          
          <Button
            variant="outline"
            size="sm"
            onClick={onFilterToggle}
            className="text-xs font-sans"
          >
            {isFilterOpen ? 'Close' : 'Filter'}
          </Button>

          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-sans text-foreground">{dnaCount.toLocaleString()} DNA</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnect}
              className="font-sans text-xs"
            >
              <Wallet className="w-4 h-4 mr-1.5" />
              Connect
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;