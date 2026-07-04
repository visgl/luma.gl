// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView, type Layer, type PickingInfo} from '@deck.gl/core';
import {ArrowPathLayer, ArrowPolygonLayer, ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import {makeArrowFixedSizeListVector, makeGPUVectorFromArrow} from '@luma.gl/arrow';
import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {Device} from '@luma.gl/core';
import type {Model} from '@luma.gl/engine';
import {buildBitmapFontAtlas} from '@luma.gl/text';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Float32, Table, Vector, vectorFromArray, type RecordBatch} from 'apache-arrow';
import {afterAll} from 'vitest';
import {
  makeArrowLineRecordBatches,
  makeArrowLineSourceData
} from '../../../../examples/arrow/arrow-lines/arrow-line-data';
import {makeArrowPolygonExampleData} from '../../../../examples/arrow/arrow-polygons/arrow-polygon-data';
import {makeArrowTextSource} from '../../../../examples/arrow/arrow-text-2d/arrow-text-data';

const TEST_VIEWPORT_WIDTH = 640;
const TEST_VIEWPORT_HEIGHT = 480;
const TEST_MODEL_TIMEOUT_MILLISECONDS = 10_000;
const TEXT_FONT_ATLAS = buildBitmapFontAtlas({
  characterSet: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-'
});
let sharedStorageDeck: {deck: Deck; parent: HTMLDivElement} | null = null;

afterAll(() => {
  finalizeSharedStorageDeck();
});

