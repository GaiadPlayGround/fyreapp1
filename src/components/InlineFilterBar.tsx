import { useState, useRef, useEffect } from 'react';
import { Search, LayoutGrid, List, X, ChevronDown, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConservationStatus } from '@/data/species';
import { SortOption, ViewMode } from './FilterDrawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Species } from '@/data/species';

export type PaymentCurrency = 'USDC' | 'ETH';

interface InlineFilterBarProps {
  selectedStatus: ConservationStatus | null;
  onStatusChange: (status: ConservationStatus | null) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchTicker: string;
  onSearchChange: (search: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  paymentCurrency?: PaymentCurrency;
  onPaymentCurrencyChange?: (currency: PaymentCurrency) => void;
  species?: Species[]; // For predictive search
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
  paymentCurrency = 'USDC',
  onPaymentCurrencyChange,
  species = [],
}: InlineFilterBarProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Species[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Generate search suggestions
  useEffect(() => {
    if (!searchTicker || searchTicker.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = searchTicker.toLowerCase();
    const filtered = species
      .filter((s) => {
        const nameMatch = s.name.toLowerCase().includes(searchLower);
        const tickerMatch = s.ticker?.toLowerCase().includes(searchLower) || s.symbol?.toLowerCase().includes(searchLower);
        const idMatch = s.id.toLowerCase().includes(searchLower);
        return nameMatch || tickerMatch || idMatch;
      })
      .slice(0, 5); // Limit to 5 suggestions

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [searchTicker, species]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'id', label: 'ID' },
    { value: 'votes', label: 'Votes' },
    { value: 'shares', label: 'Shares' },
    { value: 'mcap', label: 'MCap' },
    { value: 'holders', label: 'Holders' },
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
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 bg-background w-full overflow-x-auto scrollbar-hide">
      {/* Search Input with Predictive Dropdown */}
      <div ref={searchRef} className="flex-1 min-w-0 relative">
        <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 text-muted-foreground z-10" />
        <input
          type="text"
          value={searchTicker}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder="Search..."
          className="w-full pl-7 sm:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm font-sans bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
        />
        {/* Predictive Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSearchChange(s.name);
                  setShowSuggestions(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm font-sans"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.ticker || s.symbol}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-sans text-foreground hover:bg-muted rounded-lg transition-colors whitespace-nowrap shrink-0">
          <span className="hidden sm:inline">{getSortLabel()}</span>
          <span className="sm:hidden">Sort</span>
          <ChevronDown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground" />
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
        <DropdownMenuTrigger className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-sans text-foreground hover:bg-muted rounded-lg transition-colors whitespace-nowrap shrink-0">
          <span className="hidden sm:inline">{getStatusLabel()}</span>
          <span className="sm:hidden">Status</span>
          <ChevronDown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground" />
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

      {/* Payment Currency Selector */}
      {onPaymentCurrencyChange && (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-sans text-foreground hover:bg-muted rounded-lg transition-colors whitespace-nowrap shrink-0">
            <Coins className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-muted-foreground" />
            <span className="hidden sm:inline">{paymentCurrency}</span>
            <span className="sm:hidden">{paymentCurrency === 'USDC' ? 'USD' : 'ETH'}</span>
            <ChevronDown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            <DropdownMenuItem
              onClick={() => onPaymentCurrencyChange('USDC')}
              className={cn(
                "text-sm font-sans cursor-pointer",
                paymentCurrency === 'USDC' && "bg-muted"
              )}
            >
              USDC (Base)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onPaymentCurrencyChange('ETH')}
              className={cn(
                "text-sm font-sans cursor-pointer",
                paymentCurrency === 'ETH' && "bg-muted"
              )}
            >
              ETH (Base)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center bg-muted rounded-lg p-0.5 shrink-0">
        <button
          onClick={() => onViewModeChange('grid')}
          className={cn(
            "p-1.5 sm:p-2 rounded-md transition-colors",
            viewMode === 'grid'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={cn(
            "p-1.5 sm:p-2 rounded-md transition-colors",
            viewMode === 'list'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <List className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
        </button>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-sans text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
        >
          <span className="hidden sm:inline">Clear All</span>
          <span className="sm:hidden">Clear</span>
        </button>
      )}
    </div>
  );
};

export default InlineFilterBar;
