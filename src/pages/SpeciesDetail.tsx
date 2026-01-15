import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpeciesApi } from '@/hooks/useSpeciesApi';
import SpeciesSlideshow from '@/components/SpeciesSlideshow';

const SpeciesDetail = () => {
  const { speciesId } = useParams<{ speciesId: string }>();
  const navigate = useNavigate();
  const { species, loading } = useSpeciesApi();
  const [initialIndex, setInitialIndex] = useState<number | null>(null);

  useEffect(() => {
    if (species.length > 0 && speciesId) {
      // Find species by symbol (e.g., fcbc1, FCBC1) or by id
      const normalizedId = speciesId.toLowerCase();
      const index = species.findIndex(s => 
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
  }, [species, speciesId, navigate]);

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
      species={species}
      initialIndex={initialIndex}
      onClose={handleClose}
    />
  );
};

export default SpeciesDetail;
