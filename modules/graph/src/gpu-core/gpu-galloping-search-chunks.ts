// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph, GraphDataView} from './gpu-command-graph';
import type {GPUCommandNode} from './gpu-command-node';
import type {GPUGallopingSearch, GPUGallopingSearchFormat} from './gpu-galloping-search';
import {getGraphVectorData} from './graph-vector-view-utils';
import {getGraphDataRange, createChunkNode} from './gpu-chunk-utils';
import {createTransientView, getViewElementOffset} from './graph-data-view-utils';
import {GPUElementwise} from './gpu-elementwise';
import {GPUGather} from './gpu-gather';
import {GPUScatter} from './gpu-scatter';

/** Bounded query tiles search borrowed value chunks; descriptor and tile scratch never grow with the column. @internal */
export function getChunkedGallopingSearchNodes<Parameters, Format extends GPUGallopingSearchFormat>(
  graph: GPUCommandGraph<Parameters>,
  search: GPUGallopingSearch<Format>
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  let valueChunks: readonly GraphDataView<Format>[] = getGraphVectorData(search.values);
  if (search.valueOrder) {
    // An explicit indirect ordering needs a value permutation. Retain the order vector's
    // chunk boundaries; never concatenate the original values or indices.
    valueChunks = getGraphVectorData(search.valueOrder).map((order, chunkIndex) => {
      const output = createTransientView(
        graph,
        `${search.id}-ordered-${chunkIndex}`,
        search.values.format,
        order.length
      );
      nodes.push(
        ...new GPUGather({
          id: `${search.id}-gather-order-${chunkIndex}`,
          source: search.values,
          indices: order,
          output
        }).getCommandNodes(graph)
      );
      return output;
    });
  }
  const scalar = search.values.format === 'float32' ? 'f32' : 'u32';
  const tileLength = search.stats.queriesPerTile;
  for (let segmentIndex = 0; segmentIndex < search.stats.segmentCount; segmentIndex++) {
    const descriptorParts = getGraphDataRange(graph, search.segments, segmentIndex * 4, 4);
    let descriptor = descriptorParts.data[0];
    if (descriptorParts.data.length > 1) {
      descriptor = createTransientView(
        graph,
        `${search.id}-descriptor-${segmentIndex}`,
        'uint32',
        4
      );
      nodes.push(
        ...new GPUElementwise({
          id: `${search.id}-descriptor-copy-${segmentIndex}`,
          input: descriptorParts,
          output: descriptor,
          operation: 'copy'
        }).getCommandNodes(graph)
      );
    }
    const descriptorOffset = getViewElementOffset(descriptor);
    for (let tileStart = 0; tileStart < search.stats.maximumQueryCount; tileStart += tileLength) {
      const activeTileLength = Math.min(tileLength, search.stats.maximumQueryCount - tileStart);
      const id = `${search.id}-${segmentIndex}-${tileStart}`;
      const indices = createTransientView(graph, `${id}-indices`, 'uint32', activeTileLength);
      const queries = createTransientView(
        graph,
        `${id}-queries`,
        search.queries.format,
        activeTileLength
      );
      const positions = createTransientView(graph, `${id}-positions`, 'uint32', activeTileLength);
      nodes.push(
        createChunkNode(graph, {
          id: `${id}-prepare`,
          inputs: {descriptor},
          outputs: {indices, errors: search.validationErrors},
          dispatch: {x: 1, y: 1, z: 1},
          workgroupSize: 1,
          source: `
@group(0) @binding(0) var<storage, read> descriptor: array<u32>;
@group(0) @binding(1) var<storage, read_write> indices: array<u32>;
@group(0) @binding(2) var<storage, read_write> errors: array<atomic<u32>>;
@compute @workgroup_size(1)
fn main() {
  let valueStart = descriptor[${descriptorOffset}u];
  let valueCount = descriptor[${descriptorOffset + 1}u];
  let queryStart = descriptor[${descriptorOffset + 2}u];
  let queryCount = descriptor[${descriptorOffset + 3}u];
  var valid = true;
  if (valueStart > ${search.stats.orderedValueCount}u || valueCount > ${search.stats.orderedValueCount}u - valueStart) {
    atomicOr(&errors[${getViewElementOffset(search.validationErrors)}u], 1u);
    valid = false;
  } else if (queryStart > ${search.queries.length}u || queryCount > ${search.queries.length}u - queryStart || queryCount > ${search.stats.maximumQueryCount}u) {
    atomicOr(&errors[${getViewElementOffset(search.validationErrors)}u], 2u);
    valid = false;
  }
  for (var index = 0u; index < ${activeTileLength}u; index++) {
    indices[index] = 0xffffffffu;
    if (valid && ${tileStart}u + index < queryCount) { indices[index] = queryStart + ${tileStart}u + index; }
  }
}`
        })
      );
      nodes.push(
        ...new GPUGather({
          id: `${id}-gather-queries`,
          source: search.queries,
          indices,
          output: queries
        }).getCommandNodes(graph)
      );
      nodes.push(
        createChunkNode(graph, {
          id: `${id}-validate`,
          inputs: {queries, descriptor},
          outputs: {indices, positions, errors: search.validationErrors},
          dispatch: {x: 1, y: 1, z: 1},
          workgroupSize: 1,
          source: `
@group(0) @binding(0) var<storage, read> queries: array<${scalar}>;
@group(0) @binding(1) var<storage, read> descriptor: array<u32>;
@group(0) @binding(2) var<storage, read_write> indices: array<u32>;
@group(0) @binding(3) var<storage, read_write> positions: array<u32>;
@group(0) @binding(4) var<storage, read_write> errors: array<atomic<u32>>;
@compute @workgroup_size(1)
fn main() {
  var stopped = false;
  for (var index = 0u; index < ${activeTileLength}u; index++) {
    positions[index] = descriptor[${descriptorOffset}u];
    if (indices[index] == 0xffffffffu) { continue; }
    if (stopped) { indices[index] = 0xffffffffu; continue; }
    let value = queries[index];
    ${
      scalar === 'f32'
        ? `if ((bitcast<u32>(value) & 0x7f800000u) == 0x7f800000u) {
      atomicOr(&errors[${getViewElementOffset(search.validationErrors)}u], 8u);
      indices[index] = 0xffffffffu;
      stopped = true;
      continue;
    }`
        : ''
    }
    if (index > 0u && value < queries[index - 1u]) { atomicOr(&errors[${getViewElementOffset(search.validationErrors)}u], 4u); }
  }
}`
        })
      );
      let valueStart = 0;
      for (const [chunkIndex, values] of valueChunks.entries()) {
        if (values.length)
          nodes.push(
            createChunkNode(graph, {
              id: `${id}-search-${chunkIndex}`,
              inputs: {values, queries, descriptor, indices},
              outputs: {positions},
              dispatch: {x: 1, y: 1, z: 1},
              workgroupSize: 256,
              source: `
@group(0) @binding(0) var<storage, read> values: array<${scalar}>;
@group(0) @binding(1) var<storage, read> queries: array<${scalar}>;
@group(0) @binding(2) var<storage, read> descriptor: array<u32>;
@group(0) @binding(3) var<storage, read> indices: array<u32>;
@group(0) @binding(4) var<storage, read_write> positions: array<u32>;
@compute @workgroup_size(256)
fn main(@builtin(local_invocation_index) index: u32) {
  if (index >= ${activeTileLength}u) { return; }
  if (indices[index] == 0xffffffffu) { return; }
  let first = max(descriptor[${descriptorOffset}u], ${valueStart}u);
  let last = min(descriptor[${descriptorOffset}u] + descriptor[${descriptorOffset + 1}u], ${valueStart + values.length}u);
  if (first >= last) { return; }
  var low = first - ${valueStart}u;
  var high = last - ${valueStart}u;
  loop {
    if (low >= high) { break; }
    let middle = low + (high - low) / 2u;
    if (values[${getViewElementOffset(values)}u + middle * ${values.byteStride / 4}u] < queries[index]) { low = middle + 1u; }
    else { high = middle; }
  }
  positions[index] += low - (first - ${valueStart}u);
}`
            })
          );
        valueStart += values.length;
      }
      nodes.push(
        ...new GPUScatter({
          id: `${id}-publish`,
          source: positions,
          indices,
          output: search.output
        }).getCommandNodes(graph)
      );
    }
  }
  return nodes;
}
