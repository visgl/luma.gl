// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowPathLayer} from '@deck.gl-community/arrow-layers';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {
  makeArrowLineRecordBatches,
  makeArrowLineSourceData,
  PATH_DATASETS
} from '../../arrow/arrow-lines/arrow-line-data';

/** Creates the standalone or website-hosted Deck path-layer example. */
export function createArrowPathLayerDeck(parent?: HTMLDivElement) {
  const sourceData = makeArrowLineSourceData(
    PATH_DATASETS['240'],
    'lines',
    'float32',
    'row-colors',
    'none'
  );

  return new Deck({
    parent,
    views: new OrthographicView({id: 'main'}),
    initialViewState: {target: [0, 0], zoom: 8},
    controller: true,
    getTooltip: getArrowLayerTooltip,
    layers: [
      new ArrowPathLayer({
        id: 'arrow-paths',
        pickable: true,
        data: makeArrowLineRecordBatches(sourceData),
        model: 'attribute'
      })
    ]
  });
}
