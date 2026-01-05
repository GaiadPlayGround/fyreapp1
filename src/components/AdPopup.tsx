import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const AD_DELAY_MS = 150000; // 150 seconds

const AdPopup = () => {
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAd(true);
    }, AD_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShowAd(false);
  };

  const handleBuyClick = () => {
    window.open('https://opensea.io/collection/fcbrwa-enzyme', '_blank');
    setShowAd(false);
  };

  return (
    <Dialog open={showAd} onOpenChange={setShowAd}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-primary/20">
        <DialogTitle className="sr-only">DNA Enzymes Advertisement</DialogTitle>
        <DialogDescription className="sr-only">Advertisement for DNA Enzymes consumable breeding collectibles</DialogDescription>
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <button 
            onClick={handleClose}
            className="absolute top-3 right-3 p-1 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors z-10"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          
          <div className="p-6 pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">🧬</span>
            </div>
            
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">
              Introducing DNA Enzymes!
            </h2>
            
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Consumable Breeding Collectibles for Value Conservation.<br />
              <span className="text-primary font-medium">Save 50% burn allocation</span> in Fyre Labs.
            </p>
            
            <p className="text-xs text-muted-foreground mb-6 italic">
              For Fyre Breeders.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleBuyClick}
                className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-sans font-medium hover:bg-primary/90 transition-colors"
              >
                Buy FCbRWA-enzymes
              </button>
              
              <div className="flex justify-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Deflationary Supply
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Utility-Driven
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  OnChain Pre-asset
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdPopup;
