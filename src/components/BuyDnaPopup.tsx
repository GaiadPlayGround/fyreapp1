import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { usePaymentSettings, QuickBuyAmount } from './PaymentSettings';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';

interface BuyDnaPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, currency: 'USDC' | 'ETH') => void;
  speciesName: string;
  isSubmitting?: boolean;
}

const BuyDnaPopup = ({ isOpen, onClose, onConfirm, speciesName, isSubmitting = false }: BuyDnaPopupProps) => {
  const { usdcBalance, isConnected } = useWallet();
  const { currency: savedCurrency, amount: savedAmount, setCurrency, setAmount } = usePaymentSettings();
  const { address } = useAccount();
  
  // Fetch native ETH balance
  const { data: ethBalanceData } = useBalance({
    address: isConnected && address ? address : undefined,
  });
  
  const ethBalance = ethBalanceData ? parseFloat(formatUnits(ethBalanceData.value, 18)) : 0;
  
  const [selectedCurrency, setSelectedCurrency] = useState<'USDC' | 'ETH'>(savedCurrency);
  const [selectedAmount, setSelectedAmount] = useState<number>(savedAmount);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustom, setUseCustom] = useState(false);

  const quickAmounts: QuickBuyAmount[] = [0.5, 1, 2, 3, 5, 10];

  useEffect(() => {
    setSelectedCurrency(savedCurrency);
    setSelectedAmount(savedAmount);
    setUseCustom(false);
    setCustomAmount('');
  }, [savedCurrency, savedAmount, isOpen]);

  const handleSelectPreset = (amount: QuickBuyAmount) => {
    setSelectedAmount(amount);
    setUseCustom(false);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    // Only allow valid numeric input
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomAmount(value);
      setUseCustom(true);
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed > 0) {
        setSelectedAmount(parsed);
      }
    }
  };

  const finalAmount = useCustom && customAmount ? parseFloat(customAmount) : selectedAmount;
  const isValidAmount = !isNaN(finalAmount) && finalAmount > 0;

  const handleConfirm = () => {
    if (!isValidAmount) return;
    // Persist to localStorage and notify all components
    localStorage.setItem('fyreapp-payment-currency', selectedCurrency);
    localStorage.setItem('fyreapp-quick-buy-amount', finalAmount.toString());
    window.dispatchEvent(new CustomEvent('buySettingsChanged'));
    // Also update via hook for consistency
    setCurrency(selectedCurrency);
    if (!useCustom) {
      setAmount(finalAmount as QuickBuyAmount);
    }
    onConfirm(finalAmount, selectedCurrency);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[280px] bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="font-serif text-sm text-center">Buy DNA</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Balance Display */}
          <div className="flex items-center justify-between text-xs font-sans p-2 bg-muted/50 rounded-lg">
            {selectedCurrency === 'USDC' ? (
              <span className="text-muted-foreground">USDC bal: <span className="text-foreground font-medium">${usdcBalance.toFixed(2)}</span></span>
            ) : (
              <span className="text-muted-foreground">ETH bal: <span className="text-foreground font-medium">{ethBalance.toFixed(4)} ETH</span></span>
            )}
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
                onClick={() => handleSelectPreset(amount)}
                className={cn(
                  "py-1.5 text-xs font-sans rounded-lg border transition-all",
                  !useCustom && selectedAmount === amount
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-sans">Custom:</span>
            <div className="flex-1 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="0.00"
                className={cn(
                  "w-full pl-5 pr-2 py-1.5 text-xs font-sans rounded-lg border bg-background/50 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all",
                  useCustom && customAmount
                    ? "border-primary bg-primary/10"
                    : "border-border focus:border-primary/50"
                )}
              />
            </div>
          </div>

          {/* Buy Button */}
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !isValidAmount}
            className={cn(
              "w-full py-3 text-sm font-sans font-bold rounded-lg transition-colors",
              !isSubmitting && isValidAmount
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isSubmitting ? 'Processing...' : isConnected ? 'BUY' : 'SET DEFAULT'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyDnaPopup;
