import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSpeciesApi } from '@/hooks/useSpeciesApi';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import SpeciesSlideshow from '@/components/SpeciesSlideshow';
import { SortOption } from '@/components/FilterDrawer';
import { useMetaTags } from '@/hooks/useMetaTags';
import type { Species } from '@/data/species';

interface LocationState {
  species?: Species[];
  initialIndex?: number;
}

const SpeciesDetail = () => {
  const { speciesId } = useParams<{ speciesId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  
  // Use species array from location state if available, otherwise fetch
  const { species: fetchedSpecies, loading: fetchingSpecies } = useSpeciesApi();
  const species = state?.species || fetchedSpecies;
  const loading = state?.species ? false : fetchingSpecies;
  
  const { getBaseSquares, getShareCount, getLastViewedAt, loading: statsLoading } = useSpeciesStats();
  const [initialIndex, setInitialIndex] = useState<number | null>(state?.initialIndex ?? null);

  // Get sort preference from localStorage to maintain order
  const sortBy = useMemo(() => {
    const saved = localStorage.getItem('fyreapp-sort');
    const allowed: SortOption[] = ['id', 'votes', 'shares', 'mcap', 'holders', 'new'];
    return allowed.includes(saved as SortOption) ? (saved as SortOption) : 'votes';
  }, []);

  // If we have species from state, use them directly (already sorted from Explore)
  // Otherwise, find the target species by ID and sort
  const sortedSpecies = useMemo(() => {
    // If we have species from state, use them as-is (already sorted correctly)
    if (state?.species) {
      return state.species;
    }
    
    // Otherwise, find species by ID and sort
    if (!speciesId || species.length === 0) return species;
    
    const normalizedId = speciesId.toLowerCase().trim();
    
    // Find species by exact match first
    let targetSpecies = species.find(s => {
      // Exact symbol match (e.g., "FCBC99" matches "fcbc99")
      if (s.symbol?.toLowerCase() === normalizedId) return true;
      
      // Exact ID match (e.g., "FCBC #99" matches "fcbc99")
      if (s.id.toLowerCase() === normalizedId || s.id.toLowerCase() === `fcbc #${normalizedId}`) return true;
      
      return false;
    });
    
    // If not found, try partial matches
    if (!targetSpecies) {
      targetSpecies = species.find(s => {
        // Match by ID number (e.g., "FCBC #99" matches "fcbc99" or "99")
        const idNumber = s.id.replace(/\D/g, '');
        if (idNumber && (normalizedId === idNumber || normalizedId === `fcbc${idNumber}`)) return true;
        
        // Match symbol number (e.g., "FCBC99" matches "99")
        const symbolNumber = s.symbol?.replace(/FCBC/gi, '').replace(/\D/g, '');
        if (symbolNumber && normalizedId === symbolNumber) return true;
        
        return false;
      });
    }
    
    // If species found, sort around it; otherwise return sorted species
    if (statsLoading && (sortBy === 'votes' || sortBy === 'shares')) {
      return species; // Return unsorted until stats load
    }
    
    return [...species].sort((a, b) => {
      switch (sortBy) {
        case 'id':
          const idA = parseInt(a.symbol.replace(/\D/g, '') || '0');
          const idB = parseInt(b.symbol.replace(/\D/g, '') || '0');
          return idA - idB;
        case 'votes':
          return getBaseSquares(b.id) - getBaseSquares(a.id);
        case 'shares':
          return getShareCount(b.id) - getShareCount(a.id);
        case 'mcap':
          return (b.marketCap || 0) - (a.marketCap || 0);
        case 'holders':
          return (b.holders || 0) - (a.holders || 0);
        case 'new':
          const newIdA = parseInt(a.symbol.replace(/\D/g, '') || '0');
          const newIdB = parseInt(b.symbol.replace(/\D/g, '') || '0');
          return newIdB - newIdA;
        default:
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
  }, [state?.species, species, speciesId, sortBy, getBaseSquares, getShareCount, statsLoading]);

  // Find the index if not provided from state
  useEffect(() => {
    if (initialIndex !== null) return; // Already set from state
    
    if (sortedSpecies.length > 0 && speciesId) {
      const normalizedId = speciesId.toLowerCase().trim();
      
      const index = sortedSpecies.findIndex(s => {
        if (s.symbol?.toLowerCase() === normalizedId) return true;
        if (s.id.toLowerCase() === normalizedId || s.id.toLowerCase() === `fcbc #${normalizedId}`) return true;
        const idNumber = s.id.replace(/\D/g, '');
        if (idNumber && (normalizedId === idNumber || normalizedId === `fcbc${idNumber}`)) return true;
        const symbolNumber = s.symbol?.replace(/FCBC/gi, '').replace(/\D/g, '');
        if (symbolNumber && normalizedId === symbolNumber) return true;
        return false;
      });
      
      if (index !== -1) {
        setInitialIndex(index);
      } else {
        console.warn(`Species not found: ${speciesId}. Available species:`, sortedSpecies.map(s => `${s.symbol} (${s.id})`));
        navigate('/explore', { replace: true });
      }
    }
  }, [sortedSpecies, speciesId, navigate, initialIndex]);

  // Update meta tags for sharing with species-specific information
  const currentSpecies = initialIndex !== null ? sortedSpecies[initialIndex] : null;
  useMetaTags({
    title: currentSpecies 
      ? `${currentSpecies.name} (${currentSpecies.symbol}) | PUREBREEDS EXPLORER`
      : undefined,
    description: currentSpecies
      ? `${currentSpecies.name} - ${currentSpecies.description || 'An endangered animal brought onchain to Base by the FCBC Club. Buy DNA and Create Hybrids.'}`
      : undefined,
    image: currentSpecies?.image || undefined,
    url: currentSpecies && typeof window !== 'undefined'
      ? `${window.location.origin}/explore/${currentSpecies.symbol?.toLowerCase() || speciesId}`
      : undefined,
    type: 'website',
  });

  const handleClose = () => {
    navigate('/explore');
  };

  if (loading || initialIndex === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <SpeciesSlideshow
      species={sortedSpecies}
      initialIndex={initialIndex}
      onClose={handleClose}
    />
  );
};

export default SpeciesDetail;
