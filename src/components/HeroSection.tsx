import FallingSquares from './FallingSquares';
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
  soundEnabled = true
}: HeroSectionProps) => {
  const displayOnchain = onchain > 0 ? onchain : 234;
  const displayTotal = total > 0 ? total : 1234;
  return <section className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <FallingSquares animationEnabled={animationEnabled} soundEnabled={soundEnabled} />
      <div className="w-full max-w-2xl border-2 border-border rounded-lg p-6 sm:p-10 bg-card/30 relative z-10">
        <div className="text-center">
          <h1 className="font-mono text-3xl sm:text-5xl md:text-6xl font-semibold text-[#005ae0] tracking-wide">
            PUREBREEDS EXPLORER
          </h1>
          
          <p className="text-muted-foreground mt-6 leading-relaxed text-lg sm:text-2xl font-medium font-serif">Browse, Vote and Share
Tokenized Endangered Animals 
on Base L2
          <br />
            Tokenized Endangered PureBreeds<br />
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
          
          <button onClick={onSwipeUp} className="mt-8 bg-[#005ae0] hover:bg-[#0047b3] text-white font-semibold text-lg py-3 px-12 transition-colors shadow-md rounded-xl border-4 border-dashed border-neutral-600 font-mono">
            ​PRESS ME  
          </button>
        </div>
      </div>
    </section>;
};
export default HeroSection;