import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpeciesApi } from '@/hooks/useSpeciesApi';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import SpeciesSlideshow from '@/components/SpeciesSlideshow';
import { SortOption } from '@/components/FilterDrawer';
import type { PaymentCurrency } from '@/components/InlineFilterBar';

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

  // Get payment currency preference from localStorage
  const paymentCurrency = useMemo(() => {
    const saved = localStorage.getItem('fyreapp-payment-currency');
    return (saved as PaymentCurrency) || 'USDC';
  }, []);

  // Get quick buy amount preference from localStorage
  const quickBuyAmount = useMemo(() => {
    const saved = localStorage.getItem('fyreapp-quick-buy-amount');
    return saved ? parseFloat(saved) : 1;
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
      // Find species by symbol (e.g., fcbc99, FCBC99) or by id
      // The URL uses symbol like "fcbc99", but we need to match against the actual symbol
      const normalizedId = speciesId.toLowerCase().trim();
      
      const index = sortedSpecies.findIndex(s => {
        // Match by symbol (e.g., "FCBC99" matches "fcbc99")
        if (s.symbol?.toLowerCase() === normalizedId) return true;
        
        // Match by ID format (e.g., "FCBC #99" matches "fcbc99" or "99")
        const idNumber = s.id.replace(/\D/g, '');
        if (idNumber && (normalizedId === idNumber || normalizedId === `fcbc${idNumber}`)) return true;
        
        // Match symbol without FCBC prefix
        const symbolNumber = s.symbol?.replace(/FCBC/gi, '').replace(/\D/g, '');
        if (symbolNumber && normalizedId === symbolNumber) return true;
        
        // Direct ID match
        if (s.id.toLowerCase() === normalizedId || s.id.toLowerCase() === `fcbc #${normalizedId}`) return true;
        
        return false;
      });
      
      if (index !== -1) {
        setInitialIndex(index);
      } else {
        // Species not found, redirect to explore
        console.warn(`Species not found: ${speciesId}. Available species:`, sortedSpecies.map(s => s.symbol));
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
      paymentCurrency={paymentCurrency}
      quickBuyAmount={quickBuyAmount}
    />
  );
};

export default SpeciesDetail;
