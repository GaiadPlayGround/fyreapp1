import { useState, useEffect } from 'react';
import { X, Sparkles, Flame, Zap, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnzymeAdPopupProps {
  onClose: () => void;
}

const EnzymeAdPopup = ({ onClose }: EnzymeAdPopupProps) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-foreground/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 bg-muted/50 hover:bg-muted rounded-full transition-colors z-10"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Header gradient */}
        <div className="bg-gradient-to-r from-primary via-[#005ae0] to-primary p-6 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-white" />
            <span className="text-white/80 text-sm font-sans">NEW</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white">
            Introducing DNA Enzymes!
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 -mt-4">
          <div className="bg-card rounded-xl p-4 border border-border shadow-md">
            <p className="text-foreground font-sans text-base mb-4">
              Consumable Breeding Collectibles for Value Conservation. 
              <span className="text-primary font-semibold"> Save 50% burn allocation</span> in Fyre Labs.
            </p>
            
            <p className="text-muted-foreground text-sm font-sans mb-4">
              For Fyre Breeders.
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-sans rounded-full">
                <Flame className="w-3 h-3" />
                Deflationary Supply
              </span>
              <span className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-sans rounded-full">
                <Zap className="w-3 h-3" />
                Utility-Driven
              </span>
              <span className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-sans rounded-full">
                <Sparkles className="w-3 h-3" />
                OnChain Pre-asset
              </span>
            </div>

            {/* CTA Button */}
            <a
              href="https://opensea.io/collection/fcbrwa-enzyme"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-sans font-semibold rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Buy FCbRWA-enzymes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnzymeAdPopup;
