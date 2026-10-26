// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/gpgpu';
import type {GPUVector} from '@luma.gl/gpgpu/gpu-data';
import type {GPUCommandGraph, GraphDataView} from '../gpu-core/gpu-command-graph';
import {createChunkNode, getChunkDispatch, validateChunkViews} from '../gpu-core/gpu-chunk-utils';
import {getViewElementOffset} from '../gpu-core/graph-data-view-utils';
import {GPUTimeSeries, validateTimeSeriesVector} from './gpu-time-series';

export type GPUTimeSeriesEnvelopeProps = {
  id?: string;
  series: GPUTimeSeries;
  /** One GPU row [start, end), in source sample indices. Clamped to length; reversed is empty. */
  range: GPUVector<'uint32x2'>;
  /** Per-bin [minimum, maximum, first, last]. Empty bins contain zeros. */
  output: GPUVector<'float32x4'>;
  /** Per-bin source IDs in the same order; missing IDs are 0xffffffff. */
  sourceIds: GPUVector<'uint32x4'>;
  /** Per-bin [valid, missing] counts. Nonfinite values are always missing. */
  counts: GPUVector<'uint32x2'>;
};

/**
 * Exact bounded envelopes for uniform samples, retaining spikes and explicit missingness.
 *
 * Output length defines 1–16,384 bins. Integer partitions cover the clamped range exactly.
 * One workgroup reduces each bin within each source chunk; chunks merge in source order.
 * Work is O(visible samples + chunks * bins); storage is caller-owned plus workgroup scratch.
 * Re-encoding resets every output. The contributor never reads back, submits or destroys buffers.
 */
export class GPUTimeSeriesEnvelope {
  readonly id: string;
  readonly props: Readonly<GPUTimeSeriesEnvelopeProps>;

