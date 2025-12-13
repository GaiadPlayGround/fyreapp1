import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';

interface VoteSquaresProps {
  speciesId: string;
  initialVotes: number;
}

const VoteSquares = ({ speciesId, initialVotes }: VoteSquaresProps) => {
  const { isConnected, addVote, hasVoted, usdcBalance, connect } = useWallet();
  const [userVote, setUserVote] = useState<number>(0);
  const [totalVotes, setTotalVotes] = useState(initialVotes);
  const voted = hasVoted(speciesId);

  const handleVote = (rating: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Connect your wallet to vote. Voting costs 0.2 USDC.",
        variant: "destructive",
      });
      connect();
      return;
    }

    if (voted) return;

    if (usdcBalance < 0.2) {
      toast({
        title: "Insufficient USDC",
        description: "You need at least 0.2 USDC to vote.",
        variant: "destructive",
      });
      return;
    }

    const success = addVote(speciesId, rating);
    if (success) {
      setUserVote(rating);
      setTotalVotes((prev) => prev + 1);
      toast({
        title: "Vote Submitted!",
        description: "0.2 USDC has been deducted from your balance.",
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleVote(rating)}
            disabled={voted}
            className={cn(
              "w-7 h-7 border-2 rounded-sm transition-all duration-200",
              rating <= userVote
                ? "bg-primary border-primary"
                : "border-card/50 hover:border-card",
              voted && "cursor-default",
              !voted && "hover:scale-110 cursor-pointer"
            )}
          />
        ))}
      </div>
      <div className="text-center">
        <span className="text-card text-xs font-sans">
          {totalVotes.toLocaleString()} votes
        </span>
        <span className="text-card/60 text-[10px] font-sans ml-2">
          0.2 USDC/vote
        </span>
      </div>
    </div>
  );
};

export default VoteSquares;
