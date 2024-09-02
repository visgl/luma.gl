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

test('CanvasContext#getDevicePixelRatio', async t => {
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
      const result = device.canvasContext?.getDevicePixelRatio(tc.useDevicePixels);
      t.equal(result, tc.expected, tc.name);
    });
  }
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