test('Arrow deck layers return source row indices from Deck picking', async t => {
  const pathSource = makeArrowLineSourceData(
    {pathCount: 12, pointCount: 8, label: 'picking test paths'},
    'lines',
    'float32',
    'row-colors',
    'none'
  );
  const pathLayer = new ArrowPathLayer({
    id: 'arrow-paths-picking-test',
    pickable: true,
    data: makeArrowLineRecordBatches(pathSource),
    model: 'attribute'
  });
  let constantPathDataError: unknown;
  const constantPathLayer = new ArrowPathLayer({
    id: 'arrow-paths-constant-picking-test',
    pickable: true,
    data: new Table({paths: pathSource.sourceVectors.paths}),
    paths: 'paths',
    color: [255, 180, 90, 255],
    width: 0.004,
    model: 'attribute',
    onDataError: error => {
      constantPathDataError = error;
    }
  });
  const nullablePathColors = vectorFromArray(
    Array.from({length: pathSource.sourceVectors.paths.length}, (_, rowIndex) =>
      rowIndex % 2 === 0 ? [20, 120, 240, 255] : null
    ),
    pathSource.sourceVectors.colors!.type
  );
  let nullablePathDataError: unknown;
  const nullablePathLayer = new ArrowPathLayer({
    id: 'arrow-paths-nullable-color-test',
    pickable: true,
    data: new Table({paths: pathSource.sourceVectors.paths, colors: nullablePathColors}),
    paths: 'paths',
    color: {source: 'colors', nullValue: [255, 80, 40, 255]},
    width: 0.004,
    model: 'attribute',
    onDataError: error => {
      nullablePathDataError = error;
    }
  });
  let missingPathStyleDataError: unknown;
  const missingPathStyleLayer = new ArrowPathLayer({
    id: 'arrow-paths-missing-style-test',
    pickable: true,
    data: new Table({paths: pathSource.sourceVectors.paths}),
    paths: 'paths',
    color: 'missingColors',
    width: {source: 'missingWidths', nullValue: 0.004},
    model: 'attribute',
    onDataError: error => {
      missingPathStyleDataError = error;
    }
  });
  const polygonSource = makeArrowPolygonExampleData('10k-stream', 'polygon', 'row-colors');
  const polygonBatch = polygonSource.recordBatches[0]!;
  const polygonColors = polygonBatch.getChild('colors')!;
  const nullablePolygonColors = vectorFromArray(
    Array.from({length: polygonColors.length}, (_, rowIndex) =>
      rowIndex % 2 === 0 ? polygonColors.get(rowIndex) : null
    ),
    polygonColors.type
  );
  const polygonLayer = new ArrowPolygonLayer({
    id: 'arrow-polygons-picking-test',
    pickable: true,
    data: new Table({
      polygons: polygonBatch.getChild('polygons')!,
      colors: nullablePolygonColors
    }),
    polygons: 'polygons',
    color: {source: 'colors', nullValue: [0, 96, 255, 255]},
    tessellated: polygonSource.tessellated
  });
  const constantPolygonLayer = new ArrowPolygonLayer({
    id: 'arrow-polygons-constant-picking-test',
    pickable: true,
    polygons: polygonBatch.getChild('polygons')!,
    color: [0, 96, 255, 255],
    tessellated: polygonSource.tessellated,
    model: 'attribute'
  });
  let missingPolygonColorDataError: unknown;
  const missingPolygonColorLayer = new ArrowPolygonLayer({
    id: 'arrow-polygons-missing-color-test',
    pickable: true,
    data: new Table({polygons: polygonBatch.getChild('polygons')!}),
    polygons: 'polygons',
    color: {source: 'missingColors', nullValue: [255, 80, 40, 255]},
    tessellated: polygonSource.tessellated,
    model: 'attribute',
    onDataError: error => {
      missingPolygonColorDataError = error;
    }
  });
  const textSource = makeArrowTextSource(
    {labelCount: 400, label: 'picking test texts', textType: 'utf8'},
    'string-colors',
    {clipRects: true, angles: true, sizes: true}
  );
  const slicedTextColors = textSource.colors!.slice(190, 210);
  const nullableTextColors = vectorFromArray(
    Array.from({length: slicedTextColors.length}, (_, rowIndex) =>
      rowIndex % 2 === 0 ? slicedTextColors.get(rowIndex) : null
    ),
    slicedTextColors.type
  );
  let textDataError: unknown;
  const textLayer = new ArrowTextLayer({
    id: 'arrow-text-picking-test',
    pickable: true,
    positions: textSource.positions.slice(190, 210),
    texts: textSource.texts.slice(190, 210),
    clipRects: textSource.clipRects?.slice(190, 210) ?? null,
    color: {source: nullableTextColors, nullValue: [255, 80, 40, 255]},
    angles: textSource.angles?.slice(190, 210),
    sizes: textSource.sizes?.slice(190, 210),
    pixelOffsets: null,
    model: 'attribute',
    fontAtlas: TEXT_FONT_ATLAS,
    characterSet: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-',
    onDataError: error => {
      textDataError = error;
    }
  });
  const constantTextLayer = new ArrowTextLayer({
    id: 'arrow-text-constant-picking-test',
    pickable: true,
    positions: textSource.positions.slice(190, 210),
    texts: textSource.texts.slice(190, 210),
    clipRects: null,
    angles: null,
    sizes: null,
    pixelOffsets: null,
    color: [255, 180, 90, 255],
    angle: 4,
    size: 36,
    model: 'attribute',
    fontAtlas: TEXT_FONT_ATLAS
  });
  let missingTextColorDataError: unknown;
  const missingTextColorLayer = new ArrowTextLayer({
    id: 'arrow-text-missing-color-test',
    pickable: true,
    data: new Table({
      positions: textSource.positions.slice(190, 210),
      texts: textSource.texts.slice(190, 210)
    }),
    positions: 'positions',
    texts: 'texts',
    clipRects: null,
    angles: null,
    sizes: null,
    pixelOffsets: null,
    color: 'missingColors',
    model: 'attribute',
    fontAtlas: TEXT_FONT_ATLAS,
    characterSet: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-',
    onDataError: error => {
      missingTextColorDataError = error;
    }
  });

  const cases: Array<{
    layer: Layer;
    initialViewState: {target: [number, number]; zoom: number};
    getError?: () => unknown;
    inspectModel?: (model: Model) => void;
  }> = [
    {layer: pathLayer, initialViewState: {target: [0, 0], zoom: 8}},
    {
      layer: nullablePathLayer,
      initialViewState: {target: [0, 0], zoom: 8},
      getError: () => nullablePathDataError
    },
    {
      layer: missingPathStyleLayer,
      initialViewState: {target: [0, 0], zoom: 8},
      getError: () => missingPathStyleDataError
    },
    {
      layer: constantPathLayer,
      initialViewState: {target: [0, 0], zoom: 8},
      getError: () => constantPathDataError,
      inspectModel: model => {
        const constantLayouts = model.bufferLayout.filter(layout =>
          layout.name.startsWith('constantPath')
        );
        t.deepEqual(
          constantLayouts.map(layout => layout.byteStride),
          [0, 0, 0],
          `${model.device.type} path constants use zero-stride attribute layouts`
        );
        if (model.device.type === 'webgl') {
          for (const attributeName of ['segmentStartColors', 'segmentEndColors', 'widths']) {
            const attribute = model.pipeline.shaderLayout.attributes.find(
              candidate => candidate.name === attributeName
            );
            t.ok(attribute, `WebGL path shader exposes ${attributeName}`);
            t.ok(
              attribute && ArrayBuffer.isView(model.vertexArray.attributes[attribute.location]),
              `WebGL ${attributeName} is a native constant attribute`
            );
          }
        }
      }
    },
    {
      layer: polygonLayer,
      initialViewState: {target: polygonSource.viewState.startCenter, zoom: 9}
    },
    {
      layer: constantPolygonLayer,
      initialViewState: {target: polygonSource.viewState.startCenter, zoom: 9},
      inspectModel: model => {
        if (model.device.type === 'webgl') {
          const colorAttribute = model.pipeline.shaderLayout.attributes.find(
            attribute => attribute.name === 'colors'
          );
          t.ok(
            colorAttribute &&
              ArrayBuffer.isView(model.vertexArray.attributes[colorAttribute.location]),
            'WebGL polygon color uses a native constant attribute'
          );
        } else {
          t.ok(
            model.bufferLayout.some(
              layout => layout.name === 'gpu-table-constant-vertex' && layout.byteStride === 0
            ),
            'WebGPU polygon constant uses a zero-stride attribute layout'
          );
        }
      }
    },
    {
      layer: missingPolygonColorLayer,
      initialViewState: {target: polygonSource.viewState.startCenter, zoom: 9},
      getError: () => missingPolygonColorDataError
    },
    {
      layer: textLayer,
      initialViewState: {target: [0, 0], zoom: 0},
      getError: () => textDataError
    },
    {layer: constantTextLayer, initialViewState: {target: [0, 0], zoom: 0}},
    {
      layer: missingTextColorLayer,
      initialViewState: {target: [0, 0], zoom: 0},
      getError: () => missingTextColorDataError
    }
  ];

  const {deck, parent} = createTestDeck();
  try {
    await waitForDeckInitialization(deck);
    for (const {layer, initialViewState, getError, inspectModel} of cases) {
      const pickingInfo = await pickFirstLayerObject(
        deck,
        layer,
        initialViewState,
        getError,
        inspectModel
      );
      t.ok(pickingInfo?.picked, `${layer.id} returns a picked object`);
      t.equal(pickingInfo?.layer?.id, layer.id, `${layer.id} decodes the picked layer`);
      t.ok(
        Number.isInteger(pickingInfo?.index) && pickingInfo!.index >= 0,
        `${layer.id} returns a source row index`
      );
    }
  } finally {
    deck.finalize();
    parent.remove();
  }

  t.end();
});

