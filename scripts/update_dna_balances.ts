import { createClient } from '@supabase/supabase-js';
import { getCoinHolders, setApiKey } from '@zoralabs/coins-sdk';
import { formatUnits } from 'viem';
import { base } from 'wagmi/chains';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client - use VITE_ prefixed vars or fallback to non-prefixed
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials are required.');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CSV file directly
function parseSpeciesTickersCSV(): Array<{ ticker: string; contractAddress: string }> {
  const csvPath = join(__dirname, '../src/data/speciesTickers.csv');
  const csvData = readFileSync(csvPath, 'utf-8');
  const lines = csvData.split('\n').slice(1); // Skip header
  const mappings: Array<{ ticker: string; contractAddress: string }> = [];

  for (const line of lines) {
    const match = line.match(/"([^"]+)","([^"]+)"/);
    if (match) {
      const ticker = match[1];
      const address = match[2].toLowerCase();
      mappings.push({ ticker, contractAddress: address });
    }
  }

  return mappings;
}

async function fetchAndUpdateDnaBalances() {
  try {
    // Set Zora API key if available
    const zoraApiKey = process.env.VITE_ZORA_API_KEY;
    if (zoraApiKey) {
      setApiKey(zoraApiKey);
    }

    // Fetch top DNA token holders - use CSV data as source of truth
    const speciesMappings = parseSpeciesTickersCSV();
    const dnaTokenAddresses: string[] = speciesMappings.map(m => m.contractAddress);

    console.log(`Using ${dnaTokenAddresses.length} DNA token addresses from CSV for leaderboard`);

    const holderBalances: Record<string, number> = {};
    const batchSize = 10;
    const maxTokens = 50;
    
    for (let i = 0; i < Math.min(dnaTokenAddresses.length, maxTokens); i += batchSize) {
      const batch = dnaTokenAddresses.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (tokenAddress) => {
          try {
            let cursor: string | undefined = undefined;
            let hasMore = true;

            while (hasMore) {
              const holdersResponse = await getCoinHolders({
                address: tokenAddress,
                chainId: base.id,
                count: 100,
                after: cursor,
              });

              const tokenBalances = holdersResponse.data?.zora20Token?.tokenBalances;
              const edges = tokenBalances?.edges || [];
              const pageInfo = tokenBalances?.pageInfo;

              edges.forEach((edge: any) => {
                const node = edge.node;
                const holderAddress = node?.ownerAddress || node?.address || '';
                const balance = node?.balance || '0';

                if (holderAddress && balance) {
                  const balanceFormatted = parseFloat(formatUnits(BigInt(balance), 18));
                  if (balanceFormatted > 0.000001) {
                    holderBalances[holderAddress.toLowerCase()] = 
                      (holderBalances[holderAddress.toLowerCase()] || 0) + balanceFormatted;
                  }
                }
              });

              cursor = pageInfo?.endCursor;
              hasMore = pageInfo?.hasNextPage || false;
            }
          } catch (error) {
            console.error(`Error fetching holders for token ${tokenAddress}:`, error);
          }
        })
      );
    }

    // Update database with the fetched DNA balances
    const addresses = Object.keys(holderBalances);
    let updatedCount = 0;

    console.log(`Found ${addresses.length} wallets with DNA balances`);
    console.log('Top 10 balances:', Object.entries(holderBalances)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
    );

    for (const address of addresses) {
      const dnaBalance = holderBalances[address];
      
      // Update or insert the wallet with DNA balance
      const { error } = await supabase
        .from('wallets')
        .upsert({
          address: address,
          total_dna_balance: dnaBalance
        }, {
          onConflict: 'address'
        });
        
      if (!error) {
        updatedCount++;
        if (updatedCount % 100 === 0) {
          console.log(`Updated ${updatedCount} wallets...`);
        }
      } else {
        console.error(`Error updating DNA balance for ${address}:`, error);
      }
    }

    console.log(`Successfully updated DNA balances for ${updatedCount} wallets`);
    return {
      success: true,
      updatedCount,
    };

  } catch (error) {
    console.error('Error fetching and updating DNA balances:', error);
    return {
      success: false,
      updatedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Run the script
fetchAndUpdateDnaBalances()
  .then(result => {
    console.log('Script completed:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });