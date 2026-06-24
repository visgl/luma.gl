// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {ArrowPathLayer, ArrowPolygonLayer, ArrowTextLayer} from '@deck.gl-community/arrow-layers';

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
