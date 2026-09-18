export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private settings: AudioSettings = {
    masterVolume: 0.8,
    musicVolume: 0.7,
    sfxVolume: 0.9,
  };

  private masterGainNode: GainNode | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;

  private isAmbientPlaying: boolean = false;
  private ambientOscillators: OscillatorNode[] = [];

  constructor() {
    this.initAudioContextOnUserGesture();
  }

  private initAudioContextOnUserGesture(): void {
    const unlockAudio = () => {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();

          this.masterGainNode = this.audioCtx.createGain();
          this.musicGainNode = this.audioCtx.createGain();
          this.sfxGainNode = this.audioCtx.createGain();

          this.masterGainNode.gain.value = this.settings.masterVolume;
          this.musicGainNode.gain.value = this.settings.musicVolume;
          this.sfxGainNode.gain.value = this.settings.sfxVolume;

          this.musicGainNode.connect(this.masterGainNode);
          this.sfxGainNode.connect(this.masterGainNode);
          this.masterGainNode.connect(this.audioCtx.destination);
        }
      } else if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
  }

  public updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    if (this.masterGainNode && this.settings.masterVolume !== undefined) {
      this.masterGainNode.gain.value = this.settings.masterVolume;
    }
    if (this.musicGainNode && this.settings.musicVolume !== undefined) {
      this.musicGainNode.gain.value = this.settings.musicVolume;
    }
    if (this.sfxGainNode && this.settings.sfxVolume !== undefined) {
      this.sfxGainNode.gain.value = this.settings.sfxVolume;
    }
  }

  /**
   * Genera un fondo musical/místico procedimental atmosférico para mitología griega.
   */
  public startAmbientMythMusic(mood: 'mysterious' | 'temple' | 'danger' = 'mysterious'): void {
    if (!this.audioCtx || !this.musicGainNode) return;
    this.stopAmbientMythMusic();

    this.isAmbientPlaying = true;
    const now = this.audioCtx.currentTime;

    // Frecuencias para drones armónicos antiguos griegos (Dorian mode D)
    let baseFreqs = [73.42, 110.00, 146.83, 220.00]; // D2, A2, D3, A3
    if (mood === 'danger') {
      baseFreqs = [65.41, 92.50, 130.81, 185.00]; // C2, F#2, C3, F#3 (Tritono)
    } else if (mood === 'temple') {
      baseFreqs = [82.41, 123.47, 164.81, 246.94]; // E2, B2, E3, B3
    }

    baseFreqs.forEach((freq, idx) => {
      if (!this.audioCtx || !this.musicGainNode) return;
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // LFO para oscilación atmosférica de viento/misticismo
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.1 + idx * 0.05, now);
      lfoGain.gain.setValueAtTime(0.15, now);

      lfo.connect(oscGain.gain);
      lfo.start(now);

      oscGain.gain.setValueAtTime(0.08, now);
      osc.connect(oscGain);
      oscGain.connect(this.musicGainNode);

      osc.start(now);
      this.ambientOscillators.push(osc, lfo);
    });
  }

  public stopAmbientMythMusic(): void {
    this.ambientOscillators.forEach(osc => {
      try { osc.stop(); } catch(e){}
    });
    this.ambientOscillators = [];
    this.isAmbientPlaying = false;
  }

  /**
   * Efecto de sonido sintético para interacción o pistas descubiertas.
   */
  public playSFX(type: 'clue' | 'footstep' | 'whisper' | 'puzzle_solve' | 'interact'): void {
    if (!this.audioCtx || !this.sfxGainNode) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    if (type === 'clue') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.4); // C6
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      osc.start(now);
      osc.stop(now + 0.6);

    } else if (type === 'interact') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      osc.start(now);
      osc.stop(now + 0.2);

    } else if (type === 'puzzle_solve') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.setValueAtTime(440.00, now + 0.15); // A4
      osc.frequency.setValueAtTime(659.25, now + 0.3); // E5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      osc.start(now);
      osc.stop(now + 0.8);

    } else if (type === 'footstep') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      osc.start(now);
      osc.stop(now + 0.09);

    } else if (type === 'whisper') {
      // Ruido filtrado sobrenatural de Medusa
      const bufferSize = this.audioCtx.sampleRate * 0.5;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(5, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGainNode);

      noise.start(now);
      noise.stop(now + 0.5);
    }
  }
}
