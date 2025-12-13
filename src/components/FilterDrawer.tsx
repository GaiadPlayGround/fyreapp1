import { X, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConservationStatus } from '@/data/species';

export type SortOption = 'trending' | 'mcap' | 'new' | 'id' | 'votes';
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
}: FilterDrawerProps) => {
  const statuses: { value: ConservationStatus; label: string; color: string }[] = [
    { value: 'CR', label: 'Critically Endangered', color: 'bg-status-cr' },
    { value: 'EN', label: 'Endangered', color: 'bg-status-en' },
    { value: 'VU', label: 'Vulnerable', color: 'bg-status-vu' },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'trending', label: 'Trending' },
    { value: 'votes', label: 'Most Votes' },
    { value: 'mcap', label: 'Market Cap' },
    { value: 'new', label: 'Newest' },
    { value: 'id', label: 'ID' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-card border-r border-border z-40 animate-slide-in-right overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-lg font-medium text-foreground">Filters</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-sm transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6">
          <label className="block text-xs font-sans text-muted-foreground mb-2">
            View Mode
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-sans rounded-md transition-colors",
                viewMode === 'grid'
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-sans rounded-md transition-colors",
                viewMode === 'list'
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
        </div>

        {/* Search by Ticker */}
        <div className="mb-6">
          <label className="block text-xs font-sans text-muted-foreground mb-2">
            Search by Ticker
          </label>
          <input
            type="text"
            value={searchTicker}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="#123 or $FCBC..."
            className="w-full px-3 py-2 text-sm font-sans bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <label className="block text-xs font-sans text-muted-foreground mb-2">
            Conservation Status
          </label>
          <div className="space-y-1.5">
            <button
              onClick={() => onStatusChange(null)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm font-sans rounded-md transition-colors",
                selectedStatus === null
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              All Species
            </button>
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => onStatusChange(status.value)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm font-sans rounded-md transition-colors flex items-center gap-2",
                  selectedStatus === status.value
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", status.color)} />
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-xs font-sans text-muted-foreground mb-2">
            Sort By
          </label>
          <div className="space-y-1.5">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm font-sans rounded-md transition-colors",
                  sortBy === option.value
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
