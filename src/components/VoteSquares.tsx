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
  const handleBulkVote = async (amount: number) => {
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

    const totalCost = amount * VOTE_COST;
    if (usdcBalance < totalCost) {
      toast({
        title: "Insufficient USDC",
        description: `You need at least ${totalCost.toFixed(2)}¢ (${totalCost.toFixed(2)} USDC) for ${amount} votes.`,
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
      // Batch transactions: create separate USDC transfer for each vote
      // This creates multiple transactions for Base rewards (transaction volume)
      const voteCostAmount = parseUnits(VOTE_COST.toString(), USDC_DECIMALS);
      
      if (!connector || !wagmiAddress || !publicClient) {
        throw new Error('Wallet not properly connected');
      }

      toast({
        title: "Preparing Batch Vote...",
        description: `Creating ${amount} separate transactions (${totalCost.toFixed(2)}¢ total)`,
        duration: 3000,
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

      // Send multiple transactions sequentially
      // Each transaction is separate on-chain for Base rewards
      const txHashes: string[] = [];
      
      for (let i = 0; i < amount; i++) {
        try {
          const hash = await walletClient.writeContract({
            address: USDC_ADDRESS,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [VOTE_PAYMENT_ADDRESS, voteCostAmount],
          } as any);
          
          txHashes.push(hash);
          
          // Small delay between transactions to avoid nonce issues
          if (i < amount - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (txError: any) {
          console.error(`Transaction ${i + 1} failed:`, txError);
          // Continue with remaining transactions even if one fails
          if (txError?.name === 'UserRejectedRequestError' || txError?.code === 4001) {
            throw txError; // User cancelled, stop all
          }
        }
      }

      setBatchVoteTxHashes(txHashes);
      
      // Store bulk vote amount for confirmation handling
      setBulkVoteAmount(amount);
      
      // Optimistic update
      setOptimisticVotes(prev => prev + amount);

      toast({
        title: "Batch Transactions Sent!",
        description: `${txHashes.length} transactions submitted. Waiting for confirmations...`,
        duration: 3000,
      });

      setIsBatchSubmitting(false);
    } catch (err: any) {
      setIsBatchSubmitting(false);
      console.error('Bulk vote error:', err);
      setOptimisticVotes(prev => prev - amount);
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

      toast({
        title: "Voting...",
        description: `Sending ${(VOTE_COST * rating).toFixed(2)}¢ (${rating} votes)`,
        duration: 2000,
      });

      // Send USDC transfer to vote payment address
      const voteCostAmount = parseUnits(VOTE_COST.toString(), USDC_DECIMALS);
      
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

  // Handle transaction confirmation for single votes
  useEffect(() => {
    if (isConfirmed && hash && !bulkVoteAmount) {
      const recordVoteAsync = async () => {
        try {
          if (bulkVoteAmount > 0) {
            // Batch vote: record all votes separately
            // Each transaction in the batch represents 1 vote (1 Base Square)
            const votePerTransaction = 1;
            let successCount = 0;
            
            // Record each vote separately - each one corresponds to a separate transaction
            // This ensures Base rewards count each transaction separately
            for (let i = 0; i < bulkVoteAmount; i++) {
              const success = await recordVote(speciesId, address || wagmiAddress || '', votePerTransaction);
              if (success) {
                successCount++;
                addVoteTicket(); // +1 vote ticket per vote
              }
              // Small delay to avoid rate limiting
              if (i < bulkVoteAmount - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }
            
            if (successCount === bulkVoteAmount) {
              toast({
                title: "Batch Vote Submitted!",
                description: `${bulkVoteAmount} transactions • -${(bulkVoteAmount * VOTE_COST).toFixed(2)}¢ • +${bulkVoteAmount} Base Squares • +${bulkVoteAmount} Vote Tickets • +${bulkVoteAmount * 5} Fyre Keys`,
                duration: 4000,
              });
              setBulkVoteAmount(0);
              setBatchVoteTxHashes([]);
              refetch();
            } else {
              toast({
                title: "Partial Vote Recording",
                description: `Recorded ${successCount}/${bulkVoteAmount} votes. Please contact support.`,
                variant: "destructive",
              });
            }
          } else if (userVote > 0) {
            // Single vote: user clicked 1-5 stars
            // The rating (1-5) determines how many base squares are added:
            // 1 star = 1 base square, 2 stars = 2 base squares, etc.
            // Database trigger automatically updates base_squares when vote is recorded
            const success = await recordVote(speciesId, address || wagmiAddress || '', userVote);
            
            if (success) {
              addVoteTicket();

              toast({
                title: "Vote Submitted!",
                description: `${userVote} star${userVote > 1 ? 's' : ''} • -${(VOTE_COST * userVote).toFixed(2)}¢ • +${userVote} Base Squares • +1 Vote Ticket • +5 Fyre Keys`,
                duration: 3000,
              });
              
              // Reset user vote display after brief delay
              setTimeout(() => {
                setUserVote(0);
                onVoteSubmit?.();
              }, 500);
              
              // Refresh stats in background
              refetch();
            } else {
              // Rollback optimistic update on failure
              setOptimisticVotes(prev => prev - userVote);
              setUserVote(0);
              toast({
                title: "Vote Recording Failed",
                description: "Transaction succeeded but vote recording failed. Please contact support.",
                variant: "destructive",
              });
            }
          }
        } catch (err) {
          console.error('Error recording vote:', err);
          if (bulkVoteAmount > 0) {
            setOptimisticVotes(prev => prev - bulkVoteAmount);
            setBulkVoteAmount(0);
          } else {
            setOptimisticVotes(prev => prev - userVote);
            setUserVote(0);
          }
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
  }, [isConfirmed, hash, userVote, bulkVoteAmount, speciesId, address, wagmiAddress, recordVote, addVoteTicket, onVoteSubmit, onTransactionEnd, refetch]);

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
                const votePerTransaction = 1;
                let successCount = 0;
                
                // Record each vote separately - each transaction = 1 vote with 1 star (1 base square)
                // Database trigger automatically adds 1 base square per vote to the species
                for (let i = 0; i < bulkVoteAmount; i++) {
                  const success = await recordVote(speciesId, address || wagmiAddress || '', votePerTransaction);
                  if (success) {
                    successCount++;
                    addVoteTicket();
                  }
                  if (i < bulkVoteAmount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                }
                
                if (successCount === bulkVoteAmount) {
                  toast({
                    title: "Batch Vote Complete!",
                    description: `${bulkVoteAmount} transactions confirmed • -${(bulkVoteAmount * VOTE_COST).toFixed(2)}¢ • +${bulkVoteAmount} Base Squares • +${bulkVoteAmount} Vote Tickets • +${bulkVoteAmount * 5} Fyre Keys`,
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
                setOptimisticVotes(prev => prev - bulkVoteAmount);
                setBulkVoteAmount(0);
                setBatchVoteTxHashes([]);
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
          <span className="text-card/40 text-[9px] font-sans mt-0.5">
            Long press for bulk actions
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
