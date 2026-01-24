import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits, Address, erc20Abi } from 'viem';
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
  const { address: wagmiAddress } = useAccount();
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

  // Handle bulk voting
  const handleBulkVote = async (amount: number) => {
    if (!isConnected || !wagmiAddress) {
      toast({
        title: "Wallet Required",
        description: "Connect your wallet to vote.",
        variant: "destructive",
      });
      connect();
      setShowBulkDialog(false);
      onPanelClose?.();
      return;
    }

    const totalCost = amount * VOTE_COST;
    if (usdcBalance < totalCost) {
      toast({
        title: "Insufficient USDC",
        description: `You need at least ${totalCost.toFixed(1)} USDC for ${amount} votes.`,
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
      // Batch transactions: send multiple USDC transfers
      const voteCostAmount = parseUnits(VOTE_COST.toString(), USDC_DECIMALS);
      const totalCostAmount = parseUnits(totalCost.toString(), USDC_DECIMALS);
      
      // For bulk voting, we'll send one transaction with the total amount
      // In a real implementation, you might want to batch multiple transactions
      toast({
        title: "Submitting Bulk Vote...",
        description: `Sending ${totalCost.toFixed(1)} USDC for ${amount} Base Squares`,
        duration: 3000,
      });

      writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [VOTE_PAYMENT_ADDRESS, totalCostAmount],
      } as any);

      // Store bulk vote amount for confirmation handling
      setBulkVoteAmount(amount);
      
      // Optimistic update
      setOptimisticVotes(prev => prev + amount);
    } catch (err: any) {
      console.error('Bulk vote error:', err);
      setOptimisticVotes(prev => prev - amount);
      onTransactionEnd?.();
      
      if (err?.name === 'UserRejectedRequestError' || err?.code === 4001) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the bulk vote transaction.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bulk Vote Failed",
          description: err?.message || "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleVote = async (rating: number) => {
    if (!isConnected || !wagmiAddress) {
      toast({
        title: "Wallet Required",
        description: "Connect your wallet to vote. Voting costs 0.1 USDC.",
        variant: "destructive",
      });
      connect();
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

    if (isSubmitting || isConfirming) return;

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
        description: `Sending ${VOTE_COST} USDC and submitting ${rating} Base Squares`,
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

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      const recordVoteAsync = async () => {
        try {
          if (bulkVoteAmount > 0) {
            // Bulk vote: record all votes
            const votePerTransaction = 1; // Each transaction represents 1 vote
            let successCount = 0;
            
            // Record votes in batches (each vote is 1 Base Square)
            for (let i = 0; i < bulkVoteAmount; i++) {
              const success = await recordVote(speciesId, address || wagmiAddress || '', votePerTransaction);
              if (success) {
                successCount++;
                addVoteTicket(); // +1 vote ticket per vote
              }
            }
            
            if (successCount === bulkVoteAmount) {
              toast({
                title: "Bulk Vote Submitted!",
                description: `-${(bulkVoteAmount * VOTE_COST).toFixed(1)} USDC • +${bulkVoteAmount} Base Squares • +${bulkVoteAmount} Vote Tickets • +${bulkVoteAmount * 5} Fyre Keys`,
                duration: 3000,
              });
              setBulkVoteAmount(0);
              refetch();
            } else {
              toast({
                title: "Partial Vote Recording",
                description: `Recorded ${successCount}/${bulkVoteAmount} votes. Please contact support.`,
                variant: "destructive",
              });
            }
          } else if (userVote > 0) {
            // Single vote
            const success = await recordVote(speciesId, address || wagmiAddress || '', userVote);
            
            if (success) {
              addVoteTicket();

              toast({
                title: "Vote Submitted!",
                description: `-${VOTE_COST} USDC • +${userVote} Base Squares • +1 Vote Ticket • +5 Fyre Keys`,
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
              disabled={isSubmitting}
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
            1c/vote
          </span>
          <span className="text-card/40 text-[9px] font-sans mt-0.5">
            Long press for bulk vote
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
        isSubmitting={isSubmitting || isConfirming}
      />
    </>
  );
};

export default VoteSquares;
