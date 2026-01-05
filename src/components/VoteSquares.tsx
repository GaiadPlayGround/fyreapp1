import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import { useWalletIdentity } from '@/hooks/useWalletIdentity';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { useUsdcVote } from '@/hooks/useUsdcVote';

interface VoteSquaresProps {
  speciesId: string;
  onVoteStart?: () => void;
  onVoteEnd?: () => void;
}

const VoteSquares = ({ speciesId, onVoteStart, onVoteEnd }: VoteSquaresProps) => {
  const { isConnected, address } = useWalletIdentity();
  const { usdcBalance } = useWalletBalances();
  const { getBaseSquares, recordVote, refetch } = useSpeciesStats();
  const { sendVotePayment, isPending: isPaymentPending, voteCost } = useUsdcVote();
  const [userVote, setUserVote] = useState<number>(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse USDC balance from formatted string
  const parseBalance = (balanceStr: string): number => {
    const value = parseFloat(balanceStr.replace(/[KM]/g, ''));
    if (balanceStr.includes('M')) return value * 1000000;
    if (balanceStr.includes('K')) return value * 1000;
    return value;
  };

  useEffect(() => {
    setTotalVotes(getBaseSquares(speciesId));
  }, [speciesId, getBaseSquares]);

  const handleVote = async (rating: number) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Required",
        description: `Connect your wallet to vote. Voting costs ${voteCost} USDC.`,
        variant: "destructive",
      });
      return;
    }

    const currentBalance = parseBalance(usdcBalance);
    if (currentBalance < voteCost) {
      toast({
        title: "Insufficient USDC",
        description: `You need at least ${voteCost} USDC to vote. Current balance: $${usdcBalance}`,
        variant: "destructive",
      });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setUserVote(rating);
    
    // Notify parent to pause slideshow
    onVoteStart?.();

    try {
      // Send onchain USDC payment
      await sendVotePayment();
      
      // Record vote in database after successful payment
      const success = await recordVote(speciesId, address, rating);
      
      if (success) {
        setTotalVotes((prev) => prev + rating);
        toast({
          title: "Vote Confirmed!",
          description: `-${voteCost} USDC • +${rating} Base Squares`,
          duration: 1500,
        });
        
        // Quick reset for rapid voting
        setTimeout(() => {
          setUserVote(0);
          refetch();
        }, 300);
      }
    } catch (err: any) {
      console.error('Vote error:', err);
      
      // User rejected transaction
      if (err?.message?.includes('rejected') || err?.message?.includes('denied')) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the transaction.",
          duration: 2000,
        });
      } else {
        toast({
          title: "Vote Failed",
          description: "Transaction failed. Please try again.",
          variant: "destructive",
        });
      }
      setUserVote(0);
    } finally {
      setIsSubmitting(false);
      // Resume slideshow after transaction completes
      onVoteEnd?.();
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleVote(rating)}
            disabled={isSubmitting || isPaymentPending}
            className={cn(
              "w-7 h-7 border-2 rounded-sm transition-all duration-150",
              rating <= userVote
                ? "bg-primary border-primary"
                : "border-card/50 hover:border-card",
              "hover:scale-110 cursor-pointer active:scale-95",
              (isSubmitting || isPaymentPending) && "opacity-50 cursor-not-allowed"
            )}
          />
        ))}
      </div>
      <div className="flex flex-col items-center text-center">
        <span className="text-card text-xs font-sans">
          {totalVotes.toLocaleString()} Base Squares
        </span>
        <span className="text-card/60 text-[10px] font-sans">
          {voteCost} USDC/vote
        </span>
      </div>
    </div>
  );
};

export default VoteSquares;
