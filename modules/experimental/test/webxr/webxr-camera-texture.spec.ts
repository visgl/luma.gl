// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {WebXRCameraTexture} from '../../src';

const TEXTURE_BINDING = {
  type: 'texture',
  name: 'cameraTexture',
  group: 0,
  location: 0
} as const;

const EXTERNAL_TEXTURE_BINDING = {
  type: 'external-texture',
  name: 'cameraTexture',
  group: 0,
  location: 0
} as const;

test('webxr#WebXRCameraTexture resolves borrowed raw camera textures once per generation', async t => {
  const device = await getWebGLTestDevice(t);
  const {gl} = device;
  const cameraTextureHandle = gl.createTexture()!;
  let deleteTextureCallCount = 0;
  const originalDeleteTexture = gl.deleteTexture.bind(gl);
  gl.deleteTexture = (texture => {
    deleteTextureCallCount++;
    return originalDeleteTexture(texture);
  }) as typeof gl.deleteTexture;
  const camera = {width: 4, height: 2} as XRCamera;
  const view = makeXRView(camera);
  let getCameraImageCallCount = 0;
  const xrWebGLBinding = {
    getCameraImage(receivedCamera: XRCamera) {
      t.equal(receivedCamera, camera, 'resolves selected XRCamera');
      getCameraImageCallCount++;
      return cameraTextureHandle;
    }
  } as XRWebGLBinding;

  const webXRCameraTexture = new WebXRCameraTexture(device, xrWebGLBinding);

  try {
    t.false(webXRCameraTexture.isReady, 'source is not ready before a view is selected');
    t.equal(
      webXRCameraTexture.resolveTextureBinding(TEXTURE_BINDING),
      null,
      'unbound source does not resolve'
    );

    webXRCameraTexture.setView(view);
    const firstGeneration = webXRCameraTexture.generation;
    const firstResolution = webXRCameraTexture.resolveTextureBinding(TEXTURE_BINDING);

    t.true(webXRCameraTexture.isReady, 'camera-backed view is ready');
    t.ok(firstResolution, 'camera texture resolves');
    t.equal(firstResolution?.width, camera.width, 'camera width propagates');
    t.equal(firstResolution?.height, camera.height, 'camera height propagates');
    t.equal(firstResolution?.props.handle, cameraTextureHandle, 'borrowed handle is wrapped');
    t.true(firstResolution?.isHandleBorrowed, 'camera texture handle is borrowed');
    t.equal(getCameraImageCallCount, 1, 'first generation resolves camera image once');
    t.equal(
      webXRCameraTexture.resolveTextureBinding(TEXTURE_BINDING),
      firstResolution,
      'same generation reuses borrowed wrapper'
    );
    t.equal(getCameraImageCallCount, 1, 'same generation does not reacquire camera image');

    webXRCameraTexture.setView(view);
    const secondResolution = webXRCameraTexture.resolveTextureBinding(TEXTURE_BINDING);

    t.ok(webXRCameraTexture.generation > firstGeneration, 'new XR view sample advances generation');
    t.equal(secondResolution, firstResolution, 'same borrowed handle reuses luma wrapper');
    t.equal(getCameraImageCallCount, 2, 'next generation reacquires camera image once');
    t.throws(
      () => webXRCameraTexture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING),
      /does not support external-texture bindings/,
      'WebXR camera texture does not route through ExternalTexture'
    );

    webXRCameraTexture.setView(null);
    t.false(webXRCameraTexture.isReady, 'null view clears camera readiness');

    webXRCameraTexture.destroy();
    t.equal(deleteTextureCallCount, 0, 'destroying wrapper does not delete browser handle');
  } finally {
    gl.deleteTexture = originalDeleteTexture;
    originalDeleteTexture(cameraTextureHandle);
    device.destroy();
  }

  t.end();
});

function makeXRView(camera: XRCamera): XRView {
  return {
    camera,
    eye: 'none',
    projectionMatrix: new Float32Array(16),
    transform: {
      inverse: {matrix: new Float32Array(16)}
    }
  } as XRView;
}
