import Cubes from '@/components/Cubes';
import DecryptedText from '@/components/DecryptedText';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const WalletGate = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-xl">
          <Cubes
            gridSize={8}
            maxAngle={35}
            radius={4}
            easing="power3.out"
            duration={{ enter: 0.5, leave: 1.0 }}
            cellGap={{ col: 8, row: 8 }}
            borderStyle="1px solid hsl(var(--border) / 0.35)"
            faceColor="hsl(var(--background))"
            rippleOnClick={true}
            rippleColor="hsl(var(--primary))"
            rippleSpeed={0.6}
            autoAnimate={true}
            centerContent={
              <div className="flex flex-col items-center justify-center gap-6 p-4 text-center">
                <div className="space-y-3">
                  <DecryptedText
                    text="FYREAPP 1"
                    speed={80}
                    maxIterations={20}
                    animateOn="view"
                    className="text-foreground font-mono text-xl sm:text-2xl font-bold tracking-wider"
                    encryptedClassName="text-primary font-mono text-xl sm:text-2xl font-bold tracking-wider"
                  />
                  <div className="h-3" />
                  <DecryptedText
                    text="PureBreed Slideshows"
                    speed={100}
                    maxIterations={18}
                    animateOn="view"
                    className="text-foreground/90 font-mono text-sm sm:text-base tracking-widest"
                    encryptedClassName="text-primary/90 font-mono text-sm sm:text-base tracking-widest"
                  />
                  <DecryptedText
                    text="and Base Square Voting"
                    speed={100}
                    maxIterations={18}
                    animateOn="view"
                    className="text-foreground/80 font-mono text-sm sm:text-base tracking-widest"
                    encryptedClassName="text-primary/80 font-mono text-sm sm:text-base tracking-widest"
                  />
                </div>

                <Button
                  onClick={() => navigate('/')}
                  size="lg"
                  className="font-mono tracking-widest"
                >
                  ENTER APP
                </Button>
              </div>
            }
            centerRows={4}
            centerCols={4}
          />
        </div>
      </div>
    </main>
  );
};

export default WalletGate;

