// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView, type Layer, type PickingInfo} from '@deck.gl/core';
import {ArrowPathLayer, ArrowPolygonLayer, ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {Model} from '@luma.gl/engine';
import {buildBitmapFontAtlas} from '@luma.gl/text';
import {Table, type RecordBatch} from 'apache-arrow';
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
    colors: null,
    widths: null,
    color: [255, 180, 90, 255],
    width: 0.004,
    model: 'attribute',
    onDataError: error => {
      constantPathDataError = error;
    }
  });
  const polygonSource = makeArrowPolygonExampleData('10k-stream', 'polygon', 'row-colors');
  const polygonLayer = new ArrowPolygonLayer({
    id: 'arrow-polygons-picking-test',
    pickable: true,
    data: new Table(polygonSource.recordBatches.slice(0, 1)),
    polygons: 'polygons',
    colors: 'colors',
    tessellated: polygonSource.tessellated
  });
  const textSource = makeArrowTextSource(
    {labelCount: 400, label: 'picking test texts', textType: 'utf8'},
    'string-colors',
    {clipRects: true, angles: true, sizes: true}
  );
  let textDataError: unknown;
  const textLayer = new ArrowTextLayer({
    id: 'arrow-text-picking-test',
    pickable: true,
    positions: textSource.positions.slice(190, 210),
    texts: textSource.texts.slice(190, 210),
    clipRects: textSource.clipRects?.slice(190, 210) ?? null,
    colors: textSource.colors?.slice(190, 210),
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
    colors: null,
    angles: null,
    sizes: null,
    pixelOffsets: null,
    color: [255, 180, 90, 255],
    angle: 4,
    size: 36,
    model: 'attribute',
    fontAtlas: TEXT_FONT_ATLAS
  });

  const cases: Array<{
    layer: Layer;
    initialViewState: {target: [number, number]; zoom: number};
    getError?: () => unknown;
    inspectModel?: (model: Model) => void;
  }> = [
    {layer: pathLayer, initialViewState: {target: [0, 0], zoom: 8}},
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
          [0, 0],
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
      layer: textLayer,
      initialViewState: {target: [0, 0], zoom: 0},
      getError: () => textDataError
    },
    {layer: constantTextLayer, initialViewState: {target: [0, 0], zoom: 0}}
  ];

  for (const {layer, initialViewState, getError, inspectModel} of cases) {
    const pickingInfo = await pickFirstLayerObject(layer, initialViewState, getError, inspectModel);
    t.ok(pickingInfo?.picked, `${layer.id} returns a picked object`);
    t.equal(pickingInfo?.layer?.id, layer.id, `${layer.id} decodes the picked layer`);
    t.ok(
      Number.isInteger(pickingInfo?.index) && pickingInfo!.index >= 0,
      `${layer.id} returns a source row index`
    );
  }

  t.end();
});

test('ArrowPathLayer draws streamed batches incrementally and preserves picking provenance', async t => {
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
  let releaseSecondBatch = () => {};
  const secondBatchReady = new Promise<void>(resolve => {
    releaseSecondBatch = resolve;
  });
  const loadedBatchCounts: number[] = [];
  let dataError: unknown;
  const layer = new ArrowPathLayer({
    id: 'arrow-path-streaming-test',
    pickable: true,
    data: makeBareAsyncIterator(makeControlledPathStream(recordBatches, secondBatchReady)),
    paths: 'paths',
    colors: 'colors',
    widths: 'widths',
    model: 'attribute',
    onDataBatch: update => loadedBatchCounts.push(update.loadedBatchCount),
    onDataError: error => {
      dataError = error;
    }
  });
  const parent = document.createElement('div');
  parent.style.width = `${TEST_VIEWPORT_WIDTH}px`;
  parent.style.height = `${TEST_VIEWPORT_HEIGHT}px`;
  document.body.append(parent);
  const deck = new Deck({
    parent,
    width: TEST_VIEWPORT_WIDTH,
    height: TEST_VIEWPORT_HEIGHT,
    views: new OrthographicView({id: 'main'}),
    initialViewState: {target: [0, 0], zoom: 8},
    layers: [layer]
  });

  try {
    await waitForModelCount(layer, 1, () => dataError);
    t.deepEqual(loadedBatchCounts, [1], 'first batch is reported before the source completes');
    releaseSecondBatch();
    await waitForModelCount(layer, 2);
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
    deck.finalize();
    parent.remove();
  }
  t.end();
});

async function pickFirstLayerObject(
  layer: Layer,
  initialViewState: {target: [number, number]; zoom: number},
  getError: () => unknown = () => undefined,
  inspectModel: (model: Model) => void = () => {}
): Promise<PickingInfo | null> {
  const parent = document.createElement('div');
  parent.style.width = `${TEST_VIEWPORT_WIDTH}px`;
  parent.style.height = `${TEST_VIEWPORT_HEIGHT}px`;
  document.body.append(parent);
  const deck = new Deck({
    parent,
    width: TEST_VIEWPORT_WIDTH,
    height: TEST_VIEWPORT_HEIGHT,
    views: new OrthographicView({id: 'main'}),
    initialViewState,
    layers: [layer]
  });

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
    deck.finalize();
    parent.remove();
  }
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

function makeBareAsyncIterator<T>(source: AsyncIterable<T>): AsyncIterator<T> {
  const iterator = source[Symbol.asyncIterator]();
  return {next: () => iterator.next()};
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
