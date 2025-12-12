import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Species } from '@/data/species';
import SpeciesCard from './SpeciesCard';
import { cn } from '@/lib/utils';

interface SpeciesGridProps {
  species: Species[];
  onSpeciesClick: (species: Species, index: number) => void;
  isFilterOpen: boolean;
}

const SpeciesGrid = ({ species, onSpeciesClick, isFilterOpen }: SpeciesGridProps) => {
  const [autoSlideIndex, setAutoSlideIndex] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

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

  const navigateSlide = (direction: 'prev' | 'next') => {
    resetIdleTimer();
    const maxSlides = Math.ceil(species.length / 4);
    setAutoSlideIndex((prev) => {
      if (direction === 'next') {
        return (prev + 1) % maxSlides;
      }
      return prev === 0 ? maxSlides - 1 : prev - 1;
    });
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
      {/* Navigation arrows for auto-slide mode */}
      {isIdle && (
        <>
          <button
            onClick={() => navigateSlide('prev')}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-card/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-card transition-colors animate-fade-in"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => navigateSlide('next')}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-card/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-card transition-colors animate-fade-in"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </>
      )}

      {/* Grid */}
      <div
        className={cn(
          "grid gap-2 sm:gap-3 transition-all duration-300",
          "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
          isFilterOpen && "md:grid-cols-3 lg:grid-cols-4"
        )}
      >
        {species.map((s, index) => (
          <div
            key={s.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <SpeciesCard
              species={s}
              onClick={() => onSpeciesClick(s, index)}
            />
          </div>
        ))}
      </div>

      {/* Slide indicators */}
      {isIdle && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30 animate-fade-in">
          {Array.from({ length: Math.ceil(species.length / 4) }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                resetIdleTimer();
                setAutoSlideIndex(i);
              }}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === autoSlideIndex ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SpeciesGrid;