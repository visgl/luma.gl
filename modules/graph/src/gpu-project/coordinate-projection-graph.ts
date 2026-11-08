// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {assert, type Device} from '@luma.gl/core';
import {CPUVector, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUSimpleGraph} from '../gpu-simple-graph/gpu-simple-graph';
import {GPUGraph} from '../gpu-core/gpu-graph';
import type {CompiledGPUGraph} from '../gpu-core/compiled-gpu-graph';
import type {CompiledGPUSimpleExpressionGraph} from '../gpu-simple-graph/compiled-gpu-expression-graph';
import {gpuGraph} from '../gpu-core/gpu-graph-value';
import {CPUProjectionOperation, type CPUProjectionOperationProps} from './cpu-projection-operation';

export type CoordinateProjectionGraphProps = {
  format: 'float32x2' | 'float32x3';
  projection: CPUProjectionOperationProps['projection'];
};
export type ProjectedCoordinateResult = {
  positions: GPUVector;
  /** Release this invocation's GPU result after downstream consumers finish. */
  destroy(): void;
};

/** Reusable layer-facing point-coordinate pipeline. Projection loading remains caller-owned. */
export class CoordinateProjectionGraph {
  private readonly graph: CompiledGPUGraph | CompiledGPUSimpleExpressionGraph;
  readonly format: CoordinateProjectionGraphProps['format'];

  constructor(device: Device, props: CoordinateProjectionGraphProps) {
    this.format = props.format;
    const graph = device.type === 'webgpu' ? new GPUGraph() : new GPUSimpleGraph();
    graph.addInput('source', gpuGraph.vector(props.format));
    graph.add(
      new CPUProjectionOperation({
        id: 'project-coordinates',
        input: 'source',
        output: 'positions',
        format: props.format,
        projection: props.projection
      })
    );
    this.graph = graph.compile(device, {outputs: ['positions']});
  }

  /** Borrow input storage and preserve row/chunk boundaries; each result owns independent storage. */
  async run(source: CPUVector | GPUVector): Promise<ProjectedCoordinateResult> {
    assert(source.format === this.format);
    // Point layers must handle null filtering before this numeric projection boundary.
    assert(source.data.every(chunk => !chunk.nullBitmap && !chunk.valueOffsets));
    const {positions} = await this.graph.run({inputs: {source}});
    return {positions, destroy: () => positions.destroy()};
  }

  /** Destroy the compiled pipeline. Previously returned results remain caller-owned. */
  destroy(): void {
    this.graph.destroy();
  }
}
