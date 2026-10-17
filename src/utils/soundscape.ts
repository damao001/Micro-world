import { ToolId, WorldState } from '../types/world';

/**
 * Procedural Web Audio API Soundscape & Multi-Element White Noise Engine.
 * Each world element type (trees, seas/boats, rain/snow clouds, campfires, windmills,
 * cottages, sheep, birds, night crickets) contributes a distinct acoustic layer that
 * blends into a cohesive, soothing terrarium white-noise soundscape.
 */
export class PocketWorldSoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Continuous ambient white/pink/brown noise layer gains
  private windGain: GainNode | null = null;
  private oceanGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private fireWarmthGain: GainNode | null = null;
  private nightPadGain: GainNode | null = null;

  private isEnabled: boolean = (() => {
    try {
      const saved = localStorage.getItem('pocket_world_audio_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  })();
  private isInitialized = false;
  private microEventTimer: number | null = null;
  private crackleTimer: number | null = null;
  private crackleBuffer: AudioBuffer | null = null;

  private latestState: WorldState | null = null;
  private campfireCount = 2;

  public isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean): boolean {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('pocket_world_audio_enabled', String(enabled));
    } catch {
      // ignore storage errors
    }
    if (enabled) {
      this.ensureInitialized();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.applyLayerTargets();
    } else if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.0001, now, 0.25);
    }
    return this.isEnabled;
  }

  public toggle(): boolean {
    return this.setEnabled(!this.isEnabled);
  }

  /**
   * Called on user pointer/touch interaction so Web Audio unlocks seamlessly.
   */
  public unlockOnInteraction() {
    if (!this.isEnabled) return;
    if (this.isInitialized && this.ctx && this.ctx.state === 'running') {
      return;
    }
    try {
      this.ensureInitialized();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.applyLayerTargets();
    } catch {
      // Ignore mobile WebView audio unlock restrictions
    }
  }

  public updateWorldState(state: WorldState, campfires = 2) {
    this.latestState = state;
    this.campfireCount = campfires;
    if (this.isInitialized && this.isEnabled) {
      this.applyLayerTargets();
    }
  }

  private ensureInitialized() {
    if (this.isInitialized) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.001;
    master.connect(ctx.destination);
    this.masterGain = master;

    // 1. Pink Noise Buffer (for Wind in Trees & Rain Patter)
    const pinkBuffer = this.createPinkNoiseBuffer(ctx, 4.0);
    // 2. Brown Noise Buffer (for Ocean Waves & Campfire Warmth)
    const brownBuffer = this.createBrownNoiseBuffer(ctx, 4.5);
    // 3. Reusable Campfire Crackle Buffer (avoids per-crackle heap allocation)
    const crackleLen = Math.ceil(ctx.sampleRate * 0.032);
    const crackleBuf = ctx.createBuffer(1, crackleLen, ctx.sampleRate);
    const crackleData = crackleBuf.getChannelData(0);
    for (let i = 0; i < crackleLen; i++) {
      crackleData[i] =
        (Math.random() * 2 - 1) * Math.exp(-i / (crackleLen * 0.32));
    }
    this.crackleBuffer = crackleBuf;

    // --- Layer A: Forest Breeze & Windmills (Pink Noise + Slow LFO Bandpass) ---
    const windSource = ctx.createBufferSource();
    windSource.buffer = pinkBuffer;
    windSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 380;
    windFilter.Q.value = 1.4;

    const windLfo = ctx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.14; // 7-second gentle breeze cycle
    const windLfoGain = ctx.createGain();
    windLfoGain.gain.value = 160;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);

    const windGain = ctx.createGain();
    windGain.gain.value = 0.08;

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);
    windSource.start();
    windLfo.start();
    this.windGain = windGain;

    // --- Layer B: Coastal Waves & Turquoise Sea (Brown Noise + Wave Swell LFO) ---
    const oceanSource = ctx.createBufferSource();
    oceanSource.buffer = brownBuffer;
    oceanSource.loop = true;

    const oceanFilter = ctx.createBiquadFilter();
    oceanFilter.type = 'lowpass';
    oceanFilter.frequency.value = 280;

    const oceanLfo = ctx.createOscillator();
    oceanLfo.type = 'sine';
    oceanLfo.frequency.value = 0.11; // ~9-second wave interval
    const oceanLfoGain = ctx.createGain();
    oceanLfoGain.gain.value = 140;
    oceanLfo.connect(oceanLfoGain);
    oceanLfoGain.connect(oceanFilter.frequency);

    const oceanGain = ctx.createGain();
    oceanGain.gain.value = 0.12;

    oceanSource.connect(oceanFilter);
    oceanFilter.connect(oceanGain);
    oceanGain.connect(master);
    oceanSource.start();
    oceanLfo.start();
    this.oceanGain = oceanGain;

    // --- Layer C: Gentle Rain & Cloud Patter (Filtered Pink/White Noise) ---
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = pinkBuffer;
    rainSource.loop = true;

    const rainHighpass = ctx.createBiquadFilter();
    rainHighpass.type = 'highpass';
    rainHighpass.frequency.value = 950;

    const rainLowpass = ctx.createBiquadFilter();
    rainLowpass.type = 'lowpass';
    rainLowpass.frequency.value = 3200;

    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.04;

    rainSource.connect(rainHighpass);
    rainHighpass.connect(rainLowpass);
    rainLowpass.connect(rainGain);
    rainGain.connect(master);
    rainSource.start();
    this.rainGain = rainGain;

    // --- Layer D: Cozy Campfire Warmth (Low Hearth Hum) ---
    const fireSource = ctx.createBufferSource();
    fireSource.buffer = brownBuffer;
    fireSource.loop = true;

    const fireFilter = ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.value = 160;

    const fireGain = ctx.createGain();
    fireGain.gain.value = 0.05;

    fireSource.connect(fireFilter);
    fireFilter.connect(fireGain);
    fireGain.connect(master);
    fireSource.start();
    this.fireWarmthGain = fireGain;

    // --- Layer E: Glass Orb Harmonic Drone (Warm C Major 9th Ethereal Pad) ---
    const padGain = ctx.createGain();
    padGain.gain.value = 0.018;
    padGain.connect(master);
    const padFreqs = [261.63, 329.63, 392.0, 493.88]; // C4, E4, G4, B4
    for (const freq of padFreqs) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.22;
      osc.connect(g);
      g.connect(padGain);
      osc.start();
    }
    this.nightPadGain = padGain;

    this.isInitialized = true;
    this.applyLayerTargets();

    // Periodic organic micro-events (birds, crickets, wind chimes, water droplets)
    this.microEventTimer = window.setInterval(() => {
      if (!this.isEnabled || !this.ctx || this.ctx.state !== 'running') return;
      this.triggerAmbientMicroEvent();
    }, 2100);

    // Periodic campfire ember crackles
    this.crackleTimer = window.setInterval(() => {
      if (!this.isEnabled || !this.ctx || this.ctx.state !== 'running') return;
      if (this.campfireCount > 0 && Math.random() < 0.72) {
        this.triggerCampfireCrackle();
      }
    }, 420);
  }

  private applyLayerTargets() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (!this.isEnabled) {
      this.masterGain.gain.setTargetAtTime(0.0001, now, 0.25);
      return;
    }

    this.masterGain.gain.setTargetAtTime(0.55, now, 0.5);

    const counts = this.latestState?.objectCounts ?? {
      houses: 10,
      trees: 24,
      windmills: 1,
      lighthouses: 2,
      villagers: 12,
      sheep: 8,
      clouds: 3,
      flowers: 5,
      boats: 3,
    };
    const tod = this.latestState?.timeOfDay ?? 0.24;
    const isNight = tod >= 0.48 || tod <= 0.12;

    // 1. Wind scales with trees & windmills
    if (this.windGain) {
      const windLevel = Math.min(
        0.22,
        0.03 + counts.trees * 0.0045 + counts.windmills * 0.025,
      );
      this.windGain.gain.setTargetAtTime(windLevel, now, 0.6);
    }

    // 2. Ocean waves scale with boats & coastal life
    if (this.oceanGain) {
      const oceanLevel = Math.min(0.24, 0.06 + counts.boats * 0.028);
      this.oceanGain.gain.setTargetAtTime(oceanLevel, now, 0.6);
    }

    // 3. Rain patter scales with clouds
    if (this.rainGain) {
      const rainLevel =
        counts.clouds > 0
          ? Math.min(0.18, 0.02 + counts.clouds * 0.026)
          : 0.002;
      this.rainGain.gain.setTargetAtTime(rainLevel, now, 0.6);
    }

    // 4. Campfire warmth scales with campfires (stronger at dusk/night)
    if (this.fireWarmthGain) {
      const nightBoost = isNight ? 1.45 : 1.0;
      const fireLevel = Math.min(
        0.2,
        this.campfireCount * 0.035 * nightBoost,
      );
      this.fireWarmthGain.gain.setTargetAtTime(fireLevel, now, 0.6);
    }

    // 5. Glass orb harmonic pad scales with houses/lighthouses & night mode
    if (this.nightPadGain) {
      const padLevel = isNight ? 0.032 : 0.014;
      this.nightPadGain.gain.setTargetAtTime(padLevel, now, 0.8);
    }
  }

  private triggerCampfireCrackle() {
    if (!this.ctx || !this.masterGain || !this.crackleBuffer) return;
    try {
      const now = this.ctx.currentTime;
      const dur = 0.018 + Math.random() * 0.014;

      const src = this.ctx.createBufferSource();
      src.buffer = this.crackleBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600 + Math.random() * 1800;
      filter.Q.value = 3.2;

      const gain = this.ctx.createGain();
      const intensity = Math.min(0.12, 0.025 * Math.sqrt(this.campfireCount));
      gain.gain.setValueAtTime(intensity, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + dur);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start(now);
    } catch {
      // ignore audio node errors
    }
  }

  private triggerAmbientMicroEvent() {
    if (!this.ctx || !this.masterGain || !this.latestState) return;
    const counts = this.latestState.objectCounts;
    const tod = this.latestState.timeOfDay;
    const isNight = tod >= 0.48 || tod <= 0.12;

    const roll = Math.random();
    if (!isNight && counts.trees > 2 && roll < 0.38) {
      // Daytime songbird chirp in the trees
      this.playBirdChirp();
    } else if (isNight && counts.trees > 0 && roll < 0.45) {
      // Nighttime cricket chorus trill
      this.playNightCricket();
    } else if (counts.boats > 0 && roll < 0.68) {
      // Gentle water droplet / ripples
      this.playWaterDroplet();
    } else if (counts.houses > 0 || counts.windmills > 0) {
      // Soft pentatonic wind chime from village cottages/windmills
      this.playWindChimeNote();
    }
  }

  private playBirdChirp() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const baseFreq = 1850 + Math.random() * 650;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.28, now + 0.065);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.94, now + 0.14);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.028, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  private playNightCricket() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const pulses = 3 + Math.floor(Math.random() * 2);

    for (let i = 0; i < pulses; i++) {
      const start = now + i * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 3880 + Math.random() * 140;

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.016, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.042);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.045);
    }
  }

  private playWaterDroplet() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const startFreq = 620 + Math.random() * 380;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.65, now + 0.09);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.032, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  private playWindChimeNote() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5 major pentatonic
    const freq = scale[Math.floor(Math.random() * scale.length)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.024, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.9);
  }

  /**
   * Plays a bespoke tactile & musical sound effect tailored to each of the 24 tools.
   */
  public playToolSound(tool: ToolId) {
    if (!this.isEnabled) return;
    this.unlockOnInteraction();
    if (!this.ctx || !this.masterGain) return;

    switch (tool) {
      case 'house':
      case 'watchtower':
      case 'lighthouse':
        // Warm wooden/stone marimba two-note chord
        this.playTone(392.0, 0.08, 0.28, 'triangle', 0);
        this.playTone(587.33, 0.07, 0.35, 'sine', 0.055);
        break;
      case 'windmill':
      case 'balloon':
        // Airy ascending fifth
        this.playTone(440.0, 0.06, 0.32, 'sine', 0);
        this.playTone(659.25, 0.06, 0.42, 'sine', 0.07);
        break;
      case 'campfire':
      case 'lantern':
        // Warm ember crackle + golden bell
        this.triggerCampfireCrackle();
        this.playTone(783.99, 0.05, 0.45, 'sine', 0.02);
        break;
      case 'sailboat':
      case 'dock':
      case 'duck':
      case 'lake':
      case 'lower':
        // Water droplet ripple + soothing aqua tone
        this.playWaterDroplet();
        this.playTone(523.25, 0.05, 0.3, 'sine', 0.04);
        break;
      case 'tree':
      case 'flower':
      case 'beehive':
        // Organic kalimba pluck + bird/bee harmonic
        this.playTone(587.33, 0.07, 0.25, 'triangle', 0);
        this.playTone(880.0, 0.05, 0.3, 'sine', 0.045);
        break;
      case 'villager':
      case 'sheep':
        // Cheerful double-hop greeting note
        this.playTone(659.25, 0.06, 0.16, 'triangle', 0);
        this.playTone(783.99, 0.06, 0.22, 'triangle', 0.08);
        break;
      case 'cloud':
      case 'snowcloud':
        // Soft crystal rain/snow shimmer
        this.playTone(1046.5, 0.045, 0.38, 'sine', 0);
        this.playTone(1318.5, 0.04, 0.42, 'sine', 0.06);
        break;
      case 'rainbow':
      case 'shootingstar':
        // Magical ascending celesta arpeggio
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
          this.playTone(f, 0.045, 0.45, 'sine', idx * 0.055);
        });
        break;
      case 'mountain':
      case 'raise':
        // Deep resonant earthen pulse
        this.playTone(196.0, 0.09, 0.28, 'triangle', 0);
        this.playTone(293.66, 0.06, 0.3, 'sine', 0.04);
        break;
      case 'remove':
        // Gentle descending brush sound
        this.playTone(493.88, 0.05, 0.15, 'sine', 0);
        this.playTone(329.63, 0.05, 0.2, 'sine', 0.05);
        break;
    }
  }

  private playTone(
    freq: number,
    peakGain: number,
    duration: number,
    type: OscillatorType,
    delay: number,
  ) {
    if (!this.ctx || !this.masterGain) return;
    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peakGain, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private createPinkNoiseBuffer(
    ctx: AudioContext,
    seconds: number,
  ): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private createBrownNoiseBuffer(
    ctx: AudioContext,
    seconds: number,
  ): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 0.18;
    }
    return buffer;
  }

  public dispose() {
    if (this.microEventTimer !== null) {
      window.clearInterval(this.microEventTimer);
      this.microEventTimer = null;
    }
    if (this.crackleTimer !== null) {
      window.clearInterval(this.crackleTimer);
      this.crackleTimer = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundscape = new PocketWorldSoundscape();
