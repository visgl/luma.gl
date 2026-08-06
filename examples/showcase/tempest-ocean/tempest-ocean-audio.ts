// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const MINIMUM_GAIN = 0.0001;
const OCEAN_NOISE_DURATION_SECONDS = 12;
const OCEAN_RANDOM_SEED = 0x51a7e2d9;

export type TempestOceanAudioStatus = 'waiting' | 'ready' | 'muted' | 'unavailable';

export type TempestOceanSirenCue = {
  delaySeconds: number;
  durationSeconds: number;
  startFrequencyHertz: number;
  middleFrequencyHertz: number;
  endFrequencyHertz: number;
  peakGain: number;
  startPan: number;
  endPan: number;
  vibratoFrequencyHertz: number;
};

/** Returns a deterministic, deliberately rare call without imitating an emergency siren pattern. */
export function makeTempestOceanSirenCue(
  cueIndex: number,
  randomSeed = OCEAN_RANDOM_SEED
): TempestOceanSirenCue {
  const safeCueIndex = Number.isFinite(cueIndex) ? Math.max(0, Math.floor(cueIndex)) : 0;
  const nextRandomValue = makeDeterministicRandom(
    randomSeed ^ Math.imul(safeCueIndex + 1, 0x85ebca6b)
  );
  const startFrequencyHertz = 205 + nextRandomValue() * 72;
  const middleFrequencyHertz = startFrequencyHertz * (1.12 + nextRandomValue() * 0.16);
  const startPan = nextRandomValue() * 1.1 - 0.55;
  return {
    delaySeconds: safeCueIndex === 0 ? 16 + nextRandomValue() * 8 : 44 + nextRandomValue() * 28,
    durationSeconds: 6.2 + nextRandomValue() * 2.5,
    startFrequencyHertz,
    middleFrequencyHertz,
    endFrequencyHertz: middleFrequencyHertz * (0.7 + nextRandomValue() * 0.11),
    peakGain: 0.027 + nextRandomValue() * 0.012,
    startPan,
    endPan: clamp(startPan + (nextRandomValue() - 0.5) * 0.82, -0.8, 0.8),
    vibratoFrequencyHertz: 0.42 + nextRandomValue() * 0.32
  };
}

/** Slow attack and two restrained swells give the call a distant, nonverbal phrase shape. */
export function getTempestOceanSirenEnvelope(
  elapsedSeconds: number,
  durationSeconds: number
): number {
  if (
    !Number.isFinite(elapsedSeconds) ||
    !Number.isFinite(durationSeconds) ||
    elapsedSeconds <= 0 ||
    durationSeconds <= 0 ||
    elapsedSeconds >= durationSeconds
  ) {
    return 0;
  }
  const phase = elapsedSeconds / durationSeconds;
  const broadEnvelope = Math.pow(Math.sin(Math.PI * phase), 1.28);
  const phraseSwell = 0.78 + 0.22 * Math.sin(Math.PI * 3 * phase) ** 2;
  return broadEnvelope * phraseSwell;
}

