// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  addGeospatialPass,
  getGeospatialDispatchLayout,
  getGeospatialInvocationIndexSource
} from '../geospatial/geospatial-utils';
import {indexProjectionPlan} from './projection-routing';
import {findProjectionPatch, packProjectionPlan} from './projection-plan';
import {getProjectionShaderFunctions} from './projection-shader';
import {executeGPUProjectionBenchmark} from './gpu-projection-benchmark';
import {
  getProjectionBenchmarkTime,
  summarizeProjectionBenchmarkSamples,
  type ProjectionBenchmarkDistribution
} from './projection-benchmark';
import {
  runProjectionProgramBenchmark,
  type ProjectionProgramBenchmarkOptions,
  type ProjectionProgramBenchmarkReport
} from './projection-program-benchmark';
import type {ProjectionCoordinates, ProjectionPlan} from './types';

export type ProjectionRoutingBenchmarkOptions = Omit<
  ProjectionProgramBenchmarkOptions,
  'variants'
> & {
  /** One immutable fit shared by scan/index: degree, coefficients and precision cannot vary. */
  plan: ProjectionPlan;
  maximumError: number;
};

export type ProjectionRoutingBenchmarkReport = {
  program: ProjectionProgramBenchmarkReport;
  patchCount: number;
  indexBuildTimeMilliseconds: number;
  indexByteLength: number;
  routing: {
    strategy: 'scan' | 'indexed';
    validRows: number;
    patchChecksum: number;
    packingTimeMilliseconds: number;
    graphCompilationTimeMilliseconds: number;
    parameterByteLength: number;
    cpuEncodeTimeMilliseconds: ProjectionBenchmarkDistribution;
    synchronizedTimeMilliseconds: ProjectionBenchmarkDistribution;
    gpuTimeMilliseconds?: ProjectionBenchmarkDistribution;
  }[];
};

/**
 * Qualifies full double-single projection against an independent oracle, then measures a lookup-only
 * shader. Both routes share the exact same fit and patch predicate. Lookup IDs must agree before and
 * after timing. Lookup time includes output writes/dispatch overhead, not polynomial evaluation;
 * full-program timings show whether a lookup win survives in the actual workload.
 */
