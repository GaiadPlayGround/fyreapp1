import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Info, ChevronLeft, ChevronRight, Share2, ExternalLink, Volume2, VolumeX, Pause, Play, X, MousePointerClick, Copy, Check } from 'lucide-react';
import { Species, getStatusColor, getStatusLabel } from '@/data/species';
import { cn } from '@/lib/utils';
import VoteSquares from './VoteSquares';
import ShareButtons from './ShareButtons';
import SlideshowControls from './SlideshowControls';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useElevenLabsVoice, ELEVENLABS_VOICES } from '@/hooks/useElevenLabsVoice';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';

interface SpeciesSlideshowProps {
  species: Species[];
  initialIndex: number;
  onClose: () => void;
}

// Trigger haptic feedback on mobile
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

// Analyze image brightness (simplified - assumes animal images are typically darker on edges)
const getTextColorForBackground = (brightness: 'light' | 'dark' = 'dark') => {
  return brightness === 'light' ? 'text-black' : 'text-white';
};

const CONTRACT_ADDRESS = '0x17d8d3c956a9b2d72257d7c9624cfcfd8ba8672b';

const SpeciesSlideshow = ({ species, initialIndex, onClose }: SpeciesSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInfo, setShowInfo] = useState(false);
  const [showArrows, setShowArrows] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState<number | null>(10);
  const [isPaused, setIsPaused] = useState(false);
  const [voteKey, setVoteKey] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [iconsVisible, setIconsVisible] = useState(true);
  const [arrowsHoverActive, setArrowsHoverActive] = useState(false);
  const [contractCopied, setContractCopied] = useState(false);
  
  const arrowHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  const currentSpecies = species[currentIndex];
  const { speakSpeciesName, stopSpeaking, voices, selectedVoice, setSelectedVoice, isLoading: voiceLoading, useFallback } = useElevenLabsVoice();
  const { recordView } = useSpeciesStats();
  const { address } = useWallet();

  const copyContractAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setContractCopied(true);
    toast({
      title: "Copied!",
      description: "Contract address copied to clipboard",
      duration: 1500,
    });
    setTimeout(() => setContractCopied(false), 2000);
  };

  const handleDoubleTap = () => {
    toast({
      title: "Coming Soon!",
      description: "Double-tap to buy $1 USDC worth of DNA tokens",
      duration: 2000,
    });
  };

  // Reset idle timer on any interaction
  const resetIdleTimer = useCallback(() => {
    setIconsVisible(true);
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = setTimeout(() => {
      if (!showInfo) {
        setIconsVisible(false);
      }
    }, 15000);
  }, [showInfo]);

  // Speak species name when voice is enabled and slide changes
  useEffect(() => {
    if (voiceEnabled && currentSpecies) {
      speakSpeciesName(currentSpecies.name);
    }
  }, [currentIndex, voiceEnabled, currentSpecies, speakSpeciesName]);

  // Record view when species changes
  useEffect(() => {
    if (currentSpecies) {
      recordView(currentSpecies.id, address || undefined);
    }
  }, [currentSpecies?.id, address, recordView]);

  // Stop speaking when voice is disabled
  useEffect(() => {
    if (!voiceEnabled) {
      stopSpeaking();
    }
  }, [voiceEnabled, stopSpeaking]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    showArrowsTemporarily();
    resetIdleTimer();
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
      if (!arrowsHoverActive) {
        setShowArrows(false);
      }
    }, 3000);
  }, [arrowsHoverActive]);

  const navigate = useCallback((direction: 'prev' | 'next') => {
    setCurrentIndex((prev) => {
      if (direction === 'next') {
        return (prev + 1) % species.length;
      }
      return prev === 0 ? species.length - 1 : prev - 1;
    });
    setVoteKey((k) => k + 1);
    showArrowsTemporarily();
    resetIdleTimer();
  }, [species.length, showArrowsTemporarily, resetIdleTimer]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowInfo(false);
      resetIdleTimer();
    }
  };

  const handleIconClick = (callback: () => void) => {
    triggerHaptic();
    callback();
    resetIdleTimer();
  };

  // Auto-play effect
  useEffect(() => {
    if (autoPlayInterval !== null && !isPaused) {
      autoPlayRef.current = setInterval(() => {
        navigate('next');
      }, autoPlayInterval * 1000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlayInterval, isPaused, navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'ArrowRight') navigate('next');
      if (e.key === 'Escape') onClose();
      if (e.key === 'i') setShowInfo((v) => !v);
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onClose]);

  // Initial arrow hide and idle timer setup
  useEffect(() => {
    showArrowsTemporarily();
    resetIdleTimer();
    return () => {
      if (arrowHideTimeoutRef.current) clearTimeout(arrowHideTimeoutRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [showArrowsTemporarily, resetIdleTimer]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Mouse move on edges for arrows
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const edgeThreshold = 100;
    const x = e.clientX - rect.left;
    
    if (x < edgeThreshold || x > rect.width - edgeThreshold) {
      setArrowsHoverActive(true);
      setShowArrows(true);
    } else {
      setArrowsHoverActive(false);
    }
    
    resetIdleTimer();
  }, [resetIdleTimer]);

  const truncateDescription = (text: string, maxWords: number = 50) => {
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const getFcbcUrl = () => {
    // Build URL using symbol and code from species data
    const speciesSymbol = currentSpecies.symbol || `FCBC${currentSpecies.id.replace(/\D/g, '')}`;
    const speciesCode = (currentSpecies as any).code || `${currentSpecies.id.replace(/\D/g, '')}0/12345678`;
    return `https://www.fcbc.fun/species/${speciesSymbol}?code=${speciesCode}`;
  };

  // Dynamic text color based on position (bottom area is usually darker)
  const infoTextColor = 'text-white';
  const infoTextColorMuted = 'text-white/80';

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-foreground"
      onMouseMove={handleMouseMove}
      onClick={() => resetIdleTimer()}
    >
      {/* Full-screen image - show entire animal with object-contain */}
      <div 
        className="absolute inset-0 bg-foreground"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleBackgroundClick}
      >
        <img
          src={currentSpecies.image}
          alt={currentSpecies.name}
          className="w-full h-full object-contain gallery-transition"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-foreground/30" />
      </div>

      {/* Top bar - Back arrow, Pause (left) and Info/Voice (right) */}
      <TooltipProvider>
        <div className={cn(
          "absolute top-0 left-0 right-0 p-4 flex items-center justify-between safe-area-top z-10 transition-opacity duration-300",
          iconsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleIconClick(onClose)}
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
                  onClick={() => handleIconClick(() => setIsPaused(!isPaused))}
                  className={cn(
                    "p-2 backdrop-blur-sm rounded-full transition-colors",
                    isPaused ? "bg-primary/30" : "bg-card/10 hover:bg-card/20"
                  )}
                >
                  {isPaused ? (
                    <Play className="w-5 h-5 text-card" />
                  ) : (
                    <Pause className="w-5 h-5 text-card" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isPaused ? 'Resume slideshow' : 'Pause slideshow'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center gap-2 relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleIconClick(() => {
                    if (!voiceEnabled) {
                      setVoiceEnabled(true);
                      setShowVoiceSelector(true);
                    } else {
                      setShowVoiceSelector(!showVoiceSelector);
                    }
                  })}
                  className={cn(
                    "p-2 backdrop-blur-sm rounded-full transition-colors",
                    voiceEnabled ? "bg-primary/30" : "bg-card/10 hover:bg-card/20"
                  )}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-5 h-5 text-card" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-card" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Voice callouts {useFallback ? '(fallback)' : ''}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Voice selector dropdown */}
            {showVoiceSelector && voiceEnabled && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-card/95 backdrop-blur-sm rounded-lg shadow-lg p-2 animate-fade-in z-20">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                  <span className="text-xs text-card-foreground font-medium">
                    Voice {useFallback && <span className="text-muted-foreground">(fallback)</span>}
                  </span>
                  <button
                    onClick={() => handleIconClick(() => setShowVoiceSelector(false))}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {ELEVENLABS_VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleIconClick(() => setSelectedVoice(v.id))}
                      className={cn(
                        "w-full text-left text-xs px-2 py-1.5 rounded transition-colors flex items-center justify-between",
                        selectedVoice === v.id
                          ? "bg-primary text-primary-foreground"
                          : "text-card-foreground hover:bg-muted/50"
                      )}
                    >
                      <span>{v.name}</span>
                      <span className="text-[10px] opacity-70">{v.gender}</span>
                    </button>
                  ))}
                  <div className="border-t border-border/50 pt-1 mt-1">
                    <button
                      onClick={() => handleIconClick(() => { setVoiceEnabled(false); setShowVoiceSelector(false); })}
                      className="w-full text-left text-xs px-2 py-1.5 rounded text-destructive hover:bg-destructive/10"
                    >
                      Turn Off Voice
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleIconClick(() => setShowInfo(!showInfo))}
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
        </div>
      </TooltipProvider>

      {/* Navigation arrows - show on hover near edges */}
      <button
        onClick={() => handleIconClick(() => navigate('prev'))}
        onMouseEnter={() => setArrowsHoverActive(true)}
        onMouseLeave={() => setArrowsHoverActive(false)}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-card/10 backdrop-blur-sm rounded-full hover:bg-card/20 transition-all duration-300",
          (showArrows || arrowsHoverActive) ? "opacity-100" : "opacity-0"
        )}
      >
        <ChevronLeft className="w-6 h-6 text-card" />
      </button>
      <button
        onClick={() => handleIconClick(() => navigate('next'))}
        onMouseEnter={() => setArrowsHoverActive(true)}
        onMouseLeave={() => setArrowsHoverActive(false)}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-card/10 backdrop-blur-sm rounded-full hover:bg-card/20 transition-all duration-300",
          (showArrows || arrowsHoverActive) ? "opacity-100" : "opacity-0"
        )}
      >
        <ChevronRight className="w-6 h-6 text-card" />
      </button>

      {/* Species info - shows at bottom when info toggled */}
      {showInfo && (
        <div className="absolute bottom-32 left-4 right-4 z-10 animate-fade-in">
          <div className="p-4 bg-black/60 backdrop-blur-sm rounded-md">
            <h2 className={cn("font-serif text-xl font-semibold mb-1", infoTextColor)}>
              {currentSpecies.scientificName || currentSpecies.name}
            </h2>
            <p className={cn("font-sans text-sm italic mb-2", infoTextColorMuted)}>
              {currentSpecies.name}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-sm text-xs font-sans font-medium",
                  getStatusColor(currentSpecies.status),
                  currentSpecies.status === 'CR' ? 'text-white' : 'text-foreground'
                )}
              >
                {getStatusLabel(currentSpecies.status)}
              </span>
              <span className={cn("font-sans text-xs", infoTextColorMuted)}>
                {currentSpecies.ticker}
              </span>
            </div>
            <p className={cn("font-sans text-sm mb-3", infoTextColorMuted)}>
              {truncateDescription(currentSpecies.description)}
            </p>
            <button
              onClick={copyContractAddress}
              className={cn("flex items-center gap-2 text-xs font-sans mb-3 hover:opacity-80 transition-opacity", infoTextColorMuted)}
            >
              <span className="font-medium">Contract:</span>
              <span className="font-mono text-[10px]">{CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</span>
              {contractCopied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            </button>
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
      <div className={cn(
        "absolute bottom-6 left-4 safe-area-bottom z-10 transition-opacity duration-300",
        iconsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <SlideshowControls
          interval={autoPlayInterval}
          onIntervalChange={setAutoPlayInterval}
        />
      </div>

      {/* Bottom center - Vote squares and double-tap buy icon */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 safe-area-bottom z-10 flex flex-col items-center gap-2">
        <VoteSquares 
          key={`${currentSpecies.id}-${voteKey}`}
          speciesId={currentSpecies.id}
          onTransactionStart={() => setIsPaused(true)}
          onTransactionEnd={() => setIsPaused(false)}
        />
        {/* Double-tap to buy $1 icon */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDoubleTap}
                className="relative p-2 bg-card/10 backdrop-blur-sm rounded-full hover:bg-card/20 transition-colors"
              >
                <MousePointerClick className="w-4 h-4 text-card" />
                <span className="absolute -top-1 -right-1 px-1 py-0.5 text-[7px] bg-amber-500/90 text-white rounded font-sans">Soon</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Double-tap to buy $1 (Coming Soon)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Bottom right - Share button */}
      <TooltipProvider>
        <div className={cn(
          "absolute bottom-6 right-4 safe-area-bottom z-10 transition-opacity duration-300",
          iconsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleIconClick(() => setShowShare(!showShare))}
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