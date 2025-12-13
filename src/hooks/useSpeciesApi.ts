import { useState, useEffect } from 'react';
import { Species, ConservationStatus } from '@/data/species';

interface ApiSpecies {
  id: string;
  name: string;
  scientificName?: string;
  status?: ConservationStatus;
  ticker?: string;
  image: string;
  population?: string;
  region?: string;
  votes?: number;
  description?: string;
}

interface ApiResponse {
  species: ApiSpecies[];
  total: number;
  onchain: number;
}

export const useSpeciesApi = () => {
  const [species, setSpecies] = useState<Species[]>([]);
  const [total, setTotal] = useState(0);
  const [onchain, setOnchain] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const response = await fetch('https://server.fcbc.fun/api/v1/zora/species?count=25');
        const data: ApiResponse = await response.json();
        
        // Map API response to our Species format
        const mappedSpecies: Species[] = data.species.map((s, index) => ({
          id: s.id || String(index + 1).padStart(3, '0'),
          name: s.name,
          scientificName: s.scientificName || 'Species name',
          status: s.status || (['CR', 'EN', 'VU'] as ConservationStatus[])[index % 3],
          ticker: s.ticker || `$FCBC${String(index + 1).padStart(3, '0')}`,
          image: s.image,
          population: s.population || 'Unknown',
          region: s.region || 'Unknown',
          votes: s.votes || Math.floor(Math.random() * 3000),
          description: s.description || 'A unique species in our collection.',
        }));

        setSpecies(mappedSpecies);
        setTotal(data.total || mappedSpecies.length);
        setOnchain(data.onchain || mappedSpecies.length);
      } catch (err) {
        console.error('Failed to fetch species:', err);
        setError('Failed to load species data');
        // Fallback to local data if API fails
        import('@/data/species').then(({ speciesData }) => {
          setSpecies(speciesData);
          setTotal(1234);
          setOnchain(speciesData.length);
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSpecies();
  }, []);

  return { species, total, onchain, loading, error };
};
