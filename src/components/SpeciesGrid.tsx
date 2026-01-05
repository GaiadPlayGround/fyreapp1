import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Species, getStatusColor, getStatusLabel } from '@/data/species';
import SpeciesCard from './SpeciesCard';
import { cn } from '@/lib/utils';
import { ViewMode } from './FilterDrawer';
import Footer from './Footer';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import ElectricBorder from './ElectricBorder';
import { getHabitatColor } from '@/utils/habitatColors';

interface SpeciesGridProps {
  species: Species[];
  onSpeciesClick: (species: Species, index: number) => void;
  viewMode: ViewMode;
  animationEnabled?: boolean;
}

const ITEMS_PER_PAGE_GRID_MOBILE = 60;
const ITEMS_PER_PAGE_LIST = 100;

const SpeciesGrid = ({
  species,
  onSpeciesClick,
  viewMode,
  animationEnabled = true,
}: SpeciesGridProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [autoSlideIndex, setAutoSlideIndex] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const { getBaseSquares } = useSpeciesStats();
  
  const itemsPerPage = viewMode === 'list' ? ITEMS_PER_PAGE_LIST : ITEMS_PER_PAGE_GRID_MOBILE;
  const totalPages = Math.ceil(species.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSpecies = species.slice(startIndex, startIndex + itemsPerPage);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [species.length, viewMode]);

  const navigatePage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(p => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageClick = (pageNum: number) => {
    setCurrentPage(pageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (species.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="font-serif text-base text-muted-foreground">No species found</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Grid View - Mobile optimized 4 columns */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-4 gap-1">
          {paginatedSpecies.map((s, index) => (
            <div 
              key={s.id} 
              className="animate-fade-in" 
              style={{ animationDelay: `${Math.min(index * 20, 300)}ms` }}
            >
              <SpeciesCard 
                species={{ ...s, votes: getBaseSquares(s.id) }} 
                onClick={() => onSpeciesClick(s, startIndex + index)} 
                compact
                animationEnabled={animationEnabled}
              />
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-1.5">
          {paginatedSpecies.map((s, index) => {
            const showElectricBorder = animationEnabled;
            const cardContent = (
              <div 
                onClick={() => onSpeciesClick(s, startIndex + index)} 
                className="flex items-center gap-3 p-2.5 bg-card rounded-lg active:bg-muted/50 cursor-pointer transition-colors"
              >
                <img src={s.image} alt={s.name} className="w-12 h-12 object-cover rounded-md" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-sm font-medium text-foreground truncate">
                    {s.name}
                  </h3>
                  <p className="font-sans text-[10px] text-muted-foreground italic truncate">
                    {s.scientificName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn(
                      "px-1 py-0.5 rounded-sm text-[8px] font-sans font-medium", 
                      getStatusColor(s.status), 
                      s.status === 'CR' ? 'text-card' : 'text-foreground'
                    )}>
                      {s.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-sans">
                      {s.ticker}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-sans font-medium text-foreground">
                    {getBaseSquares(s.id).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Base Squares</p>
                </div>
              </div>
            );

            return showElectricBorder ? (
              <ElectricBorder
                key={s.id}
                color={getHabitatColor(s.region, s.id)}
                speed={0.6}
                chaos={0.05}
                borderRadius={8}
                className="w-full animate-fade-in"
                style={{ animationDelay: `${Math.min(index * 15, 200)}ms` }}
              >
                {cardContent}
              </ElectricBorder>
            ) : (
              <div 
                key={s.id}
                className="w-full animate-fade-in border border-border rounded-lg"
                style={{ animationDelay: `${Math.min(index * 15, 200)}ms` }}
              >
                {cardContent}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 pb-4">
          <button 
            onClick={() => navigatePage('prev')} 
            disabled={currentPage === 1} 
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-card transition-colors", 
              currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-muted active:bg-muted"
            )}
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-1">
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
                  onClick={() => handlePageClick(pageNum)} 
                  className={cn(
                    "w-9 h-9 rounded-lg text-sm font-sans transition-colors", 
                    currentPage === pageNum 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-card border border-border hover:bg-muted active:bg-muted text-foreground"
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
              "w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-card transition-colors", 
              currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-muted active:bg-muted"
            )}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default SpeciesGrid;
