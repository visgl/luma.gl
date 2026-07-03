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

/** Properties for one graph-native exclusive prefix sum. */
export type GPUScanProps = {
  /** Prefix for generated graph node and transient resource IDs. */
  id?: string;
  /** One packed unsigned data view or an ordered vector of packed chunks. */
  input: GPUScanInput;
  /** Caller-owned destination with matching view kind and sufficient capacity or topology. */
  output: GPUScanInput;
};

/**
 * Hierarchical exclusive prefix sum over packed `uint32` graph data.
 *
 * Each 256-thread block writes local exclusive offsets and, when necessary, one block sum. Higher
 * levels scan those block sums before reverse-order offset passes add the parent offsets back into
 * every lower level. Vector inputs are one logical sequence whose carries cross chunk boundaries
 * without changing caller-visible topology. Arithmetic wraps modulo 2^32.
 */
export class GPUScan {
  /** Prefix for generated graph node and transient resource IDs. */
  readonly id: string;
  /** Packed unsigned source data or ordered source vector. */
  readonly input: GPUScanInput;
  /** Caller-owned exclusive-prefix destination with matching view kind. */
  readonly output: GPUScanInput;

  /**
   * Creates and validates an exclusive scan description.
   *
   * @throws If either view is not packed `uint32` data or the output is shorter than the input.
   */
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

  /**
   * Adds local scan hierarchies, vector carry propagation, and graph-owned scratch.
   *
   * Empty inputs add no nodes. This method declares work only; it does not compile, encode, submit,
   * or read data back.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    validateScanOwnership(graph, this.input, this.id);
    validateScanOwnership(graph, this.output, this.id);
    addChunkedScan(graph, this.id, this.input, this.output);
  }
}

/** Normalizes atomic and vector inputs and adds the required local scans and vector carries. */
function addChunkedScan<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  input: GPUScanInput,
  output: GPUScanInput
): void {
  const inputChunks = getScanChunks(input);
  const outputChunks = getScanChunks(output);
  const nonEmptyChunks = inputChunks
    .map((inputChunk, chunkIndex) => ({
      chunkIndex,
      input: inputChunk,
      output: outputChunks[chunkIndex]
    }))
    .filter(chunk => chunk.input.length > 0);
  if (nonEmptyChunks.length === 0) {
    return;
  }
  const isVector = input instanceof GraphVectorView;
  if (nonEmptyChunks.length === 1) {
    const chunk = nonEmptyChunks[0];
    addScanLevels(
      graph,
      isVector ? `${id}-chunk-${chunk.chunkIndex}` : id,
      chunk.input,
      chunk.output
    );
    return;
  }

  const chunkTotals = createTransientView(
    graph,
    `${id}-chunk-totals`,
    'uint32',
    nonEmptyChunks.length
  );
  const chunkOffsets = createTransientView(
    graph,
    `${id}-chunk-offsets`,
    'uint32',
    nonEmptyChunks.length
  );
  nonEmptyChunks.forEach((chunk, partialIndex) => {
    addScanLevels(
      graph,
      `${id}-chunk-${chunk.chunkIndex}`,
      chunk.input,
      chunk.output,
      createPackedSubview(graph, chunkTotals, partialIndex)
    );
  });
  addScanLevels(graph, `${id}-chunk-carries`, chunkTotals, chunkOffsets);
  nonEmptyChunks.forEach((chunk, partialIndex) => {
    addOffsetPass(graph, {
      id: `${id}-chunk-${chunk.chunkIndex}-add-carry`,
      output: chunk.output,
      offsets: chunkOffsets,
      length: chunk.output.length,
      offsetIndex: partialIndex
    });
  });
}

/** Adds every hierarchical level required to scan one non-empty packed data view. */
function addScanLevels<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  input: GraphDataView<'uint32'>,
  output: GraphDataView<'uint32'>,
  finalSum?: GraphDataView<'uint32'>
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
      finalSum: blockSums ? undefined : finalSum,
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
    addOffsetPass(graph, {
      id: `${id}-level-${index}-add-offsets`,
      output: level.output,
      offsets: level.blockOffsets!,
      length: level.length
    });
  }
}

/** Returns one packed row within a transient view without allocating another buffer. */
function createPackedSubview<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GraphDataView<'uint32'>,
  index: number
): GraphDataView<'uint32'> {
  return graph.createDataView(view.buffer, {
    format: 'uint32',
    length: 1,
    byteOffset: view.byteOffset + index * view.rowByteLength
  });
}

/** Validates every atomic chunk accepted by a scan input. */
function validateScanInput(input: GPUScanInput, name: string): void {
  const chunks = input instanceof GraphVectorView ? input.data : [input];
  for (const chunk of chunks) {
    validatePackedUint32View(chunk, name);
  }
}

/** Normalizes one data view or vector into its ordered atomic chunks. */
function getScanChunks(input: GPUScanInput): readonly GraphDataView<'uint32'>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

/** Verifies that every scan chunk belongs to the graph receiving the operation. */
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

/** Adds one block-local exclusive scan level and optionally writes one sum per block. */
function addBlockScanPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    blockSums?: GraphDataView<'uint32'>;
    finalSum?: GraphDataView<'uint32'>;
    length: number;
    blockCount: number;
  }
): void {
  const sumOutput = props.blockSums ?? props.finalSum;
  const sumBinding = sumOutput
    ? '@group(0) @binding(2) var<storage, read_write> sumValues: array<u32>;'
    : '';
  const sumWrite = props.blockSums
    ? 'sumValues[SUM_OFFSET + workgroupId.x] = scratch[255u];'
    : props.finalSum
      ? 'sumValues[SUM_OFFSET] = scratch[255u];'
      : '';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
${sumOutput ? `const SUM_OFFSET: u32 = ${getViewElementOffset(sumOutput)}u;` : ''}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${sumBinding}
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
    ${sumWrite}
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
      ...(sumOutput ? [{buffer: sumOutput, usage: 'storage-write'} as const] : [])
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputValues', type: 'storage', group: 0, location: 0},
            {name: 'outputValues', type: 'storage', group: 0, location: 1},
            ...(sumOutput
              ? [{name: 'sumValues', type: 'storage' as const, group: 0, location: 2}]
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
          if (sumOutput) {
            bindings['sumValues'] = getViewBinding(sumOutput, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, props.blockCount);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Adds a scanned block offset or one vector carry into an output view. */
function addOffsetPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    output: GraphDataView<'uint32'>;
    offsets: GraphDataView<'uint32'>;
    length: number;
    offsetIndex?: number;
  }
): void {
  const offsetIndex =
    props.offsetIndex === undefined ? `index / ${SCAN_WORKGROUP_SIZE}u` : `${props.offsetIndex}u`;
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.offsets)}u;
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(1) var<storage, read> offsets: array<u32>;

@compute @workgroup_size(${SCAN_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = outputValues[OUTPUT_OFFSET + index] + offsets[OFFSETS_OFFSET + ${offsetIndex}];
  }
}`;
  graph.addComputePass({
    id: props.id,
    resources: [
      {buffer: props.output, usage: 'storage-read-write'},
      {buffer: props.offsets, usage: 'storage-read'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'outputValues', type: 'storage', group: 0, location: 0},
            {name: 'offsets', type: 'storage', group: 0, location: 1}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings({
            outputValues: getViewBinding(props.output, getBuffer),
            offsets: getViewBinding(props.offsets, getBuffer)
          });
          computation.dispatch(computePass, Math.ceil(props.length / SCAN_WORKGROUP_SIZE));
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
