// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {assert} from '@luma.gl/core';
import type {Projection} from '@math.gl/geospatial/projection/types';
import {GPUCPUOperation} from '../gpu-core/gpu-cpu-operation';
import {gpuGraph} from '../gpu-core/gpu-graph-value';

export type CPUProjectionOperationProps = {
  id: string;
  input: string;
  output: string;
  format: 'float32x2' | 'float32x3';
  projection: Pick<Projection, 'projectFlat'>;
};

/** Forward projection on the CPU with executor-managed GPU readback and upload. */
export class CPUProjectionOperation extends GPUCPUOperation {
  constructor(props: CPUProjectionOperationProps) {
    const dimension = props.format === 'float32x2' ? 2 : 3;
    super({
      id: props.id,
      inputs: {positions: props.input},
      outputs: {[props.output]: gpuGraph.vector(props.format)},
      async execute({inputs}) {
        const input = inputs['positions'];
        // Coordinates must match the declared packed Float32 dimension.
        assert(typeof input !== 'number' && input.format === props.format);
        return {
          [props.output]: {
            chunks: await Promise.all(
              input.chunks.map(async chunk => {
                assert(chunk.values instanceof Float32Array);
                const values = chunk.values.slice();
                return {
                  values: values.length
                    ? await props.projection.projectFlat(values, dimension)
                    : values
                };
              })
            )
          }
        };
      }
    });
  }
}
