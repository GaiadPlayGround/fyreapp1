import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Antigravity from './Antigravity';
import { Dialog, DialogContent } from './ui/dialog';
import { ChevronDown, Lock } from 'lucide-react';

interface HeroSectionProps {
  onchain: number;
  total: number;
  onSwipeUp: () => void;
  animationEnabled?: boolean;
  soundEnabled?: boolean;
}

const HeroSection = ({
  onchain,
  total,
  onSwipeUp,
  animationEnabled = true,
}: HeroSectionProps) => {
  const navigate = useNavigate();
  const displayOnchain = onchain > 0 ? onchain : 234;
  const displayTotal = total > 0 ? total : 1234;
  const [showDexDropdown, setShowDexDropdown] = useState(false);
  const [dexPassword, setDexPassword] = useState('');
  const [showDexUrl, setShowDexUrl] = useState(false);

  const handleDexSubmit = () => {
    if (dexPassword === '1234321') {
      setShowDexUrl(true);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Antigravity animation background */}
      {animationEnabled && (
        <div className="absolute inset-0 z-0">
          <Antigravity
            count={300}
            magnetRadius={6}
            ringRadius={7}
            waveSpeed={0.4}
            waveAmplitude={1}
            particleSize={1.5}
            lerpSpeed={0.05}
            color={'#005ae0'}
            autoAnimate={true}
            particleVariance={1}
          />
        </div>
      )}
      
      <div className="w-full max-w-2xl border-2 border-border rounded-lg p-6 sm:p-10 bg-card/80 backdrop-blur-sm relative z-10">
        <div className="text-center">
          <h1 className="font-mono text-3xl sm:text-5xl md:text-6xl font-semibold text-[#005ae0] tracking-wide">
            PUREBREEDS NAVIGATOR
          </h1>
          
          <p className="text-muted-foreground mt-6 leading-relaxed text-lg sm:text-2xl font-medium font-serif">
            Browse, Vote and Buy <br />
            ​Tokenized Endangered Animals <br />
            on Base L2
          </p>
          
          <a href="https://fcbc.fun" target="_blank" rel="noopener noreferrer" className="font-sans text-blue-500 hover:text-blue-600 transition-colors inline-block mt-6 text-sm">
            (a product of fcbc.fun)
          </a>
          
          <div className="mt-4">
            <span className="text-sm text-muted-foreground font-serif">Total Onchain:</span>
            <span className="ml-2 text-base font-sans font-semibold text-foreground">
              {displayOnchain}/{displayTotal}
            </span>
          </div>
          
          {/* CTA Buttons */}
          <div className="relative mt-8 flex flex-col items-center gap-3">
            {/* Explorer button - primary */}
            <button 
              onClick={onSwipeUp} 
              className="relative bg-[#005ae0] hover:bg-[#0047b3] text-white font-semibold text-lg py-3 px-12 transition-colors shadow-md rounded-xl font-mono overflow-hidden"
            >
              EXPLORER
            </button>
            
            {/* Fyre DEX button - with password dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowDexDropdown(!showDexDropdown)}
                className="relative border-2 border-orange-500/40 text-muted-foreground font-medium text-sm py-2 px-8 transition-colors rounded-xl font-mono flex items-center gap-2 hover:border-orange-500/70 shadow-[0_0_8px_rgba(249,115,22,0.2),0_0_16px_rgba(239,68,68,0.1)]"
              >
                FYRE DEX
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showDexDropdown && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg p-3 w-56 z-20 animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-mono">Enter access code</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={dexPassword}
                      onChange={(e) => setDexPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleDexSubmit()}
                      placeholder="Password"
                      className="flex-1 px-2 py-1.5 text-xs font-mono bg-background border border-border rounded-md text-foreground outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={handleDexSubmit}
                      className="px-3 py-1.5 text-xs font-mono bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      Go
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DEX URL Popup */}
      <Dialog open={showDexUrl} onOpenChange={setShowDexUrl}>
        <DialogContent className="max-w-xs">
          <div className="text-center space-y-3 py-2">
            <h3 className="font-mono text-sm font-bold text-foreground">FyreDEX Access</h3>
            <a
              href="https://fyreapp11.lovable.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm font-mono underline break-all hover:text-primary/80"
            >
              fyreapp11.lovable.app
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HeroSection;
