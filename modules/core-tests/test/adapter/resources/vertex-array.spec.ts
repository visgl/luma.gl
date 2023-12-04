// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevices} from '@luma.gl/test-utils';

import {VertexArray} from '@luma.gl/core';

test('VertexArray construct/delete', t => {
  for (const device of getWebGLTestDevices()) {
    const renderPipeline = device.createRenderPipeline({});
    const vertexArray = device.createVertexArray({renderPipeline});
    t.ok(vertexArray instanceof VertexArray, 'VertexArray construction successful');

    vertexArray.destroy();
    t.ok(vertexArray instanceof VertexArray, 'VertexArray delete successful');

    vertexArray.destroy();
    t.ok(vertexArray instanceof VertexArray, 'VertexArray repeated destroy successful');
  }
  t.end();
});
