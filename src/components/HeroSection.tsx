import { useState, useEffect } from 'react';
import FallingSquares from './FallingSquares';
interface HeroSectionProps {
  onchain: number;
  total: number;
  onSwipeUp: () => void;
  animationEnabled?: boolean;
  soundEnabled?: boolean;
}
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}
const HeroSection = ({
  onchain,
  total,
  onSwipeUp,
  animationEnabled = true,
  soundEnabled = true
}: HeroSectionProps) => {
  const displayOnchain = onchain > 0 ? onchain : 234;
  const displayTotal = total > 0 ? total : 1234;
  const [particles, setParticles] = useState<Particle[]>([]);
  const handleImpact = () => {
    if (!animationEnabled) return;
    // Create impact particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: 50 + (Math.random() - 0.5) * 30,
        y: 0,
        size: 3 + Math.random() * 4,
        opacity: 0.8 + Math.random() * 0.2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 600);
  };
  return <section className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden opacity-85">
      <FallingSquares animationEnabled={animationEnabled} soundEnabled={soundEnabled} onImpact={handleImpact} />
      <div className="w-full max-w-2xl border-2 border-border rounded-lg p-6 sm:p-10 bg-card/30 relative z-10">
        <div className="text-center">
          <h1 className="font-mono text-3xl sm:text-5xl md:text-6xl font-semibold text-[#005ae0] tracking-wide">
            PUREBREEDS EXPLORER
          </h1>
          
          <p className="text-muted-foreground mt-6 leading-relaxed text-lg sm:text-2xl font-medium font-serif">Browse, Vote and Share   <br />
            ​Tokenized Endangered Animals  <br />
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
          
          {/* CTA Button with chainsaw border animation and impact particles */}
          <div className="relative mt-8 inline-block">
            {/* Impact particles */}
            {particles.map(particle => <div key={particle.id} className="absolute bg-[#005ae0] rounded-full animate-impact-particle" style={{
            left: `${particle.x}%`,
            bottom: '100%',
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            transform: `translateX(-50%)`
          }} />)}
            <button onClick={onSwipeUp} className="relative bg-[#005ae0] hover:bg-[#0047b3] text-white font-semibold text-lg py-3 px-12 transition-colors shadow-md rounded-xl font-mono chainsaw-border overflow-hidden">
              PRESS ME
            </button>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;