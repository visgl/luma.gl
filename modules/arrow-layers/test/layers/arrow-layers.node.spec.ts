// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {ArrowPathLayer, ArrowPolygonLayer, ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import type {Model} from '@luma.gl/engine';

test('Arrow deck layers do not use AttributeManager for Arrow GPU vectors', t => {
  const layers = [
    new ArrowPathLayer({id: 'path'}),
    new ArrowPolygonLayer({id: 'polygon'}),
    new ArrowTextLayer({id: 'text'})
  ];

  for (const layer of layers) {
    t.equal(layer.getAttributeManager(), null, `${layer.id} does not mirror Arrow columns`);
  }
  t.end();
});

test('Arrow deck layers expose their active draw models to Deck', t => {
  const pathLayer = new ArrowPathLayer({id: 'path'});
  const polygonLayer = new ArrowPolygonLayer({id: 'polygon'});
  const textLayer = new ArrowTextLayer({id: 'text'});
  const pathModel = {id: 'path-model'} as Model;
  const polygonModel = {id: 'polygon-model'} as Model;
  const polygonPickingModel = {id: 'polygon-picking-model'} as Model;
  const textModel = {id: 'text-model'} as Model;

  t.deepEqual(pathLayer.getModels(), [], 'path layer has no model before initialization');
  t.deepEqual(polygonLayer.getModels(), [], 'polygon layer has no model before initialization');
  t.deepEqual(textLayer.getModels(), [], 'text layer has no model before initialization');

  pathLayer.state = {
    batches: [
      {
        model: pathModel,
        prepared: null,
        batchIndex: 0,
        rowIndexOffset: 0,
        rowCount: 1
      }
    ],
    loadVersion: 0
  } as never;
  polygonLayer.state = {
    renderer: {model: polygonModel, pickingModel: polygonPickingModel}
  } as never;
  textLayer.state = {renderer: {model: textModel}, loadVersion: 0} as never;

  t.deepEqual(pathLayer.getModels(), [pathModel], 'path layer exposes its draw model');
  t.deepEqual(
    polygonLayer.getModels(),
    [polygonModel],
    'polygon layer exposes only its draw model'
  );
  t.deepEqual(textLayer.getModels(), [textModel], 'text layer exposes its draw model');
  t.end();
});

test('Arrow deck layers preserve alpha blending defaults', t => {
  const pathLayer = new ArrowPathLayer({id: 'path'});
  const polygonLayer = new ArrowPolygonLayer({id: 'polygon'});
  const textLayer = new ArrowTextLayer({id: 'text'});

  for (const layer of [pathLayer, polygonLayer, textLayer]) {
    t.equal(layer.props.parameters.blend, true, `${layer.id} enables alpha blending`);
    t.equal(layer.props.parameters.depthWriteEnabled, false, `${layer.id} disables depth writes`);
    t.equal(
      layer.props.parameters.blendColorSrcFactor,
      'src-alpha',
      `${layer.id} uses source alpha`
    );
  }
  t.end();
});
