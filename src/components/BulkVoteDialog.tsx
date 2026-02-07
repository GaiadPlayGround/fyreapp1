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
const BULK_VOTE_OPTIONS = [{
  amount: 250,
  cost: 0.50
},
// 250 base squares = 50 votes (250/5) = 50 cents
{
  amount: 500,
  cost: 1.00
},
// 500 base squares = 100 votes (500/5) = $1
{
  amount: 2500,
  cost: 5.00
},
// 2500 base squares = 500 votes (2500/5) = $5
{
  amount: 5000,
  cost: 10.00
},
// 5000 base squares = 1000 votes (5000/5) = $10
{
  amount: 10000,
  cost: 20.00
},
// 10000 base squares = 2000 votes (10000/5) = $20
{
  amount: 25000,
  cost: 50.00
} // 25000 base squares = 5000 votes (25000/5) = $50
];
const BulkVoteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting
}: BulkVoteDialogProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustom, setUseCustom] = useState(false);
  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setUseCustom(false);
    setCustomAmount('');
  };
  const handleCustomAmountChange = (value: string) => {
    // Only allow valid numeric input (whole numbers for base squares)
    if (value === '' || /^\d+$/.test(value)) {
      setCustomAmount(value);
      setUseCustom(true);
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setSelectedAmount(parsed);
      } else {
        setSelectedAmount(null);
      }
    }
  };
  const finalAmount = useCustom ? customAmount ? parseInt(customAmount, 10) : null : selectedAmount;
  const isValidAmount = finalAmount !== null && !isNaN(finalAmount) && finalAmount > 0;
  const finalCost = isValidAmount ? Math.ceil(finalAmount! / 5) * 0.01 : 0;
  const handleConfirm = () => {
    if (isValidAmount && finalAmount) {
      onConfirm(finalAmount);
      setSelectedAmount(null);
      setCustomAmount('');
      setUseCustom(false);
    }
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-center">BULK VOTING</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Description text */}
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground font-serif leading-relaxed tracking-wide">
              Base Squares represent the popularity and influence of FYRE PureBreeds.
            </p>
            <p className="text-sm text-muted-foreground font-serif leading-relaxed tracking-wide">
              Assign Base Square votes to boost visibility for endangered species.
            </p>
          </div>
          
          {/* BULK VOTE heading */}
          <div className="text-center">
            <p className="text-base font-serif font-bold text-foreground tracking-widest uppercase">BULK VOTE</p>
          </div>

          {/* Selection prompt */}
          <div>
            <p className="text-sm font-sans text-foreground mb-3 text-center">
              Select the number of Base Squares to assign to this species:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {BULK_VOTE_OPTIONS.map(option => <button key={option.amount} onClick={() => handleSelectPreset(option.amount)} disabled={isSubmitting} className={cn("p-3 rounded-xl border-2 transition-all font-sans text-left", !useCustom && selectedAmount === option.amount ? "border-primary bg-primary/10" : "border-border/50 bg-background/50 hover:border-primary/50", isSubmitting && "opacity-50 cursor-not-allowed")}>
                  <div className="text-sm font-medium">
                    {option.amount.toLocaleString()} Base Squares
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${option.cost.toFixed(2)}
                  </div>
                </button>)}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs text-muted-foreground font-sans whitespace-nowrap">Custom:</span>
            <div className="flex-1 relative">
              <input type="text" inputMode="numeric" value={customAmount} onChange={e => handleCustomAmountChange(e.target.value)} placeholder="Enter base squares" className={cn("w-full px-3 py-2 text-xs font-sans rounded-xl border bg-background/50 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all", useCustom && customAmount ? "border-primary bg-primary/10" : "border-border/50 focus:border-primary/50")} />
            </div>
            {useCustom && isValidAmount && <span className="text-xs text-muted-foreground font-sans whitespace-nowrap">
                ${finalCost.toFixed(2)}
              </span>}
          </div>

          <p className="text-[10px] text-muted-foreground font-sans italic text-center">
            (Onchain activity increases your chances of qualifying for $FYRE and $BASE airdrops.)
          </p>

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-2.5 text-sm font-sans border border-border/50 rounded-xl hover:bg-muted/50 transition-colors">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={!isValidAmount || isSubmitting} className={cn("flex-1 px-4 py-2.5 text-sm font-sans rounded-xl transition-colors", isValidAmount && !isSubmitting ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed")}>
              {isSubmitting ? 'Submitting...' : 'Confirm'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default BulkVoteDialog;