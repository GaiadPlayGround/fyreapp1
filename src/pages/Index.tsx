import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import GalleryHeader from '@/components/GalleryHeader';
import FilterDrawer, { SortOption, ViewMode } from '@/components/FilterDrawer';
import SpeciesGrid from '@/components/SpeciesGrid';
import SpeciesSlideshow from '@/components/SpeciesSlideshow';
import { Species, ConservationStatus } from '@/data/species';
import { useSpeciesApi } from '@/hooks/useSpeciesApi';

const Index = () => {
  const { species: apiSpecies, total, onchain, loading } = useSpeciesApi();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ConservationStatus | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [searchTicker, setSearchTicker] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedSpecies, setSelectedSpecies] = useState<{ species: Species; index: number } | null>(null);

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
      case 'votes':
        result.sort((a, b) => b.votes - a.votes);
        break;
      case 'new':
        result.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
      case 'id':
        result.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        break;
      case 'trending':
      case 'mcap':
      default:
        break;
    }

    return result;
  }, [apiSpecies, selectedStatus, sortBy, searchTicker]);

  const handleSpeciesClick = (species: Species, index: number) => {
    setSelectedSpecies({ species, index });
  };

  const handleCloseSlideshow = () => {
    setSelectedSpecies(null);
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
      <Header
        onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
        isFilterOpen={isFilterOpen}
      />

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        sortBy={sortBy}
        onSortChange={setSortBy}
        searchTicker={searchTicker}
        onSearchChange={setSearchTicker}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Mobile-optimized container with safe areas */}
      <div className="pt-14 pb-4 px-2">
        <GalleryHeader onchain={onchain} total={total} />
        
        <SpeciesGrid
          species={filteredSpecies}
          onSpeciesClick={handleSpeciesClick}
          isFilterOpen={isFilterOpen}
          viewMode={viewMode}
        />
      </div>

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