/** Creates low-pass noise with a crossfaded head so the procedural water bed loops cleanly. */
export function makeTempestOceanNoiseSamples(
  sampleCount: number,
  crossfadeSampleCount: number,
  randomSeed = OCEAN_RANDOM_SEED
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
    previousSample = previousSample * 0.58 + whiteNoise * 0.42;
    samples[sampleIndex] = previousSample * 0.78;
  }

  const continuousTail = new Float32Array(safeCrossfadeSampleCount);
  for (let sampleIndex = 0; sampleIndex < safeCrossfadeSampleCount; sampleIndex++) {
    const whiteNoise = nextRandomValue() * 2 - 1;
    previousSample = previousSample * 0.58 + whiteNoise * 0.42;
    continuousTail[sampleIndex] = previousSample * 0.78;
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

/** Gesture-activated procedural ocean atmosphere with no fetched or decoded audio assets. */
export class TempestOceanAudio {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private oceanNoiseBuffer: AudioBuffer | null = null;
  private readonly ambientSources: AudioScheduledSourceNode[] = [];
  private readonly ambientNodes: AudioNode[] = [];
  private activeSiren: {stop: () => void} | null = null;
  private sirenTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  private sirenCueIndex = 0;
  private audioEnabled = true;
  private pageVisible = true;
  private destroyed = false;

  get enabled(): boolean {
    return this.audioEnabled;
  }

  get status(): TempestOceanAudioStatus {
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
      this.masterCompressor.threshold.value = -16;
      this.masterCompressor.knee.value = 12;
      this.masterCompressor.ratio.value = 3;
      this.masterCompressor.attack.value = 0.025;
      this.masterCompressor.release.value = 0.5;
      this.masterGain.connect(this.masterCompressor).connect(this.audioContext.destination);
    }
    if (this.audioContext.state !== 'running' && this.audioContext.state !== 'closed') {
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
      this.startOceanBed();
    }
    this.updateMasterGain();
    this.scheduleNextSiren(this.sirenCueIndex === 0);
  }

  setEnabled(enabled: boolean): void {
    this.audioEnabled = enabled;
    this.updateMasterGain();
    if (!enabled) {
      this.clearSirenTimer();
      this.activeSiren?.stop();
    } else if (this.audioContext?.state === 'running') {
      this.scheduleNextSiren(this.sirenCueIndex === 0);
    }
  }

  /** Silences a background tab without attempting an autoplay-blocked resume when it returns. */
  setPageVisible(visible: boolean): void {
    this.pageVisible = visible;
    this.updateMasterGain();
    if (!visible) {
      this.clearSirenTimer();
      this.activeSiren?.stop();
    } else if (this.audioEnabled && this.audioContext?.state === 'running') {
      this.scheduleNextSiren(this.sirenCueIndex === 0);
    }
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.clearSirenTimer();
    this.activeSiren?.stop();
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
    this.oceanNoiseBuffer = null;
    this.audioContext = null;
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close().catch(() => {});
    }
  }

  private startOceanBed(): void {
    const audioContext = this.audioContext;
    const masterGain = this.masterGain;
    if (!audioContext || !masterGain) {
      return;
    }
    this.oceanNoiseBuffer = makeLoopingNoiseBuffer(audioContext);
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = this.oceanNoiseBuffer;
    noiseSource.loop = true;

    const swellLowPass = audioContext.createBiquadFilter();
    swellLowPass.type = 'lowpass';
    swellLowPass.frequency.value = 185;
    swellLowPass.Q.value = 0.72;
    const swellGain = audioContext.createGain();
    swellGain.gain.value = 0.075;

    const surfBandPass = audioContext.createBiquadFilter();
    surfBandPass.type = 'bandpass';
    surfBandPass.frequency.value = 620;
    surfBandPass.Q.value = 0.48;
    const surfGain = audioContext.createGain();
    surfGain.gain.value = 0.047;

    const windHighPass = audioContext.createBiquadFilter();
    windHighPass.type = 'highpass';
    windHighPass.frequency.value = 980;
    windHighPass.Q.value = 0.42;
    const windLowPass = audioContext.createBiquadFilter();
    windLowPass.type = 'lowpass';
    windLowPass.frequency.value = 2_300;
    windLowPass.Q.value = 0.4;
    const windGain = audioContext.createGain();
    windGain.gain.value = 0.014;

    const swellLFO = audioContext.createOscillator();
    swellLFO.type = 'sine';
    swellLFO.frequency.value = 0.075;
    const swellLFODepth = audioContext.createGain();
    swellLFODepth.gain.value = 0.036;
    swellLFO.connect(swellLFODepth).connect(swellGain.gain);

    const surfLFO = audioContext.createOscillator();
    surfLFO.type = 'sine';
    surfLFO.frequency.value = 0.13;
    const surfLFODepth = audioContext.createGain();
    surfLFODepth.gain.value = 0.021;
    surfLFO.connect(surfLFODepth).connect(surfGain.gain);

    const windLFO = audioContext.createOscillator();
    windLFO.type = 'sine';
    windLFO.frequency.value = 0.045;
    const windLFODepth = audioContext.createGain();
    windLFODepth.gain.value = 310;
    windLFO.connect(windLFODepth).connect(windHighPass.frequency);

    const stereoPanner = audioContext.createStereoPanner();
    const panLFO = audioContext.createOscillator();
    panLFO.type = 'sine';
    panLFO.frequency.value = 0.027;
    const panLFODepth = audioContext.createGain();
    panLFODepth.gain.value = 0.26;
    panLFO.connect(panLFODepth).connect(stereoPanner.pan);

    noiseSource.connect(swellLowPass).connect(swellGain).connect(stereoPanner);
    noiseSource.connect(surfBandPass).connect(surfGain).connect(stereoPanner);
    noiseSource.connect(windHighPass).connect(windLowPass).connect(windGain).connect(stereoPanner);
    stereoPanner.connect(masterGain);

    this.ambientSources.push(noiseSource, swellLFO, surfLFO, windLFO, panLFO);
    this.ambientNodes.push(
      swellLowPass,
      swellGain,
      surfBandPass,
      surfGain,
      windHighPass,
      windLowPass,
      windGain,
      swellLFODepth,
      surfLFODepth,
      windLFODepth,
      stereoPanner,
      panLFODepth
    );
    const startTime = audioContext.currentTime + 0.025;
    noiseSource.start(startTime);
    swellLFO.start(startTime);
    surfLFO.start(startTime);
    windLFO.start(startTime);
    panLFO.start(startTime);
  }

  private scheduleNextSiren(initialCue: boolean): void {
    if (
      this.sirenTimer !== null ||
      !this.audioEnabled ||
      !this.pageVisible ||
      this.audioContext?.state !== 'running'
    ) {
      return;
    }
    const cue = makeTempestOceanSirenCue(initialCue ? 0 : this.sirenCueIndex);
    this.sirenTimer = globalThis.setTimeout(() => {
      this.sirenTimer = null;
      if (!this.audioEnabled || !this.pageVisible || this.audioContext?.state !== 'running') {
        return;
      }
      this.playSiren(cue);
      this.sirenCueIndex++;
      this.scheduleNextSiren(false);
    }, cue.delaySeconds * 1000);
  }

  private playSiren(cue: TempestOceanSirenCue): void {
    const audioContext = this.audioContext;
    const masterGain = this.masterGain;
    const oceanNoiseBuffer = this.oceanNoiseBuffer;
    if (!audioContext || !masterGain || !oceanNoiseBuffer) {
      return;
    }
    this.activeSiren?.stop();
    const startTime = audioContext.currentTime + 0.025;
    const middleTime = startTime + cue.durationSeconds * 0.46;
    const stopTime = startTime + cue.durationSeconds;

    const primaryOscillator = audioContext.createOscillator();
    primaryOscillator.type = 'sine';
    primaryOscillator.frequency.setValueAtTime(cue.startFrequencyHertz, startTime);
    primaryOscillator.frequency.exponentialRampToValueAtTime(cue.middleFrequencyHertz, middleTime);
    primaryOscillator.frequency.exponentialRampToValueAtTime(cue.endFrequencyHertz, stopTime);
    const primaryGain = audioContext.createGain();
    primaryGain.gain.value = 0.78;

    const harmonicOscillator = audioContext.createOscillator();
    harmonicOscillator.type = 'sine';
    harmonicOscillator.frequency.setValueAtTime(cue.startFrequencyHertz * 1.505, startTime);
    harmonicOscillator.frequency.exponentialRampToValueAtTime(
      cue.middleFrequencyHertz * 1.498,
      middleTime
    );
    harmonicOscillator.frequency.exponentialRampToValueAtTime(
      cue.endFrequencyHertz * 1.502,
      stopTime
    );
    const harmonicGain = audioContext.createGain();
    harmonicGain.gain.value = 0.24;

    const breathSource = audioContext.createBufferSource();
    breathSource.buffer = oceanNoiseBuffer;
    breathSource.loop = true;
    const breathFilter = audioContext.createBiquadFilter();
    breathFilter.type = 'bandpass';
    breathFilter.frequency.setValueAtTime(cue.startFrequencyHertz * 2.1, startTime);
    breathFilter.frequency.exponentialRampToValueAtTime(cue.middleFrequencyHertz * 2.2, middleTime);
    breathFilter.frequency.exponentialRampToValueAtTime(cue.endFrequencyHertz * 2.15, stopTime);
    breathFilter.Q.value = 8;
    const breathGain = audioContext.createGain();
    breathGain.gain.value = 0.46;

    const vibratoOscillator = audioContext.createOscillator();
    vibratoOscillator.type = 'sine';
    vibratoOscillator.frequency.value = cue.vibratoFrequencyHertz;
    const vibratoDepth = audioContext.createGain();
    vibratoDepth.gain.value = 3.4;
    vibratoOscillator.connect(vibratoDepth).connect(primaryOscillator.frequency);

    const envelopeGain = audioContext.createGain();
    envelopeGain.gain.setValueAtTime(MINIMUM_GAIN, startTime);
    const envelopeSampleCount = 32;
    for (let sampleIndex = 1; sampleIndex <= envelopeSampleCount; sampleIndex++) {
      const elapsedSeconds = (cue.durationSeconds * sampleIndex) / envelopeSampleCount;
      envelopeGain.gain.linearRampToValueAtTime(
        MINIMUM_GAIN +
          cue.peakGain * getTempestOceanSirenEnvelope(elapsedSeconds, cue.durationSeconds),
        startTime + elapsedSeconds
      );
    }
    const stereoPanner = audioContext.createStereoPanner();
    stereoPanner.pan.setValueAtTime(cue.startPan, startTime);
    stereoPanner.pan.linearRampToValueAtTime(cue.endPan, stopTime);

    primaryOscillator.connect(primaryGain).connect(envelopeGain);
    harmonicOscillator.connect(harmonicGain).connect(envelopeGain);
    breathSource.connect(breathFilter).connect(breathGain).connect(envelopeGain);
    envelopeGain.connect(stereoPanner).connect(masterGain);

    let stopped = false;
    const voice = {
      stop: (): void => {
        if (stopped) {
          return;
        }
        stopped = true;
        for (const source of [
          primaryOscillator,
          harmonicOscillator,
          breathSource,
          vibratoOscillator
        ]) {
          try {
            source.stop();
          } catch {
            // A source can already be stopped while its final `ended` event is still queued.
          }
          source.disconnect();
        }
        primaryGain.disconnect();
        harmonicGain.disconnect();
        breathFilter.disconnect();
        breathGain.disconnect();
        vibratoDepth.disconnect();
        envelopeGain.disconnect();
        stereoPanner.disconnect();
        if (this.activeSiren === voice) {
          this.activeSiren = null;
        }
      }
    };
    this.activeSiren = voice;
    primaryOscillator.addEventListener('ended', voice.stop, {once: true});
    primaryOscillator.start(startTime);
    harmonicOscillator.start(startTime);
    breathSource.start(startTime, cue.delaySeconds % oceanNoiseBuffer.duration);
    vibratoOscillator.start(startTime);
    primaryOscillator.stop(stopTime);
    harmonicOscillator.stop(stopTime);
    breathSource.stop(stopTime);
    vibratoOscillator.stop(stopTime);
  }

  private updateMasterGain(): void {
    const audioContext = this.audioContext;
    const masterGain = this.masterGain;
    if (!audioContext || !masterGain || audioContext.state === 'closed') {
      return;
    }
    const targetGain = this.audioEnabled && this.pageVisible ? 0.68 : MINIMUM_GAIN;
    const currentTime = audioContext.currentTime;
    masterGain.gain.cancelScheduledValues(currentTime);
    masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, MINIMUM_GAIN), currentTime);
    masterGain.gain.exponentialRampToValueAtTime(targetGain, currentTime + 0.38);
  }

  private clearSirenTimer(): void {
    if (this.sirenTimer !== null) {
      globalThis.clearTimeout(this.sirenTimer);
      this.sirenTimer = null;
    }
  }
}

function makeLoopingNoiseBuffer(audioContext: AudioContext): AudioBuffer {
  const sampleCount = Math.max(
    1,
    Math.ceil(audioContext.sampleRate * OCEAN_NOISE_DURATION_SECONDS)
  );
  const crossfadeSampleCount = Math.min(
    Math.round(audioContext.sampleRate * 0.3),
    sampleCount >> 1
  );
  const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
  buffer
    .getChannelData(0)
    .set(makeTempestOceanNoiseSamples(sampleCount, crossfadeSampleCount, OCEAN_RANDOM_SEED));
  return buffer;
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
