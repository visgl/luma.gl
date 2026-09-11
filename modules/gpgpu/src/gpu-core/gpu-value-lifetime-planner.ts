// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUValueFormat} from './gpu-value-arena';

/** Inclusive graph-node lifetime for one small GPU value. */
export type GPUValueLifetime = {
  /** First dependency-ordered graph node that may access the value. */
  firstNode: number;
  /** Last dependency-ordered graph node that may access the value. */
  lastNode: number;
};

export type GPUValueLifetimeRequest = {
  id: string;
  format: GPUValueFormat;
  lifetime: GPUValueLifetime;
};

export type GPUValueLifetimeAllocation = GPUValueLifetimeRequest & {
  /** Byte offset inside the packed graph value arena. */
  byteOffset: number;
};

export type GPUValueLifetimePlan = {
  /** Exact packed arena size required after lifetime reuse. */
  byteLength: number;
  /** Per-value offsets assigned by the planner. */
  allocations: readonly Readonly<GPUValueLifetimeAllocation>[];
  /** Number of logical values sharing already-used physical slots. */
  reusedSlotCount: number;
};

/**
 * Assigns 32-bit arena slots using interval reuse.
 *
 * Values whose graph-node lifetimes do not overlap can occupy the same physical 4-byte slot. The
 * algorithm is a small linear-scan allocator: expire dead intervals, reuse the lowest available
 * word, otherwise extend the arena.
 */
export function planGPUValueLifetimes(requests: readonly GPUValueLifetimeRequest[]): GPUValueLifetimePlan {
  validateRequests(requests);
  const ordered = [...requests].sort(
    (a, b) => a.lifetime.firstNode - b.lifetime.firstNode || a.lifetime.lastNode - b.lifetime.lastNode
  );
  const active: Array<{lastNode: number; wordOffset: number}> = [];
  const freeWords: number[] = [];
  const allocations: GPUValueLifetimeAllocation[] = [];
  let nextWord = 0;
  let reusedSlotCount = 0;

  for (const request of ordered) {
    for (let index = active.length - 1; index >= 0; index--) {
      if (active[index].lastNode < request.lifetime.firstNode) {
        freeWords.push(active[index].wordOffset);
        active.splice(index, 1);
      }
    }
    freeWords.sort((a, b) => a - b);
    const reused = freeWords.length > 0;
    const wordOffset = reused ? freeWords.shift()! : nextWord++;
    if (reused) reusedSlotCount++;
    active.push({lastNode: request.lifetime.lastNode, wordOffset});
    allocations.push({...request, byteOffset: wordOffset * 4});
  }

  allocations.sort((a, b) => requests.findIndex(request => request.id === a.id) - requests.findIndex(request => request.id === b.id));
  return Object.freeze({
    byteLength: nextWord * 4,
    allocations: Object.freeze(allocations.map(allocation => Object.freeze(allocation))),
    reusedSlotCount
  });
}

function validateRequests(requests: readonly GPUValueLifetimeRequest[]): void {
  const ids = new Set<string>();
  for (const request of requests) {
    if (!request.id) throw new Error('GPU value lifetime id must not be empty');
    if (ids.has(request.id)) throw new Error(`duplicate GPU value lifetime id "${request.id}"`);
    ids.add(request.id);
    if (!['float32', 'uint32', 'sint32'].includes(request.format)) {
      throw new Error(`unsupported GPU value format ${request.format}`);
    }
    const {firstNode, lastNode} = request.lifetime;
    if (!Number.isSafeInteger(firstNode) || !Number.isSafeInteger(lastNode) || firstNode < 0 || lastNode < firstNode) {
      throw new Error(`invalid lifetime for GPU value "${request.id}"`);
    }
  }
}
