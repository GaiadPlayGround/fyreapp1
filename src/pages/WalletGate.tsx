import { useState, useEffect } from 'react';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import Cubes from '@/components/Cubes';
import DecryptedText from '@/components/DecryptedText';

const WalletGate = () => {
  const { isConnecting, isConnected } = useAccount();
  const [showDecryptedText, setShowDecryptedText] = useState(false);

  useEffect(() => {
    if (isConnecting) {
      setShowDecryptedText(true);
    }
  }, [isConnecting]);

  useEffect(() => {
    if (isConnected) {
      setShowDecryptedText(true);
    }
  }, [isConnected]);

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
                      text="and Base Square Voting"
                      speed={100}
                      maxIterations={18}
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
                    <Wallet>
                      <ConnectWallet 
                        className="bg-[#005ae0] hover:bg-[#0047b3] text-white font-mono font-semibold px-8 py-3 rounded-lg shadow-lg shadow-[#005ae0]/30 transition-all"
                      />
                    </Wallet>
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