test('ArrowPathLayer storage draws streamed batches incrementally and preserves picking provenance', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    t.comment('Skipping streamed WebGPU Deck rendering on a software-backed adapter');
    t.end();
    return;
  }
  const source = makeArrowLineSourceData(
    {pathCount: 12, pointCount: 8, label: 'streaming test paths'},
    'lines',
    'float32',
    'row-colors',
    'none',
    6
  );
  const recordBatches = makeArrowLineRecordBatches(source);
  t.equal(recordBatches.length, 2, 'test source contains two batches');
  const callerColorVector = makeGPUVectorFromArrow(
    device,
    makeFloat32ColorVector(source.sourceVectors.colors!),
    {
      name: 'caller-path-colors',
      format: 'float32x4'
    }
  );
  const callerColorBuffers = callerColorVector.data.map(data => data.buffer);
  let releaseSecondBatch = () => {};
  const secondBatchReady = new Promise<void>(resolve => {
    releaseSecondBatch = resolve;
  });
  const loadedBatchCounts: number[] = [];
  let dataError: unknown;
  const layer = new ArrowPathLayer({
    id: 'arrow-path-streaming-test',
    pickable: true,
    data: makeControlledPathStream(recordBatches, secondBatchReady),
    paths: 'paths',
    color: callerColorVector,
    width: {source: 'widths', nullValue: 0.0035},
    model: 'storage',
    onDataBatch: update => loadedBatchCounts.push(update.loadedBatchCount),
    onDataError: error => {
      dataError = error;
    }
  });
  const {deck} = getSharedStorageDeck(device);

  try {
    await waitForDeckInitialization(deck);
    deck.setProps({layers: [layer]});
    await waitForModelCount(layer, 1, () => dataError);
    const firstModel = layer.getModels()[0]!;
    await waitForPipeline(firstModel);
    t.equal(firstModel.device.type, 'webgpu', 'streaming path test uses WebGPU');
    t.ok(firstModel.instanceCount > 0, 'first streamed WebGPU batch is drawable before completion');
    t.deepEqual(loadedBatchCounts, [1], 'first batch is reported before the source completes');
    releaseSecondBatch();
    await waitForModelCount(layer, 2, () => dataError);
    t.deepEqual(loadedBatchCounts, [1, 2], 'second batch appends without replacing the first');
    const pickingInfo = layer.getPickingInfo({
      info: {index: 7, picked: true} as PickingInfo,
      mode: 'hover',
      sourceLayer: layer
    } as never) as PickingInfo & {
      arrow?: {rowIndex: number; batchIndex: number; batchRowIndex: number};
    };
    t.deepEqual(
      pickingInfo.arrow,
      {rowIndex: 7, batchIndex: 1, batchRowIndex: 1},
      'global row index resolves to source batch and batch-local row'
    );
  } finally {
    deck.setProps({layers: []});
    for (const buffer of callerColorBuffers) {
      t.notOk(buffer.destroyed, 'ArrowPathLayer leaves caller-owned GPU color buffers alive');
    }
    callerColorVector.destroy();
  }
  t.end();
});

