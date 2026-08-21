import React, {type ReactNode, useEffect, useId, useState} from 'react';
import {Buffer, type Device} from '@luma.gl/core';
import {type CompiledGPUCommandGraph, GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUGridIndex,
  type GPUGridIndexView,
  GPUPointSpatialQuery
} from '@luma.gl/experimental/geospatial';
import {createDevice, useStore} from '../../react-luma/store/device-store';
import {LiveBenchmarkPanel} from './live-benchmark-panel';

const POINT_COUNTS = [16_384, 65_536, 262_144] as const;
const DEFAULT_POINT_COUNT = 65_536;
const GRID_DIMENSION = 32;
const WARMUP_ITERATIONS = 2;
const MEASURED_ITERATIONS = 7;
const INDEX_BOUNDS = [0, 0, 1, 1] as const;
const QUERY_BOUNDS = new Float32Array([0.35, 0.37, 0.66, 0.63]);

type SpatialBenchmarkOutput = {
  ids: Buffer;
  count: Buffer;
  overflow: Buffer;
};

type SpatialBenchmarkIndex = {
  cellOffsets: Buffer;
  rowIndices: Buffer;
  count: Buffer;
  overflow: Buffer;
};

type SpatialBenchmarkResult = {
  label: string;
  medianMilliseconds: number;
  pointCount: number;
  resultCount: number;
};

/** Compares real luSpatial scan and indexed queries against one equivalent CPU predicate. */
export function SpatialBenchmark(): ReactNode {
  const selectedDevice = useStore(store => store.presentationDevice);
  const [pointCount, setPointCount] = useState(DEFAULT_POINT_COUNT);
  const [unsupportedReason, setUnsupportedReason] = useState<string>();
  const pointCountId = useId();

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
      setUnsupportedReason('WebGPU is unavailable in this browser or secure context.');
    }
  }, []);

  return (
    <div>
      <label htmlFor={pointCountId}>
        Dataset size{' '}
        <select
          id={pointCountId}
          onChange={event => setPointCount(Number(event.target.value))}
          value={pointCount}
        >
          {POINT_COUNTS.map(count => (
            <option key={count} value={count}>
              {count.toLocaleString()} points
            </option>
          ))}
        </select>
      </label>

      <LiveBenchmarkPanel
        title="Live luSpatial: CPU vs. WebGPU"
        description="Run the same bounds predicate and compact matching point IDs on your CPU, an unindexed WebGPU scan, and a reusable WebGPU grid index. GPU timings include command encoding, submission, and completed execution."
        onRun={async () => {
          const device =
            selectedDevice?.type === 'webgpu' ? selectedDevice : await createDevice('webgpu-core');
          return await runSpatialBenchmark(device, pointCount);
        }}
        runLabel="Run live CPU and WebGPU spatial benchmark"
        unsupportedReason={unsupportedReason}
      />
    </div>
  );
}

