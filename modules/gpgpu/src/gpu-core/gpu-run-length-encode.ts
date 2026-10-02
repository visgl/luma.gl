// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandNode} from './gpu-command-node';
import type {GPUCommandGraph, GraphDataView, GraphVectorView} from './gpu-command-graph';
import {GPUScan} from './gpu-scan';
import {
  createTransientVectorView,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';
import {alignGraphVectorViews, getGraphVectorData} from './graph-vector-view-utils';
import {createChunkNode, getGraphDataRange, validateChunkViews} from './gpu-chunk-utils';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';

export type GPURunLengthEncodeProps = {
  id?: string;
  /** Ordered packed uint32 input. Equal adjacent values form one run. */
  input: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Caller-owned unique run values, capacity >= input.length. */
  values: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Caller-owned run lengths, capacity >= input.length. */
  lengths: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Single uint32 receiving the number of valid runs. */
  count: GraphDataView<'uint32'>;
};

/** Graph-native run-length encoding for ordered uint32 values. */
export class GPURunLengthEncode {
  readonly id: string;
  readonly input: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  readonly values: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  readonly lengths: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  readonly count: GraphDataView<'uint32'>;

  constructor(props: GPURunLengthEncodeProps) {
    this.id = props.id ?? 'gpu-run-length-encode';
    this.input = props.input;
    this.values = props.values;
    this.lengths = props.lengths;
    this.count = props.count;
    for (const [name, view] of Object.entries({
      input: this.input,
      values: this.values,
      lengths: this.lengths,
      count: this.count
    })) {
      for (const chunk of getGraphVectorData(view))
        validatePackedUint32View(chunk, `${this.id} ${name}`);
    }
    if (this.values.length < this.input.length || this.lengths.length < this.input.length) {
      throw new Error(`${this.id} values and lengths must have capacity >= input.length`);
    }
    if (this.count.length < 1) throw new Error(`${this.id} count must contain at least one row`);
    if (
      [...getGraphVectorData(this.values), ...getGraphVectorData(this.lengths), this.count].some(
        output => getGraphVectorData(this.input).some(input => input.buffer === output.buffer)
      )
    ) {
      throw new Error(`${this.id} outputs must use separate buffers from input`);
    }
  }

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    validateChunkViews(graph, [this.input], [this.values, this.lengths, this.count]);
    const nodes: GPUCommandNode<Parameters>[] = [];
    const input = getGraphDataRange(graph, this.input, 0, this.input.length);
    const flags = createTransientVectorView(graph, `${this.id}-flags`, input);
    const runs = createTransientVectorView(graph, `${this.id}-runs`, input);
    const maximum = graph.device.limits.maxComputeWorkgroupsPerDimension;
    for (const [chunkIndex, chunk] of input.data.entries()) {
      const previous = input.data[Math.max(0, chunkIndex - 1)];
      const dispatch = getBoundedDispatchLayout(this.id, chunk.length, 256, maximum);
      nodes.push(
        createChunkNode(graph, {
          id: `${this.id}-flags-${chunkIndex}`,
          inputs: {inputValues: chunk, ...(chunkIndex ? {previous} : {})},
          outputs: {flags: flags.data[chunkIndex]},
          dispatch,
          source: `
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
${chunkIndex ? '@group(0) @binding(1) var<storage, read> previous: array<u32>;' : ''}
@group(0) @binding(${chunkIndex ? 2 : 1}) var<storage, read_write> flags: array<u32>;
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(dispatch, 256)}
  if (index >= ${chunk.length}u) { return; }
  var head = true;
  if (index > 0u) {
    head = inputValues[${getViewElementOffset(chunk)}u + index] != inputValues[${getViewElementOffset(chunk)}u + index - 1u];
  } ${
    chunkIndex
      ? `else {
    head = inputValues[${getViewElementOffset(chunk)}u] != previous[${getViewElementOffset(previous) + previous.length - 1}u];
  }`
      : ''
  }
  flags[index] = select(0u, 1u, head);
}`
        })
      );
    }
    if (input.length)
      nodes.push(
        ...new GPUScan({
          id: `${this.id}-scan`,
          input: flags,
          output: runs,
          mode: 'inclusive'
        }).getCommandNodes(graph)
      );
    const last = runs.data[runs.data.length - 1];
    nodes.push(
      createChunkNode(graph, {
        id: `${this.id}-count`,
        inputs: last ? {runs: last} : {},
        outputs: {count: this.count},
        dispatch: {x: 1, y: 1, z: 1},
        workgroupSize: 1,
        source: `
${last ? '@group(0) @binding(0) var<storage, read> runs: array<u32>;' : ''}
@group(0) @binding(${last ? 1 : 0}) var<storage, read_write> count: array<u32>;
@compute @workgroup_size(1)
fn main() {
  count[${getViewElementOffset(this.count)}u] = ${last ? `runs[${last.length - 1}u]` : '0u'};
}`
      })
    );
    if (!input.length) return nodes;
    let outputStart = 0;
    for (const [chunkIndex, lengths] of getGraphVectorData(this.lengths).entries()) {
      if (!lengths.length) continue;
      const dispatch = getBoundedDispatchLayout(this.id, lengths.length, 256, maximum);
      nodes.push(
        createChunkNode(graph, {
          id: `${this.id}-clear-${chunkIndex}`,
          inputs: {count: this.count},
          outputs: {lengths},
          dispatch,
          source: `
@group(0) @binding(0) var<storage, read> count: array<u32>;
@group(0) @binding(1) var<storage, read_write> lengths: array<u32>;
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(dispatch, 256)}
  if (index < ${lengths.length}u && ${outputStart}u + index < count[${getViewElementOffset(this.count)}u]) {
    lengths[${getViewElementOffset(lengths)}u + index] = 0u;
  }
}`
        })
      );
      outputStart += lengths.length;
    }
    for (const [inputIndex, [values, heads, ranks]] of alignGraphVectorViews(graph, [
      input,
      flags,
      runs
    ]).entries()) {
      const dispatch = getBoundedDispatchLayout(this.id, values.length, 256, maximum);
      for (const [kind, target] of [
        ['values', this.values],
        ['lengths', this.lengths]
      ] as const) {
        let firstRun = 0;
        for (const [outputIndex, output] of getGraphVectorData(target).entries()) {
          if (output.length)
            nodes.push(
              createChunkNode(graph, {
                id: `${this.id}-${kind}-${inputIndex}-${outputIndex}`,
                inputs: {...(kind === 'values' ? {values, heads} : {}), ranks},
                outputs: {output},
                dispatch,
                source: `
${
  kind === 'values'
    ? `@group(0) @binding(0) var<storage, read> values: array<u32>;
@group(0) @binding(1) var<storage, read> heads: array<u32>;`
    : ''
}
@group(0) @binding(${kind === 'values' ? 2 : 0}) var<storage, read> ranks: array<u32>;
@group(0) @binding(${kind === 'values' ? 3 : 1}) var<storage, read_write> output: array<${kind === 'lengths' ? 'atomic<u32>' : 'u32'}>;
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(dispatch, 256)}
  if (index >= ${values.length}u) { return; }
  let run = ranks[${getViewElementOffset(ranks)}u + index] - 1u;
  if (run < ${firstRun}u || run - ${firstRun}u >= ${output.length}u) { return; }
  let destination = ${getViewElementOffset(output)}u + run - ${firstRun}u;
  ${
    kind === 'lengths'
      ? 'atomicAdd(&output[destination], 1u);'
      : `if (heads[${getViewElementOffset(heads)}u + index] != 0u) {
    output[destination] = values[${getViewElementOffset(values)}u + index];
  }`
  }
}`
              })
            );
          firstRun += output.length;
        }
      }
    }
    return nodes;
  }
}

/** `GPUUnique` is the value-only form of run-length encoding. */
export class GPUUnique extends GPURunLengthEncode {}
