// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from './gpu-command-graph';
import {GPUScan} from './gpu-scan';
import {
  createTransientVectorView,
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View
} from './graph-data-view-utils';

const COMPACTION_WORKGROUP_SIZE = 256;

/** Packed uint32 graph data accepted by {@link GPUCompaction}. */
export type GPUCompactionInput = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Properties for one graph-native stable compaction. */
export type GPUCompactionProps = {
  /** Prefix for generated graph node and transient resource IDs. */
  id?: string;
  /** Packed source values as one data view or an ordered vector. */
  input: GPUCompactionInput;
  /** Matching packed selection flags; zero rejects and any non-zero value accepts. */
  flags: GPUCompactionInput;
  /** Caller-owned destination with matching view kind and sufficient capacity or topology. */
  output: GPUCompactionInput;
  /** Caller-owned view whose first row receives the accepted value count. */
  count: GraphDataView<'uint32'>;
};

/**
 * Stable graph-composed compaction of `uint32` values selected by flags.
 *
 * An exclusive {@link GPUScan} converts flags to output offsets. A scatter pass then preserves
 * source order while writing accepted values and the final accepted count. Vector inputs are one
 * logical sequence whose selected values fill the existing output topology.
 */
export class GPUCompaction {
  /** Prefix for generated graph node and transient resource IDs. */
  readonly id: string;
  /** Packed source values or ordered source vector. */
  readonly input: GPUCompactionInput;
  /** Packed selection flags with the same view kind and topology as the input. */
  readonly flags: GPUCompactionInput;
  /** Caller-owned compacted destination with matching view kind. */
  readonly output: GPUCompactionInput;
  /** Caller-owned accepted-count destination. */
  readonly count: GraphDataView<'uint32'>;

  /**
   * Creates and validates a stable compaction description.
   *
   * @throws If views are not packed `uint32` data, input/flag lengths differ, or an output lacks
   * capacity.
   */
  constructor(props: GPUCompactionProps) {
    this.id = props.id ?? 'gpu-compaction';
    this.input = props.input;
    this.flags = props.flags;
    this.output = props.output;
    this.count = props.count;
    validateCompactionInput(this.input, `${this.id} input`);
    validateCompactionInput(this.flags, `${this.id} flags`);
    validateCompactionInput(this.output, `${this.id} output`);
    validatePackedUint32View(this.count, `${this.id} count`);
    const inputIsVector = this.input instanceof GraphVectorView;
    const flagsAreVector = this.flags instanceof GraphVectorView;
    const outputIsVector = this.output instanceof GraphVectorView;
    if (inputIsVector !== flagsAreVector || inputIsVector !== outputIsVector) {
      throw new Error(`${this.id} input, flags, and output must use the same view kind`);
    }
    if (
      this.input instanceof GraphVectorView &&
      this.flags instanceof GraphVectorView &&
      this.output instanceof GraphVectorView
    ) {
      validateMatchingVectorTopology(this.input, this.flags, `${this.id} flags`);
      validateMatchingVectorTopology(this.input, this.output, `${this.id} output`);
    } else if (this.flags.length !== this.input.length) {
      throw new Error(`${this.id} flags.length must equal input.length`);
    } else if (this.output.length < this.input.length) {
      throw new Error(`${this.id} output must contain at least input.length rows`);
    }
    if (this.count.length < 1) {
      throw new Error(`${this.id} count must contain one uint32 row`);
    }
  }

