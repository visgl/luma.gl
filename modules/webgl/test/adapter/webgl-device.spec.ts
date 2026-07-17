// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {GL} from '@luma.gl/webgl/constants';
import {webgl2Adapter, WebGLDevice} from '@luma.gl/webgl';

// TODO - duplicates core spec?
test('WebGLDevice#lost (Promise)', async t => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});

  // Wrap in a promise to make sure tape waits for us
  await new Promise<void>(resolve => {
    setTimeout(() => {
      void device.lost.then(cause => {
        t.equal(cause.reason, 'destroyed', `Context lost: ${cause.message}`);
        t.end();
        resolve();
      });
    }, 0);
    device.loseDevice();
  });

  device.destroy();
});

test('WebGLDevice#destroy releases reused devices only after the final owner', async t => {
  if (typeof document === 'undefined') {
    t.pass('Document unavailable, skipped reusable WebGL device lifecycle test');
    t.end();
    return;
  }

  const canvas = document.createElement('canvas');
  const firstDevice = await webgl2Adapter.create({
    createCanvasContext: {canvas},
    _reuseDevices: true,
    debug: false
  });
  const canvasContext = firstDevice.getDefaultCanvasContext();
  const secondDevice = await webgl2Adapter.create({
    createCanvasContext: {canvas},
    _reuseDevices: true,
    debug: false
  });

  t.equal(secondDevice, firstDevice, 'reusable acquisition returns the existing device');

  firstDevice.destroy();

  t.equal(
    (canvasContext as any).device,
    firstDevice,
    'intermediate release keeps the shared canvas wrapper alive'
  );
  t.equal(
    WebGLDevice.getDeviceFromContext(firstDevice.handle),
    firstDevice,
    'intermediate release keeps the WebGL context attached'
  );

  secondDevice.destroy();

  t.equal((canvasContext as any).device, null, 'final release destroys the canvas wrapper');
  t.equal(
    WebGLDevice.getDeviceFromContext(firstDevice.handle),
    null,
    'final release detaches the WebGL context'
  );

  const thirdDevice = await webgl2Adapter.create({
    createCanvasContext: {canvas},
    _reuseDevices: true,
    debug: false
  });

  t.notEqual(thirdDevice, firstDevice, 'later acquisition creates a fresh device');
  thirdDevice.destroy();
  t.end();
});

test('WebGLAdapter#attach retains existing devices until final detach', async t => {
  if (typeof document === 'undefined') {
    t.pass('Document unavailable, skipped attached WebGL device lifecycle test');
    t.end();
    return;
  }

  const canvas = document.createElement('canvas');
  const webglContext = canvas.getContext('webgl2');
  if (!webglContext) {
    t.pass('WebGL2 unavailable, skipped attached WebGL device lifecycle test');
    t.end();
    return;
  }
  const nativeEnable = webglContext.enable.bind(webglContext);
  let nativeEnableCallCount = 0;
  webglContext.enable = ((capability: number) => {
    nativeEnableCallCount++;
    nativeEnable(capability);
  }) as typeof webglContext.enable;

  const firstDevice = await webgl2Adapter.attach(webglContext);
  const canvasContext = firstDevice.getDefaultCanvasContext();
  const secondDevice = await webgl2Adapter.attach(webglContext);

  t.equal(secondDevice, firstDevice, 'repeated attach returns the existing device');
  t.throws(() => firstDevice.detach(), /Device is shared/, 'shared devices cannot detach');

  firstDevice.destroy();

  t.equal(
    (canvasContext as any).device,
    firstDevice,
    'intermediate attached-device release keeps wrappers alive'
  );

  const detachedHandle = secondDevice.detach();

  t.equal(detachedHandle, webglContext, 'detach returns the external WebGL handle');
  t.equal((canvasContext as any).device, null, 'final detach destroys luma wrappers');
  t.equal(
    WebGLDevice.getDeviceFromContext(webglContext),
    null,
    'final detach clears luma metadata from the external handle'
  );

  const thirdDevice = await webgl2Adapter.attach(webglContext);
  const fourthDevice = await webgl2Adapter.attach(thirdDevice);

  t.equal(fourthDevice, thirdDevice, 'attaching an existing Device retains it');

  nativeEnableCallCount = 0;
  webglContext.enable(GL.BLEND);
  t.equal(nativeEnableCallCount, 1, 'reattached state tracker reaches the native setter');
  webglContext.disable(GL.BLEND);

  thirdDevice.destroy();
  t.equal(
    (thirdDevice.getDefaultCanvasContext() as any).device,
    thirdDevice,
    'intermediate Device attachment release keeps wrappers alive'
  );

  fourthDevice.detach();
  webglContext.enable = nativeEnable;
  t.end();
});
