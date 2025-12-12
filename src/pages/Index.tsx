import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import FilterDrawer, { SortOption } from '@/components/FilterDrawer';
import SpeciesGrid from '@/components/SpeciesGrid';
import SpeciesSlideshow from '@/components/SpeciesSlideshow';
import { speciesData, Species, ConservationStatus } from '@/data/species';

const Index = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ConservationStatus | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [searchTicker, setSearchTicker] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<{ species: Species; index: number } | null>(null);

  // Filter and sort species
  const filteredSpecies = useMemo(() => {
    let result = [...speciesData];

    // Filter by status
    if (selectedStatus) {
      result = result.filter((s) => s.status === selectedStatus);
    }

    // Filter by ticker search
    if (searchTicker) {
      const search = searchTicker.toLowerCase().replace(/[#$]/g, '');
      result = result.filter(
        (s) =>
          s.ticker.toLowerCase().includes(search) ||
          s.id.includes(search) ||
          s.name.toLowerCase().includes(search)
      );
    }

    // Sort
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
        // Keep original order for trending/mcap (placeholder)
        break;
    }

    return result;
  }, [selectedStatus, sortBy, searchTicker]);

  const handleSpeciesClick = (species: Species, index: number) => {
    setSelectedSpecies({ species, index });
  };

  const handleCloseSlideshow = () => {
    setSelectedSpecies(null);
  };

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
      />

      <div
        className={`pt-20 pb-8 px-4 transition-all duration-300 ${
          isFilterOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="container mx-auto">
          <SpeciesGrid
            species={filteredSpecies}
            onSpeciesClick={handleSpeciesClick}
            isFilterOpen={isFilterOpen}
          />
        </div>
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