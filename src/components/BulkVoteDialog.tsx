import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from '@/lib/utils';

interface BulkVoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  isSubmitting: boolean;
}

const BULK_VOTE_OPTIONS = [
  { amount: 10, cost: 0.1 },
  { amount: 20, cost: 0.2 },
  { amount: 50, cost: 0.5 },
  { amount: 100, cost: 1 },
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">BULK VOTE</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-foreground font-sans">
              Base Squares represent the popularity and influence of FYRE Purebreeds.
            </p>
            <p className="text-sm text-muted-foreground font-sans">
              Assign Base Square votes to boost visibility for endangered species.
            </p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground font-sans mb-2">
              Select the number of Base Squares to assign to this species:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {BULK_VOTE_OPTIONS.map((option) => (
                <button
                  key={option.amount}
                  onClick={() => setSelectedAmount(option.amount)}
                  disabled={isSubmitting}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all font-sans",
                    selectedAmount === option.amount
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="text-sm font-medium">{option.amount} Base Squares</div>
                  <div className="text-xs text-muted-foreground">
                    {option.cost < 1 ? `${(option.cost * 100).toFixed(0)}c` : `$${option.cost}`} USDC
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground font-sans text-center">
            (onchain activity increases your chances of qualifying for $FYRE and $BASE airdrops.)
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
