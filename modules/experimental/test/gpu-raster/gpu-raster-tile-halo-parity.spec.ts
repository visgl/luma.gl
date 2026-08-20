// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {
  GPURasterClosing,
  GPURasterDilation,
  GPURasterErosion,
  GPURasterGaussianBlur,
  GPURasterNeighborhood,
  GPURasterOpening,
  GPURasterSobel,
  GPURasterTileCache,
  GPURasterTileCoreExtract,
  GPURasterTileHaloAssembler,
  GPURasterTileHaloFill,
  GPURasterTileReader,
  type GPURasterBorderMode,
  type GPURasterBufferBand,
  type GPURasterDecodedTile,
  type GPURasterHaloStage,
  type GPURasterResidentBand,
  type GPURasterScalarFormat,
  type GPURasterTileHaloPlan,
  type GPURasterTileHaloRequest,
  type GPURasterTileRequest,
  type GPURasterTileSource,
  type GPURasterTileSourceMetadata
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from '../../../../test/utils/vitest-tape';

type SeamOperator =
  | 'pointwise'
  | 'gaussian'
  | 'sobel'
  | 'dilation'
  | 'erosion'
  | 'opening'
  | 'closing';

type SeamScenario = {
  name: string;
  operators: readonly SeamOperator[];
  borderMode: GPURasterBorderMode;
  level: number;
};

type SeamExecution = {
  plan: GPURasterTileHaloPlan;
  values: Float32Array;
  validity: Uint32Array;
  sourceCount: number;
};

const NATIVE_SEAM_SCENARIOS: readonly SeamScenario[] = [
  {name: 'pointwise', operators: ['pointwise'], borderMode: 'clamp', level: 0},
  {name: 'gaussian-reflect', operators: ['gaussian'], borderMode: 'reflect', level: 0},
  {name: 'sobel-constant', operators: ['sobel'], borderMode: 'constant', level: 0},
  {name: 'dilation-nodata', operators: ['dilation'], borderMode: 'nodata', level: 0},
  {name: 'erosion-clamp', operators: ['erosion'], borderMode: 'clamp', level: 0},
  {name: 'opening-reflect', operators: ['opening'], borderMode: 'reflect', level: 0},
  {name: 'closing-constant', operators: ['closing'], borderMode: 'constant', level: 0},
  {
    name: 'gaussian-sobel-composed',
    operators: ['gaussian', 'sobel'],
    borderMode: 'clamp',
    level: 0
  }
];

test('GPURaster tiled halos match monolithic pointwise, smoothing, derivatives, and morphology', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const source = new SeamParityTileSource();
  const cache = createSeamParityCache(device, source);
  for (const scenario of NATIVE_SEAM_SCENARIOS) {
    await assertTiledPipelineParity(testCase, device, cache, scenario);
  }
  cache.destroy();
  testCase.equal(cache.stats.pinnedTiles, 0, 'every native tile pin is released after submission');
  testCase.end();
});

test('GPURaster cumulative halos preserve ragged anisotropic-overview seams and masked boundaries', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const source = new SeamParityTileSource();
  const cache = createSeamParityCache(device, source);
  for (const scenario of [
    {
      name: 'overview-gaussian-sobel',
      operators: ['gaussian', 'sobel'],
      borderMode: 'reflect',
      level: 1
    },
    {
      name: 'overview-opening',
      operators: ['opening'],
      borderMode: 'constant',
      level: 1
    },
    {
      name: 'overview-closing',
      operators: ['closing'],
      borderMode: 'nodata',
      level: 1
    }
  ] satisfies SeamScenario[]) {
    await assertTiledPipelineParity(testCase, device, cache, scenario);
  }

  const overviewPlan = new GPURasterTileHaloAssembler(cache).plan({
    level: 1,
    column: 1,
    row: 1,
    stages: [{requiredHalo: 2}, {requiredHalo: 1}]
  });
  testCase.deepEqual(
    overviewPlan.levelZeroHalo,
    [6, 9],
    'cumulative overview radii preserve independent 2× horizontal and 3× vertical scales'
  );
  testCase.deepEqual(
    overviewPlan.corePixelBounds,
    [3, 2, 6, 3],
    'ragged overview cores retain half-open ownership at both actual dataset edges'
  );
  cache.destroy();
  testCase.end();
});

