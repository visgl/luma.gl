// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {ProjectionBounds, ProjectionPlan} from './types';

/** Stackless, depth-first nodes. Leaf ranges preserve canonical first-match patch order. */
export type ProjectionRoutingNode = {
  readonly bounds: ProjectionBounds;
  readonly escape: number;
  readonly firstPatch: number;
  readonly patchEnd: number;
};

export const PROJECTION_ROUTING_WORD_LENGTH = 8;

/**
 * Builds an optional broad-phase index without refitting or changing any coefficients.
 * Bounds are deliberately conservative Float32 envelopes, not validity domains. Every candidate
 * still uses the original patch test. Large global origins can reduce pruning, never precision.
 * Use measured scan/index comparisons before selecting this optimization.
 */
export function indexProjectionPlan(plan: ProjectionPlan): ProjectionPlan {
  const nodes: ProjectionRoutingNode[] = [];
  const buildNodes = (firstPatch: number, patchEnd: number): void => {
    const nodeIndex = nodes.length;
    const bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
    for (let patchIndex = firstPatch; patchIndex < patchEnd; patchIndex++) {
      const patch = plan.patches[patchIndex];
      for (let axis = 0; axis < 2; axis++) {
        // Covers conversion, normalization rounding and the evaluator's two-ULP seam tolerance.
        // The floor also covers subnormal coordinates. Infinite envelopes simply disable pruning.
        const padding =
          Math.max(
            Math.abs(patch.bounds[axis]),
            Math.abs(patch.bounds[axis + 2]),
            Math.abs(patch.sourceOrigin[axis]),
            patch.sourceScale[axis],
            1e-30
          ) *
          2 ** -18;
        bounds[axis] = Math.min(bounds[axis], Math.fround(patch.bounds[axis] - padding));
        bounds[axis + 2] = Math.max(
          bounds[axis + 2],
          Math.fround(patch.bounds[axis + 2] + padding)
        );
      }
    }
    const leaf = patchEnd - firstPatch <= 4;
    nodes.push({
      bounds,
      escape: 0,
      firstPatch,
      patchEnd: leaf ? patchEnd : firstPatch
    });
    if (!leaf) {
      const middle = Math.floor((firstPatch + patchEnd) / 2);
      buildNodes(firstPatch, middle);
      buildNodes(middle, patchEnd);
    }
    nodes[nodeIndex] = {...nodes[nodeIndex], escape: nodes.length};
  };
  if (!plan.patches.length) throw new Error('projection routing requires patches');
  buildNodes(0, plan.patches.length);
  return {...plan, routingIndex: nodes};
}

/** @internal */
export function packProjectionRouting(nodes: readonly ProjectionRoutingNode[]): Uint32Array {
  const words = new Uint32Array(nodes.length * PROJECTION_ROUTING_WORD_LENGTH);
  const floats = new Float32Array(words.buffer);
  nodes.forEach((node, index) => {
    const offset = index * PROJECTION_ROUTING_WORD_LENGTH;
    floats.set(node.bounds, offset);
    words[offset + 4] = node.escape;
    words[offset + 5] = node.firstPatch;
    words[offset + 6] = node.patchEnd;
  });
  return words;
}
