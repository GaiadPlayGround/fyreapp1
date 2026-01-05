import { useEffect, useRef, useCallback } from 'react';

// Animal sound configurations with frequency patterns and durations
// Each animal has unique oscillator patterns to create distinctive calls
interface AnimalSound {
  name: string;
  frequencies: number[];
  duration: number;
  oscillatorType: OscillatorType;
  gainPattern: 'fade' | 'pulse' | 'tremolo' | 'steady';
  pitchVariation?: number;
}

const ANIMAL_SOUNDS: AnimalSound[] = [
  // Mammals - Low frequency calls
  { name: 'Gray Wolf', frequencies: [150, 180, 200, 160, 140], duration: 2.5, oscillatorType: 'sawtooth', gainPattern: 'fade', pitchVariation: 0.1 },
  { name: 'African Lion', frequencies: [80, 100, 120, 90, 70], duration: 2.0, oscillatorType: 'sawtooth', gainPattern: 'steady' },
  { name: 'Coyote', frequencies: [400, 500, 450, 600, 350], duration: 1.2, oscillatorType: 'triangle', gainPattern: 'pulse' },
  { name: 'Howler Monkey', frequencies: [200, 250, 180, 220, 300], duration: 1.8, oscillatorType: 'sawtooth', gainPattern: 'tremolo' },
  { name: 'Hyena', frequencies: [350, 450, 380, 500, 420], duration: 1.5, oscillatorType: 'triangle', gainPattern: 'pulse' },
  { name: 'Elk', frequencies: [600, 800, 700, 900, 650], duration: 2.0, oscillatorType: 'sine', gainPattern: 'fade' },
  { name: 'Red Fox', frequencies: [500, 700, 600, 800, 550], duration: 0.8, oscillatorType: 'sawtooth', gainPattern: 'steady' },
  { name: 'Gray Seal', frequencies: [200, 180, 220, 160, 190], duration: 1.5, oscillatorType: 'sine', gainPattern: 'fade' },
  { name: 'Tasmanian Devil', frequencies: [300, 400, 350, 450, 280], duration: 1.0, oscillatorType: 'sawtooth', gainPattern: 'tremolo' },
  
  // Elephants and whales - Very low frequency
  { name: 'African Elephant', frequencies: [40, 60, 50, 80, 45], duration: 2.5, oscillatorType: 'sine', gainPattern: 'fade' },
  { name: 'Gray Whale', frequencies: [30, 50, 40, 60, 35], duration: 3.0, oscillatorType: 'sine', gainPattern: 'steady' },
  { name: 'Humpback Whale', frequencies: [60, 100, 80, 120, 70], duration: 4.0, oscillatorType: 'sine', gainPattern: 'fade', pitchVariation: 0.2 },
  
  // Birds - High frequency calls
  { name: 'Bald Eagle', frequencies: [2000, 2400, 2200, 2600, 1800], duration: 0.5, oscillatorType: 'triangle', gainPattern: 'steady' },
  { name: 'Common Loon', frequencies: [800, 1000, 900, 1100, 850], duration: 2.0, oscillatorType: 'sine', gainPattern: 'fade', pitchVariation: 0.15 },
  { name: 'Eastern Screech Owl', frequencies: [600, 550, 580, 520, 560], duration: 1.5, oscillatorType: 'triangle', gainPattern: 'tremolo' },
  { name: 'Sandhill Crane', frequencies: [400, 500, 450, 550, 420], duration: 1.8, oscillatorType: 'sawtooth', gainPattern: 'fade' },
  { name: 'Peacock', frequencies: [1200, 1500, 1350, 1600, 1100], duration: 1.2, oscillatorType: 'sawtooth', gainPattern: 'steady' },
  { name: 'Northern Mockingbird', frequencies: [1500, 1800, 1600, 2000, 1400], duration: 0.8, oscillatorType: 'triangle', gainPattern: 'pulse' },
  { name: 'Common Raven', frequencies: [300, 350, 280, 320, 290], duration: 0.6, oscillatorType: 'sawtooth', gainPattern: 'steady' },
  { name: 'Common Cuckoo', frequencies: [500, 400, 500, 400, 500], duration: 1.0, oscillatorType: 'sine', gainPattern: 'pulse' },
  
  // Primates
  { name: 'Gibbon', frequencies: [800, 1000, 900, 1200, 700], duration: 2.0, oscillatorType: 'sine', gainPattern: 'fade', pitchVariation: 0.25 },
  { name: 'Siamang', frequencies: [500, 700, 600, 800, 550], duration: 2.5, oscillatorType: 'sine', gainPattern: 'tremolo' },
  { name: 'Indri Lemur', frequencies: [600, 900, 750, 1000, 650], duration: 3.0, oscillatorType: 'sine', gainPattern: 'fade', pitchVariation: 0.2 },
  
  // Amphibians and reptiles
  { name: 'American Bullfrog', frequencies: [100, 120, 90, 110, 95], duration: 0.8, oscillatorType: 'sawtooth', gainPattern: 'pulse' },
  { name: 'Gray Tree Frog', frequencies: [400, 450, 380, 420, 390], duration: 1.0, oscillatorType: 'triangle', gainPattern: 'tremolo' },
  
  // Insects - Very high frequencies
  { name: 'Cicada', frequencies: [3000, 3200, 2800, 3100, 2900], duration: 2.0, oscillatorType: 'square', gainPattern: 'tremolo' },
  { name: 'Cricket', frequencies: [4000, 4200, 3800, 4100, 3900], duration: 0.5, oscillatorType: 'square', gainPattern: 'pulse' },
  { name: 'Katydid', frequencies: [3500, 3700, 3300, 3600, 3400], duration: 0.8, oscillatorType: 'square', gainPattern: 'pulse' },
];