async function assertTiledPipelineParity(
  testCase: Test,
  device: Device,
  cache: GPURasterTileCache,
  scenario: SeamScenario
): Promise<void> {
  const level = cache.reader.metadata.levels.find(candidate => candidate.level === scenario.level);
  if (!level) throw new Error(`Missing parity overview ${scenario.level}`);

  const stages = scenario.operators.map(getOperatorHalo);
  const reference = await executeSeamPipeline(device, cache, scenario, {
    level: scenario.level,
    stages
  });
  const assembledValues = new Float32Array(level.width * level.height);
  const assembledValidity = new Uint32Array(level.width * level.height);
  const ownership = new Uint32Array(level.width * level.height);
  let usedNeighbor = false;

  for (let row = 0; row < Math.ceil(level.height / level.tileHeight); row++) {
    for (let column = 0; column < Math.ceil(level.width / level.tileWidth); column++) {
      const execution = await executeSeamPipeline(device, cache, scenario, {
        level: scenario.level,
        column,
        row,
        stages
      });
      usedNeighbor ||= execution.sourceCount > 1;
      const [minimumColumn, minimumRow] = execution.plan.corePixelBounds;
      for (let localRow = 0; localRow < execution.plan.coreHeight; localRow++) {
        for (let localColumn = 0; localColumn < execution.plan.coreWidth; localColumn++) {
          const sourceIndex = localRow * execution.plan.coreWidth + localColumn;
          const destinationIndex =
            (minimumRow + localRow) * level.width + minimumColumn + localColumn;
          ownership[destinationIndex]++;
          assembledValues[destinationIndex] = execution.values[sourceIndex]!;
          assembledValidity[destinationIndex] = execution.validity[sourceIndex]!;
        }
      }
    }
  }

  testCase.ok(
    ownership.every(count => count === 1),
    `${scenario.name}: half-open cores own every pixel exactly once`
  );
  testCase.deepEqual(
    Array.from(assembledValidity),
    Array.from(reference.validity),
    `${scenario.name}: nodata, cloud masks, and actual-edge border validity match monolithic`
  );
  for (let pixelIndex = 0; pixelIndex < assembledValues.length; pixelIndex++) {
    if (reference.validity[pixelIndex] === 0) {
      testCase.ok(
        Number.isNaN(assembledValues[pixelIndex]),
        `${scenario.name}: invalid pixel ${pixelIndex} preserves its canonical float NaN`
      );
    } else {
      const difference = Math.abs(assembledValues[pixelIndex]! - reference.values[pixelIndex]!);
      testCase.ok(
        difference < 0.0001,
        `${scenario.name}: tiled pixel ${pixelIndex} matches monolithic (${difference})`
      );
    }
  }
  if (stages.some(stage => stage.requiredHalo > 0)) {
    testCase.ok(usedNeighbor, `${scenario.name}: interior seams read actual neighboring tiles`);
  }
}