  /**
   * Adds scan and scatter passes to the target graph.
   *
   * Empty input adds only a pass that writes a zero count. This method does not submit or read back
   * commands.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [
      ...getCompactionChunks(this.input),
      ...getCompactionChunks(this.flags),
      ...getCompactionChunks(this.output),
      this.count
    ]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }

    if (this.input.length === 0) {
      addClearCountPass(graph, this.id, this.count);
      return;
    }

    const offsets =
      this.flags instanceof GraphVectorView
        ? createTransientVectorView(graph, `${this.id}-offsets`, this.flags)
        : createTransientView(graph, `${this.id}-offsets`, 'uint32', this.flags.length);
    new GPUScan({id: `${this.id}-scan`, input: this.flags, output: offsets}).addToGraph(graph);
    addScatterPasses(graph, this.id, this.input, this.flags, offsets, this.output, this.count);
  }
}

/** Writes the required zero count for an empty input. */
function addClearCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  count: GraphDataView<'uint32'>
): void {
  const passId = `${id}-clear-count`;
  graph.addComputePass({
    id: passId,
    resources: [{buffer: count, usage: 'storage-write'}],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: passId,
        source: `const COUNT_OFFSET: u32 = ${getViewElementOffset(count)}u;
@group(0) @binding(0) var<storage, read_write> outputCount: array<u32>;
@compute @workgroup_size(1) fn main() { outputCount[COUNT_OFFSET] = 0u; }`,
        shaderLayout: {
          bindings: [{name: 'outputCount', type: 'storage', group: 0, location: 0}]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings({outputCount: getViewBinding(count, getBuffer)});
          computation.dispatch(computePass, 1);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Routes every non-empty input chunk through each non-empty logical output range. */
function addScatterPasses<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  input: GPUCompactionInput,
  flags: GPUCompactionInput,
  offsets: GPUCompactionInput,
  output: GPUCompactionInput,
  count: GraphDataView<'uint32'>
): void {
  const inputChunks = getCompactionChunks(input);
  const flagChunks = getCompactionChunks(flags);
  const offsetChunks = getCompactionChunks(offsets);
  const outputChunks = getCompactionChunks(output);
  const inputChunkIndices = inputChunks
    .map((chunk, chunkIndex) => (chunk.length > 0 ? chunkIndex : -1))
    .filter(chunkIndex => chunkIndex >= 0);
  const outputChunkIndices = outputChunks
    .map((chunk, chunkIndex) => (chunk.length > 0 ? chunkIndex : -1))
    .filter(chunkIndex => chunkIndex >= 0);
  const countInputChunkIndex = inputChunkIndices[inputChunkIndices.length - 1];
  const countOutputChunkIndex = outputChunkIndices[outputChunkIndices.length - 1];
  const isVector = input instanceof GraphVectorView;

  let outputStart = 0;
  for (let outputChunkIndex = 0; outputChunkIndex < outputChunks.length; outputChunkIndex++) {
    const outputChunk = outputChunks[outputChunkIndex];
    const outputEnd = outputStart + outputChunk.length;
    if (outputChunk.length > 0) {
      for (const inputChunkIndex of inputChunkIndices) {
        const writesCount =
          inputChunkIndex === countInputChunkIndex && outputChunkIndex === countOutputChunkIndex;
        addScatterPass(graph, {
          id: isVector
            ? `${id}-scatter-input-${inputChunkIndex}-output-${outputChunkIndex}`
            : `${id}-scatter`,
          input: inputChunks[inputChunkIndex],
          flags: flagChunks[inputChunkIndex],
          offsets: offsetChunks[inputChunkIndex],
          output: outputChunk,
          outputStart,
          outputEnd,
          count: writesCount ? count : undefined
        });
      }
    }
    outputStart = outputEnd;
  }
}

/** Scatters one input chunk into one logical output range and optionally writes the total count. */
function addScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<'uint32'>;
    flags: GraphDataView<'uint32'>;
    offsets: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    outputStart: number;
    outputEnd: number;
    count?: GraphDataView<'uint32'>;
  }
): void {
  const countBinding = props.count
    ? '@group(0) @binding(4) var<storage, read_write> outputCount: array<u32>;'
    : '';
  const countWrite = props.count
    ? `if (index == ELEMENT_COUNT - 1u) {
    outputCount[COUNT_OFFSET] = outputIndex + flag;
  }`
    : '';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.input.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const FLAGS_OFFSET: u32 = ${getViewElementOffset(props.flags)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.offsets)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const OUTPUT_START: u32 = ${props.outputStart}u;
const OUTPUT_END: u32 = ${props.outputEnd}u;
${props.count ? `const COUNT_OFFSET: u32 = ${getViewElementOffset(props.count)}u;` : ''}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read> flags: array<u32>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;
${countBinding}

@compute @workgroup_size(${COMPACTION_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index >= ELEMENT_COUNT) { return; }
  let flag = min(flags[FLAGS_OFFSET + index], 1u);
  let outputIndex = offsets[OFFSETS_OFFSET + index];
  if (flag != 0u && outputIndex >= OUTPUT_START && outputIndex < OUTPUT_END) {
    outputValues[OUTPUT_OFFSET + outputIndex - OUTPUT_START] = inputValues[INPUT_OFFSET + index];
  }
  ${countWrite}
}`;
  addCompactionPass(graph, {
    id: props.id,
    source,
    resources: [
      {buffer: props.input, usage: 'storage-read'},
      {buffer: props.flags, usage: 'storage-read'},
      {buffer: props.offsets, usage: 'storage-read'},
      {buffer: props.output, usage: 'storage-write'},
      ...(props.count ? [{buffer: props.count, usage: 'storage-write'} as const] : [])
    ],
    bindings: {
      inputValues: props.input,
      flags: props.flags,
      offsets: props.offsets,
      outputValues: props.output,
      ...(props.count ? {outputCount: props.count} : {})
    },
    dispatchCount: Math.ceil(props.input.length / COMPACTION_WORKGROUP_SIZE)
  });
}

/** Adds a storage-only computation pass used by compaction kernels. */
function addCompactionPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: Array<{
      buffer: GraphDataView;
      usage: 'storage-read' | 'storage-write' | 'storage-read-write';
    }>;
    bindings: Record<string, GraphDataView>;
    dispatchCount: number;
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(props.bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, ReturnType<typeof getViewBinding>> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, props.dispatchCount);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Normalizes one compaction input or vector into its ordered atomic chunks. */
function getCompactionChunks(input: GPUCompactionInput): readonly GraphDataView<'uint32'>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

/** Validates every atomic chunk accepted by a compaction input. */
function validateCompactionInput(input: GPUCompactionInput, name: string): void {
  for (const chunk of getCompactionChunks(input)) {
    validatePackedUint32View(chunk, name);
  }
}
