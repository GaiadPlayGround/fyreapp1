import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import InlineFilterBar from '@/components/InlineFilterBar';
import SpeciesGrid from '@/components/SpeciesGrid';
import Footer from '@/components/Footer';
import EnzymeAdPopup from '@/components/EnzymeAdPopup';
import { useSpeciesApi } from '@/hooks/useSpeciesApi';
import { useAnimalSounds } from '@/hooks/useAnimalSounds';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import { ConservationStatus } from '@/data/species';
import { SortOption, ViewMode } from '@/components/FilterDrawer';
import type { PaymentCurrency } from '@/components/InlineFilterBar';
import type { Species } from '@/data/species';

const Explore = () => {
  const navigate = useNavigate();
  const { species, loading, error } = useSpeciesApi();
  const { recordView, getBaseSquares, getShareCount, getLastViewedAt } = useSpeciesStats();
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showEnzymeAd, setShowEnzymeAd] = useState(false);
  
  // Filter state - persist sortBy to localStorage
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem('fyreapp-sort');
    return (saved as SortOption) || 'id';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [conservationFilter, setConservationFilter] = useState<ConservationStatus | null>(null);
  
  // Payment currency state - persist to localStorage
  const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency>(() => {
    const saved = localStorage.getItem('fyreapp-payment-currency');
    return (saved as PaymentCurrency) || 'USDC';
  });
  
  // Ref for scrolling
  const gridRef = useRef<HTMLDivElement>(null);

  // Wildlife sounds
  useAnimalSounds(soundEnabled);

  // DNA Enzymes popup logic: only at 180 seconds and 45 minutes (twice total)
  useEffect(() => {
    const threeMinutes = 180 * 1000;
    const fortyFiveMinutes = 45 * 60 * 1000;

    // First popup at 180 seconds
    const firstTimeout = setTimeout(() => {
      setShowEnzymeAd(true);
    }, threeMinutes);

    // Second popup at 45 minutes
    const secondTimeout = setTimeout(() => {
      setShowEnzymeAd(true);
    }, fortyFiveMinutes);

    return () => {
      clearTimeout(firstTimeout);
      clearTimeout(secondTimeout);
    };
  }, []);

  // Persist sort preference
  useEffect(() => {
    localStorage.setItem('fyreapp-sort', sortBy);
  }, [sortBy]);

  // Persist payment currency preference
  useEffect(() => {
    localStorage.setItem('fyreapp-payment-currency', paymentCurrency);
  }, [paymentCurrency]);

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

  // Sort species
  const sortedSpecies = [...filteredSpecies].sort((a, b) => {
    switch (sortBy) {
      case 'id':
        // Extract numeric ID from symbol (e.g., "FCBC1" -> 1)
        const idA = parseInt(a.symbol.replace(/\D/g, '') || '0');
        const idB = parseInt(b.symbol.replace(/\D/g, '') || '0');
        return idA - idB;
      case 'trending':
        // Sort by most recently viewed globally
        const viewedA = getLastViewedAt(a.id);
        const viewedB = getLastViewedAt(b.id);
        return viewedB.getTime() - viewedA.getTime();
      case 'votes':
        return getBaseSquares(b.id) - getBaseSquares(a.id);
      case 'shares':
        return getShareCount(b.id) - getShareCount(a.id);
      case 'new':
        // Newest first (FCBC1234 to FCBC1)
        const newIdA = parseInt(a.symbol.replace(/\D/g, '') || '0');
        const newIdB = parseInt(b.symbol.replace(/\D/g, '') || '0');
        return newIdB - newIdA;
      default:
        return 0;
    }
  });

  const handleSpeciesClick = async (clickedSpecies: Species, _index: number) => {
    // Navigate to species detail page using symbol
    const speciesSymbol = clickedSpecies.symbol?.toLowerCase() || `fcbc${clickedSpecies.id.replace(/\D/g, '')}`;
    navigate(`/explore/${speciesSymbol}`);
    await recordView(clickedSpecies.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden overscroll-none touch-pan-y">
      <Header 
        animationEnabled={animationEnabled}
        soundEnabled={soundEnabled}
        onToggleAnimation={() => setAnimationEnabled(!animationEnabled)}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />
      
      <main className="flex-1 pt-14 w-full overflow-x-hidden">
        {/* Fixed Filter Bar - matches navbar styling */}
        <div ref={gridRef} className="fixed top-14 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border w-full max-w-full overflow-x-hidden">
          <InlineFilterBar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={setSortBy}
            searchTicker={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStatus={conservationFilter}
            onStatusChange={setConservationFilter}
            paymentCurrency={paymentCurrency}
            onPaymentCurrencyChange={setPaymentCurrency}
          />
        </div>

        {/* Species Grid - add top padding to account for fixed filter bar (header h-14 = 56px + filter bar ~48px) */}
        <div className="w-full overflow-x-hidden px-0 pt-[80px] sm:pt-[104px]">
          <SpeciesGrid
            species={sortedSpecies}
            viewMode={viewMode}
            onSpeciesClick={handleSpeciesClick}
            animationEnabled={animationEnabled}
          />
        </div>
      </main>

      <Footer />

      {/* DNA Enzymes Ad Popup */}
      {showEnzymeAd && (
        <EnzymeAdPopup onClose={() => setShowEnzymeAd(false)} />
      )}
    </div>
  );
};

export default Explore;