async function executeSeamPipeline(
  device: Device,
  cache: GPURasterTileCache,
  scenario: SeamScenario,
  request: GPURasterTileHaloRequest
): Promise<SeamExecution> {
  const lease = await new GPURasterTileHaloAssembler(cache).acquire(request);
  const graph = new GPUCommandGraph(device, {
    id: `${scenario.name}-${request.column ?? 'full'}-${request.row ?? 'full'}`
  });
  const ownedBuffers: Buffer[] = [];
  const expandedPixelCount = lease.plan.width * lease.plan.height;
  const assembledValues = makeOwnedView(
    graph,
    device,
    ownedBuffers,
    'assembled-values',
    'float32',
    expandedPixelCount
  );
  const assembledValidity = makeOwnedView(
    graph,
    device,
    ownedBuffers,
    'assembled-validity',
    'uint32',
    expandedPixelCount
  );
  const sources = lease.tiles.map((tile, index) => ({
    pixelBounds: tile.decoded.pixelBounds,
    input: importResidentBand(graph, tile.bands[0]!, tile.decoded.metadata, `source-${index}`)
  }));
  new GPURasterTileHaloFill({
    id: `${scenario.name}-gather`,
    pixelBounds: lease.plan.availablePixelBounds,
    sources,
    output: assembledValues,
    outputValidity: assembledValidity
  }).addToGraph(graph);

  let current: GPURasterBufferBand<'float32'> = {
    id: 'samples',
    format: 'float32',
    storage: {kind: 'buffer', values: assembledValues},
    validity: assembledValidity,
    noDataValue: -999,
    scale: 0.5,
    offset: 1.25
  };
  for (const [stageIndex, operator] of scenario.operators.entries()) {
    const output = makeOwnedView(
      graph,
      device,
      ownedBuffers,
      `stage-${stageIndex}-values`,
      'float32',
      expandedPixelCount
    );
    const validity = makeOwnedView(
      graph,
      device,
      ownedBuffers,
      `stage-${stageIndex}-validity`,
      'uint32',
      expandedPixelCount
    );
    const shared = {
      id: `${scenario.name}-${operator}-${stageIndex}`,
      width: lease.plan.width,
      height: lease.plan.height,
      input: current,
      output,
      outputValidity: validity,
      borderMode: scenario.borderMode,
      borderValue: -2.5
    };

    switch (operator) {
      case 'pointwise':
        new GPURasterNeighborhood({...shared, radius: 0, kernel: [1]}).addToGraph(graph);
        break;
      case 'gaussian':
        new GPURasterGaussianBlur({
          ...shared,
          radius: 2,
          sigma: 1.1,
          noDataPolicy: 'ignore-renormalize'
        }).addToGraph(graph);
        break;
      case 'sobel':
        new GPURasterSobel({...shared, direction: 'x', scale: 0.125}).addToGraph(graph);
        break;
      case 'dilation':
        new GPURasterDilation({
          ...shared,
          radius: 2,
          structuringElement: 'square',
          noDataPolicy: 'ignore'
        }).addToGraph(graph);
        break;
      case 'erosion':
        new GPURasterErosion({
          ...shared,
          radius: 2,
          structuringElement: 'cross',
          noDataPolicy: 'ignore'
        }).addToGraph(graph);
        break;
      case 'opening':
        new GPURasterOpening({
          ...shared,
          radius: 2,
          structuringElement: 'cross',
          noDataPolicy: 'ignore'
        }).addToGraph(graph);
        break;
      case 'closing':
        new GPURasterClosing({
          ...shared,
          radius: 2,
          structuringElement: 'square',
          noDataPolicy: 'ignore'
        }).addToGraph(graph);
        break;
    }

    current = {
      id: 'samples',
      format: 'float32',
      storage: {kind: 'buffer', values: output},
      validity
    };
  }

  const corePixelCount = lease.plan.coreWidth * lease.plan.coreHeight;
  const coreValues = makeOwnedView(
    graph,
    device,
    ownedBuffers,
    'owned-core-values',
    'float32',
    corePixelCount
  );
  const coreValidity = makeOwnedView(
    graph,
    device,
    ownedBuffers,
    'owned-core-validity',
    'uint32',
    corePixelCount
  );
  new GPURasterTileCoreExtract({
    id: `${scenario.name}-extract`,
    availablePixelBounds: lease.plan.availablePixelBounds,
    corePixelBounds: lease.plan.corePixelBounds,
    input: current,
    output: coreValues,
    outputValidity: coreValidity
  }).addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: `${scenario.name}-submit`});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  const completion = device.createFence();
  const sampleBytes = await ownedBuffers[ownedBuffers.length - 2]!.readAsync();
  const validityBytes = await ownedBuffers[ownedBuffers.length - 1]!.readAsync();
  const values = Float32Array.from(
    new Float32Array(sampleBytes.buffer, sampleBytes.byteOffset, corePixelCount)
  );
  const validity = Uint32Array.from(
    new Uint32Array(validityBytes.buffer, validityBytes.byteOffset, corePixelCount)
  );
  await lease.releaseAfter(completion);
  compiled.destroy();
  for (const buffer of ownedBuffers) buffer.destroy();
  return {plan: lease.plan, values, validity, sourceCount: lease.tiles.length};
}

function createSeamParityCache(device: Device, source: SeamParityTileSource): GPURasterTileCache {
  return new GPURasterTileCache({
    device,
    reader: new GPURasterTileReader(source),
    maxTiles: 32,
    maxGraphs: 1,
    maxCpuBytes: 1_048_576,
    maxGpuBytes: 1_048_576
  });
}

function getOperatorHalo(operator: SeamOperator): GPURasterHaloStage {
  switch (operator) {
    case 'pointwise':
      return {requiredHalo: 0};
    case 'sobel':
      return {requiredHalo: 1};
    case 'gaussian':
    case 'dilation':
    case 'erosion':
      return {requiredHalo: 2};
    case 'opening':
    case 'closing':
      return {requiredHalo: 4};
  }
}

