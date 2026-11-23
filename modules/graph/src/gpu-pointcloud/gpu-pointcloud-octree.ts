// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import type {GPUCommandGraph, GraphDataView} from '../gpu-core/gpu-command-graph';
import type {GPUCommandNode} from '../gpu-core/gpu-command-node';
import {GPUSort} from '../gpu-core/gpu-sort';
import {GPUScan} from '../gpu-core/gpu-scan';
import {createTransientView, validatePackedView} from '../gpu-core/graph-data-view-utils';
import {validateChunkViews} from '../gpu-core/gpu-chunk-utils';
import {getSpatialOperationNodes} from '../utils/gpu-spatial-operation';

/** uint32 words per node: prefix, level, parent, firstChild, childMask, offset, count, subtreeCount. */
export const GPU_POINT_CLOUD_OCTREE_NODE_STRIDE = 8;

export type GPUPointCloudOctreeProps = {
  id?: string;
  positions: GraphDataView<'float32x3'>;
  /** Native-coordinate cube. Both minimum and maximum faces are included. */
  origin: readonly [number, number, number];
  size: number;
  /** 0–10 levels below the root (30-bit Morton keys). Defaults to 6. */
  maximumDepth?: number;
  /** Maximum sampled points per nonterminal node. Leaves keep all remaining points. */
  nodePointLimit?: number;
  /** Sample one point per occupied cell in a 2^samplingLevels grid per axis. Defaults to 2. */
  samplingLevels?: number;
  /** Source row IDs grouped into additive node ranges; capacity >= positions.length. */
  pointIndices: GraphDataView<'uint32'>;
  /** Packed breadth-first node records. Capacity of positions.length nodes always suffices. */
  nodes: GraphDataView<'uint32'>;
  /** Four words: required nodes, retained points, rejected points, overflow. Must use a separate buffer from nodes and pointIndices. */
  status: GraphDataView<'uint32'>;
};

/**
 * Builds a sparse additive octree over immutable positions using stable source-ID ranges.
 * Fixed-depth GPU passes need no intermediate readback. Scratch is O(N); passes are O(N * depth)
 * plus the initial stable Morton sort. Outputs are valid only when status[3] is zero.
 */
export class GPUPointCloudOctree {
  readonly id: string;
  readonly maximumDepth: number;
  readonly nodePointLimit: number;
  readonly samplingLevels: number;

  constructor(readonly props: GPUPointCloudOctreeProps) {
    this.id = props.id ?? 'gpu-pointcloud-octree';
    this.maximumDepth = props.maximumDepth ?? 6;
    this.nodePointLimit = props.nodePointLimit ?? 64;
    this.samplingLevels = props.samplingLevels ?? 2;
    // Morton keys use at most 30 bits; packed scratch addresses must fit uint32.
    assert(
      Number.isInteger(this.maximumDepth) && this.maximumDepth >= 0 && this.maximumDepth <= 10
    );
    assert(
      Number.isSafeInteger(this.nodePointLimit) &&
        this.nodePointLimit > 0 &&
        this.nodePointLimit < 0xffffffff
    );
    assert(
      Number.isInteger(this.samplingLevels) && this.samplingLevels >= 1 && this.samplingLevels <= 10
    );
    assert(props.positions.length < 0x20000000);
    assert(Number.isFinite(Math.fround(props.size)) && Math.fround(props.size) > 0);
    assert(
      props.origin.every(
        value =>
          Number.isFinite(Math.fround(value)) &&
          Number.isFinite(Math.fround(Math.fround(value) + Math.fround(props.size))) &&
          Math.fround(Math.fround(value) + Math.fround(props.size)) > Math.fround(value)
      )
    );
    assert(props.pointIndices.length >= props.positions.length);
    assert(props.nodes.length % GPU_POINT_CLOUD_OCTREE_NODE_STRIDE === 0);
    assert(props.status.length === 4);
    // Status is read while nodes and point indices are written, so their buffers must differ.
    assert(
      props.status.buffer !== props.nodes.buffer &&
        props.status.buffer !== props.pointIndices.buffer
    );
    validatePackedView(props.positions, ['float32x3'], this.id);
    for (const view of [props.pointIndices, props.nodes, props.status])
      validatePackedView(view, ['uint32'], this.id);
  }

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const {positions, pointIndices, nodes: nodeData, status, origin, size} = this.props;
    validateChunkViews(graph, [positions], [pointIndices, nodeData, status]);
    const length = positions.length;
    const nodeCapacity = nodeData.length / GPU_POINT_CLOUD_OCTREE_NODE_STRIDE;
    const commands: GPUCommandNode<Parameters>[] = [];
    type Views = Record<string, GraphDataView<'uint32'>>;
    const kernel = (
      name: string,
      count: number,
      inputs: Views,
      outputs: Views,
      body: string,
      atomicOutputs = false
    ) => {
      commands.push(
        ...getSpatialOperationNodes(graph, {
          id: `${this.id}-${name}`,
          length: count,
          inputs,
          outputs,
          body,
          atomicOutputs
        })
      );
    };
    const scratch = (name: string, count = length) =>
      createTransientView(graph, `${this.id}-${name}`, 'uint32', count);
    const scan = (
      name: string,
      input: GraphDataView<'uint32'>,
      output: GraphDataView<'uint32'>
    ) => {
      commands.push(
        ...new GPUScan({id: `${this.id}-${name}`, input, output}).getCommandNodes(graph)
      );
    };
    kernel('reset-status', 4, {}, {status}, 'writeStatus(index, 0u);');
    kernel('reset-nodes', nodeData.length, {}, {nodes: nodeData}, 'writeNodes(index, 0u);');
    kernel(
      'reset-indices',
      pointIndices.length,
      {},
      {pointIndices},
      'writePointIndices(index, 0xffffffffu);'
    );
    if (!length) return commands;

