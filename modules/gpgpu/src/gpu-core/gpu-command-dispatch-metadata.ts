// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Concrete direct-dispatch geometry retained outside the public command-node contract. */
export type GPUComputeDispatchWorkgroups = readonly [number, number, number];

const dispatchGeometry = new WeakMap<object, GPUComputeDispatchWorkgroups>();

/**
 * Annotates a compute-node descriptor with the direct workgroup geometry its encode callback emits.
 * Backend compilers use this to replace that direct dispatch with a predicate-controlled indirect
 * dispatch without guessing dimensions from workload estimates.
 */
export function setGPUComputeDispatchWorkgroups<T extends object>(
  node: T,
  workgroups: GPUComputeDispatchWorkgroups
): T {
  const [x, y, z] = workgroups;
  for (const [name, value] of [['x', x], ['y', y], ['z', z]] as const) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`compute dispatch ${name} workgroup count must be a non-negative safe integer`);
    }
  }
  dispatchGeometry.set(node, Object.freeze([x, y, z]));
  return node;
}

/** @internal Returns exact direct-dispatch geometry when an operation supplied it. */
export function getGPUComputeDispatchWorkgroups(
  node: object
): GPUComputeDispatchWorkgroups | undefined {
  return dispatchGeometry.get(node);
}