function importResidentBand(
  graph: GPUCommandGraph,
  resident: GPURasterResidentBand,
  metadata: GPURasterDecodedTile['metadata'],
  id: string
): GPURasterBufferBand<'float32'> {
  if (resident.format !== 'float32' || !resident.validity) {
    throw new Error('Seam parity fixtures require masked float32 resident samples');
  }
  const pixelCount = metadata.width * metadata.height;
  const sampleHandle = graph.importBuffer(
    {id: `${id}-values`, byteLength: resident.buffer.byteLength, usage: resident.buffer.usage},
    resident.buffer
  );
  const maskHandle = graph.importBuffer(
    {
      id: `${id}-validity`,
      byteLength: resident.validity.byteLength,
      usage: resident.validity.usage
    },
    resident.validity
  );
  return {
    id: resident.id,
    format: 'float32',
    storage: {
      kind: 'buffer',
      values: graph.createDataView(sampleHandle, {format: 'float32', length: pixelCount})
    },
    validity: graph.createDataView(maskHandle, {format: 'uint32', length: pixelCount}),
    noDataValue: resident.noDataValue,
    scale: resident.scale,
    offset: resident.offset
  };
}

function makeOwnedView<Format extends GPURasterScalarFormat>(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  id: string,
  format: Format,
  length: number
): GraphDataView<Format> {
  const buffer = device.createBuffer({
    id,
    byteLength: length * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  ownedBuffers.push(buffer);
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

class SeamParityTileSource implements GPURasterTileSource {
  readonly metadata: GPURasterTileSourceMetadata = {
    id: 'ragged-anisotropic-seam-parity',
    width: 11,
    height: 8,
    affine: [1, 0, 0, 0, 1, 0],
    pixelInterpretation: 'area',
    bands: [{id: 'samples', format: 'float32', noDataValue: -999, scale: 0.5, offset: 1.25}],
    levels: [
      {level: 0, width: 11, height: 8, tileWidth: 4, tileHeight: 3, downsample: [1, 1]},
      {level: 1, width: 6, height: 3, tileWidth: 3, tileHeight: 2, downsample: [2, 3]}
    ]
  };

  async readTile(
    request: GPURasterTileRequest,
    signal: AbortSignal
  ): Promise<GPURasterDecodedTile> {
    signal.throwIfAborted();
    const level = this.metadata.levels.find(candidate => candidate.level === request.level);
    const bounds = request.pixelBounds;
    if (!level || !bounds) throw new Error('Seam parity source requires normalized tile requests');
    const width = bounds[2] - bounds[0];
    const height = bounds[3] - bounds[1];
    const values = new Float32Array(width * height);
    const validity = new Uint32Array(width * height);
    const [downsampleX, downsampleY] = level.downsample;

    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        const sourceColumn = Math.min((bounds[0] + column) * downsampleX, this.metadata.width - 1);
        const sourceRow = Math.min((bounds[1] + row) * downsampleY, this.metadata.height - 1);
        const index = row * width + column;
        values[index] =
          Math.sin(sourceColumn * 0.63) * 3 + Math.cos(sourceRow * 0.41) * 2 + sourceColumn * 0.2;
        validity[index] = Number(!(sourceColumn === 4 && sourceRow === 3));
        if (sourceColumn === 3 && sourceRow === 2) values[index] = -999;
        if (sourceColumn === 8 && sourceRow === 5) values[index] = Number.NaN;
      }
    }

    return {
      level: level.level,
      column: request.column ?? 0,
      row: request.row ?? 0,
      pixelBounds: bounds,
      levelZeroBounds: [
        bounds[0] * downsampleX,
        bounds[1] * downsampleY,
        Math.min(bounds[2] * downsampleX, this.metadata.width),
        Math.min(bounds[3] * downsampleY, this.metadata.height)
      ],
      metadata: {
        width,
        height,
        affine: [downsampleX, 0, bounds[0] * downsampleX, 0, downsampleY, bounds[1] * downsampleY],
        pixelInterpretation: 'area',
        level: level.level,
        levelZeroOrigin: [bounds[0] * downsampleX, bounds[1] * downsampleY]
      },
      bands: [
        {
          id: 'samples',
          format: 'float32',
          values,
          validity,
          noDataValue: -999,
          scale: 0.5,
          offset: 1.25
        }
      ]
    };
  }
}
