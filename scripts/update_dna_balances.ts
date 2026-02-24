import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http, formatUnits, Address, erc20Abi } from 'viem';
import { getCoinHolders, setApiKey } from '@zoralabs/coins-sdk';
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

// Create public client for Base chain
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

// Retry helper function
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Unknown error after retries');
}

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

    // Get all DNA token addresses from CSV
    const speciesMappings = parseSpeciesTickersCSV();
    const dnaTokenAddresses: string[] = speciesMappings.map(m => m.contractAddress);

    console.log(`Using ${dnaTokenAddresses.length} DNA token addresses from CSV`);

    // Step 1: Discover all wallet addresses by checking holders of each token
    console.log('\nStep 1: Discovering all wallet addresses from token holders...');
    const discoveredWallets = new Set<string>();
    const batchSize = 10;
    const totalTokens = dnaTokenAddresses.length;

    for (let i = 0; i < dnaTokenAddresses.length; i += batchSize) {
      const batch = dnaTokenAddresses.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(totalTokens / batchSize);
      
      console.log(`  Processing batch ${batchNum}/${totalBatches} (tokens ${i + 1}-${Math.min(i + batchSize, totalTokens)} of ${totalTokens})...`);

      await Promise.all(
        batch.map(async (tokenAddress) => {
          try {
            let cursor: string | undefined = undefined;
            let hasMore = true;
            const ticker = speciesMappings.find(m => m.contractAddress.toLowerCase() === tokenAddress.toLowerCase())?.ticker || 'Unknown';

            while (hasMore) {
              try {
                const holdersResponse = await retryWithBackoff(async () => {
                  return await getCoinHolders({
                    address: tokenAddress,
                    chainId: base.id,
                    count: 100,
                    after: cursor,
                  });
                }, 3, 1000); // 3 retries with exponential backoff

                const tokenBalances = holdersResponse.data?.zora20Token?.tokenBalances;
                const edges = tokenBalances?.edges || [];
                const pageInfo = tokenBalances?.pageInfo;

                if (edges.length === 0 && !cursor) {
                  break;
                }

                // Collect all wallet addresses from this token
                edges.forEach((edge: any) => {
                  const node = edge.node;
                  const holderAddress = node?.ownerAddress || node?.address || '';
                  if (holderAddress) {
                    discoveredWallets.add(holderAddress.toLowerCase());
                  }
                });

                cursor = pageInfo?.endCursor;
                hasMore = pageInfo?.hasNextPage || false;
                
                if (hasMore) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              } catch (error) {
                const ticker = speciesMappings.find(m => m.contractAddress.toLowerCase() === tokenAddress.toLowerCase())?.ticker || 'Unknown';
                console.error(`  ⚠️  Failed to fetch holders for token ${ticker} (${tokenAddress}) after retries:`, error instanceof Error ? error.message : String(error));
                // Break the while loop for this token and continue with next token
                break;
              }
            }
          } catch (error) {
            const ticker = speciesMappings.find(m => m.contractAddress.toLowerCase() === tokenAddress.toLowerCase())?.ticker || 'Unknown';
            console.error(`  ⚠️  Error processing token ${ticker} (${tokenAddress}):`, error instanceof Error ? error.message : String(error));
          }
        })
      );
    }

    const walletAddresses = Array.from(discoveredWallets);
    console.log(`\nDiscovered ${walletAddresses.length} unique wallet addresses from token holders`);

    // Step 2: For each discovered wallet, call balanceOf on all tokens to get accurate balances
    console.log('\nStep 2: Calculating accurate balances using balanceOf for each wallet...');
    const holderBalances: Record<string, number> = {};
    const holderTokenCounts: Record<string, Set<string>> = {};
    const walletBatchSize = 20; // Process wallets in batches
    const tokenBatchSize = 20; // Process tokens in batches per wallet

    // Process wallets in batches
    for (let walletIdx = 0; walletIdx < walletAddresses.length; walletIdx += walletBatchSize) {
      const walletBatch = walletAddresses.slice(walletIdx, walletIdx + walletBatchSize);
      const batchNum = Math.floor(walletIdx / walletBatchSize) + 1;
      const totalBatches = Math.ceil(walletAddresses.length / walletBatchSize);
      
      console.log(`  Processing wallet batch ${batchNum}/${totalBatches} (wallets ${walletIdx + 1}-${Math.min(walletIdx + walletBatchSize, walletAddresses.length)} of ${walletAddresses.length})...`);

      // Process each wallet in the batch
      await Promise.all(
        walletBatch.map(async (walletAddress, walletBatchIdx) => {
          try {
            const normalizedAddress = walletAddress.toLowerCase();
            let walletTotalBalance = 0;
            const walletTokens = new Set<string>();

            // Process tokens in batches for each wallet
            for (let tokenIdx = 0; tokenIdx < dnaTokenAddresses.length; tokenIdx += tokenBatchSize) {
              const tokenBatch = dnaTokenAddresses.slice(tokenIdx, tokenIdx + tokenBatchSize);
              
              // Call balanceOf for all tokens in this batch with retry logic
              await Promise.all(
                tokenBatch.map(async (tokenAddress) => {
                  const ticker = speciesMappings.find(m => m.contractAddress.toLowerCase() === tokenAddress.toLowerCase())?.ticker || 'Unknown';
                  
                  try {
                    const balance = await retryWithBackoff(async () => {
                      return await publicClient.readContract({
                        address: tokenAddress as Address,
                        abi: erc20Abi,
                        functionName: 'balanceOf',
                        args: [walletAddress as Address],
                      }) as bigint;
                    }, 3, 1000); // 3 retries with 1s, 2s, 4s delays

                    const balanceFormatted = parseFloat(formatUnits(balance, 18));
                    
                    if (balanceFormatted > 0.000001) {
                      walletTotalBalance += balanceFormatted;
                      walletTokens.add(ticker);
                    }
                  } catch (error) {
                    // Log error but don't fail the entire process
                    console.error(`  ⚠️  Failed to get balance for ${walletAddress.slice(0, 10)}... on ${ticker} after retries:`, error instanceof Error ? error.message : String(error));
                    // Continue processing other tokens
                  }
                })
              );
            }

            if (walletTotalBalance > 0) {
              holderBalances[normalizedAddress] = walletTotalBalance;
              holderTokenCounts[normalizedAddress] = walletTokens;
              
              // Log progress for wallets with significant balances
              if (walletTotalBalance > 1000000) {
                console.log(`  ✓ ${walletAddress.slice(0, 10)}...: ${walletTotalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} DNA (${walletTokens.size} tokens)`);
              }
            }
          } catch (error) {
            console.error(`Error processing wallet ${walletAddress}:`, error);
          }
        })
      );
    }

    // Update database with the fetched DNA balances
    const addresses = Object.keys(holderBalances);
    let updatedCount = 0;

    console.log(`\nFound ${addresses.length} wallets with DNA balances`);
    console.log('\nTop 10 balances:');
    const top10 = Object.entries(holderBalances)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    top10.forEach(([address, balance], index) => {
      console.log(`  ${index + 1}. ${address}: ${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
    });
    
    // Check specific wallet if provided
    const checkWallet = '0x57bcd9147d9d9507be65ccceabab6c47002a7dd0';
    const checkWalletLower = checkWallet.toLowerCase();
    if (holderBalances[checkWalletLower]) {
      const calculatedBalance = holderBalances[checkWalletLower];
      const tokenCount = holderTokenCounts[checkWalletLower]?.size || 0;
      console.log(`\n✅ Wallet ${checkWallet} (using balanceOf):`);
      console.log(`   Calculated balance: ${calculatedBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      console.log(`   Expected: 427,034,930`);
      const difference = Math.abs(427034930 - calculatedBalance);
      console.log(`   Difference: ${difference.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${((difference / 427034930) * 100).toFixed(4)}%)`);
      console.log(`   Tokens found: ${tokenCount} (expected: 29)`);
      if (holderTokenCounts[checkWalletLower]) {
        console.log(`   Token tickers found: ${Array.from(holderTokenCounts[checkWalletLower]).sort().join(', ')}`);
      }
    } else {
      console.log(`\n⚠️  Wallet ${checkWallet} not found in database or has no DNA balance!`);
    }

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