import { useState, useMemo, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import InlineFilterBar from '@/components/InlineFilterBar';
import SpeciesGrid from '@/components/SpeciesGrid';
import SpeciesSlideshow from '@/components/SpeciesSlideshow';
import OnboardingGuide from '@/components/OnboardingGuide';
import EnzymeAdPopup from '@/components/EnzymeAdPopup';
import { Species, ConservationStatus } from '@/data/species';
import { useSpeciesApi } from '@/hooks/useSpeciesApi';
import { useAnimalSounds } from '@/hooks/useAnimalSounds';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import { SortOption, ViewMode } from '@/components/FilterDrawer';

const Index = () => {
  const { species: apiSpecies, total, onchain, loading } = useSpeciesApi();
  const { getBaseSquares, getShareCount, stats } = useSpeciesStats();
  const [selectedStatus, setSelectedStatus] = useState<ConservationStatus | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('id');
  const [searchTicker, setSearchTicker] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedSpecies, setSelectedSpecies] = useState<{ species: Species; index: number } | null>(null);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showEnzymeAd, setShowEnzymeAd] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  
  // Random animal sounds on homepage
  useAnimalSounds(soundEnabled);

  // Show Enzyme ad popup after 120 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowEnzymeAd(true);
    }, 120000);
    return () => clearTimeout(timer);
  }, []);

  // Filter and sort species
  const filteredSpecies = useMemo(() => {
    let result = [...apiSpecies];

    if (selectedStatus) {
      result = result.filter((s) => s.status === selectedStatus);
    }

    if (searchTicker) {
      const search = searchTicker.toLowerCase().replace(/[#$]/g, '');
      result = result.filter(
        (s) =>
          s.ticker.toLowerCase().includes(search) ||
          s.id.includes(search) ||
          s.name.toLowerCase().includes(search)
      );
    }

    switch (sortBy) {
      case 'id':
        // ID: fcbc1 to fcbc1234 (ascending)
        result.sort((a, b) => parseInt(a.id.replace(/\D/g, '')) - parseInt(b.id.replace(/\D/g, '')));
        break;
      case 'votes':
        // Votes: by base squares (highest first)
        result.sort((a, b) => getBaseSquares(b.id) - getBaseSquares(a.id));
        break;
      case 'shares':
        // Shares: by share count (highest first)
        result.sort((a, b) => getShareCount(b.id) - getShareCount(a.id));
        break;
      case 'mcap':
        result.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
        break;
      case 'holders':
        result.sort((a, b) => (b.holders || 0) - (a.holders || 0));
        break;
      case 'new':
        // Newest: fcbc1234 to fcbc1 (descending)
        result.sort((a, b) => parseInt(b.id.replace(/\D/g, '')) - parseInt(a.id.replace(/\D/g, '')));
        break;
      default:
        break;
    }

    return result;
  }, [apiSpecies, selectedStatus, sortBy, searchTicker, getBaseSquares, getShareCount, stats]);

  const handleSpeciesClick = (species: Species, index: number) => {
    setSelectedSpecies({ species, index });
  };

  const handleCloseSlideshow = () => {
    setSelectedSpecies(null);
  };

  const handleSwipeUp = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-sans">Loading species...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <OnboardingGuide />
      
      {/* Enzyme Ad Popup */}
      {showEnzymeAd && (
        <EnzymeAdPopup onClose={() => setShowEnzymeAd(false)} />
      )}
      
      {/* Hero Section */}
      <HeroSection 
        onchain={onchain} 
        total={total} 
        onSwipeUp={handleSwipeUp}
        animationEnabled={animationEnabled}
        soundEnabled={soundEnabled}
      />

      {/* Gallery Section */}
      <section ref={galleryRef} id="gallery" className="relative">
        <Header
          animationEnabled={animationEnabled}
          soundEnabled={soundEnabled}
          onToggleAnimation={() => setAnimationEnabled(!animationEnabled)}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
        />

        {/* Inline Filter Bar - Sticky within gallery section */}
        <div className="sticky top-14 z-40 bg-background safe-area-top border-b border-border">
          <InlineFilterBar
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            sortBy={sortBy}
            onSortChange={setSortBy}
            searchTicker={searchTicker}
            onSearchChange={setSearchTicker}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Mobile-optimized container with safe areas */}
        <div className="pb-4 px-2">
          <SpeciesGrid
            species={filteredSpecies}
            onSpeciesClick={handleSpeciesClick}
            viewMode={viewMode}
            animationEnabled={animationEnabled}
          />
        </div>
      </section>

      {selectedSpecies && (
        <SpeciesSlideshow
          species={filteredSpecies}
          initialIndex={selectedSpecies.index}
          onClose={handleCloseSlideshow}
        />
      )}
    </main>
  );
};

export default Index;
