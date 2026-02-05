import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Antigravity from './Antigravity';

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

  const handleDexClick = () => {
    // Coming soon - no action
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
            Browse, Vote and Share <br />
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
            
            {/* Fyre DEX button - ghost/coming soon */}
            <button 
              onClick={handleDexClick}
              disabled
              className="relative border-2 border-muted-foreground/30 text-muted-foreground font-medium text-sm py-2 px-8 transition-colors rounded-xl font-mono cursor-not-allowed opacity-60 flex items-center gap-2"
            >
              FYRE DEX
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
