// audio.js — every sound is synthesized with WebAudio. No audio files, no
// network, nothing to load. Sounds start only after a user gesture.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
    return this.muted;
  }

  tone(freq, dur, type = 'square', vol = 0.5, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, vol = 0.3, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  // Giblet's gobble: two quick descending gobbles.
  gobble() {
    this.tone(520, 0.09, 'square', 0.4, 300);
    this.tone(480, 0.09, 'square', 0.4, 280, 0.11);
    this.tone(620, 0.12, 'square', 0.35, 340, 0.22);
  }

  jump() {
    this.tone(280, 0.16, 'sine', 0.4, 620);
  }

  dash() {
    this.noise(0.22, 0.35);
    this.tone(200, 0.2, 'sawtooth', 0.25, 900);
  }

  pickup(combo) {
    const base = 660 + Math.min(combo, 5) * 90;
    this.tone(base, 0.09, 'triangle', 0.5);
    this.tone(base * 1.5, 0.14, 'triangle', 0.45, null, 0.08);
  }

  hurt() {
    this.tone(220, 0.25, 'sawtooth', 0.5, 90);
    this.noise(0.18, 0.3);
  }

  alarm() {
    this.tone(880, 0.12, 'square', 0.3, 880);
    this.tone(880, 0.12, 'square', 0.3, 880, 0.16);
  }

  knifeThrow() {
    this.tone(1400, 0.18, 'sine', 0.25, 500);
  }

  caught() {
    this.tone(392, 0.2, 'sawtooth', 0.4);
    this.tone(311, 0.2, 'sawtooth', 0.4, null, 0.2);
    this.tone(233, 0.5, 'sawtooth', 0.45, 150, 0.4);
  }

  winJingle() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((freq, i) => this.tone(freq, 0.22, 'triangle', 0.5, null, i * 0.14));
  }

  click() {
    this.tone(700, 0.05, 'square', 0.3);
  }
}
