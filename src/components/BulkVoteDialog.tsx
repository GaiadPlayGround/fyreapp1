import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from '@/lib/utils';

interface BulkVoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  isSubmitting: boolean;
}

// Each vote = max 5 base squares = 1 cent
// Calculation: base squares / 5 = number of votes, each vote = 1 cent
const BULK_VOTE_OPTIONS = [
  { amount: 250, cost: 0.50 },   // 250 base squares = 50 votes (250/5) = 50 cents
  { amount: 500, cost: 1.00 },   // 500 base squares = 100 votes (500/5) = $1
  { amount: 2500, cost: 5.00 },  // 2500 base squares = 500 votes (2500/5) = $5
  { amount: 5000, cost: 10.00 },  // 5000 base squares = 1000 votes (5000/5) = $10
  { amount: 10000, cost: 20.00 }, // 10000 base squares = 2000 votes (10000/5) = $20
  { amount: 25000, cost: 50.00 }, // 25000 base squares = 5000 votes (25000/5) = $50
];

const BulkVoteDialog = ({ isOpen, onClose, onConfirm, isSubmitting }: BulkVoteDialogProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedAmount) {
      onConfirm(selectedAmount);
      setSelectedAmount(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">BULK VOTING</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Base Squares is popularity indicator for Fyre PureBreeds.
            </p>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              [assign Base Square votes to boost visibility for your favourite endangered species.]
            </p>
          </div>
          
          <div>
            <p className="text-sm font-sans text-foreground mb-3">
              Select the number of Base Squares to assign to this species:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {BULK_VOTE_OPTIONS.map((option) => (
                <button
                  key={option.amount}
                  onClick={() => setSelectedAmount(option.amount)}
                  disabled={isSubmitting}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all font-sans text-left",
                    selectedAmount === option.amount
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="text-sm font-medium">
                    {option.amount.toLocaleString()} Base Squares
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${option.cost.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground font-sans italic">
            (Onchain activity increases your chances of qualifying for $FYRE and $BASE airdrops.)
          </p>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-sans border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedAmount || isSubmitting}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-sans rounded-lg transition-colors",
                selectedAmount && !isSubmitting
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkVoteDialog;
