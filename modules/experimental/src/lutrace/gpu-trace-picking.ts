// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';

/**
 * Generates a bounded WebGPU compute shader that picks visible canonical spans by time and lane.
 *
 * The generated entry point expects five storage bindings in bind group zero:
 *
 * - Binding 0: packed eight-word canonical trace span records.
 * - Binding 1: exclusive-scanned effective thread offsets from `GPUTraceInteraction`.
 * - Binding 2: source-aligned final visibility mask from the same interaction state.
 * - Binding 3: `{time: f32, lane: f32, active: u32, padding: u32}` pick request.
 * - Binding 4: one `atomic<u32>` result initialized by the caller to `0xffffffff`.
 *
 * A matching visible span atomically minimizes the result to its canonical source-row index. The
 * result is neither a compacted display position nor the application's stable object identity.
 * Inactive requests, hidden rows, and coordinates outside a visible span leave the sentinel intact.
 * The caller owns dispatch, synchronization, queue submission, and optional asynchronous readback.
 *
 * @param spanCount - Nonnegative number of canonical source rows compiled into the WGSL bound.
 * @param lanesPerThread - Positive original lane count used to reconstruct effective display rows.
 * @returns WGSL source with a `main` compute entry point and a fixed 256-invocation workgroup.
 *
 * @example
 * ```ts
 * import {getGPUTracePickingShader} from '@luma.gl/experimental/lutrace';
 *
 * const source = getGPUTracePickingShader(trace.stats.spanCount, 4);
 * const shader = device.createShader({stage: 'compute', source});
 * ```
 */
export function getGPUTracePickingShader(spanCount: number, lanesPerThread: number): string {
  // A generated WGSL literal must describe a valid nonnegative canonical span capacity.
  assert(Number.isSafeInteger(spanCount) && spanCount >= 0);
  // Effective lane projection requires a positive fixed number of lanes per thread.
  assert(Number.isSafeInteger(lanesPerThread) && lanesPerThread > 0);

  return /* wgsl */ `
struct PickRequest {
  time: f32,
  lane: f32,
  active: u32,
  padding: u32,
};

@group(0) @binding(0) var<storage, read> spans: array<vec4<u32>>;
@group(0) @binding(1) var<storage, read> threadOffsets: array<u32>;
@group(0) @binding(2) var<storage, read> visibleMask: array<u32>;
@group(0) @binding(3) var<storage, read> request: PickRequest;
@group(0) @binding(4) var<storage, read_write> result: atomic<u32>;

@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) globalId: vec3u) {
  let sourceIndex = globalId.x;
  if (sourceIndex >= ${spanCount}u || request.active == 0u || visibleMask[sourceIndex] == 0u) {
    return;
  }
  let timing = spans[sourceIndex * 2u];
  let ownership = spans[sourceIndex * 2u + 1u];
  let start = bitcast<f32>(timing.x);
  let duration = bitcast<f32>(timing.y);
  let lane = f32(threadOffsets[ownership.y] + timing.z % ${lanesPerThread}u);
  if (request.time >= start && request.time <= start + duration &&
      request.lane >= lane && request.lane < lane + 1.0) {
    atomicMin(&result, sourceIndex);
  }
}`;
}
