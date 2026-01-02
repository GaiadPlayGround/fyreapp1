import { useCallback, useRef, useState, useEffect } from 'react';

export interface VoiceOption {
  name: string;
  voice: SpeechSynthesisVoice | null;
  lang: string;
}

export const useVoiceCallout = () => {
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  // Load available voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      
      // Filter and sort voices to get best quality ones
      const qualityVoices = availableVoices
        .filter(v => v.lang.startsWith('en'))
        .sort((a, b) => {
          // Prefer Google, Microsoft, Apple voices
          const aScore = (a.name.includes('Google') ? 3 : 0) + 
                        (a.name.includes('Natural') ? 2 : 0) +
                        (a.name.includes('Enhanced') ? 2 : 0) +
                        (a.name.includes('Microsoft') ? 1 : 0);
          const bScore = (b.name.includes('Google') ? 3 : 0) + 
                        (b.name.includes('Natural') ? 2 : 0) +
                        (b.name.includes('Enhanced') ? 2 : 0) +
                        (b.name.includes('Microsoft') ? 1 : 0);
          return bScore - aScore;
        });

      const voiceOptions: VoiceOption[] = qualityVoices.slice(0, 10).map(v => ({
        name: v.name.replace('Google', '').replace('Microsoft', '').trim(),
        voice: v,
        lang: v.lang,
      }));

      // Add a default option
      if (voiceOptions.length === 0) {
        voiceOptions.push({
          name: 'Default',
          voice: null,
          lang: 'en-US',
        });
      }

      setVoices(voiceOptions);
      
      // Set default to first quality voice
      if (!selectedVoice && voiceOptions.length > 0) {
        setSelectedVoice(voiceOptions[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  const getSelectedVoiceObject = useCallback(() => {
    const voiceOption = voices.find(v => v.name === selectedVoice);
    return voiceOption?.voice || null;
  }, [voices, selectedVoice]);

  const speakSpeciesName = useCallback((name: string) => {
    if (!('speechSynthesis' in window)) {
      console.log('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    if (isSpeakingRef.current) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(name);
    utterance.rate = 0.85; // Slightly slower for better clarity
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    
    // Use selected voice
    const voice = getSelectedVoiceObject();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [getSelectedVoiceObject]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
  }, []);

  return { 
    speakSpeciesName, 
    stopSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice,
  };
};
