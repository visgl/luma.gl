// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from './gpu-command-graph';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View
} from './graph-data-view-utils';

const SCAN_WORKGROUP_SIZE = 256;

/** Packed uint32 graph data accepted by {@link GPUScan}. */
export type GPUScanInput = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Properties for a graph-native exclusive prefix sum. */
export type GPUScanProps = {
  id?: string;
  input: GPUScanInput;
  output: GPUScanInput;
};

/** Hierarchical exclusive prefix sum over packed uint32 graph data. */
export class GPUScan {
  readonly id: string;
  readonly input: GPUScanInput;
  readonly output: GPUScanInput;

  constructor(props: GPUScanProps) {
    this.id = props.id ?? 'gpu-scan';
    this.input = props.input;
    this.output = props.output;
    validateScanInput(this.input, `${this.id} input`);
    validateScanInput(this.output, `${this.id} output`);
    const inputIsVector = this.input instanceof GraphVectorView;
    const outputIsVector = this.output instanceof GraphVectorView;
    if (inputIsVector !== outputIsVector) {
      throw new Error(`${this.id} input and output must both be data views or vector views`);
    }
    if (this.input instanceof GraphVectorView && this.output instanceof GraphVectorView) {
      validateMatchingVectorTopology(this.input, this.output, `${this.id} output`);
    } else if (this.output.length < this.input.length) {
      throw new Error(`${this.id} output must contain at least input.length rows`);
    }
  }

