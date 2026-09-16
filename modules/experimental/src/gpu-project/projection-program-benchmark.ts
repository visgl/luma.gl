// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {Buffer, type Device, type DeviceInfo} from '@luma.gl/core';
import {
  GPUCommandGraph,
  type GraphDataView,
  type CompiledGPUCommandGraph
} from '@luma.gl/gpgpu/gpu-core';
import type {GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {
  addGeospatialPass,
  getGeospatialDispatchLayout,
  getGeospatialInvocationIndexSource
} from '../geospatial/geospatial-utils';
import {
  compileProjectionProgram,
  type ProjectionProgram,
  type CompiledProjection
} from './projection-program';
import {GPUProjectionProgram} from './gpu-projection-program';
import type {ProjectionBounds, ProjectionCoordinates, ProjectionDegree} from './types';
import type {ProjectionProgramMetadata} from './projection-metadata';
import {executeGPUProjectionBenchmark} from './gpu-projection-benchmark';
import {
  getProjectionBenchmarkTime,
  getProjectionBenchmarkThroughput,
  summarizeProjectionBenchmarkSamples,
  type ProjectionBenchmarkDistribution
} from './projection-benchmark';

export type ProjectionProgramBenchmarkVariant = {
  id: string;
  /** Called repeatedly so fitting/planning is measured separately from program compilation. */
  createProgram: () => ProjectionProgram;
  /** Explicit absolute Euclidean error budget, in destination units, including output rounding. */
  maximumError: number;
};

export type ProjectionProgramBenchmarkOptions = {
  /** Shared binary64 source rows. Include boundary/invalid rows explicitly when desired. */
  coordinates: readonly ProjectionCoordinates[];
  /** Independent absolute-coordinate oracle, including expected validity. Never inferred from a variant. */
  oracle: (position: ProjectionCoordinates) => {position: ProjectionCoordinates; valid: boolean};
  variants: readonly ProjectionProgramBenchmarkVariant[];
  /** Independent consumers in one submission. Materialized mode projects once and shares the result. */
  consumerCount?: number;
  /** Enable optional GPU timestamps (default true). Instrumentation prevents compute-pass coalescing. */
  gpuTiming?: boolean;
  warmupIterations?: number;
  measuredIterations?: number;
};

export type ProjectionProgramBenchmarkPathReport = {
  id: string;
  mode: 'inline' | 'materialized';
  metadata: ProjectionProgramMetadata;
  maximumAllowedError: number;
  maximumObservedError: number;
  validRows: number;
  /** Forward adaptive stages actually executed, excluding unused inverse plans. */
  adaptiveStages: {
    index: number;
    patchCount: number;
    degree: ProjectionDegree;
    tolerance: number;
    bounds: ProjectionBounds;
  }[];
  /** Logical projection evaluations per source row in this graph (not measured shader invocations). */
  projectionsPerRow: number;
  dispatchCount: number;
  parameterByteLength: number;
  intermediateByteLength: number;
  bufferByteLength: number;
  planningTimeMilliseconds: ProjectionBenchmarkDistribution;
  programCompilationTimeMilliseconds: ProjectionBenchmarkDistribution;
  /** Graph/pipeline construction; driver caches and deferred compilation affect this measurement. */
  graphCompilationTimeMilliseconds: number;
  /** First synchronized use, including any deferred driver work; not a cold-cache guarantee. */
  firstUseTimeMilliseconds: number;
  cpuEncodeTimeMilliseconds: ProjectionBenchmarkDistribution;
  synchronizedTimeMilliseconds: ProjectionBenchmarkDistribution;
  synchronizedCoordinatesPerSecond: number;
  gpuTimeMilliseconds?: ProjectionBenchmarkDistribution;
};

export type ProjectionProgramBenchmarkReport = {
  device: DeviceInfo;
  inputFormat: 'uint32x4';
  consumer: 'axis-swap';
  consumerCount: number;
  timestampQueries: boolean;
  /** Budgets are equal only when every variant declares the same absolute error threshold. */
  comparison: 'equal-error-budget' | 'different-error-budgets';
  coordinateCount: number;
  warmupIterations: number;
  measuredIterations: number;
  oracleTimeMilliseconds: ProjectionBenchmarkDistribution;
  oracleChecksum: number;
  paths: ProjectionProgramBenchmarkPathReport[];
};

/**
 * Compare caller-selected programs against one independent oracle and an identical axis-swap
 * consumers. Inline execution avoids intermediate buffers; materialization projects once for reuse.
 * Every path validates every row before warmup and again after timing; failure returns no report.
 * Both modes use raw binary64 input and require the same output precision and destination frame.
 */
export async function runProjectionProgramBenchmark(
  device: Device,
  options: ProjectionProgramBenchmarkOptions
): Promise<ProjectionProgramBenchmarkReport> {
  const warmupIterations = options.warmupIterations ?? 2;
  const measuredIterations = options.measuredIterations ?? 5;
  const consumerCount = options.consumerCount ?? 1;
  const timestampQueries = options.gpuTiming !== false && device.features.has('timestamp-query');
  if (
    !options.coordinates.length ||
    options.variants.length < 2 ||
    !Number.isSafeInteger(consumerCount) ||
    consumerCount < 1 ||
    new Set(options.variants.map(variant => variant.id)).size !== options.variants.length ||
    !Number.isSafeInteger(warmupIterations) ||
    warmupIterations < 0 ||
    !Number.isSafeInteger(measuredIterations) ||
    measuredIterations < 1 ||
    options.variants.some(
      variant => !variant.id || !Number.isFinite(variant.maximumError) || variant.maximumError < 0
    )
  ) {
    throw new Error('invalid projection program benchmark options');
  }
  const coordinates = options.coordinates.map(position => [...position] as const);
  const expected = coordinates.map(position => {
    const result = options.oracle(position);
    if (result.valid && !result.position.every(Number.isFinite))
      throw new Error('benchmark oracle returned a non-finite valid row');
    return {position: [...result.position] as const, valid: result.valid};
  });
  const oracleSamples: number[] = [];
  let oracleChecksum = 0;
  for (let iteration = -warmupIterations; iteration < measuredIterations; iteration++) {
    const start = getProjectionBenchmarkTime();
    let checksum = 0;
    for (const coordinate of coordinates) {
      const result = options.oracle(coordinate);
      if (result.valid) checksum += result.position[0] + result.position[1];
    }
    if (iteration >= 0) oracleSamples.push(getProjectionBenchmarkTime() - start);
    oracleChecksum = checksum;
  }
  const paths: ProjectionProgramBenchmarkPathReport[] = [];
  let firstProjection: CompiledProjection | undefined;
  for (const variant of options.variants) {
    const planningSamples: number[] = [];
    const compilationSamples: number[] = [];
    let projection: CompiledProjection | undefined;
    let adaptiveStages: ProjectionProgramBenchmarkPathReport['adaptiveStages'] = [];
    for (let iteration = -warmupIterations; iteration < measuredIterations; iteration++) {
      const start = getProjectionBenchmarkTime();
      const program = variant.createProgram();
      const planned = getProjectionBenchmarkTime();
      projection = compileProjectionProgram(program, {inputFormat: 'uint32x4'});
      if (iteration >= 0) {
        planningSamples.push(planned - start);
        compilationSamples.push(getProjectionBenchmarkTime() - planned);
      }
      adaptiveStages = program.operations.flatMap((operation, index) =>
        operation.type === 'adaptive'
          ? [
              {
                index,
                patchCount: operation.plan.patches.length,
                degree: operation.plan.degree,
                tolerance: operation.plan.tolerance,
                bounds: [...operation.plan.bounds] as ProjectionBounds
              }
            ]
          : []
      );
    }
    const compiledProjection = projection!;
    firstProjection ??= compiledProjection;
    const outputReference = firstProjection;
    if (
      compiledProjection.precision !== firstProjection.precision ||
      (compiledProjection.precision === 'local-f32' &&
        compiledProjection.destinationOrigin.some(
          (value, axis) => value !== outputReference.destinationOrigin[axis]
        ))
    ) {
      throw new Error('benchmark variants must share output precision and destination origin');
    }
    for (const mode of ['inline', 'materialized'] as const) {
      paths.push(
        await measurePath(
          device,
          compiledProjection,
          coordinates,
          expected,
          variant,
          mode,
          consumerCount,
          timestampQueries,
          adaptiveStages,
          warmupIterations,
          measuredIterations,
          summarizeProjectionBenchmarkSamples(planningSamples),
          summarizeProjectionBenchmarkSamples(compilationSamples)
        )
      );
    }
  }
  return {
    device: {...device.info},
    inputFormat: 'uint32x4',
    consumer: 'axis-swap',
    consumerCount,
    timestampQueries,
    comparison: options.variants.every(
      variant => variant.maximumError === options.variants[0].maximumError
    )
      ? 'equal-error-budget'
      : 'different-error-budgets',
    coordinateCount: coordinates.length,
    warmupIterations,
    measuredIterations,
    oracleTimeMilliseconds: summarizeProjectionBenchmarkSamples(oracleSamples),
    oracleChecksum,
    paths
  };
}

async function measurePath(
  device: Device,
  projection: CompiledProjection,
  coordinates: readonly ProjectionCoordinates[],
  expected: readonly {position: ProjectionCoordinates; valid: boolean}[],
  variant: ProjectionProgramBenchmarkVariant,
  mode: 'inline' | 'materialized',
  consumerCount: number,
  timestampQueries: boolean,
  adaptiveStages: ProjectionProgramBenchmarkPathReport['adaptiveStages'],
  warmupIterations: number,
  measuredIterations: number,
  planningTimeMilliseconds: ProjectionBenchmarkDistribution,
  programCompilationTimeMilliseconds: ProjectionBenchmarkDistribution
): Promise<ProjectionProgramBenchmarkPathReport> {
  const graph = new GPUCommandGraph(device);
  const buffers: Buffer[] = [];
  let contributor: GPUProjectionProgram | undefined;
  let compiled: CompiledGPUCommandGraph<void> | undefined;
  const makeView = <Format extends GPUVectorFormat>(
    id: string,
    format: Format,
    byteLength: number,
    data?: Uint32Array
  ): GraphDataView<Format> => {
    const buffer = device.createBuffer({
      id,
      byteLength,
      ...(data ? {data} : {}),
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    buffers.push(buffer);
    return graph.createDataView(graph.importBuffer({id, byteLength, usage: buffer.usage}, buffer), {
      format,
      length: format === 'uint32' && id === 'parameters' ? byteLength / 4 : coordinates.length
    });
  };
  try {
    const positions = makeView(
      'positions',
      'uint32x4',
      coordinates.length * 16,
      new Uint32Array(Float64Array.from(coordinates.flat()).buffer)
    );
    const format = projection.precision === 'double-single' ? 'float32x4' : 'float32x2';
    const outputByteLength = coordinates.length * (format === 'float32x4' ? 16 : 8);
    const outputs = Array.from({length: consumerCount}, (_value, index) => {
      const output = makeView(`output-${index}`, format, outputByteLength);
      const outputBuffer = buffers[buffers.length - 1];
      const validity = makeView(`validity-${index}`, 'uint32', coordinates.length * 4);
      const validityBuffer = buffers[buffers.length - 1];
      return {output, outputBuffer, validity, validityBuffer};
    });
    const shader = projection.getShader();
    const dispatchLayout = getGeospatialDispatchLayout(
      coordinates.length,
      device.limits.maxComputeWorkgroupsPerDimension
    );
    const indexing = `${getGeospatialInvocationIndexSource(dispatchLayout)}
  if (index >= ${coordinates.length}u) { return; }`;
    const swap = format === 'float32x4' ? 'zwxy' : 'yx';
    let intermediateByteLength = 0;
    if (mode === 'materialized') {
      const intermediate = makeView('intermediate', format, outputByteLength);
      const intermediateValidity = makeView(
        'intermediate-validity',
        'uint32',
        coordinates.length * 4
      );
      intermediateByteLength = outputByteLength + coordinates.length * 4;
      contributor = new GPUProjectionProgram({
        projection,
        positions,
        output: intermediate,
        validity: intermediateValidity
      });
      contributor.addToGraph(graph);
      for (const [index, {output, validity}] of outputs.entries()) {
        addGeospatialPass(graph, {
          id: `consumer-${index}`,
          dispatchLayout,
          bindings: {
            positions: intermediate,
            sourceValidity: intermediateValidity,
            output,
            validity
          },
          resources: [
            {buffer: intermediate, usage: 'storage-read'},
            {buffer: intermediateValidity, usage: 'storage-read'},
            {buffer: output, usage: 'storage-write'},
            {buffer: validity, usage: 'storage-write'}
          ],
          source: `
@group(0) @binding(auto) var<storage, read> positions: array<${shader.outputType}>;
@group(0) @binding(auto) var<storage, read> sourceValidity: array<u32>;
@group(0) @binding(auto) var<storage, read_write> output: array<${shader.outputType}>;
@group(0) @binding(auto) var<storage, read_write> validity: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_id) localId: vec3u) {
  ${indexing}
  output[index] = positions[index].${swap};
  validity[index] = sourceValidity[index];
}`
        });
      }
    } else {
      const words = projection.packParameters();
      const parameters = makeView('parameters', 'uint32', words.byteLength, words);
      for (const [index, {output, validity}] of outputs.entries()) {
        addGeospatialPass(graph, {
          id: `inline-consumer-${index}`,
          dispatchLayout,
          precise: true,
          bindings: {[shader.bindingName]: parameters, positions, output, validity},
          resources: [
            {buffer: parameters, usage: 'storage-read'},
            {buffer: positions, usage: 'storage-read'},
            {buffer: output, usage: 'storage-write'},
            {buffer: validity, usage: 'storage-write'}
          ],
          source: `${shader.source}
@group(0) @binding(auto) var<storage, read> positions: array<vec4u>;
@group(0) @binding(auto) var<storage, read_write> output: array<${shader.outputType}>;
@group(0) @binding(auto) var<storage, read_write> validity: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_id) localId: vec3u) {
  ${indexing}
  let projected = ${shader.entryPoint}(positions[index], 1u);
  output[index] = projected.position.${swap};
  validity[index] = projected.valid;
}`
        });
      }
    }
    const compilationStart = getProjectionBenchmarkTime();
    compiled = await graph.compileAsync();
    const graphCompilationTimeMilliseconds = getProjectionBenchmarkTime() - compilationStart;
    // Drain uploads/compilation before timing submission-to-fence intervals.
    const uploadFence = device.createFence();
    try {
      await uploadFence.signaled;
    } finally {
      uploadFence.destroy();
    }
    const firstUse = await executeGPUProjectionBenchmark(
      device,
      compiled,
      'program-benchmark-validation'
    );
    const validate = async (): Promise<number> => {
      let maximumError = 0;
      for (const {outputBuffer, validityBuffer} of outputs) {
        const outputBytes = await outputBuffer.readAsync();
        const validityBytes = await validityBuffer.readAsync();
        const values = new Float32Array(
          outputBytes.buffer,
          outputBytes.byteOffset,
          outputBytes.byteLength / 4
        );
        const validities = new Uint32Array(
          validityBytes.buffer,
          validityBytes.byteOffset,
          coordinates.length
        );
        for (let row = 0; row < coordinates.length; row++) {
          if (validities[row] !== Number(expected[row].valid))
            throw new Error(`${variant.id}/${mode}: validity differs from oracle at row ${row}`);
          const width = format === 'float32x4' ? 4 : 2;
          const offset = row * width;
          if (!expected[row].valid) {
            if (values.subarray(offset, offset + width).some(value => value !== 0))
              throw new Error(`${variant.id}/${mode}: invalid row must be zero`);
            continue;
          }
          const actual =
            format === 'float32x4'
              ? [values[offset + 2] + values[offset + 3], values[offset] + values[offset + 1]]
              : [
                  values[offset + 1] + projection.destinationOrigin[0],
                  values[offset] + projection.destinationOrigin[1]
                ];
          const error = Math.hypot(
            actual[0] - expected[row].position[0],
            actual[1] - expected[row].position[1]
          );
          if (!Number.isFinite(error) || error > variant.maximumError)
            throw new Error(
              `${variant.id}/${mode}: row ${row} exceeds error budget (${error} > ${variant.maximumError})`
            );
          maximumError = Math.max(maximumError, error);
        }
      }
      return maximumError;
    };
    let maximumObservedError = await validate();
    for (let iteration = 0; iteration < warmupIterations; iteration++)
      await executeGPUProjectionBenchmark(device, compiled, 'program-benchmark-warmup');
    const executions: Awaited<ReturnType<typeof executeGPUProjectionBenchmark>>[] = [];
    for (let iteration = 0; iteration < measuredIterations; iteration++) {
      // Reserve two timestamps per dispatch, even if graph compilation groups compatible passes.
      const querySet = timestampQueries
        ? device.createQuerySet({
            type: 'timestamp',
            count: 2 * (consumerCount + (mode === 'materialized' ? 1 : 0))
          })
        : undefined;
      try {
        executions.push(
          await executeGPUProjectionBenchmark(
            device,
            compiled,
            'program-benchmark-measured',
            querySet
          )
        );
      } finally {
        querySet?.destroy();
      }
    }
    maximumObservedError = Math.max(maximumObservedError, await validate());
    const synchronizedTimeMilliseconds = summarizeProjectionBenchmarkSamples(
      executions.map(execution => execution.synchronizedTimeMilliseconds)
    );
    const gpuSamples = executions.flatMap(execution =>
      execution.timing.gpuTimeMilliseconds === undefined
        ? []
        : [execution.timing.gpuTimeMilliseconds]
    );
    const parameterByteLength = projection.packParameters().byteLength;
    return {
      id: variant.id,
      mode,
      metadata: projection.metadata,
      maximumAllowedError: variant.maximumError,
      maximumObservedError,
      validRows: expected.filter(row => row.valid).length,
      adaptiveStages,
      projectionsPerRow: mode === 'materialized' ? 1 : consumerCount,
      dispatchCount: consumerCount + (mode === 'materialized' ? 1 : 0),
      parameterByteLength,
      intermediateByteLength,
      bufferByteLength:
        buffers.reduce((total, buffer) => total + buffer.byteLength, 0) +
        (mode === 'materialized' ? parameterByteLength : 0),
      planningTimeMilliseconds,
      programCompilationTimeMilliseconds,
      graphCompilationTimeMilliseconds,
      firstUseTimeMilliseconds: firstUse.synchronizedTimeMilliseconds,
      cpuEncodeTimeMilliseconds: summarizeProjectionBenchmarkSamples(
        executions.map(execution => execution.timing.cpuEncodeTimeMilliseconds)
      ),
      synchronizedTimeMilliseconds,
      synchronizedCoordinatesPerSecond: getProjectionBenchmarkThroughput(
        coordinates.length,
        synchronizedTimeMilliseconds.median
      ),
      ...(gpuSamples.length
        ? {gpuTimeMilliseconds: summarizeProjectionBenchmarkSamples(gpuSamples)}
        : {})
    };
  } finally {
    compiled?.destroy();
    contributor?.destroy();
    for (const buffer of buffers) buffer.destroy();
  }
}
