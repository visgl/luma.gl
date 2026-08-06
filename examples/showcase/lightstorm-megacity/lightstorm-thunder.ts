// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  LIGHTSTORM_LIGHTNING_SCHEDULE,
  type LightstormLightningBoltRole
} from './lightstorm-lightning';

const MINIMUM_GAIN = 0.0001;

const THUNDER_STRENGTH_BY_ROLE: Record<LightstormLightningBoltRole, number> = {
  canyon: 1.08,
  avenue: 0.96,
  reveal: 1.42
};

const THUNDER_PAN_BY_ROLE: Record<LightstormLightningBoltRole, number> = {
  canyon: 0.42,
  avenue: -0.36,
  reveal: 0.08
};

export type LightstormThunderStatus = 'waiting' | 'ready' | 'muted' | 'unavailable';

export type LightstormThunderStrike = {
  boltIndex: number;
  role: LightstormLightningBoltRole;
  strikeTimeSeconds: number;
  strength: number;
};

/**
 * Finds primary lightning phases crossed since the previous frame. Return strokes are deliberately
 * absent from this timeline so every visual bolt produces exactly one thunder event.
 */
export function getLightstormThunderStrikeCrossings(
  previousTimeSeconds: number | null,
  timeSeconds: number,
  lightstormEnabled = true
): LightstormThunderStrike[] {
  if (
    !lightstormEnabled ||
    previousTimeSeconds === null ||
    !Number.isFinite(previousTimeSeconds) ||
    !Number.isFinite(timeSeconds) ||
    timeSeconds <= previousTimeSeconds
  ) {
    return [];
  }

  const crossings: LightstormThunderStrike[] = [];
  for (let boltIndex = 0; boltIndex < LIGHTSTORM_LIGHTNING_SCHEDULE.length; boltIndex++) {
    const bolt = LIGHTSTORM_LIGHTNING_SCHEDULE[boltIndex]!;
    const cycleIndex = Math.floor((timeSeconds - bolt.phaseSeconds) / bolt.periodSeconds);
    const strikeTimeSeconds = bolt.phaseSeconds + cycleIndex * bolt.periodSeconds;
    if (strikeTimeSeconds > previousTimeSeconds && strikeTimeSeconds <= timeSeconds) {
      crossings.push({
        boltIndex,
        role: bolt.role,
        strikeTimeSeconds,
        strength: THUNDER_STRENGTH_BY_ROLE[bolt.role]
      });
    }
  }
  return crossings.sort((first, second) => first.strikeTimeSeconds - second.strikeTimeSeconds);
}

/** Gesture-activated procedural thunder with no fetched or decoded audio assets. */
export class LightstormThunderController {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private previousTimeSeconds: number | null = null;
  private readonly activeSources = new Set<AudioScheduledSourceNode>();
  private readonly activeProcessorNodes = new Set<AudioNode>();
  private audioEnabled = true;
  private destroyed = false;

  get enabled(): boolean {
    return this.audioEnabled;
  }

  get status(): LightstormThunderStatus {
    if (!this.audioEnabled) {
      return 'muted';
    }
    if (this.audioContext?.state === 'running') {
      return 'ready';
    }
    return getAudioContextConstructor() ? 'waiting' : 'unavailable';
  }

