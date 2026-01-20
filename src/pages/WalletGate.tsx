import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import Cubes from '@/components/Cubes';
import DecryptedText from '@/components/DecryptedText';
import { formatAddressForDisplay } from '@/lib/nameResolution';

const WalletGate = () => {
  const navigate = useNavigate();
  const { connect, disconnect, isConnected, address } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDecryptedText, setShowDecryptedText] = useState(false);

  // If already connected, show connected state (don't auto-navigate)
  // User can choose to continue or disconnect

  const handleConnect = async () => {
    setIsConnecting(true);
    setShowDecryptedText(true);
    
    // Connect wallet first
    connect();
    
    // Wait for animation to complete, then navigate
    setTimeout(() => {
      navigate('/explore');
    }, 4500);
  };

  const handleDisconnect = () => {
    disconnect();
    // Stay on this page after disconnect
  };

  const handleSkip = () => {
    navigate('/explore');
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
            duration={{ enter: 0.5, leave: 1.0 }}
            cellGap={{ col: 8, row: 8 }}
            borderStyle="1px solid rgba(255,255,255,0.15)"
            faceColor="#060010"
            rippleOnClick={true}
            rippleColor="#005ae0"
            rippleSpeed={1}
            autoAnimate={true}
            centerContent={
              <div className="flex flex-col items-center justify-center gap-6 p-4 text-center">
                {showDecryptedText ? (
                  <div className="space-y-3">
                    <DecryptedText
                      text="FYREAPP 1"
                      speed={80}
                      maxIterations={20}
                      animateOn="view"
                      className="text-white font-mono text-xl sm:text-2xl font-bold tracking-wider"
                      encryptedClassName="text-[#005ae0] font-mono text-xl sm:text-2xl font-bold tracking-wider"
                    />
                    <div className="h-3" />
                    <DecryptedText
                      text="PureBreed Slideshows"
                      speed={100}
                      maxIterations={18}
                      animateOn="view"
                      className="text-white/90 font-mono text-sm sm:text-base tracking-widest"
                      encryptedClassName="text-[#005ae0]/90 font-mono text-sm sm:text-base tracking-widest"
                    />
                    <DecryptedText
                      text="and Base Square Rankings"
                      speed={100}
                      maxIterations={18}
                      animateOn="view"
                      className="text-white/80 font-mono text-sm sm:text-base tracking-widest"
                      encryptedClassName="text-[#005ae0]/80 font-mono text-sm sm:text-base tracking-widest"
                    />
                  </div>
                ) : isConnected && address ? (
                  <>
                    <h1 className="font-mono text-xl sm:text-2xl font-bold text-white tracking-wider">
                      WALLET CONNECTED
                    </h1>
                    <div className="space-y-3">
                      <p className="text-white/80 font-mono text-sm">
                        {formatAddressForDisplay(address)}
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={() => navigate('/explore')}
                          size="lg"
                          className="bg-[#005ae0] hover:bg-[#0047b3] text-white font-mono font-semibold px-8 py-3 rounded-lg shadow-lg shadow-[#005ae0]/30 transition-all"
                        >
                          CONTINUE TO EXPLORE
                        </Button>
                        <Button 
                          onClick={handleDisconnect}
                          variant="outline"
                          size="lg"
                          className="border-white/20 text-white hover:bg-white/10 font-mono font-semibold px-8 py-3 rounded-lg transition-all"
                        >
                          DISCONNECT
                        </Button>
                      </div>
                    </div>
                  </>
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
                    <button
                      onClick={handleSkip}
                      className="text-white/60 hover:text-white text-sm font-mono underline underline-offset-4 transition-colors mt-2"
                    >
                      Skip for now
                    </button>
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