    const keys = scratch('keys');
    const values = scratch('values');
    const sortedKeys = scratch('sorted-keys');
    const sortedValues = scratch('sorted-values');
    commands.push(
      ...getSpatialOperationNodes(graph, {
        id: `${this.id}-morton`,
        length,
        inputs: {positions},
        outputs: {keys, values, status},
        atomicOutputs: true,
        body: `let position = readPositions(index);
let origin = vec3f(${origin.map(value => Math.fround(value)).join(', ')});
let extent: f32 = ${Math.fround(size)};
writeValues(index, index);
if (!all(position >= origin) || !all(position <= origin + vec3f(extent))) {
  writeKeys(index, 0xffffffffu); addStatus(2u, 1u); return;
}
let coordinate = vec3u(clamp((position - origin) / extent * ${2 ** this.maximumDepth}.0, vec3f(0.0), vec3f(${2 ** this.maximumDepth - 1}.0)));
var key = 0u;
for (var bit = 0u; bit < ${this.maximumDepth}u; bit++) {
  let octant = ((coordinate.x >> bit) & 1u) * 4u + ((coordinate.y >> bit) & 1u) * 2u + ((coordinate.z >> bit) & 1u);
  key |= octant << (3u * bit);
}
writeKeys(index, key);`
      })
    );
    commands.push(
      ...new GPUSort({
        id: `${this.id}-sort`,
        keys,
        values,
        outputKeys: sortedKeys,
        outputValues: sortedValues
      }).getCommandNodes(graph)
    );

    const entries = [scratch('entries-a', length * 3), scratch('entries-b', length * 3)];
    const boundaries = scratch('boundaries');
    const groupOffsets = scratch('group-offsets');
    const starts = scratch('starts', length + 1);
    const candidates = scratch('candidates');
    const candidateOffsets = scratch('candidate-offsets');
    const selected = scratch('selected');
    const selectedOffsets = scratch('selected-offsets');
    const remaining = scratch('remaining');
    const remainingOffsets = scratch('remaining-offsets');

    kernel(
      'initialize',
      length,
      {keys: sortedKeys, values: sortedValues},
      {entries: entries[0]},
      `
let key = readKeys(index);
writeEntries(index * 3u, key);
writeEntries(index * 3u + 1u, select(readValues(index), 0xffffffffu, key == 0xffffffffu));
writeEntries(index * 3u + 2u, 0xffffffffu);`
    );