test('Arrow polygon and text layers render storage-backed WebGPU models', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    t.comment('Skipping storage-backed WebGPU Deck rendering on a software-backed adapter');
    t.end();
    return;
  }
  const polygonSource = makeArrowPolygonExampleData('10k-stream', 'polygon', 'row-colors');
  const polygonBatch = polygonSource.recordBatches[0]!;
  const polygonColorVector = makeGPUVectorFromArrow(
    device,
    makeFloat32ColorVector(polygonBatch.getChild('colors')!),
    {
      name: 'caller-polygon-colors',
      format: 'float32x4'
    }
  );
  let polygonDataError: unknown;
  const polygonLayer = new ArrowPolygonLayer({
    id: 'arrow-polygons-storage-test',
    pickable: true,
    polygons: polygonBatch.getChild('polygons')!,
    color: polygonColorVector,
    tessellated: polygonSource.tessellated,
    model: 'storage',
    onDataError: error => {
      polygonDataError = error;
    }
  });
  let constantPolygonDataError: unknown;
  const constantPolygonLayer = new ArrowPolygonLayer({
    id: 'arrow-polygons-constant-storage-test',
    pickable: true,
    polygons: polygonBatch.getChild('polygons')!,
    color: [0, 96, 255, 255],
    tessellated: polygonSource.tessellated,
    model: 'storage',
    onDataError: error => {
      constantPolygonDataError = error;
    }
  });
  const textSource = makeArrowTextSource(
    {labelCount: 400, label: 'storage test texts', textType: 'utf8'},
    'string-colors',
    {clipRects: true, angles: true, sizes: true}
  );
  const textColorVector = makeGPUVectorFromArrow(
    device,
    makeFloat32ColorVector(textSource.colors!.slice(190, 210)),
    {
      name: 'caller-text-colors',
      format: 'float32x4'
    }
  );
  let textDataError: unknown;
  const textLayer = new ArrowTextLayer({
    id: 'arrow-text-storage-test',
    pickable: true,
    positions: textSource.positions.slice(190, 210),
    texts: textSource.texts.slice(190, 210),
    clipRects: textSource.clipRects?.slice(190, 210) ?? null,
    color: textColorVector,
    angles: textSource.angles?.slice(190, 210),
    sizes: textSource.sizes?.slice(190, 210),
    pixelOffsets: null,
    model: 'storage',
    fontAtlas: TEXT_FONT_ATLAS,
    characterSet: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-',
    onDataError: error => {
      textDataError = error;
    }
  });
  const dictionaryTextSource = makeArrowTextSource(
    {labelCount: 400, label: 'storage dictionary test texts', textType: 'dictionary'},
    'string-colors',
    {clipRects: true, angles: true, sizes: true}
  );
  let dictionaryTextDataError: unknown;
  const dictionaryTextLayer = new ArrowTextLayer({
    id: 'arrow-text-dictionary-storage-test',
    pickable: true,
    positions: dictionaryTextSource.positions.slice(190, 210),
    texts: dictionaryTextSource.texts.slice(190, 210),
    clipRects: dictionaryTextSource.clipRects?.slice(190, 210) ?? null,
    angles: null,
    sizes: null,
    pixelOffsets: null,
    color: [255, 180, 90, 255],
    angle: 4,
    size: 36,
    model: 'storage',
    fontAtlas: TEXT_FONT_ATLAS,
    characterSet: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-',
    onDataError: error => {
      dictionaryTextDataError = error;
    }
  });

  const cases = [
    {
      layer: polygonLayer,
      initialViewState: {target: polygonSource.viewState.startCenter, zoom: 9},
      getError: () => polygonDataError
    },
    {
      layer: constantPolygonLayer,
      initialViewState: {target: polygonSource.viewState.startCenter, zoom: 9},
      getError: () => constantPolygonDataError
    },
    {
      layer: textLayer,
      initialViewState: {target: [0, 0] as [number, number], zoom: 0},
      getError: () => textDataError
    },
    {
      layer: dictionaryTextLayer,
      initialViewState: {target: [0, 0] as [number, number], zoom: 0},
      getError: () => dictionaryTextDataError
    }
  ];

  const {deck} = getSharedStorageDeck(device);
  try {
    await waitForDeckInitialization(deck);
    for (const {layer, initialViewState, getError} of cases) {
      deck.setProps({layers: [layer], viewState: initialViewState});
      try {
        const model = await waitForDrawableLayerModel(layer, getError);
        await waitForPipeline(model);
        t.equal(model.device.type, 'webgpu', `${layer.id} uses WebGPU storage`);
        t.ok(
          model.instanceCount > 0 || model.vertexCount > 0,
          `${layer.id} has drawable storage-backed geometry`
        );
      } finally {
        deck.setProps({layers: []});
      }
    }
  } finally {
    deck.setProps({layers: []});
    for (const vector of [polygonColorVector, textColorVector]) {
      for (const data of vector.data) {
        t.notOk(
          data.buffer.destroyed,
          `${vector.name} remains caller-owned after layer finalization`
        );
      }
      vector.destroy();
    }
    finalizeSharedStorageDeck();
  }
  t.end();
});