  /** Must be called from a pointer or keyboard event to satisfy browser autoplay policies. */
  async activate(): Promise<void> {
    if (this.destroyed || !this.audioEnabled) {
      return;
    }
    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) {
      return;
    }
    if (!this.audioContext) {
      this.audioContext = new AudioContextConstructor({latencyHint: 'interactive'});
      this.masterGain = makeMasterGain(this.audioContext);
    }
    if (this.audioContext.state !== 'running' && this.audioContext.state !== 'closed') {
      await this.audioContext.resume();
    }
    if (this.audioContext.state === 'running') {
      // Start from the next live frame instead of consuming strikes while audio was locked.
      this.previousTimeSeconds = null;
    }
  }

  setEnabled(enabled: boolean): void {
    this.audioEnabled = enabled;
    if (!enabled) {
      this.stopActiveSources();
    }
  }

  update(timeSeconds: number, lightstormEnabled = true): void {
    if (this.audioContext?.state !== 'running' || !this.masterGain) {
      this.previousTimeSeconds = null;
      return;
    }
    const crossings = getLightstormThunderStrikeCrossings(
      this.previousTimeSeconds,
      timeSeconds,
      lightstormEnabled && this.audioEnabled
    );
    this.previousTimeSeconds = Number.isFinite(timeSeconds) ? timeSeconds : null;

    for (const crossing of crossings) {
      this.playStrike(crossing);
    }
  }

  /** Plays one immediate hero clap so a gesture can verify the browser's audio path. */
  preview(): void {
    if (this.audioContext?.state !== 'running' || !this.masterGain || !this.audioEnabled) {
      return;
    }
    this.playStrike({
      boltIndex: LIGHTSTORM_LIGHTNING_SCHEDULE.length - 1,
      role: 'reveal',
      strikeTimeSeconds: 0,
      strength: 1.18
    });
  }

  /** Drops timeline state and silences any rumble left over from the previous camera run. */
  reset(): void {
    this.previousTimeSeconds = null;
    this.stopActiveSources();
  }

  destroy(): void {
    this.destroyed = true;
    this.stopActiveSources();
    const audioContext = this.audioContext;
    this.audioContext = null;
    this.masterGain = null;
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close().catch(() => {});
    }
  }

  private playStrike(strike: LightstormThunderStrike): void {
    const audioContext = this.audioContext;
    const masterGain = this.masterGain;
    if (!audioContext || !masterGain) {
      return;
    }

    // Leave enough scheduling headroom for the deterministic noise buffers on busy GPU frames.
    const startTime = audioContext.currentTime + 0.045;
    const stereoPan = THUNDER_PAN_BY_ROLE[strike.role];
    const randomSeed = 0x9e3779b9 ^ ((strike.boltIndex + 1) * 0x85ebca6b);
    this.playCrack(audioContext, masterGain, startTime, strike.strength, stereoPan, randomSeed);
    this.playBody(audioContext, masterGain, startTime + 0.012, strike.strength, stereoPan * 0.65);
    this.playRumble(
      audioContext,
      masterGain,
      startTime + 0.055,
      strike.strength,
      stereoPan * 0.45,
      randomSeed ^ 0xc2b2ae35,
      strike.role === 'reveal'
    );
  }

  private playCrack(
    audioContext: AudioContext,
    destination: AudioNode,
    startTime: number,
    strength: number,
    stereoPan: number,
    randomSeed: number
  ): void {
    const duration = 0.36;
    const noise = audioContext.createBufferSource();
    noise.buffer = makeNoiseBuffer(audioContext, duration, randomSeed);
    const highPass = audioContext.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.setValueAtTime(145, startTime);
    highPass.Q.value = 0.6;
    const lowPass = audioContext.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.setValueAtTime(4_800, startTime);
    lowPass.frequency.exponentialRampToValueAtTime(1_900, startTime + duration);
    lowPass.Q.value = 0.5;
    const crackGain = audioContext.createGain();
    crackGain.gain.setValueAtTime(MINIMUM_GAIN, startTime);
    crackGain.gain.linearRampToValueAtTime(0.74 * strength, startTime + 0.006);
    crackGain.gain.exponentialRampToValueAtTime(0.18 * strength, startTime + 0.075);
    crackGain.gain.exponentialRampToValueAtTime(MINIMUM_GAIN, startTime + duration);
    const panner = audioContext.createStereoPanner();
    panner.pan.value = stereoPan;

    noise
      .connect(highPass)
      .connect(lowPass)
      .connect(crackGain)
      .connect(panner)
      .connect(destination);
    this.startSourceGroup(
      [noise],
      [highPass, lowPass, crackGain, panner],
      startTime,
      startTime + duration
    );
  }

  private playBody(
    audioContext: AudioContext,
    destination: AudioNode,
    startTime: number,
    strength: number,
    stereoPan: number
  ): void {
    const duration = 1.22;
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(132, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(46, startTime + duration);
    const upperBodyOscillator = audioContext.createOscillator();
    upperBodyOscillator.type = 'triangle';
    upperBodyOscillator.frequency.setValueAtTime(224, startTime);
    upperBodyOscillator.frequency.exponentialRampToValueAtTime(78, startTime + duration);
    const upperBodyGain = audioContext.createGain();
    upperBodyGain.gain.value = 0.19;
    const lowPass = audioContext.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 390;
    lowPass.Q.value = 0.7;
    const bodyGain = audioContext.createGain();
    bodyGain.gain.setValueAtTime(MINIMUM_GAIN, startTime);
    bodyGain.gain.linearRampToValueAtTime(0.59 * strength, startTime + 0.02);
    bodyGain.gain.exponentialRampToValueAtTime(0.23 * strength, startTime + 0.2);
    bodyGain.gain.exponentialRampToValueAtTime(MINIMUM_GAIN, startTime + duration);
    const panner = audioContext.createStereoPanner();
    panner.pan.value = stereoPan;

    oscillator.connect(lowPass).connect(bodyGain).connect(panner).connect(destination);
    upperBodyOscillator.connect(upperBodyGain).connect(lowPass);
    this.startSourceGroup(
      [oscillator, upperBodyOscillator],
      [upperBodyGain, lowPass, bodyGain, panner],
      startTime,
      startTime + duration
    );
  }

  private playRumble(
    audioContext: AudioContext,
    destination: AudioNode,
    startTime: number,
    strength: number,
    stereoPan: number,
    randomSeed: number,
    isHeroStrike: boolean
  ): void {
    const nextRandomValue = makeDeterministicRandom(randomSeed);
    const rollCount = isHeroStrike ? 5 : 3 + Math.floor(nextRandomValue() * 2);
    let rollOffsetSeconds = 0;

    for (let rollIndex = 0; rollIndex < rollCount; rollIndex++) {
      const rollStartTime = startTime + rollOffsetSeconds;
      const rollDuration =
        (isHeroStrike ? 1.18 : 0.96) + nextRandomValue() * (isHeroStrike ? 0.82 : 0.68);
      const rollStopTime = rollStartTime + rollDuration;
      const attackDuration = 0.045 + nextRandomValue() * 0.105;
      const crestDuration = 0.18 + nextRandomValue() * 0.24;
      const peakGain = strength * (0.19 + nextRandomValue() * 0.075) * (1 - rollIndex * 0.055);

      const noise = audioContext.createBufferSource();
      const rollNoiseSeed = randomSeed ^ Math.imul(rollIndex + 1, 0x85ebca6b);
      noise.buffer = makeNoiseBuffer(audioContext, rollDuration, rollNoiseSeed);
      const noiseLowPass = audioContext.createBiquadFilter();
      noiseLowPass.type = 'lowpass';
      noiseLowPass.frequency.setValueAtTime(265 + nextRandomValue() * 125, rollStartTime);
      noiseLowPass.frequency.exponentialRampToValueAtTime(
        78 + nextRandomValue() * 34,
        rollStopTime
      );
      noiseLowPass.Q.value = 0.72 + nextRandomValue() * 0.58;
      const noiseGain = audioContext.createGain();
      noiseGain.gain.value = 0.86;

      const fundamentalFrequency = (isHeroStrike ? 48 : 54) + nextRandomValue() * 14;
      const endingFundamentalFrequency = 32 + nextRandomValue() * 9;
      const fundamentalOscillator = audioContext.createOscillator();
      fundamentalOscillator.type = 'sine';
      fundamentalOscillator.frequency.setValueAtTime(fundamentalFrequency, rollStartTime);
      fundamentalOscillator.frequency.exponentialRampToValueAtTime(
        endingFundamentalFrequency,
        rollStopTime
      );
      const fundamentalGain = audioContext.createGain();
      fundamentalGain.gain.value = isHeroStrike ? 0.56 : 0.48;

      // This restrained octave-plus partial keeps the rumble audible on laptop speakers.
      const harmonicOscillator = audioContext.createOscillator();
      harmonicOscillator.type = 'triangle';
      harmonicOscillator.frequency.setValueAtTime(
        fundamentalFrequency * (2.05 + nextRandomValue() * 0.28),
        rollStartTime
      );
      harmonicOscillator.frequency.exponentialRampToValueAtTime(
        endingFundamentalFrequency * (2.1 + nextRandomValue() * 0.22),
        rollStopTime
      );
      const harmonicGain = audioContext.createGain();
      harmonicGain.gain.value = 0.17 + nextRandomValue() * 0.065;

      const rollGain = audioContext.createGain();
      rollGain.gain.setValueAtTime(MINIMUM_GAIN, rollStartTime);
      rollGain.gain.linearRampToValueAtTime(peakGain, rollStartTime + attackDuration);
      rollGain.gain.exponentialRampToValueAtTime(
        peakGain * (0.42 + nextRandomValue() * 0.18),
        rollStartTime + attackDuration + crestDuration
      );
      rollGain.gain.exponentialRampToValueAtTime(MINIMUM_GAIN, rollStopTime);
      const panner = audioContext.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, stereoPan + (nextRandomValue() - 0.5) * 0.18));

      noise.connect(noiseLowPass).connect(noiseGain).connect(rollGain);
      fundamentalOscillator.connect(fundamentalGain).connect(rollGain);
      harmonicOscillator.connect(harmonicGain).connect(rollGain);
      rollGain.connect(panner).connect(destination);
      this.startSourceGroup(
        [noise, fundamentalOscillator, harmonicOscillator],
        [noiseLowPass, noiseGain, fundamentalGain, harmonicGain, rollGain, panner],
        rollStartTime,
        rollStopTime
      );

      // Advance less than one roll's duration so neighboring rolls overlap naturally.
      rollOffsetSeconds += 0.31 + nextRandomValue() * (isHeroStrike ? 0.34 : 0.29);
    }
  }

  private startSourceGroup(
    sources: AudioScheduledSourceNode[],
    processorNodes: AudioNode[],
    startTime: number,
    stopTime: number
  ): void {
    for (const processorNode of processorNodes) {
      this.activeProcessorNodes.add(processorNode);
    }

    let remainingSourceCount = sources.length;
    for (const source of sources) {
      this.activeSources.add(source);
      source.addEventListener(
        'ended',
        () => {
          if (this.activeSources.delete(source)) {
            source.disconnect();
          }
          remainingSourceCount--;
          if (remainingSourceCount === 0) {
            this.disconnectProcessorNodes(processorNodes);
          }
        },
        {once: true}
      );
      source.start(startTime);
      source.stop(stopTime);
    }
  }

  private stopActiveSources(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // A source can already be stopped while its final `ended` event is still queued.
      }
      source.disconnect();
    }
    this.activeSources.clear();
    this.disconnectProcessorNodes(this.activeProcessorNodes);
  }

  private disconnectProcessorNodes(processorNodes: Iterable<AudioNode>): void {
    for (const processorNode of [...processorNodes]) {
      if (this.activeProcessorNodes.delete(processorNode)) {
        processorNode.disconnect();
      }
    }
  }
}

function makeMasterGain(audioContext: AudioContext): GainNode {
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0.96;
  const bassShelf = audioContext.createBiquadFilter();
  bassShelf.type = 'lowshelf';
  bassShelf.frequency.value = 175;
  bassShelf.gain.value = 5.5;
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -8;
  compressor.knee.value = 10;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.4;
  const outputGain = audioContext.createGain();
  outputGain.gain.value = 0.94;
  masterGain
    .connect(bassShelf)
    .connect(compressor)
    .connect(outputGain)
    .connect(audioContext.destination);
  return masterGain;
}

function makeNoiseBuffer(
  audioContext: AudioContext,
  durationSeconds: number,
  randomSeed: number
): AudioBuffer {
  const sampleCount = Math.ceil(audioContext.sampleRate * durationSeconds);
  const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
  const samples = buffer.getChannelData(0);
  let state = randomSeed >>> 0;
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    samples[sampleIndex] = ((state >>> 0) / 0x80000000 - 1) * 0.82;
  }
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
