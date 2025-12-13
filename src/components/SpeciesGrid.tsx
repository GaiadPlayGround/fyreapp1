import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Species, getStatusColor, getStatusLabel } from '@/data/species';
import SpeciesCard from './SpeciesCard';
import { cn } from '@/lib/utils';
import { ViewMode } from './FilterDrawer';

interface SpeciesGridProps {
  species: Species[];
  onSpeciesClick: (species: Species, index: number) => void;
  isFilterOpen: boolean;
  viewMode: ViewMode;
}

const ITEMS_PER_PAGE_GRID = 75; // 3 rows × 25 columns on mobile (practical: 12-20 items visible)
const ITEMS_PER_PAGE_LIST = 100;

const SpeciesGrid = ({ species, onSpeciesClick, isFilterOpen, viewMode }: SpeciesGridProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [autoSlideIndex, setAutoSlideIndex] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  const itemsPerPage = viewMode === 'list' ? ITEMS_PER_PAGE_LIST : ITEMS_PER_PAGE_GRID;
  const totalPages = Math.ceil(species.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSpecies = species.slice(startIndex, startIndex + itemsPerPage);

  // Reset idle timer on any interaction
  const resetIdleTimer = () => {
    setIsIdle(false);
    
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 15000); // 15 seconds idle time
  };

  // Start auto-slide when idle
  useEffect(() => {
    if (isIdle && species.length > 0) {
      autoSlideRef.current = setInterval(() => {
        setAutoSlideIndex((prev) => (prev + 1) % Math.ceil(species.length / 4));
      }, 3000);
    }

    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [isIdle, species.length]);

  // Set up event listeners for idle detection
  useEffect(() => {
    resetIdleTimer();

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [species.length, viewMode]);

  const navigatePage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage((p) => p - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  if (species.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="font-serif text-lg text-muted-foreground">No species found</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Grid View */}
      {viewMode === 'grid' && (
        <div
          className={cn(
            "grid gap-2 sm:gap-3 transition-all duration-300",
            "grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
            isFilterOpen && "md:grid-cols-3 lg:grid-cols-4"
          )}
        >
          {paginatedSpecies.map((s, index) => (
            <div
              key={s.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <SpeciesCard
                species={s}
                onClick={() => onSpeciesClick(s, startIndex + index)}
              />
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {paginatedSpecies.map((s, index) => (
            <div
              key={s.id}
              onClick={() => onSpeciesClick(s, startIndex + index)}
              className="flex items-center gap-4 p-3 bg-card rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 20}ms` }}
            >
              <img
                src={s.image}
                alt={s.name}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-base font-medium text-foreground truncate">
                  {s.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-sm text-[10px] font-sans font-medium",
                      getStatusColor(s.status),
                      s.status === 'CR' ? 'text-card' : 'text-foreground'
                    )}
                  >
                    {getStatusLabel(s.status)}
                  </span>
                  <span className="text-xs text-muted-foreground font-sans">
                    {s.ticker}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-sans text-foreground">{s.votes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">votes</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 pb-4">
          <button
            onClick={() => navigatePage('prev')}
            disabled={currentPage === 1}
            className={cn(
              "p-2 rounded-full border border-border transition-colors",
              currentPage === 1
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-muted"
            )}
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-md text-sm font-sans transition-colors",
                    currentPage === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => navigatePage('next')}
            disabled={currentPage === totalPages}
            className={cn(
              "p-2 rounded-full border border-border transition-colors",
              currentPage === totalPages
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-muted"
            )}
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SpeciesGrid;
