import { BgmStyle } from '../types/recap';

class CinematicAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlayingBgm = false;
  private bgmNodes: { stop: () => void } | null = null;

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Generates a procedural cinematic background music layer (Ambient suspense drone + melodic chords)
   */
  public startBgm(style: BgmStyle, volumePercent: number = 40): void {
    this.stopBgm();
    const ctx = this.getAudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime((volumePercent / 100) * 0.25, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const activeOscillators: OscillatorNode[] = [];

    // Frequency themes depending on chosen movie recap mood
    let baseFreq = 55; // A1
    let chordFreqs = [110, 164.81, 196, 220]; // Am chords

    if (style === 'action') {
      baseFreq = 65.41; // C2
      chordFreqs = [130.81, 155.56, 196.0, 246.94];
    } else if (style === 'drama') {
      baseFreq = 48.99; // G1
      chordFreqs = [97.99, 146.83, 174.61, 220.0];
    } else if (style === 'mystery') {
      baseFreq = 41.2; // E1
      chordFreqs = [82.41, 123.47, 164.81, 207.65];
    } else if (style === 'chill') {
      baseFreq = 73.42; // D2
      chordFreqs = [146.83, 185.0, 220.0, 261.63];
    }

    // 1. Sub-bass drone
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

    // Filter to give deep rumble
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, ctx.currentTime);

    bassOsc.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start();
    activeOscillators.push(bassOsc);

    // 2. Slow pulsating harmonic pads
    const padOsc1 = ctx.createOscillator();
    const padGain1 = ctx.createGain();
    padOsc1.type = 'sine';
    padOsc1.frequency.setValueAtTime(chordFreqs[0], ctx.currentTime);

    // LFO modulation for pulse
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // slow pulse
    lfoGain.gain.setValueAtTime(0.15, ctx.currentTime);
    lfo.connect(padGain1.gain);
    lfo.start();
    activeOscillators.push(lfo);

    padOsc1.connect(padGain1);
    padGain1.connect(masterGain);
    padOsc1.start();
    activeOscillators.push(padOsc1);

    // 3. High ambient shimmer
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = 'triangle';
    shimmerOsc.frequency.setValueAtTime(chordFreqs[2], ctx.currentTime);
    shimmerGain.gain.setValueAtTime(0.08, ctx.currentTime);
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmerOsc.start();
    activeOscillators.push(shimmerOsc);

    this.isPlayingBgm = true;
    this.bgmNodes = {
      stop: () => {
        try {
          masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
          setTimeout(() => {
            activeOscillators.forEach((osc) => {
              try {
                osc.stop();
                osc.disconnect();
              } catch (_) {}
            });
            masterGain.disconnect();
          }, 350);
        } catch (_) {}
      },
    };
  }

  public stopBgm(): void {
    if (this.bgmNodes) {
      this.bgmNodes.stop();
      this.bgmNodes = null;
    }
    this.isPlayingBgm = false;
  }

  public getIsPlayingBgm(): boolean {
    return this.isPlayingBgm;
  }

  /**
   * Render synthesized BGM into an AudioBuffer for offline video exporting
   */
  public async renderBgmBuffer(style: BgmStyle, durationSeconds: number, volumePercent: number): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const length = Math.ceil(sampleRate * Math.max(1, durationSeconds));
    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime((volumePercent / 100) * 0.28, 0);
    masterGain.connect(offlineCtx.destination);

    let baseFreq = 55;
    let chordFreqs = [110, 164.81, 196, 220];
    if (style === 'action') {
      baseFreq = 65.41;
      chordFreqs = [130.81, 155.56, 196.0, 246.94];
    } else if (style === 'drama') {
      baseFreq = 48.99;
      chordFreqs = [97.99, 146.83, 174.61, 220.0];
    } else if (style === 'mystery') {
      baseFreq = 41.2;
      chordFreqs = [82.41, 123.47, 164.81, 207.65];
    } else if (style === 'chill') {
      baseFreq = 73.42;
      chordFreqs = [146.83, 185.0, 220.0, 261.63];
    }

    const bassOsc = offlineCtx.createOscillator();
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(baseFreq, 0);
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, 0);
    bassOsc.connect(filter);
    filter.connect(masterGain);
    bassOsc.start(0);
    bassOsc.stop(durationSeconds);

    const padOsc = offlineCtx.createOscillator();
    padOsc.type = 'sine';
    padOsc.frequency.setValueAtTime(chordFreqs[0], 0);
    padOsc.connect(masterGain);
    padOsc.start(0);
    padOsc.stop(durationSeconds);

    return await offlineCtx.startRendering();
  }

  /**
   * Speak text using Web Speech API with fallback
   */
  public speakText(
    text: string,
    lang: string = 'my-MM',
    rate: number = 1.0,
    onEnd?: () => void
  ): { cancel: () => void } {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return { cancel: () => {} };
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.7, Math.min(1.5, rate));
    utterance.pitch = 0.95; // Slightly deeper cinematic pitch

    // Check available voices for Burmese or fallback to general regional voice
    const voices = window.speechSynthesis.getVoices();
    const burmeseVoice = voices.find(
      (v) => v.lang.startsWith('my') || v.name.toLowerCase().includes('burmese') || v.name.toLowerCase().includes('myanmar')
    );
    const fallbackVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];

    if (lang === 'my-MM' && burmeseVoice) {
      utterance.voice = burmeseVoice;
      utterance.lang = 'my-MM';
    } else if (fallbackVoice) {
      utterance.voice = fallbackVoice;
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
    return {
      cancel: () => {
        window.speechSynthesis.cancel();
      },
    };
  }

  public pauseSpeech(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  public resumeSpeech(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }

  public stopSpeech(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }
}

export const audioEngine = new CinematicAudioEngine();
