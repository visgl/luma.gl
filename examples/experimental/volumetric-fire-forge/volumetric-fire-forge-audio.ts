// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type VolumetricFireForgeSoundOptions = {
  intensity: number;
  distance: number;
  pan: number;
};

export type VolumetricFireForgeSoundProfile = {
  peakGain: number;
  lowPassFrequencyHertz: number;
  subFrequencyHertz: number;
  tailSeconds: number;
  pan: number;
};

type ActiveVoice = {
  stop: () => void;
};

/** Pure distance/intensity mapping shared by synthesis and node tests. */
export function makeVolumetricFireForgeSoundProfile({
  intensity,
  distance,
  pan
}: VolumetricFireForgeSoundOptions): VolumetricFireForgeSoundProfile {
  const safeIntensity = Math.min(Math.max(Number.isFinite(intensity) ? intensity : 0, 0), 1.6);
  const safeDistance = Math.max(Number.isFinite(distance) ? distance : 0, 0);
  const normalizedDistance = Math.min(safeDistance / 24, 1);
  const distanceGain = 1 / (1 + normalizedDistance * normalizedDistance * 1.8);
  return {
    peakGain: (0.105 + safeIntensity * 0.095) * distanceGain,
    lowPassFrequencyHertz: 155 + safeIntensity * 42,
    subFrequencyHertz: 42 + safeIntensity * 7,
    tailSeconds: 1.65 + safeIntensity * 0.48,
    pan: Math.min(Math.max(Number.isFinite(pan) ? pan : 0, -1), 1)
  };
}

/** Reference amplitude used to keep the generated whoomph free of sharp transients. */
export function getVolumetricFireForgeSoundEnvelope(
  elapsedSeconds: number,
  tailSeconds: number
): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0 || tailSeconds <= 0) {
    return 0;
  }
  const attackSeconds = 0.055;
  if (elapsedSeconds < attackSeconds) {
    const attack = elapsedSeconds / attackSeconds;
    return attack * attack * (3 - 2 * attack);
  }
  if (elapsedSeconds >= tailSeconds) {
    return 0;
  }
  const decay = (elapsedSeconds - attackSeconds) / (tailSeconds - attackSeconds);
  const rollingTail = 1 + 0.1 * Math.sin(decay * Math.PI * 5.5) * (1 - decay);
  return Math.exp(-3.1 * decay) * rollingTail * (1 - decay);
}

/** Lazily owns Web Audio so construction never trips autoplay restrictions. */
export class VolumetricFireForgeAudio {
  muted = false;

  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private unlocked = false;
  private readonly activeVoices = new Set<ActiveVoice>();

  get isUnlocked(): boolean {
    return this.unlocked && this.audioContext?.state === 'running';
  }

  async arm(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }
    const AudioContextConstructor =
      window.AudioContext ||
      (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
    if (!AudioContextConstructor) {
      return false;
    }
    if (!this.audioContext) {
      this.audioContext = new AudioContextConstructor();
      this.masterGain = this.audioContext.createGain();
      this.masterCompressor = this.audioContext.createDynamicsCompressor();
      this.masterGain.gain.value = 0.78;
      this.masterCompressor.threshold.value = -18;
      this.masterCompressor.knee.value = 12;
      this.masterCompressor.ratio.value = 4;
      this.masterCompressor.attack.value = 0.012;
      this.masterCompressor.release.value = 0.26;
      this.masterGain.connect(this.masterCompressor).connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        return false;
      }
    }
    this.unlocked = this.audioContext.state === 'running';
    return this.unlocked;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  playAutomaticFlare(options: VolumetricFireForgeSoundOptions): void {
    if (!this.isUnlocked || this.muted) {
      return;
    }
    this.synthesize(options);
  }

  playClickedFlare(options: VolumetricFireForgeSoundOptions): void {
    if (this.muted) {
      return;
    }
    void this.arm().then(unlocked => {
      if (unlocked && !this.muted) {
        this.synthesize(options);
      }
    });
  }

