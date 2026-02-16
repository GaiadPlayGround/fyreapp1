// Species ticker to contract address mapping from CSV
// Reads directly from the CSV file

export interface SpeciesTickerMapping {
  ticker: string;
  contractAddress: string;
}

// Import CSV as raw string using Vite's ?raw suffix
import csvData from '@/data/speciesTickers.csv?raw';

// Parse CSV and create mappings
function parseCSV(csv: string): { tickerToAddress: Map<string, string>; addressToTicker: Map<string, string> } {
  const lines = csv.split('\n').slice(1); // Skip header
  const tickerToAddress = new Map<string, string>();
  const addressToTicker = new Map<string, string>();

  for (const line of lines) {
    const match = line.match(/"([^"]+)","([^"]+)"/);
    if (match) {
      const ticker = match[1];
      const address = match[2].toLowerCase();
      tickerToAddress.set(ticker, address);
      addressToTicker.set(address, ticker);
    }
  }

  return { tickerToAddress, addressToTicker };
}

const { tickerToAddress, addressToTicker } = parseCSV(csvData);

// Export functions to get mappings
export function getContractAddressByTicker(ticker: string): string | undefined {
  return tickerToAddress.get(ticker);
}

export function getTickerByContractAddress(address: string): string | undefined {
  return addressToTicker.get(address.toLowerCase());
}

export function getAllValidDNAAddresses(): Set<string> {
  return new Set(Array.from(tickerToAddress.values()).map(addr => addr.toLowerCase()));
}

export function getAllTickers(): string[] {
  return Array.from(tickerToAddress.keys());
}

export function getSpeciesTickerMappings(): SpeciesTickerMapping[] {
  return Array.from(tickerToAddress.entries()).map(([ticker, contractAddress]) => ({
    ticker,
    contractAddress,
  }));
}

