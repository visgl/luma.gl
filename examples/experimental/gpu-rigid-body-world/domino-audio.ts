// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GPURigidBodyContactEvent} from '@luma.gl/graph/gpu-physics';

const IMPACT_URLS = [
  new URL('./audio/impactPlate_light_000.ogg', import.meta.url),
  new URL('./audio/impactPlate_light_001.ogg', import.meta.url),
  new URL('./audio/impactPlate_light_002.ogg', import.meta.url)
];

/** Recorded CC0 hard-surface impacts. No oscillators, pitch shifts or synthesized bass. */
export class DominoAudio {
  enabled = false;
  private context?: AudioContext;
  private samples: AudioBuffer[] = [];
  private loading?: Promise<void>;
  private soundedBodies = new Set<number>();

  unlock(): void {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      const context = this.context;
      void context.resume().catch(() => {});
      this.loading ??= Promise.all(
        IMPACT_URLS.map(async url => {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Audio unavailable');
          const recording = await context.decodeAudioData(await response.arrayBuffer());
          // Keep only the initial contact transient, discarding the resonant plate tail.
          const samples = recording.getChannelData(0);
          let peak = 0;
          for (const value of samples) peak = Math.max(peak, Math.abs(value));
          let onset = 0;
          while (onset < samples.length && Math.abs(samples[onset]) < peak * 0.12) onset++;
          onset = Math.max(0, onset - Math.ceil(context.sampleRate * 0.0005));
          const clack = context.createBuffer(
            1,
            Math.ceil(context.sampleRate * 0.018),
            context.sampleRate
          );
          const output = clack.getChannelData(0);
          for (let index = 0; index < output.length; index++) {
            const time = index / context.sampleRate;
            output[index] =
              ((samples[onset + index] ?? 0) / Math.max(peak, 0.001)) *
              Math.min(1, time / 0.0004) *
              Math.exp(-time / 0.0035);
          }
          return clack;
        })
      )
        .then(samples => {
          this.samples = samples;
        })
        .catch(() => {
          this.loading = undefined;
        });
    } catch {
      this.enabled = false;
    }
  }

  play(events: readonly GPURigidBodyContactEvent[]): void {
    const context = this.context;
    if (!this.enabled || !context || context.state !== 'running' || !this.samples.length) return;
    let voices = 0;
    for (const event of events) {
      if (event.phase === 'end' || event.normalImpulse < 0.15 || event.bodies.includes(0)) continue;
      // Base support impulses must not consume a standing tile's one sound for this replay.
      const body = event.bodies[0];
      if (this.soundedBodies.has(body) || voices >= 6) continue;
      this.soundedBodies.add(body);
      voices++;
      const now = context.currentTime;
      const gain = context.createGain();
      const amplitude = Math.min(0.12, Math.sqrt(event.normalImpulse) * 0.07);
      gain.gain.setValueAtTime(amplitude, now);
      gain.gain.setValueAtTime(amplitude, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
      const source = context.createBufferSource();
      source.buffer = this.samples[body % this.samples.length];
      const filter = context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 700;
      filter.Q.value = 0.5;
      source.connect(filter).connect(gain).connect(context.destination);
      source.start(now);
      source.stop(now + 0.02);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    }
  }
  reset(): void {
    this.soundedBodies.clear();
  }
  destroy(): void {
    void this.context?.close().catch(() => {});
  }
}
