import { useState } from 'react';
import TasksDrawer from './TasksDrawer';
import WalletDropdown from './WalletDropdown';
import ThemeToggle from './ThemeToggle';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onFilterToggle: () => void;
  isFilterOpen: boolean;
}

const Header = ({ onFilterToggle, isFilterOpen }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden">
            {/* Placeholder for logo - will be replaced when user provides image */}
            <span className="text-primary-foreground font-serif font-bold text-sm">PB</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-serif text-lg font-semibold text-foreground leading-tight">
              PUREBREED NAVIGATOR
            </h1>
            <p className="text-[10px] font-sans text-muted-foreground">
              a product of fcbc.fun
            </p>
          </div>
        </div>

        {/* Mobile Title */}
        <div className="sm:hidden flex flex-col items-center">
          <h1 className="font-serif text-sm font-semibold text-foreground leading-tight">
            PUREBREED NAVIGATOR
          </h1>
          <p className="text-[8px] font-sans text-muted-foreground">
            a product of fcbc.fun
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <TasksDrawer />
          <ThemeToggle />
          
          <Button
            variant="outline"
            size="sm"
            onClick={onFilterToggle}
            className="text-xs font-sans"
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
