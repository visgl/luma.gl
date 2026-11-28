// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {Buffer, Texture, type Device} from '@luma.gl/core';
import {WebGPUDevice} from '@luma.gl/core/webgpu';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {cellToLatLng, latLngToCell} from 'h3-js';
import {GPUH3CellProjection} from '@luma.gl/graph/gpu-h3';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPUData, GPUVector, type GPUVectorFormat} from '@luma.gl/graph/gpu-data';
import {GPUProjectionProgram, type ProjectionCoordinates} from '@luma.gl/graph/gpu-project';
import {
  prepareCRSProjection,
  ProjectionRenderTransform,
  ProjectionTableTransform
} from '@luma.gl/graph/gpu-project-crs';
import {expect, it} from 'vitest';
import {parsePerformanceSweep} from '../../graph/test/gpu-project/projection-performance-fixtures';
import {
  GPUProjectedPointLayer,
  type GPUProjectedPointPickingInfo
} from '../src/layers/gpu-projected-point-layer';
import {GPUMaterializedPointLayer} from '../src/layers/gpu-materialized-point-layer';
import {getGPUDataBuffer} from '../src/layers/gpu-vector-layer-utils';

const TARGET_SIZE = 768;
const DESTINATION = '+proj=utm +zone=10 +datum=WGS84';
const BOUNDS = [-122.5, 37.7, -122.3, 37.9] as const;
const TOLERANCE_METERS = 0.0005;
const WARMUP_ITERATIONS = 2;
const MEASURED_ITERATIONS = 7;
const renderCounts = [1, 4] as const;
const modes = [
  'cpu',
  'cpu-round-trip',
  'materialized',
  'materialized-resident',
  'materialized-grouped',
  'inline'
] as const;
const producerSweep = import.meta.env['VITE_GPU_PROJECT_RENDER_H3_PRODUCER'] === 'true';
const groupedChunkCount = Number(import.meta.env['VITE_GPU_PROJECT_GROUPED_CHUNKS'] ?? 0);
if (![0, 1, 2].includes(groupedChunkCount)) {
  throw new Error('Expected zero, one, or two chunks per dispatch');
}
const residentSweep = import.meta.env['VITE_GPU_PROJECT_RENDER_RESIDENT_ONLY'] === 'true';
const attributeResidentCost = import.meta.env['VITE_GPU_PROJECT_RENDER_ATTRIBUTION'] === 'true';
type Mode = (typeof modes)[number];
type Input = {
  positions: Float64Array;
  inputValidity: Uint32Array;
  cells?: BigUint64Array;
};
const rowCounts = parsePerformanceSweep(
  import.meta.env['VITE_GPU_PROJECT_RENDER_ROWS'],
  [1024, 4096, 16384]
);
const batchSizes = parsePerformanceSweep(
  import.meta.env['VITE_GPU_PROJECT_RENDER_BATCH_ROWS'],
  [4096]
);

if (rowCounts.some(rowCount => rowCount < 2 || rowCount > 16384)) {
  throw new Error('Cartesian benchmark grids require 2–16,384 rows for separable picks');
}

