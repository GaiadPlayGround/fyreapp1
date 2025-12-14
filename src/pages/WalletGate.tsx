import { Lock } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';

const WalletGate = () => {
  const { connect } = useWallet();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-4">
      <h1 className="font-serif text-2xl font-medium text-foreground">
        Fyre App 1
      </h1>
      
      <Lock className="w-16 h-16 text-muted-foreground" />
      
      <Button 
        onClick={connect}
        size="lg"
        className="mt-4"
      >
        Connect Wallet
      </Button>
    </div>
  );
};

export default WalletGate;
