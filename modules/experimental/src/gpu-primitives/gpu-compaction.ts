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

/** Properties for stable graph-native selection by uint32 flags. */
export type GPUCompactionProps = {
  id?: string;
  input: GPUCompactionInput;
  flags: GPUCompactionInput;
  output: GPUCompactionInput;
  count: GraphDataView<'uint32'>;
};

/** Stable graph-composed compaction of uint32 values selected by 0/1 flags. */
export class GPUCompaction {
  readonly id: string;
  readonly input: GPUCompactionInput;
  readonly flags: GPUCompactionInput;
  readonly output: GPUCompactionInput;
  readonly count: GraphDataView<'uint32'>;

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

  /** Adds scan and scatter passes to the target graph. */
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

    if (
      this.input instanceof GraphVectorView &&
      this.flags instanceof GraphVectorView &&
      this.output instanceof GraphVectorView
    ) {
      addVectorCompaction(graph, this.id, this.input, this.flags, this.output, this.count);
    } else {
      const input = this.input as GraphDataView<'uint32'>;
      const flags = this.flags as GraphDataView<'uint32'>;
      const output = this.output as GraphDataView<'uint32'>;
      const offsets = createTransientView(graph, `${this.id}-offsets`, 'uint32', input.length);
      new GPUScan({id: `${this.id}-scan`, input: flags, output: offsets}).addToGraph(graph);
      addScatterPass(graph, {
        id: `${this.id}-scatter`,
        input,
        flags,
        offsets,
        output,
        count: this.count
      });
    }
  }
}

function addVectorCompaction<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  input: GraphVectorView<'uint32'>,
  flags: GraphVectorView<'uint32'>,
  output: GraphVectorView<'uint32'>,
  count: GraphDataView<'uint32'>
): void {
  const offsets = createTransientVectorView(graph, `${id}-offsets`, flags);
  new GPUScan({id: `${id}-scan`, input: flags, output: offsets}).addToGraph(graph);

  let outputStart = 0;
  for (let outputChunkIndex = 0; outputChunkIndex < output.data.length; outputChunkIndex++) {
    const outputChunk = output.data[outputChunkIndex];
    const outputEnd = outputStart + outputChunk.length;
    if (outputChunk.length > 0) {
      for (let inputChunkIndex = 0; inputChunkIndex < input.data.length; inputChunkIndex++) {
        if (input.data[inputChunkIndex].length > 0) {
          addVectorScatterPass(graph, {
            id: `${id}-scatter-input-${inputChunkIndex}-output-${outputChunkIndex}`,
            input: input.data[inputChunkIndex],
            flags: flags.data[inputChunkIndex],
            offsets: offsets.data[inputChunkIndex],
            output: outputChunk,
            outputStart,
            outputEnd
          });
        }
      }
    }
    outputStart = outputEnd;
  }

  const lastChunkIndex = findLastNonEmptyChunk(input);
  addCountPass(graph, {
    id: `${id}-write-count`,
    flags: flags.data[lastChunkIndex],
    offsets: offsets.data[lastChunkIndex],
    count
  });
}

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

function addVectorScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<'uint32'>;
    flags: GraphDataView<'uint32'>;
    offsets: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    outputStart: number;
    outputEnd: number;
  }
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.input.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const FLAGS_OFFSET: u32 = ${getViewElementOffset(props.flags)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.offsets)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const OUTPUT_START: u32 = ${props.outputStart}u;
const OUTPUT_END: u32 = ${props.outputEnd}u;
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read> flags: array<u32>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${COMPACTION_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index >= ELEMENT_COUNT || min(flags[FLAGS_OFFSET + index], 1u) == 0u) { return; }
  let outputIndex = offsets[OFFSETS_OFFSET + index];
  if (outputIndex >= OUTPUT_START && outputIndex < OUTPUT_END) {
    outputValues[OUTPUT_OFFSET + outputIndex - OUTPUT_START] = inputValues[INPUT_OFFSET + index];
  }
}`;
  addCompactionPass(graph, {
    id: props.id,
    source,
    resources: [
      {buffer: props.input, usage: 'storage-read'},
      {buffer: props.flags, usage: 'storage-read'},
      {buffer: props.offsets, usage: 'storage-read'},
      {buffer: props.output, usage: 'storage-write'}
    ],
    bindings: {
      inputValues: props.input,
      flags: props.flags,
      offsets: props.offsets,
      outputValues: props.output
    },
    dispatchCount: Math.ceil(props.input.length / COMPACTION_WORKGROUP_SIZE)
  });
}

function addCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    flags: GraphDataView<'uint32'>;
    offsets: GraphDataView<'uint32'>;
    count: GraphDataView<'uint32'>;
  }
): void {
  const lastIndex = props.flags.length - 1;
  const source = /* wgsl */ `
