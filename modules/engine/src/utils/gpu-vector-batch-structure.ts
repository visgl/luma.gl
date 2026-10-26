// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';

/** Row metadata required to validate chunk alignment without consuming GPU storage. */
export type GPUVectorBatchStructureInput =
  | {
      readonly length: number;
      readonly data: readonly {readonly length: number}[];
    }
  | {readonly isConstant: true};

/** Checks logical row counts and preserved chunk boundaries; constants broadcast over all batches. */
export function validateGPUVectorBatchStructure(
  vectors:
    | Readonly<Record<string, GPUVectorBatchStructureInput | undefined>>
    | readonly (GPUVectorBatchStructureInput | undefined)[]
): void {
  let reference: Exclude<GPUVectorBatchStructureInput, {readonly isConstant: true}> | undefined;
  for (const vector of Object.values(vectors)) {
    if (!vector || 'isConstant' in vector) continue;
    let rowCount = 0;
    for (const chunk of vector.data) rowCount += chunk.length;
    // Chunk rows must account for the vector's complete logical length.
    assert(rowCount === vector.length);
    if (reference) {
      // Varying columns must preserve the same rows and physical batch boundaries.
      assert(vector.length === reference.length && vector.data.length === reference.data.length);
      for (let batchIndex = 0; batchIndex < vector.data.length; batchIndex++) {
        assert(vector.data[batchIndex].length === reference.data[batchIndex].length);
      }
    } else reference = vector;
  }
}
