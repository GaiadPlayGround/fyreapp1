import { useState } from 'react';
import { cn } from '@/lib/utils';

interface VoteSquaresProps {
  speciesId: string;
  initialVotes: number;
}

const VoteSquares = ({ speciesId, initialVotes }: VoteSquaresProps) => {
  const [userVote, setUserVote] = useState<number>(0);
  const [totalVotes, setTotalVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = (rating: number) => {
    if (hasVoted) return;
    
    setUserVote(rating);
    setTotalVotes((prev) => prev + 1);
    setHasVoted(true);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-card/10 backdrop-blur-sm rounded-full">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleVote(rating)}
            disabled={hasVoted}
            className={cn(
              "w-6 h-6 border-2 rounded-sm transition-all duration-200",
              rating <= userVote
                ? "bg-primary border-primary"
                : "border-card/50 hover:border-card",
              hasVoted && "cursor-default",
              !hasVoted && "hover:scale-110"
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
      <span className="text-card/70 text-xs font-sans">
        {totalVotes.toLocaleString()}
      </span>
    </div>
  );
};

export default VoteSquares;