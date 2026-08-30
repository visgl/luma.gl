// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type ComputeShaderLayout, type Device, type QuerySet} from '@luma.gl/core';
import {Computation, ShaderInputs} from '@luma.gl/engine';
import {fp64arithmetic, type ShaderModule} from '@luma.gl/shadertools';

export type FP64BenchmarkMode = 'automatic' | 'classic' | 'integer' | 'float32';
export type FP64BenchmarkOperation = 'add' | 'multiply' | 'divide' | 'square root';

type FP64ComputeBenchmarkResultBase = {
  mode: FP64BenchmarkMode;
  operation: FP64BenchmarkOperation;
  timing: 'GPU timestamp' | 'queue completion';
};

export type FP64ComputeBenchmarkResult = FP64ComputeBenchmarkResultBase &
  (
    | {
        error?: undefined;
        maximumRelativeError: number;
        runtimeMilliseconds: number;
        throughputMillionIterationsPerSecond: number;
      }
    | {
        error: string;
      }
  );

const LANE_COUNT = 8192;
const WORKGROUP_SIZE = 64;
const WORK_ITERATIONS = 32;
const TIMED_DISPATCH_COUNT = 3;
const WORKGROUP_COUNT = LANE_COUNT / WORKGROUP_SIZE;
// Shader modules reserve group-0 bindings 100 and above. fp64arithmetic is the
// only module in these pipelines, so its uniform block receives the first slot.
const FP64_ARITHMETIC_UNIFORM_BINDING = 100;
// ComputationProps currently erases shader-module generics. Widen the type
// without cloning the module so future metadata remains attached.
const FP64_BENCHMARK_MODULE: ShaderModule<any, any, any> = fp64arithmetic;

const BENCHMARK_MODES: FP64BenchmarkMode[] = ['automatic', 'classic', 'integer', 'float32'];
const BENCHMARK_OPERATIONS: FP64BenchmarkOperation[] = ['add', 'multiply', 'divide', 'square root'];

type BenchmarkInputs = {
  data: Float32Array;
  expectedValues: Float64Array;
};

/** Runs a compact, interactive benchmark. It intentionally has no pass/fail performance limits. */
export async function runFP64ComputeBenchmark(
  device: Device
): Promise<FP64ComputeBenchmarkResult[]> {
  if (device.type !== 'webgpu') {
    throw new Error('The FP64 compute benchmark requires WebGPU.');
  }

  await waitForGPU(device);

  const results: FP64ComputeBenchmarkResult[] = [];
  for (const operation of BENCHMARK_OPERATIONS) {
    const inputs = makeBenchmarkInputs(operation);
    for (const mode of BENCHMARK_MODES) {
      try {
        results.push(await runBenchmarkCase(device, mode, operation, inputs));
      } catch (error) {
        results.push({
          error: error instanceof Error ? error.message : String(error),
          mode,
          operation,
          timing: 'queue completion'
        });
      }
    }
  }
  return results;
}

