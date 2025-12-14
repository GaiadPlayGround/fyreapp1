import { useState } from 'react';
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

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'trending', label: 'Trending' },
    { value: 'votes', label: 'Votes' },
    { value: 'mcap', label: 'Shares' },
    { value: 'new', label: 'Newest' },
    { value: 'id', label: 'ID' },
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

          {/* Top 5 Leaderboard */}
          <Leaderboard />
        </div>
      </div>
    </>
  );
};

// Mock leaderboard data
const MOCK_VOTERS = [
  { rank: 1, name: '0x7a3...f2c', score: 2847 },
  { rank: 2, name: '0x9b1...e8d', score: 2341 },
  { rank: 3, name: '0x4c2...a1b', score: 1956 },
  { rank: 4, name: '0x8f3...c9e', score: 1678 },
  { rank: 5, name: '0x2d4...b7a', score: 1423 },
];

const MOCK_SHARERS = [
  { rank: 1, name: '0x5e2...d4f', score: 156 },
  { rank: 2, name: '0x7a3...f2c', score: 134 },
  { rank: 3, name: '0x1c8...a3e', score: 98 },
  { rank: 4, name: '0x9b1...e8d', score: 87 },
  { rank: 5, name: '0x6f5...c2d', score: 72 },
];

const Leaderboard = () => {
  const [showVoters, setShowVoters] = useState(true);
  const data = showVoters ? MOCK_VOTERS : MOCK_SHARERS;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-sans text-muted-foreground">
          Top 5
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
      <div className="space-y-1">
        {data.map((entry) => (
          <div key={entry.rank} className="flex items-center justify-between text-[10px] font-sans py-1 px-1.5 bg-muted/50 rounded">
            <span className="text-muted-foreground">{entry.rank}.</span>
            <span className="text-foreground flex-1 ml-1.5 truncate">{entry.name}</span>
            <span className="text-muted-foreground">{entry.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterDrawer;
