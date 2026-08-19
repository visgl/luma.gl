// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuXfilter.

import {Buffer, type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GraphVectorView,
  type GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView
} from '../gpu-core/gpu-command-graph';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-core/graph-data-view-utils';

const SELECTION_WORKGROUP_SIZE = 256;
const SELECTION_STATE_WORD_COUNT = 5;
const SCALAR_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const MINIMUM_SINT32 = -0x80000000;
const MAXIMUM_SINT32 = 0x7fffffff;
const MAXIMUM_UINT32 = 0xffffffff;

/** Packed scalar formats supported by GPU-resident interactive selections. */
export type GPUCrossfilterScalarFormat = 'float32' | 'sint32' | 'uint32';

/** One scalar chunk or an ordered vector whose original chunks remain intact. */
export type GPUCrossfilterScalarInput<
  T extends GPUCrossfilterScalarFormat = GPUCrossfilterScalarFormat
> = GraphDataView<T> | GraphVectorView<T>;

/** Source-aligned selection flags: zero rejects and one accepts a row. */
export type GPUCrossfilterMask = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** One scalar dimension with an optional caller-owned output mask. */
export type GPUCrossfilterRangeDimension = {
  /** Stable dimension identifier used in generated graph resources and node IDs. */
  id: string;
  /** Select rows within an inclusive scalar range. */
  kind: 'range';
  /** Packed source values evaluated without GPU readback. */
  input: GPUCrossfilterScalarInput;
  /** Optional packed source-aligned destination for canonical selection flags. */
  mask?: GPUCrossfilterMask;
};

/** Two scalar dimensions with an optional caller-owned output mask. */
export type GPUCrossfilterBoundsDimension = {
  /** Stable dimension identifier used in generated graph resources and node IDs. */
  id: string;
  /** Select rows within an inclusive two-dimensional rectangle. */
  kind: 'bounds';
  /** Packed horizontal source values. */
  x: GPUCrossfilterScalarInput;
  /** Packed vertical source values with the same chunk topology as `x`. */
  y: GPUCrossfilterScalarInput;
  /** Optional packed source-aligned destination for canonical selection flags. */
  mask?: GPUCrossfilterMask;
};

/** Interactive scalar or two-dimensional selection registered with a GPUCrossfilter controller. */
export type GPUCrossfilterDimension = GPUCrossfilterRangeDimension | GPUCrossfilterBoundsDimension;

/**
 * Evaluates one interactive dimension into GPU-resident, source-aligned selection flags.
 *
 * Only the five-word selection state is uploaded when an interaction changes. Source values and
 * output flags stay on the GPU, and vector-backed inputs preserve every original chunk boundary.
 */
export class GPUCrossfilterSelection {
  /** Prefix shared by the selection's graph nodes and private control-state resource. */
  readonly id: string;
  /** Dimension definition and borrowed source inputs. */
  readonly dimension: GPUCrossfilterDimension;
  /** Caller-provided or graph-owned canonical uint32 selection flags. */
  readonly mask: GPUCrossfilterMask;

  private readonly graph: GPUCommandGraph<any>;
  private readonly stateValues = new Uint32Array(SELECTION_STATE_WORD_COUNT);
  private readonly stateBuffer: Buffer;
  private readonly stateView: GraphDataView<'uint32'>;
  private destroyed = false;

