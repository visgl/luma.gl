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
  private sources = new Set<AudioBufferSourceNode>();
  private timelineOrigin?: number;
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

  play(
    events: readonly GPURigidBodyContactEvent[],
    timeStep = 1 / 60,
    simulationStep = events.at(-1)?.step ?? 0
  ): void {
    const context = this.context;
    if (!this.enabled || !context || context.state !== 'running' || !this.samples.length) return;
    const contacts = events.filter(
      event =>
        event.phase !== 'end' &&
        event.normalImpulse >= 0.015 &&
        !event.bodies.includes(0) &&
        !this.soundedBodies.has(Math.max(...event.bodies))
    );
    if (!contacts.length) return;
    const earliestStep = Math.min(...contacts.map(event => event.step));
    const now = context.currentTime;
    if (
      this.timelineOrigin === undefined ||
      now - (this.timelineOrigin + simulationStep * timeStep) > 0.2
    ) {
      this.timelineOrigin = now + 0.02 - earliestStep * timeStep;
    }
    for (const event of events) {
      if (event.phase === 'end' || event.normalImpulse < 0.015 || event.bodies.includes(0))
        continue;
      // Adjacent tile impacts identify the struck domino; base support never consumes its clack.
      const body = Math.max(...event.bodies);
      if (this.soundedBodies.has(body)) continue;
      this.soundedBodies.add(body);
      const scheduledTime = Math.max(now + 0.005, this.timelineOrigin + event.step * timeStep);
      const gain = context.createGain();
      const amplitude = Math.min(0.12, 0.05 + Math.sqrt(event.normalImpulse) * 0.04);
      gain.gain.setValueAtTime(amplitude, scheduledTime);
      gain.gain.setValueAtTime(amplitude, scheduledTime + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, scheduledTime + 0.018);
      const source = context.createBufferSource();
      source.buffer = this.samples[body % this.samples.length];
      const filter = context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 700;
      filter.Q.value = 0.5;
      source.connect(filter).connect(gain).connect(context.destination);
      this.sources.add(source);
      source.start(scheduledTime);
      source.stop(scheduledTime + 0.02);
      source.onended = () => {
        this.sources.delete(source);
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    }
  }
  silence(): void {
    for (const source of this.sources) source.stop();
    this.sources.clear();
  }
  reset(): void {
    this.silence();
    this.soundedBodies.clear();
    this.timelineOrigin = undefined;
  }
  destroy(): void {
    this.silence();
    void this.context?.close().catch(() => {});
  }
}
