import { useState, useEffect } from 'react';
import { ChevronDown, DollarSign, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export type PaymentCurrency = 'USDC' | 'ETH';
export type QuickBuyAmount = 0.5 | 1 | 2 | 3 | 5 | 10;

interface PaymentSettingsProps {
  className?: string;
}

const STORAGE_KEY_CURRENCY = 'fyreapp-payment-currency';
const STORAGE_KEY_AMOUNT = 'fyreapp-quick-buy-amount';

// Export a hook to get current payment settings
export const usePaymentSettings = () => {
  const [currency, setCurrency] = useState<PaymentCurrency>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
    return (saved as PaymentCurrency) || 'USDC';
  });
  
  const [amount, setAmount] = useState<QuickBuyAmount>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AMOUNT);
    return saved ? (parseFloat(saved) as QuickBuyAmount) : 1;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENCY, currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AMOUNT, amount.toString());
  }, [amount]);

  return { currency, setCurrency, amount, setAmount };
};

const PaymentSettings = ({ className }: PaymentSettingsProps) => {
  const { currency, setCurrency, amount, setAmount } = usePaymentSettings();

  const amounts: QuickBuyAmount[] = [0.5, 1, 2, 3, 5, 10];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-full transition-colors",
        className
      )}>
        {currency === 'USDC' ? (
          <DollarSign className="w-3.5 h-3.5" />
        ) : (
          <Coins className="w-3.5 h-3.5" />
        )}
        <span>${amount}</span>
        <span className="text-muted-foreground/60">{currency}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[160px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Payment Currency
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setCurrency('USDC')}
          className={cn(
            "text-sm font-sans cursor-pointer flex items-center gap-2",
            currency === 'USDC' && "bg-muted"
          )}
        >
          <DollarSign className="w-3.5 h-3.5" />
          USDC (Base)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setCurrency('ETH')}
          className={cn(
            "text-sm font-sans cursor-pointer flex items-center gap-2",
            currency === 'ETH' && "bg-muted"
          )}
        >
          <Coins className="w-3.5 h-3.5" />
          ETH (Base)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Quick Buy Amount
        </DropdownMenuLabel>
        {amounts.map((amt) => (
          <DropdownMenuItem
            key={amt}
            onClick={() => setAmount(amt)}
            className={cn(
              "text-sm font-sans cursor-pointer",
              amount === amt && "bg-muted"
            )}
          >
            ${amt === 0.5 ? '0.50' : amt}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PaymentSettings;
