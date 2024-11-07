// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {CanvasContext, Framebuffer} from '@luma.gl/core';
import {isBrowser} from '@probe.gl/env';
import {getTestDevices} from '@luma.gl/test-utils';

test('CanvasContext#defined', t => {
  t.ok(CanvasContext, 'CanvasContext defined');
  // t.ok(new WEBGLCanvasContext()), 'Context creation ok');
  t.end();
});
// @ts-expect-error
class TestCanvasContext extends CanvasContext {
  // @ts-expect-error
  readonly device = {limits: {maxTextureDimension2D: 1024}};
  getCurrentFramebuffer(): Framebuffer {
    throw new Error('test');
  }
  updateSize() {}
}

test('CanvasContext', t => {
  if (isBrowser()) {
    let canvasContext = new TestCanvasContext();
    t.ok(canvasContext);

    canvasContext = new TestCanvasContext({useDevicePixels: false});
    t.ok(canvasContext);
    t.deepEqual(canvasContext.getPixelSize(), [800, 600]);
  }
  t.end();
});

test.skip('CanvasContext#resize', t => {
  // Using default pixel ratio of 1
  // update drawing buffer size to simulate webglDevice context
  // webglDevice.canvasContext.resize({width: 10, height: 20, useDevicePixels: 1});
  // t.deepEqual(
  //   webglDevice.canvasContext._canvasSizeInfo,
  //   {clientWidth: 10, clientHeight: 20, devicePixelRatio: 1},
  //   'Canvas size info should be cached'
  // );

  // // update drawing buffer size to simulate webglDevice context
  // // Using custom device pixel ratio
  // const DPR = 12.5;
  // webglDevice.canvasContext.resize({useDevicePixels: DPR});
  // t.deepEqual(
  //   webglDevice.canvasContext._canvasSizeInfo,
  //   {clientWidth: 10, clientHeight: 20, devicePixelRatio: DPR},
  //   'Cached canvas size info should be updated'
  // );

  // // trigger again without any changes
  // webglDevice.canvasContext.resize({useDevicePixels: DPR});
  // t.deepEqual(
  //   webglDevice.canvasContext._canvasSizeInfo,
  //   {clientWidth: 10, clientHeight: 20, devicePixelRatio: 12.5},
  //   'Cached canvas size should remain same'
  // );

  /*
  // update device pixel ratio
  DPR = 5;
  webglDevice.canvasContext.resize({useDevicePixels: DPR});
  // update drawing buffer size to simulate webglDevice context
  webglDevice.gl.drawingBufferWidth = Math.floor(webglDevice.gl.canvas.clientWidth * DPR);
  webglDevice.gl.drawingBufferHeight = Math.floor(webglDevice.gl.canvas.clientHeight * DPR);
  webglDevice.webglDizeGLContext({useDevicePixels: DPR});
  t.deepEqual(
    webglDevice._canvasSizeInfo,
    {clientWidth: 10, clientHeight: 20, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // update clientWidth and clientHeight
  Object.assign(webglDevice.gl.canvas, {canvas: {clientWidth: 5, clientHeight: 2}});
  // update drawing buffer size to simulate webglDevice context
  webglDevice.gl.drawingBufferWidth = Math.floor(webglDevice.gl.canvas.clientWidth * DPR);
  webglDevice.gl.drawingBufferHeight = Math.floor(webglDevice.gl.canvas.clientHeight * DPR);
  webglDevice.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webglDevice._canvasSizeInfo,
    {clientWidth: 5, clientHeight: 2, devicePixelRatio: DPR},
    'Cached canvas size info should be updated'
  );

  // update clientWidth and clientHeight to undefiend, should use canvas.width and height
  // and use 1.0 as devicePixelRatio
  Object.assign(webglDevice.gl.canvas, {clientWidth: undefined, clientHeight: undefined});
  // update drawing buffer size to simulate webglDevice context
  webglDevice.gl.drawingBufferWidth = Math.floor(webglDevice.gl.canvas.width); // DPR is 1
  webglDevice.gl.drawingBufferHeight = Math.floor(webglDevice.gl.canvas.height); // DPR is 1
  webglDevice.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webglDevice._canvasSizeInfo,
    {
      clientWidth: webglDevice.gl.canvas.width,
      clientHeight: webglDevice.gl.canvas.height,
      devicePixelRatio: 1.0
    },
    'Should fallback to canvas size clientWidth/clientHeight are not availbe'
  );

  // trigger resize again
  webglDevice.canvasContext.resize({useDevicePixels: DPR});
  t.deepEqual(
    webglDevice._canvasSizeInfo,
    {
      clientWidth: webglDevice.gl.canvas.width,
      clientHeight: webglDevice.gl.canvas.height,
      devicePixelRatio: 1.0
    },
    'Cached canvas size info should remain same'
  );
  */

  t.end();
});

test.skip('CanvasContext#getDevicePixelRatio', async t => {
  const windowPixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const TEST_CASES = [
    {
      name: 'useDevicePixels: true: should use window.devicePixelRatio or 1',
      useDevicePixels: true,
      expected: windowPixelRatio
    },
    {
      name: 'useDevicePixels: false: should use 1',
      useDevicePixels: false,
      expected: 1
    },
    {
      name: 'Non Finite useDevicePixels null: should use 1',
      useDevicePixels: null,
      expected: 1
    },
    {
      name: 'Non valid useDevicePixels 0: should use 1',
      useDevicePixels: 0,
      expected: 1
    },
    {
      name: 'Non valid useDevicePixels negative: should use 1',
      useDevicePixels: -3.2,
      expected: 1
    },
    {
      name: 'Valid useDevicePixels, should use it',
      useDevicePixels: 1.5,
      expected: 1.5
    }
  ];

  for (const device of await getTestDevices()) {
    TEST_CASES.forEach(tc => {
      const result = device.getDefaultCanvasContext().getDevicePixelRatio(tc.useDevicePixels);
      t.equal(result, tc.expected, tc.name);
    });
  }
  t.end();
});
