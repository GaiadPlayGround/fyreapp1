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
const ITEMS_PER_PAGE_GRID_MOBILE = 60; // 4 columns × 15 rows (keeping 60 for mobile grid)
const ITEMS_PER_PAGE_LIST = 100;
const SpeciesGrid = ({
  species,
  onSpeciesClick,
  isFilterOpen,
  viewMode
}: SpeciesGridProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [autoSlideIndex, setAutoSlideIndex] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const itemsPerPage = viewMode === 'list' ? ITEMS_PER_PAGE_LIST : ITEMS_PER_PAGE_GRID_MOBILE;
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
    }, 15000);
  };

  // Start auto-slide when idle
  useEffect(() => {
    if (isIdle && species.length > 0) {
      autoSlideRef.current = setInterval(() => {
        setAutoSlideIndex(prev => (prev + 1) % Math.ceil(species.length / 4));
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
    events.forEach(event => {
      window.addEventListener(event, resetIdleTimer);
    });
    return () => {
      events.forEach(event => {
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
      setCurrentPage(p => p - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(p => p + 1);
    }
  };
  if (species.length === 0) {
    return <div className="flex items-center justify-center min-h-[50vh]">
        <p className="font-serif text-base text-muted-foreground">No species found</p>
      </div>;
  }
  return <div className="relative">
      {/* Grid View - Mobile optimized 4 columns */}
      {viewMode === 'grid' && <div className="grid grid-cols-4 gap-1">
          {paginatedSpecies.map((s, index) => <div key={s.id} className="animate-fade-in" style={{
        animationDelay: `${Math.min(index * 20, 300)}ms`
      }}>
              <SpeciesCard species={s} onClick={() => onSpeciesClick(s, startIndex + index)} compact />
            </div>)}
        </div>}

      {/* List View */}
      {viewMode === 'list' && <div className="space-y-1.5">
          {paginatedSpecies.map((s, index) => <div key={s.id} onClick={() => onSpeciesClick(s, startIndex + index)} className="flex items-center gap-3 p-2.5 bg-card rounded-lg border border-border active:bg-muted/50 cursor-pointer transition-colors animate-fade-in" style={{
        animationDelay: `${Math.min(index * 15, 200)}ms`
      }}>
              <img src={s.image} alt={s.name} className="w-12 h-12 object-cover rounded-md" />
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-sm font-medium text-foreground truncate">
                  {s.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn("px-1 py-0.5 rounded-sm text-[8px] font-sans font-medium", getStatusColor(s.status), s.status === 'CR' ? 'text-card' : 'text-foreground')}>
                    {s.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-sans">
                    {s.ticker}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-sans font-medium text-foreground">{s.votes.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Base Squares</p>
              </div>
            </div>)}
        </div>}

      {/* Pagination - Styled like reference */}
      {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-6 pb-4">
          <button onClick={() => navigatePage('prev')} disabled={currentPage === 1} className={cn("w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-card transition-colors", currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-muted active:bg-muted")}>
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({
          length: Math.min(5, totalPages)
        }, (_, i) => {
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
          return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={cn("w-9 h-9 rounded-lg text-sm font-sans transition-colors", currentPage === pageNum ? "bg-blue-500 text-white" : "bg-card border border-border hover:bg-muted active:bg-muted text-foreground")}>
                  {pageNum}
                </button>;
        })}
          </div>

          <button onClick={() => navigatePage('next')} disabled={currentPage === totalPages} className={cn("w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-card transition-colors", currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-muted active:bg-muted")}>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>}

      {/* Footer */}
      <footer className="text-center py-6 mt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          © 2025 Fyre App 1 • <span className="text-foreground">Powered by FCBC</span>
        </p>
      </footer>
    </div>;
};
export default SpeciesGrid;