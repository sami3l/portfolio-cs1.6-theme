// Tiny UI sounds synthesized with the Web Audio API, so there are no audio files to ship or license.

let enabled = false;
let ctx: AudioContext | null = null;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

interface ToneOptions {
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  slideTo?: number;
}

function tone(freq: number, duration: number, { type = 'square', gain = 0.03, delay = 0, slideTo }: ToneOptions = {}) {
  if (!enabled) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  } catch {
    // Audio unavailable: stay silent.
  }
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
};
