import { useEffect, useRef, useCallback } from 'react';

// Wildlife sounds: birds, nature, flowing streams - high quality ambient soundscapes
interface WildlifeSound {
  name: string;
  frequencies: number[];
  duration: number;
  oscillatorType: OscillatorType;
  gainPattern: 'fade' | 'pulse' | 'tremolo' | 'steady' | 'chirp';
  pitchVariation?: number;
}

const WILDLIFE_SOUNDS: WildlifeSound[] = [
  // Birds - melodic calls
  { name: 'Songbird Morning', frequencies: [1800, 2200, 2000, 2400, 1900], duration: 1.2, oscillatorType: 'sine', gainPattern: 'chirp', pitchVariation: 0.15 },
  { name: 'Robin Call', frequencies: [1500, 1700, 1600, 1800, 1550], duration: 0.8, oscillatorType: 'triangle', gainPattern: 'pulse' },
  { name: 'Warbler Song', frequencies: [2500, 2800, 2600, 3000, 2400], duration: 1.5, oscillatorType: 'sine', gainPattern: 'tremolo', pitchVariation: 0.2 },
  { name: 'Meadowlark', frequencies: [1200, 1600, 1400, 1800, 1100], duration: 2.0, oscillatorType: 'sine', gainPattern: 'fade', pitchVariation: 0.18 },
  { name: 'Finch Chirp', frequencies: [3000, 3500, 3200, 3800, 2900], duration: 0.6, oscillatorType: 'triangle', gainPattern: 'chirp' },
  { name: 'Wren Trill', frequencies: [2200, 2600, 2400, 2800, 2100], duration: 1.0, oscillatorType: 'sine', gainPattern: 'tremolo', pitchVariation: 0.12 },
  { name: 'Cardinal Song', frequencies: [1400, 1100, 1300, 900, 1500], duration: 1.8, oscillatorType: 'sine', gainPattern: 'fade', pitchVariation: 0.1 },
  { name: 'Sparrow Chatter', frequencies: [2800, 3100, 2900, 3300, 2700], duration: 0.5, oscillatorType: 'triangle', gainPattern: 'pulse' },
  
  // Nature/Forest ambience
  { name: 'Wind Through Leaves', frequencies: [200, 180, 220, 160, 190], duration: 3.0, oscillatorType: 'sine', gainPattern: 'fade', pitchVariation: 0.3 },
  { name: 'Forest Rustle', frequencies: [150, 120, 180, 100, 160], duration: 2.5, oscillatorType: 'sine', gainPattern: 'tremolo' },
  { name: 'Gentle Breeze', frequencies: [80, 100, 90, 110, 85], duration: 4.0, oscillatorType: 'sine', gainPattern: 'steady' },
  
  // Water/Stream sounds
  { name: 'Flowing Stream', frequencies: [400, 500, 450, 550, 420], duration: 3.5, oscillatorType: 'sine', gainPattern: 'tremolo', pitchVariation: 0.25 },
  { name: 'Babbling Brook', frequencies: [600, 800, 700, 900, 650], duration: 2.0, oscillatorType: 'sine', gainPattern: 'pulse', pitchVariation: 0.2 },
  { name: 'Water Drops', frequencies: [1000, 1200, 1100, 1300, 950], duration: 0.4, oscillatorType: 'sine', gainPattern: 'fade' },
  { name: 'Gentle Waterfall', frequencies: [300, 400, 350, 450, 320], duration: 4.0, oscillatorType: 'sine', gainPattern: 'steady', pitchVariation: 0.15 },
  
  // Insects - ambient
  { name: 'Cricket Evening', frequencies: [4500, 4700, 4400, 4600, 4550], duration: 0.3, oscillatorType: 'square', gainPattern: 'pulse' },
  { name: 'Cicada Drone', frequencies: [3200, 3400, 3100, 3300, 3250], duration: 2.5, oscillatorType: 'sawtooth', gainPattern: 'tremolo' },
];

export const useAnimalSounds = (enabled: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playRandomWildlifeSound = useCallback(() => {
    if (!enabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      const sound = WILDLIFE_SOUNDS[Math.floor(Math.random() * WILDLIFE_SOUNDS.length)];
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.type = sound.oscillatorType;
      
      // Bandpass filter for more natural sound
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(sound.frequencies[0], ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      const duration = sound.duration;
      const startTime = ctx.currentTime;
      
      // Soft ambient volume
      const maxGain = 0.04;
      
      // Apply gain pattern
      switch (sound.gainPattern) {
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
            gainNode.gain.linearRampToValueAtTime(maxGain, pulseStart + 0.03);
            gainNode.gain.linearRampToValueAtTime(0, pulseStart + (duration / 4) * 0.8);
          }
          break;
        case 'tremolo':
          gainNode.gain.setValueAtTime(maxGain * 0.5, startTime);
          for (let i = 0; i < Math.floor(duration * 10); i++) {
            const t = startTime + i * 0.1;
            gainNode.gain.setValueAtTime(i % 2 === 0 ? maxGain : maxGain * 0.3, t);
          }
          gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
          break;
        case 'chirp':
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(maxGain, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          break;
        case 'steady':
        default:
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(maxGain, startTime + 0.1);
          gainNode.gain.setValueAtTime(maxGain, startTime + duration - 0.2);
          gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      }

      // Apply frequency pattern with pitch variation
      const freqs = sound.frequencies;
      const pitchVar = sound.pitchVariation || 0;
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
      const delay = 8000 + Math.random() * 10000; // 8-18 seconds
      intervalRef.current = setTimeout(() => {
        playRandomWildlifeSound();
        scheduleNextSound();
      }, delay);
    };

    const initialDelay = 4000 + Math.random() * 6000;
    intervalRef.current = setTimeout(() => {
      playRandomWildlifeSound();
      scheduleNextSound();
    }, initialDelay);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [enabled, playRandomWildlifeSound]);

  return { playRandomAnimalSound: playRandomWildlifeSound };
};
