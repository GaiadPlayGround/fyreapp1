import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Info, ChevronLeft, ChevronRight, Share2, ExternalLink } from 'lucide-react';
import { Species, getStatusColor, getStatusLabel } from '@/data/species';
import { cn } from '@/lib/utils';
import VoteSquares from './VoteSquares';
import ShareButtons from './ShareButtons';
import SlideshowControls from './SlideshowControls';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface SpeciesSlideshowProps {
  species: Species[];
  initialIndex: number;
  onClose: () => void;
}

const SpeciesSlideshow = ({ species, initialIndex, onClose }: SpeciesSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInfo, setShowInfo] = useState(false);
  const [showArrows, setShowArrows] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState<number | null>(10);
  const [voteKey, setVoteKey] = useState(0); // Key to reset VoteSquares
  const arrowHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);

  const currentSpecies = species[currentIndex];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    showArrowsTemporarily();
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

  const showArrowsTemporarily = useCallback(() => {
    setShowArrows(true);
    if (arrowHideTimeoutRef.current) {
      clearTimeout(arrowHideTimeoutRef.current);
    }
    arrowHideTimeoutRef.current = setTimeout(() => {
      setShowArrows(false);
    }, 3000);
  }, []);

  const navigate = useCallback((direction: 'prev' | 'next') => {
    setCurrentIndex((prev) => {
      if (direction === 'next') {
        return (prev + 1) % species.length;
      }
      return prev === 0 ? species.length - 1 : prev - 1;
    });
    // Reset vote pane for new image
    setVoteKey((k) => k + 1);
    showArrowsTemporarily();
  }, [species.length, showArrowsTemporarily]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowInfo(false);
    }
  };

  // Auto-play effect
  useEffect(() => {
    if (autoPlayInterval !== null) {
      autoPlayRef.current = setInterval(() => {
        navigate('next');
      }, autoPlayInterval * 1000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlayInterval, navigate]);

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

  // Initial arrow hide after 3 seconds
  useEffect(() => {
    showArrowsTemporarily();
    return () => {
      if (arrowHideTimeoutRef.current) {
        clearTimeout(arrowHideTimeoutRef.current);
      }
    };
  }, [showArrowsTemporarily]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const truncateDescription = (text: string, maxWords: number = 50) => {
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  // Generate FCBC URL for this species
  const getFcbcUrl = () => {
    return `https://www.fcbc.fun/species/FCBC${currentSpecies.id}?code=9406/136251508`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground">
      {/* Full-screen image with swipe support */}
      <div 
        className="absolute inset-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleBackgroundClick}
      >
        <img
          src={currentSpecies.image}
          alt={currentSpecies.name}
          className="w-full h-full object-cover gallery-transition"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-foreground/30" />
      </div>

      {/* Top bar - Back arrow (left) and Info (right) */}
      <TooltipProvider>
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between safe-area-top z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onClose}
                className="p-2 bg-card/10 backdrop-blur-sm rounded-full hover:bg-card/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-card" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Back to gallery</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className={cn(
                  "p-2 backdrop-blur-sm rounded-full transition-colors",
                  showInfo ? "bg-card/30" : "bg-card/10 hover:bg-card/20"
                )}
              >
                <Info className="w-5 h-5 text-card" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Species details</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Navigation arrows - hide after 3 seconds */}
      <button
        onClick={() => navigate('prev')}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-card/10 backdrop-blur-sm rounded-full hover:bg-card/20 transition-all duration-300",
          showArrows ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronLeft className="w-6 h-6 text-card" />
      </button>
      <button
        onClick={() => navigate('next')}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-card/10 backdrop-blur-sm rounded-full hover:bg-card/20 transition-all duration-300",
          showArrows ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronRight className="w-6 h-6 text-card" />
      </button>

      {/* Species info - shows at bottom when info toggled */}
      {showInfo && (
        <div className="absolute bottom-32 left-4 right-4 z-10 animate-fade-in">
          <div className="p-4 bg-card/10 backdrop-blur-sm rounded-md">
            <h2 className="font-serif text-xl font-semibold text-card mb-1">
              {currentSpecies.name}
            </h2>
            <p className="font-sans text-sm text-card/90 italic mb-2">
              {currentSpecies.scientificName}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-sm text-xs font-sans font-medium",
                  getStatusColor(currentSpecies.status),
                  currentSpecies.status === 'CR' ? 'text-card' : 'text-foreground'
                )}
              >
                {getStatusLabel(currentSpecies.status)}
              </span>
              <span className="text-card/70 font-sans text-xs">
                {currentSpecies.ticker}
              </span>
            </div>
            <p className="font-sans text-sm text-card/80 mb-3">
              {truncateDescription(currentSpecies.description)}
            </p>
            <div className="flex gap-4 text-xs font-sans text-card/70 mb-3">
              <span>Population: {currentSpecies.population}</span>
              <span>Region: {currentSpecies.region}</span>
            </div>
            <a
              href={getFcbcUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-sans hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View PureBreed on FCBC
            </a>
          </div>
        </div>
      )}

      {/* Bottom left - Slideshow timer */}
      <div className="absolute bottom-6 left-4 safe-area-bottom z-10">
        <SlideshowControls
          interval={autoPlayInterval}
          onIntervalChange={setAutoPlayInterval}
        />
      </div>

      {/* Bottom center - Vote squares */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 safe-area-bottom z-10">
        <VoteSquares 
          key={`${currentSpecies.id}-${voteKey}`}
          speciesId={currentSpecies.id} 
          initialVotes={currentSpecies.votes} 
        />
      </div>

      {/* Bottom right - Share button */}
      <TooltipProvider>
        <div className="absolute bottom-6 right-4 safe-area-bottom z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowShare(!showShare)}
                className={cn(
                  "p-3 backdrop-blur-sm rounded-full transition-colors",
                  showShare ? "bg-card/30" : "bg-card/10 hover:bg-card/20"
                )}
              >
                <Share2 className="w-5 h-5 text-card" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Share species</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Share buttons popup */}
      {showShare && (
        <div className="absolute bottom-20 right-4 animate-fade-in safe-area-bottom z-10">
          <ShareButtons species={currentSpecies} />
        </div>
      )}
    </div>
  );
};

export default SpeciesSlideshow;