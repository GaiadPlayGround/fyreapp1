import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits, Address, erc20Abi } from 'viem';
import { base } from 'wagmi/chains';

interface VoteSquaresProps {
  speciesId: string;
  onVoteSubmit?: () => void;
  onTransactionStart?: () => void;
  onTransactionEnd?: () => void;
}

// Vote payment address - receives 0.2 USDC per vote
const VOTE_PAYMENT_ADDRESS = '0xae28916f0bc703fccbaf9502d15f838a1caa01b3' as Address;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const USDC_DECIMALS = 6;
const VOTE_COST = 0.2; // USDC

const VoteSquares = ({ speciesId, onVoteSubmit, onTransactionStart, onTransactionEnd }: VoteSquaresProps) => {
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

  useEffect(() => {
    const baseSquares = getBaseSquares(speciesId);
    setTotalVotes(baseSquares + optimisticVotes);
  }, [speciesId, getBaseSquares, optimisticVotes]);

  // Reset optimistic votes when speciesId changes
  useEffect(() => {
    setOptimisticVotes(0);
  }, [speciesId]);

  const handleVote = async (rating: number) => {
    if (!isConnected || !wagmiAddress) {
      toast({
        title: "Wallet Required",
        description: "Connect your wallet to vote. Voting costs 0.2 USDC.",
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
    if (isConfirmed && hash && userVote > 0) {
      // Transaction confirmed - now record the vote in database
      const recordVoteAsync = async () => {
        try {
          const success = await recordVote(speciesId, address || wagmiAddress || '', userVote);
          
          if (success) {
            addVoteTicket();

            toast({
              title: "Vote Submitted!",
              description: `-${VOTE_COST} USDC • +${userVote} Base Squares • +1 Vote Ticket`,
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
        } catch (err) {
          console.error('Error recording vote:', err);
          setOptimisticVotes(prev => prev - userVote);
          setUserVote(0);
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
  }, [isConfirmed, hash, userVote, speciesId, address, wagmiAddress, recordVote, addVoteTicket, onVoteSubmit, onTransactionEnd, refetch]);

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
    <div className="flex flex-col items-center gap-1">
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
          {VOTE_COST} USDC/vote
        </span>
      </div>
    </div>
  );
};

export default VoteSquares;