async function runBenchmarkCase(
  device: Device,
  mode: FP64BenchmarkMode,
  operation: FP64BenchmarkOperation,
  inputs: BenchmarkInputs
): Promise<FP64ComputeBenchmarkResult> {
  const inputBuffer = device.createBuffer({
    id: `fp64-benchmark-${mode}-${operation}-input`,
    data: inputs.data,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    id: `fp64-benchmark-${mode}-${operation}-output`,
    byteLength: LANE_COUNT * 2 * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  let computation: Computation | null = null;
  let timestampQuerySet: QuerySet | null = null;

  try {
    computation = makeComputation(device, mode, operation);
    timestampQuerySet = makeTimestampQuerySet(device, mode, operation);
    computation.setBindings({inputValues: inputBuffer, outputValues: outputBuffer});
    computation.updateShaderInputs();

    const warmupPass = device.beginComputePass({});
    computation.dispatch(warmupPass, WORKGROUP_COUNT);
    warmupPass.end();
    device.submit();
    await waitForGPU(device);

    const timedPass = device.beginComputePass(
      timestampQuerySet
        ? {
            timestampQuerySet,
            beginTimestampIndex: 0,
            endTimestampIndex: 1
          }
        : {}
    );
    for (let dispatchIndex = 0; dispatchIndex < TIMED_DISPATCH_COUNT; dispatchIndex++) {
      computation.dispatch(timedPass, WORKGROUP_COUNT);
    }
    timedPass.end();

    const submitTime = performance.now();
    device.submit();
    await waitForGPU(device);
    const completionMilliseconds = performance.now() - submitTime;
    const gpuMilliseconds = await tryReadTimestampDuration(timestampQuerySet);
    const runtimeMilliseconds = gpuMilliseconds ?? completionMilliseconds;

    // Reading results is deliberately outside the timed region.
    const outputBytes = await outputBuffer.readAsync();
    const outputValues = new Float32Array(
      outputBytes.buffer,
      outputBytes.byteOffset,
      outputBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    const maximumRelativeError = getMaximumRelativeError(outputValues, inputs.expectedValues, mode);
    const iterationCount = LANE_COUNT * WORK_ITERATIONS * TIMED_DISPATCH_COUNT;

    return {
      maximumRelativeError,
      mode,
      operation,
      runtimeMilliseconds,
      throughputMillionIterationsPerSecond: iterationCount / runtimeMilliseconds / 1000,
      timing: gpuMilliseconds === undefined ? 'queue completion' : 'GPU timestamp'
    };
  } finally {
    timestampQuerySet?.destroy();
    computation?.destroy();
    outputBuffer.destroy();
    inputBuffer.destroy();
  }
}

function makeComputation(
  device: Device,
  mode: FP64BenchmarkMode,
  operation: FP64BenchmarkOperation
): Computation {
  const useFloat32 = mode === 'float32';
  const defines: Record<string, boolean | number> = {};
  if (mode === 'classic') {
    defines['LUMA_FP64_INTEGER_ARITHMETIC'] = false;
  } else if (mode === 'integer') {
    defines['LUMA_FP64_INTEGER_ARITHMETIC'] = true;
  }
  const usesClassicSplit =
    operation !== 'add' &&
    (mode === 'classic' || (mode === 'automatic' && device.info.gpu !== 'apple'));
  const storageBindings: ComputeShaderLayout['bindings'] = [
    {name: 'inputValues', type: 'read-only-storage', group: 0, location: 1},
    {name: 'outputValues', type: 'storage', group: 0, location: 2}
  ];
  const shaderLayout: ComputeShaderLayout = {
    bindings: usesClassicSplit
      ? [
          {
            name: 'fp64arithmeticUniforms',
            type: 'uniform',
            group: 0,
            location: FP64_ARITHMETIC_UNIFORM_BINDING
          },
          ...storageBindings
        ]
      : storageBindings
  };

  return new Computation(device, {
    id: `fp64-benchmark-${mode}-${operation}`,
    source: makeBenchmarkShader(operation, useFloat32),
    modules: useFloat32 ? [] : [FP64_BENCHMARK_MODULE],
    defines,
    shaderLayout,
    // Do not create a managed module-uniform binding when the selected path
    // cannot reach classic split(). The declaration is absent from the
    // caller-owned layout in those cases and an extra logical binding would
    // produce a misleading validation warning.
    shaderInputs: new ShaderInputs(usesClassicSplit ? {fp64arithmetic} : {})
  });
}

function makeBenchmarkShader(operation: FP64BenchmarkOperation, useFloat32: boolean): string {
  const operationExpression = getOperationExpression(operation, useFloat32);
  const valueType = useFloat32 ? 'f32' : 'vec2<f32>';
  const initialValue = useFloat32 ? 'benchmarkInput.value.x' : 'benchmarkInput.value';
  const operand = useFloat32 ? 'benchmarkInput.operand.x' : 'benchmarkInput.operand';
  const outputValue = useFloat32 ? 'vec2<f32>(value, 0.0)' : 'value';

  return /* wgsl */ `\
struct BenchmarkInput {
  value: vec2<f32>,
  operand: vec2<f32>,
};

@group(0) @binding(1) var<storage, read> inputValues: array<BenchmarkInput>;
@group(0) @binding(2) var<storage, read_write> outputValues: array<vec2<f32>>;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let index = globalInvocationId.x;
  let benchmarkInput = inputValues[index];
  var value: ${valueType} = ${initialValue};
  let operand: ${valueType} = ${operand};
  for (
    var iteration = 0u;
    iteration < ${WORK_ITERATIONS}u;
    iteration = iteration + 1u
  ) {
    value = ${operationExpression};
  }
  outputValues[index] = ${outputValue};
}
`;
}

function getOperationExpression(operation: FP64BenchmarkOperation, useFloat32: boolean): string {
  if (useFloat32) {
    switch (operation) {
      case 'add':
        return 'value + operand';
      case 'multiply':
        return 'value * operand';
      case 'divide':
        return 'value / operand';
      case 'square root':
        return 'sqrt(value + operand)';
    }
  }

  switch (operation) {
    case 'add':
      return 'sum_fp64(value, operand)';
    case 'multiply':
      return 'mul_fp64(value, operand)';
    case 'divide':
      return 'div_fp64(value, operand)';
    case 'square root':
      return 'sqrt_fp64(sum_fp64(value, operand))';
  }
}

function makeBenchmarkInputs(operation: FP64BenchmarkOperation): BenchmarkInputs {
  const data = new Float32Array(LANE_COUNT * 4);
  const expectedValues = new Float64Array(LANE_COUNT);

  for (let laneIndex = 0; laneIndex < LANE_COUNT; laneIndex++) {
    const fraction = laneIndex / (LANE_COUNT - 1);
    const [initialValue, operand] = getInputValues(operation, laneIndex, fraction);
    const [valueHigh, valueLow] = split64(initialValue);
    const [operandHigh, operandLow] = split64(operand);
    const dataOffset = laneIndex * 4;
    data[dataOffset] = valueHigh;
    data[dataOffset + 1] = valueLow;
    data[dataOffset + 2] = operandHigh;
    data[dataOffset + 3] = operandLow;

    let expectedValue = initialValue;
    for (let iteration = 0; iteration < WORK_ITERATIONS; iteration++) {
      expectedValue = applyReferenceOperation(operation, expectedValue, operand);
    }
    expectedValues[laneIndex] = expectedValue;
  }

  return {data, expectedValues};
}

function getInputValues(
  operation: FP64BenchmarkOperation,
  laneIndex: number,
  fraction: number
): [number, number] {
  const lowPart = ((laneIndex % 13) - 6) * 2 ** -31;
  switch (operation) {
    case 'add':
      return [0.75 + fraction * 0.5 + lowPart, 2 ** -27 * (1 + (laneIndex % 7) / 16)];
    case 'multiply':
      return [0.75 + fraction * 0.5 + lowPart, 1 + 2 ** -20 + (laneIndex % 5) * 2 ** -24];
    case 'divide':
      return [0.75 + fraction * 0.5 + lowPart, 1 + 2 ** -20 + (laneIndex % 5) * 2 ** -24];
    case 'square root':
      return [1 + fraction * 3 + lowPart, 0.125 + (laneIndex % 11) * 2 ** -18];
  }
}

function applyReferenceOperation(
  operation: FP64BenchmarkOperation,
  value: number,
  operand: number
): number {
  switch (operation) {
    case 'add':
      return value + operand;
    case 'multiply':
      return value * operand;
    case 'divide':
      return value / operand;
    case 'square root':
      return Math.sqrt(value + operand);
  }
}

function split64(value: number): [number, number] {
  const highPart = Math.fround(value);
  return [highPart, value - highPart];
}

function makeTimestampQuerySet(
  device: Device,
  mode: FP64BenchmarkMode,
  operation: FP64BenchmarkOperation
): QuerySet | null {
  if (!device.features.has('timestamp-query')) {
    return null;
  }
  try {
    return device.createQuerySet({
      id: `fp64-benchmark-${mode}-${operation}-timestamps`,
      type: 'timestamp',
      count: 2
    });
  } catch {
    return null;
  }
}

async function tryReadTimestampDuration(querySet: QuerySet | null): Promise<number | undefined> {
  if (!querySet) {
    return undefined;
  }
  try {
    const duration = await querySet.readTimestampDuration(0, 1);
    return Number.isFinite(duration) && duration > 0 ? duration : undefined;
  } catch {
    return undefined;
  }
}

function getMaximumRelativeError(
  outputValues: Float32Array,
  expectedValues: Float64Array,
  mode: FP64BenchmarkMode
): number {
  let maximumRelativeError = 0;
  for (let laneIndex = 0; laneIndex < LANE_COUNT; laneIndex++) {
    const outputOffset = laneIndex * 2;
    const actualValue =
      outputValues[outputOffset] + (mode === 'float32' ? 0 : outputValues[outputOffset + 1]);
    const expectedValue = expectedValues[laneIndex];
    const relativeError = Math.abs(actualValue - expectedValue) / Math.abs(expectedValue);
    maximumRelativeError = Math.max(maximumRelativeError, relativeError);
  }
  return maximumRelativeError;
}

async function waitForGPU(device: Device): Promise<void> {
  const webgpuQueue = (device.handle as {queue: {onSubmittedWorkDone: () => Promise<void>}}).queue;
  await webgpuQueue.onSubmittedWorkDone();
}
