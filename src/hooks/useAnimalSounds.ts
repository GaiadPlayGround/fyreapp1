import { useEffect, useRef, useCallback } from 'react';

// Wildlife sounds from free sound libraries (placeholder URLs - replace with actual)
const WILDLIFE_SOUNDS = [
  // Bird calls
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',
];

export const useAnimalSounds = (enabled: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playRandomAnimalSound = useCallback(() => {
    if (!enabled) return;
    
    try {
      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Random animal-like frequencies
      const frequencies = [
        // Bird chirps (high frequency)
        [1200, 1400, 1600, 1800],
        // Frog croaks (mid frequency)
        [200, 250, 180, 220],
        // Insect buzzes (varied)
        [400, 450, 380, 420],
        // Mammal calls (lower)
        [150, 180, 120, 160],
      ];

      const animalType = Math.floor(Math.random() * frequencies.length);
      const freqs = frequencies[animalType];

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Very soft volume
      gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
      
      // Quick fade in
      gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      
      // Create animal-like pattern
      const duration = 0.3 + Math.random() * 0.4;
      oscillator.frequency.setValueAtTime(freqs[0], ctx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(freqs[1], ctx.currentTime + duration * 0.3);
      oscillator.frequency.linearRampToValueAtTime(freqs[2], ctx.currentTime + duration * 0.6);
      oscillator.frequency.linearRampToValueAtTime(freqs[3], ctx.currentTime + duration);
      
      // Fade out
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
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

    // Random interval between 7-15 seconds
    const scheduleNextSound = () => {
      const delay = 7000 + Math.random() * 8000; // 7-15 seconds
      intervalRef.current = setTimeout(() => {
        playRandomAnimalSound();
        scheduleNextSound();
      }, delay);
    };

    // Start scheduling after initial delay
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
