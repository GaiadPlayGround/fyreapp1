import { useEffect, useState, useRef } from 'react';

interface Shape {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  type: 'square' | 'circle' | 'triangle';
}

interface FallingSquaresProps {
  animationEnabled?: boolean;
  soundEnabled?: boolean;
  onImpact?: () => void;
}

const FallingSquares = ({ animationEnabled = true, soundEnabled = true, onImpact }: FallingSquaresProps) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundTimeRef = useRef(0);
  const soundModeRef = useRef<'clink' | 'wildlife'>('clink');

  // Alternate sound mode every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      soundModeRef.current = soundModeRef.current === 'clink' ? 'wildlife' : 'clink';
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const playClinkSound = () => {
    if (!soundEnabled) return;
    
    const now = Date.now();
    if (now - lastSoundTimeRef.current < 800) return;
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
    
    if (soundModeRef.current === 'clink') {
      const frequencies = [1200, 1800, 2400, 3000];
      oscillator.frequency.value = frequencies[Math.floor(Math.random() * frequencies.length)];
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } else {
      // Wildlife sounds - birds, frogs, insects, critters
      const wildlifeSounds = [
        { freq: 2800, type: 'sine' as OscillatorType, duration: 0.15 }, // Bird chirp
        { freq: 400, type: 'sawtooth' as OscillatorType, duration: 0.3 }, // Frog croak
        { freq: 4500, type: 'square' as OscillatorType, duration: 0.05 }, // Insect click
        { freq: 1200, type: 'triangle' as OscillatorType, duration: 0.2 }, // Critter squeak
        { freq: 600, type: 'sine' as OscillatorType, duration: 0.25 }, // Mammal call
      ];
      const sound = wildlifeSounds[Math.floor(Math.random() * wildlifeSounds.length)];
      oscillator.frequency.value = sound.freq;
      oscillator.type = sound.type;
      gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + sound.duration);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + sound.duration);
    }
  };

  useEffect(() => {
    if (!animationEnabled) {
      setShapes([]);
      return;
    }

    const generateShapes = () => {
      const newShapes: Shape[] = [];
      for (let i = 0; i < 24; i++) {
        const sizeRoll = Math.random();
        let size;
        if (sizeRoll > 0.3) {
          size = 16 + Math.random() * 20;
        } else {
          size = 6 + Math.random() * 10;
        }
        
        // Determine shape type: 1/200 purple circle, 1/100 white triangle, rest blue squares
        const shapeRoll = Math.random();
        let type: 'square' | 'circle' | 'triangle' = 'square';
        if (shapeRoll < 0.005) { // 1 in 200
          type = 'circle';
        } else if (shapeRoll < 0.015) { // 1 in 100 (0.5% + 0.5% = 1%)
          type = 'triangle';
        }
        
        newShapes.push({
          id: Date.now() + i + Math.random() * 1000,
          x: Math.random() * 100,
          delay: Math.random() * 3,
          duration: 2 + Math.random() * 4,
          size,
          type,
        });
      }
      setShapes(prev => [...prev, ...newShapes]);
      playClinkSound();
      onImpact?.();
    };

    generateShapes();
    const interval = setInterval(generateShapes, 1500);
    const cleanupInterval = setInterval(() => {
      setShapes(prev => prev.slice(-50));
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanupInterval);
    };
  }, [animationEnabled, soundEnabled, onImpact]);

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
      {shapes.map((shape) => {
        if (shape.type === 'circle') {
          return (
            <div
              key={shape.id}
              className="absolute bg-purple-500/80 rounded-full"
              style={{
                left: `${shape.x}%`,
                width: `${shape.size}px`,
                height: `${shape.size}px`,
                animation: `magneticFall ${shape.duration}s ease-in ${shape.delay}s forwards`,
                '--start-x': `${shape.x}%`,
              } as React.CSSProperties}
            />
          );
        }
        if (shape.type === 'triangle') {
          return (
            <div
              key={shape.id}
              className="absolute"
              style={{
                left: `${shape.x}%`,
                width: 0,
                height: 0,
                borderLeft: `${shape.size / 2}px solid transparent`,
                borderRight: `${shape.size / 2}px solid transparent`,
                borderBottom: `${shape.size}px solid rgba(255,255,255,0.85)`,
                animation: `magneticFall ${shape.duration}s ease-in ${shape.delay}s forwards`,
                '--start-x': `${shape.x}%`,
              } as React.CSSProperties}
            />
          );
        }
        return (
          <div
            key={shape.id}
            className="absolute bg-[#005ae0]/70 rounded-sm"
            style={{
              left: `${shape.x}%`,
              width: `${shape.size}px`,
              height: `${shape.size}px`,
              animation: `magneticFall ${shape.duration}s ease-in ${shape.delay}s forwards`,
              '--start-x': `${shape.x}%`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};

export default FallingSquares;