  /** Creates one initially disabled selection without reading source data back to the CPU. */
  constructor(
    graph: GPUCommandGraph<any>,
    dimension: GPUCrossfilterDimension,
    props: {id?: string} = {}
  ) {
    this.graph = graph;
    this.dimension = dimension;
    this.id = props.id ?? `gpu-crossfilter-${dimension.id}`;

    const primaryInput = dimension.kind === 'range' ? dimension.input : dimension.x;
    validateScalarInput(primaryInput, graph, `${this.id} input`);
    if (dimension.kind === 'bounds') {
      validateScalarInput(dimension.y, graph, `${this.id} y input`);
      validateMatchingTopology(primaryInput, dimension.y, `${this.id} bounds inputs`);
    }

    if (dimension.mask) {
      if (dimension.mask.format !== 'uint32') {
        throw new Error(`${this.id} mask must contain uint32 selection flags`);
      }
      validateScalarInput(dimension.mask, graph, `${this.id} mask`);
      validateMatchingTopology(primaryInput, dimension.mask, `${this.id} mask`);
      validateSeparateOutputBuffers(dimension, dimension.mask, this.id);
      this.mask = dimension.mask;
    } else {
      this.mask = createSelectionMask(graph, this.id, primaryInput);
    }

    const stateBuffer = graph.device.createBuffer({
      id: `${this.id}-state`,
      data: this.stateValues,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    try {
      const stateHandle = graph.importBuffer(
        {
          id: `${this.id}-state`,
          byteLength: stateBuffer.byteLength,
          usage: stateBuffer.usage
        },
        stateBuffer
      );
      this.stateView = graph.createDataView(stateHandle, {
        format: 'uint32',
        length: SELECTION_STATE_WORD_COUNT
      });
      this.stateBuffer = stateBuffer;
    } catch (error) {
      stateBuffer.destroy();
      throw error;
    }
  }

  /** Activates an inclusive scalar range without rebuilding the compiled command graph. */
  setRange(range: readonly [number, number]): void {
    if (this.dimension.kind !== 'range') {
      throw new Error(`${this.id} does not support scalar range selection`);
    }
    validateOrderedRange(range[0], range[1], `${this.id} range`);
    const minimum = encodeScalarValue(range[0], this.dimension.input.format, this.id);
    const maximum = encodeScalarValue(range[1], this.dimension.input.format, this.id);
    this.stateValues[0] = 1;
    this.stateValues[1] = minimum;
    this.stateValues[2] = maximum;
    this.writeState();
  }

  /** Activates inclusive `[minX, minY, maxX, maxY]` bounds without a source-data upload. */
  setBounds(bounds: readonly [number, number, number, number]): void {
    if (this.dimension.kind !== 'bounds') {
      throw new Error(`${this.id} does not support two-dimensional bounds selection`);
    }
    const [minimumX, minimumY, maximumX, maximumY] = bounds;
    validateOrderedRange(minimumX, maximumX, `${this.id} horizontal bounds`);
    validateOrderedRange(minimumY, maximumY, `${this.id} vertical bounds`);
    const encodedMinimumX = encodeScalarValue(minimumX, this.dimension.x.format, this.id);
    const encodedMaximumX = encodeScalarValue(maximumX, this.dimension.x.format, this.id);
    const encodedMinimumY = encodeScalarValue(minimumY, this.dimension.y.format, this.id);
    const encodedMaximumY = encodeScalarValue(maximumY, this.dimension.y.format, this.id);
    this.stateValues[0] = 1;
    this.stateValues[1] = encodedMinimumX;
    this.stateValues[2] = encodedMaximumX;
    this.stateValues[3] = encodedMinimumY;
    this.stateValues[4] = encodedMaximumY;
    this.writeState();
  }

  /** Disables this dimension so its next GPU evaluation accepts every source row. */
  clear(): void {
    this.stateValues.fill(0);
    this.writeState();
  }

  /** Adds one reusable predicate-evaluation pass for each nonempty original source chunk. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.destroyed) {
      throw new Error(`${this.id} selection has been destroyed`);
    }
    if (graph !== this.graph) {
      throw new Error(`${this.id} selection belongs to another command graph`);
    }

    const primaryInput = this.dimension.kind === 'range' ? this.dimension.input : this.dimension.x;
    const primaryChunks = getScalarChunks(primaryInput);
    const secondaryChunks =
      this.dimension.kind === 'bounds' ? getScalarChunks(this.dimension.y) : undefined;
    const outputChunks = getScalarChunks(this.mask);

    for (const [chunkIndex, primaryChunk] of primaryChunks.entries()) {
      if (primaryChunk.length === 0) {
        continue;
      }
      addSelectionPass(graph, {
        id: primaryInput instanceof GraphVectorView ? `${this.id}-chunk-${chunkIndex}` : this.id,
        primaryInput: primaryChunk,
        secondaryInput: secondaryChunks?.[chunkIndex],
        state: this.stateView,
        output: outputChunks[chunkIndex]
      });
    }
  }

  /** Releases only this selection's private control buffer; all graph/source data remains borrowed. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.stateBuffer.destroy();
  }

  /** Uploads only the fixed-size control block used by already compiled predicate passes. */
  private writeState(): void {
    if (this.destroyed) {
      throw new Error(`${this.id} selection has been destroyed`);
    }
    this.stateBuffer.write(this.stateValues);
  }
}

/** Creates graph-owned uint32 output storage with exactly the source vector's chunk topology. */
function createSelectionMask<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  input: GPUCrossfilterScalarInput
): GPUCrossfilterMask {
  if (!(input instanceof GraphVectorView)) {
    return createTransientView(graph, `${id}-mask`, 'uint32', input.length);
  }

  const data = input.data.map((chunk, chunkIndex) =>
    createTransientView(graph, `${id}-mask-chunk-${chunkIndex}`, 'uint32', chunk.length)
  );
  return new GraphVectorView({
    id: `${id}-mask`,
    name: `${id}-mask`,
    format: 'uint32',
    length: input.length,
    valueLength: input.length,
    stride: 1,
    byteStride: SCALAR_BYTE_LENGTH,
    rowByteLength: SCALAR_BYTE_LENGTH,
    data
  });
}

/** Adds one packed scalar or two-axis inclusive selection kernel. */
function addSelectionPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    primaryInput: GraphDataView<GPUCrossfilterScalarFormat>;
    secondaryInput?: GraphDataView<GPUCrossfilterScalarFormat>;
    state: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
  }
): void {
  const primaryShaderType = getScalarShaderType(props.primaryInput.format);
  const secondaryShaderType = props.secondaryInput
    ? getScalarShaderType(props.secondaryInput.format)
    : undefined;
  const stateBinding = props.secondaryInput ? 2 : 1;
  const outputBinding = stateBinding + 1;
  const secondaryDeclaration = props.secondaryInput
    ? `const SECONDARY_OFFSET: u32 = ${getViewElementOffset(props.secondaryInput)}u;
@group(0) @binding(1) var<storage, read> secondaryValues: array<${secondaryShaderType}>;`
    : '';
  const primaryMinimum = getStateScalarExpression(props.primaryInput.format, 1);
  const primaryMaximum = getStateScalarExpression(props.primaryInput.format, 2);
  const primaryCondition = `primaryValue >= ${primaryMinimum} && primaryValue <= ${primaryMaximum}`;
  const secondaryCondition = props.secondaryInput
    ? ` && secondaryValue >= ${getStateScalarExpression(props.secondaryInput.format, 3)} &&
      secondaryValue <= ${getStateScalarExpression(props.secondaryInput.format, 4)}`
    : '';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.primaryInput.length}u;
