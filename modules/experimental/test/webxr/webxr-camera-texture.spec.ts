// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('webxr#WebXRCameraTexture resolves borrowed raw camera textures once per generation', async () => {
  const device = await getWebGLTestDevice();
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
      expect(receivedCamera, 'resolves selected XRCamera').toBe(camera);
      getCameraImageCallCount++;
      return cameraTextureHandle;
    }
  } as XRWebGLBinding;

  const webXRCameraTexture = new WebXRCameraTexture(device, xrWebGLBinding);

  try {
    expect(
      Boolean(webXRCameraTexture.isReady),
      'source is not ready before a view is selected'
    ).toBe(false);
    expect(
      webXRCameraTexture.resolveTextureBinding(TEXTURE_BINDING),
      'unbound source does not resolve'
    ).toBe(null);

    webXRCameraTexture.setView(view);
    const firstGeneration = webXRCameraTexture.generation;
    const firstResolution = webXRCameraTexture.resolveTextureBinding(TEXTURE_BINDING);

    expect(Boolean(webXRCameraTexture.isReady), 'camera-backed view is ready').toBe(true);
    expect(Boolean(firstResolution), 'camera texture resolves').toBe(true);
    expect(firstResolution?.width, 'camera width propagates').toBe(camera.width);
    expect(firstResolution?.height, 'camera height propagates').toBe(camera.height);
    expect(firstResolution?.props.handle, 'borrowed handle is wrapped').toBe(cameraTextureHandle);
    expect(Boolean(firstResolution?.isHandleBorrowed), 'camera texture handle is borrowed').toBe(
      true
    );
    expect(getCameraImageCallCount, 'first generation resolves camera image once').toBe(1);
    expect(
      webXRCameraTexture.resolveTextureBinding(TEXTURE_BINDING),
      'same generation reuses borrowed wrapper'
    ).toBe(firstResolution);
    expect(getCameraImageCallCount, 'same generation does not reacquire camera image').toBe(1);

    webXRCameraTexture.setView(view);
    const secondResolution = webXRCameraTexture.resolveTextureBinding(TEXTURE_BINDING);

    expect(
      Boolean(webXRCameraTexture.generation > firstGeneration),
      'new XR view sample advances generation'
    ).toBe(true);
    expect(secondResolution, 'same borrowed handle reuses luma wrapper').toBe(firstResolution);
    expect(getCameraImageCallCount, 'next generation reacquires camera image once').toBe(2);
    expect(
      () => webXRCameraTexture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING),
      'WebXR camera texture does not route through ExternalTexture'
    ).toThrow(/does not support external-texture bindings/);

    webXRCameraTexture.setView(null);
    expect(Boolean(webXRCameraTexture.isReady), 'null view clears camera readiness').toBe(false);

    webXRCameraTexture.destroy();
    expect(deleteTextureCallCount, 'destroying wrapper does not delete browser handle').toBe(0);
  } finally {
    gl.deleteTexture = originalDeleteTexture;
    originalDeleteTexture(cameraTextureHandle);
    device.destroy();
  }

  void 0;
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
