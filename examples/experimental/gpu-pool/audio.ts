// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUSphereEvent} from '@luma.gl/gpu-graph/gpu-physics';

/** Small, asset-free contact sounds. Audio is optional and never controls game state. */
export class PoolAudio {
  enabled = true;
  private context?: AudioContext;
  private output?: GainNode;
  private noise?: AudioBuffer;
  private lastContact = new Map<number, number>();

  unlock(): void {
    if (!this.enabled) return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.output = this.context.createGain();
        this.output.gain.value = 0.32;
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -12;
        limiter.ratio.value = 8;
        this.output.connect(limiter).connect(this.context.destination);
        this.noise = this.context.createBuffer(
          1,
          Math.ceil(this.context.sampleRate * 0.18),
          this.context.sampleRate
        );
        const samples = this.noise.getChannelData(0);
        for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
      }
      void this.context.resume().catch(() => {});
    } catch {
      this.enabled = false;
    }
  }

  playCue(strength: number): void {
    this.playImpact(330, 0.5 + strength * 0.45, 0.045, -0.1);
  }

  playPocket(): void {
    this.playImpact(140, 0.5, 0.16, 0);
  }

  playEvents(events: readonly GPUSphereEvent[], now: number): void {
    if (!this.enabled) return;
    let contacts = 0;
    for (const event of events) {
      if (event.kind !== 'sphere-impact' && event.kind !== 'plane-impact') continue;
      const key = event.body * 1024 + event.target + (event.kind === 'plane-impact' ? 512 : 0);
      if (event.speed < 0.18 || now - (this.lastContact.get(key) ?? -1000) < 60) continue;
      this.lastContact.set(key, now);
      const sphere = event.kind === 'sphere-impact';
      this.playImpact(
        sphere ? 470 : 180,
        Math.min(0.8, 0.12 + event.speed * 0.1),
        sphere ? 0.045 : 0.065,
        event.position[0] / 7
      );
      if (++contacts >= 8) break;
    }
  }

  destroy(): void {
    void this.context?.close().catch(() => {});
    this.context = undefined;
  }

  private playImpact(frequency: number, strength: number, duration: number, pan: number): void {
    const context = this.context;
    if (!this.enabled || !context || context.state !== 'running' || !this.output || !this.noise)
      return;
    const now = context.currentTime;
    const stereo = context.createStereoPanner();
    stereo.pan.value = Math.max(-1, Math.min(1, pan));
    stereo.connect(this.output);
    const variation = 0.96 + Math.random() * 0.08;
    // Short, damped, inharmonic modes give the clack a body without a ringing pitch sweep.
    for (const [ratio, amplitude, decay] of [
      [0.45, 0.55, 1],
      [1, 0.6, 0.65],
      [1.73, 0.2, 0.35]
    ]) {
      const tone = context.createOscillator();
      tone.type = 'sine';
      tone.frequency.value = frequency * ratio * variation;
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(strength * amplitude, now + 0.0007);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration * decay);
      tone.connect(envelope).connect(stereo);
      tone.start(now);
      tone.stop(now + duration);
      tone.onended = () => {
        tone.disconnect();
        envelope.disconnect();
      };
    }
    // A broad, low-passed impulse supplies the hard contact edge; it decays before it can hiss.
    const noise = context.createBufferSource();
    noise.buffer = this.noise;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(2600, frequency * 5);
    filter.Q.value = 0.5;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(strength * 1.7, now);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
    noise.connect(filter).connect(envelope).connect(stereo);
    noise.start(now);
    noise.stop(now + duration + 0.005);
    noise.onended = () => {
      noise.disconnect();
      filter.disconnect();
      envelope.disconnect();
      stereo.disconnect();
    };
  }
}
