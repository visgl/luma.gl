// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import {VertexArray} from '@luma.gl/core';

test('VertexArray#construct/delete', async t => {
  for (const device of [await getWebGLTestDevice()]) {
    const vertexArray = device.createVertexArray({
      shaderLayout: {attributes: [], bindings: []},
      bufferLayout: []
    });
    t.ok(vertexArray instanceof VertexArray, 'VertexArray construction successful');

    vertexArray.destroy();
    t.ok(vertexArray instanceof VertexArray, 'VertexArray delete successful');

    vertexArray.destroy();
    t.ok(vertexArray instanceof VertexArray, 'VertexArray repeated destroy successful');
  }
  t.end();
});
