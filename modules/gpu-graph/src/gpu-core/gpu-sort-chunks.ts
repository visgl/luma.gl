// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph} from './gpu-command-graph';
import type {GPUCommandNode} from './gpu-command-node';
import {GPUSort, getGPUSortCommandNodesWithDispatchLimit} from './gpu-sort';
import {alignGraphVectorViews} from './graph-vector-view-utils';
import {createTransientView, getViewElementOffset} from './graph-data-view-utils';
import {createChunkNode} from './gpu-chunk-utils';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';

/** Stable global merge of independently sorted borrowed spans, without concatenation. @internal */
export function getChunkedSortNodes<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  maximum: number
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const spans = alignGraphVectorViews(graph, [sort.keys, sort.values]);
  const outputs = alignGraphVectorViews(graph, [sort.outputKeys, sort.outputValues]);
  const sorted = spans.map(([keys, values], index) => {
    const id = `${sort.id}-span-${index}`;
    const outputKeys = createTransientView(graph, `${id}-keys`, 'uint32', keys.length);
    const outputValues = createTransientView(graph, `${id}-values`, 'uint32', keys.length);
    const ranks = createTransientView(graph, `${id}-ranks`, 'uint32', keys.length);
    nodes.push(
      ...getGPUSortCommandNodesWithDispatchLimit(
        new GPUSort({
          id,
          keys,
          values,
          outputKeys,
          outputValues,
          algorithm: sort.resolvedAlgorithm,
          direction: sort.direction,
          keyBits: sort.keyBits
        }),
        graph,
        maximum
      )
    );
    return {keys: outputKeys, values: outputValues, ranks};
  });
  const mask =
    sort.resolvedAlgorithm === 'radix' && sort.keyBits < 32 ? 2 ** sort.keyBits - 1 : 0xffffffff;
  const comparison = sort.direction === 'ascending' ? '<' : '>';
  for (const [index, span] of sorted.entries()) {
    const dispatch = getBoundedDispatchLayout('GPUSort merge', span.keys.length, 256, maximum);
    const invocation = getBoundedInvocationIndexSource(dispatch, 256);
    nodes.push(
      createChunkNode(graph, {
        id: `${sort.id}-ranks-${index}`,
        outputs: {ranks: span.ranks},
        dispatch,
        source: /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> ranks: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${invocation}
  if (index < ${span.keys.length}u) { ranks[index] = index; }
}`
      })
    );
    for (const [otherIndex, other] of sorted.entries()) {
      if (otherIndex === index) continue;
      nodes.push(
        createChunkNode(graph, {
          id: `${sort.id}-rank-${index}-against-${otherIndex}`,
          inputs: {keys: span.keys, otherKeys: other.keys},
          outputs: {ranks: span.ranks},
          dispatch,
          source: /* wgsl */ `
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> otherKeys: array<u32>;
@group(0) @binding(2) var<storage, read_write> ranks: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${invocation}
  if (index >= ${span.keys.length}u) { return; }
  let key = keys[index] & ${mask}u;
  var first = 0u;
  var last = ${other.keys.length}u;
  loop {
    if (first == last) { break; }
    let middle = first + (last - first) / 2u;
    let otherKey = otherKeys[middle] & ${mask}u;
    if (otherKey ${comparison} key${otherIndex < index ? ' || otherKey == key' : ''}) { first = middle + 1u; }
    else { last = middle; }
  }
  ranks[index] += first;
}`
        })
      );
    }
    let outputStart = 0;
    for (const [outputIndex, [outputKeys, outputValues]] of outputs.entries()) {
      nodes.push(
        createChunkNode(graph, {
          id: `${sort.id}-publish-${index}-${outputIndex}`,
          inputs: {keys: span.keys, values: span.values, ranks: span.ranks},
          outputs: {outputKeys, outputValues},
          dispatch,
          source: /* wgsl */ `
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> ranks: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${invocation}
  if (index >= ${span.keys.length}u) { return; }
  let rank = ranks[index];
  if (rank >= ${outputStart}u && rank - ${outputStart}u < ${outputKeys.length}u) {
    let localRank = rank - ${outputStart}u;
    outputKeys[${getViewElementOffset(outputKeys)}u + localRank] = keys[index];
    outputValues[${getViewElementOffset(outputValues)}u + localRank] = values[index];
  }
}`
        })
      );
      outputStart += outputKeys.length;
    }
  }
  return nodes;
}
