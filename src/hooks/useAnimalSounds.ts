import { useEffect, useRef, useCallback } from 'react';

// Nature sounds: birds, wildlife, and flowing streams
interface NatureSound {
  name: string;
  frequencies: number[];
  duration: number;
  oscillatorType: OscillatorType;
  gainPattern: 'fade' | 'pulse' | 'tremolo' | 'steady' | 'stream';
  pitchVariation?: number;
}

const NATURE_SOUNDS: NatureSound[] = [
  // Birds - various chirps and calls
  { name: 'Robin Song', frequencies: [2200, 2600, 2400, 2800, 2300], duration: 0.8, oscillatorType: 'sine', gainPattern: 'pulse', pitchVariation: 0.1 },
  { name: 'Sparrow Chirp', frequencies: [3000, 3200, 2900, 3100, 3000], duration: 0.4, oscillatorType: 'triangle', gainPattern: 'pulse' },
  { name: 'Warbler Trill', frequencies: [2500, 2800, 2600, 2900, 2700], duration: 1.2, oscillatorType: 'sine', gainPattern: 'tremolo', pitchVariation: 0.15 },
  { name: 'Cardinal Call', frequencies: [1800, 2000, 1900, 2100, 1850], duration: 0.6, oscillatorType: 'sine', gainPattern: 'fade' },
  { name: 'Finch Song', frequencies: [2800, 3000, 2700, 2900, 2750], duration: 1.0, oscillatorType: 'triangle', gainPattern: 'pulse', pitchVariation: 0.1 },
  { name: 'Thrush Melody', frequencies: [1500, 1800, 1600, 1900, 1700], duration: 1.5, oscillatorType: 'sine', gainPattern: 'fade', pitchVariation: 0.2 },
  { name: 'Wren Chatter', frequencies: [3200, 3500, 3300, 3600, 3400], duration: 0.5, oscillatorType: 'triangle', gainPattern: 'tremolo' },
  { name: 'Dove Coo', frequencies: [400, 350, 380, 340, 360], duration: 1.0, oscillatorType: 'sine', gainPattern: 'fade' },
  { name: 'Owl Hoot', frequencies: [350, 300, 320, 280, 310], duration: 0.8, oscillatorType: 'sine', gainPattern: 'steady' },
  { name: 'Nightingale', frequencies: [2000, 2400, 2200, 2600, 2100], duration: 2.0, oscillatorType: 'sine', gainPattern: 'fade', pitchVariation: 0.25 },
  
  // Flowing water/stream sounds - low frequency with tremolo
  { name: 'Stream Flow', frequencies: [80, 100, 90, 120, 85], duration: 3.0, oscillatorType: 'sine', gainPattern: 'stream', pitchVariation: 0.3 },
  { name: 'Babbling Brook', frequencies: [150, 180, 160, 200, 170], duration: 2.5, oscillatorType: 'triangle', gainPattern: 'stream', pitchVariation: 0.2 },
  { name: 'Waterfall Mist', frequencies: [60, 80, 70, 100, 75], duration: 2.0, oscillatorType: 'sine', gainPattern: 'stream' },
  
  // Wildlife ambient
  { name: 'Crickets', frequencies: [4000, 4200, 3800, 4100, 3900], duration: 1.5, oscillatorType: 'square', gainPattern: 'tremolo' },
  { name: 'Cicada Drone', frequencies: [3000, 3200, 2800, 3100, 2900], duration: 2.0, oscillatorType: 'sawtooth', gainPattern: 'tremolo' },
  { name: 'Frog Chorus', frequencies: [200, 250, 180, 220, 190], duration: 0.8, oscillatorType: 'triangle', gainPattern: 'pulse' },
  { name: 'Wind Through Trees', frequencies: [100, 150, 120, 180, 130], duration: 3.0, oscillatorType: 'sine', gainPattern: 'stream', pitchVariation: 0.4 },
  { name: 'Rustling Leaves', frequencies: [2000, 2500, 2200, 2800, 2300], duration: 1.5, oscillatorType: 'triangle', gainPattern: 'tremolo', pitchVariation: 0.3 },
];

export const useAnimalSounds = (enabled: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playRandomNatureSound = useCallback(() => {
    if (!enabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      const sound = NATURE_SOUNDS[Math.floor(Math.random() * NATURE_SOUNDS.length)];
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.type = sound.oscillatorType;
      
      // Low-pass filter to make sounds more natural
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(sound.frequencies[0] * 2, ctx.currentTime);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      const duration = sound.duration;
      const startTime = ctx.currentTime;
      
      // Very soft volume (ambient background)
      const maxGain = 0.05;
      
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
        case 'stream':
          // Flowing water effect - gentle, continuous with slight variation
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(maxGain * 0.6, startTime + duration * 0.1);
          for (let i = 0; i < Math.floor(duration * 4); i++) {
            const t = startTime + duration * 0.1 + i * 0.25;
            const variation = 0.4 + Math.random() * 0.6;
            gainNode.gain.linearRampToValueAtTime(maxGain * variation, t);
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
      const delay = 7000 + Math.random() * 8000; // 7-15 seconds
      intervalRef.current = setTimeout(() => {
        playRandomNatureSound();
        scheduleNextSound();
      }, delay);
    };

    const initialDelay = 3000 + Math.random() * 5000;
    intervalRef.current = setTimeout(() => {
      playRandomNatureSound();
      scheduleNextSound();
    }, initialDelay);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [enabled, playRandomNatureSound]);

  return { playRandomNatureSound };
};
