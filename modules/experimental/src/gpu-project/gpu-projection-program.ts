// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {Buffer} from '@luma.gl/core';
import {
  getViewElementOffset,
  type GPUCommandGraph,
  type GraphDataView,
  type GraphVectorView,
  type GraphBufferUse
} from '@luma.gl/gpgpu/gpu-core';
import {
  addGeospatialPass,
  assertGraphOwnership,
  GEOSPATIAL_WORKGROUP_SIZE,
  getGeospatialDispatchLayout,
  getGeospatialInvocationIndexSource,
  getRowChunks,
  validateDisjointGeospatialViews,
  validateMatchingRows,
  validateRowView
} from '../geospatial/geospatial-utils';
import type {CompiledProjection, ProjectionInputFormat} from './projection-program';
import type {GPUProjectionValidity} from './gpu-projection';

export type GPUProjectionProgramProps = {
  id?: string;
  projection: CompiledProjection;
  positions: GraphDataView<ProjectionInputFormat> | GraphVectorView<ProjectionInputFormat>;
  output: GraphDataView<'float32x2' | 'float32x4'> | GraphVectorView<'float32x2' | 'float32x4'>;
  /** Invalid upstream rows remain invalid without evaluating the operation sequence. */
  inputValidity?: GPUProjectionValidity;
  validity?: GPUProjectionValidity;
};

/** Materializes the same callable shader exposed by CompiledProjection, once per source chunk. */
export class GPUProjectionProgram {
  readonly id: string;
  private projection: CompiledProjection;
  private readonly props: GPUProjectionProgramProps;
  private parameterBuffer?: Buffer;
  private registered = false;
  private destroyed = false;

  constructor(props: GPUProjectionProgramProps) {
    this.id = props.id ?? 'gpu-projection-program';
    this.props = {...props};
    this.projection = props.projection;
    validateRowView(props.positions, [props.projection.inputFormat], `${this.id} positions`);
    validateRowView(
      props.output,
      [props.projection.precision === 'double-single' ? 'float32x4' : 'float32x2'],
      `${this.id} output`
    );
    validateMatchingRows(props.positions, props.output, `${this.id} positions and output`);
    for (const validity of [props.inputValidity, props.validity]) {
      if (validity) {
        validateRowView(validity, ['uint32'], `${this.id} validity`);
        validateMatchingRows(props.positions, validity, `${this.id} positions and validity`);
      }
    }
    validateDisjointGeospatialViews(
      this.id,
      [
        ['positions', props.positions],
        ...(props.inputValidity ? [['input validity', props.inputValidity] as const] : [])
      ],
      [['output', props.output], ...(props.validity ? [['validity', props.validity] as const] : [])]
    );
  }

  /** Writes only parameters; consumers retain their shader, bindings, and graph topology. */
  updateProjection(projection: CompiledProjection): void {
    this.assertAvailable();
    if (!this.projection.isCompatible(projection)) {
      throw new Error('projection updates must retain the compiled operation layout');
    }
    this.parameterBuffer?.write(projection.packParameters());
    this.projection = projection;
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    this.assertAvailable();
    if (this.registered) {
      throw new Error('projection program is already registered');
    }
    const {positions, output, inputValidity, validity} = this.props;
    assertGraphOwnership(
      graph,
      [
        positions,
        output,
        ...(inputValidity ? [inputValidity] : []),
        ...(validity ? [validity] : [])
      ],
      this.id
    );
    const parameters = this.projection.packParameters();
    this.parameterBuffer = graph.device.createBuffer({
      id: `${this.id}-parameters`,
      data: parameters,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const handle = graph.importBuffer(
      {
        id: `${this.id}-parameters`,
        byteLength: parameters.byteLength,
        usage: this.parameterBuffer.usage
      },
      this.parameterBuffer
    );
    const parameterView = graph.createDataView(handle, {
      format: 'uint32',
      length: parameters.length
    });
    const shader = this.projection.getShader();
    const outputChunks = getRowChunks(output);
    const inputValidityChunks = inputValidity ? getRowChunks(inputValidity) : undefined;
    const validityChunks = validity ? getRowChunks(validity) : undefined;
    for (const [chunkIndex, input] of getRowChunks(positions).entries()) {
      if (input.length === 0) {
        continue;
      }
      const destination = outputChunks[chunkIndex];
      const sourceValidity = inputValidityChunks?.[chunkIndex];
      const destinationValidity = validityChunks?.[chunkIndex];
      const inputWidth = input.format === 'float32x2' ? 2 : 4;
      const outputWidth = destination.format === 'float32x2' ? 2 : 4;
      const bindings: Record<string, GraphDataView> = {
        [shader.bindingName]: parameterView,
        positions: input,
        outputPositions: destination
      };
      const resources: GraphBufferUse[] = [
        {buffer: input, usage: 'storage-read'},
        {buffer: destination, usage: 'storage-write'},
        {buffer: parameterView, usage: 'storage-read'}
      ];
      if (sourceValidity) {
        bindings['inputValidity'] = sourceValidity;
        resources.push({buffer: sourceValidity, usage: 'storage-read'});
      }
      if (destinationValidity) {
        bindings['outputValidity'] = destinationValidity;
        resources.push({buffer: destinationValidity, usage: 'storage-write'});
      }
      const dispatchLayout = getGeospatialDispatchLayout(
        input.length,
        graph.device.limits.maxComputeWorkgroupsPerDimension
      );
      addGeospatialPass(graph, {
        id: `${this.id}-chunk-${chunkIndex}`,
        bindings,
        resources,
        dispatchLayout,
        precise: true,
        source: `
${shader.source}
@group(0) @binding(auto) var<storage, read> positions: array<${shader.inputType}>;
@group(0) @binding(auto) var<storage, read_write> outputPositions: array<${shader.outputType}>;
${sourceValidity ? '@group(0) @binding(auto) var<storage, read> inputValidity: array<u32>;' : ''}
${destinationValidity ? '@group(0) @binding(auto) var<storage, read_write> outputValidity: array<u32>;' : ''}
@compute @workgroup_size(${GEOSPATIAL_WORKGROUP_SIZE})
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_id) localId: vec3u) {
  ${getGeospatialInvocationIndexSource(dispatchLayout)}
  if (index >= ${input.length}u) { return; }
  let result = ${shader.entryPoint}(positions[${getViewElementOffset(input) / inputWidth}u + index], ${sourceValidity ? `inputValidity[${getViewElementOffset(sourceValidity)}u + index]` : '1u'});
  outputPositions[${getViewElementOffset(destination) / outputWidth}u + index] = result.position;
  ${destinationValidity ? `outputValidity[${getViewElementOffset(destinationValidity)}u + index] = result.valid;` : ''}
}`
      });
    }
    this.registered = true;
  }

  /** Only the internally allocated parameter storage is owned by this contributor. */
  destroy(): void {
    if (!this.destroyed) {
      this.parameterBuffer?.destroy();
      this.parameterBuffer = undefined;
      this.destroyed = true;
    }
  }

  private assertAvailable(): void {
    if (this.destroyed) {
      throw new Error('projection program has been destroyed');
    }
  }
}
