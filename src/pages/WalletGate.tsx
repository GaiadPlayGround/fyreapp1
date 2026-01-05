import { useState, useEffect } from 'react';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import Cubes from '@/components/Cubes';
import DecryptedText from '@/components/DecryptedText';

const WalletGate = () => {
  const { isConnecting } = useAccount();
  const [hasClicked, setHasClicked] = useState(false);

  // Show decrypted text when user clicks connect
  const handleConnectClick = () => {
    setHasClicked(true);
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
            rippleSpeed={hasClicked ? 0.3 : 1}
            autoAnimate={true}
            centerContent={
              <div className="flex flex-col items-center justify-center gap-6 p-4 text-center">
                {hasClicked || isConnecting ? (
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
                    {!isConnecting && (
                      <div className="mt-4">
                        <p className="text-white/50 text-xs font-mono mb-3">
                          Wallet connection cancelled
                        </p>
                        <Wallet>
                          <ConnectWallet 
                            className="bg-[#005ae0] hover:bg-[#0047b3] text-white font-mono font-semibold px-6 py-2 rounded-lg shadow-lg shadow-[#005ae0]/30 transition-all text-sm"
                          />
                        </Wallet>
                      </div>
                    )}
                    {isConnecting && (
                      <div className="mt-4">
                        <p className="text-[#005ae0] text-xs font-mono animate-pulse">
                          Connecting...
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <h1 className="font-mono text-xl sm:text-2xl font-bold text-white tracking-wider">
                      FYREAPP 1
                    </h1>
                    <div onClick={handleConnectClick}>
                      <Wallet>
                        <ConnectWallet 
                          className="bg-[#005ae0] hover:bg-[#0047b3] text-white font-mono font-semibold px-8 py-3 rounded-lg shadow-lg shadow-[#005ae0]/30 transition-all"
                        />
                      </Wallet>
                    </div>
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
