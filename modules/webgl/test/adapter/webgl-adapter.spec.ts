// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {isBrowser} from '@probe.gl/env';
import {webgl2Adapter} from '@luma.gl/webgl';

test('WebGLAdapter imports from the ESM package entry without circular init errors', async t => {
  t.plan(2);

  // Import the local entry file directly to avoid workspace alias resolution mixing src/dist modules.
  // This regression is about entry-module initialization, not package alias behavior.
  const webglModule = await import('../../src/index');

  t.equal(webglModule.webgl2Adapter.type, 'webgl', 'exports a WebGL adapter instance');
  t.equal(webglModule.WebGLDevice.name, 'WebGLDevice', 'exports the WebGL device class');
});

test('WebGLAdapter#attach uses manual sizing by default and accepts canvasContextProps', async t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const defaultCanvas = document.createElement('canvas');
  const defaultGL = defaultCanvas.getContext('webgl2');
  if (!defaultGL) {
    t.comment('WebGL2 unavailable, skipped attached context sizing test');
    t.end();
    return;
  }

  const defaultDevice = await webgl2Adapter.attach(defaultGL);
  t.equal(
    defaultDevice.getDefaultCanvasContext().props.drawingBufferSizingMode,
    'manual',
    'attached WebGL contexts default to manual drawing buffer sizing'
  );
  defaultDevice.destroy();

  const configuredCanvas = document.createElement('canvas');
  const configuredGL = configuredCanvas.getContext('webgl2');
  if (!configuredGL) {
    t.comment('Second WebGL2 context unavailable, skipped preferred props assertion');
    t.end();
    return;
  }

  const configuredDevice = await webgl2Adapter.attach(configuredGL, {
    canvasContextProps: {
      drawingBufferSizingMode: 'track-css-pixels',
      pixelRatio: 1
    }
  });
  const configuredCanvasContext = configuredDevice.getDefaultCanvasContext();
  t.equal(
    configuredCanvasContext.props.drawingBufferSizingMode,
    'track-css-pixels',
    'canvasContextProps overrides the attached context default'
  );
  t.equal(configuredCanvasContext.props.pixelRatio, 1, 'pixel ratio is forwarded on attach');
  configuredDevice.destroy();

  t.end();
});
