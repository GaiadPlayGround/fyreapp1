import { useState, useCallback, useRef } from 'react';

export interface ElevenLabsVoice {
  id: string;
  name: string;
  gender: 'male' | 'female';
}

// Reduced to 3 distinct voices with clear differentiation
export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', gender: 'female' }, // Soft female
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', gender: 'male' }, // Deep male
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', gender: 'female' }, // British female
];

export const useElevenLabsVoice = () => {
  const [selectedVoice, setSelectedVoice] = useState<string>(ELEVENLABS_VOICES[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef(false);

  // Browser TTS fallback
  const speakWithBrowserTTS = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    
    utterance.onstart = () => { isSpeakingRef.current = true; };
    utterance.onend = () => { isSpeakingRef.current = false; };
    utterance.onerror = () => { isSpeakingRef.current = false; };
    
    window.speechSynthesis.speak(utterance);
  }, []);

  const speakSpeciesName = useCallback(async (name: string) => {
    if (isSpeakingRef.current) return;
    
    // If already failed to ElevenLabs, use fallback immediately
    if (useFallback) {
      speakWithBrowserTTS(name);
      return;
    }

    setIsLoading(true);
    isSpeakingRef.current = true;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: name, voiceId: selectedVoice }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        isSpeakingRef.current = false;
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        isSpeakingRef.current = false;
        URL.revokeObjectURL(audioUrl);
        // Fallback to browser TTS on audio playback error
        speakWithBrowserTTS(name);
      };
      
      await audio.play();
    } catch (error) {
      console.error('ElevenLabs TTS error, using fallback:', error);
      setUseFallback(true);
      speakWithBrowserTTS(name);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVoice, useFallback, speakWithBrowserTTS]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
  }, []);

  return {
    speakSpeciesName,
    stopSpeaking,
    voices: ELEVENLABS_VOICES,
    selectedVoice,
    setSelectedVoice,
    isLoading,
    useFallback,
  };
};