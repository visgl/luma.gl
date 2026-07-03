// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView, type Layer, type PickingInfo} from '@deck.gl/core';
import {ArrowPathLayer, ArrowPolygonLayer, ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {Model} from '@luma.gl/engine';
import {buildBitmapFontAtlas} from '@luma.gl/text';
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
  const polygonSource = makeArrowPolygonExampleData('10k-stream', 'polygon', 'row-colors');
  const polygonLayer = new ArrowPolygonLayer({
    id: 'arrow-polygons-picking-test',
    pickable: true,
    data: polygonSource.recordBatches.slice(0, 1),
    tessellated: polygonSource.tessellated
  });
  const textSource = makeArrowTextSource(
    {labelCount: 400, label: 'picking test texts', textType: 'utf8'},
    'constant'
  );
  const textLayer = new ArrowTextLayer({
    id: 'arrow-text-picking-test',
    pickable: true,
    positions: textSource.positions.slice(190, 210),
    texts: textSource.texts.slice(190, 210),
    clipRects: textSource.clipRects?.slice(190, 210) ?? null,
    colors: null,
    angles: null,
    sizes: null,
    pixelOffsets: null,
    model: 'attribute',
    fontAtlas: TEXT_FONT_ATLAS
  });

  const cases: Array<{
    layer: Layer;
    initialViewState: {target: [number, number]; zoom: number};
  }> = [
    {layer: pathLayer, initialViewState: {target: [0, 0], zoom: 8}},
    {
      layer: polygonLayer,
      initialViewState: {target: polygonSource.viewState.startCenter, zoom: 9}
    },
    {layer: textLayer, initialViewState: {target: [0, 0], zoom: 0}}
  ];

  for (const {layer, initialViewState} of cases) {
    const pickingInfo = await pickFirstLayerObject(layer, initialViewState);
    t.ok(pickingInfo?.picked, `${layer.id} returns a picked object`);
    t.equal(pickingInfo?.layer?.id, layer.id, `${layer.id} decodes the picked layer`);
    t.ok(
      Number.isInteger(pickingInfo?.index) && pickingInfo!.index >= 0,
      `${layer.id} returns a source row index`
    );
  }

  t.end();
});

async function pickFirstLayerObject(
  layer: Layer,
  initialViewState: {target: [number, number]; zoom: number}
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
    const model = await waitForLayerModel(layer);
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

async function waitForLayerModel(layer: Layer): Promise<Model> {
  const timeout = Date.now() + TEST_MODEL_TIMEOUT_MILLISECONDS;
  while (Date.now() < timeout) {
    const model = layer.getModels()[0];
    if (model) {
      return model;
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
  throw new Error(`${layer.id} did not create a draw model`);
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
