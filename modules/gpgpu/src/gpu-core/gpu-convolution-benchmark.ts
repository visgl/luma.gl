// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {type CompiledGPUCommandGraph, GPUCommandGraph} from './gpu-command-graph';
import {
  getGPUConvolutionSupport,
  GPUConvolution,
  makeGPUConvolutionStats,
  type GPUConvolutionStrategy
} from './gpu-convolution';
import {
  summarizeGPUWorkgroupScanBenchmarkSamples,
  type GPUWorkgroupScanBenchmarkDistribution
} from './gpu-workgroup-scan-benchmark';

const DEFAULT_WIDTH = 512;
const DEFAULT_HEIGHT = 512;
const DEFAULT_CASES: readonly GPUConvolutionBenchmarkCase[] = [
  {kernelWidth: 3, kernelHeight: 3},
  {kernelWidth: 31, kernelHeight: 31},
  {kernelWidth: 127, kernelHeight: 127}
];
const DEFAULT_WARMUP_ITERATIONS = 3;
const DEFAULT_MEASURED_ITERATIONS = 20;
const CORRECTNESS_TOLERANCE = 0.001;

/** Convolution strategy measured by {@link runGPUConvolutionBenchmark}. */
export type GPUConvolutionBenchmarkStrategy = Exclude<GPUConvolutionStrategy, 'auto'>;

/** One kernel shape included in a direct-versus-FFT comparison. */
export type GPUConvolutionBenchmarkCase = {
  kernelWidth: number;
  kernelHeight: number;
};

/** Options for the correctness-gated convolution crossover benchmark. */
export type GPUConvolutionBenchmarkProps = {
  id?: string;
  width?: number;
  height?: number;
  cases?: readonly GPUConvolutionBenchmarkCase[];
  warmupIterations?: number;
  measuredIterations?: number;
};

/** Timing distribution for one convolution strategy and kernel shape. */
export type GPUConvolutionBenchmarkPathReport = {
  strategy: GPUConvolutionBenchmarkStrategy;
  cpuEncodeTimeMilliseconds: GPUWorkgroupScanBenchmarkDistribution;
  gpuTimeMilliseconds?: GPUWorkgroupScanBenchmarkDistribution;
};

/** Direct-versus-FFT results for one kernel shape. */
export type GPUConvolutionBenchmarkCaseReport = GPUConvolutionBenchmarkCase & {
  kernelElementCount: number;
  fftWidth: number;
  fftHeight: number;
  fftSupported: boolean;
  fftUnsupportedReason?: string;
  fasterStrategy?: GPUConvolutionBenchmarkStrategy;
  paths: GPUConvolutionBenchmarkPathReport[];
};

/** Reproducible convolution cases and the observed direct/FFT crossover. */
export type GPUConvolutionBenchmarkReport = {
  id: string;
  width: number;
  height: number;
  warmupIterations: number;
  measuredIterations: number;
  timestampQueries: boolean;
  observedFFTCrossoverKernelArea?: number;
  cases: GPUConvolutionBenchmarkCaseReport[];
};

type BenchmarkPath = {
  strategy: GPUConvolutionBenchmarkStrategy;
  nodeCount: number;
  outputBuffer: Buffer;
  compiled: CompiledGPUCommandGraph<void>;
};

type BenchmarkSamples = {cpu: number[]; gpu: number[]};

/**
 * Compares direct and spectral convolution across representative kernel sizes.
 *
 * A spatial impulse and deterministic kernel provide a cheap correctness oracle. Readback is
 * confined to this helper; {@link GPUConvolution} itself remains graph-native.
 */
