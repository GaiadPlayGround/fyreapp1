import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from '@/lib/utils';

interface BulkVoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  isSubmitting: boolean;
}

// 1 vote = 1 cent, so amounts are in cents
const BULK_VOTE_OPTIONS = [
  { amount: 250, cost: 2.50 },   // 250 votes = $2.50
  { amount: 500, cost: 5.00 },   // 500 votes = $5.00
  { amount: 2500, cost: 25.00 },  // 2500 votes = $25.00
  { amount: 5000, cost: 50.00 },  // 5000 votes = $50.00
  { amount: 10000, cost: 100.00 }, // 10000 votes = $100.00
  { amount: 25000, cost: 250.00 }, // 25000 votes = $250.00
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
              Base Squares is popularity indicator of Fyre PureBreeds.
            </p>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Assign Base Square votes to boost visibility for your favourite endangered species.
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
