// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {ProjectionBuffer} from '@math.gl/projection/bulk';
import type {ProjectionInstance} from '@math.gl/projection/types';
import type {ProjectionCoordinates} from './types';
import type {ProjectionProgramCPUVariant} from './projection-program-cpu-benchmark';

/** Allocation-aware binary64 baselines for a retained, already prepared CPU transform. */
export function createCRSProjectionCPUBenchmarks(options: {
  projection: Pick<ProjectionInstance, 'projectToSync' | 'unprojectToSync' | 'projectFlatSync'>;
  /** Include the actual math.gl version in reproducible measurements. */
  provider: string;
  /** Same explicit domain predicate as the GPU benchmark's independent oracle. */
  isValid: (coordinate: ProjectionCoordinates) => boolean;
}): ProjectionProgramCPUVariant[] {
  return [
    'projectToSync',
    'projectFlatSync',
    'ProjectionBuffer.projectFlatTo',
    'ProjectionBuffer.projectColumnsTo',
    'ProjectionBuffer.projectFlatTo(stride=3)'
  ].map(api => ({
    api,
    layout:
      api === 'ProjectionBuffer.projectColumnsTo'
        ? 'columns'
        : api.endsWith('(stride=3)')
          ? 'interleaved-stride-3'
          : api === 'projectToSync'
            ? 'coordinate-pairs'
            : 'interleaved-stride-2',
    provider: options.provider,
    prepare(coordinates) {
      const count = coordinates.filter(options.isValid).length;
      const columnar = api === 'ProjectionBuffer.projectColumnsTo';
      const reusable = api === 'projectToSync';
      const stride = api.endsWith('(stride=3)') ? 3 : 2;
      const input = new Float64Array(
        columnar || reusable || api === 'projectFlatSync' ? 0 : count * stride
      );
      const projected = new Float64Array(columnar || reusable ? 0 : count * stride);
      const indices = new Uint32Array(reusable ? 0 : count);
      const scalar = new Float64Array(api === 'projectToSync' ? 2 : 0);
      const columns = columnar ? [new Float64Array(count), new Float64Array(count)] : [];
      const projectedColumns = columnar ? [new Float64Array(count), new Float64Array(count)] : [];
      const bulk = new ProjectionBuffer({
        projection: options.projection,
        dimension: 2,
        inputStride: columnar ? 1 : stride,
        outputStride: columnar ? 1 : stride
      });
      return {
        // Adapter-owned numeric buffers; excludes provider/ProjectionBuffer internal scratch.
        scratchByteLength:
          input.byteLength +
          projected.byteLength +
          indices.byteLength +
          scalar.byteLength +
          [...columns, ...projectedColumns].reduce((total, column) => total + column.byteLength, 0),
        execute(output) {
          output.positions.fill(0);
          output.validity.fill(0);
          if (reusable) {
            for (let row = 0; row < coordinates.length; row++) {
              const coordinate = coordinates[row];
              if (!options.isValid(coordinate)) continue;
              options.projection.projectToSync(coordinate, scalar);
              if (!Number.isFinite(scalar[0]) || !Number.isFinite(scalar[1]))
                throw new Error('CPU benchmark returned nonfinite coordinates');
              output.positions[2 * row] = scalar[0];
              output.positions[2 * row + 1] = scalar[1];
              output.validity[row] = 1;
            }
            return;
          }
          let validCount = 0;
          // Predicate, compaction and scatter are timed. Bulk coordinate failures propagate:
          // never interpret partially committed output as a successful batch.
          for (let row = 0; row < coordinates.length; row++) {
            const coordinate = coordinates[row];
            if (!options.isValid(coordinate)) continue;
            indices[validCount] = row;
            if (api === 'ProjectionBuffer.projectColumnsTo') {
              columns[0][validCount] = coordinate[0];
              columns[1][validCount] = coordinate[1];
            } else {
              const packed = api === 'projectFlatSync' ? projected : input;
              packed[stride * validCount] = coordinate[0];
              packed[stride * validCount + 1] = coordinate[1];
            }
            validCount++;
          }
          if (validCount !== count) throw new Error('CPU benchmark domain predicate changed');
          if (api === 'projectFlatSync') {
            options.projection.projectFlatSync(projected, 2);
          } else if (api.startsWith('ProjectionBuffer.projectFlatTo')) {
            bulk.projectFlatTo(input, projected, count);
          } else if (api === 'ProjectionBuffer.projectColumnsTo') {
            bulk.projectColumnsTo(columns, projectedColumns);
          }
          for (let index = 0; index < count; index++) {
            const first =
              api === 'ProjectionBuffer.projectColumnsTo'
                ? projectedColumns[0][index]
                : projected[stride * index];
            const second =
              api === 'ProjectionBuffer.projectColumnsTo'
                ? projectedColumns[1][index]
                : projected[stride * index + 1];
            if (!Number.isFinite(first) || !Number.isFinite(second))
              throw new Error('CPU benchmark returned nonfinite coordinates');
            const row = indices[index];
            output.positions[2 * row] = first;
            output.positions[2 * row + 1] = second;
            output.validity[row] = 1;
          }
        }
      };
    }
  }));
}
