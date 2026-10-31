/**
 * Procedural Web Audio Engine for Subject 67 Horror Game
 * Zero external file dependencies - 100% synthetic realistic horror SFX
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private alarmOsc: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;
  private alarmActive: boolean = false;
  private heartbeatTimer: number | null = null;
  private lastFootstepTime: number = 0;

  constructor() {
    // Initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.startAmbience();
    } catch {
      console.warn('AudioContext not supported');
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  private startAmbience() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Deep subterranean rumble (30-65Hz combined drones)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(38, ctx.currentTime);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(55, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, ctx.currentTime);
    this.ambientFilter = filter;

    // Brown noise for wind/ventilation air
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(180, ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.8, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.isMuted ? 0 : 0.18, ctx.currentTime);
    this.ambientGain = gain;

    osc1.connect(filter);
    osc2.connect(filter);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(gain);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    noiseSource.start();
  }

  public playFootstep(isSprinting: boolean = false, isCrouching: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    const now = performance.now();
    const interval = isSprinting ? 280 : isCrouching ? 550 : 420;
    if (now - this.lastFootstepTime < interval) return;
    this.lastFootstepTime = now;

    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    const baseFreq = 70 + Math.random() * 25;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.09);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isSprinting ? 400 : 250, ctx.currentTime);

    const vol = isCrouching ? 0.04 : isSprinting ? 0.22 : 0.12;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    // Subtle concrete scuff noise
    const noiseLen = 0.04;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseLen), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.4, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noiseLen);

    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  public playFlashlightClick() {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  public playPickup() {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // 2-tone melodic harmonic chime
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.12, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.45);
    });
  }

  public playDoorSlide() {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Pneumatic hiss + heavy metallic motor
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.6);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  public playHeartbeat(bpm: number, intensity: number) {
    if (!this.ctx || this.isMuted || intensity <= 0.05) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Double thump (lub-dub)
    const playThump = (offset: number, freq: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + offset);
      osc.frequency.exponentialRampToValueAtTime(30, now + offset + 0.12);

      gain.gain.setValueAtTime(vol * Math.min(1.0, intensity), now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    };

    playThump(0, 75, 0.28);
    playThump(0.14, 62, 0.22);
  }

  public playCreatureRoar(distanceRatio: number) {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const vol = Math.max(0.05, Math.min(0.4, (1 - distanceRatio) * 0.4));

    // Bloodcurdling screech / growl using modulated oscillators
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const masterGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(160, now);
    carrier.frequency.exponentialRampToValueAtTime(480, now + 0.4);
    carrier.frequency.exponentialRampToValueAtTime(90, now + 1.2);

    modulator.type = 'square';
    modulator.frequency.setValueAtTime(45, now);
    modulator.frequency.linearRampToValueAtTime(120, now + 0.8);

    modGain.gain.setValueAtTime(250, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.Q.setValueAtTime(3.0, now);

    masterGain.gain.setValueAtTime(vol * 0.6, now);
    masterGain.gain.exponentialRampToValueAtTime(vol, now + 0.3);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + 1.4);
    modulator.stop(now + 1.4);
  }

  public playMonsterStomp(distanceRatio: number) {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const vol = Math.max(0.02, Math.min(0.35, (1 - distanceRatio) * 0.35));

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(50, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.18);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playJumpscare() {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Dissonant sharp horror sting
    [220, 233.08, 311.13, 440, 466.16, 622.25].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.0);
    });
  }

  public startDestructionAlarm() {
    if (!this.ctx || this.alarmActive) return;
    this.alarmActive = true;
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';

    // Repeating siren sweep
    const sweep = () => {
      if (!this.alarmActive || !this.ctx) return;
      const t = this.ctx.currentTime;
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.linearRampToValueAtTime(900, t + 0.6);
      osc.frequency.linearRampToValueAtTime(450, t + 1.2);
      setTimeout(sweep, 1200);
    };

    gain.gain.setValueAtTime(this.isMuted ? 0 : 0.18, ctx.currentTime);
    this.alarmGain = gain;
    this.alarmOsc = osc;

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    sweep();
  }

  public stopDestructionAlarm() {
    this.alarmActive = false;
    if (this.alarmOsc) {
      try {
        this.alarmOsc.stop();
        this.alarmOsc.disconnect();
      } catch {
        // Ignored
      }
      this.alarmOsc = null;
    }
  }

  public playExplosion(intensity: number = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Sub-bass thump
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(22, now + 0.8);
    oscGain.gain.setValueAtTime(0.35 * intensity, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    // Rumble blast noise
    const bufferSize = Math.floor(ctx.sampleRate * 1.5);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.1;
      b2 = 0.85 * b2 + white * 0.2;
      output[i] = (b0 + b1 + b2) * 0.5;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4 * intensity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    noiseSource.start(now);
    osc.stop(now + 1.3);
  }

  public playConsoleBeep() {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }
}

export const soundEngine = new SoundEngine();
