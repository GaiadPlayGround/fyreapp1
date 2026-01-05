import { Search, LayoutGrid, List, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConservationStatus } from '@/data/species';
import { SortOption, ViewMode } from './FilterDrawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface InlineFilterBarProps {
  selectedStatus: ConservationStatus | null;
  onStatusChange: (status: ConservationStatus | null) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchTicker: string;
  onSearchChange: (search: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const InlineFilterBar = ({
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  searchTicker,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: InlineFilterBarProps) => {
  const statuses: { value: ConservationStatus | null; label: string }[] = [
    { value: null, label: 'All Status' },
    { value: 'EN', label: 'Endangered' },
    { value: 'CR', label: 'Critically Endangered' },
    { value: 'VU', label: 'Vulnerable' },
    { value: 'NT', label: 'Near Threatened' },
    { value: 'LC', label: 'Least Concern' },
    { value: 'DD', label: 'Data Deficient' },
    { value: 'EX', label: 'Extinct' },
    { value: 'EW', label: 'Extinct in the Wild' },
    { value: 'NE', label: 'Near Extinct' },
  ];

  // Sort options order: ID (1-1234), Trending (global last viewed), Votes (most base squares), Shares (most shares), Newest (1234-1)
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'id', label: 'ID (1→)' },
    { value: 'trending', label: 'Trending' },
    { value: 'votes', label: 'Votes' },
    { value: 'shares', label: 'Shares' },
    { value: 'new', label: 'Newest' },
  ];

  const getStatusLabel = () => {
    const status = statuses.find(s => s.value === selectedStatus);
    return status?.label || 'All Status';
  };

  const getSortLabel = () => {
    const sort = sortOptions.find(s => s.value === sortBy);
    return sort?.label || 'ID';
  };

  const clearAll = () => {
    onStatusChange(null);
    onSortChange('id');
    onSearchChange('');
    onViewModeChange('grid');
  };

  const hasActiveFilters = selectedStatus !== null || sortBy !== 'id' || searchTicker !== '' || viewMode !== 'grid';

  return (
    <div className="flex items-center gap-2 px-3 py-3 bg-background">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchTicker}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by ID or Name..."
          className="w-full pl-9 pr-3 py-2 text-sm font-sans bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-2 text-sm font-sans text-foreground hover:bg-muted rounded-lg transition-colors whitespace-nowrap">
          {getSortLabel()}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[120px]">
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={cn(
                "text-sm font-sans cursor-pointer",
                sortBy === option.value && "bg-muted"
              )}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-2 text-sm font-sans text-foreground hover:bg-muted rounded-lg transition-colors whitespace-nowrap">
          {getStatusLabel()}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          {statuses.map((status) => (
            <DropdownMenuItem
              key={status.value || 'all'}
              onClick={() => onStatusChange(status.value)}
              className={cn(
                "text-sm font-sans cursor-pointer",
                selectedStatus === status.value && "bg-muted"
              )}
            >
              {status.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Mode Toggle */}
      <div className="flex items-center bg-muted rounded-lg p-0.5">
        <button
          onClick={() => onViewModeChange('grid')}
          className={cn(
            "p-2 rounded-md transition-colors",
            viewMode === 'grid'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={cn(
            "p-2 rounded-md transition-colors",
            viewMode === 'list'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 px-3 py-2 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          Clear All
        </button>
      )}
    </div>
  );
};

export default InlineFilterBar;