async function runSpatialBenchmark(device: Device, pointCount: number): Promise<ReactNode> {
  const positions = makeSpatialPositions(pointCount);
  const cpuOutput = new Uint32Array(pointCount);
  const cpuResult = measureCPUQuery(positions, QUERY_BOUNDS, cpuOutput);
  const expectedIds = cpuOutput.slice(0, cpuResult.resultCount);
  const ownedBuffers: Buffer[] = [];
  const compiledGraphs: CompiledGPUCommandGraph[] = [];

  try {
    const positionBuffer = createSpatialInputBuffer(device, ownedBuffers, positions);
    const queryBuffer = createSpatialInputBuffer(device, ownedBuffers, QUERY_BOUNDS);
    const scanOutput = createSpatialOutput(device, ownedBuffers, pointCount);
    const indexedOutput = createSpatialOutput(device, ownedBuffers, pointCount);
    const index = createSpatialIndex(device, ownedBuffers, pointCount);

    const indexBuild = compileIndexBuild(device, positionBuffer, index, pointCount);
    compiledGraphs.push(indexBuild);
    const scanQuery = compileSpatialQuery(
      device,
      positionBuffer,
      queryBuffer,
      scanOutput,
      pointCount
    );
    compiledGraphs.push(scanQuery);
    const indexedQuery = compileSpatialQuery(
      device,
      positionBuffer,
      queryBuffer,
      indexedOutput,
      pointCount,
      index
    );
    compiledGraphs.push(indexedQuery);

    await executeSpatialGraph(device, indexBuild, 'docs-spatial-index-warmup');
    const indexBuildMilliseconds = await executeSpatialGraph(
      device,
      indexBuild,
      'docs-spatial-index-build'
    );
    const indexedPointCount = await readSpatialScalar(index.count);
    const indexOverflow = await readSpatialScalar(index.overflow);
    if (indexedPointCount !== pointCount || indexOverflow !== 0) {
      throw new Error('The WebGPU grid index did not include the complete benchmark dataset.');
    }

    const scanResult = await measureGPUQuery(device, scanQuery, scanOutput, expectedIds, {
      label: 'WebGPU point scan',
      pointCount
    });
    const indexedResult = await measureGPUQuery(device, indexedQuery, indexedOutput, expectedIds, {
      label: 'WebGPU reusable grid',
      pointCount
    });
    const indexByteLength =
      index.cellOffsets.byteLength +
      index.rowIndices.byteLength +
      index.count.byteLength +
      index.overflow.byteLength;

    return (
      <SpatialBenchmarkResults
        indexBuildMilliseconds={indexBuildMilliseconds}
        indexByteLength={indexByteLength}
        results={[cpuResult, scanResult, indexedResult]}
      />
    );
  } finally {
    for (const graph of compiledGraphs) graph.destroy();
    for (const buffer of ownedBuffers) buffer.destroy();
  }
}

