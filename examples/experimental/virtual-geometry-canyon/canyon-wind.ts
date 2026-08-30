// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const MINIMUM_GAIN = 0.0001;
const WIND_NOISE_DURATION_SECONDS = 10;
const WIND_RANDOM_SEED = 0x6d2b79f5;

export type CanyonWindStatus = 'waiting' | 'ready' | 'muted' | 'unavailable';

export type CanyonWindWhistleCue = {
  delaySeconds: number;
  durationSeconds: number;
  startFrequencyHertz: number;
  endFrequencyHertz: number;
  peakGain: number;
  startPan: number;
  endPan: number;
  vibratoFrequencyHertz: number;
  noiseOffsetSeconds: number;
};

/** Returns one deterministic, irregular whistle cue for tests and procedural scheduling. */
export function makeCanyonWindWhistleCue(
  cueIndex: number,
  randomSeed = WIND_RANDOM_SEED
): CanyonWindWhistleCue {
  const safeCueIndex = Number.isFinite(cueIndex) ? Math.max(0, Math.floor(cueIndex)) : 0;
  const nextRandomValue = makeDeterministicRandom(
    randomSeed ^ Math.imul(safeCueIndex + 1, 0x85ebca6b)
  );
  const startFrequencyHertz = 560 + nextRandomValue() * 170;
  const startPan = nextRandomValue() * 1.3 - 0.65;
  return {
    delaySeconds: safeCueIndex === 0 ? 4 + nextRandomValue() * 3 : 9 + nextRandomValue() * 9,
    durationSeconds: 4.2 + nextRandomValue() * 2.6,
    startFrequencyHertz,
    endFrequencyHertz: startFrequencyHertz * (0.68 + nextRandomValue() * 0.12),
    peakGain: 0.022 + nextRandomValue() * 0.012,
    startPan,
    endPan: clamp(startPan + (nextRandomValue() - 0.5) * 0.7, -0.8, 0.8),
    vibratoFrequencyHertz: 0.65 + nextRandomValue() * 0.55,
    noiseOffsetSeconds: nextRandomValue() * WIND_NOISE_DURATION_SECONDS
  };
}

/** Soft attack and long decay shared by Web Audio automation and focused node tests. */
export function getCanyonWindWhistleEnvelope(
  elapsedSeconds: number,
  durationSeconds: number
): number {
  if (
    !Number.isFinite(elapsedSeconds) ||
    !Number.isFinite(durationSeconds) ||
    elapsedSeconds < 0 ||
    durationSeconds <= 0 ||
    elapsedSeconds >= durationSeconds
  ) {
    return 0;
  }
  const attackSeconds = Math.min(1.05, durationSeconds * 0.2);
  if (elapsedSeconds < attackSeconds) {
    const attack = elapsedSeconds / attackSeconds;
    return attack * attack * (3 - 2 * attack);
  }
  const decay = (elapsedSeconds - attackSeconds) / (durationSeconds - attackSeconds);
  return Math.pow(1 - decay, 1.35) * (1 - decay * 0.16);
}

/** Gesture-activated procedural desert wind with no fetched or decoded audio assets. */
export class CanyonWindAudio {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private windNoiseBuffer: AudioBuffer | null = null;
  private readonly ambientSources: AudioScheduledSourceNode[] = [];
  private readonly ambientNodes: AudioNode[] = [];
  private activeWhistle: {stop: () => void} | null = null;
  private whistleTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  private whistleCueIndex = 0;
  private audioEnabled = true;
  private pageVisible = true;
  private destroyed = false;

  get enabled(): boolean {
    return this.audioEnabled;
  }

  get status(): CanyonWindStatus {
    if (!this.audioEnabled) {
      return 'muted';
    }
    if (this.audioContext?.state === 'running') {
      return 'ready';
    }
    return getAudioContextConstructor() ? 'waiting' : 'unavailable';
  }