export const useAnimalSounds = (enabled: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playRandomAnimalSound = useCallback(() => {
    if (!enabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      const animal = ANIMAL_SOUNDS[Math.floor(Math.random() * ANIMAL_SOUNDS.length)];
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.type = animal.oscillatorType;
      
      // Low-pass filter to make sounds more natural
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(animal.frequencies[0] * 2, ctx.currentTime);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      const duration = animal.duration;
      const startTime = ctx.currentTime;
      
      // Very soft volume (ambient background)
      const maxGain = 0.06;
      
      // Apply gain pattern
      switch (animal.gainPattern) {
        case 'fade':
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(maxGain, startTime + duration * 0.2);
          gainNode.gain.linearRampToValueAtTime(maxGain * 0.8, startTime + duration * 0.6);
          gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
          break;
        case 'pulse':
          gainNode.gain.setValueAtTime(0, startTime);
          for (let i = 0; i < 4; i++) {
            const pulseStart = startTime + (duration / 4) * i;
            gainNode.gain.linearRampToValueAtTime(maxGain, pulseStart + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, pulseStart + (duration / 4) * 0.9);
          }
          break;
        case 'tremolo':
          gainNode.gain.setValueAtTime(maxGain * 0.5, startTime);
          for (let i = 0; i < Math.floor(duration * 8); i++) {
            const t = startTime + i * 0.125;
            gainNode.gain.setValueAtTime(i % 2 === 0 ? maxGain : maxGain * 0.3, t);
          }
          gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
          break;
        case 'steady':
        default:
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(maxGain, startTime + 0.05);
          gainNode.gain.setValueAtTime(maxGain, startTime + duration - 0.1);
          gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      }

      // Apply frequency pattern with optional pitch variation
      const freqs = animal.frequencies;
      const pitchVar = animal.pitchVariation || 0;
      const segmentDuration = duration / freqs.length;
      
      freqs.forEach((freq, i) => {
        const variation = pitchVar ? (Math.random() - 0.5) * pitchVar * freq : 0;
        oscillator.frequency.linearRampToValueAtTime(
          freq + variation, 
          startTime + segmentDuration * (i + 1)
        );
      });
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (err) {
      console.log('Sound playback error:', err);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const scheduleNextSound = () => {
      const delay = 7000 + Math.random() * 8000; // 7-15 seconds
      intervalRef.current = setTimeout(() => {
        playRandomAnimalSound();
        scheduleNextSound();
      }, delay);
    };

    const initialDelay = 3000 + Math.random() * 5000;
    intervalRef.current = setTimeout(() => {
      playRandomAnimalSound();
      scheduleNextSound();
    }, initialDelay);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [enabled, playRandomAnimalSound]);

  return { playRandomAnimalSound };
};
