// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {ArrowPathLayer, ArrowPolygonLayer, ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import type {Model} from '@luma.gl/engine';
import {Float32, Float64} from 'apache-arrow';
import {assertLayerArrowVectorFormat} from '../../src/layers/arrow-gpu-layer-utils';

it('Arrow GPU layer adapters reject columns whose storage does not match the GPU format', () => {
  const float32Positions = makeArrowFixedSizeListVector(new Float32(), 2, new Float32Array([1, 2]));
  const float64Positions = makeArrowFixedSizeListVector(new Float64(), 2, new Float64Array([1, 2]));

  expect(() =>
    assertLayerArrowVectorFormat(float32Positions, 'float32x2', 'positions')
  ).not.toThrow();
  expect(() => assertLayerArrowVectorFormat(float64Positions, 'float32x2', 'positions')).toThrow(
    'FixedSizeList<Float32>[2]'
  );
  void 0;
});

it('Arrow deck layers do not use AttributeManager for Arrow GPU vectors', () => {
  const layers = [
    new ArrowPathLayer({id: 'path'}),
    new ArrowPolygonLayer({id: 'polygon'}),
    new ArrowTextLayer({id: 'text'})
  ];

  for (const layer of layers) {
    expect(layer.getAttributeManager(), `${layer.id} does not mirror Arrow columns`).toBe(null);
  }
  void 0;
});

it('Arrow deck layers expose their active draw models to Deck', () => {
  const pathLayer = new ArrowPathLayer({id: 'path'});
  const polygonLayer = new ArrowPolygonLayer({id: 'polygon'});
  const textLayer = new ArrowTextLayer({id: 'text'});
  const pathModel = {id: 'path-model'} as Model;
  const polygonModel = {id: 'polygon-model'} as Model;
  const polygonPickingModel = {id: 'polygon-picking-model'} as Model;
  const textModel = {id: 'text-model'} as Model;

  expect(pathLayer.getModels(), 'path layer has no model before initialization').toEqual([]);
  expect(polygonLayer.getModels(), 'polygon layer has no model before initialization').toEqual([]);
  expect(textLayer.getModels(), 'text layer has no model before initialization').toEqual([]);

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

  expect(pathLayer.getModels(), 'path layer exposes its draw model').toEqual([pathModel]);
  expect(polygonLayer.getModels(), 'polygon layer exposes only its draw model').toEqual([
    polygonModel
  ]);
  expect(textLayer.getModels(), 'text layer exposes its draw model').toEqual([textModel]);
  void 0;
});

it('Arrow deck layers preserve alpha blending defaults', () => {
  const pathLayer = new ArrowPathLayer({id: 'path'});
  const polygonLayer = new ArrowPolygonLayer({id: 'polygon'});
  const textLayer = new ArrowTextLayer({id: 'text'});

  for (const layer of [pathLayer, polygonLayer, textLayer]) {
    expect(layer.props.parameters.blend, `${layer.id} enables alpha blending`).toBe(true);
    expect(layer.props.parameters.depthWriteEnabled, `${layer.id} disables depth writes`).toBe(
      false
    );
    expect(layer.props.parameters.blendColorSrcFactor, `${layer.id} uses source alpha`).toBe(
      'src-alpha'
    );
  }
  void 0;
});
