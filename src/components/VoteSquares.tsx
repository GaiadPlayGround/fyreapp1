import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useConnectors } from 'wagmi';
import { parseUnits, formatUnits, Address, erc20Abi, createWalletClient, custom } from 'viem';
import { base } from 'wagmi/chains';
import BulkVoteDialog from './BulkVoteDialog';

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
  const { isConnected, address, usdcBalance, connect, addVoteTicket } = useWallet();
  const { address: wagmiAddress, connector } = useAccount();
  const connectors = useConnectors();
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending: isSubmitting } = useWriteContract();
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
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const voteRatingsRef = useRef<number[]>([]); // Store vote ratings in ref instead of sessionStorage

  useEffect(() => {
    const baseSquares = getBaseSquares(speciesId);
    setTotalVotes(baseSquares + optimisticVotes);
  }, [speciesId, getBaseSquares, optimisticVotes]);

  // Reset optimistic votes when speciesId changes
  useEffect(() => {
    setOptimisticVotes(0);
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

  // Handle bulk voting with batch transactions
  // Each vote = max 5 base squares = 1 transaction = 1 cent
  // Split amount into votes: e.g., 9 base squares = 2 votes (5+4), 11 = 3 votes (5+5+1)
  const handleBulkVote = async (baseSquaresAmount: number) => {
    if (!isConnected || !wagmiAddress) {
      // Auto-connect wallet
      connect();
      toast({
        title: "Connecting Wallet...",
        description: "Please approve the connection to vote.",
        duration: 2000,
      });
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

      // Send one transaction per vote
      // Each vote can assign 1-5 base squares
      const txHashes: string[] = [];
      const voteRatings: number[] = []; // Store rating for each vote
      
      for (let i = 0; i < votes.length; i++) {
        const voteRating = votes[i];
        try {
          const hash = await walletClient.writeContract({
            address: USDC_ADDRESS,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [VOTE_PAYMENT_ADDRESS, voteCostAmount],
          } as any);
          
          txHashes.push(hash);
          voteRatings.push(voteRating); // Store the rating for this vote
          
          // Small delay between transactions to avoid nonce issues
          if (i < votes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (txError: any) {
          console.error(`Transaction ${i + 1} failed:`, txError);
          if (txError?.name === 'UserRejectedRequestError' || txError?.code === 4001) {
            throw txError; // User cancelled, stop all
          }
        }
      }

      setBatchVoteTxHashes(txHashes);
      
      // Store votes array for confirmation handling (each vote has its rating 1-5)
      setBulkVoteAmount(voteRatings.length); // Number of votes
      // Store vote ratings in ref for recording (saved to database on confirmation)
      voteRatingsRef.current = voteRatings;
      
      // Optimistic update
      setOptimisticVotes(prev => prev + baseSquaresAmount);

      toast({
        title: "Batch Transactions Sent!",
        description: `${txHashes.length} vote${txHashes.length > 1 ? 's' : ''} submitted (${baseSquaresAmount} Base Squares). Waiting for confirmations...`,
        duration: 3000,
      });

      setIsBatchSubmitting(false);
    } catch (err: any) {
      setIsBatchSubmitting(false);
      console.error('Bulk vote error:', err);
      // Rollback optimistic update using total base squares
      setOptimisticVotes(prev => prev - baseSquaresAmount);
      // Clear ref on error
      voteRatingsRef.current = [];
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
    if (!isConnected || !wagmiAddress) {
      // Auto-connect wallet
      connect();
      toast({
        title: "Connecting Wallet...",
        description: "Please approve the connection to vote.",
        duration: 2000,
      });
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
    if (isConfirmed && hash && bulkVoteAmount > 0 && bulkVoteAmount <= 5 && batchVoteTxHashes.length === 0) {
      // Single vote: bulkVoteAmount stores the rating (1-5 base squares)
      const recordVoteAsync = async () => {
        try {
          const rating = bulkVoteAmount; // Rating = base squares for this vote (1-5)
          const success = await recordVote(speciesId, address || wagmiAddress || '', rating);
          
          if (success) {
            addVoteTicket();

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
            
            // Refresh stats in background
            refetch();
          } else {
            // Rollback optimistic update on failure
            setOptimisticVotes(prev => prev - rating);
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
          setOptimisticVotes(prev => prev - bulkVoteAmount);
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
  }, [isConfirmed, hash, userVote, bulkVoteAmount, batchVoteTxHashes.length, speciesId, address, wagmiAddress, recordVote, addVoteTicket, onVoteSubmit, onTransactionEnd, refetch]);

  // Handle batch transaction confirmations
  useEffect(() => {
    if (batchVoteTxHashes.length > 0 && bulkVoteAmount > 0 && publicClient) {
      const checkBatchConfirmations = async () => {
        try {
          let confirmedCount = 0;
          
          // Check each transaction
          for (const txHash of batchVoteTxHashes) {
            try {
              const receipt = await publicClient.getTransactionReceipt({ hash: txHash as Address });
              if (receipt && receipt.status === 'success') {
                confirmedCount++;
              }
            } catch (err) {
              console.warn(`Transaction ${txHash} not yet confirmed:`, err);
            }
          }

          // If all transactions are confirmed, record votes
          if (confirmedCount === batchVoteTxHashes.length) {
            const recordVoteAsync = async () => {
              try {
                // Get vote ratings from ref (each vote has rating 1-5 base squares)
                const voteRatings = voteRatingsRef.current;
                
                // If we don't have ratings stored, default to 1 base square per vote (fallback)
                const ratings = voteRatings.length === bulkVoteAmount 
                  ? voteRatings 
                  : Array(bulkVoteAmount).fill(1);
                
                let successCount = 0;
                let totalBaseSquares = 0;
                
                // Record each vote separately in database - each transaction = 1 vote with rating (1-5 base squares)
                // Database trigger automatically adds rating base squares per vote to the species
                for (let i = 0; i < bulkVoteAmount; i++) {
                  const voteRating = ratings[i]; // 1-5 base squares for this vote
                  const success = await recordVote(speciesId, address || wagmiAddress || '', voteRating);
                  if (success) {
                    successCount++;
                    totalBaseSquares += voteRating;
                    addVoteTicket();
                  }
                  if (i < bulkVoteAmount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                }
                
                // Clear ref after recording
                voteRatingsRef.current = [];
                
                if (successCount === bulkVoteAmount) {
                  toast({
                    title: "Batch Vote Complete!",
                    description: `${bulkVoteAmount} vote${bulkVoteAmount > 1 ? 's' : ''} confirmed • -${(bulkVoteAmount * VOTE_COST).toFixed(2)}¢ • +${totalBaseSquares} Base Squares • +${bulkVoteAmount} Vote Tickets • +${bulkVoteAmount * 10} Fyre Keys`,
                    duration: 4000,
                  });
                  setBulkVoteAmount(0);
                  setBatchVoteTxHashes([]);
                  refetch();
                  onTransactionEnd?.();
                } else {
                  toast({
                    title: "Partial Vote Recording",
                    description: `Recorded ${successCount}/${bulkVoteAmount} votes. Please contact support.`,
                    variant: "destructive",
                  });
                  onTransactionEnd?.();
                }
              } catch (err) {
                console.error('Error recording batch votes:', err);
                // Calculate total base squares for rollback from ref
                const voteRatings = voteRatingsRef.current;
                const totalBaseSquares = voteRatings.reduce((sum, r) => sum + r, 0) || bulkVoteAmount;
                
                setOptimisticVotes(prev => prev - totalBaseSquares);
                setBulkVoteAmount(0);
                setBatchVoteTxHashes([]);
                voteRatingsRef.current = []; // Clear ref
                toast({
                  title: "Vote Recording Failed",
                  description: "Transactions confirmed but vote recording failed. Please contact support.",
                  variant: "destructive",
                });
                onTransactionEnd?.();
              }
            };

            recordVoteAsync();
          }
        } catch (err) {
          console.error('Error checking batch confirmations:', err);
        }
      };

      // Check confirmations every 2 seconds
      const interval = setInterval(checkBatchConfirmations, 2000);
      checkBatchConfirmations(); // Initial check

      return () => clearInterval(interval);
    }
  }, [batchVoteTxHashes, bulkVoteAmount, publicClient, speciesId, address, wagmiAddress, recordVote, addVoteTicket, refetch, onTransactionEnd]);

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

  return (
    <>
      <div 
        ref={containerRef}
        className="flex flex-col items-center gap-1"
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