export async function runGPUConvolutionBenchmark(
  device: Device,
  props: GPUConvolutionBenchmarkProps = {}
): Promise<GPUConvolutionBenchmarkReport> {
  const id = props.id ?? 'gpu-convolution-benchmark';
  const width = props.width ?? DEFAULT_WIDTH;
  const height = props.height ?? DEFAULT_HEIGHT;
  const cases = props.cases ?? DEFAULT_CASES;
  const warmupIterations = props.warmupIterations ?? DEFAULT_WARMUP_ITERATIONS;
  const measuredIterations = props.measuredIterations ?? DEFAULT_MEASURED_ITERATIONS;
  validateGPUConvolutionBenchmarkProps(cases, warmupIterations, measuredIterations);

  const elementCount = width * height;
  const inputValues = new Float32Array(elementCount);
  const impulseX = Math.floor(width / 2);
  const impulseY = Math.floor(height / 2);
  inputValues[impulseY * width + impulseX] = 1;
  const inputBuffer = device.createBuffer({
    id: `${id}-input`,
    data: inputValues,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const timestampQueries = device.features.has('timestamp-query');
  const caseReports: GPUConvolutionBenchmarkCaseReport[] = [];

  try {
    for (const benchmarkCase of cases) {
      caseReports.push(
        await runGPUConvolutionBenchmarkCase(device, {
          id,
          inputBuffer,
          width,
          height,
          impulseX,
          impulseY,
          benchmarkCase,
          warmupIterations,
          measuredIterations,
          timestampQueries
        })
      );
    }
  } finally {
    inputBuffer.destroy();
  }

  return {
    id,
    width,
    height,
    warmupIterations,
    measuredIterations,
    timestampQueries,
    observedFFTCrossoverKernelArea: caseReports.find(report => report.fasterStrategy === 'fft')
      ?.kernelElementCount,
    cases: caseReports
  };
}

async function runGPUConvolutionBenchmarkCase(
  device: Device,
  props: {
    id: string;
    inputBuffer: Buffer;
    width: number;
    height: number;
    impulseX: number;
    impulseY: number;
    benchmarkCase: GPUConvolutionBenchmarkCase;
    warmupIterations: number;
    measuredIterations: number;
    timestampQueries: boolean;
  }
): Promise<GPUConvolutionBenchmarkCaseReport> {
  const {kernelWidth, kernelHeight} = props.benchmarkCase;
  const stats = makeGPUConvolutionStats({
    width: props.width,
    height: props.height,
    kernelWidth,
    kernelHeight
  });
  const directSupport = getGPUConvolutionSupport(device, {
    width: props.width,
    height: props.height,
    kernelWidth,
    kernelHeight,
    strategy: 'direct'
  });
  if (!directSupport.supported) {
    throw new Error(directSupport.reason);
  }
  const fftSupport = getGPUConvolutionSupport(device, {
    width: props.width,
    height: props.height,
    kernelWidth,
    kernelHeight,
    strategy: 'fft'
  });
  const strategies: GPUConvolutionBenchmarkStrategy[] = fftSupport.supported
    ? ['direct', 'fft']
    : ['direct'];
  const kernelValues = makeGPUConvolutionBenchmarkKernel(kernelWidth, kernelHeight);
  const expectedValues = makeGPUConvolutionBenchmarkOracle(
    props.width,
    props.height,
    props.impulseX,
    props.impulseY,
    kernelValues,
    kernelWidth,
    kernelHeight
  );
  const caseId = `${props.id}-${kernelWidth}x${kernelHeight}`;
  const kernelBuffer = device.createBuffer({
    id: `${caseId}-kernel`,
    data: kernelValues,
    usage: Buffer.STORAGE
  });
  const paths: BenchmarkPath[] = [];
  const samples = new Map<GPUConvolutionBenchmarkStrategy, BenchmarkSamples>(
    strategies.map(strategy => [strategy, {cpu: [], gpu: []}])
  );

  try {
    for (const strategy of strategies) {
      paths.push(
        makeGPUConvolutionBenchmarkPath(
          device,
          caseId,
          props.inputBuffer,
          kernelBuffer,
          props.width,
          props.height,
          kernelWidth,
          kernelHeight,
          strategy,
          strategy === 'direct' ? 1 : stats.fftDispatchCount
        )
      );
    }
    for (const path of paths) {
      for (let iteration = 0; iteration < props.warmupIterations; iteration++) {
        encodeAndSubmitGPUConvolutionBenchmark(
          device,
          path,
          `${caseId}-${path.strategy}-warmup-${iteration}`
        );
      }
      await validateGPUConvolutionBenchmarkPath(path, expectedValues, caseId);
    }

    for (let iteration = 0; iteration < props.measuredIterations; iteration++) {
      const orderedPaths = iteration % 2 === 0 ? paths : [...paths].reverse();
      for (const path of orderedPaths) {
        const querySet = props.timestampQueries
          ? device.createQuerySet({
              id: `${caseId}-${path.strategy}-timestamps-${iteration}`,
              type: 'timestamp',
              count: path.nodeCount * 2
            })
          : undefined;
        const commandEncoder = device.createCommandEncoder({
          id: `${caseId}-${path.strategy}-measured-${iteration}`,
          timeProfilingQuerySet: querySet
        });
        try {
          const encoding = path.compiled.encode(commandEncoder, {parameters: undefined});
          device.submit(commandEncoder.finish());
          const timing = await encoding.readTimings();
          const pathSamples = samples.get(path.strategy)!;
          pathSamples.cpu.push(timing.cpuEncodeTimeMilliseconds);
          if (timing.gpuTimeMilliseconds !== undefined) {
            pathSamples.gpu.push(timing.gpuTimeMilliseconds);
          }
        } catch (error) {
          commandEncoder.destroy();
          throw error;
        } finally {
          querySet?.destroy();
        }
      }
    }

    const pathReports = paths.map(path => {
      const pathSamples = samples.get(path.strategy)!;
      return {
        strategy: path.strategy,
        cpuEncodeTimeMilliseconds: summarizeGPUWorkgroupScanBenchmarkSamples(pathSamples.cpu),
        ...(pathSamples.gpu.length > 0
          ? {gpuTimeMilliseconds: summarizeGPUWorkgroupScanBenchmarkSamples(pathSamples.gpu)}
          : {})
      };
    });
    return {
      kernelWidth,
      kernelHeight,
      kernelElementCount: stats.kernelElementCount,
      fftWidth: stats.fftWidth,
      fftHeight: stats.fftHeight,
      fftSupported: fftSupport.supported,
      ...(!fftSupport.supported ? {fftUnsupportedReason: fftSupport.reason} : {}),
      fasterStrategy: getGPUConvolutionBenchmarkFasterStrategy(pathReports),
      paths: pathReports
    };
  } finally {
    for (const path of paths) {
      path.compiled.destroy();
      path.outputBuffer.destroy();
    }
    kernelBuffer.destroy();
  }
}

function makeGPUConvolutionBenchmarkPath(
  device: Device,
  id: string,
  inputBuffer: Buffer,
  kernelBuffer: Buffer,
  width: number,
  height: number,
  kernelWidth: number,
  kernelHeight: number,
  strategy: GPUConvolutionBenchmarkStrategy,
  nodeCount: number
): BenchmarkPath {
  const elementCount = width * height;
  const outputBuffer = device.createBuffer({
    id: `${id}-${strategy}-output`,
    byteLength: elementCount * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: `${id}-${strategy}`});
  const inputHandle = graph.importBuffer(
    {id: 'input', byteLength: inputBuffer.byteLength, usage: inputBuffer.usage},
    inputBuffer
  );
  const kernelHandle = graph.importBuffer(
    {id: 'kernel', byteLength: kernelBuffer.byteLength, usage: kernelBuffer.usage},
    kernelBuffer
  );
  const outputHandle = graph.importBuffer(
    {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
    outputBuffer
  );
  const input = graph.createDataView(inputHandle, {format: 'float32', length: elementCount});
  const kernel = graph.createDataView(kernelHandle, {
    format: 'float32',
    length: kernelWidth * kernelHeight
  });
  const output = graph.createDataView(outputHandle, {format: 'float32', length: elementCount});
  new GPUConvolution({
    id: `${id}-${strategy}`,
    input,
    kernel,
    output,
    width,
    height,
    kernelWidth,
    kernelHeight,
    strategy
  }).addToGraph(graph);
  return {strategy, nodeCount, outputBuffer, compiled: graph.compile()};
}

function encodeAndSubmitGPUConvolutionBenchmark(
  device: Device,
  path: BenchmarkPath,
  id: string
): void {
  const commandEncoder = device.createCommandEncoder({id});
  try {
    path.compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
  } catch (error) {
    commandEncoder.destroy();
    throw error;
  }
}

async function validateGPUConvolutionBenchmarkPath(
  path: BenchmarkPath,
  expectedValues: Float32Array,
  id: string
): Promise<void> {
  const outputBytes = await path.outputBuffer.readAsync();
  const outputValues = new Float32Array(
    outputBytes.buffer,
    outputBytes.byteOffset,
    expectedValues.length
  );
  for (let index = 0; index < expectedValues.length; index++) {
    if (Math.abs(outputValues[index] - expectedValues[index]) > CORRECTNESS_TOLERANCE) {
      throw new Error(`${id} ${path.strategy} path does not match the impulse oracle`);
    }
  }
}

function makeGPUConvolutionBenchmarkKernel(width: number, height: number): Float32Array {
  const values = Float32Array.from({length: width * height}, (_, index) => (index % 17) + 1);
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map(value => value / total);
}

function makeGPUConvolutionBenchmarkOracle(
  width: number,
  height: number,
  impulseX: number,
  impulseY: number,
  kernel: Float32Array,
  kernelWidth: number,
  kernelHeight: number
): Float32Array {
  const output = new Float32Array(width * height);
  const centerX = Math.floor(kernelWidth / 2);
  const centerY = Math.floor(kernelHeight / 2);
  for (let kernelY = 0; kernelY < kernelHeight; kernelY++) {
    for (let kernelX = 0; kernelX < kernelWidth; kernelX++) {
      const outputX = impulseX + kernelX - centerX;
      const outputY = impulseY + kernelY - centerY;
      if (outputX >= 0 && outputX < width && outputY >= 0 && outputY < height) {
        output[outputY * width + outputX] = kernel[kernelY * kernelWidth + kernelX];
      }
    }
  }
  return output;
}

function getGPUConvolutionBenchmarkFasterStrategy(
  paths: GPUConvolutionBenchmarkPathReport[]
): GPUConvolutionBenchmarkStrategy | undefined {
  const direct = paths.find(path => path.strategy === 'direct')?.gpuTimeMilliseconds;
  const fft = paths.find(path => path.strategy === 'fft')?.gpuTimeMilliseconds;
  if (!direct || !fft) {
    return undefined;
  }
  return fft.median < direct.median ? 'fft' : 'direct';
}

function validateGPUConvolutionBenchmarkProps(
  cases: readonly GPUConvolutionBenchmarkCase[],
  warmupIterations: number,
  measuredIterations: number
): void {
  if (cases.length === 0) {
    throw new Error('GPUConvolution benchmark requires at least one kernel case');
  }
  if (
    !Number.isSafeInteger(warmupIterations) ||
    warmupIterations < 1 ||
    !Number.isSafeInteger(measuredIterations) ||
    measuredIterations < 1
  ) {
    throw new Error('GPUConvolution benchmark iteration counts must be positive safe integers');
  }
}
