import { useEffect, useState, useRef } from 'react';

interface Square {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

interface FallingSquaresProps {
  animationEnabled?: boolean;
  soundEnabled?: boolean;
}

const FallingSquares = ({ animationEnabled = true, soundEnabled = true }: FallingSquaresProps) => {
  const [squares, setSquares] = useState<Square[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundTimeRef = useRef(0);

  const playClinkSound = () => {
    if (!soundEnabled) return;
    
    const now = Date.now();
    // Only play sound occasionally (at least 800ms apart)
    if (now - lastSoundTimeRef.current < 800) return;
    
    // Random chance to play (30% chance)
    if (Math.random() > 0.3) return;
    
    lastSoundTimeRef.current = now;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Metallic clink frequencies
    const frequencies = [1200, 1800, 2400, 3000];
    oscillator.frequency.value = frequencies[Math.floor(Math.random() * frequencies.length)];
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  useEffect(() => {
    if (!animationEnabled) {
      setSquares([]);
      return;
    }

    const generateSquares = () => {
      const newSquares: Square[] = [];
      // 24 squares (200% more than 8)
      for (let i = 0; i < 24; i++) {
        // Size distribution: most bigger (12-32px), some small (4-12px)
        const sizeRoll = Math.random();
        let size;
        if (sizeRoll > 0.3) {
          // 70% are bigger boxes (16-36px)
          size = 16 + Math.random() * 20;
        } else {
          // 30% are smaller (6-16px)
          size = 6 + Math.random() * 10;
        }
        
        newSquares.push({
          id: Date.now() + i + Math.random() * 1000,
          x: Math.random() * 100, // Full width origin
          delay: Math.random() * 3,
          duration: 2 + Math.random() * 4, // Varying speeds (2-6 seconds)
          size,
        });
      }
      setSquares(prev => [...prev, ...newSquares]);
      
      // Play occasional clink
      playClinkSound();
    };

    // Initial generation
    generateSquares();
    
    // Continuous flow - generate new squares frequently
    const interval = setInterval(generateSquares, 1500);
    
    // Clean up old squares periodically
    const cleanupInterval = setInterval(() => {
      setSquares(prev => prev.slice(-50)); // Keep last 50 squares
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanupInterval);
    };
  }, [animationEnabled, soundEnabled]);

  // Play sound effect occasionally
  useEffect(() => {
    if (!animationEnabled || !soundEnabled) return;
    
    const soundInterval = setInterval(() => {
      playClinkSound();
    }, 2000);
    
    return () => clearInterval(soundInterval);
  }, [animationEnabled, soundEnabled]);

  if (!animationEnabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {squares.map((square) => (
        <div
          key={square.id}
          className="absolute bg-[#005ae0]/70 rounded-sm"
          style={{
            left: `${square.x}%`,
            width: `${square.size}px`,
            height: `${square.size}px`,
            animation: `magneticFall ${square.duration}s ease-in ${square.delay}s forwards`,
            '--start-x': `${square.x}%`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default FallingSquares;
