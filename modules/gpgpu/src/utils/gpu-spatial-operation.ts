// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import type {GPUCommandGraph, GraphDataView} from '../gpu-core/gpu-command-graph';
import {createChunkNode, validateChunkViews} from '../gpu-core/gpu-chunk-utils';
import {getViewElementOffset, validatePackedView} from '../gpu-core/graph-data-view-utils';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-core/gpu-dispatch-utils';

type SpatialView = GraphDataView<'float32x3'> | GraphDataView<'uint32'> | GraphDataView<'float32'>;

/** Shared packed spatial kernel plumbing. No allocation, submission, or ownership transfer. @internal */
export function getSpatialOperationNodes<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    length: number;
    inputs: Record<string, SpatialView>;
    outputs: Record<string, SpatialView>;
    atomicOutputs?: boolean;
    body: string;
  }
) {
  validateChunkViews(graph, Object.values(props.inputs), Object.values(props.outputs));
  const entries = [...Object.entries(props.inputs), ...Object.entries(props.outputs)];
  for (const [, view] of entries)
    validatePackedView(view, ['float32x3', 'uint32', 'float32'], props.id);
  if (!props.length) return [];
  const dispatch = getBoundedDispatchLayout(
    props.id,
    props.length,
    256,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const declarations = entries
    .map(([name, view], binding) => {
      const output = binding >= Object.keys(props.inputs).length;
      const atomic = output && props.atomicOutputs;
      // Atomic outputs are uint32 counters and representative IDs only.
      assert(!atomic || view.format === 'uint32');
      const scalar = view.format === 'uint32' ? 'u32' : 'f32';
      const vector = view.format === 'float32x3';
      const valueType = vector ? 'vec3f' : scalar;
      const address = `${getViewElementOffset(view)}u + row * ${vector ? 3 : 1}u`;
      const title = name[0].toUpperCase() + name.slice(1);
      const read = atomic
        ? `atomicLoad(&${name}[offset])`
        : vector
          ? `vec3f(${name}[offset], ${name}[offset + 1u], ${name}[offset + 2u])`
          : `${name}[offset]`;
      const write = atomic
        ? `atomicStore(&${name}[offset], value);`
        : vector
          ? `${name}[offset] = value.x; ${name}[offset + 1u] = value.y; ${name}[offset + 2u] = value.z;`
          : `${name}[offset] = value;`;
      return `@group(0) @binding(${binding}) var<storage, ${output ? 'read_write' : 'read'}> ${name}: array<${atomic ? 'atomic<u32>' : scalar}>;
fn read${title}(row: u32) -> ${valueType} { let offset = ${address}; return ${read}; }
${output ? `fn write${title}(row: u32, value: ${valueType}) { let offset = ${address}; ${write} }` : ''}
${
  atomic
    ? `fn add${title}(row: u32, value: u32) { atomicAdd(&${name}[${address}], value); }
fn min${title}(row: u32, value: u32) { atomicMin(&${name}[${address}], value); }`
    : ''
}`;
    })
    .join('\n');
  return [
    createChunkNode(graph, {
      ...props,
      dispatch,
      source: `${declarations}
fn safeNormal(value: vec3f) -> vec3f {
  let magnitude = length(value);
  if (!(magnitude > 0.0) || magnitude > 3.402823e38) { return vec3f(0.0); }
  return value / magnitude;
}
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(dispatch, 256)}
  if (index >= ${props.length}u) { return; }
  ${props.body}
}`
    })
  ];
}