function SpatialBenchmarkResults({
  results,
  indexBuildMilliseconds,
  indexByteLength
}: {
  results: SpatialBenchmarkResult[];
  indexBuildMilliseconds: number;
  indexByteLength: number;
}): ReactNode {
  const cpuMilliseconds = results[0].medianMilliseconds;

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Implementation</th>
            <th>Median</th>
            <th>Points / second</th>
            <th>CPU comparison</th>
            <th>Matching IDs</th>
          </tr>
        </thead>
        <tbody>
          {results.map(result => (
            <tr key={result.label}>
              <td>{result.label}</td>
              <td>{result.medianMilliseconds.toFixed(3)} ms</td>
              <td>
                {Math.round(
                  (result.pointCount * 1000) / Math.max(result.medianMilliseconds, Number.EPSILON)
                ).toLocaleString()}
              </td>
              <td>
                {(cpuMilliseconds / Math.max(result.medianMilliseconds, Number.EPSILON)).toFixed(2)}
                ×
              </td>
              <td>{result.resultCount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        One-time {GRID_DIMENSION} × {GRID_DIMENSION} grid build:{' '}
        <strong>{indexBuildMilliseconds.toFixed(3)} ms</strong>; persistent index storage:{' '}
        <strong>{(indexByteLength / 1024).toFixed(1)} KiB</strong>. Query timings exclude this
        build, initial upload, graph compilation, and verification readback. Every GPU result was
        checked against all CPU-selected IDs.
      </p>
      <p>
        Medians use {WARMUP_ITERATIONS} warmup and {MEASURED_ITERATIONS} measured iterations.
        Results depend on your browser, adapter, current load, and query selectivity.
      </p>
    </>
  );
}

function makeSpatialPositions(pointCount: number): Float32Array {
  const positions = new Float32Array(pointCount * 2);
  let randomState = 0x4c554d41;
  for (let index = 0; index < positions.length; index++) {
    randomState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0;
    positions[index] = randomState / 0x1_0000_0000;
  }
  return positions;
}

function measureCPUQuery(
  positions: Float32Array,
  bounds: Float32Array,
  output: Uint32Array
): SpatialBenchmarkResult {
  for (let iteration = 0; iteration < WARMUP_ITERATIONS; iteration++) {
    runCPUSpatialQuery(positions, bounds, output);
  }

  const durations: number[] = [];
  let resultCount = 0;
  for (let iteration = 0; iteration < MEASURED_ITERATIONS; iteration++) {
    const startTime = performance.now();
    resultCount = runCPUSpatialQuery(positions, bounds, output);
    durations.push(performance.now() - startTime);
  }

  return {
    label: 'CPU point scan',
    medianMilliseconds: getMedianDuration(durations),
    pointCount: positions.length / 2,
    resultCount
  };
}

function runCPUSpatialQuery(
  positions: Float32Array,
  bounds: Float32Array,
  output: Uint32Array
): number {
  const [minimumX, minimumY, maximumX, maximumY] = bounds;
  let resultCount = 0;
  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const positionX = positions[rowIndex * 2];
    const positionY = positions[rowIndex * 2 + 1];
    if (
      positionX >= minimumX &&
      positionX <= maximumX &&
      positionY >= minimumY &&
      positionY <= maximumY
    ) {
      output[resultCount++] = rowIndex;
    }
  }
  return resultCount;
}

async function measureGPUQuery(
  device: Device,
  graph: CompiledGPUCommandGraph,
  output: SpatialBenchmarkOutput,
  expectedIds: Uint32Array,
  props: {label: string; pointCount: number}
): Promise<SpatialBenchmarkResult> {
  await executeSpatialGraph(device, graph, `${props.label}-validation`);
  await verifySpatialOutput(output, expectedIds, props.label);

  for (let iteration = 0; iteration < WARMUP_ITERATIONS; iteration++) {
    await executeSpatialGraph(device, graph, `${props.label}-warmup-${iteration}`);
  }

  const durations: number[] = [];
  for (let iteration = 0; iteration < MEASURED_ITERATIONS; iteration++) {
    durations.push(
      await executeSpatialGraph(device, graph, `${props.label}-measurement-${iteration}`)
    );
  }
  await verifySpatialOutput(output, expectedIds, props.label);

  return {
    label: props.label,
    medianMilliseconds: getMedianDuration(durations),
    pointCount: props.pointCount,
    resultCount: expectedIds.length
  };
}

async function executeSpatialGraph(
  device: Device,
  graph: CompiledGPUCommandGraph,
  identifier: string
): Promise<number> {
  const commandEncoder = device.createCommandEncoder({id: identifier});
  const startTime = performance.now();
  let submitted = false;

  try {
    graph.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    submitted = true;
    const fence = device.createFence();
    try {
      await fence.signaled;
    } finally {
      fence.destroy();
    }
    return performance.now() - startTime;
  } catch (error) {
    if (!submitted) commandEncoder.destroy();
    throw error;
  }
}

async function verifySpatialOutput(
  output: SpatialBenchmarkOutput,
  expectedIds: Uint32Array,
  label: string
): Promise<void> {
  const resultCount = await readSpatialScalar(output.count);
  const overflow = await readSpatialScalar(output.overflow);
  if (overflow !== 0 || resultCount !== expectedIds.length) {
    throw new Error(`${label} returned an incomplete result or an incorrect result count.`);
  }

  const resultBytes = await output.ids.readAsync(0, resultCount * Uint32Array.BYTES_PER_ELEMENT);
  const actualIds = new Uint32Array(resultBytes.buffer, resultBytes.byteOffset, resultCount).sort();
  if (actualIds.some((identifier, index) => identifier !== expectedIds[index])) {
    throw new Error(`${label} returned IDs that do not match the CPU predicate.`);
  }
}

async function readSpatialScalar(buffer: Buffer): Promise<number> {
  const bytes = await buffer.readAsync(0, Uint32Array.BYTES_PER_ELEMENT);
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true);
}

function compileIndexBuild(
  device: Device,
  positions: Buffer,
  index: SpatialBenchmarkIndex,
  pointCount: number
): CompiledGPUCommandGraph {
  const graph = new GPUCommandGraph(device, {id: 'docs-spatial-grid-build'});
  const positionView = importSpatialView(graph, 'positions', positions, 'float32x2', pointCount);
  const cellOffsets = importSpatialView(
    graph,
    'cell-offsets',
    index.cellOffsets,
    'uint32',
    GRID_DIMENSION * GRID_DIMENSION + 1
  );
  const rowIndices = importSpatialView(
    graph,
    'row-indices',
    index.rowIndices,
    'uint32',
    pointCount
  );
  const count = importSpatialView(graph, 'index-count', index.count, 'uint32', 1);
  const overflow = importSpatialView(graph, 'index-overflow', index.overflow, 'uint32', 1);

  new GPUGridIndex({
    id: 'docs-spatial-grid',
    positions: positionView,
    gridSize: [GRID_DIMENSION, GRID_DIMENSION],
    bounds: INDEX_BOUNDS,
    cellOffsets,
    objectIds: rowIndices,
    count,
    overflow
  }).addToGraph(graph);

  return graph.compile();
}

function compileSpatialQuery(
  device: Device,
  positions: Buffer,
  query: Buffer,
  output: SpatialBenchmarkOutput,
  pointCount: number,
  index?: SpatialBenchmarkIndex
): CompiledGPUCommandGraph {
  const graph = new GPUCommandGraph(device, {
    id: index ? 'docs-spatial-indexed-query' : 'docs-spatial-scan-query'
  });
  const positionView = importSpatialView(graph, 'positions', positions, 'float32x2', pointCount);
  const queryView = importSpatialView(graph, 'query', query, 'float32', QUERY_BOUNDS.length);
  const resultViews = {
    ids: importSpatialView(graph, 'result-ids', output.ids, 'uint32', pointCount),
    count: importSpatialView(graph, 'result-count', output.count, 'uint32', 1),
    overflow: importSpatialView(graph, 'result-overflow', output.overflow, 'uint32', 1)
  };
  const indexView: GPUGridIndexView | undefined = index
    ? {
        gridSize: [GRID_DIMENSION, GRID_DIMENSION],
        bounds: INDEX_BOUNDS,
        cellOffsets: importSpatialView(
          graph,
          'cell-offsets',
          index.cellOffsets,
          'uint32',
          GRID_DIMENSION * GRID_DIMENSION + 1
        ),
        rowIndices: importSpatialView(graph, 'row-indices', index.rowIndices, 'uint32', pointCount),
        count: importSpatialView(graph, 'index-count', index.count, 'uint32', 1),
        overflow: importSpatialView(graph, 'index-overflow', index.overflow, 'uint32', 1)
      }
    : undefined;

  new GPUPointSpatialQuery({
    id: index ? 'docs-spatial-indexed' : 'docs-spatial-scan',
    positions: positionView,
    kind: 'bounds',
    query: queryView,
    output: resultViews,
    ...(indexView ? {index: indexView} : {})
  }).addToGraph(graph);

  return graph.compile();
}

function importSpatialView<Format extends 'float32' | 'float32x2' | 'uint32'>(
  graph: GPUCommandGraph,
  identifier: string,
  buffer: Buffer,
  format: Format,
  length: number
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id: identifier, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

function createSpatialInputBuffer(
  device: Device,
  ownedBuffers: Buffer[],
  data: Float32Array
): Buffer {
  const buffer = device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
  ownedBuffers.push(buffer);
  return buffer;
}

function createSpatialOutput(
  device: Device,
  ownedBuffers: Buffer[],
  pointCount: number
): SpatialBenchmarkOutput {
  return {
    ids: createSpatialStorageBuffer(device, ownedBuffers, pointCount),
    count: createSpatialStorageBuffer(device, ownedBuffers, 1),
    overflow: createSpatialStorageBuffer(device, ownedBuffers, 1)
  };
}

function createSpatialIndex(
  device: Device,
  ownedBuffers: Buffer[],
  pointCount: number
): SpatialBenchmarkIndex {
  return {
    cellOffsets: createSpatialStorageBuffer(
      device,
      ownedBuffers,
      GRID_DIMENSION * GRID_DIMENSION + 1
    ),
    rowIndices: createSpatialStorageBuffer(device, ownedBuffers, pointCount),
    count: createSpatialStorageBuffer(device, ownedBuffers, 1),
    overflow: createSpatialStorageBuffer(device, ownedBuffers, 1)
  };
}

function createSpatialStorageBuffer(
  device: Device,
  ownedBuffers: Buffer[],
  rowCount: number
): Buffer {
  const buffer = device.createBuffer({
    byteLength: rowCount * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  ownedBuffers.push(buffer);
  return buffer;
}

function getMedianDuration(durations: number[]): number {
  const sortedDurations = [...durations].sort((left, right) => left - right);
  return sortedDurations[Math.floor(sortedDurations.length / 2)];
}
