import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import Cubes from '@/components/Cubes';
import DecryptedText from '@/components/DecryptedText';

const WalletGate = () => {
  const { connect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDecryptedText, setShowDecryptedText] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    setShowDecryptedText(true);
    
    // Delay actual connect to show the decrypted text animation
    setTimeout(() => {
      connect();
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#060010] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Cubes animation background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-xl">
          <Cubes
            gridSize={8}
            maxAngle={35}
            radius={4}
            easing="power3.out"
            duration={{ enter: 0.3, leave: 0.6 }}
            cellGap={{ col: 8, row: 8 }}
            borderStyle="1px solid rgba(255,255,255,0.15)"
            faceColor="#060010"
            rippleOnClick={true}
            rippleColor="#005ae0"
            rippleSpeed={2}
            autoAnimate={true}
            centerContent={
              <div className="flex flex-col items-center justify-center gap-6 p-4 text-center">
                {showDecryptedText ? (
                  <div className="space-y-2">
                    <DecryptedText
                      text="FYREAPP 1: PUREBREEDS"
                      speed={40}
                      maxIterations={15}
                      animateOn="view"
                      className="text-white font-mono text-lg sm:text-xl font-bold tracking-wider"
                      encryptedClassName="text-[#005ae0] font-mono text-lg sm:text-xl font-bold tracking-wider"
                    />
                    <div className="h-2" />
                    <DecryptedText
                      text="SLIDES AND FAV"
                      speed={50}
                      maxIterations={12}
                      animateOn="view"
                      className="text-white/80 font-mono text-sm sm:text-base tracking-widest"
                      encryptedClassName="text-[#005ae0]/80 font-mono text-sm sm:text-base tracking-widest"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="font-mono text-xl sm:text-2xl font-bold text-white tracking-wider">
                      FYREAPP 1
                    </h1>
                    <Button 
                      onClick={handleConnect}
                      disabled={isConnecting}
                      size="lg"
                      className="bg-[#005ae0] hover:bg-[#0047b3] text-white font-mono font-semibold px-8 py-3 rounded-lg shadow-lg shadow-[#005ae0]/30 transition-all"
                    >
                      {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
                    </Button>
                  </>
                )}
              </div>
            }
            centerRows={4}
            centerCols={4}
          />
        </div>
      </div>
    </div>
  );
};

export default WalletGate;
