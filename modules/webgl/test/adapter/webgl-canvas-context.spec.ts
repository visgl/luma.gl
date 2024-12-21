// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {WebGLCanvasContext} from '@luma.gl/webgl';

test('WebGLDevice#canvas context creation', async t => {
  t.ok(WebGLCanvasContext, 'WebGLCanvasContext defined');
  const webGLTestDevice = await getWebGLTestDevice();
  t.ok(
    webGLTestDevice.getDefaultCanvasContext() instanceof WebGLCanvasContext,
    'Default context creation ok'
  );
  t.end();
});
