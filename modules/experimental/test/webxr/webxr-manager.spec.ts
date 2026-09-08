// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {WebXRManager} from '../../src';

it('webxr#WebXRManager resolves WebGL XR frame state without owning XR framebuffer', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const xrFramebufferHandle = gl.createFramebuffer()!;
  const referenceSpace = {} as XRReferenceSpace;
  const session = makeXRSession(referenceSpace);
  const leftView = makeXRView('left', 0);
  const rightView = makeXRView('right', 1);
  const xrFrame = {
    session,
    getViewerPose: (receivedReferenceSpace: XRReferenceSpace) => {
      expect(receivedReferenceSpace, 'queries configured reference space').toBe(referenceSpace);
      return {views: [leftView, rightView]} as XRViewerPose;
    }
  } as XRFrame;

  let makeXRCompatibleCallCount = 0;
  let deleteFramebufferCallCount = 0;
  const originalMakeXRCompatible = gl.makeXRCompatible;
  const originalDeleteFramebuffer = gl.deleteFramebuffer.bind(gl);
  const originalXRWebGLLayer = globalThis.XRWebGLLayer;
  gl.makeXRCompatible = async () => {
    makeXRCompatibleCallCount++;
  };
  gl.deleteFramebuffer = (framebuffer => {
    deleteFramebufferCallCount++;
    return originalDeleteFramebuffer(framebuffer);
  }) as typeof gl.deleteFramebuffer;
  globalThis.XRWebGLLayer = class {
    readonly framebuffer = xrFramebufferHandle;
    readonly framebufferWidth = 64;
    readonly framebufferHeight = 32;

    constructor(
      receivedSession: XRSession,
      receivedContext: WebGLRenderingContext | WebGL2RenderingContext
    ) {
      expect(receivedSession, 'creates layer for selected session').toBe(session);
      expect(receivedContext, 'creates layer for luma WebGL context').toBe(gl);
    }

    getViewport(view: XRView): XRViewport {
      return view.eye === 'left'
        ? ({x: 0, y: 0, width: 32, height: 32} as XRViewport)
        : ({x: 32, y: 0, width: 32, height: 32} as XRViewport);
    }
  } as typeof XRWebGLLayer;

  try {
    const webXRManager = new WebXRManager(device);
    await webXRManager.setSession(session);
    const frameState = webXRManager.getFrameState(xrFrame);

    expect(makeXRCompatibleCallCount, 'makes WebGL context XR compatible').toBe(1);
    expect(session.updatedBaseLayer, 'updates session render state').toBe(webXRManager.baseLayer);
    expect(Boolean(frameState), 'active XR frame resolves state').toBe(true);
    expect(frameState?.framebuffer.props.handle, 'wraps XR framebuffer').toBe(xrFramebufferHandle);
    expect(frameState?.views[0]?.framebuffer, 'left WebGL eye uses the shared XR framebuffer').toBe(
      frameState?.framebuffer
    );
    expect(
      frameState?.views[1]?.framebuffer,
      'right WebGL eye uses the shared XR framebuffer'
    ).toBe(frameState?.framebuffer);
    expect(frameState?.views[0]?.viewport, 'left viewport resolves').toEqual([0, 0, 32, 32]);
    expect(frameState?.views[1]?.viewport, 'right viewport resolves').toEqual([32, 0, 32, 32]);
    expect(frameState?.views[1]?.index, 'view state keeps pose view order').toBe(1);
    expect(frameState?.views[0]?.projectionMatrix, 'keeps projection').toBe(
      leftView.projectionMatrix
    );
    expect(frameState?.views[0]?.viewMatrix, 'uses inverse XR transform as view matrix').toBe(
      leftView.transform.inverse.matrix
    );

    webXRManager.destroy();
    expect(deleteFramebufferCallCount, 'destroying wrapper does not delete XR framebuffer').toBe(0);
  } finally {
    globalThis.XRWebGLLayer = originalXRWebGLLayer;
    gl.makeXRCompatible = originalMakeXRCompatible;
    gl.deleteFramebuffer = originalDeleteFramebuffer;
    originalDeleteFramebuffer(xrFramebufferHandle);
    device.destroy();
  }

  void 0;
});

it('webxr#WebXRManager accepts null XRWebGLLayer framebuffer handles', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const referenceSpace = {} as XRReferenceSpace;
  const session = makeXRSession(referenceSpace);
  const view = makeXRView('none', 0);
  const xrFrame = {
    session,
    getViewerPose: () => ({views: [view]}) as XRViewerPose
  } as XRFrame;

  const originalMakeXRCompatible = gl.makeXRCompatible;
  const originalXRWebGLLayer = globalThis.XRWebGLLayer;
  gl.makeXRCompatible = async () => {};
  globalThis.XRWebGLLayer = class {
    readonly framebuffer = null;
    readonly framebufferWidth = 64;
    readonly framebufferHeight = 32;

    getViewport(): XRViewport {
      return {x: 0, y: 0, width: 64, height: 32} as XRViewport;
    }
  } as typeof XRWebGLLayer;

  try {
    const webXRManager = new WebXRManager(device);
    await webXRManager.setSession(session);
    const frameState = webXRManager.getFrameState(xrFrame);

    expect(Boolean(frameState), 'active XR frame resolves state').toBe(true);
    expect(frameState?.framebuffer.props.handle, 'wraps null as the default framebuffer').toBe(
      null
    );
    expect(
      frameState?.views[0]?.framebuffer,
      'view exposes the backwards-compatible shared framebuffer'
    ).toBe(frameState?.framebuffer);
    expect(frameState?.views[0]?.viewport, 'viewport still resolves').toEqual([0, 0, 64, 32]);

    webXRManager.destroy();
  } finally {
    globalThis.XRWebGLLayer = originalXRWebGLLayer;
    gl.makeXRCompatible = originalMakeXRCompatible;
    device.destroy();
  }

  void 0;
});

function makeXRSession(
  referenceSpace: XRReferenceSpace
): XRSession & {updatedBaseLayer: XRWebGLLayer | null} {
  const session = Object.assign(new EventTarget(), {
    updatedBaseLayer: null,
    async updateRenderState(renderStateInit: XRRenderStateInit = {}) {
      session.updatedBaseLayer = renderStateInit.baseLayer || null;
    },
    async requestReferenceSpace() {
      return referenceSpace;
    }
  }) as XRSession & {updatedBaseLayer: XRWebGLLayer | null};
  return session;
}

function makeXRView(eye: XREye, index: number): XRView {
  return {
    camera: null,
    eye,
    projectionMatrix: new Float32Array([index + 1]),
    transform: {
      inverse: {matrix: new Float32Array([index + 10])}
    }
  } as XRView;
}
