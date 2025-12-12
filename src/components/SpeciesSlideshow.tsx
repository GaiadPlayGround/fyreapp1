import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Info, ChevronLeft, ChevronRight, X as XIcon, Share2 } from 'lucide-react';
import { Species, getStatusColor, getStatusLabel } from '@/data/species';
import { cn } from '@/lib/utils';
import VoteSquares from './VoteSquares';
import ShareButtons from './ShareButtons';

interface SpeciesSlideshowProps {
  species: Species[];
  initialIndex: number;
  onClose: () => void;
}

const SpeciesSlideshow = ({ species, initialIndex, onClose }: SpeciesSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInfo, setShowInfo] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    
    const distance = touchStartRef.current - touchEndRef.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        navigate('next');
      } else {
        navigate('prev');
      }
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const currentSpecies = species[currentIndex];

  const navigate = useCallback((direction: 'prev' | 'next') => {
    setCurrentIndex((prev) => {
      if (direction === 'next') {
        return (prev + 1) % species.length;
      }
      return prev === 0 ? species.length - 1 : prev - 1;
    });
    setShowInfo(false);
  }, [species.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'ArrowRight') navigate('next');
      if (e.key === 'Escape') onClose();
      if (e.key === 'i') setShowInfo((v) => !v);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onClose]);

  // Hide controls on idle
  useEffect(() => {
    const resetHideTimer = () => {
      setShowControls(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    };

    resetHideTimer();

    const events = ['mousemove', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, resetHideTimer);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetHideTimer);
      });
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-foreground">
      {/* Full-screen image with swipe support */}
      <div 
        className="absolute inset-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={currentSpecies.image}
          alt={currentSpecies.name}
          className="w-full h-full object-cover gallery-transition"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-foreground/30" />
      </div>

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 bg-card/10 backdrop-blur-sm rounded-full hover:bg-card/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-card" />
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={cn(
              "p-2 backdrop-blur-sm rounded-full transition-colors",
              showInfo ? "bg-card/30" : "bg-card/10 hover:bg-card/20"
            )}
          >
            <Info className="w-5 h-5 text-card" />
          </button>
        </div>

        {/* Species info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-24">
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-card mb-2">
              {currentSpecies.name}
            </h2>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "px-2 py-1 rounded-sm text-xs font-sans font-medium",
                  getStatusColor(currentSpecies.status),
                  currentSpecies.status === 'CR' ? 'text-card' : 'text-foreground'
                )}
              >
                {getStatusLabel(currentSpecies.status)}
              </span>
              <span className="text-card/70 font-sans text-sm">
                {currentSpecies.ticker}
              </span>
            </div>

            {/* Expanded info */}
            {showInfo && (
              <div className="mt-4 p-4 bg-card/10 backdrop-blur-sm rounded-md animate-fade-in">
                <p className="font-sans text-sm text-card/90 italic mb-2">
                  {currentSpecies.scientificName}
                </p>
                <p className="font-sans text-sm text-card/80 mb-3">
                  {currentSpecies.description}
                </p>
                <div className="flex gap-4 text-xs font-sans text-card/70">
                  <span>Population: {currentSpecies.population}</span>
                  <span>Region: {currentSpecies.region}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={() => navigate('prev')}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-card/10 backdrop-blur-sm rounded-full hover:bg-card/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-card" />
        </button>
        <button
          onClick={() => navigate('next')}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-card/10 backdrop-blur-sm rounded-full hover:bg-card/20 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-card" />
        </button>

        {/* Bottom action bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
          {/* Vote */}
          <VoteSquares speciesId={currentSpecies.id} initialVotes={currentSpecies.votes} />

          {/* Share toggle */}
          <button
            onClick={() => setShowShare(!showShare)}
            className={cn(
              "p-3 backdrop-blur-sm rounded-full transition-colors",
              showShare ? "bg-card/30" : "bg-card/10 hover:bg-card/20"
            )}
          >
            <Share2 className="w-5 h-5 text-card" />
          </button>
        </div>

        {/* Share buttons */}
        {showShare && (
          <div className="absolute bottom-20 right-6 animate-fade-in">
            <ShareButtons species={currentSpecies} />
          </div>
        )}

        {/* Progress indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {species.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === currentIndex ? "bg-card" : "bg-card/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpeciesSlideshow;