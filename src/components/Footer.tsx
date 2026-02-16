import React, { useState, useEffect } from 'react';
import { Copy, Check, Settings, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { PaymentCurrency } from '@/components/InlineFilterBar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// App data for FyreApps dialog
const FYRE_APPS = [
  { 
    id: 0, 
    name: 'FyreApp 0', 
    fullName: 'Fyre Docs', 
    description: 'Docs & onboarding',
    url: 'https://fyreapp0.vercel.app/', 
    active: true, 
    isCurrent: false,
    logoLight: '/fyreapp-logo-0.png',
    logoDark: '/fyreapp-logo-w-0.png',
  },
  { 
    id: 1, 
    name: 'FyreApp 1', 
    fullName: 'Navigator', 
    description: 'Slideshow & Rankings',
    url: '/explore', 
    active: true, 
    isCurrent: true,
    logoLight: '/fyreapp-logo-1.png',
    logoDark: '/fyreapp-logo-1.png',
  },
  { 
    id: 2, 
    name: 'FyreApp 2', 
    fullName: 'Portfolio', 
    description: 'DNA holdings',
    url: '#', 
    active: false, 
    isCurrent: false,
    logoLight: '/fyreapp-logo-2.png',
    logoDark: '/fyreapp-logo-w-2.png',
  },
  { 
    id: 3, 
    name: 'FyreApp 3', 
    fullName: 'Custody', 
    description: 'Secure storage',
    url: '#', 
    active: false, 
    isCurrent: false,
    logoLight: '/fyreapp-logo-3.png',
    logoDark: '/fyreapp-logo-w-3.png',
  },
  { 
    id: 4, 
    name: 'FyreApp 4', 
    fullName: 'Fyre Labs', 
    description: 'Experiments',
    url: '#', 
    active: false, 
    isCurrent: false,
    logoLight: '/fyreapp-logo-4.png',
    logoDark: '/fyreapp-logo-w-4.png',
  },
  { 
    id: 5, 
    name: 'FyreApp 5', 
    fullName: 'Fyre Arena', 
    description: 'Gameplay',
    url: '#', 
    active: false, 
    isCurrent: false,
    logoLight: '/fyreapp-logo-5.png',
    logoDark: '/fyreapp-logo-w-5.png',
  },
  { 
    id: 6, 
    name: 'FyreApp 6', 
    fullName: 'Fyre DEX', 
    description: 'Token exchange',
    url: '#', 
    active: false, 
    isCurrent: false,
    logoLight: '/fyreapp-logo-6.png',
    logoDark: '/fyreapp-logo-w-6.png',
  },
  { 
    id: 'herald', 
    name: 'Herald', 
    fullName: 'FyreHerald', 
    description: 'Community app',
    url: 'https://farcaster.xyz/miniapps/NBRppPFoPDDF/fyre-herald', 
    active: true, 
    isCurrent: false,
    logoLight: null,
    logoDark: null,
  },
];

const SOCIAL_LINKS = [
  { 
    name: 'X', 
    url: 'https://x.com/warplette',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  },
  { 
    name: 'Discord', 
    url: 'https://discord.gg/QrU4tkrPFP',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    )
  },
  { 
    name: 'Farcaster', 
    url: 'https://farcaster.xyz/warplette',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="url(#fc-grad-footer)"/>
        <defs>
          <linearGradient id="fc-grad-footer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#855DCD"/>
            <stop offset="100%" stopColor="#2B5876"/>
          </linearGradient>
        </defs>
        <ellipse cx="12" cy="10.5" rx="4" ry="3.5" fill="white" opacity="0.9"/>
        <circle cx="10.5" cy="10.5" r="1" fill="#333"/>
        <circle cx="13.5" cy="10.5" r="1" fill="#333"/>
      </svg>
    )
  },
  { 
    name: 'Base App', 
    url: 'https://base.app/profile/0xD7305c73f62B7713B74316613795C77E814Dea0f',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="3" fill="#0052FF"/>
        <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.5" fill="none"/>
      </svg>
    )
  },
  { 
    name: 'Zora', 
    url: 'https://zora.co/@fcbcc',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#1a1a1a"/>
        <circle cx="12" cy="12" r="6" fill="white"/>
      </svg>
    )
  },
];

const Footer = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Listen for buy settings changes from other components
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCurrency = localStorage.getItem('fyreapp-payment-currency') as PaymentCurrency;
      const savedAmount = localStorage.getItem('fyreapp-quick-buy-amount');
      if (savedCurrency && savedCurrency !== paymentCurrency) setPaymentCurrency(savedCurrency);
      if (savedAmount && parseFloat(savedAmount) !== quickBuyAmount) setQuickBuyAmount(parseFloat(savedAmount));
    };
    window.addEventListener('buySettingsChanged', handleStorageChange);
    return () => window.removeEventListener('buySettingsChanged', handleStorageChange);
  }, [paymentCurrency, quickBuyAmount]);

  useEffect(() => {
    localStorage.setItem('fyreapp-payment-currency', paymentCurrency);
    window.dispatchEvent(new CustomEvent('buySettingsChanged'));
  }, [paymentCurrency]);

  useEffect(() => {
    localStorage.setItem('fyreapp-quick-buy-amount', quickBuyAmount.toString());
    window.dispatchEvent(new CustomEvent('buySettingsChanged'));
  }, [quickBuyAmount]);

  const quickBuyAmounts = [0.5, 1, 2, 3, 5, 10];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-3 w-full">
        {/* Main Footer Row - Compact */}
        <div className="flex items-center justify-between gap-2">
          {/* FCBC Brand */}
          <a 
            href="https://fcbc.fun" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-serif text-base font-bold text-foreground hover:text-primary transition-colors"
          >
            FCBC.FUN
          </a>

          {/* Action Buttons - Compact Row */}
          <div className="flex items-center gap-0">
            <button
              onClick={() => setShowAppsDialog(true)}
              className="px-2.5 py-1 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              FyreApps
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={() => setShowSocialsDialog(true)}
              className="px-2.5 py-1 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              Socials
            </button>
            <span className="text-muted-foreground/30">|</span>
            {/* Combined Settings Button */}
            <button
              onClick={() => setShowSettingsDialog(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Settings className="w-3 h-3" />
              <span>${quickBuyAmount} {paymentCurrency}</span>
            </button>
          </div>
        </div>

        {/* Copyright - Smaller */}
        <div className="text-center mt-2">
          <p className="text-[10px] text-muted-foreground">
            © 2026 fcbc Club | with love from the og folks at{' '}
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

      {/* FyreApps Dialog - App Store Grid */}
      <Dialog open={showAppsDialog} onOpenChange={setShowAppsDialog}>
        <DialogContent className="max-w-sm bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-center font-serif text-lg">FyreApps</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {FYRE_APPS.map((app) => {
              const logo = isDark ? app.logoDark : app.logoLight;
              return (
                <div key={app.id} className={cn(
                  "relative rounded-xl border transition-all overflow-hidden flex flex-col items-center text-center p-3 gap-1.5",
                  app.active 
                    ? "border-border/50 bg-background/50 hover:bg-background/80 cursor-pointer" 
                    : "border-border/20 bg-muted/10 opacity-40 cursor-not-allowed",
                  app.isCurrent && "ring-2 ring-primary/50 border-primary/30"
                )}>
                  {app.active ? (
                    <a
                      href={app.url}
                      target={app.url.startsWith('http') ? '_blank' : undefined}
                      rel={app.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                      onClick={() => setShowAppsDialog(false)}
                      className="flex flex-col items-center gap-1.5 w-full"
                    >
                      {logo ? (
                        <img src={logo} alt={app.fullName} className="w-10 h-10 rounded-xl object-contain" />
                      ) : (
                        <span className="text-2xl">📢</span>
                      )}
                      <span className="font-sans font-medium text-[11px] text-foreground leading-tight">{app.fullName}</span>
                      <p className="text-[9px] text-muted-foreground leading-tight">{app.description}</p>
                      {app.isCurrent && (
                        <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">Active</span>
                      )}
                    </a>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 w-full">
                      {logo ? (
                        <img src={logo} alt={app.fullName} className="w-10 h-10 rounded-xl object-contain grayscale" />
                      ) : (
                        <span className="text-2xl grayscale">📢</span>
                      )}
                      <span className="font-sans font-medium text-[11px] text-muted-foreground leading-tight">{app.fullName}</span>
                      <p className="text-[9px] text-muted-foreground/60 leading-tight">{app.description}</p>
                      <span className="text-[8px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Soon</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Socials Dialog - Glassmorphism */}
      <Dialog open={showSocialsDialog} onOpenChange={setShowSocialsDialog}>
        <DialogContent className="max-w-xs bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-center font-serif text-lg">Socials</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 mt-2">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowSocialsDialog(false)}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-background/50 hover:bg-background/80 transition-colors"
              >
                {link.icon}
                <span className="font-sans text-sm text-foreground">{link.name}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Combined Settings Dialog - Glassmorphism */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-xs bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-center font-serif text-lg">Buy Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Currency Selection */}
            <div>
              <div className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider mb-2">
                Payment Currency
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentCurrency('USDC')}
                  className={cn(
                    "flex-1 px-3 py-2 text-xs font-sans rounded-xl border transition-all",
                    paymentCurrency === 'USDC' 
                      ? "border-primary bg-primary/10 text-foreground" 
                      : "border-border/30 bg-background/50 text-muted-foreground hover:border-border"
                  )}
                >
                  $ USDC
                </button>
                <button
                  onClick={() => setPaymentCurrency('ETH')}
                  className={cn(
                    "flex-1 px-3 py-2 text-xs font-sans rounded-xl border transition-all",
                    paymentCurrency === 'ETH' 
                      ? "border-primary bg-primary/10 text-foreground" 
                      : "border-border/30 bg-background/50 text-muted-foreground hover:border-border"
                  )}
                >
                  ETH
                </button>
              </div>
            </div>

            {/* Amount Selection */}
            <div>
              <div className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider mb-2">
                Quick Buy Amount
              </div>
              <div className="grid grid-cols-3 gap-2">
                {quickBuyAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setQuickBuyAmount(amount)}
                    className={cn(
                      "px-3 py-2 text-xs font-sans rounded-xl border transition-all",
                      quickBuyAmount === amount 
                        ? "border-primary bg-primary/10 text-foreground" 
                        : "border-border/30 bg-background/50 text-muted-foreground hover:border-border"
                    )}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowSettingsDialog(false)}
            className="w-full mt-4 py-2 text-xs font-sans text-primary hover:text-primary/80 transition-colors"
          >
            Done
          </button>
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;
