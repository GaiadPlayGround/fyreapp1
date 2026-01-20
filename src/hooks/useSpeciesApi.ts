import { useState, useEffect } from 'react';
import { Species, ConservationStatus, getStatusLabel, getAllSpeciesData } from '@/data/species';
export type { Species } from '@/data/species';

interface ApiSpecies {
  id?: string;
  name: string;
  symbol?: string;
  code?: string;
  status?: string;
  iucnStatus?: ConservationStatus;
  rarity?: string;
  image?: string;
  scientificName?: string;
  population?: string;
  region?: string;
  description?: string;
  tokenId?: string;
  slug?: string;
  tokenAddress?: string;
  poolCurrencyToken?: {
    address: string;
    name: string;
    decimals: number;
  };
  chainId?: number;
  tradable?: boolean;
}

interface ApiResponse {
  data: ApiSpecies[];
}

// Map API status strings to IUCN codes
const mapStatusToCode = (status?: string, iucnStatus?: ConservationStatus): ConservationStatus => {
  if (iucnStatus) return iucnStatus;
  if (!status) return 'VU';
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes('critically')) return 'CR';
  if (statusLower.includes('endangered')) return 'EN';
  if (statusLower.includes('vulnerable')) return 'VU';
  if (statusLower.includes('near')) return 'NT';
  if (statusLower.includes('least')) return 'LC';
  if (statusLower.includes('data')) return 'DD';
  if (statusLower.includes('extinct') && statusLower.includes('wild')) return 'EW';
  if (statusLower.includes('extinct')) return 'EX';
  return 'NE';
};

// Generate dummy description based on species name
const generateDescription = (name: string): string => {
  const descriptions = [
    `The ${name} is a remarkable species that plays a vital role in its ecosystem.`,
    `Known for its unique characteristics, the ${name} faces significant conservation challenges.`,
    `The ${name} represents one of nature's most fascinating creatures, now protected under conservation efforts.`,
    `A symbol of biodiversity, the ${name} continues to inspire conservation action worldwide.`,
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

export const useSpeciesApi = () => {
  const [species, setSpecies] = useState<Species[]>([]);
  const [total, setTotal] = useState(0);
  const [onchain, setOnchain] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const response = await fetch('https://server.fcbc.fun/api/v1/zora/species?count=150');
        const json: ApiResponse = await response.json();
        
        if (!json || !json.data) {
          throw new Error('Invalid FCBC API response');
        }

        const mappedSpecies: Species[] = json.data.map((s, index) => {
          // Extract numeric ID from "FCBC #190" format or use symbol
          let fcbcId: string;
          if (s.id) {
            // Extract number from "FCBC #190" -> "190"
            const match = s.id.match(/#(\d+)/);
            fcbcId = match ? match[1] : (s.symbol?.match(/(\d+)/)?.[1] || s.id.replace(/\D/g, '') || String(index + 1));
          } else if (s.symbol) {
            // Extract number from symbol like "FCBC190" -> "190"
            const symbolMatch = s.symbol.match(/(\d+)/);
            fcbcId = symbolMatch ? symbolMatch[1] : String(index + 1);
          } else {
            fcbcId = String(index + 1);
          }
          
          const symbol = s.symbol || `FCBC${fcbcId}`;
          const code = s.code || symbol;
          const iucnCode = mapStatusToCode(s.status, s.iucnStatus);
          
          return {
            // Identity & Token
            id: `FCBC #${fcbcId}`,
            name: s.name,
            symbol: symbol,
            code: code,
            
            // Conservation
            status: iucnCode,
            statusLabel: s.status || getStatusLabel(iucnCode),
            rarity: s.rarity || ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][index % 5],
            
            // Media
            image: s.image || '',
            
            // Legacy/Display fields
            scientificName: s.scientificName || 'Species name',
            ticker: `$${symbol}`,
            population: s.population || 'Unknown',
            region: s.region || 'Unknown',
            votes: Math.floor(Math.random() * 3000),
            description: s.description || generateDescription(s.name),
            
            // Zora/Onchain data
            tokenAddress: s.tokenAddress,
            poolCurrencyToken: s.poolCurrencyToken,
            chainId: s.chainId,
            // If tokenAddress exists, it's tradable (API tradable field may be outdated)
            tradable: s.tokenAddress ? true : (s.tradable || false),
          };
        });

        // Merge with additional dummy species if we need more to fill the grid
        const allDummySpecies = getAllSpeciesData();
        const combinedSpecies = mappedSpecies.length < 75 
          ? [...mappedSpecies, ...allDummySpecies.slice(mappedSpecies.length).slice(0, 75 - mappedSpecies.length)]
          : mappedSpecies;

        setSpecies(combinedSpecies);
        setTotal(1234);
        setOnchain(combinedSpecies.length);
      } catch (err) {
        console.error('Failed to fetch species:', err);
        setError('Failed to load species data');
        const allDummySpecies = getAllSpeciesData();
        setSpecies(allDummySpecies.slice(0, 75));
        setTotal(1234);
        setOnchain(allDummySpecies.length);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecies();
  }, []);

  return { species, total, onchain, loading, error };
};