async function pickFirstLayerObject(
  deck: Deck,
  layer: Layer,
  initialViewState: {target: [number, number]; zoom: number},
  getError: () => unknown = () => undefined,
  inspectModel: (model: Model) => void = () => {}
): Promise<PickingInfo | null> {
  deck.setProps({layers: [layer], viewState: initialViewState});

  try {
    const model = await waitForLayerModel(layer, getError);
    inspectModel(model);
    await waitForPipeline(model);
    deck.redraw(true);
    await waitForPipeline(model);
    const pickingOptions = {
      x: 0,
      y: 0,
      width: TEST_VIEWPORT_WIDTH,
      height: TEST_VIEWPORT_HEIGHT,
      layerIds: [layer.id],
      maxObjects: 1
    };
    let pickingInfos = await deck.pickObjectsAsync(pickingOptions);
    if (pickingInfos.length === 0) {
      await waitForPipeline(model);
      pickingInfos = await deck.pickObjectsAsync(pickingOptions);
    }
    return pickingInfos[0] ?? null;
  } finally {
    deck.setProps({layers: []});
  }
}

function makeFloat32ColorVector(colors: Vector) {
  let sourceRowOffset = 0;
  const data = colors.data.map(sourceData => {
    const values = new Float32Array(sourceData.length * 4);
    for (let rowIndex = 0; rowIndex < sourceData.length; rowIndex++) {
      const color = Array.from(colors.get(sourceRowOffset + rowIndex) as Iterable<number>);
      for (let componentIndex = 0; componentIndex < 4; componentIndex++) {
        values[rowIndex * 4 + componentIndex] = color[componentIndex] / 255;
      }
    }
    sourceRowOffset += sourceData.length;
    return makeArrowFixedSizeListVector(new Float32(), 4, values).data[0];
  });
  return new Vector(data);
}

