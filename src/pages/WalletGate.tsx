import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import Cubes from '@/components/Cubes';
import DecryptedText from '@/components/DecryptedText';
import { formatAddressForDisplay } from '@/lib/nameResolution';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const WalletGate = () => {
  const navigate = useNavigate();
  const { connect, disconnect, isConnected, address, usdcBalance, dnaBalance, ownedGenomes } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDecryptedText, setShowDecryptedText] = useState(false);
  const [showConnectingPopup, setShowConnectingPopup] = useState(false);
  const [showConnectedDetails, setShowConnectedDetails] = useState(false);
  const { address: wagmiAddress } = useAccount();
  const { data: ethBalanceData } = useBalance({
    address: isConnected && wagmiAddress ? wagmiAddress : undefined,
  });
  const ethBalance = ethBalanceData ? parseFloat(formatUnits(ethBalanceData.value, 18)) : 0;

  // When wallet connects during the connecting flow, show details
  useEffect(() => {
    if (isConnected && isConnecting && showConnectingPopup) {
      setShowConnectedDetails(true);
      // Auto-navigate after 5 seconds
      const timer = setTimeout(() => {
        navigate('/explore');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isConnecting, showConnectingPopup, navigate]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setShowDecryptedText(true);
    setShowConnectingPopup(true);
    connect();
  };

  const handleSpeedUp = () => {
    setShowConnectingPopup(false);
    navigate('/explore');
  };

  const handleDisconnect = () => {
    disconnect();
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
                ) : isConnected && address && !isConnecting ? (
                  <>
                    <h1 className="font-mono text-xl sm:text-2xl font-bold text-white tracking-wider">
                      WALLET CONNECTED
                    </h1>
                    <div className="space-y-3">
                      <p className="text-white/80 font-mono text-sm">
                        {formatAddressForDisplay(address)}
                      </p>
                      {/* Quick portfolio details */}
                      <div className="w-full space-y-1 text-xs font-mono">
                        <div className="flex justify-between text-white/70">
                          <span>USDC:</span>
                          <span className="text-white">${usdcBalance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>ETH:</span>
                          <span className="text-white">{ethBalance.toFixed(4)} ETH</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>DNA Tokens:</span>
                          <span className="text-white">{dnaBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Genomes:</span>
                          <span className="text-white">{ownedGenomes}</span>
                        </div>
                      </div>
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
                    <p className="text-white/60 font-mono text-xs tracking-widest">
                      Explorer Miniapp
                    </p>
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

      {/* Connecting Popup */}
      <Dialog open={showConnectingPopup} onOpenChange={(open) => { if (!open) handleSpeedUp(); }}>
        <DialogContent className="max-w-xs bg-[#0a0020]/95 border-[#005ae0]/30 text-white">
          {!showConnectedDetails ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="w-8 h-8 text-[#005ae0] animate-spin" />
              <p className="font-mono text-sm text-white/80">Connecting wallet...</p>
              <button
                onClick={handleSpeedUp}
                className="text-[#005ae0] text-xs font-mono underline underline-offset-4 hover:text-[#3d8cff] transition-colors"
              >
                Speed up — continue to explore
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <p className="font-mono text-sm text-white font-bold">Connected</p>
              {address && (
                <p className="font-mono text-[10px] text-white/60">
                  {formatAddressForDisplay(address)}
                </p>
              )}
              <div className="w-full space-y-1.5 mt-2 text-xs font-mono">
                <div className="flex justify-between text-white/70">
                  <span>USDC:</span>
                  <span className="text-white">${usdcBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>ETH:</span>
                  <span className="text-white">{ethBalance.toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>DNA Tokens:</span>
                  <span className="text-white">{dnaBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Genomes:</span>
                  <span className="text-white">{ownedGenomes}</span>
                </div>
              </div>
              <button
                onClick={handleSpeedUp}
                className="mt-2 text-[#005ae0] text-xs font-mono underline underline-offset-4 hover:text-[#3d8cff] transition-colors"
              >
                Speed up — continue to explore
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletGate;
