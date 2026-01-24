import React, { useState, useEffect } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentCurrency } from '@/components/InlineFilterBar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Footer = () => {
  const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency>(() => {
    const saved = localStorage.getItem('fyreapp-payment-currency');
    return (saved as PaymentCurrency) || 'USDC';
  });
  
  const [quickBuyAmount, setQuickBuyAmount] = useState<number>(() => {
    const saved = localStorage.getItem('fyreapp-quick-buy-amount');
    return saved ? parseFloat(saved) : 1;
  });

  const [showAppsDialog, setShowAppsDialog] = useState(false);
  const [showSocialsDialog, setShowSocialsDialog] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);

  useEffect(() => {
    localStorage.setItem('fyreapp-payment-currency', paymentCurrency);
  }, [paymentCurrency]);

  useEffect(() => {
    localStorage.setItem('fyreapp-quick-buy-amount', quickBuyAmount.toString());
  }, [quickBuyAmount]);

  const quickBuyAmounts = [0.5, 1, 2, 3, 5, 10];

  const socialLinks = [
    { name: 'X', url: 'https://x.com/warplette' },
    { name: 'Base App', url: 'https://base.app/profile/0xD7305c73f62B7713B74316613795C77E814Dea0f' },
    { name: 'Farcaster', url: 'https://farcaster.xyz/warplette' },
    { name: 'Zora', url: 'https://zora.co/@fcbcc' },
  ];

  const quickLinks = [
    { id: 1, name: 'FyreApp 1', fullName: 'FyreApp 1: PureBreed Explorer', url: '/explore', active: true, isCurrent: true },
    { id: 0, name: 'FyreApp 0', fullName: 'FyreApp 0: Fyre Docs', url: 'https://fyreapp0.vercel.app/', active: true, isCurrent: false },
    { id: 2, name: 'FyreApp 2', fullName: 'FyreApp 2: Portfolio Manager', url: '#', active: false, isCurrent: false },
    { id: 3, name: 'FyreApp 3', fullName: 'FyreApp 3: Custody and Snapshots', url: '#', active: false, isCurrent: false },
    { id: 4, name: 'FyreApp 4', fullName: 'FyreApp 4: Fyre Labs', url: '#', active: false, isCurrent: false },
    { id: 5, name: 'FyreApp 5', fullName: 'FyreApp 5: Fyre Arena', url: '#', active: false, isCurrent: false },
    { id: 'herald', name: 'Herald', fullName: 'FyreHerald (community FyreApp)', url: 'https://farcaster.xyz/miniapps/NBRppPFoPDDF/fyre-herald', active: true, isCurrent: false },
  ];

  return (
    <footer className="border-t border-border bg-card/50 mt-8 w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-4 w-full">
        {/* Main Footer Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* FCBC Brand */}
          <a 
            href="https://fcbc.fun" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-serif text-lg font-bold text-foreground hover:text-primary transition-colors"
          >
            FCBC
          </a>

          {/* Action Buttons */}
          <div className="flex items-center gap-0">
            <button
              onClick={() => setShowAppsDialog(true)}
              className="px-3 py-1.5 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              Apps
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={() => setShowSocialsDialog(true)}
              className="px-3 py-1.5 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              Socials
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={() => setShowBuyDialog(true)}
              className="px-3 py-1.5 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              Buy Settings
            </button>

            {/* Quick Buy Amount Display */}
            <button
              onClick={() => setShowBuyDialog(true)}
              className="ml-1 px-3 py-1.5 text-xs font-sans font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
            >
              ${quickBuyAmount} {paymentCurrency}
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 FCBC | with love from the og folks at{' '}
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

      {/* Apps Dialog */}
      <Dialog open={showAppsDialog} onOpenChange={setShowAppsDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center font-serif">Apps</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {quickLinks.map((link) => (
              <div key={link.id} className="border-b border-border last:border-0">
                {link.active ? (
                  <a
                    href={link.url}
                    target={link.url.startsWith('http') ? '_blank' : undefined}
                    rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={() => setShowAppsDialog(false)}
                    className={cn(
                      "flex items-center gap-2 w-full px-4 py-3 text-sm font-sans transition-colors hover:bg-muted",
                      link.isCurrent && "font-medium"
                    )}
                  >
                    {link.isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                    <span>{link.name}</span>
                    {link.isCurrent && (
                      <span className="text-muted-foreground text-xs">(Active)</span>
                    )}
                  </a>
                ) : (
                  <div className="flex items-center gap-2 w-full px-4 py-3 text-sm font-sans text-muted-foreground/50">
                    <span>{link.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAppsDialog(false)}
            className="w-full py-2 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </DialogContent>
      </Dialog>

      {/* Socials Dialog */}
      <Dialog open={showSocialsDialog} onOpenChange={setShowSocialsDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center font-serif">Socials</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowSocialsDialog(false)}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm font-sans border-b border-border last:border-0 hover:bg-muted transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          <button
            onClick={() => setShowSocialsDialog(false)}
            className="w-full py-2 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </DialogContent>
      </Dialog>

      {/* Buy Settings Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center font-serif">Buy Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Currency Selection */}
            <div>
              <label className="block text-xs font-sans text-muted-foreground mb-2">
                Payment Currency
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentCurrency('USDC')}
                  className={cn(
                    "flex-1 py-2 text-sm font-sans rounded-lg border-2 transition-all",
                    paymentCurrency === 'USDC'
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  $ USDC (Base)
                </button>
                <button
                  onClick={() => setPaymentCurrency('ETH')}
                  className={cn(
                    "flex-1 py-2 text-sm font-sans rounded-lg border-2 transition-all",
                    paymentCurrency === 'ETH'
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  ETH (Base)
                </button>
              </div>
            </div>

            {/* Amount Selection */}
            <div>
              <label className="block text-xs font-sans text-muted-foreground mb-2">
                Quick Buy Amount
              </label>
              <div className="grid grid-cols-3 gap-2">
                {quickBuyAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setQuickBuyAmount(amount)}
                    className={cn(
                      "py-2 text-sm font-sans rounded-lg border-2 transition-all",
                      quickBuyAmount === amount
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowBuyDialog(false)}
            className="w-full py-2 mt-2 text-sm font-sans bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;