export async function runProjectionRoutingBenchmark(
  device: Device,
  options: ProjectionRoutingBenchmarkOptions
): Promise<ProjectionRoutingBenchmarkReport> {
  const scanPlan = {...options.plan, routingIndex: undefined};
  const buildStart = getProjectionBenchmarkTime();
  const indexedPlan = indexProjectionPlan(scanPlan);
  const indexBuildTimeMilliseconds = getProjectionBenchmarkTime() - buildStart;
  const program = await runProjectionProgramBenchmark(device, {
    ...options,
    variants: [
      {
        id: 'scan',
        maximumError: options.maximumError,
        createProgram: () => ({
          precision: 'double-single',
          operations: [{type: 'adaptive', plan: scanPlan}]
        })
      },
      {
        id: 'indexed',
        maximumError: options.maximumError,
        createProgram: () => ({
          precision: 'double-single',
          operations: [{type: 'adaptive', plan: indexedPlan}]
        })
      }
    ]
  });
  const routing: ProjectionRoutingBenchmarkReport['routing'] = [];
  let reference: Uint32Array | undefined;
  const expectedPatchIds = Int32Array.from(options.coordinates, coordinate =>
    findProjectionPatch(scanPlan, coordinate)
  );
  for (const plan of [scanPlan, indexedPlan]) {
    const strategy = plan.routingIndex ? 'indexed' : 'scan';
    const buffers: Buffer[] = [];
    let compiled: CompiledGPUCommandGraph<void> | undefined;
    try {
      const graph = new GPUCommandGraph(device);
      const input = new Float64Array(options.coordinates.length * 2);
      options.coordinates.forEach((position, index) => input.set(position, index * 2));
      const packingStart = getProjectionBenchmarkTime();
      const parameters = packProjectionPlan(plan);
      const packingTimeMilliseconds = getProjectionBenchmarkTime() - packingStart;
      const makeView = (id: string, data: Uint32Array) => {
        const buffer = device.createBuffer({
          data,
          usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
        });
        buffers.push(buffer);
        return graph.createDataView(
          graph.importBuffer({id, byteLength: buffer.byteLength, usage: buffer.usage}, buffer),
          {format: 'uint32', length: data.length}
        );
      };
      const positions = makeView('positions', new Uint32Array(input.buffer));
      const projectionPlans = makeView('parameters', parameters);
      const output = makeView('output', new Uint32Array(options.coordinates.length));
      const dispatchLayout = getGeospatialDispatchLayout(
        options.coordinates.length,
        device.limits.maxComputeWorkgroupsPerDimension
      );
      addGeospatialPass(graph, {
        id: 'routing-only',
        precise: true,
        dispatchLayout,
        // Match declaration order: @binding(auto) assigns locations in WGSL source order.
        bindings: {projectionPlans, positions, output},
        resources: [
          {buffer: positions, usage: 'storage-read'},
          {buffer: projectionPlans, usage: 'storage-read'},
          {buffer: output, usage: 'storage-write'}
        ],
        source: `${getProjectionShaderFunctions({precise: true, doubleSingle: true, patchCount: plan.patches.length, planOffset: 0, strictDomains: plan.strictDomains, routingNodeCount: plan.routingIndex?.length})}
@group(0) @binding(auto) var<storage, read> positions: array<vec4u>;
@group(0) @binding(auto) var<storage, read_write> output: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_id) localId: vec3u) {
  ${getGeospatialInvocationIndexSource(dispatchLayout)}
  if (index >= ${options.coordinates.length}u) { return; }
  let words = positions[index];
  let position = makeRawPoint(words.x, words.y, words.z, words.w);
  output[index] = INVALID_PATCH;
  if (rawPointIsFinite(position) && projectionPlanContains(position)) { output[index] = findProjectionPatch(position); }
}`
      });
      const compilationStart = getProjectionBenchmarkTime();
      compiled = await graph.compileAsync();
      const graphCompilationTimeMilliseconds = getProjectionBenchmarkTime() - compilationStart;
      const validate = async (): Promise<void> => {
        const bytes = await buffers[2].readAsync();
        const actual = new Uint32Array(bytes.buffer, bytes.byteOffset, options.coordinates.length);
        validateProjectionRouting(plan, options.coordinates, actual, expectedPatchIds);
        if (!reference) reference = actual.slice();
        if (actual.some((value, index) => value !== reference![index]))
          throw new Error('indexed routing differs from canonical scan');
      };
      await executeGPUProjectionBenchmark(device, compiled, 'routing-validation');
      await validate();
      for (let iteration = 0; iteration < program.warmupIterations; iteration++)
        await executeGPUProjectionBenchmark(device, compiled, 'routing-warmup');
      const encodingSamples: number[] = [];
      const synchronizedSamples: number[] = [];
      const gpuSamples: number[] = [];
      for (let iteration = 0; iteration < program.measuredIterations; iteration++) {
        const querySet = program.timestampQueries
          ? device.createQuerySet({type: 'timestamp', count: 2})
          : undefined;
        try {
          const execution = await executeGPUProjectionBenchmark(
            device,
            compiled,
            'routing-measured',
            querySet
          );
          encodingSamples.push(execution.timing.cpuEncodeTimeMilliseconds);
          synchronizedSamples.push(execution.synchronizedTimeMilliseconds);
          if (execution.timing.gpuTimeMilliseconds !== undefined)
            gpuSamples.push(execution.timing.gpuTimeMilliseconds);
        } finally {
          querySet?.destroy();
        }
      }
      await validate();
      routing.push({
        strategy,
        validRows: expectedPatchIds.reduce((count, patchId) => count + Number(patchId >= 0), 0),
        patchChecksum: reference!.reduce(
          (sum, patchId) => sum + (patchId === 0xffffffff ? 0 : patchId + 1),
          0
        ),
        packingTimeMilliseconds,
        graphCompilationTimeMilliseconds,
        parameterByteLength: parameters.byteLength,
        cpuEncodeTimeMilliseconds: summarizeProjectionBenchmarkSamples(encodingSamples),
        synchronizedTimeMilliseconds: summarizeProjectionBenchmarkSamples(synchronizedSamples),
        ...(gpuSamples.length
          ? {gpuTimeMilliseconds: summarizeProjectionBenchmarkSamples(gpuSamples)}
          : {})
      });
    } finally {
      compiled?.destroy();
      for (const buffer of buffers) buffer.destroy();
    }
  }
  return {
    program,
    patchCount: scanPlan.patches.length,
    indexBuildTimeMilliseconds,
    indexByteLength: routing[1].parameterByteLength - routing[0].parameterByteLength,
    routing
  };
}

/** @internal Independent validity/membership gate; matching two broken GPU routes is insufficient. */
export function validateProjectionRouting(
  plan: ProjectionPlan,
  coordinates: readonly ProjectionCoordinates[],
  actual: Uint32Array,
  expectedPatchIds: Int32Array
): void {
  for (let row = 0; row < coordinates.length; row++) {
    const patchId = actual[row];
    if ((patchId !== 0xffffffff) !== expectedPatchIds[row] >= 0)
      throw new Error(`routing validity differs from CPU at row ${row}`);
    if (patchId === 0xffffffff) continue;
    const patch = plan.patches[patchId];
    if (!patch) throw new Error(`routing ID outside plan at row ${row}`);
    for (let axis = 0; axis < 2; axis++) {
      const coordinate = coordinates[row][axis];
      const normalized = Math.fround(
        Math.fround(coordinate - patch.sourceOrigin[axis]) / Math.fround(patch.sourceScale[axis])
      );
      const minimum = Math.fround(
        (patch.bounds[axis] - patch.sourceOrigin[axis]) / patch.sourceScale[axis]
      );
      // Permit the unchanged GPU patch predicate's seam band, not arbitrary wrong patches.
      if (
        !Number.isFinite(normalized) ||
        normalized < minimum - 2 ** -21 ||
        normalized > minimum + 2 + 2 ** -21 ||
        (plan.strictDomains &&
          (coordinate < patch.bounds[axis] || coordinate > patch.bounds[axis + 2]))
      )
        throw new Error(`routing ID does not cover row ${row}`);
    }
  }
}
