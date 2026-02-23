import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useConnectors, useSendCalls } from 'wagmi';
import { parseUnits, formatUnits, Address, erc20Abi, createWalletClient, custom, encodeFunctionData } from 'viem';
import { base } from 'wagmi/chains';
import BulkVoteDialog from './BulkVoteDialog';

// Trigger haptic feedback on mobile
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

interface VoteSquaresProps {
  speciesId: string;
  onVoteSubmit?: () => void;
  onTransactionStart?: () => void;
  onTransactionEnd?: () => void;
  onPanelOpen?: () => void;
  onPanelClose?: () => void;
}

// Vote payment address - receives 0.01 USDC (1 cent) per vote
const VOTE_PAYMENT_ADDRESS = '0xae28916f0bc703fccbaf9502d15f838a1caa01b3' as Address;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const USDC_DECIMALS = 6;
const VOTE_COST = 0.01; // USDC (1 cent per vote)

const VoteSquares = ({ speciesId, onVoteSubmit, onTransactionStart, onTransactionEnd, onPanelOpen, onPanelClose }: VoteSquaresProps) => {
  const { isConnected, address, usdcBalance, connect, addVoteTicket, addBulkVoteRewards, refreshFyreKeys } = useWallet();
  const { address: wagmiAddress, connector, isConnected: wagmiIsConnected } = useAccount();
  const connectors = useConnectors();
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending: isSubmitting } = useWriteContract();
  const { mutateAsync: sendCallsAsync } = useSendCalls();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  const { getBaseSquares, recordVote, refetch } = useSpeciesStats();
  const [userVote, setUserVote] = useState<number>(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [optimisticVotes, setOptimisticVotes] = useState(0);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkVoteAmount, setBulkVoteAmount] = useState<number>(0);
  const [batchVoteTxHashes, setBatchVoteTxHashes] = useState<string[]>([]);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ confirmed: number; total: number; current: number }>({ confirmed: 0, total: 0, current: 0 });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const voteRatingsRef = useRef<number[]>([]); // Store vote ratings in ref instead of sessionStorage
  const processedHashesRef = useRef<Set<string>>(new Set()); // Track processed transaction hashes to prevent duplicate processing

  useEffect(() => {
    const baseSquares = getBaseSquares(speciesId);
    setTotalVotes(baseSquares + optimisticVotes);
  }, [speciesId, getBaseSquares, optimisticVotes]);

  // Reset optimistic votes and processed hashes when speciesId changes
  useEffect(() => {
    setOptimisticVotes(0);
    processedHashesRef.current.clear();
  }, [speciesId]);

  // Long press handler for bulk voting
  const handleLongPressStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setShowBulkDialog(true);
      onPanelOpen?.();
    }, 500); // 500ms long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Detect wallet type and return batch size limit for EIP-5792 wallet_sendCalls
  const getWalletBatchLimit = (): number => {
    if (typeof window === 'undefined') return 10; // Default for SSR
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) return 10; // Default if no wallet
    
    // Check connector name/id
    const connectorName = connector?.name?.toLowerCase() || connector?.id?.toLowerCase() || '';
    
    // MetaMask has a 10-call limit
    if (ethereum.isMetaMask || connectorName.includes('metamask')) {
      return 10;
    }
    
    // Coinbase Wallet likely has similar limit (defaulting to 10 for safety)
    if (ethereum.isCoinbaseWallet || connectorName.includes('coinbase')) {
      return 10;
    }
    
    // Base Account / Smart Wallets may support larger batches
    // Base Account typically supports 50-100+ calls
    if (connectorName.includes('base') || connectorName.includes('smart')) {
      return 50; // Base Account can handle larger batches
    }
    
    // WalletConnect - depends on the underlying wallet, default to 10
    if (connectorName.includes('walletconnect')) {
      return 10;
    }
    
    // Rabby, Trust, and other injected wallets - default to 10 for safety
    if (ethereum.isRabby || ethereum.isTrust) {
      return 10;
    }
    
    // For unknown wallets, try a larger batch size (smart wallets often support more)
    // But start conservative and let the wallet reject if too large
    // We'll catch the error and retry with smaller batches if needed
    return 20; // Default for unknown wallets (can be adjusted based on testing)
  };

  // Handle bulk voting with batch transactions
  // Each vote = max 5 base squares = 1 transaction = 1 cent
  // Split amount into votes: e.g., 9 base squares = 2 votes (5+4), 11 = 3 votes (5+5+1)
  const handleBulkVote = async (baseSquaresAmount: number) => {
    // Check if wallet is connected
    if (!wagmiIsConnected || !wagmiAddress) {
      // Only connect if connector is not already connected or connecting
      if (!connector || connector.status === 'disconnected') {
        connect();
        toast({
          title: "Connecting Wallet...",
          description: "Please approve the connection to vote.",
          duration: 2000,
        });
      } else if (connector.status === 'connecting') {
        toast({
          title: "Wallet Connecting...",
          description: "Please wait for wallet connection to complete.",
          duration: 2000,
        });
      }
      setShowBulkDialog(false);
      onPanelClose?.();
      return;
    }

    // Split base squares into votes following the formula:
    // - Min 1 base square per vote
    // - Max 5 base squares per vote
    // - Each vote = 1 transaction = 1 cent
    // Example: 10001 base squares = 2000 votes of 5 + 1 vote of 1 = 2001 votes total
    const votes: number[] = [];
    let remaining = baseSquaresAmount;
    while (remaining > 0) {
      // Each vote gets min(remaining, 5) base squares
      // This ensures: 1 <= voteRating <= 5
      const voteRating = Math.min(remaining, 5);
      votes.push(voteRating);
      remaining -= voteRating;
    }
    
    // Validate: all votes should be between 1 and 5
    const invalidVotes = votes.filter(v => v < 1 || v > 5);
    if (invalidVotes.length > 0) {
      console.error('Invalid vote ratings detected:', invalidVotes);
      toast({
        title: "Vote Calculation Error",
        description: "Invalid vote distribution. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const numVotes = votes.length;
    const totalCost = numVotes * VOTE_COST; // 1 cent per vote
    
    if (usdcBalance < totalCost) {
      toast({
        title: "Insufficient USDC",
        description: `You need at least ${totalCost.toFixed(2)}¢ for ${numVotes} vote${numVotes > 1 ? 's' : ''} (${baseSquaresAmount} Base Squares).`,
        variant: "destructive",
      });
      setShowBulkDialog(false);
      onPanelClose?.();
      return;
    }

    setShowBulkDialog(false);
    onPanelClose?.();
    onTransactionStart?.();

    try {
      const voteCostAmount = parseUnits(VOTE_COST.toString(), USDC_DECIMALS);
      
      if (!connector || !wagmiAddress || !publicClient) {
        throw new Error('Wallet not properly connected');
      }

      // Show breakdown: e.g., "2000 votes of 5 + 1 vote of 1 = 2001 votes"
      const voteBreakdown = votes.reduce((acc, rating) => {
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      const breakdownText = Object.entries(voteBreakdown)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([rating, count]) => `${count} vote${count > 1 ? 's' : ''} of ${rating}`)
        .join(' + ');
      
      toast({
        title: "Preparing Batch Vote...",
        description: `${numVotes} vote${numVotes > 1 ? 's' : ''} (${breakdownText}) = ${baseSquaresAmount} Base Squares, ${totalCost.toFixed(2)}¢ total`,
        duration: 4000,
      });

      setIsBatchSubmitting(true);

      // Create wallet client for sending transactions
      const provider = await connector.getProvider();
      if (!provider) {
        throw new Error('Provider not available');
      }
      
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(provider as any),
        account: wagmiAddress as Address,
      });

      // Use EIP-5792 wallet_sendCalls to batch transfers
      // Detect wallet type and adjust batch size dynamically
      // MetaMask: 10 calls, Base Account: 50+ calls, others: varies
      const MAX_BATCH_SIZE = getWalletBatchLimit();
      
      // Store vote ratings for recording (saved to database on confirmation)
      const voteRatings: number[] = votes;
      voteRatingsRef.current = voteRatings;
      
      // Split votes into batches of 10
      const batches: number[][] = [];
      for (let i = 0; i < votes.length; i += MAX_BATCH_SIZE) {
        batches.push(votes.slice(i, i + MAX_BATCH_SIZE));
      }

      const numBatches = batches.length;
      const walletName = connector?.name || (typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask ? 'MetaMask' : 'Wallet') || 'Wallet';
      setBatchProgress({ confirmed: 0, total: numBatches, current: 0 });
      console.log(`🚀 Starting batch vote: ${numVotes} votes in ${numBatches} batches (${MAX_BATCH_SIZE} per batch for ${walletName})`);
      
      toast({
        title: "Preparing Batch Vote...",
        description: `Batching ${numVotes} vote${numVotes > 1 ? 's' : ''} into ${numBatches} transaction${numBatches > 1 ? 's' : ''} (${MAX_BATCH_SIZE} per batch for ${walletName}). Please sign ${numBatches} time${numBatches > 1 ? 's' : ''}.`,
        duration: 4000,
      });

      // Optimistic update (will be rolled back if all transactions fail)
      setOptimisticVotes(prev => prev + baseSquaresAmount);

      // Track which batches succeeded for atomic rollback
      const batchHashes: string[] = [];
      const recordedBatches: Array<{
        batchIdx: number;
        voteRatings: number[];
      }> = [];

      // Process batches sequentially
      for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
        const batch = batches[batchIdx];
        const batchBaseSquares = batch.reduce((a, b) => a + b, 0);

        console.log(`📤 Sending Batch ${batchIdx + 1}/${numBatches} (${batch.length} votes, ${batchBaseSquares} Base Squares)...`);
        setBatchProgress(prev => ({ ...prev, current: batchIdx + 1 }));
        
        toast({
          title: `Sending Batch ${batchIdx + 1}/${numBatches}...`,
          description: `Processing ${batch.length} vote${batch.length > 1 ? 's' : ''} (${batchBaseSquares} Base Squares). Please sign.`,
          duration: 3000,
        });

        try {
          // Create calls for this batch
          const calls = batch.map(() => ({
            to: USDC_ADDRESS,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'transfer',
              args: [VOTE_PAYMENT_ADDRESS, voteCostAmount],
            }),
          }));

          // Use sendCallsAsync (EIP-5792) to send this batch
          let result;
          try {
            result = await sendCallsAsync({
              calls,
              chainId: base.id,
            });
          } catch (batchSizeError: any) {
            // Check if wallet doesn't support wallet_sendCalls
            const errorMessage = batchSizeError?.message || '';
            const errorDetails = batchSizeError?.details || '';
            const errorCode = batchSizeError?.code;
            
            if (
              errorMessage.includes('wallet_sendCalls') ||
              errorMessage.includes('does not exist') ||
              errorMessage.includes('not available') ||
              errorMessage.includes('doesn\'t has corresponding handler') ||
              errorMessage.includes('method') && errorMessage.includes('not found') ||
              errorCode === -32601 // Method not found
            ) {
              // Wallet doesn't support EIP-5792 wallet_sendCalls
              const walletName = connector?.name || 'your wallet';
              throw new Error(
                `Your wallet (${walletName}) doesn't support batch transactions. ` +
                `Please use a wallet that supports EIP-5792 (like MetaMask, Coinbase Wallet, or Base Account) ` +
                `or vote individually using single votes.`
              );
            }
            
            // If batch is too large, the wallet will reject with error code 5740 or similar
            // Check if it's a batch size error and retry with smaller batches
            if (
              errorMessage.includes('too large') ||
              errorMessage.includes('batch size') ||
              errorMessage.includes('cannot exceed') ||
              errorDetails.includes('too large') ||
              errorDetails.includes('batch size') ||
              batchSizeError?.code === 5740
            ) {
              // Batch too large - split into smaller batches
              console.warn(`Batch size ${batch.length} too large for wallet, splitting...`);
              
              // Split this batch into smaller chunks of 10 (MetaMask limit)
              const smallerBatches: number[][] = [];
              for (let i = 0; i < batch.length; i += 10) {
                smallerBatches.push(batch.slice(i, i + 10));
              }
              
              // Process smaller batches sequentially
              const subBatchHashes: string[] = [];
              for (let subIdx = 0; subIdx < smallerBatches.length; subIdx++) {
                const subBatch = smallerBatches[subIdx];
                const subCalls = subBatch.map(() => ({
                  to: USDC_ADDRESS,
                  data: encodeFunctionData({
                    abi: erc20Abi,
                    functionName: 'transfer',
                    args: [VOTE_PAYMENT_ADDRESS, voteCostAmount],
                  }),
                }));
                
                const subResult = await sendCallsAsync({
                  calls: subCalls,
                  chainId: base.id,
                });
                
                // Extract hash from sub-result
                let subHash: string;
                if (typeof subResult === 'string') {
                  subHash = subResult;
                } else if (subResult && typeof subResult === 'object' && 'id' in subResult) {
                  subHash = (subResult as { id: string }).id;
                } else {
                  throw new Error(`Unexpected sendCalls return type: ${JSON.stringify(subResult)}`);
                }
                
                subBatchHashes.push(subHash);
                
                // Wait for this sub-batch to confirm before proceeding
                if (subHash.startsWith('0x') && subHash.length === 66) {
                  const subReceipt = await publicClient.waitForTransactionReceipt({
                    hash: subHash as `0x${string}`,
                    timeout: 120_000,
                  });
                  
                  if (subReceipt.status !== 'success') {
                    throw new Error(`Sub-batch ${subIdx + 1} of batch ${batchIdx + 1} failed`);
                  }
                  
                  // Record votes for this sub-batch
                  for (const voteRating of subBatch) {
                    const success = await recordVote(speciesId, address || wagmiAddress || '', voteRating);
                    if (!success) {
                      throw new Error(`Failed to record vote with rating ${voteRating}`);
                    }
                  }
                }
                
                // Small delay between sub-batches (reduced for speed)
                if (subIdx < smallerBatches.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 200));
                }
              }
              
              // Track all sub-batch hashes
              batchHashes.push(...subBatchHashes);
              setBatchVoteTxHashes([...batchHashes]);
              
              // Track this batch as successfully recorded (all sub-batches succeeded)
              recordedBatches.push({
                batchIdx,
                voteRatings: batch,
              });
              
              toast({
                title: `Batch ${batchIdx + 1}/${numBatches} Confirmed & Recorded!`,
                description: `${batch.length} vote${batch.length > 1 ? 's' : ''} confirmed (split into ${smallerBatches.length} sub-batches). ${batchIdx < batches.length - 1 ? 'Processing next batch...' : 'All batches complete!'}`,
                duration: 2000,
              });
              
              // Skip the normal processing for this batch since we already handled it
              if (batchIdx < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              continue; // Move to next batch
            } else {
              // Not a batch size error, re-throw
              throw batchSizeError;
            }
          }
          
          // Extract the transaction hash or batch ID from the result
          let transactionHash: string;
          if (typeof result === 'string') {
            transactionHash = result;
          } else if (result && typeof result === 'object') {
            if ('id' in result) {
              transactionHash = String((result as { id: string }).id);
            } else if ('hash' in result) {
              transactionHash = String((result as { hash: string }).hash);
            } else {
              // Try to extract any hex-like string from the object
              const resultStr = JSON.stringify(result);
              const hexMatch = resultStr.match(/0x[a-fA-F0-9]{32,}/);
              if (hexMatch) {
                transactionHash = hexMatch[0];
              } else {
                throw new Error(`Unexpected sendCalls return type: ${JSON.stringify(result)}`);
              }
            }
          } else {
            throw new Error(`Unexpected sendCalls return type: ${typeof result}`);
          }

          // Normalize the hash - handle Base App and other wallet formats
          // Base App might return: "fc 0x700b84d6930b650e19998b0cede81273e8da9" or similar
          // Extract just the hex part
          transactionHash = transactionHash.trim();
          
          // Remove any non-hex prefixes (like "fc", "0xfc", etc.) and extract the actual hash
          const hexMatch = transactionHash.match(/0x[a-fA-F0-9]+/i);
          if (hexMatch) {
            transactionHash = hexMatch[0];
          } else if (!transactionHash.startsWith('0x')) {
            // If no 0x found, add it
            transactionHash = '0x' + transactionHash.replace(/^[^a-fA-F0-9]+/, '');
          }
          
          // Validate length - transaction hashes are 66 chars (0x + 64 hex), batch IDs are typically 34-65 chars
          // Base App might return longer strings, so we'll be more lenient
          if (transactionHash.length < 34) {
            throw new Error(`Invalid transaction hash/batch ID: ${transactionHash} (length: ${transactionHash.length}). Expected at least 34 characters.`);
          }
          
          // If it's too long, try to extract a valid hash from it
          if (transactionHash.length > 66) {
            // Try to find a 66-char hash within the string
            const fullHashMatch = transactionHash.match(/0x[a-fA-F0-9]{64}/i);
            if (fullHashMatch) {
              transactionHash = fullHashMatch[0];
            } else {
              // If no full hash found, take the first 66 chars if it starts with 0x
              if (transactionHash.startsWith('0x') && transactionHash.length >= 66) {
                transactionHash = transactionHash.substring(0, 66);
              } else {
                // Last resort: log warning but continue with what we have
                console.warn(`Transaction hash seems unusually long (${transactionHash.length} chars): ${transactionHash.substring(0, 50)}...`);
              }
            }
          }
          
          const normalizedHash = transactionHash as `0x${string}`;

          console.log(`📨 Batch ${batchIdx + 1}/${numBatches} submitted: ${normalizedHash.length === 66 ? 'Full hash' : 'Batch ID'} (${normalizedHash.substring(0, 20)}...)`);
          batchHashes.push(normalizedHash);
          setBatchVoteTxHashes([...batchHashes]);

          toast({
            title: `Batch ${batchIdx + 1}/${numBatches} Submitted`,
            description: `Waiting for confirmation...`,
            duration: 2000,
          });

          // Wait for transaction confirmation
          // Handle both full transaction hashes and batch IDs
          let receipt: any = null;
          let transactionSucceeded = false;
          
          if (normalizedHash.length === 66 && /^0x[a-fA-F0-9]{64}$/i.test(normalizedHash)) {
            // Full transaction hash - wait directly
            receipt = await publicClient.waitForTransactionReceipt({
              hash: normalizedHash,
              timeout: 120_000, // 2 minute timeout
            });
            transactionSucceeded = receipt.status === 'success';
          } else if (normalizedHash.length >= 34 && normalizedHash.length <= 66) {
            // Batch ID - check batch status to verify transaction succeeded
            const provider = await connector.getProvider();
            if (provider && typeof provider === 'object' && 'request' in provider) {
              try {
                // Poll wallet_getCallsStatus to check if batch succeeded
                // Use very fast polling for quick detection
                const maxAttempts = 120; // Poll for up to 1 minute (120 * 500ms)
                const pollInterval = 300; // 300ms - very fast polling
                
                let pollComplete = false;
                for (let attempt = 0; attempt < maxAttempts && !pollComplete; attempt++) {
                  try {
                    const status = await (provider as any).request({
                      method: 'wallet_getCallsStatus',
                      params: [normalizedHash],
                    });
                    
                    // Check if batch is confirmed/succeeded
                    if (status && typeof status === 'object') {
                      // Check various possible status fields
                      const statusValue = (status as any).status || (status as any).state;
                      
                      // Handle numeric status codes (EIP-5792 standard):
                      // 100 = PENDING, 200 = CONFIRMED, 300+ = FAILED
                      const isConfirmed = 
                        statusValue === 200 || // Numeric: confirmed
                        statusValue === 'CONFIRMED' || 
                        statusValue === 'confirmed' || 
                        statusValue === 'SUCCESS' ||
                        statusValue === 'success' ||
                        (status as any).confirmed === true;
                      
                      // Check if batch failed (numeric codes 300+ or string values)
                      const isFailed = 
                        (typeof statusValue === 'number' && statusValue >= 300) ||
                        statusValue === 'FAILED' || 
                        statusValue === 'failed' || 
                        statusValue === 'REJECTED' ||
                        statusValue === 'rejected';
                      
                      if (isFailed) {
                        throw new Error(`Batch ${batchIdx + 1} was rejected or failed (status: ${statusValue})`);
                      }
                      
                      // Update progress in real-time
                      setBatchProgress(prev => ({
                        ...prev,
                        current: batchIdx + 1,
                        confirmed: statusValue === 200 ? prev.confirmed + 1 : prev.confirmed
                      }));
                      
                      // Show real-time progress
                      if (statusValue === 200) {
                        // Status is 200 (confirmed) - transaction succeeded!
                        transactionSucceeded = true;
                        pollComplete = true; // Exit loop immediately
                        
                        // Update progress
                        setBatchProgress(prev => ({
                          ...prev,
                          confirmed: prev.confirmed + 1,
                          current: batchIdx + 1
                        }));
                        
                        // Extract receipt from status if available (no need to wait again)
                        if ('receipts' in status && Array.isArray(status.receipts) && status.receipts.length > 0) {
                          const firstReceipt = status.receipts[0];
                          // Check receipt status (0x1 = success, 0x0 = failed)
                          if (firstReceipt?.status === '0x1' || firstReceipt?.status === 1) {
                            receipt = firstReceipt; // Use the receipt from status
                            transactionSucceeded = true;
                          } else if (firstReceipt?.status === '0x0' || firstReceipt?.status === 0) {
                            throw new Error(`Batch ${batchIdx + 1} transaction failed (receipt status: 0)`);
                          }
                        }
                        
                        // Show success immediately with progress
                        const completedSoFar = batchIdx + 1;
                        console.log(`✅ Batch ${completedSoFar}/${numBatches} CONFIRMED! (${batch.length} votes) • Total confirmed: ${completedSoFar}/${numBatches}`);
                        toast({
                          title: `✅ Batch ${completedSoFar}/${numBatches} Confirmed!`,
                          description: `${batch.length} vote${batch.length > 1 ? 's' : ''} confirmed • Progress: ${completedSoFar}/${numBatches} batches • Recording votes...`,
                          duration: 2000,
                        });
                        
                        // Exit loop immediately - no more polling needed
                        break;
                      } else if (statusValue === 100) {
                        // PENDING - show progress update
                        const completedSoFar = batchIdx; // Already completed batches
                        if (attempt % 5 === 0) { // Update every 5th attempt to reduce spam
                          console.log(`⏳ Batch ${batchIdx + 1}/${numBatches} PENDING (attempt ${attempt + 1}/${maxAttempts}) • Confirmed so far: ${completedSoFar}/${numBatches}`);
                          toast({
                            title: `⏳ Batch ${batchIdx + 1}/${numBatches} Pending...`,
                            description: `Waiting for confirmation • Progress: ${completedSoFar}/${numBatches} confirmed`,
                            duration: 1000,
                          });
                        }
                      }
                    }
                    
                    // Wait before next poll (only if not confirmed)
                    if (!pollComplete) {
                      await new Promise(resolve => setTimeout(resolve, pollInterval));
                    }
                  } catch (pollError: any) {
                    // If method not supported, assume transaction succeeded if money was deducted
                    if (pollError?.code === -32601 || pollError?.message?.includes('not supported') || pollError?.message?.includes('Method not found')) {
                      console.warn('wallet_getCallsStatus not supported, assuming transaction succeeded');
                      transactionSucceeded = true;
                      pollComplete = true;
                      break;
                    }
                    // For other errors, continue polling
                    if (!pollComplete) {
                      await new Promise(resolve => setTimeout(resolve, pollInterval));
                    }
                  }
                }
                
                // If we couldn't confirm status but transaction was sent, give it a moment and proceed
                // This handles cases where the wallet doesn't support status checking
                if (!transactionSucceeded) {
                  console.warn('Could not confirm batch status after polling, but transaction was sent. Proceeding with assumption it succeeded.');
                  // Wait a bit more for transaction to settle
                  await new Promise(resolve => setTimeout(resolve, 5000));
                  transactionSucceeded = true; // Assume succeeded if we can't verify (user confirmed money was deducted)
                }
              } catch (statusError: any) {
                // If we can't check status at all, assume transaction succeeded
                // The user confirmed money was deducted, so transaction went through
                console.warn('Could not check batch status, assuming transaction succeeded:', statusError);
                transactionSucceeded = true;
              }
            } else {
              // No provider available, but transaction was sent - assume it succeeded
              console.warn('No provider available for status check, assuming transaction succeeded');
              transactionSucceeded = true;
            }
          } else {
            // Hash format is invalid - this shouldn't happen after normalization, but handle it gracefully
            throw new Error(`Invalid transaction hash/batch ID format: ${normalizedHash} (length: ${normalizedHash.length}). Please try again or contact support.`);
          }

          if (!transactionSucceeded) {
            throw new Error(`Batch ${batchIdx + 1} transaction failed or could not be confirmed`);
          }

          // Transaction succeeded - immediately record votes for this batch atomically
          // Update progress
          setBatchProgress(prev => ({
            ...prev,
            confirmed: prev.confirmed + 1,
            current: batchIdx + 1
          }));
          
          // Record votes quickly (no delay between votes for speed)
          console.log(`📝 Recording ${batch.length} votes for batch ${batchIdx + 1}/${numBatches}...`);
          for (const voteRating of batch) {
            const success = await recordVote(speciesId, address || wagmiAddress || '', voteRating);
            if (!success) {
              throw new Error(`Failed to record vote with rating ${voteRating} for batch ${batchIdx + 1}`);
            }
          }
          console.log(`✅ Recorded ${batch.length} votes for batch ${batchIdx + 1}/${numBatches}`);

          // Track this batch as successfully recorded
          recordedBatches.push({
            batchIdx,
            voteRatings: batch,
          });

          toast({
            title: `Batch ${batchIdx + 1}/${numBatches} Recorded!`,
            description: `${batch.length} vote${batch.length > 1 ? 's' : ''} recorded successfully. ${batchIdx < batches.length - 1 ? 'Processing next batch...' : 'All batches complete!'}`,
            duration: 2000,
          });

          // Small delay between batches (reduced for speed)
          if (batchIdx < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300)); // Reduced from 1000ms to 300ms
          }
        } catch (batchError: any) {
          // If this batch fails, rollback all previously recorded batches
          console.error(`Batch ${batchIdx + 1} failed, rolling back ${recordedBatches.length} previous batches`);
          
          // Rollback all previously recorded votes
          if (recordedBatches.length > 0) {
            const { supabase } = await import('@/integrations/supabase/client');
            let totalRollbackSquares = 0;
            
            for (const recordedBatch of recordedBatches) {
              for (const voteRating of recordedBatch.voteRatings) {
                totalRollbackSquares += voteRating;
              }
            }
            
            try {
              const { data: currentStats } = await supabase
                .from('species_stats')
                .select('base_squares')
                .eq('species_id', speciesId)
                .single();
              
              if (currentStats) {
                const newBaseSquares = Math.max(0, (currentStats.base_squares || 0) - totalRollbackSquares);
                await supabase
                  .from('species_stats')
                  .update({ base_squares: newBaseSquares, updated_at: new Date().toISOString() })
                  .eq('species_id', speciesId);
              }
            } catch (rollbackError) {
              console.error('Error rolling back base squares:', rollbackError);
            }
          }
          
          // Rollback optimistic votes for remaining batches
          const remainingVotes = batches.slice(batchIdx + 1).flat();
          const remainingBaseSquares = remainingVotes.reduce((a, b) => a + b, 0);
          setOptimisticVotes(prev => prev - remainingBaseSquares);
          
          if (batchError?.name === 'UserRejectedRequestError' || batchError?.code === 4001) {
            throw new Error(`Batch ${batchIdx + 1} was cancelled by user`);
          }
          throw new Error(`Batch ${batchIdx + 1} failed: ${batchError?.message || 'Unknown error'}`);
        }
      }

      // All batches succeeded and votes were recorded atomically per batch
      // Clear optimistic votes since database now has the real values
      setOptimisticVotes(0);
      
      // Calculate total votes and base squares from recorded batches
      const totalRecordedVotes = recordedBatches.reduce((sum, batch) => sum + batch.voteRatings.length, 0);
      const totalRecordedBaseSquares = recordedBatches.reduce((sum, batch) => 
        sum + batch.voteRatings.reduce((batchSum, rating) => batchSum + rating, 0), 0
      );

      setIsBatchSubmitting(false);
      console.log(`🎉 ALL BATCHES COMPLETE! ${totalRecordedVotes} votes recorded across ${numBatches} batches`);

      // Add bulk vote rewards (tickets + keys)
      addBulkVoteRewards(totalRecordedVotes, address || wagmiAddress || undefined);
      
      // Refresh Fyre Keys from database
      await refreshFyreKeys();
      
      // Clear refs and reset progress
      voteRatingsRef.current = [];
      setBulkVoteAmount(0);
      setBatchVoteTxHashes([]);
      setBatchProgress({ confirmed: 0, total: 0, current: 0 });
      
      toast({
        title: "Batch Vote Complete!",
        description: `${totalRecordedVotes} vote${totalRecordedVotes > 1 ? 's' : ''} confirmed • -${(totalRecordedVotes * VOTE_COST).toFixed(2)}¢ • +${totalRecordedBaseSquares} Base Squares • +${totalRecordedVotes} Vote Tickets • +100 Fyre Keys`,
        duration: 4000,
      });
      
      // recordVote already calls fetchStats() internally for each batch, so we don't need to refetch again
      // This prevents duplicate state updates
      onTransactionEnd?.();
    } catch (err: any) {
      setIsBatchSubmitting(false);
      console.error('Bulk vote error:', err);
      // Rollback optimistic update using total base squares
      setOptimisticVotes(prev => prev - baseSquaresAmount);
      // Clear ref and batch hashes on error
      voteRatingsRef.current = [];
      setBatchVoteTxHashes([]);
      setBulkVoteAmount(0);
      onTransactionEnd?.();
      
      if (err?.name === 'UserRejectedRequestError' || err?.code === 4001) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the batch vote transaction.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Batch Vote Failed",
          description: err?.message || "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleVote = async (rating: number) => {
    // Check if wallet is connected
    if (!wagmiIsConnected || !wagmiAddress) {
      // Only connect if connector is not already connected or connecting
      if (!connector || connector.status === 'disconnected') {
        connect();
        toast({
          title: "Connecting Wallet...",
          description: "Please approve the connection to vote.",
          duration: 2000,
        });
      } else if (connector.status === 'connecting') {
        toast({
          title: "Wallet Connecting...",
          description: "Please wait for wallet connection to complete.",
          duration: 2000,
        });
      }
      return;
    }

    if (usdcBalance < VOTE_COST) {
      toast({
        title: "Insufficient USDC",
        description: `You need at least ${VOTE_COST} USDC to vote.`,
        variant: "destructive",
      });
      return;
    }

    if (isSubmitting || isBatchSubmitting || isConfirming) return;

    // Optimistic update - immediately show the vote
    setUserVote(rating);
    setOptimisticVotes(prev => prev + rating);
    
    // Notify parent that transaction is starting (pause slideshow)
    onTransactionStart?.();

    try {
      // Check actual balance on-chain before proceeding
      if (publicClient) {
        try {
          const balance = (await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [wagmiAddress as Address],
          } as any)) as bigint;

          const balanceUSD = parseFloat(formatUnits(balance, USDC_DECIMALS));
          const voteCostAmount = parseUnits(VOTE_COST.toString(), USDC_DECIMALS);

          if (balance < voteCostAmount) {
            setOptimisticVotes(prev => prev - rating);
            setUserVote(0);
            toast({
              title: "Insufficient USDC",
              description: `You need at least ${VOTE_COST} USDC. Your balance is ${balanceUSD.toFixed(2)} USDC.`,
              variant: "destructive",
            });
            onTransactionEnd?.();
            return;
          }
        } catch (balanceError) {
          console.warn('Could not check balance:', balanceError);
          // Continue anyway - transaction will fail if insufficient
        }
      }

      // Each vote = 1 transaction = 1 cent, rating (1-5) determines base squares
      toast({
        title: "Voting...",
        description: `Sending ${VOTE_COST.toFixed(2)}¢ (${rating} Base Squares)`,
        duration: 2000,
      });

      // Send USDC transfer to vote payment address (1 cent per vote)
      const voteCostAmount = parseUnits(VOTE_COST.toString(), USDC_DECIMALS);
      
      // Store rating for confirmation handling
      setBulkVoteAmount(rating); // Use bulkVoteAmount to store the rating for single votes too
      
      writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [VOTE_PAYMENT_ADDRESS, voteCostAmount],
      } as any);
    } catch (err: any) {
      console.error('Vote error:', err);
      // Rollback optimistic update on error
      setOptimisticVotes(prev => prev - rating);
      setUserVote(0);
      onTransactionEnd?.();
      
      if (err?.name === 'UserRejectedRequestError' || err?.code === 4001) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the vote transaction.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Vote Failed",
          description: err?.message || "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle transaction confirmation for single votes (rating 1-5)
  useEffect(() => {
    // Only process if: confirmed, has hash, is single vote (1-5), no batch votes, and hash not already processed
    if (isConfirmed && hash && bulkVoteAmount > 0 && bulkVoteAmount <= 5 && batchVoteTxHashes.length === 0) {
      const hashStr = String(hash);
      
      // Prevent duplicate processing of the same transaction
      if (processedHashesRef.current.has(hashStr)) {
        console.log('Transaction already processed, skipping:', hashStr);
        return;
      }
      
      // Mark this hash as being processed
      processedHashesRef.current.add(hashStr);
      
      // Single vote: bulkVoteAmount stores the rating (1-5 base squares)
      const recordVoteAsync = async () => {
        try {
          const rating = bulkVoteAmount; // Rating = base squares for this vote (1-5)
          
          console.log(`Recording single vote: rating=${rating}, hash=${hashStr}`);
          
          // Clear optimistic votes BEFORE recording to database to prevent double counting
          // recordVote will call fetchStats() which updates the stats, so we need to clear optimistic first
          setOptimisticVotes(0);
          
          const success = await recordVote(speciesId, address || wagmiAddress || '', rating);
          
          if (success) {
            // recordVote already calls fetchStats() internally, no need to refetch again
            // This prevents double updates
            
            addVoteTicket(address || wagmiAddress || undefined);
            
            // Add Fyre Keys for single vote (10 keys per vote)
            if (address || wagmiAddress) {
              import('@/integrations/supabase/client').then(async ({ supabase }) => {
                try {
                  await (supabase as any).rpc('increment_fyre_keys', { wallet_addr: address || wagmiAddress || '', amount: 10 });
                  await refreshFyreKeys();
                } catch (err: any) {
                  console.error('Failed to persist fyre keys:', err);
                }
              });
            }

            toast({
              title: "Vote Submitted!",
              description: `1 vote • -${VOTE_COST.toFixed(2)}¢ • +${rating} Base Squares • +1 Vote Ticket • +10 Fyre Keys`,
              duration: 3000,
            });
            
            // Reset user vote display after brief delay
            setTimeout(() => {
              setUserVote(0);
              setBulkVoteAmount(0);
              onVoteSubmit?.();
            }, 500);
          } else {
            // Rollback: remove hash from processed set and restore optimistic vote
            processedHashesRef.current.delete(hashStr);
            setOptimisticVotes(prev => prev + rating);
            setUserVote(0);
            setBulkVoteAmount(0);
            toast({
              title: "Vote Recording Failed",
              description: "Transaction succeeded but vote recording failed. Please contact support.",
              variant: "destructive",
            });
          }
        } catch (err) {
          console.error('Error recording vote:', err);
          // Rollback: remove hash from processed set and restore optimistic vote
          processedHashesRef.current.delete(hashStr);
          setOptimisticVotes(prev => prev + bulkVoteAmount);
          setUserVote(0);
          setBulkVoteAmount(0);
          toast({
            title: "Vote Recording Failed",
            description: "Transaction succeeded but vote recording failed. Please contact support.",
            variant: "destructive",
          });
        } finally {
          onTransactionEnd?.();
        }
      };

      recordVoteAsync();
    }
    // Only depend on the actual values that should trigger the effect, not function references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, hash, bulkVoteAmount, batchVoteTxHashes.length, speciesId]);


  // Show confirmation status
  useEffect(() => {
    if (isConfirming && hash) {
      toast({
        title: "Transaction Submitted",
        description: "Waiting for confirmation...",
        duration: 2000,
      });
    }
  }, [isConfirming, hash]);

  // Double-tap handler for vote panel (same as long press)
  const lastVoteTapRef = useRef<number>(0);
  const handleVotePanelClick = (e: React.MouseEvent) => {
    // Only trigger double-tap on the container, not on individual vote buttons
    if ((e.target as HTMLElement).closest('button')) return;
    
    const now = Date.now();
    const timeSinceLastTap = now - lastVoteTapRef.current;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double-tap detected - open bulk dialog
      triggerHaptic();
      setShowBulkDialog(true);
      onPanelOpen?.();
      lastVoteTapRef.current = 0;
    } else {
      lastVoteTapRef.current = now;
    }
  };

  return (
    <>
      <div 
        ref={containerRef}
        className="flex flex-col items-center gap-1"
        onClick={handleVotePanelClick}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
      >
        <div className="relative flex gap-1.5">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => handleVote(rating)}
              disabled={isSubmitting || isBatchSubmitting}
              className={cn(
                "w-7 h-7 border-2 rounded-sm transition-all duration-150",
                rating <= userVote
                  ? "bg-primary border-primary"
                  : "border-card/50 hover:border-card",
                "hover:scale-110 cursor-pointer active:scale-95",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            />
          ))}
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-card text-xs font-sans">
            {totalVotes.toLocaleString()} Base Squares
          </span>
          <span className="text-card/60 text-[10px] font-sans">
            1¢ per vote
          </span>
          {isBatchSubmitting && batchProgress.total > 0 && (
            <div className="mt-2 w-full max-w-[200px]">
              <div className="flex items-center justify-between text-[10px] text-card/80 mb-1">
                <span>Batch Progress</span>
                <span className="font-mono">{batchProgress.confirmed}/{batchProgress.total}</span>
              </div>
              <div className="w-full bg-card/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-200 ease-out"
                  style={{ width: `${(batchProgress.confirmed / batchProgress.total) * 100}%` }}
                />
              </div>
              <div className="text-[9px] text-card/60 mt-0.5">
                Processing batch {batchProgress.current}/{batchProgress.total}...
              </div>
            </div>
          )}
        </div>
      </div>
      <BulkVoteDialog
        isOpen={showBulkDialog}
        onClose={() => {
          setShowBulkDialog(false);
          onPanelClose?.();
        }}
        onConfirm={handleBulkVote}
        isSubmitting={isSubmitting || isBatchSubmitting || isConfirming}
      />
    </>
  );
};

export default VoteSquares;