for (const rowCount of rowCounts) {
  for (const batchSize of batchSizes) {
    it(`compares Cartesian projection with ${rowCount} rows and ${batchSize}-row chunks`, async context => {
      const device = await getWebGPUTestDevice();
      if (
        !(device instanceof WebGPUDevice) ||
        device.info.gpu === 'software' ||
        device.info.gpuType === 'cpu' ||
        device.info.fallback
      )
        return context.skip();

      const preparedStart = performance.now();
      const prepared = prepareCRSProjection({
        from: 'EPSG:4326',
        to: DESTINATION,
        bounds: BOUNDS,
        degree: 3,
        tolerance: TOLERANCE_METERS
      });
      if (prepared.status !== 'ready') throw new Error(JSON.stringify(prepared.reasons));
      const center = prepared.projection.projectSync([-122.4, 37.8]);
      const transform = new ProjectionRenderTransform(prepared, {
        origin: [center[0], center[1]],
        scale: [0.057, 0.057]
      });
      const cpu = new ProjectionTableTransform(prepared);
      const preparationMs = performance.now() - preparedStart;

      const inputs = [
        makeInputs(rowCount, batchSize, 0),
        makeInputs(rowCount, batchSize, 1)
      ] as const;
      let referenceFrames: Uint8Array[] | undefined;
      const paths = [];
      let referenceWords: Uint32Array[][] | undefined;
      let residentFrames: Uint8Array[] | undefined;
      for (const mode of modes) {
        if (mode === 'materialized-grouped' && !groupedChunkCount) continue;
        if (
          (producerSweep || groupedChunkCount) &&
          mode !== 'cpu' &&
          mode !== 'materialized-resident' &&
          mode !== 'materialized-grouped'
        )
          continue;
        if ((residentSweep || attributeResidentCost) && mode === 'inline') continue;
        const {frames, words, ...report} = await measurePath(
          device,
          mode,
          inputs,
          batchSize,
          transform,
          cpu,
          referenceFrames
        );
        referenceFrames ??= frames;
        if (mode === 'materialized-resident') {
          referenceWords = words;
          residentFrames = frames;
        }
        if (mode === 'materialized-grouped' && producerSweep) {
          expect(
            frames.every((frame, index) =>
              frame.every((value, offset) => value === residentFrames![index][offset])
            )
          ).toBe(true);
        }
        if (mode === 'materialized-grouped' && !producerSweep) {
          expect(words).toHaveLength(2);
          expect(words).toEqual(referenceWords);
        }
        paths.push(report);
      }
      console.log(
        `PROJECTION_RENDER_PERFORMANCE ${JSON.stringify({
          schemaVersion: 4,
          producer: producerSweep ? 'GPUH3CellProjection' : undefined,
          capturedAt: new Date().toISOString(),
          revision: import.meta.env['VITE_GPU_PROJECT_REVISION'] ?? 'unspecified',
          browser: navigator.userAgent,
          adapter: device.info,
          rowCount,
          batchSize,
          validRows: inputs[0].reduce(
            (count, input) => count + input.inputValidity.reduce((sum, value) => sum + value, 0),
            0
          ),
          targetSize: TARGET_SIZE,
          preparationMs,
          warmupIterations: WARMUP_ITERATIONS,
          measuredIterations: MEASURED_ITERATIONS,
          toleranceMeters: TOLERANCE_METERS,
          storageBindings: device.limits.maxStorageBuffersPerShaderStage,
          groupedChunkCount,
          paths
        })}`
      );
    }, 180000);
  }
}

function makeInputs(rowCount: number, batchSize: number, update: number): Input[] {
  const width = Math.ceil(Math.sqrt(rowCount));
  // Preserve separation between point centers up to the largest default grid.
  const spacing = 0.079 / width;
  const inputs: Input[] = [];
  for (let offset = 0; offset < rowCount; offset += batchSize) {
    const length = Math.min(batchSize, rowCount - offset);
    const positions = new Float64Array(length * 2);
    const inputValidity = new Uint32Array(length);
    for (let index = 0; index < length; index++) {
      const row = index + offset;
      positions[index * 2] = -122.4 + ((row % width) - width / 2 + update * 0.42) * spacing;
      positions[index * 2 + 1] =
        37.8 + (Math.floor(row / width) - width / 2 + update * 0.23) * spacing;
      inputValidity[index] = Number(row % 11 !== 0);
    }
    const cells = producerSweep ? new BigUint64Array(length) : undefined;
    if (cells) {
      for (let row = 0; row < length; row++) {
        const cell = latLngToCell(positions[row * 2 + 1], positions[row * 2], 12);
        const [latitude, longitude] = cellToLatLng(cell);
        positions[row * 2] = Math.fround(longitude);
        positions[row * 2 + 1] = Math.fround(latitude);
        cells[row] = inputValidity[row] ? BigInt(`0x${cell}`) : 0n;
      }
    }
    inputs.push({positions, inputValidity, cells});
  }
  return inputs;
}