  constructor(props: GPUTimeSeriesEnvelopeProps) {
    this.id = props.id ?? 'gpu-timeseries-envelope';
    this.props = {...props};
    const {range, output, sourceIds, counts, series} = props;
    validateTimeSeriesVector(range, 'uint32x2', 8);
    validateTimeSeriesVector(output, 'float32x4', 16);
    validateTimeSeriesVector(sourceIds, 'uint32x4', 16);
    validateTimeSeriesVector(counts, 'uint32x2', 8);
    assert(range.length === 1 && range.data.length === 1);
    // The bin limit also keeps remainder * bin arithmetic inside uint32.
    assert(output.length >= 1 && output.length <= 16384);
    assert(
      [output, sourceIds, counts].every(
        vector => vector.data.length === 1 && vector.length === output.length
      )
    );
    const allocations = new Set(
      [series.values, ...(series.validity ? [series.validity] : []), range].flatMap(vector =>
        vector.data.map(chunk =>
          chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer
        )
      )
    );
    for (const vector of [output, sourceIds, counts]) {
      const buffer = vector.data[0].buffer;
      const physical = buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
      // Each writable output needs a distinct physical allocation, including borrowed wrappers.
      assert(!allocations.has(physical));
      allocations.add(physical);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {series} = this.props;
    const range = graph.importGPUVector(`${this.id}-range`, this.props.range).data[0];
    const output = graph.importGPUVector(`${this.id}-output`, this.props.output).data[0];
    const sourceIds = graph.importGPUVector(`${this.id}-ids`, this.props.sourceIds).data[0];
    const counts = graph.importGPUVector(`${this.id}-counts`, this.props.counts).data[0];
    const values = graph.importGPUVector(`${this.id}-values`, series.values);
    const validity =
      series.validity && graph.importGPUVector(`${this.id}-validity`, series.validity);
    validateChunkViews(
      graph,
      [range, values, ...(validity ? [validity] : [])],
      [output, sourceIds, counts]
    );
    const binCount = output.length;
    const dispatch = getChunkDispatch(
      binCount,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    const bucket = `let bucket = workgroupId.x + ${dispatch.x}u * (workgroupId.y + ${dispatch.y}u * workgroupId.z);
  if (bucket >= ${binCount}u) { return; }`;
    const outputs = {output, sourceIds, counts};
    const declarations = (inputs: Record<string, GraphDataView>) =>
      [...Object.entries(inputs), ...Object.entries(outputs)]
        .map(
          ([name, view], binding) =>
            `@group(0) @binding(${binding}) var<storage, ${binding < Object.keys(inputs).length ? 'read' : 'read_write'}> ${name}: array<${view.format.startsWith('float') ? 'f32' : 'u32'}>;\nconst ${name}Offset: u32 = ${getViewElementOffset(view)}u;`
        )
        .join('\n');
    graph.add(
      createChunkNode(graph, {
        id: `${this.id}-reset`,
        outputs,
        dispatch,
        workgroupSize: 1,
        source: `${declarations({})}
@compute @workgroup_size(1)
fn main(@builtin(workgroup_id) workgroupId: vec3u) {
  ${bucket}
  for (var component = 0u; component < 4u; component++) {
    output[outputOffset + bucket * 4u + component] = 0.0;
    sourceIds[sourceIdsOffset + bucket * 4u + component] = 0xffffffffu;
  }
  counts[countsOffset + bucket * 2u] = 0u;
  counts[countsOffset + bucket * 2u + 1u] = 0u;
}`
      })
    );
    let sourceOffset = 0;
    for (const [chunkIndex, chunk] of values.data.entries()) {
      const chunkStart = sourceOffset;
      sourceOffset += chunk.length;
      if (!chunk.length) continue;
      const inputs: Record<string, GraphDataView> = {range, values: chunk};
      if (validity) inputs['validity'] = validity.data[chunkIndex];
      graph.add(
        createChunkNode(graph, {
          id: `${this.id}-chunk-${chunkIndex}`,
          inputs,
          outputs,
          dispatch,
          workgroupSize: 64,
          source: `${declarations(inputs)}
struct Summary { values: vec4f, identifiers: vec4u, counts: vec2u }
var<workgroup> summaries: array<Summary, 64>;
fn merge(left: Summary, right: Summary) -> Summary {
  var result = left;
  result.counts += right.counts;
  if (right.counts.x == 0u) { return result; }
  if (left.counts.x == 0u) { result.values = right.values; result.identifiers = right.identifiers; return result; }
  if (right.values.x < left.values.x || (right.values.x == left.values.x && right.identifiers.x < left.identifiers.x)) { result.values.x = right.values.x; result.identifiers.x = right.identifiers.x; }
  if (right.values.y > left.values.y || (right.values.y == left.values.y && right.identifiers.y < left.identifiers.y)) { result.values.y = right.values.y; result.identifiers.y = right.identifiers.y; }
  if (right.identifiers.z < left.identifiers.z) { result.values.z = right.values.z; result.identifiers.z = right.identifiers.z; }
  if (right.identifiers.w > left.identifiers.w) { result.values.w = right.values.w; result.identifiers.w = right.identifiers.w; }
  return result;
}
fn boundary(start: u32, span: u32, bin: u32) -> u32 {
  return start + (span / ${binCount}u) * bin + ((span % ${binCount}u) * bin) / ${binCount}u;
}
@compute @workgroup_size(64)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) lane: u32) {
  ${bucket}
  let start = min(range[rangeOffset], ${series.length}u);
  let end = max(start, min(range[rangeOffset + 1u], ${series.length}u));
  let first = max(boundary(start, end - start, bucket), ${chunkStart}u);
  let last = min(boundary(start, end - start, bucket + 1u), ${sourceOffset}u);
  var summary = Summary(vec4f(0.0), vec4u(0xffffffffu), vec2u(0u));
  let length = select(0u, last - first, last > first);
  for (var local = lane; local < length; local += 64u) {
    let sample = first + local;
    let value = values[valuesOffset + sample - ${chunkStart}u];
    let finite = (bitcast<u32>(value) & 0x7f800000u) != 0x7f800000u;
    let accepted = finite ${validity ? `&& validity[validityOffset + sample - ${chunkStart}u] != 0u` : ''};
    if (accepted) {
      summary = merge(summary, Summary(vec4f(value), vec4u(sample), vec2u(1u, 0u)));
    } else { summary.counts.y++; }
    // Prevent overflow when processing a source near the uint32 address limit.
    if (length - local <= 64u) { break; }
  }
  summaries[lane] = summary;
  workgroupBarrier();
  for (var stride = 32u; stride > 0u; stride /= 2u) {
    if (lane < stride) { summaries[lane] = merge(summaries[lane], summaries[lane + stride]); }
    workgroupBarrier();
  }
  if (lane == 0u) {
    var previous = Summary(vec4f(0.0), vec4u(0xffffffffu), vec2u(counts[countsOffset + bucket * 2u], counts[countsOffset + bucket * 2u + 1u]));
    for (var component = 0u; component < 4u; component++) {
      previous.values[component] = output[outputOffset + bucket * 4u + component];
      previous.identifiers[component] = sourceIds[sourceIdsOffset + bucket * 4u + component];
    }
    let result = merge(previous, summaries[0]);
    for (var component = 0u; component < 4u; component++) {
      output[outputOffset + bucket * 4u + component] = result.values[component];
      sourceIds[sourceIdsOffset + bucket * 4u + component] = result.identifiers[component];
    }
    counts[countsOffset + bucket * 2u] = result.counts.x;
    counts[countsOffset + bucket * 2u + 1u] = result.counts.y;
  }
}`
        })
      );
    }
  }
}
