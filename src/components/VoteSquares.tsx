import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';

interface VoteSquaresProps {
  speciesId: string;
  initialVotes: number;
  onVoteSubmit?: () => void;
}

const VoteSquares = ({ speciesId, initialVotes, onVoteSubmit }: VoteSquaresProps) => {
  const { isConnected, addVote, usdcBalance, connect } = useWallet();
  const [userVote, setUserVote] = useState<number>(0);
  const [totalVotes, setTotalVotes] = useState(initialVotes);

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

    if (usdcBalance < 0.2) {
      toast({
        title: "Insufficient USDC",
        description: "You need at least 0.2 USDC to vote.",
        variant: "destructive",
      });
      return;
    }

    // Immediately assign all squares up to the rating
    setUserVote(rating);

    const success = addVote(speciesId, rating);
    if (success) {
      // Add the vote count to total and reset the squares
      setTotalVotes((prev) => prev + 1);
      toast({
        title: "Vote Submitted!",
        description: "0.2 USDC has been deducted from your balance.",
      });
      
      // Reset the vote squares to empty state after a short delay
      setTimeout(() => {
        setUserVote(0);
        onVoteSubmit?.();
      }, 500);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleVote(rating)}
            className={cn(
              "w-7 h-7 border-2 rounded-sm transition-all duration-200",
              rating <= userVote
                ? "bg-primary border-primary"
                : "border-card/50 hover:border-card",
              "hover:scale-110 cursor-pointer"
            )}
          />
        ))}
      </div>
      <div className="flex flex-col items-center text-center">
        <span className="text-card text-xs font-sans">
          {totalVotes.toLocaleString()} Base Squares
        </span>
        <span className="text-card/60 text-[10px] font-sans">
          0.2 USDC/vote
        </span>
      </div>
    </div>
  );
};

export default VoteSquares;