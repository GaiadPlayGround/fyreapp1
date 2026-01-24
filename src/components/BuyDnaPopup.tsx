import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { usePaymentSettings, QuickBuyAmount } from './PaymentSettings';

interface BuyDnaPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, currency: 'USDC' | 'ETH') => void;
  speciesName: string;
  isSubmitting?: boolean;
}

const ETH_PRICE_APPROX = 3000; // Approximate ETH price in USD

const BuyDnaPopup = ({ isOpen, onClose, onConfirm, speciesName, isSubmitting = false }: BuyDnaPopupProps) => {
  const { usdcBalance, isConnected } = useWallet();
  const { currency: savedCurrency, amount: savedAmount, setCurrency, setAmount } = usePaymentSettings();
  
  const [selectedCurrency, setSelectedCurrency] = useState<'USDC' | 'ETH'>(savedCurrency);
  const [selectedAmount, setSelectedAmount] = useState<QuickBuyAmount>(savedAmount);
  
  // Mock ETH balance (in production, this would come from useWallet)
  const ethBalance = 0.52;
  const ethValueUSD = ethBalance * ETH_PRICE_APPROX;

  const quickAmounts: QuickBuyAmount[] = [0.5, 1, 2, 3, 5, 10];

  useEffect(() => {
    setSelectedCurrency(savedCurrency);
    setSelectedAmount(savedAmount);
  }, [savedCurrency, savedAmount, isOpen]);

  const handleConfirm = () => {
    // Save preferences
    setCurrency(selectedCurrency);
    setAmount(selectedAmount);
    onConfirm(selectedAmount, selectedCurrency);
  };

  const getEthAmount = (usdAmount: number) => {
    return (usdAmount / ETH_PRICE_APPROX).toFixed(6);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="font-serif text-base text-center">Buy DNA</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Balance Display */}
          <div className="flex items-center justify-between text-xs font-sans p-2 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground">USDC bal: <span className="text-foreground font-medium">${usdcBalance.toFixed(2)}</span></span>
            <span className="text-muted-foreground">ETH bal: <span className="text-foreground font-medium">{ethBalance.toFixed(2)}</span> <span className="text-muted-foreground">(${ethValueUSD.toFixed(0)})</span></span>
          </div>

          {/* Currency Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCurrency('USDC')}
              className={cn(
                "flex-1 py-2 text-xs font-sans rounded-lg border transition-all",
                selectedCurrency === 'USDC'
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              USDC
            </button>
            <button
              onClick={() => setSelectedCurrency('ETH')}
              className={cn(
                "flex-1 py-2 text-xs font-sans rounded-lg border transition-all",
                selectedCurrency === 'ETH'
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              ETH
            </button>
          </div>

          {/* Amount Selection */}
          <div className="grid grid-cols-3 gap-1.5">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                className={cn(
                  "py-1.5 text-xs font-sans rounded-lg border transition-all",
                  selectedAmount === amount
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {selectedCurrency === 'ETH' ? getEthAmount(amount) : `$${amount}`}
              </button>
            ))}
          </div>

          {/* Buy Button */}
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !isConnected}
            className={cn(
              "w-full py-3 text-sm font-sans font-bold rounded-lg transition-colors",
              isConnected && !isSubmitting
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isSubmitting ? 'Processing...' : 'BUY'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyDnaPopup;
