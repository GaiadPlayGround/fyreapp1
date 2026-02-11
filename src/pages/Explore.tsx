import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import InlineFilterBar from '@/components/InlineFilterBar';
import SpeciesGrid from '@/components/SpeciesGrid';
import Footer from '@/components/Footer';
import EnzymeAdPopup from '@/components/EnzymeAdPopup';
import OnchainSeoAdPopup from '@/components/OnchainSeoAdPopup';
import OnboardingGuide from '@/components/OnboardingGuide';
import { useSpeciesApi } from '@/hooks/useSpeciesApi';
import { useAnimalSounds } from '@/hooks/useAnimalSounds';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import { ConservationStatus } from '@/data/species';
import { SortOption, ViewMode } from '@/components/FilterDrawer';
import type { Species } from '@/data/species';
import { useMetaTags } from '@/hooks/useMetaTags';
import { cn } from '@/lib/utils';

const Explore = () => {
  const navigate = useNavigate();
  const { species, loading, error } = useSpeciesApi();
  const { recordView, getBaseSquares, getLastViewedAt, loading: statsLoading, stats } = useSpeciesStats();
  const [animationEnabled, setAnimationEnabled] = useState(false); // Default off for electric grids
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showEnzymeAd, setShowEnzymeAd] = useState(false);
  const [showSeoAd, setShowSeoAd] = useState(false);

  // Onchain SEO ad - once per 24 hours
  useEffect(() => {
    const lastShown = localStorage.getItem('fyreapp-seo-ad-last');
    const now = Date.now();
    if (!lastShown || now - parseInt(lastShown) > 24 * 60 * 60 * 1000) {
      const timer = setTimeout(() => {
        setShowSeoAd(true);
        localStorage.setItem('fyreapp-seo-ad-last', now.toString());
      }, 30000); // Show after 30s
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Filter state - persist sortBy to localStorage
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('votes');
  const [searchQuery, setSearchQuery] = useState('');
  const [conservationFilter, setConservationFilter] = useState<ConservationStatus | null>(null);
  
  // Ref for scrolling
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Collapsible header state
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  
  // Auto-collapse header after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeaderCollapsed(true);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);
  
  // Show header on scroll up, hide on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY.current - 5) {
        setHeaderCollapsed(false);
        // Re-collapse after 7 seconds
        setTimeout(() => setHeaderCollapsed(true), 7000);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Wildlife sounds
  useAnimalSounds(soundEnabled);

  // Set default meta tags for explore page
  useMetaTags({
    title: 'PUREBREEDS NAVIGATOR | Tokenized Endangered Animals on Base L2',
    description: 'Browse, Vote and Share Tokenized Endangered Animals on Base L2',
    image: '/logo.png',
    url: typeof window !== 'undefined' ? `${window.location.origin}/explore` : 'https://www.fcbc.fun/explore',
  });

  // DNA Enzymes popup logic: only once per session
  useEffect(() => {
    const hasSeenAd = sessionStorage.getItem('fyreapp-enzyme-ad-shown');
    if (hasSeenAd) return;

    const threeMinutes = 180 * 1000;

    // Show popup once at 180 seconds
    const timeout = setTimeout(() => {
      setShowEnzymeAd(true);
      sessionStorage.setItem('fyreapp-enzyme-ad-shown', 'true');
    }, threeMinutes);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  // Persist sort preference
  useEffect(() => {
    localStorage.setItem('fyreapp-sort', sortBy);
  }, [sortBy]);

  // Allow manual opening from Wallet dropdown
  useEffect(() => {
    const handler = (_e: Event) => setShowEnzymeAd(true);
    window.addEventListener('enzymeAd:open', handler);
    return () => window.removeEventListener('enzymeAd:open', handler);
  }, []);

  // Filter and sort species
  const filteredSpecies = species.filter(s => {
    const matchesSearch = !searchQuery || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesConservation = !conservationFilter || s.status === conservationFilter;
    
    return matchesSearch && matchesConservation;
  });

  // Sort species - default to 'votes' (base squares)
  // Only sort when stats are loaded to ensure accurate base squares data
  const sortedSpecies = useMemo(() => {
    // Don't sort if stats are still loading and we're sorting by votes/shares
    if (statsLoading && sortBy === 'votes') {
      return filteredSpecies; // Return unsorted until stats load
    }
    
    return [...filteredSpecies].sort((a, b) => {
      switch (sortBy) {
        case 'id':
          // Extract numeric ID from symbol (e.g., "FCBC1" -> 1)
          const idA = parseInt(a.symbol.replace(/\D/g, '') || '0');
          const idB = parseInt(b.symbol.replace(/\D/g, '') || '0');
          return idA - idB;
        case 'votes':
          // Sort by base squares (votes) - higher first
          const baseSquaresA = getBaseSquares(a.id);
          const baseSquaresB = getBaseSquares(b.id);
          // If base squares are equal, sort by ID as tiebreaker
          if (baseSquaresA === baseSquaresB) {
            const idA = parseInt(a.symbol.replace(/\D/g, '') || '0');
            const idB = parseInt(b.symbol.replace(/\D/g, '') || '0');
            return idA - idB;
          }
          return baseSquaresB - baseSquaresA;
        case 'mcap':
          return (b.marketCap || 0) - (a.marketCap || 0);
        case 'holders':
          return (b.holders || 0) - (a.holders || 0);
        case 'new':
          // Newest first (FCBC1234 to FCBC1)
          const newIdA = parseInt(a.symbol.replace(/\D/g, '') || '0');
          const newIdB = parseInt(b.symbol.replace(/\D/g, '') || '0');
          return newIdB - newIdA;
        default:
          // Default to votes (base squares) if sortBy is invalid
          const defaultBaseSquaresA = getBaseSquares(a.id);
          const defaultBaseSquaresB = getBaseSquares(b.id);
          if (defaultBaseSquaresA === defaultBaseSquaresB) {
            const idA = parseInt(a.symbol.replace(/\D/g, '') || '0');
            const idB = parseInt(b.symbol.replace(/\D/g, '') || '0');
            return idA - idB;
          }
          return defaultBaseSquaresB - defaultBaseSquaresA;
      }
    });
  }, [filteredSpecies, sortBy, getBaseSquares, statsLoading, stats]);

  const handleSpeciesClick = async (clickedSpecies: Species, _index: number) => {
    // Navigate to species detail page using symbol and pass the sorted species array
    const speciesSymbol = clickedSpecies.symbol?.toLowerCase() || `fcbc${clickedSpecies.id.replace(/\D/g, '')}`;
    navigate(`/explore/${speciesSymbol}`, {
      state: {
        species: sortedSpecies,
        initialIndex: _index
      }
    });
    await recordView(clickedSpecies.id);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header 
        animationEnabled={animationEnabled}
        soundEnabled={soundEnabled}
        onToggleAnimation={() => setAnimationEnabled(!animationEnabled)}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        showTitle={false}
      />
      
      {/* Header text - collapsible, expandable on click */}
      <div 
        className={cn(
          "fixed top-14 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border w-full max-w-full overflow-x-hidden transition-all duration-300 cursor-pointer",
          headerCollapsed && "max-h-0 overflow-hidden border-b-0 py-0"
        )}
        onClick={() => { if (!headerCollapsed) { setHeaderCollapsed(true); } }}
      >
        <div className={cn(
          "text-center py-2 px-4 transition-all duration-300",
          headerCollapsed && "opacity-0 py-0"
        )}>
          <h2 className="font-serif text-base sm:text-lg font-semibold text-foreground leading-tight">
            Discover, Vote and Buy
          </h2>
          <h2 className="font-serif text-base sm:text-lg font-semibold text-foreground leading-tight">
            Tokenized Endangered Animals
          </h2>
          <h3 className="text-sm text-muted-foreground font-sans">on Base</h3>
        </div>
      </div>
      {/* Tap collapsed area to expand */}
      {headerCollapsed && (
        <div 
          className="fixed top-14 left-0 right-0 h-6 z-40 cursor-pointer flex items-center justify-center"
          onClick={() => {
            setHeaderCollapsed(false);
            setTimeout(() => setHeaderCollapsed(true), 7000);
          }}
        >
          <span className="text-[10px] text-muted-foreground font-sans">Discover, Vote and Buy... ▼</span>
        </div>
      )}
      
      {/* Filter bar - always fixed, adjusts position based on header collapse */}
      <div className={cn(
        "fixed left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border w-full max-w-full overflow-x-hidden transition-all duration-300",
        headerCollapsed ? "top-14" : "top-[7.5rem]"
      )}>
        <InlineFilterBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
          searchTicker={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={conservationFilter}
          onStatusChange={setConservationFilter}
          species={species}
        />
      </div>

      <main className="w-full overflow-x-hidden pt-6 sm:p-14">
        {/* Species Grid - add top padding to account for fixed filter bar (header h-14 = 56px + filter bar ~48px) */}
        <div className={cn(
          "w-full overflow-x-hidden px-0 pb-0 transition-all duration-300",
          headerCollapsed ? "pt-[80px] sm:pt-[90px]" : "pt-[170px] sm:pt-[194px]"
        )}>
          {loading || (statsLoading && sortBy === 'votes') ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground font-sans">
                {loading ? 'Loading species...' : 'Loading stats and organizing data...'}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <p className="text-sm text-destructive font-sans">Error loading species: {error}</p>
            </div>
          ) : sortedSpecies.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <p className="text-sm text-muted-foreground font-sans">No species found</p>
            </div>
          ) : (
            <SpeciesGrid
              species={sortedSpecies}
              viewMode={viewMode}
              onSpeciesClick={handleSpeciesClick}
              animationEnabled={animationEnabled}
            />
          )}
        </div>
      </main>

      <Footer />

      {/* Onboarding Guide - auto-plays on first visit */}
      <OnboardingGuide />

      {/* DNA Enzymes Ad Popup */}
      {showEnzymeAd && (
        <EnzymeAdPopup onClose={() => setShowEnzymeAd(false)} />
      )}

      {/* Onchain SEO Ad Popup */}
      {showSeoAd && (
        <OnchainSeoAdPopup onClose={() => setShowSeoAd(false)} />
      )}
    </div>
  );
};

export default Explore;
