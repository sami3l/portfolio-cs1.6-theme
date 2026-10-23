// Tiny UI and Play-mode sounds synthesized with the Web Audio API, so there are no audio files
// to ship or license.

let enabled = false;
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio() {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null; // Audio unavailable: stay silent.
  }
}

interface ToneOptions {
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  slideTo?: number;
}

function tone(freq: number, duration: number, { type = 'square', gain = 0.03, delay = 0, slideTo }: ToneOptions = {}) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

interface NoiseOptions {
  /** Band-pass centre frequency; `sweepTo` glides it (whooshes). */
  freq: number;
  q?: number;
  gain?: number;
  delay?: number;
  sweepTo?: number;
  /** Attack time before the decay, in seconds. */
  attack?: number;
}

/** A filtered burst of white noise: footsteps, gunshots, knife swings. */
function noiseBurst(duration: number, { freq, q = 1, gain = 0.2, delay = 0, sweepTo, attack = 0.002 }: NoiseOptions) {
  const ac = audio();
  if (!ac) return;
  if (!noise) {
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = ac.currentTime + delay;
  const src = ac.createBufferSource();
  src.buffer = noise;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, t);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t + duration);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start(t, Math.random() * 0.5);
  src.stop(t + duration + 0.02);
}

export const sfx = {
  click: () => tone(1400, 0.035, { gain: 0.025 }),
  hover: () => tone(2400, 0.015, { type: 'sine', gain: 0.012 }),
  open: () => {
    tone(520, 0.05, { type: 'triangle' });
    tone(780, 0.07, { type: 'triangle', delay: 0.05 });
  },
  buy: () => {
    tone(880, 0.06, { type: 'triangle', gain: 0.04 });
    tone(1320, 0.1, { type: 'triangle', gain: 0.04, delay: 0.06 });
  },
  error: () => tone(180, 0.15, { type: 'sawtooth', gain: 0.03, slideTo: 120 }),

  // ---- Play mode
  /** Sand footstep; alternate feet sound slightly different. */
  footstep: (left: boolean) => {
    noiseBurst(0.09, { freq: left ? 700 : 820, q: 0.9, gain: 0.08, attack: 0.004 });
    noiseBurst(0.05, { freq: 2600, q: 2, gain: 0.025, delay: 0.01 });
  },
  land: () => {
    noiseBurst(0.14, { freq: 420, q: 0.8, gain: 0.14, attack: 0.003 });
    tone(90, 0.12, { type: 'sine', gain: 0.08, slideTo: 55 });
  },
  rifle: () => {
    noiseBurst(0.2, { freq: 1200, q: 0.5, gain: 0.38, attack: 0.001, sweepTo: 380 });
    tone(110, 0.16, { type: 'sine', gain: 0.2, slideTo: 42 });
    noiseBurst(0.04, { freq: 5000, q: 3, gain: 0.05, delay: 0.09 }); // brass/slide tick
  },
  empty: () => tone(2600, 0.02, { type: 'square', gain: 0.03 }),
  knife: () => noiseBurst(0.22, { freq: 900, q: 2.5, gain: 0.1, attack: 0.05, sweepTo: 3200 }),
  reload: () => {
    noiseBurst(0.05, { freq: 3000, q: 4, gain: 0.06, delay: 0.4 }); // mag out
    noiseBurst(0.06, { freq: 2200, q: 4, gain: 0.08, delay: 1.4 }); // mag in
    noiseBurst(0.05, { freq: 3800, q: 5, gain: 0.07, delay: 2.0 }); // charging handle
  },
  draw: () => noiseBurst(0.06, { freq: 3400, q: 4, gain: 0.05 }),
};
