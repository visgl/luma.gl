// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {ArrowPathLayer, ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import type {Model} from '@luma.gl/engine';

it('Arrow deck layers do not use AttributeManager for Arrow GPU vectors', () => {
  const layers = [new ArrowPathLayer({id: 'path'}), new ArrowTextLayer({id: 'text'})];

  for (const layer of layers) {
    expect(layer.getAttributeManager(), `${layer.id} does not mirror Arrow columns`).toBe(null);
  }
});

it('Arrow deck layers expose their active draw models to Deck', () => {
  const pathLayer = new ArrowPathLayer({id: 'path'});
  const textLayer = new ArrowTextLayer({id: 'text'});
  const pathModel = {id: 'path-model'} as Model;
  const textModel = {id: 'text-model'} as Model;

  expect(pathLayer.getModels(), 'path layer has no model before initialization').toEqual([]);
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
  textLayer.state = {renderer: {model: textModel}, loadVersion: 0} as never;

  expect(pathLayer.getModels(), 'path layer exposes its draw model').toEqual([pathModel]);
  expect(textLayer.getModels(), 'text layer exposes its draw model').toEqual([textModel]);
});

it('Arrow deck layers preserve alpha blending defaults', () => {
  const pathLayer = new ArrowPathLayer({id: 'path'});
  const textLayer = new ArrowTextLayer({id: 'text'});

  for (const layer of [pathLayer, textLayer]) {
    expect(layer.props.parameters.blend, `${layer.id} enables alpha blending`).toBe(true);
    expect(layer.props.parameters.depthWriteEnabled, `${layer.id} disables depth writes`).toBe(
      false
    );
    expect(layer.props.parameters.blendColorSrcFactor, `${layer.id} uses source alpha`).toBe(
      'src-alpha'
    );
  }
});
