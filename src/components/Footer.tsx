import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ChevronDown, Coins } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { PaymentCurrency } from '@/components/InlineFilterBar';
import socialZora from '@/assets/social-zora.png';
import socialBaseapp from '@/assets/social-baseapp.png';
import socialFarcaster from '@/assets/social-farcaster.png';
import socialX from '@/assets/social-x.png';

const Footer = () => {
  // Quick buy settings state
  const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency>(() => {
    const saved = localStorage.getItem('fyreapp-payment-currency');
    return (saved as PaymentCurrency) || 'USDC';
  });
  
  const [quickBuyAmount, setQuickBuyAmount] = useState<number>(() => {
    const saved = localStorage.getItem('fyreapp-quick-buy-amount');
    return saved ? parseFloat(saved) : 1;
  });

  // Persist payment currency
  useEffect(() => {
    localStorage.setItem('fyreapp-payment-currency', paymentCurrency);
  }, [paymentCurrency]);

  // Persist quick buy amount
  useEffect(() => {
    localStorage.setItem('fyreapp-quick-buy-amount', quickBuyAmount.toString());
  }, [quickBuyAmount]);

  const quickBuyAmounts = [0.5, 1, 2, 3, 5, 10];

  const socialLinks = [
    { 
      name: 'X', 
      url: 'https://x.com/warplette', 
      icon: socialX
    },
    { 
      name: 'Base App', 
      url: 'https://base.app/profile/0xD7305c73f62B7713B74316613795C77E814Dea0f', 
      icon: socialBaseapp
    },
    { 
      name: 'Farcaster', 
      url: 'https://farcaster.xyz/warplette', 
      icon: socialFarcaster
    },
    { 
      name: 'Zora', 
      url: 'https://zora.co/@fcbcc', 
      icon: socialZora
    },
  ];

  // Quicklinks with active/inactive status
  const quickLinks = [
    { id: 0, name: 'FyreApp 0', fullName: 'FyreApp 0: Fyre Docs', url: 'https://fyreapp0.vercel.app/', active: true },
    { id: 1, name: 'FyreApp 1', fullName: 'FyreApp 1: PureBreed Explorer', url: '/explore', active: true },
    { id: 2, name: 'FyreApp 2', fullName: 'FyreApp 2: Portfolio Manager', url: '#', active: false },
    { id: 3, name: 'FyreApp 3', fullName: 'FyreApp 3: Custody and Snapshots', url: '#', active: false },
    { id: 4, name: 'FyreApp 4', fullName: 'FyreApp 4: Fyre Labs', url: '#', active: false },
    { id: 5, name: 'FyreApp 5', fullName: 'FyreApp 5: Fyre Arena', url: '#', active: false },
    { id: 'herald', name: 'Herald', fullName: 'FyreHerald (community FyreApp 1)', url: 'https://farcaster.xyz/miniapps/NBRppPFoPDDF/fyre-herald', active: true },
  ];

  return (
    <footer className="border-t border-border bg-card/50 mt-8 w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-8 w-full">
        {/* FCBC CLUB with Social Icons */}
        <div className="flex flex-col items-center mb-6">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-3">
            FCBC CLUB
          </h3>
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 transition-colors overflow-hidden"
                title={link.name}
              >
                <img src={link.icon} alt={link.name} className="w-6 h-6 object-contain" />
              </a>
            ))}
          </div>
        </div>

        {/* Quicklinks/Roadmap */}
        <TooltipProvider>
          <div className="flex flex-col items-center mb-6">
            <h4 className="text-xs font-sans text-muted-foreground mb-3 uppercase tracking-wider">
              Quicklinks/Roadmap
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {quickLinks.map((link) => (
                <Tooltip key={link.id}>
                  <TooltipTrigger asChild>
                    {link.active ? (
                      <a
                        href={link.url}
                        target={link.url.startsWith('http') ? '_blank' : undefined}
                        rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-sans text-foreground bg-muted hover:bg-primary/20 hover:scale-105 rounded-full transition-all"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-sans text-muted-foreground/50 bg-muted/50 rounded-full cursor-not-allowed">
                        {link.name}
                      </span>
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{link.fullName}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </TooltipProvider>

        {/* Quick Buy Settings */}
        <div className="flex flex-col items-center mb-6">
          <h4 className="text-xs font-sans text-muted-foreground mb-3 uppercase tracking-wider">
            Quick Buy Settings
          </h4>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans text-foreground bg-muted hover:bg-primary/20 rounded-full transition-all">
                {paymentCurrency === 'USDC' ? (
                  <>
                    <span>$</span>
                    <span>${quickBuyAmount} {paymentCurrency}</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>${quickBuyAmount} {paymentCurrency}</span>
                  </>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[160px]">
                <div className="px-2 py-1.5 text-[10px] font-sans text-muted-foreground uppercase tracking-wider">
                  Payment Currency
                </div>
                <DropdownMenuItem
                  onClick={() => setPaymentCurrency('USDC')}
                  className={cn(
                    "text-sm font-sans cursor-pointer",
                    paymentCurrency === 'USDC' && "bg-muted"
                  )}
                >
                  $ USDC (Base)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPaymentCurrency('ETH')}
                  className={cn(
                    "text-sm font-sans cursor-pointer",
                    paymentCurrency === 'ETH' && "bg-muted"
                  )}
                >
                  ETH (Base)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-[10px] font-sans text-muted-foreground uppercase tracking-wider">
                  Quick Buy Amount
                </div>
                {quickBuyAmounts.map((amount) => (
                  <DropdownMenuItem
                    key={amount}
                    onClick={() => setQuickBuyAmount(amount)}
                    className={cn(
                      "text-sm font-sans cursor-pointer",
                      quickBuyAmount === amount && "bg-muted"
                    )}
                  >
                    ${amount}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Fyre App 1
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            with love from the og folks at{' '}
            <a 
              href="https://fcbc.fun" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline"
            >
              fcbc.fun
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;