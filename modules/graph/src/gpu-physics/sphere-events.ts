// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type GPUSphereTrigger = {
  center: readonly [number, number, number];
  radius: number;
  capture?: boolean;
};

/** Impacts are emitted once per directed pair (the smaller body identifier owns it). */
export type GPUSphereEvent = {
  sequence: number;
  step: number;
  kind: 'sphere-impact' | 'plane-impact' | 'trigger' | 'trail';
  phase: 'begin' | 'impact';
  body: number;
  target: number;
  position: [number, number, number];
  /** Closing speed for impacts, zero for triggers and trail samples. */
  speed: number;
};
export type GPUSphereEventBatch = {
  sequence: number;
  dropped: number;
  /** Cumulative uint32 exhaustion count, retained across samples. */
  exhaustedImpactSteps: number;
  /** Cumulative discarded simulation seconds when impact budgets are exhausted. */
  discardedSimulationTime: number;
  events: GPUSphereEvent[];
};

/** Decode one coherent COPY_SRC snapshot. Sequence arithmetic wraps at uint32. */
export function decodeSphereEvents(words: Uint32Array, cursor = 0): GPUSphereEventBatch {
  const capacity = (words.length - 4) / 8;
  const sequence = words[0];
  const available = (sequence - cursor) >>> 0;
  const length = Math.min(available, capacity);
  const values = new Float32Array(words.buffer, words.byteOffset, words.length);
  const events: GPUSphereEvent[] = [];
  const kinds = ['sphere-impact', 'plane-impact', 'trigger', 'trail'] as const;
  for (let index = length; index > 0; index--) {
    const eventSequence = (sequence - index) >>> 0;
    const offset = 4 + (eventSequence % capacity) * 8;
    const packed = words[offset + 2];
    events.push({
      sequence: eventSequence,
      step: words[offset + 1],
      kind: kinds[packed >>> 24],
      phase: packed & 0x800000 ? 'begin' : 'impact',
      body: packed & 0x7fffff,
      target: words[offset + 3],
      position: [values[offset + 4], values[offset + 5], values[offset + 6]],
      speed: values[offset + 7]
    });
  }
  return {
    sequence,
    dropped: Math.max(0, available - capacity),
    exhaustedImpactSteps: words[1],
    discardedSimulationTime: values[2],
    events
  };
}