function allocateVector<Format extends GPUVectorFormat>(
  device: Device,
  inputs: Input[],
  format: Format,
  bytesPerRow: number,
  usage: number
): GPUVector<Format> {
  return new GPUVector({
    type: 'data',
    name: format,
    format,
    ownsData: true,
    data: inputs.map(
      ({inputValidity}) =>
        new GPUData({
          format,
          length: inputValidity.length,
          ownsBuffer: true,
          buffer: device.createBuffer({byteLength: bytesPerRow * inputValidity.length, usage})
        })
    )
  });
}

function importChunk<Format extends GPUVectorFormat>(
  graph: GPUCommandGraph,
  id: string,
  data: GPUData<Format>
) {
  const buffer = getGPUDataBuffer(data);
  const {format, length} = data;
  if (!format) throw new Error('Expected a typed benchmark position or validity buffer');
  return graph.createDataView<Format>(
    graph.importBuffer({id, byteLength: buffer.byteLength, usage: buffer.usage}, buffer),
    {format, length}
  );
}

async function measurePath(
  device: WebGPUDevice,
  mode: Mode,
  inputs: readonly [Input[], Input[]],
  batchSize: number,
  transform: ProjectionRenderTransform,
  cpu: ProjectionTableTransform,
  referenceFrames?: Uint8Array[]
) {
  const vertexUsage = Buffer.VERTEX | Buffer.COPY_DST;
  const cpuRoundTrip = mode === 'cpu-round-trip';
  const cpuProjection = mode === 'cpu' || cpuRoundTrip;
  const grouped = mode === 'materialized-grouped';
  const resident = mode === 'materialized-resident' || grouped;
  const gpuUsage =
    vertexUsage |
    Buffer.STORAGE |
    (cpuRoundTrip || (groupedChunkCount && !producerSweep) ? Buffer.COPY_SRC : 0);
  const producer = resident && producerSweep;
  const raw =
    mode === 'cpu' || producer
      ? undefined
      : allocateVector(device, inputs[0], 'uint32x4', 16, gpuUsage);
  const inputValidity = cpuProjection
    ? undefined
    : allocateVector(device, inputs[0], 'uint32', 4, gpuUsage);
  const local =
    mode === 'inline' ? undefined : allocateVector(device, inputs[0], 'float32x2', 8, gpuUsage);
  const outputValidity =
    mode === 'inline' ? undefined : allocateVector(device, inputs[0], 'uint32', 4, gpuUsage);
  const secondRaw =
    (resident && !producer) || cpuRoundTrip
      ? allocateVector(device, inputs[1], 'uint32x4', 16, gpuUsage)
      : undefined;
  const staging = cpuRoundTrip
    ? device.createBuffer({
        byteLength: inputs[0].reduce((sum, batch) => sum + batch.positions.byteLength, 0),
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      })
    : undefined;
  const producerCells = producer
    ? inputs.map(input =>
        allocateVector(device, input, 'uint32x2', 8, Buffer.STORAGE | Buffer.COPY_DST)
      )
    : [];
  const producerPositions = producer
    ? allocateVector(device, inputs[0], 'float32x2', 8, Buffer.STORAGE)
    : undefined;
  const projection = producer ? transform.compileForInputFormat('float32x2') : transform.compiled;
  const programs: GPUProjectionProgram[] = [];
  const graphCount = resident ? 2 : Number(mode === 'materialized');
  const graphs = Array.from({length: graphCount}, (_, stateIndex) => {
    const graph = new GPUCommandGraph(device);
    const positions = stateIndex === 0 ? raw : secondRaw;
    const producedPositionViews = producerPositions
      ? graph.importGPUVector('positions', producerPositions)
      : undefined;
    if (producedPositionViews || groupedChunkCount) {
      const positionViews = producedPositionViews ?? graph.importGPUVector('positions', positions!);
      const inputValidityViews = graph.importGPUVector('input-validity', inputValidity!);
      if (producedPositionViews) {
        const cellViews = graph.importGPUVector('h3-cells', producerCells[stateIndex]);
        for (const [index, cells] of cellViews.data.entries()) {
          new GPUH3CellProjection({
            id: `h3-centers-${index}`,
            cells,
            output: producedPositionViews.data[index],
            validity: inputValidityViews.data[index]
          }).addToGraph(graph);
        }
      }
      const program = new GPUProjectionProgram({
        groupChunks: grouped && groupedChunkCount === 2,
        projection,
        positions: positionViews,
        inputValidity: inputValidityViews,
        output: graph.importGPUVector('output', local!),
        validity: graph.importGPUVector('validity', outputValidity!)
      });
      programs.push(program);
      program.addToGraph(graph);
    } else {
      for (const [index, chunk] of positions!.data.entries()) {
        const program = new GPUProjectionProgram({
          id: `cartesian-${index}`,
          projection,
          positions: importChunk(graph, `raw-${index}`, chunk),
          inputValidity: importChunk(graph, `mask-${index}`, inputValidity!.data[index]),
          output: importChunk(graph, `local-${index}`, local!.data[index]),
          validity: importChunk(graph, `validity-${index}`, outputValidity!.data[index])
        });
        programs.push(program);
        program.addToGraph(graph);
      }
    }
    return graph.compile();
  });
  const texture = device.createTexture({
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    colorAttachments: [texture],
    depthStencilAttachment: 'depth24plus'
  });
  const parent = document.createElement('div');
  document.body.append(parent);
  const layout = texture.computeMemoryLayout();
  const readback = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.MAP_READ | Buffer.COPY_DST
  });
  let current = inputs[0];
  const getReferencePosition = (row: number): ProjectionCoordinates => {
    const {positions} = current[Math.floor(row / batchSize)];
    const index = (row % batchSize) * 2;
    return [positions[index], positions[index + 1]];
  };
  const getSourcePosition = (row: number): ProjectionCoordinates | null => {
    if (!producer) return getReferencePosition(row);
    const cell = current[Math.floor(row / batchSize)].cells![row % batchSize];
    if (!cell) return null;
    const [latitude, longitude] = cellToLatLng(cell.toString(16));
    return [Math.fround(longitude), Math.fround(latitude)];
  };
  const common = {id: 'cartesian-points', transform, getSourcePosition, pickable: true};
  const layer =
    mode === 'inline'
      ? new GPUProjectedPointLayer({
          ...common,
          getPosition: raw!,
          inputValidity: inputValidity!,
          getColor: [255, 0, 0],
          pointSize: 4
        })
      : new GPUMaterializedPointLayer({
          ...common,
          positions: local!,
          validity: outputValidity!,
          getColor: [255, 0, 0]
        });
  const errors: string[] = [];
  let renderedFrames = 0;
  function uploadResidentInputs(): number {
    let bytes = 0;
    if (producer) {
      for (const [stateIndex, cells] of producerCells.entries()) {
        for (const [chunkIndex, chunk] of cells.data.entries()) {
          const cellWords = new Uint32Array(inputs[stateIndex][chunkIndex].cells!.buffer);
          getGPUDataBuffer(chunk).write(cellWords);
          bytes += cellWords.byteLength;
        }
      }
      return bytes;
    }
    for (const [stateIndex, positions] of [raw!, secondRaw!].entries()) {
      for (const [chunkIndex, batch] of inputs[stateIndex].entries()) {
        getGPUDataBuffer(positions.data[chunkIndex]).write(new Uint8Array(batch.positions.buffer));
        bytes += batch.positions.byteLength;
        if (stateIndex === 0 && inputValidity) {
          getGPUDataBuffer(inputValidity.data[chunkIndex]).write(batch.inputValidity);
          bytes += batch.inputValidity.byteLength;
        }
      }
    }
    return bytes;
  }
  function applyInput(
    stateIndex: number,
    initial = false,
    project = true,
    input = inputs[stateIndex]
  ) {
    current = inputs[stateIndex];
    let uploadedBytes = 0;
    let cpuProjectMs = 0;
    let uploadEnqueueMs = 0;
    for (const [index, batch] of (resident ? [] : input).entries()) {
      if (cpuProjection) {
        const start = performance.now();
        const projected = cpu.projectBatch(batch);
        const positions = new Float32Array(projected.positions.length);
        for (let row = 0; row < projected.numRows; row++) {
          if (projected.validity[row]) {
            positions.set(
              transform.getCommonPosition([
                projected.positions[row * 2],
                projected.positions[row * 2 + 1]
              ]),
              row * 2
            );
          }
        }
        cpuProjectMs += performance.now() - start;
        const uploadStart = performance.now();
        getGPUDataBuffer(local!.data[index]).write(positions);
        if (initial) getGPUDataBuffer(outputValidity!.data[index]).write(projected.validity);
        uploadEnqueueMs += performance.now() - uploadStart;
        uploadedBytes += positions.byteLength + (initial ? projected.validity.byteLength : 0);
      } else {
        const uploadStart = performance.now();
        getGPUDataBuffer(raw!.data[index]).write(new Uint8Array(batch.positions.buffer));
        if (initial) getGPUDataBuffer(inputValidity!.data[index]).write(batch.inputValidity);
        uploadEnqueueMs += performance.now() - uploadStart;
        uploadedBytes +=
          batch.positions.byteLength + (initial ? batch.inputValidity.byteLength : 0);
      }
    }
    const materializeStart = performance.now();
    const compiled = project ? graphs[resident ? stateIndex : 0] : undefined;
    let computeDispatches = 0;
    let computePasses = 0;
    if (compiled) {
      const encoder = device.createCommandEncoder();
      const {stats} = compiled.encode(encoder, {parameters: undefined});
      computeDispatches = stats.nodeCount;
      computePasses = stats.computePassCount;
      device.submit(encoder.finish());
    }
    if (producer && compiled) {
      const chunkCount = producerCells[stateIndex].data.length;
      const projectionDispatches =
        grouped && groupedChunkCount === 2 && device.limits.maxStorageBuffersPerShaderStage >= 9
          ? Math.ceil(chunkCount / 2)
          : chunkCount;
      expect(computeDispatches).toBe(chunkCount + projectionDispatches);
    }
    const materializeEnqueueMs = compiled ? performance.now() - materializeStart : 0;
    return {
      uploadedBytes,
      cpuProjectMs,
      uploadEnqueueMs,
      materializeEnqueueMs,
      computeDispatches,
      computePasses
    };
  }

  async function applyReadbackInput(stateIndex: number, initial = false) {
    const start = performance.now();
    const encoder = device.createCommandEncoder();
    let offset = 0;
    for (const chunk of (stateIndex === 0 ? raw! : secondRaw!).data) {
      const sourceBuffer = getGPUDataBuffer(chunk);
      encoder.copyBufferToBuffer({
        sourceBuffer,
        destinationBuffer: staging!,
        destinationOffset: offset,
        size: sourceBuffer.byteLength
      });
      offset += sourceBuffer.byteLength;
    }
    device.submit(encoder.finish());
    const bytes = await staging!.readAsync();
    const coordinates = new Float64Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 8);
    let rowOffset = 0;
    const input = inputs[stateIndex].map(batch => {
      const positions = coordinates.subarray(rowOffset, rowOffset + batch.positions.length);
      rowOffset += batch.positions.length;
      return {positions, inputValidity: batch.inputValidity};
    });
    const inputReadbackMs = performance.now() - start;
    return {
      ...applyInput(stateIndex, initial, true, input),
      inputReadbackMs,
      downloadedBytes: bytes.byteLength
    };
  }

  let initialUploadedBytes = resident || cpuRoundTrip ? uploadResidentInputs() : 0;
  initialUploadedBytes += cpuRoundTrip
    ? (await applyReadbackInput(0, true)).uploadedBytes
    : applyInput(0, !resident).uploadedBytes;
  const deck = new Deck({
    parent,
    device,
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    useDevicePixels: false,
    views: new OrthographicView(),
    initialViewState: {target: [0, 0], zoom: 0},
    _framebuffer: framebuffer,
    layers: [layer],
    onAfterRender: () => renderedFrames++,
    onError: error => errors.push(error.message)
  });
  const waitForGPU = () => device.handle.queue.onSubmittedWorkDone();
  const getPickQuery = (position: ProjectionCoordinates) => {
    const [x, y] = deck.getViewports()[0].project([...position, 0]);
    return {x: Math.round(x), y: Math.round(y), radius: 0};
  };
  const pick = async (query: ReturnType<typeof getPickQuery>) =>
    (await deck.pickObjectAsync(query)) as GPUProjectedPointPickingInfo | null;

  try {
    const deadline = performance.now() + 15000;
    do {
      deck.redraw('warmup');
      await new Promise(resolve => requestAnimationFrame(resolve));
    } while (renderedFrames < 2 && !errors.length && performance.now() < deadline);
    expect(renderedFrames).toBeGreaterThanOrEqual(2);
    expect(errors).toEqual([]);
    await waitForGPU();

    const rowCount = current.reduce((sum, batch) => sum + batch.inputValidity.length, 0);
    const pickedRows = [
      ...new Set(
        [1, ...current.map((_, index) => index * batchSize + 1), rowCount - 1].filter(
          row => row < rowCount && row % 11
        )
      )
    ];
    const frames: Uint8Array[] = [];
    const changedPixels: number[] = [];
    const referencePixelDifferenceFractions: number[] = [];
    const words: Uint32Array[][] = [];
    const pickQueries: ReturnType<typeof getPickQuery>[] = [];
    for (const index of inputs.keys()) {
      if (cpuRoundTrip) await applyReadbackInput(index);
      else applyInput(index);
      deck.redraw('qualify frame');
      texture.readBuffer({}, readback);
      device.submit();
      const pixels = new Uint8Array(await readback.readAsync()).slice();
      let litPixels = 0;
      let mismatched = 0;
      for (let y = 0; y < TARGET_SIZE; y++) {
        for (let x = 0; x < TARGET_SIZE; x++) {
          const offset = y * layout.bytesPerRow + x * 4;
          litPixels += Number(pixels[offset] > 0);
          mismatched += Number(
            Boolean(referenceFrames && pixels[offset] !== referenceFrames[index][offset])
          );
        }
      }
      expect(litPixels).toBeGreaterThan(0);
      expect(mismatched / litPixels).toBeLessThanOrEqual(producer ? 0.1 : 0.005);
      changedPixels.push(mismatched);
      referencePixelDifferenceFractions.push(mismatched / litPixels);
      frames.push(pixels);
      if (groupedChunkCount && resident && !producer) {
        const result = [];
        for (const vector of [local!, outputValidity!]) {
          for (const chunk of vector.data) {
            const bytes = await getGPUDataBuffer(chunk).readAsync();
            result.push(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
          }
        }
        words.push(result);
      }
      for (const row of pickedRows) {
        const position = transform.projectPosition(getReferencePosition(row))!;
        const query = getPickQuery(position.common);
        const result = await pick(query);
        if (row === 1) pickQueries.push(query);
        expect(result?.index).toBe(row);
        expect(result?.projection).toEqual(position);
        expect(result?.gpuVector).toEqual({
          rowIndex: row,
          batchIndex: Math.floor(row / batchSize),
          batchRowIndex: row % batchSize
        });
      }
      const masked = transform.projectPosition(getReferencePosition(0))!;
      expect(await pick(getPickQuery(masked.common))).toBeNull();
    }
    expect(frames[0].some((value, index) => value !== frames[1][index])).toBe(true);

    const scenarios = [];
    for (const drawsPerUpdate of renderCounts) {
      const samples = [];
      for (let iteration = 0; iteration < WARMUP_ITERATIONS + MEASURED_ITERATIONS; iteration++) {
        const start = performance.now();
        const stateIndex = iteration % inputs.length;
        const update = cpuRoundTrip ? await applyReadbackInput(stateIndex) : applyInput(stateIndex);
        const previousFrames = renderedFrames;
        const drawStart = performance.now();
        for (let draw = 0; draw < drawsPerUpdate; draw++) deck.redraw('measure frame');
        const drawEnqueueMs = performance.now() - drawStart;
        await waitForGPU();
        const updateAndRenderMs = performance.now() - start;
        expect(renderedFrames - previousFrames).toBe(drawsPerUpdate);
        const pickingStart = performance.now();
        const result = await pick(pickQueries[iteration % pickQueries.length]);
        const pickEnd = performance.now();
        const pickingMs = pickEnd - pickingStart;
        const updateRenderPickMs = pickEnd - start;
        if (producer) expect(update.uploadedBytes).toBe(0);
        expect(result?.index).toBe(1);
        const redrawStart = performance.now();
        deck.redraw('measure unchanged frame');
        await waitForGPU();
        const unchangedFrameMs = performance.now() - redrawStart;
        if (iteration >= WARMUP_ITERATIONS) {
          samples.push({
            ...update,
            drawEnqueueMs,
            updateAndRenderMs,
            pickingMs,
            updateRenderPickMs,
            unchangedFrameMs
          });
        }
      }
      scenarios.push({drawsPerUpdate, samples});
    }
    // Separate runs avoid inserting a queue wait between updates and draws in the frame samples.
    const updateOnlySamples = [];
    for (let iteration = 0; iteration < WARMUP_ITERATIONS + MEASURED_ITERATIONS; iteration++) {
      const stateIndex = iteration % inputs.length;
      const start = performance.now();
      const update = cpuRoundTrip ? await applyReadbackInput(stateIndex) : applyInput(stateIndex);
      await waitForGPU();
      const updateMs = performance.now() - start;
      let uploadOnlyMs: number | undefined;
      if (mode === 'materialized') {
        const uploadStart = performance.now();
        applyInput(stateIndex, false, false);
        await waitForGPU();
        uploadOnlyMs = performance.now() - uploadStart;
      }
      if (iteration >= WARMUP_ITERATIONS) {
        updateOnlySamples.push({...update, updateMs, uploadOnlyMs});
      }
    }
    let attribution;
    if (resident && groupedChunkCount && !producer) {
      const dispatches =
        grouped && device.limits.maxStorageBuffersPerShaderStage >= 9
          ? Math.ceil(inputs[0].length / groupedChunkCount)
          : inputs[0].length;
      attribution = {active: await measureResidentCost(device, graphs, dispatches, true)};
    } else if (resident && attributeResidentCost && !producer) {
      const active = await measureResidentCost(device, graphs, inputs[0].length);
      // Preserve the dispatch and bindings while bypassing projection math for all rows.
      for (const chunk of inputValidity!.data) {
        getGPUDataBuffer(chunk).write(new Uint32Array(chunk.length));
      }
      await waitForGPU();
      const masked = await measureResidentCost(device, graphs, inputs[0].length, true);
      attribution = {active, masked};
    }
    expect(errors).toEqual([]);
    return {
      mode,
      attribution,
      changedPixels,
      referencePixelDifferenceFractions,
      qualifiedPickRows: pickedRows,
      initialUploadedBytes,
      updateOnlySamples,
      stagingBytes: staging?.byteLength ?? 0,
      coordinateBufferBytes: [
        raw,
        secondRaw,
        inputValidity,
        local,
        outputValidity,
        producerPositions,
        ...producerCells
      ].reduce(
        (bytes, vector) =>
          bytes + (vector?.data.reduce((sum, chunk) => sum + chunk.buffer.byteLength, 0) ?? 0),
        0
      ),
      scenarios,
      words,
      frames
    };
  } finally {
    deck.finalize();
    parent.remove();
    framebuffer.destroy();
    texture.destroy();
    readback.destroy();
    staging?.destroy();
    graphs.forEach(graph => graph.destroy());
    programs.forEach(program => program.destroy());
    raw?.destroy();
    secondRaw?.destroy();
    producerPositions?.destroy();
    producerCells.forEach(cells => cells.destroy());
    inputValidity?.destroy();
    local?.destroy();
    outputValidity?.destroy();
  }
}

