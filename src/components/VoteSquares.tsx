import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import { useWalletIdentity } from '@/hooks/useWalletIdentity';
import { useWalletBalances } from '@/hooks/useWalletBalances';

interface VoteSquaresProps {
  speciesId: string;
  onVoteSubmit?: () => void;
}

const VOTE_COST = 0.2; // USDC per vote

const VoteSquares = ({ speciesId, onVoteSubmit }: VoteSquaresProps) => {
  const { isConnected, address } = useWalletIdentity();
  const { usdcBalance } = useWalletBalances();
  const { getBaseSquares, recordVote, refetch } = useSpeciesStats();
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
        description: "Connect your wallet to vote. Voting costs 0.2 USDC.",
        variant: "destructive",
      });
      return;
    }

    const currentBalance = parseBalance(usdcBalance);
    if (currentBalance < VOTE_COST) {
      toast({
        title: "Insufficient USDC",
        description: `You need at least ${VOTE_COST} USDC to vote. Current balance: $${usdcBalance}`,
        variant: "destructive",
      });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setUserVote(rating);

    try {
      // Record vote in database
      const success = await recordVote(speciesId, address, rating);
      
      if (success) {
        setTotalVotes((prev) => prev + rating);
        toast({
          title: "Vote Submitted!",
          description: `-${VOTE_COST} USDC • +${rating} Base Squares`,
          duration: 1500,
        });
        
        setTimeout(() => {
          setUserVote(0);
          refetch();
          onVoteSubmit?.();
        }, 500);
      } else {
        toast({
          title: "Vote Failed",
          description: "Please try again.",
          variant: "destructive",
        });
        setUserVote(0);
      }
    } catch (err) {
      console.error('Vote error:', err);
      toast({
        title: "Vote Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
      setUserVote(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleVote(rating)}
            disabled={isSubmitting}
            className={cn(
              "w-7 h-7 border-2 rounded-sm transition-all duration-200",
              rating <= userVote
                ? "bg-primary border-primary"
                : "border-card/50 hover:border-card",
              "hover:scale-110 cursor-pointer",
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
