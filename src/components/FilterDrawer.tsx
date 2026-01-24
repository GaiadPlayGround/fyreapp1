import { useState } from 'react';
import { X, LayoutGrid, List, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConservationStatus } from '@/data/species';

export type SortOption = 'votes' | 'shares' | 'mcap' | 'holders' | 'new' | 'id';
export type ViewMode = 'grid' | 'list';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStatus: ConservationStatus | null;
  onStatusChange: (status: ConservationStatus | null) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchTicker: string;
  onSearchChange: (search: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  animationEnabled?: boolean;
  soundEnabled?: boolean;
  onToggleAnimation?: () => void;
  onToggleSound?: () => void;
}

const FilterDrawer = ({
  isOpen,
  onClose,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  searchTicker,
  onSearchChange,
  viewMode,
  onViewModeChange,
  animationEnabled = true,
  soundEnabled = true,
  onToggleAnimation,
  onToggleSound,
}: FilterDrawerProps) => {
  const statuses: { value: ConservationStatus; label: string; color: string }[] = [
    { value: 'EN', label: 'Endangered', color: 'bg-status-en' },
    { value: 'NT', label: 'Near Threatened', color: 'bg-yellow-500' },
    { value: 'CR', label: 'Critically Endangered', color: 'bg-status-cr' },
    { value: 'DD', label: 'Data Deficient', color: 'bg-gray-500' },
    { value: 'VU', label: 'Vulnerable', color: 'bg-status-vu' },
    { value: 'LC', label: 'Least Concern', color: 'bg-green-500' },
    { value: 'EX', label: 'Extinct', color: 'bg-black' },
    { value: 'EW', label: 'Extinct in the Wild', color: 'bg-gray-800' },
    { value: 'NE', label: 'Near Extinct', color: 'bg-red-900' },
  ];

  const sortOptions: { value: SortOption; label: string; description: string }[] = [
    { value: 'votes', label: 'Base Squares', description: 'Highest Base Squares' },
    { value: 'id', label: 'ID', description: 'FCBC1 to FCBC234' },
    { value: 'shares', label: 'Shares', description: 'Most shared' },
    { value: 'mcap', label: 'MCap', description: 'Highest market cap' },
    { value: 'holders', label: 'Holders', description: 'Most holders' },
    { value: 'new', label: 'Newest', description: 'FCBC234 to FCBC1' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className="fixed inset-0 bg-foreground/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Bottom sheet for mobile, sidebar for desktop */}
      <div className={cn(
        "fixed z-40 bg-card border-border overflow-y-auto animate-slide-in-right",
        // Mobile: bottom sheet
        "inset-x-0 bottom-0 top-auto max-h-[70vh] rounded-t-2xl border-t",
        // Desktop: sidebar
        "md:top-14 md:left-0 md:right-auto md:bottom-0 md:w-64 md:max-h-none md:rounded-none md:border-r md:border-t-0"
      )}>
        {/* Mobile drag handle */}
        <div className="flex justify-center py-2 md:hidden">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base font-medium text-foreground">Filters</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Animation & Sound Toggles */}
          <div className="mb-4">
            <label className="block text-[10px] font-sans text-muted-foreground mb-1.5">
              Effects
            </label>
            <div className="flex gap-1">
              <button
                onClick={onToggleAnimation}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-sans rounded-md transition-colors",
                  animationEnabled
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted bg-muted"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Animation
              </button>
              <button
                onClick={onToggleSound}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-sans rounded-md transition-colors",
                  soundEnabled
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted bg-muted"
                )}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                Sound
              </button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="mb-4">
            <label className="block text-[10px] font-sans text-muted-foreground mb-1.5">
              View Mode
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-sans rounded-md transition-colors",
                  viewMode === 'grid'
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grid
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-sans rounded-md transition-colors",
                  viewMode === 'list'
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </div>

          {/* Search by Ticker */}
          <div className="mb-4">
            <label className="block text-[10px] font-sans text-muted-foreground mb-1.5">
              Search by Ticker
            </label>
            <input
              type="text"
              value={searchTicker}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="#123 or $FCBC..."
              className="w-full px-2.5 py-1.5 text-xs font-sans bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Sort Options */}
          <div className="mb-4">
            <label className="block text-[10px] font-sans text-muted-foreground mb-1.5">
              Sort By
            </label>
            <div className="flex flex-wrap gap-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  title={option.description}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-sans rounded-full transition-colors",
                    sortBy === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="mb-4">
            <label className="block text-[10px] font-sans text-muted-foreground mb-1.5">
              Conservation Status
            </label>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => onStatusChange(null)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-sans rounded-full transition-colors",
                  selectedStatus === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                All
              </button>
              {statuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => onStatusChange(status.value)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 text-[10px] font-sans rounded-full transition-colors",
                    selectedStatus === status.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", status.color)} />
                  {status.value}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterDrawer;
