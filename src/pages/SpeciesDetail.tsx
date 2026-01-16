import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpeciesApi } from '@/hooks/useSpeciesApi';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import SpeciesSlideshow from '@/components/SpeciesSlideshow';
import { SortOption } from '@/components/FilterDrawer';

const SpeciesDetail = () => {
  const { speciesId } = useParams<{ speciesId: string }>();
  const navigate = useNavigate();
  const { species, loading } = useSpeciesApi();
  const { getBaseSquares, getShareCount, getLastViewedAt } = useSpeciesStats();
  const [initialIndex, setInitialIndex] = useState<number | null>(null);

  // Get sort preference from localStorage to maintain order
  const sortBy = useMemo(() => {
    const saved = localStorage.getItem('fyreapp-sort');
    return (saved as SortOption) || 'id';
  }, []);

  // Sort species based on saved preference
  const sortedSpecies = useMemo(() => {
    return [...species].sort((a, b) => {
      switch (sortBy) {
        case 'id':
          const idA = parseInt(a.symbol.replace(/\D/g, '') || '0');
          const idB = parseInt(b.symbol.replace(/\D/g, '') || '0');
          return idA - idB;
        case 'trending':
          const viewedA = getLastViewedAt(a.id);
          const viewedB = getLastViewedAt(b.id);
          return viewedB.getTime() - viewedA.getTime();
        case 'votes':
          return getBaseSquares(b.id) - getBaseSquares(a.id);
        case 'shares':
          return getShareCount(b.id) - getShareCount(a.id);
        case 'new':
          const newIdA = parseInt(a.symbol.replace(/\D/g, '') || '0');
          const newIdB = parseInt(b.symbol.replace(/\D/g, '') || '0');
          return newIdB - newIdA;
        default:
          return 0;
      }
    });
  }, [species, sortBy, getBaseSquares, getShareCount, getLastViewedAt]);

  useEffect(() => {
    if (sortedSpecies.length > 0 && speciesId) {
      // Find species by symbol (e.g., fcbc1, FCBC1) or by id
      const normalizedId = speciesId.toLowerCase();
      const index = sortedSpecies.findIndex(s => 
        s.symbol?.toLowerCase() === normalizedId ||
        s.id.toLowerCase() === normalizedId ||
        s.symbol?.toLowerCase() === `fcbc${normalizedId.replace(/\D/g, '')}` ||
        `fcbc${s.id.replace(/\D/g, '')}`.toLowerCase() === normalizedId
      );
      
      if (index !== -1) {
        setInitialIndex(index);
      } else {
        // Species not found, redirect to explore
        navigate('/explore', { replace: true });
      }
    }
  }, [sortedSpecies, speciesId, navigate]);

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
