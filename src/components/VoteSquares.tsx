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
    <div className="flex items-center gap-3 p-3 bg-card/10 backdrop-blur-sm rounded-full">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleVote(rating)}
            disabled={voted}
            className={cn(
              "w-6 h-6 border-2 rounded-sm transition-all duration-200",
              rating <= userVote
                ? "bg-primary border-primary"
                : "border-card/50 hover:border-card",
              voted && "cursor-default",
              !voted && !isConnected && "hover:scale-110 cursor-pointer",
              !voted && isConnected && "hover:scale-110"
            )}
          >
            {rating <= userVote && (
              <svg
                className="w-full h-full text-primary-foreground p-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
      <div className="flex flex-col">
        <span className="text-card/70 text-xs font-sans">
          {totalVotes.toLocaleString()}
        </span>
        {!isConnected && (
          <span className="text-card/50 text-[10px] font-sans">0.2 USDC</span>
        )}
      </div>
    </div>
  );
};

export default VoteSquares;
