let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function initAudio(): void {
  try {
    getAudioCtx();
  } catch {
    // Audio not supported
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume: number = 0.15): void {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail
  }
}

export function playShoot(): void {
  playTone(880, 0.05, 'square', 0.08);
}

export function playHitMushroom(): void {
  playTone(200, 0.05, 'triangle', 0.06);
}

export function playHitCentipede(): void {
  playTone(600, 0.1, 'square', 0.1);
  setTimeout(() => playTone(800, 0.08, 'square', 0.08), 50);
}

export function playHitSpider(): void {
  playTone(400, 0.15, 'sawtooth', 0.1);
  setTimeout(() => playTone(600, 0.1, 'sawtooth', 0.08), 80);
}

export function playDeath(): void {
  playTone(400, 0.3, 'sawtooth', 0.15);
  setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.12), 150);
  setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.1), 300);
  setTimeout(() => playTone(100, 0.5, 'sawtooth', 0.08), 450);
}

export function playExtraLife(): void {
  playTone(523, 0.1, 'square', 0.1);
  setTimeout(() => playTone(659, 0.1, 'square', 0.1), 100);
  setTimeout(() => playTone(784, 0.1, 'square', 0.1), 200);
  setTimeout(() => playTone(1047, 0.15, 'square', 0.12), 300);
}

export function playLevelClear(): void {
  playTone(523, 0.12, 'square', 0.1);
  setTimeout(() => playTone(659, 0.12, 'square', 0.1), 120);
  setTimeout(() => playTone(784, 0.12, 'square', 0.1), 240);
  setTimeout(() => playTone(1047, 0.2, 'square', 0.12), 360);
  setTimeout(() => playTone(1319, 0.3, 'square', 0.1), 480);
}