  /** Adds local scans, vector carry propagation, and scratch buffers to a graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    validateScanOwnership(graph, this.input, this.id);
    validateScanOwnership(graph, this.output, this.id);
    if (this.input instanceof GraphVectorView && this.output instanceof GraphVectorView) {
      addVectorScan(graph, this.id, this.input, this.output);
    } else {
      addScanLevels(
        graph,
        this.id,
        this.input as GraphDataView<'uint32'>,
        this.output as GraphDataView<'uint32'>
      );
    }
  }
}

function addVectorScan<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  input: GraphVectorView<'uint32'>,
  output: GraphVectorView<'uint32'>
): void {
  if (input.length === 0) {
    return;
  }
  if (input.data.length === 1) {
    addScanLevels(graph, `${id}-chunk-0`, input.data[0], output.data[0]);
    return;
  }

  const chunkTotals = createTransientView(graph, `${id}-chunk-totals`, 'uint32', input.data.length);
  const chunkOffsets = createTransientView(
    graph,
    `${id}-chunk-offsets`,
    'uint32',
    input.data.length
  );
  addClearPass(graph, `${id}-clear-chunk-totals`, chunkTotals);
  for (let chunkIndex = 0; chunkIndex < input.data.length; chunkIndex++) {
    const inputChunk = input.data[chunkIndex];
    if (inputChunk.length === 0) {
      continue;
    }
    const outputChunk = output.data[chunkIndex];
    addScanLevels(graph, `${id}-chunk-${chunkIndex}`, inputChunk, outputChunk);
    addChunkTotalPass(graph, {
      id: `${id}-chunk-${chunkIndex}-total`,
      input: inputChunk,
      output: outputChunk,
      chunkTotals,
      chunkIndex
    });
  }
  addScanLevels(graph, `${id}-chunk-carries`, chunkTotals, chunkOffsets);
  for (let chunkIndex = 0; chunkIndex < output.data.length; chunkIndex++) {
    if (output.data[chunkIndex].length > 0) {
      addChunkCarryPass(graph, {
        id: `${id}-chunk-${chunkIndex}-add-carry`,
        output: output.data[chunkIndex],
        chunkOffsets,
        chunkIndex
      });
    }
  }
}

function addScanLevels<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  input: GraphDataView<'uint32'>,
  output: GraphDataView<'uint32'>
): void {
  if (input.length === 0) {
    return;
  }

  const levels: Array<{
    output: GraphDataView<'uint32'>;
    length: number;
    blockOffsets?: GraphDataView<'uint32'>;
  }> = [];
  let levelInput = input;
  let levelOutput = output;
  let levelLength = input.length;
  let levelIndex = 0;

  while (true) {
    const blockCount = Math.ceil(levelLength / SCAN_WORKGROUP_SIZE);
    let blockSums: GraphDataView<'uint32'> | undefined;
    if (blockCount > 1) {
      blockSums = createTransientView(
        graph,
        `${id}-level-${levelIndex}-block-sums`,
        'uint32',
        blockCount
      );
    }

    addBlockScanPass(graph, {
      id: `${id}-level-${levelIndex}-scan`,
      input: levelInput,
      output: levelOutput,
      blockSums,
      length: levelLength,
      blockCount
    });
    levels.push({output: levelOutput, length: levelLength});

    if (!blockSums) {
      break;
    }
    const blockOffsets = createTransientView(
      graph,
      `${id}-level-${levelIndex}-block-offsets`,
      'uint32',
      blockCount
    );
    levels[levels.length - 1].blockOffsets = blockOffsets;
    levelInput = blockSums;
    levelOutput = blockOffsets;
    levelLength = blockCount;
    levelIndex++;
  }

  for (let index = levels.length - 2; index >= 0; index--) {
    const level = levels[index];
    addBlockOffsetPass(graph, {
      id: `${id}-level-${index}-add-offsets`,
      output: level.output,
      blockOffsets: level.blockOffsets!,
      length: level.length
    });
  }
}

function addClearPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@compute @workgroup_size(${SCAN_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  if (globalId.x < ELEMENT_COUNT) { outputValues[OUTPUT_OFFSET + globalId.x] = 0u; }
}`;
  addSimpleScanPass(graph, {
    id,
    source,
    resources: [{buffer: output, usage: 'storage-write'}],
    bindings: {outputValues: output},
    dispatchCount: Math.ceil(output.length / SCAN_WORKGROUP_SIZE)
  });
}

function addChunkTotalPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    chunkTotals: GraphDataView<'uint32'>;
    chunkIndex: number;
  }
): void {
  const lastIndex = props.input.length - 1;
  const source = /* wgsl */ `
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const TOTALS_OFFSET: u32 = ${getViewElementOffset(props.chunkTotals)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read> outputValues: array<u32>;
@group(0) @binding(2) var<storage, read_write> chunkTotals: array<u32>;
@compute @workgroup_size(1) fn main() {
  chunkTotals[TOTALS_OFFSET + ${props.chunkIndex}u] =
    outputValues[OUTPUT_OFFSET + ${lastIndex}u] + inputValues[INPUT_OFFSET + ${lastIndex}u];
}`;
  addSimpleScanPass(graph, {
    id: props.id,
    source,
    resources: [
      {buffer: props.input, usage: 'storage-read'},
      {buffer: props.output, usage: 'storage-read'},
      {buffer: props.chunkTotals, usage: 'storage-write'}
    ],
    bindings: {
      inputValues: props.input,
      outputValues: props.output,
      chunkTotals: props.chunkTotals
    },
    dispatchCount: 1
  });
}

function addChunkCarryPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    output: GraphDataView<'uint32'>;
    chunkOffsets: GraphDataView<'uint32'>;
    chunkIndex: number;
  }
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.chunkOffsets)}u;
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(1) var<storage, read> chunkOffsets: array<u32>;
@compute @workgroup_size(${SCAN_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  if (globalId.x < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + globalId.x] = outputValues[OUTPUT_OFFSET + globalId.x] +
      chunkOffsets[OFFSETS_OFFSET + ${props.chunkIndex}u];
  }
}`;
  addSimpleScanPass(graph, {
    id: props.id,
    source,
    resources: [
      {buffer: props.output, usage: 'storage-read-write'},
      {buffer: props.chunkOffsets, usage: 'storage-read'}
    ],
    bindings: {outputValues: props.output, chunkOffsets: props.chunkOffsets},
    dispatchCount: Math.ceil(props.output.length / SCAN_WORKGROUP_SIZE)
  });
}

function addSimpleScanPass<Parameters>(
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
          const bindings: Record<string, Binding> = {};
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

function validateScanInput(input: GPUScanInput, name: string): void {
  const chunks = input instanceof GraphVectorView ? input.data : [input];
  for (const chunk of chunks) {
    validatePackedUint32View(chunk, name);
  }
}

function validateScanOwnership<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  input: GPUScanInput,
  id: string
): void {
  const chunks = input instanceof GraphVectorView ? input.data : [input];
  if (chunks.some(chunk => chunk.buffer.graph !== graph)) {
    throw new Error(`${id} views must belong to the target graph`);
  }
}

function addBlockScanPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    blockSums?: GraphDataView<'uint32'>;
    length: number;
    blockCount: number;
  }
): void {
  const blockSumBinding = props.blockSums
    ? '@group(0) @binding(2) var<storage, read_write> blockSums: array<u32>;'
    : '';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
${props.blockSums ? `const BLOCK_SUMS_OFFSET: u32 = ${getViewElementOffset(props.blockSums)}u;` : ''}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${blockSumBinding}
var<workgroup> scratch: array<u32, ${SCAN_WORKGROUP_SIZE}>;

@compute @workgroup_size(${SCAN_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let index = globalId.x;
  let lane = localId.x;
  var inputValue = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
  }
  scratch[lane] = inputValue;
  workgroupBarrier();

  for (var stride = 1u; stride < ${SCAN_WORKGROUP_SIZE}u; stride = stride * 2u) {
    var addend = 0u;
    if (lane >= stride) {
      addend = scratch[lane - stride];
    }
    workgroupBarrier();
    if (lane >= stride) {
      scratch[lane] = scratch[lane] + addend;
    }
    workgroupBarrier();
  }

  if (lane == ${SCAN_WORKGROUP_SIZE - 1}u) {
    ${props.blockSums ? 'blockSums[BLOCK_SUMS_OFFSET + workgroupId.x] = scratch[255u];' : ''}
  }
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = scratch[lane] - inputValue;
  }
}`;

  graph.addComputePass({
    id: props.id,
    resources: [
      {buffer: props.input, usage: 'storage-read'},
      {buffer: props.output, usage: 'storage-write'},
      ...(props.blockSums ? [{buffer: props.blockSums, usage: 'storage-write'} as const] : [])
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputValues', type: 'storage', group: 0, location: 0},
            {name: 'outputValues', type: 'storage', group: 0, location: 1},
            ...(props.blockSums
              ? [{name: 'blockSums', type: 'storage' as const, group: 0, location: 2}]
              : [])
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            inputValues: getViewBinding(props.input, getBuffer),
            outputValues: getViewBinding(props.output, getBuffer)
          };
          if (props.blockSums) {
            bindings['blockSums'] = getViewBinding(props.blockSums, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, props.blockCount);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function addBlockOffsetPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    output: GraphDataView<'uint32'>;
    blockOffsets: GraphDataView<'uint32'>;
    length: number;
  }
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const BLOCK_OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.blockOffsets)}u;
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(1) var<storage, read> blockOffsets: array<u32>;

@compute @workgroup_size(${SCAN_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = outputValues[OUTPUT_OFFSET + index] + blockOffsets[BLOCK_OFFSETS_OFFSET + index / ${SCAN_WORKGROUP_SIZE}u];
  }
}`;
  graph.addComputePass({
    id: props.id,
    resources: [
      {buffer: props.output, usage: 'storage-read-write'},
      {buffer: props.blockOffsets, usage: 'storage-read'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'outputValues', type: 'storage', group: 0, location: 0},
            {name: 'blockOffsets', type: 'storage', group: 0, location: 1}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings({
            outputValues: getViewBinding(props.output, getBuffer),
            blockOffsets: getViewBinding(props.blockOffsets, getBuffer)
          });
          computation.dispatch(computePass, Math.ceil(props.length / SCAN_WORKGROUP_SIZE));
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
