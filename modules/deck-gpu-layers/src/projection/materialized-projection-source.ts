// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUVector} from '@luma.gl/graph/gpu-data';
import type {ProjectionRenderTransform} from '@luma.gl/graph/gpu-project-crs';

/** Borrowed inputs for drawing and picking retained two-dimensional projected positions. */
export type MaterializedProjectionOutput = {
  /** Origin-relative float32 positions in physical input chunk order. */
  readonly positions: GPUVector<'float32x2'>;
  /** Chunk-aligned mask. Zero means invalid and its position is unspecified. */
  readonly validity: GPUVector<'uint32'>;
  /** Fixed projection and local frame, also usable for CPU metadata on a picked row. */
  readonly transform: ProjectionRenderTransform;
};

/**
 * Owns the output buffers and compute resources for one fixed input topology and render frame.
 * Input storage stays caller-owned. Write into existing buffers before updating; build a new
 * source to replace input buffers, change chunk boundaries, or change the frame.
 */
export type MaterializedProjectionSource = MaterializedProjectionOutput & {
  /**
   * Enqueues projection on the source device, in queue order. Omit the list to update all
   * nonempty chunks. Duplicate indices are ignored, empty chunks retain their index, and an invalid
   * index rejects the entire call before submission. Call once before drawing populated output.
   * The output descriptors and buffers keep their identity across updates.
   */
  updateChunks(indices?: readonly number[]): void;
  /**
   * Idempotently releases owned resources. Detach consumers and finish outstanding GPU work first.
   * Subsequent updates throw. Borrowed input storage remains caller-owned.
   */
  destroy(): void;
};