const FLAGS_OFFSET: u32 = ${getViewElementOffset(props.flags)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.offsets)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(props.count)}u;
@group(0) @binding(0) var<storage, read> flags: array<u32>;
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputCount: array<u32>;
@compute @workgroup_size(1) fn main() {
  outputCount[COUNT_OFFSET] = offsets[OFFSETS_OFFSET + ${lastIndex}u] +
    min(flags[FLAGS_OFFSET + ${lastIndex}u], 1u);
}`;
  addCompactionPass(graph, {
    id: props.id,
    source,
    resources: [
      {buffer: props.flags, usage: 'storage-read'},
      {buffer: props.offsets, usage: 'storage-read'},
      {buffer: props.count, usage: 'storage-write'}
    ],
    bindings: {flags: props.flags, offsets: props.offsets, outputCount: props.count},
    dispatchCount: 1
  });
}

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

function addScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<'uint32'>;
    flags: GraphDataView<'uint32'>;
    offsets: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    count: GraphDataView<'uint32'>;
  }
): void {
  const length = props.input.length;
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const FLAGS_OFFSET: u32 = ${getViewElementOffset(props.flags)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.offsets)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(props.count)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read> flags: array<u32>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputCount: array<u32>;

@compute @workgroup_size(${COMPACTION_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index >= ELEMENT_COUNT) { return; }
  let flag = min(flags[FLAGS_OFFSET + index], 1u);
  if (flag != 0u) {
    outputValues[OUTPUT_OFFSET + offsets[OFFSETS_OFFSET + index]] = inputValues[INPUT_OFFSET + index];
  }
  if (index == ELEMENT_COUNT - 1u) {
    outputCount[COUNT_OFFSET] = offsets[OFFSETS_OFFSET + index] + flag;
  }
}`;
  graph.addComputePass({
    id: props.id,
    resources: [
      {buffer: props.input, usage: 'storage-read'},
      {buffer: props.flags, usage: 'storage-read'},
      {buffer: props.offsets, usage: 'storage-read'},
      {buffer: props.output, usage: 'storage-write'},
      {buffer: props.count, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputValues', type: 'storage', group: 0, location: 0},
            {name: 'flags', type: 'storage', group: 0, location: 1},
            {name: 'offsets', type: 'storage', group: 0, location: 2},
            {name: 'outputValues', type: 'storage', group: 0, location: 3},
            {name: 'outputCount', type: 'storage', group: 0, location: 4}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings({
            inputValues: getViewBinding(props.input, getBuffer),
            flags: getViewBinding(props.flags, getBuffer),
            offsets: getViewBinding(props.offsets, getBuffer),
            outputValues: getViewBinding(props.output, getBuffer),
            outputCount: getViewBinding(props.count, getBuffer)
          });
          computation.dispatch(computePass, Math.ceil(length / COMPACTION_WORKGROUP_SIZE));
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function getCompactionChunks(input: GPUCompactionInput): readonly GraphDataView<'uint32'>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

function validateCompactionInput(input: GPUCompactionInput, name: string): void {
  for (const chunk of getCompactionChunks(input)) {
    validatePackedUint32View(chunk, name);
  }
}

function findLastNonEmptyChunk(input: GraphVectorView<'uint32'>): number {
  for (let chunkIndex = input.data.length - 1; chunkIndex >= 0; chunkIndex--) {
    if (input.data[chunkIndex].length > 0) {
      return chunkIndex;
    }
  }
  throw new Error('GPUCompaction requires a non-empty chunk');
}
