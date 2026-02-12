import { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Wallet, X, Sparkles } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';
import { toast } from '@/hooks/use-toast';

interface ReferralWalletGatePopupProps {
  isOpen: boolean;
  onClose: () => void;
  referrerCode: string;
}

const ReferralWalletGatePopup = ({ isOpen, onClose, referrerCode }: ReferralWalletGatePopupProps) => {
  const { connect, isConnected, address } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConnect = async () => {
    setIsProcessing(true);
    connect();
  };

  // When wallet connects, award bonuses
  const handleConnected = async () => {
    if (!address || !referrerCode) return;
    
    try {
      // Find referrer by invite code
      const { data: referrer } = await supabase
        .from('wallets')
        .select('address')
        .eq('invite_code', referrerCode)
        .maybeSingle();

      if (referrer && referrer.address !== address) {
        // Award 250 Fyre Keys to both referrer and new user
        await (supabase as any).rpc('increment_fyre_keys', { wallet_addr: address, amount: 250 });
        await (supabase as any).rpc('increment_fyre_keys', { wallet_addr: referrer.address, amount: 250 });
        await (supabase as any).rpc('increment_referral_count', { wallet_addr: referrer.address, amount: 1 });

        // Record invited_by
        await supabase
          .from('wallets')
          .update({ invited_by: referrerCode })
          .eq('address', address);

        // Celebration confetti
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            confetti({
              particleCount: 80,
              spread: 100,
              origin: { y: 0.3, x: 0.2 + i * 0.15 },
              colors: ['#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#f59e0b'],
              gravity: 0.8,
              scalar: 1.0,
              ticks: 200,
            });
          }, i * 200);
        }

        toast({
          title: "🎉 Welcome Bonus!",
          description: "+250 Fyre Keys awarded! Your referrer also received 250 keys.",
          duration: 4000,
        });
      }
    } catch (err) {
      console.error('Referral bonus error:', err);
    }

    setIsProcessing(false);
    onClose();
  };

  // If connected during this popup, process the referral
  if (isConnected && address && isProcessing) {
    handleConnected();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xs bg-card/95 backdrop-blur-xl border-border/50">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Connect & Earn 250 Fyre Keys
          </h3>
          <p className="text-sm text-muted-foreground font-sans">
            You've been referred via the Species Portal! Connect your wallet to receive <span className="text-primary font-semibold">250 Fyre Keys</span> as a welcome bonus.
          </p>
          <button
            onClick={handleConnect}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg font-sans font-medium hover:bg-primary/90 transition-colors"
          >
            <Wallet className="w-4 h-4" />
            {isProcessing ? 'Connecting...' : 'Connect Wallet'}
          </button>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground font-sans underline underline-offset-4"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralWalletGatePopup;
