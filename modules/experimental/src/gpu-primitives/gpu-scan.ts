// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferView} from './gpu-command-graph';

const SCAN_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const STORAGE_BINDING_ALIGNMENT = 256;

export type GPUScanProps = {
  id?: string;
  input: GraphBufferView<'uint32'>;
  output: GraphBufferView<'uint32'>;
};

/** Hierarchical exclusive prefix sum over packed uint32 graph buffers. */
export class GPUScan {
  readonly id: string;
  readonly input: GraphBufferView<'uint32'>;
  readonly output: GraphBufferView<'uint32'>;

  constructor(props: GPUScanProps) {
    this.id = props.id ?? 'gpu-scan';
    this.input = props.input;
    this.output = props.output;
    validatePackedUint32View(this.input, `${this.id} input`);
    validatePackedUint32View(this.output, `${this.id} output`);
    if (this.output.length < this.input.length) {
      throw new Error(`${this.id} output must contain at least input.length rows`);
    }
  }

  /** Adds the scan's hierarchical compute passes and scratch buffers to a graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.input.buffer.graph !== graph || this.output.buffer.graph !== graph) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    if (this.input.length === 0) {
      return;
    }

    const levels: Array<{
      output: GraphBufferView<'uint32'>;
      length: number;
      blockOffsets?: GraphBufferView<'uint32'>;
    }> = [];
    let levelInput = this.input;
    let levelOutput = this.output;
    let levelLength = this.input.length;
    let levelIndex = 0;

    while (true) {
      const blockCount = Math.ceil(levelLength / SCAN_WORKGROUP_SIZE);
      let blockSums: GraphBufferView<'uint32'> | undefined;
      if (blockCount > 1) {
        const blockSumsBuffer = graph.createTransientBuffer({
          id: `${this.id}-level-${levelIndex}-block-sums`,
          byteLength: blockCount * UINT32_BYTE_LENGTH,
          usage: Buffer.STORAGE
        });
        blockSums = graph.createBufferView(blockSumsBuffer, {
          format: 'uint32',
          length: blockCount
        });
      }

      addBlockScanPass(graph, {
        id: `${this.id}-level-${levelIndex}-scan`,
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
      const blockOffsetsBuffer = graph.createTransientBuffer({
        id: `${this.id}-level-${levelIndex}-block-offsets`,
        byteLength: blockCount * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      });
      const blockOffsets = graph.createBufferView(blockOffsetsBuffer, {
        format: 'uint32',
        length: blockCount
      });
      levels[levels.length - 1].blockOffsets = blockOffsets;
      levelInput = blockSums;
      levelOutput = blockOffsets;
      levelLength = blockCount;
      levelIndex++;
    }

    for (let index = levels.length - 2; index >= 0; index--) {
      const level = levels[index];
      addBlockOffsetPass(graph, {
        id: `${this.id}-level-${index}-add-offsets`,
        output: level.output,
        blockOffsets: level.blockOffsets!,
        length: level.length
      });
    }
  }
}

function addBlockScanPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphBufferView<'uint32'>;
    output: GraphBufferView<'uint32'>;
    blockSums?: GraphBufferView<'uint32'>;
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
    output: GraphBufferView<'uint32'>;
    blockOffsets: GraphBufferView<'uint32'>;
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

/** @internal */
export function validatePackedUint32View(view: GraphBufferView, name: string): void {
  if (
    view.format !== 'uint32' ||
    view.byteStride !== UINT32_BYTE_LENGTH ||
    view.rowByteLength !== UINT32_BYTE_LENGTH ||
    view.byteOffset % UINT32_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${name} must be packed, uint32-aligned GPU data`);
  }
}

/** @internal */
export function getViewBinding(
  view: GraphBufferView,
  getBuffer: (view: GraphBufferView) => Buffer
): Binding {
  const alignedByteOffset =
    Math.floor(view.byteOffset / STORAGE_BINDING_ALIGNMENT) * STORAGE_BINDING_ALIGNMENT;
  const prefixByteLength = view.byteOffset - alignedByteOffset;
  return {
    buffer: getBuffer(view),
    offset: alignedByteOffset,
    size: prefixByteLength + Math.max(view.length * view.byteStride, view.rowByteLength)
  };
}

/** @internal */
export function getViewElementOffset(view: GraphBufferView): number {
  return (view.byteOffset % STORAGE_BINDING_ALIGNMENT) / UINT32_BYTE_LENGTH;
}
