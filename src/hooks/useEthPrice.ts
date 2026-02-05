import { useState, useEffect } from 'react';

// Fetch ETH price from CoinGecko API (free, no API key needed)
const ETH_PRICE_API = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

export const useEthPrice = () => {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(ETH_PRICE_API);
        if (!response.ok) {
          throw new Error('Failed to fetch ETH price');
        }
        
        const data = await response.json();
        const price = data.ethereum?.usd;
        
        if (price && typeof price === 'number') {
          setEthPrice(price);
        } else {
          throw new Error('Invalid price data');
        }
      } catch (err) {
        console.error('Error fetching ETH price:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to approximate price if API fails
        setEthPrice(3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEthPrice();
    
    // Refresh price every 5 minutes
    const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Convert USD amount to ETH
  const usdToEth = (usdAmount: number): number | null => {
    if (!ethPrice) return null;
    return usdAmount / ethPrice;
  };

  // Format ETH amount for display
  const formatEth = (ethAmount: number): string => {
    if (ethAmount >= 0.01) {
      return ethAmount.toFixed(4);
    } else if (ethAmount >= 0.001) {
      return ethAmount.toFixed(5);
    } else {
      return ethAmount.toFixed(6);
    }
  };

  return {
    ethPrice,
    isLoading,
    error,
    usdToEth,
    formatEth,
  };
};