  destroy(): void {
    for (const voice of this.activeVoices) {
      voice.stop();
    }
    this.activeVoices.clear();
    const audioContext = this.audioContext;
    this.masterGain?.disconnect();
    this.masterCompressor?.disconnect();
    this.masterGain = null;
    this.masterCompressor = null;
    this.audioContext = null;
    this.unlocked = false;
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close();
    }
  }

  private synthesize(options: VolumetricFireForgeSoundOptions): void {
    const audioContext = this.audioContext;
    const masterGain = this.masterGain;
    if (!audioContext || !masterGain || audioContext.state !== 'running') {
      return;
    }
    if (this.activeVoices.size >= 3) {
      this.activeVoices.values().next().value?.stop();
    }
    const profile = makeVolumetricFireForgeSoundProfile(options);
    const startTime = audioContext.currentTime + 0.006;
    const endTime = startTime + profile.tailSeconds;
    const noiseSource = audioContext.createBufferSource();
    const noiseFilter = audioContext.createBiquadFilter();
    const noiseGain = audioContext.createGain();
    const subOscillator = audioContext.createOscillator();
    const subGain = audioContext.createGain();
    const stereoPanner = audioContext.createStereoPanner();

    const frameCount = Math.max(1, Math.ceil(audioContext.sampleRate * profile.tailSeconds));
    const noiseBuffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    let previousNoise = 0;
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      const whiteNoise = Math.random() * 2 - 1;
      previousNoise = previousNoise * 0.84 + whiteNoise * 0.16;
      noiseData[frameIndex] = previousNoise;
    }
    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(profile.lowPassFrequencyHertz, startTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(92, endTime);
    noiseFilter.Q.setValueAtTime(0.72, startTime);
    stereoPanner.pan.setValueAtTime(profile.pan, startTime);

    noiseGain.gain.setValueAtTime(0, startTime);
    noiseGain.gain.linearRampToValueAtTime(profile.peakGain, startTime + 0.055);
    const tailSampleCount = 24;
    for (let sampleIndex = 1; sampleIndex <= tailSampleCount; sampleIndex++) {
      const elapsedSeconds =
        0.055 + ((profile.tailSeconds - 0.055) * sampleIndex) / tailSampleCount;
      noiseGain.gain.linearRampToValueAtTime(
        profile.peakGain * getVolumetricFireForgeSoundEnvelope(elapsedSeconds, profile.tailSeconds),
        startTime + elapsedSeconds
      );
    }

    subOscillator.type = 'sine';
    subOscillator.frequency.setValueAtTime(profile.subFrequencyHertz * 1.24, startTime);
    subOscillator.frequency.exponentialRampToValueAtTime(
      profile.subFrequencyHertz * 0.82,
      Math.min(endTime, startTime + 1.35)
    );
    subGain.gain.setValueAtTime(0, startTime);
    subGain.gain.linearRampToValueAtTime(profile.peakGain * 0.72, startTime + 0.048);
    subGain.gain.exponentialRampToValueAtTime(0.0001, Math.min(endTime, startTime + 1.42));

    noiseSource.connect(noiseFilter).connect(noiseGain).connect(stereoPanner);
    subOscillator.connect(subGain).connect(stereoPanner);
    stereoPanner.connect(masterGain);

    let stopped = false;
    const voice: ActiveVoice = {
      stop: () => {
        if (stopped) {
          return;
        }
        stopped = true;
        try {
          noiseSource.stop();
        } catch {}
        try {
          subOscillator.stop();
        } catch {}
        noiseSource.disconnect();
        noiseFilter.disconnect();
        noiseGain.disconnect();
        subOscillator.disconnect();
        subGain.disconnect();
        stereoPanner.disconnect();
        this.activeVoices.delete(voice);
      }
    };
    this.activeVoices.add(voice);
    subOscillator.onended = voice.stop;
    noiseSource.start(startTime);
    subOscillator.start(startTime);
    noiseSource.stop(endTime);
    subOscillator.stop(endTime);
  }
}