function createTestDeck(device?: Device): {deck: Deck; parent: HTMLDivElement} {
  const parent = document.createElement('div');
  parent.style.width = `${TEST_VIEWPORT_WIDTH}px`;
  parent.style.height = `${TEST_VIEWPORT_HEIGHT}px`;
  document.body.append(parent);
  const deck = new Deck({
    parent,
    width: TEST_VIEWPORT_WIDTH,
    height: TEST_VIEWPORT_HEIGHT,
    ...(device ? {device} : {}),
    views: new OrthographicView({id: 'main'}),
    initialViewState: {target: [0, 0], zoom: 0},
    layers: []
  });
  return {deck, parent};
}

function getSharedStorageDeck(device: Device): {deck: Deck; parent: HTMLDivElement} {
  sharedStorageDeck ??= createTestDeck(device);
  return sharedStorageDeck;
}

function finalizeSharedStorageDeck(): void {
  sharedStorageDeck?.deck.finalize();
  sharedStorageDeck?.parent.remove();
  sharedStorageDeck = null;
}

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

async function waitForLayerModel(
  layer: Layer,
  getError: () => unknown = () => undefined
): Promise<Model> {
  const timeout = Date.now() + TEST_MODEL_TIMEOUT_MILLISECONDS;
  while (Date.now() < timeout) {
    const model = layer.getModels()[0];
    if (model) {
      return model;
    }
    const error = getError();
    if (error) {
      throw error;
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
  throw new Error(`${layer.id} did not create a draw model`);
}

async function waitForDrawableLayerModel(
  layer: Layer,
  getError: () => unknown = () => undefined
): Promise<Model> {
  const timeout = Date.now() + TEST_MODEL_TIMEOUT_MILLISECONDS;
  while (Date.now() < timeout) {
    const model = layer.getModels()[0];
    if (model && (model.instanceCount > 0 || model.vertexCount > 0)) {
      return model;
    }
    const error = getError();
    if (error) {
      throw error;
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
  const state = layer.state as {
    renderer?: {getMetrics?: () => {rowCount?: number}};
  } | null;
  const rowCount = state?.renderer?.getMetrics?.().rowCount;
  const instanceCount = layer.getModels()[0]?.instanceCount;
  const vertexCount = layer.getModels()[0]?.vertexCount;
  throw new Error(
    `${layer.id} did not create a drawable model (rows=${rowCount ?? 'unknown'}, instances=${instanceCount ?? 'missing'}, vertices=${vertexCount ?? 'missing'})`
  );
}

async function waitForModelCount(
  layer: Layer,
  modelCount: number,
  getError: () => unknown = () => undefined
): Promise<void> {
  const timeout = Date.now() + TEST_MODEL_TIMEOUT_MILLISECONDS;
  while (Date.now() < timeout) {
    if (layer.getModels().length === modelCount) {
      return;
    }
    const error = getError();
    if (error) {
      throw error;
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
  const state = layer.state as {batches?: unknown[]; loadVersion?: number} | null;
  throw new Error(
    `${layer.id} did not create ${modelCount} draw models (batches=${state?.batches?.length ?? 'missing'}, loadVersion=${state?.loadVersion ?? 'missing'})`
  );
}

async function* makeControlledPathStream(
  recordBatches: RecordBatch[],
  secondBatchReady: Promise<void>
): AsyncGenerator<RecordBatch> {
  const firstBatch = recordBatches[0];
  const secondBatch = recordBatches[1];
  if (firstBatch) {
    yield firstBatch;
  }
  await secondBatchReady;
  if (secondBatch) {
    yield secondBatch;
  }
}

async function waitForDeckInitialization(deck: Deck): Promise<void> {
  const timeout = Date.now() + TEST_MODEL_TIMEOUT_MILLISECONDS;
  while (Date.now() < timeout && !deck.isInitialized) {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
  if (!deck.isInitialized) {
    throw new Error('Deck did not initialize');
  }
}

async function waitForPipeline(model: Model): Promise<void> {
  const timeout = Date.now() + TEST_MODEL_TIMEOUT_MILLISECONDS;
  while (Date.now() < timeout && model.pipeline.linkStatus === 'pending') {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
  if (model.pipeline.linkStatus !== 'success') {
    const vertexMessages = await model.pipeline.vs.getCompilationInfo();
    const fragmentMessages = await model.pipeline.fs?.getCompilationInfo();
    throw new Error(
      `${model.id} pipeline did not link successfully: ${JSON.stringify({vertexMessages, fragmentMessages})}`
    );
  }
}
