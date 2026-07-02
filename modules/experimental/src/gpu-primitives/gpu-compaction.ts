// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferView} from './gpu-command-graph';
import {GPUScan, getViewBinding, getViewElementOffset, validatePackedUint32View} from './gpu-scan';

const COMPACTION_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

export type GPUCompactionProps = {
  id?: string;
  input: GraphBufferView<'uint32'>;
  flags: GraphBufferView<'uint32'>;
  output: GraphBufferView<'uint32'>;
  count: GraphBufferView<'uint32'>;
};

/** Stable graph-composed compaction of uint32 values selected by 0/1 flags. */
export class GPUCompaction {
  readonly id: string;
  readonly input: GraphBufferView<'uint32'>;
  readonly flags: GraphBufferView<'uint32'>;
  readonly output: GraphBufferView<'uint32'>;
  readonly count: GraphBufferView<'uint32'>;

  constructor(props: GPUCompactionProps) {
    this.id = props.id ?? 'gpu-compaction';
    this.input = props.input;
    this.flags = props.flags;
    this.output = props.output;
    this.count = props.count;
    validatePackedUint32View(this.input, `${this.id} input`);
    validatePackedUint32View(this.flags, `${this.id} flags`);
    validatePackedUint32View(this.output, `${this.id} output`);
    validatePackedUint32View(this.count, `${this.id} count`);
    if (this.flags.length !== this.input.length) {
      throw new Error(`${this.id} flags.length must equal input.length`);
    }
    if (this.output.length < this.input.length) {
      throw new Error(`${this.id} output must contain at least input.length rows`);
    }
    if (this.count.length < 1) {
      throw new Error(`${this.id} count must contain one uint32 row`);
    }
  }

  /** Adds scan and scatter passes to the target graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [this.input, this.flags, this.output, this.count]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }

    if (this.input.length === 0) {
      addClearCountPass(graph, this.id, this.count);
      return;
    }

    const offsetsBuffer = graph.createTransientBuffer({
      id: `${this.id}-offsets`,
      byteLength: this.input.length * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE
    });
    const offsets = graph.createBufferView(offsetsBuffer, {
      format: 'uint32',
      length: this.input.length
    });
    new GPUScan({
      id: `${this.id}-scan`,
      input: this.flags,
      output: offsets
    }).addToGraph(graph);
    addScatterPass(graph, {
      id: `${this.id}-scatter`,
      input: this.input,
      flags: this.flags,
      offsets,
      output: this.output,
      count: this.count
    });
  }
}

function addClearCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  count: GraphBufferView<'uint32'>
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

function addScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphBufferView<'uint32'>;
    flags: GraphBufferView<'uint32'>;
    offsets: GraphBufferView<'uint32'>;
    output: GraphBufferView<'uint32'>;
    count: GraphBufferView<'uint32'>;
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