/** This submission runs no Deck work and uses the production graph built for the validated frames. */
async function measureResidentCost(
  device: WebGPUDevice,
  graphs: CompiledGPUCommandGraph<void>[],
  chunkCount: number,
  coalescedOnly = false
) {
  const modes = ['coalesced', 'split', 'timestamped'] as const;
  type Schedule = (typeof modes)[number];
  const hasTimestamps = device.features.has('timestamp-query');
  const schedules = modes.filter(
    schedule =>
      schedule === 'coalesced' || (!coalescedOnly && (schedule === 'split' || hasTimestamps))
  );
  const samplesBySchedule = new Map(
    schedules.map(schedule => [
      schedule,
      [] as {
        encodeAndFinishMs: number;
        graphEncodeMs: number;
        submitMs: number;
        queueWaitMs: number;
        totalMs: number;
        gpuPassMs?: number;
        dispatches: number;
        passes: number;
      }[]
    ])
  );
  const measuredIterations = 21;
  for (let iteration = 0; iteration < WARMUP_ITERATIONS + measuredIterations; iteration++) {
    for (let index = 0; index < schedules.length; index++) {
      // Rotate schedule order so single-phase drift does not always favor one variant.
      const schedule: Schedule = schedules[(iteration + index) % schedules.length];
      const timestamps =
        schedule === 'timestamped'
          ? device.createQuerySet({type: 'timestamp', count: 2 * chunkCount})
          : undefined;
      try {
        const graph = graphs[iteration % graphs.length];
        const start = performance.now();
        const encoder = device.createCommandEncoder(
          timestamps ? {timeProfilingQuerySet: timestamps} : {}
        );
        const coalesced = schedule === 'coalesced';
        const execution = graph.encode(encoder, {
          parameters: undefined,
          coalesceComputePasses: coalesced
        });
        const commandBuffer = encoder.finish();
        const submitStart = performance.now();
        device.submit(commandBuffer);
        const waitStart = performance.now();
        await device.handle.queue.onSubmittedWorkDone();
        const end = performance.now();
        const {
          computePassCount: passes,
          nodeCount: dispatches,
          cpuEncodeTimeMilliseconds
        } = execution.stats;
        expect(dispatches).toBe(chunkCount);
        expect(passes).toBe(coalesced ? 1 : dispatches);
        let gpuPassMs;
        if (schedule === 'timestamped') {
          expect(execution.stats.timestampedNodeCount).toBe(dispatches);
          gpuPassMs = (await execution.readTimings()).gpuTimeMilliseconds;
          expect(gpuPassMs).toBeGreaterThan(0);
        }
        if (iteration >= WARMUP_ITERATIONS) {
          samplesBySchedule.get(schedule)!.push({
            encodeAndFinishMs: submitStart - start,
            graphEncodeMs: cpuEncodeTimeMilliseconds,
            submitMs: waitStart - submitStart,
            queueWaitMs: end - waitStart,
            totalMs: end - start,
            gpuPassMs,
            dispatches,
            passes
          });
        }
      } finally {
        timestamps?.destroy();
      }
    }
  }
  return Object.fromEntries(samplesBySchedule);
}