    for (let level = 0; level <= this.maximumDepth; level++) {
      const current = entries[level % 2];
      const next = entries[(level + 1) % 2];
      const prefixShift = (this.maximumDepth - level) * 3;
      const sampleShift = Math.max(0, this.maximumDepth - level - this.samplingLevels) * 3;
      const active = 'readEntries(index * 3u + 1u) != 0xffffffffu';
      const group = 'readGroupOffsets(index) + readBoundaries(index) - 1u';
      const terminal = `end - start <= ${this.nodePointLimit}u || ${level === this.maximumDepth}`;
      kernel(
        `boundaries-${level}`,
        length,
        {entries: current},
        {boundaries},
        `
var head = false;
if (${active}) {
  head = index == 0u;
  if (index > 0u) { head = (readEntries(index * 3u) >> ${prefixShift}u) != (readEntries((index - 1u) * 3u) >> ${prefixShift}u); }
}
writeBoundaries(index, u32(head));`
      );
      scan(`group-scan-${level}`, boundaries, groupOffsets);
      kernel(
        `node-headers-${level}`,
        length,
        {entries: current, boundaries, groupOffsets, status},
        {starts, nodes: nodeData},
        `
if (!(${active})) { return; }
let group = ${group};
let node = readStatus(0u) + group;
if (readBoundaries(index) != 0u) {
  writeStarts(group, index);
  if (node < ${nodeCapacity}u) {
    writeNodes(node * 8u, readEntries(index * 3u) >> ${prefixShift}u);
    writeNodes(node * 8u + 1u, ${level}u);
    writeNodes(node * 8u + 2u, readEntries(index * 3u + 2u));
    writeNodes(node * 8u + 3u, 0xffffffffu);
    writeNodes(node * 8u + 4u, 0u);
  }
}
if (index + 1u == ${length}u) { writeStarts(group + 1u, index + 1u); }
else if (readEntries((index + 1u) * 3u + 1u) == 0xffffffffu) { writeStarts(group + 1u, index + 1u); }`
      );
      kernel(
        `sample-candidates-${level}`,
        length,
        {entries: current, boundaries, groupOffsets, starts},
        {candidates},
        `
var keep = false;
if (${active}) {
  let group = ${group};
  let start = readStarts(group);
  let end = readStarts(group + 1u);
  keep = ${terminal} || index == start;
  if (!keep && index > start) { keep = (readEntries(index * 3u) >> ${sampleShift}u) != (readEntries((index - 1u) * 3u) >> ${sampleShift}u); }
}
writeCandidates(index, u32(keep));`
      );
      scan(`candidate-scan-${level}`, candidates, candidateOffsets);
      kernel(
        `select-${level}`,
        length,
        {entries: current, boundaries, groupOffsets, starts, candidates, candidateOffsets},
        {selected, remaining},
        `
var keep = false;
let valid = ${active};
if (valid) {
  let group = ${group};
  let start = readStarts(group);
  let end = readStarts(group + 1u);
  keep = readCandidates(index) != 0u && (${terminal} || readCandidateOffsets(index) - readCandidateOffsets(start) < ${this.nodePointLimit}u);
}
writeSelected(index, u32(keep));
writeRemaining(index, u32(valid && !keep));`
      );
      scan(`selected-scan-${level}`, selected, selectedOffsets);
      scan(`remaining-scan-${level}`, remaining, remainingOffsets);
      kernel(
        `node-ranges-${level}`,
        length,
        {boundaries, groupOffsets, starts, selected, selectedOffsets, status},
        {nodes: nodeData},
        `
if (readBoundaries(index) == 0u) { return; }
let group = readGroupOffsets(index);
let node = readStatus(0u) + group;
if (node >= ${nodeCapacity}u) { return; }
let start = readStarts(group);
let end = readStarts(group + 1u);
let offset = readSelectedOffsets(start);
let count = readSelectedOffsets(end - 1u) + readSelected(end - 1u) - offset;
writeNodes(node * 8u + 5u, readStatus(1u) + offset);
writeNodes(node * 8u + 6u, count);
writeNodes(node * 8u + 7u, end - start);`
      );
      if (level > 0) {
        kernel(
          `link-children-${level}`,
          length,
          {entries: current, boundaries, groupOffsets, status},
          {nodes: nodeData},
          `
if (readBoundaries(index) == 0u) { return; }
let node = readStatus(0u) + readGroupOffsets(index);
let parent = readEntries(index * 3u + 2u);
if (parent >= ${nodeCapacity}u || node >= ${nodeCapacity}u) { return; }
let octant = (readEntries(index * 3u) >> ${prefixShift}u) & 7u;
minNodes(parent * 8u + 3u, node);
addNodes(parent * 8u + 4u, 1u << octant);`,
          true
        );
      }
      kernel(
        `emit-points-${level}`,
        length,
        {entries: current, selected, selectedOffsets, status},
        {pointIndices},
        `
if (readSelected(index) != 0u) { writePointIndices(readStatus(1u) + readSelectedOffsets(index), readEntries(index * 3u + 1u)); }`
      );
      if (level < this.maximumDepth) {
        kernel(
          `clear-next-${level}`,
          length * 3,
          {},
          {entries: next},
          'writeEntries(index, 0xffffffffu);'
        );
        kernel(
          `partition-next-${level}`,
          length,
          {entries: current, boundaries, groupOffsets, remaining, remainingOffsets, status},
          {next},
          `
if (readRemaining(index) == 0u) { return; }
let destination = readRemainingOffsets(index) * 3u;
writeNext(destination, readEntries(index * 3u));
writeNext(destination + 1u, readEntries(index * 3u + 1u));
writeNext(destination + 2u, readStatus(0u) + ${group});`
        );
      }
      kernel(
        `advance-${level}`,
        1,
        {boundaries, groupOffsets, selected, selectedOffsets},
        {status},
        `
let nodeCount = readStatus(0u) + readGroupOffsets(${length - 1}u) + readBoundaries(${length - 1}u);
writeStatus(0u, nodeCount);
writeStatus(1u, readStatus(1u) + readSelectedOffsets(${length - 1}u) + readSelected(${length - 1}u));
if (nodeCount > ${nodeCapacity}u) { writeStatus(3u, 1u); }`
      );
    }
    return commands;
  }
}
