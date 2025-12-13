import { useState, useEffect } from 'react';
import { Species, ConservationStatus } from '@/data/species';

interface ApiSpecies {
  name: string;
  scientificName?: string;
  status?: ConservationStatus;
  code?: string;
  symbol?: string;
  slug?: string;
  image?: string;
  population?: string;
  region?: string;
  description?: string;
  tokenId?: string;
}

interface ApiResponse {
  data: ApiSpecies[];
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
        const response = await fetch('https://server.fcbc.fun/api/v1/zora/species?count=250');
        const json: ApiResponse = await response.json();
        
        if (!json || !json.data) {
          throw new Error('Invalid FCBC API response');
        }

        const mappedSpecies: Species[] = json.data.map((s, index) => ({
          id: String(index + 1).padStart(3, '0'),
          name: s.name,
          scientificName: s.scientificName || 'Species name',
          status: s.status || (['CR', 'EN', 'VU'] as ConservationStatus[])[index % 3],
          ticker: `$FCBC${s.code || s.symbol || String(index + 1).padStart(3, '0')}`,
          image: s.image || '',
          population: s.population || 'Unknown',
          region: s.region || 'Unknown',
          votes: Math.floor(Math.random() * 3000),
          description: s.description || 'A unique species in our collection.',
          code: s.code || s.symbol,
        }));

        setSpecies(mappedSpecies);
        setTotal(1234);
        setOnchain(mappedSpecies.length);
      } catch (err) {
        console.error('Failed to fetch species:', err);
        setError('Failed to load species data');
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