const PRIMARY_OFFSET: u32 = ${getViewElementOffset(props.primaryInput)}u;
const STATE_OFFSET: u32 = ${getViewElementOffset(props.state)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> primaryValues: array<${primaryShaderType}>;
${secondaryDeclaration}
@group(0) @binding(${stateBinding}) var<storage, read> selectionState: array<u32>;
@group(0) @binding(${outputBinding}) var<storage, read_write> outputMask: array<u32>;

@compute @workgroup_size(${SELECTION_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index >= ELEMENT_COUNT) {
    return;
  }
  if (selectionState[STATE_OFFSET] == 0u) {
    outputMask[OUTPUT_OFFSET + index] = 1u;
    return;
  }
  let primaryValue = primaryValues[PRIMARY_OFFSET + index];
  ${props.secondaryInput ? 'let secondaryValue = secondaryValues[SECONDARY_OFFSET + index];' : ''}
  let accepted = ${primaryCondition}${secondaryCondition};
  outputMask[OUTPUT_OFFSET + index] = select(0u, 1u, accepted);
}`;

  const resources: GraphBufferUse[] = [
    {buffer: props.primaryInput, usage: 'storage-read'},
    ...(props.secondaryInput
      ? ([{buffer: props.secondaryInput, usage: 'storage-read'}] as GraphBufferUse[])
      : []),
    {buffer: props.state, usage: 'storage-read'},
    {buffer: props.output, usage: 'storage-write'}
  ];
  const bindings: Record<string, GraphDataView> = {
    primaryValues: props.primaryInput,
    ...(props.secondaryInput ? {secondaryValues: props.secondaryInput} : {}),
    selectionState: props.state,
    outputMask: props.output
  };

  graph.addComputePass({
    id: props.id,
    resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: Object.keys(bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const resolvedBindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(bindings)) {
            resolvedBindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(resolvedBindings);
          computation.dispatch(
            computePass,
            Math.ceil(props.primaryInput.length / SELECTION_WORKGROUP_SIZE)
          );
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Returns source chunks in their original order without packing, copying, or concatenation. */
function getScalarChunks<T extends GPUCrossfilterScalarFormat>(
  input: GPUCrossfilterScalarInput<T>
): readonly GraphDataView<T>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

/** Ensures every input is a packed, aligned, graph-local 32-bit scalar. */
function validateScalarInput<Parameters>(
  input: GPUCrossfilterScalarInput,
  graph: GPUCommandGraph<Parameters>,
  name: string
): void {
  if (!['float32', 'sint32', 'uint32'].includes(input.format)) {
    throw new Error(`${name} must contain packed 32-bit scalar GPU data`);
  }
  for (const chunk of getScalarChunks(input)) {
    if (
      chunk.buffer.graph !== graph ||
      chunk.format !== input.format ||
      chunk.byteStride !== SCALAR_BYTE_LENGTH ||
      chunk.rowByteLength !== SCALAR_BYTE_LENGTH ||
      chunk.byteOffset % SCALAR_BYTE_LENGTH !== 0
    ) {
      throw new Error(`${name} must contain packed graph-local 32-bit scalar GPU data`);
    }
  }
}

/** Rejects atomic/vector mismatches and changes to ordered source chunk boundaries. */
function validateMatchingTopology(
  first: GPUCrossfilterScalarInput,
  second: GPUCrossfilterScalarInput,
  name: string
): void {
  if (first instanceof GraphVectorView !== second instanceof GraphVectorView) {
    throw new Error(`${name} must use the same view kind`);
  }
  const firstChunks = getScalarChunks(first);
  const secondChunks = getScalarChunks(second);
  if (
    first.length !== second.length ||
    firstChunks.length !== secondChunks.length ||
    firstChunks.some((chunk, chunkIndex) => chunk.length !== secondChunks[chunkIndex].length)
  ) {
    throw new Error(`${name} must preserve the same chunk topology`);
  }
}

/** Keeps selection writes separate from all source buffers, including other source chunks. */
function validateSeparateOutputBuffers(
  dimension: GPUCrossfilterDimension,
  mask: GPUCrossfilterMask,
  id: string
): void {
  const inputChunks =
    dimension.kind === 'range'
      ? getScalarChunks(dimension.input)
      : [...getScalarChunks(dimension.x), ...getScalarChunks(dimension.y)];
  if (
    getScalarChunks(mask).some(maskChunk =>
      inputChunks.some(inputChunk => inputChunk.buffer === maskChunk.buffer)
    )
  ) {
    throw new Error(`${id} input and mask must use separate buffers`);
  }
}

/** Validates closed, finite intervals before their endpoints are encoded for the GPU. */
function validateOrderedRange(minimum: number, maximum: number, name: string): void {
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum > maximum) {
    throw new Error(`${name} must contain ordered finite endpoints`);
  }
}

/** Preserves the exact stored scalar bit pattern in the GPU control-state word. */
function encodeScalarValue(value: number, format: GPUCrossfilterScalarFormat, id: string): number {
  if (format === 'float32') {
    if (!Number.isFinite(Math.fround(value))) {
      throw new Error(`${id} selection endpoints must fit their input scalar format`);
    }
    const valueBytes = new ArrayBuffer(SCALAR_BYTE_LENGTH);
    new Float32Array(valueBytes)[0] = value;
    return new Uint32Array(valueBytes)[0];
  }

  const minimum = format === 'sint32' ? MINIMUM_SINT32 : 0;
  const maximum = format === 'sint32' ? MAXIMUM_SINT32 : MAXIMUM_UINT32;
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${id} selection endpoints must fit their input scalar format`);
  }
  return value >>> 0;
}

/** Returns the native WGSL scalar type corresponding to one packed GPU storage format. */
function getScalarShaderType(format: GPUCrossfilterScalarFormat): 'f32' | 'i32' | 'u32' {
  switch (format) {
    case 'float32':
      return 'f32';
    case 'sint32':
      return 'i32';
    case 'uint32':
      return 'u32';
  }
}

/** Decodes one control-state word without converting integer endpoints through float32. */
function getStateScalarExpression(format: GPUCrossfilterScalarFormat, index: number): string {
  const stateValue = `selectionState[STATE_OFFSET + ${index}u]`;
  switch (format) {
    case 'float32':
      return `bitcast<f32>(${stateValue})`;
    case 'sint32':
      return `bitcast<i32>(${stateValue})`;
    case 'uint32':
      return stateValue;
  }
}