  /** Must be called from a pointer, keyboard, or control event for browser autoplay policies. */
  async activate(): Promise<void> {
    if (this.destroyed || !this.audioEnabled) {
      return;
    }
    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) {
      return;
    }
    if (!this.audioContext) {
      this.audioContext = new AudioContextConstructor({latencyHint: 'playback'});
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = MINIMUM_GAIN;
      this.masterCompressor = this.audioContext.createDynamicsCompressor();
      this.masterCompressor.threshold.value = -18;
      this.masterCompressor.knee.value = 12;
      this.masterCompressor.ratio.value = 4;
      this.masterCompressor.attack.value = 0.018;
      this.masterCompressor.release.value = 0.42;
      this.masterGain.connect(this.masterCompressor).connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        return;
      }
    }
    if (this.audioContext.state !== 'running') {
      return;
    }
    if (this.ambientSources.length === 0) {
      this.startWindBed();
    }
    this.updateMasterGain();
    this.scheduleNextWhistle(this.whistleCueIndex === 0);
  }

  setEnabled(enabled: boolean): void {
    this.audioEnabled = enabled;
    this.updateMasterGain();
    if (!enabled) {
      this.clearWhistleTimer();
      this.activeWhistle?.stop();
    } else if (this.audioContext?.state === 'running') {
      this.scheduleNextWhistle(this.whistleCueIndex === 0);
    }
  }

  /** Silences a background tab without attempting an autoplay-blocked resume on return. */
  setPageVisible(visible: boolean): void {
    this.pageVisible = visible;
    this.updateMasterGain();
    if (!visible) {
      this.clearWhistleTimer();
    } else if (this.audioEnabled && this.audioContext?.state === 'running') {
      this.scheduleNextWhistle(this.whistleCueIndex === 0);
    }
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.clearWhistleTimer();
    this.activeWhistle?.stop();
    for (const source of this.ambientSources) {
      try {
        source.stop();
      } catch {
        // A source can already be stopped while its final `ended` event is still queued.
      }
      source.disconnect();
    }
    this.ambientSources.length = 0;
    for (const node of this.ambientNodes) {
      node.disconnect();
    }
    this.ambientNodes.length = 0;
    const audioContext = this.audioContext;
    this.masterGain?.disconnect();
    this.masterCompressor?.disconnect();
    this.masterGain = null;
    this.masterCompressor = null;
    this.windNoiseBuffer = null;
    this.audioContext = null;
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close().catch(() => {});
    }
  }

  private startWindBed(): void {
    const audioContext = this.audioContext;
    const masterGain = this.masterGain;
    if (!audioContext || !masterGain) {
      return;
    }
    this.windNoiseBuffer = makeLoopingNoiseBuffer(
      audioContext,
      WIND_NOISE_DURATION_SECONDS,
      WIND_RANDOM_SEED
    );
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = this.windNoiseBuffer;
    noiseSource.loop = true;

    const bedHighPass = audioContext.createBiquadFilter();
    bedHighPass.type = 'highpass';
    bedHighPass.frequency.value = 35;
    bedHighPass.Q.value = 0.5;
    const bedLowPass = audioContext.createBiquadFilter();
    bedLowPass.type = 'lowpass';
    bedLowPass.frequency.value = 440;
    bedLowPass.Q.value = 0.56;
    const bedGain = audioContext.createGain();
    bedGain.gain.value = 0.056;

    const airBandPass = audioContext.createBiquadFilter();
    airBandPass.type = 'bandpass';
    airBandPass.frequency.value = 860;
    airBandPass.Q.value = 0.42;
    const airGain = audioContext.createGain();
    airGain.gain.value = 0.016;
    const stereoPanner = audioContext.createStereoPanner();

    const bedLFO = audioContext.createOscillator();
    bedLFO.type = 'sine';
    bedLFO.frequency.value = 0.065;
    const bedLFODepth = audioContext.createGain();
    bedLFODepth.gain.value = 0.014;
    bedLFO.connect(bedLFODepth).connect(bedGain.gain);

    const airLFO = audioContext.createOscillator();
    airLFO.type = 'sine';
    airLFO.frequency.value = 0.11;
    const airLFODepth = audioContext.createGain();
    airLFODepth.gain.value = 190;
    airLFO.connect(airLFODepth).connect(airBandPass.frequency);

    const panLFO = audioContext.createOscillator();
    panLFO.type = 'sine';
    panLFO.frequency.value = 0.037;
    const panLFODepth = audioContext.createGain();
    panLFODepth.gain.value = 0.24;
    panLFO.connect(panLFODepth).connect(stereoPanner.pan);

    noiseSource.connect(bedHighPass).connect(bedLowPass).connect(bedGain).connect(stereoPanner);
    noiseSource.connect(airBandPass).connect(airGain).connect(stereoPanner);
    stereoPanner.connect(masterGain);

    this.ambientSources.push(noiseSource, bedLFO, airLFO, panLFO);
    this.ambientNodes.push(
      bedHighPass,
      bedLowPass,
      bedGain,
      airBandPass,
      airGain,
      stereoPanner,
      bedLFODepth,
      airLFODepth,
      panLFODepth
    );
    const startTime = audioContext.currentTime + 0.012;
    noiseSource.start(startTime);
    bedLFO.start(startTime);
    airLFO.start(startTime);
    panLFO.start(startTime);
  }

  private scheduleNextWhistle(initialCue: boolean): void {
    if (
      this.whistleTimer !== null ||
      !this.audioEnabled ||
      !this.pageVisible ||
      this.audioContext?.state !== 'running'
    ) {
      return;
    }
    const cue = makeCanyonWindWhistleCue(initialCue ? 0 : this.whistleCueIndex);
    this.whistleTimer = globalThis.setTimeout(() => {
      this.whistleTimer = null;
      if (!this.audioEnabled || !this.pageVisible || this.audioContext?.state !== 'running') {
        return;
      }
      this.playWhistle(cue);
      this.whistleCueIndex++;
      this.scheduleNextWhistle(false);
    }, cue.delaySeconds * 1000);
  }

  private playWhistle(cue: CanyonWindWhistleCue): void {
    const audioContext = this.audioContext;
    const masterGain = this.masterGain;
    const windNoiseBuffer = this.windNoiseBuffer;
    if (!audioContext || !masterGain || !windNoiseBuffer) {
      return;
    }
    this.activeWhistle?.stop();
    const startTime = audioContext.currentTime + 0.012;
    const stopTime = startTime + cue.durationSeconds;
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = windNoiseBuffer;
    noiseSource.loop = true;
    const whistleFilter = audioContext.createBiquadFilter();
    whistleFilter.type = 'bandpass';
    whistleFilter.Q.value = 13;
    whistleFilter.frequency.setValueAtTime(cue.startFrequencyHertz, startTime);
    whistleFilter.frequency.exponentialRampToValueAtTime(cue.endFrequencyHertz, stopTime);
    const whistleNoiseGain = audioContext.createGain();
    whistleNoiseGain.gain.value = 0.72;

    const overtoneFilter = audioContext.createBiquadFilter();
    overtoneFilter.type = 'bandpass';
    overtoneFilter.Q.value = 17;
    overtoneFilter.frequency.setValueAtTime(cue.startFrequencyHertz * 2.01, startTime);
    overtoneFilter.frequency.exponentialRampToValueAtTime(cue.endFrequencyHertz * 2.03, stopTime);
    const overtoneGain = audioContext.createGain();
    overtoneGain.gain.value = 0.14;

    const toneOscillator = audioContext.createOscillator();
    toneOscillator.type = 'sine';
    toneOscillator.frequency.setValueAtTime(cue.startFrequencyHertz * 0.997, startTime);
    toneOscillator.frequency.exponentialRampToValueAtTime(cue.endFrequencyHertz, stopTime);
    const toneGain = audioContext.createGain();
    toneGain.gain.value = 0.11;
    const vibratoOscillator = audioContext.createOscillator();
    vibratoOscillator.type = 'sine';
    vibratoOscillator.frequency.value = cue.vibratoFrequencyHertz;
    const vibratoDepth = audioContext.createGain();
    vibratoDepth.gain.value = 4.5;
    vibratoOscillator.connect(vibratoDepth).connect(toneOscillator.frequency);

    const envelopeGain = audioContext.createGain();
    envelopeGain.gain.setValueAtTime(MINIMUM_GAIN, startTime);
    const envelopeSampleCount = 28;
    for (let sampleIndex = 1; sampleIndex <= envelopeSampleCount; sampleIndex++) {
      const elapsedSeconds = (cue.durationSeconds * sampleIndex) / envelopeSampleCount;
      envelopeGain.gain.linearRampToValueAtTime(
        MINIMUM_GAIN +
          cue.peakGain * getCanyonWindWhistleEnvelope(elapsedSeconds, cue.durationSeconds),
        startTime + elapsedSeconds
      );
    }
    const stereoPanner = audioContext.createStereoPanner();
    stereoPanner.pan.setValueAtTime(cue.startPan, startTime);
    stereoPanner.pan.linearRampToValueAtTime(cue.endPan, stopTime);

    noiseSource.connect(whistleFilter).connect(whistleNoiseGain).connect(envelopeGain);
    noiseSource.connect(overtoneFilter).connect(overtoneGain).connect(envelopeGain);
    toneOscillator.connect(toneGain).connect(envelopeGain);
    envelopeGain.connect(stereoPanner).connect(masterGain);

    let stopped = false;
    const voice = {
      stop: (): void => {
        if (stopped) {
          return;
        }
        stopped = true;
        for (const source of [noiseSource, toneOscillator, vibratoOscillator]) {
          try {
            source.stop();
          } catch {
            // A source can already be stopped while its final `ended` event is still queued.
          }
          source.disconnect();
        }
        whistleFilter.disconnect();
        whistleNoiseGain.disconnect();
        overtoneFilter.disconnect();
        overtoneGain.disconnect();
        toneGain.disconnect();
        vibratoDepth.disconnect();
        envelopeGain.disconnect();
        stereoPanner.disconnect();
        if (this.activeWhistle === voice) {
          this.activeWhistle = null;
        }
      }
    };
    this.activeWhistle = voice;
    noiseSource.addEventListener('ended', voice.stop, {once: true});
    noiseSource.start(startTime, cue.noiseOffsetSeconds % windNoiseBuffer.duration);
    toneOscillator.start(startTime);
    vibratoOscillator.start(startTime);
    noiseSource.stop(stopTime);
    toneOscillator.stop(stopTime);
    vibratoOscillator.stop(stopTime);
  }

  private updateMasterGain(): void {
    const audioContext = this.audioContext;
    const masterGain = this.masterGain;
    if (!audioContext || !masterGain || audioContext.state === 'closed') {
      return;
    }
    const targetGain = this.audioEnabled && this.pageVisible ? 0.72 : MINIMUM_GAIN;
    const currentTime = audioContext.currentTime;
    masterGain.gain.cancelScheduledValues(currentTime);
    masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, MINIMUM_GAIN), currentTime);
    masterGain.gain.exponentialRampToValueAtTime(targetGain, currentTime + 0.32);
  }

  private clearWhistleTimer(): void {
    if (this.whistleTimer !== null) {
      globalThis.clearTimeout(this.whistleTimer);
      this.whistleTimer = null;
    }
  }
}

