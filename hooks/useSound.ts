import { useCallback, useRef, useEffect } from 'react';

/**
 * useSound Hook (Web Audio API Version)
 * 
 * Replaces unreliable external MP3 URLs with on-the-fly synthesized sounds.
 * This guarantees audio playback without network latency or CORS issues.
 * The sounds are designed to match the "Q-Version/Cute" aesthetic (soft sine waves, bubbles).
 */
export const useSound = () => {
  // Store the AudioContext in a ref so it persists across renders
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext lazily or on mount
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtxRef.current = new AudioContextClass();
    }
    
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  const play = useCallback((type: 'pop' | 'success' | 'grab' | 'drop' | 'delete' | 'open' | 'finish' | 'note') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    // Critical: Browsers suspend AudioContext until the first user interaction.
    // We resume it here inside the event handler (click/drag) to ensure it plays.
    if (ctx.state === 'suspended') {
      ctx.resume().catch((err) => console.warn('AudioContext resume failed', err));
    }

    const t = ctx.currentTime;
    
    // Helper to create basic tone
    const createOsc = (
      waveform: OscillatorType, 
      freqStart: number, 
      freqEnd: number | null,
      dur: number, 
      vol: number,
      delay: number = 0
    ) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = waveform;
        osc.connect(gain);
        gain.connect(ctx.destination);

        // Frequency
        osc.frequency.setValueAtTime(freqStart, t + delay);
        if (freqEnd) {
            osc.frequency.exponentialRampToValueAtTime(freqEnd, t + delay + dur);
        }

        // Volume Envelope (Attack -> Decay)
        gain.gain.setValueAtTime(0, t + delay);
        gain.gain.linearRampToValueAtTime(vol, t + delay + (dur * 0.1)); // fast attack
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + dur); // decay

        osc.start(t + delay);
        osc.stop(t + delay + dur);
    };

    switch (type) {
      case 'pop':
        // Bubble Pop: Quick pitch drop sine wave
        createOsc('sine', 800, 100, 0.15, 0.1);
        break;

      case 'finish':
        // Magical "Level Up" Sparkle (Cute & Inspiring)
        // Rapid ascending arpeggio: C5 -> E5 -> G5 -> C6
        createOsc('sine', 523.25, null, 0.1, 0.05, 0);    // C5
        createOsc('sine', 659.25, null, 0.1, 0.05, 0.06); // E5
        createOsc('sine', 783.99, null, 0.1, 0.05, 0.12); // G5
        createOsc('sine', 1046.50, null, 0.5, 0.08, 0.18); // C6 (Longer sustain)
        
        // Add a subtle high sparkle
        createOsc('triangle', 2093.00, 2000, 0.3, 0.02, 0.18); 
        break;

      case 'success':
        // Happy Chime: Major 3rd interval
        createOsc('sine', 523.25, null, 0.3, 0.05, 0); // C5
        createOsc('sine', 659.25, null, 0.4, 0.05, 0.1); // E5
        break;

      case 'grab':
        // High Blip: Short high freq
        createOsc('sine', 1000, 1200, 0.08, 0.05);
        break;

      case 'drop':
        // Soft Thud: Low frequency
        createOsc('triangle', 200, 50, 0.1, 0.1);
        break;
        
      case 'note':
        // Paper stick sound / High tick
        createOsc('square', 800, 1200, 0.03, 0.03);
        break;

      case 'delete':
        // Retro Power Down
        createOsc('sawtooth', 300, 50, 0.2, 0.03);
        break;

      case 'open':
        // Whoosh
        createOsc('sine', 400, 800, 0.2, 0.03);
        break;
    }
  }, []);

  return { play };
};