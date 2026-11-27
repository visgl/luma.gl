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
} from '@luma.gl/graph/gpu-core';
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
import type {
  CompiledProjection,
  ProjectionInputFormat,
  ProjectionShader
} from './projection-program';
import type {GPUProjectionValidity} from './gpu-projection';

export type GPUProjectionProgramProps = {
  id?: string;
  projection: CompiledProjection;
  positions: GraphDataView<ProjectionInputFormat> | GraphVectorView<ProjectionInputFormat>;
  output: GraphDataView<'float32x2' | 'float32x4'> | GraphVectorView<'float32x2' | 'float32x4'>;
  /** Invalid upstream rows remain invalid without evaluating the operation sequence. */
  inputValidity?: GPUProjectionValidity;
  validity?: GPUProjectionValidity;
  /** Opt in to pairing nonempty vector chunks when the device has at least nine storage bindings. */
  groupChunks?: boolean;
};

/** Aligned graph views describing one physical projection chunk. */
type ProjectionChunk = {
  /** Original physical chunk index, including preceding empty chunks. */
  index: number;
  /** Borrowed source coordinate rows. */
  input: GraphDataView<ProjectionInputFormat>;
  /** Destination coordinate rows in the compiled program's output format. */
  output: GraphDataView<'float32x2' | 'float32x4'>;
  /** Optional upstream mask, where zero marks an invalid source row. */
  inputValidity?: GraphDataView<'uint32'>;
  /** Optional destination mask written by projection. */
  validity?: GraphDataView<'uint32'>;
};

/** Materializes the same callable shader exposed by CompiledProjection. */
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
    const chunks: ProjectionChunk[] = getRowChunks(positions)
      .map((input, index) => ({
        index,
        input,
        output: outputChunks[index],
        inputValidity: inputValidityChunks?.[index],
        validity: validityChunks?.[index]
      }))
      .filter(chunk => chunk.input.length > 0);
    const groupChunks =
      this.props.groupChunks && graph.device.limits.maxStorageBuffersPerShaderStage >= 9;
    for (let index = 0; index < chunks.length; index++) {
      const first = chunks[index];
      const second = chunks[index + 1];
      if (
        groupChunks &&
        second &&
        this.addPairedPass(graph, shader, parameterView, first, second)
      ) {
        index++;
        continue;
      }
      const {
        input,
        output: destination,
        inputValidity: sourceValidity,
        validity: destinationValidity,
        index: chunkIndex
      } = first;
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
        fp64Arithmetic: 'platform',
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

  /**
   * Registers one dispatch for two compatible chunks.
   * Returns false without modifying the graph when the pair needs separate dispatches.
   */
  private addPairedPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    shader: ProjectionShader,
    parameterView: GraphDataView<'uint32'>,
    first: ProjectionChunk,
    second: ProjectionChunk
  ): boolean {
    // Keep a whole workgroup within one physical chunk. Do not group views sharing a graph
    // buffer, so pairing cannot change how the graph represents buffer hazards.
    const firstStride =
      Math.ceil(first.input.length / GEOSPATIAL_WORKGROUP_SIZE) * GEOSPATIAL_WORKGROUP_SIZE;
    const rowCount = firstStride + second.input.length;
    const maxDimension = graph.device.limits.maxComputeWorkgroupsPerDimension;
    const bindings: Record<string, GraphDataView> = {[shader.bindingName]: parameterView};
    const resources: GraphBufferUse[] = [{buffer: parameterView, usage: 'storage-read'}];
    const declarations: string[] = [];
    const readCases: string[] = [];
    const writeCases: string[] = [];
    for (const [index, chunk] of [first, second].entries()) {
      const inputWidth = chunk.input.format === 'float32x2' ? 2 : 4;
      const outputWidth = chunk.output.format === 'float32x2' ? 2 : 4;
      const inputOffset = getViewElementOffset(chunk.input) / inputWidth;
      const outputOffset = getViewElementOffset(chunk.output) / outputWidth;
      bindings[`positions${index}`] = chunk.input;
      bindings[`output${index}`] = chunk.output;
      resources.push(
        {buffer: chunk.input, usage: 'storage-read'},
        {buffer: chunk.output, usage: 'storage-write'}
      );
      declarations.push(`
@group(0) @binding(auto) var<storage, read> positions${index}: array<${shader.inputType}>;
@group(0) @binding(auto) var<storage, read_write> output${index}: array<${shader.outputType}>;`);
      if (chunk.inputValidity) {
        bindings[`inputValidity${index}`] = chunk.inputValidity;
        resources.push({buffer: chunk.inputValidity, usage: 'storage-read'});
        declarations.push(
          `@group(0) @binding(auto) var<storage, read> inputValidity${index}: array<u32>;`
        );
      }
      if (chunk.validity) {
        bindings[`validity${index}`] = chunk.validity;
        resources.push({buffer: chunk.validity, usage: 'storage-write'});
        declarations.push(
          `@group(0) @binding(auto) var<storage, read_write> validity${index}: array<u32>;`
        );
      }
      readCases.push(`case ${index}u: {
        if (row >= ${chunk.input.length}u) { return; }
        position = positions${index}[${inputOffset}u + row];
        valid = ${chunk.inputValidity ? `inputValidity${index}[${getViewElementOffset(chunk.inputValidity)}u + row]` : '1u'};
      }`);
      writeCases.push(`case ${index}u: {
        output${index}[${outputOffset}u + row] = result.position;
        ${chunk.validity ? `validity${index}[${getViewElementOffset(chunk.validity)}u + row] = result.valid;` : ''}
      }`);
    }
    if (
      rowCount > 0xffffffff ||
      Math.ceil(rowCount / GEOSPATIAL_WORKGROUP_SIZE) > maxDimension ** 3 ||
      new Set(Object.values(bindings).map(view => view.buffer)).size !== resources.length
    ) {
      return false;
    }
    const dispatchLayout = getGeospatialDispatchLayout(rowCount, maxDimension);
    addGeospatialPass(graph, {
      id: `${this.id}-chunks-${first.index}-${second.index}`,
      bindings,
      resources,
      dispatchLayout,
      precise: true,
      fp64Arithmetic: 'platform',
      source: `
${shader.source}
${declarations.join('\n')}
@compute @workgroup_size(${GEOSPATIAL_WORKGROUP_SIZE})
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_id) localId: vec3u) {
  ${getGeospatialInvocationIndexSource(dispatchLayout)}
  let chunkIndex = select(0u, 1u, index >= ${firstStride}u);
  let row = index - chunkIndex * ${firstStride}u;
  var position: ${shader.inputType};
  var valid: u32;
  switch chunkIndex {
    ${readCases.join('\n')}
    default: { return; }
  }
  let result = ${shader.entryPoint}(position, valid);
  switch chunkIndex {
    ${writeCases.join('\n')}
    default: {}
  }
}`
    });
    return true;
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