function makeLoopingNoiseBuffer(
  audioContext: AudioContext,
  durationSeconds: number,
  randomSeed: number
): AudioBuffer {
  const sampleCount = Math.max(1, Math.ceil(audioContext.sampleRate * durationSeconds));
  const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
  const samples = buffer.getChannelData(0);
  const crossfadeSampleCount = Math.min(
    Math.round(audioContext.sampleRate * 0.25),
    sampleCount >> 1
  );
  samples.set(makeCanyonWindNoiseSamples(sampleCount, crossfadeSampleCount, randomSeed));
  return buffer;
}

/** Creates filtered noise whose end flows continuously into a crossfaded beginning. */
export function makeCanyonWindNoiseSamples(
  sampleCount: number,
  crossfadeSampleCount: number,
  randomSeed = WIND_RANDOM_SEED
): Float32Array {
  const safeSampleCount = Math.max(1, Math.floor(sampleCount));
  const safeCrossfadeSampleCount = Math.min(
    Math.max(0, Math.floor(crossfadeSampleCount)),
    safeSampleCount >> 1
  );
  const samples = new Float32Array(safeSampleCount);
  const nextRandomValue = makeDeterministicRandom(randomSeed);
  let previousSample = 0;
  for (let sampleIndex = 0; sampleIndex < safeSampleCount; sampleIndex++) {
    const whiteNoise = nextRandomValue() * 2 - 1;
    previousSample = previousSample * 0.74 + whiteNoise * 0.26;
    samples[sampleIndex] = previousSample * 0.82;
  }
  const continuousTail = new Float32Array(safeCrossfadeSampleCount);
  for (let sampleIndex = 0; sampleIndex < safeCrossfadeSampleCount; sampleIndex++) {
    const whiteNoise = nextRandomValue() * 2 - 1;
    previousSample = previousSample * 0.74 + whiteNoise * 0.26;
    continuousTail[sampleIndex] = previousSample * 0.82;
  }
  for (let sampleIndex = 0; sampleIndex < safeCrossfadeSampleCount; sampleIndex++) {
    const blend = sampleIndex / Math.max(1, safeCrossfadeSampleCount - 1);
    const tailGain = Math.cos((blend * Math.PI) / 2);
    const beginningGain = Math.sin((blend * Math.PI) / 2);
    samples[sampleIndex] =
      continuousTail[sampleIndex] * tailGain + samples[sampleIndex] * beginningGain;
  }
  return samples;
}

function makeDeterministicRandom(randomSeed: number): () => number {
  let state = randomSeed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function getAudioContextConstructor(): typeof AudioContext | undefined {
  if (typeof AudioContext !== 'undefined') {
    return AudioContext;
  }
  return (
    globalThis as typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    }
  ).webkitAudioContext;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
