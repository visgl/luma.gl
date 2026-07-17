// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {WebXRManager} from '../../src';

test('webxr#WebXRManager resolves WebGL XR frame state without owning XR framebuffer', async t => {
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
      t.equal(receivedReferenceSpace, referenceSpace, 'queries configured reference space');
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
      t.equal(receivedSession, session, 'creates layer for selected session');
      t.equal(receivedContext, gl, 'creates layer for luma WebGL context');
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

    t.equal(makeXRCompatibleCallCount, 1, 'makes WebGL context XR compatible');
    t.equal(session.updatedBaseLayer, webXRManager.baseLayer, 'updates session render state');
    t.ok(frameState, 'active XR frame resolves state');
    t.equal(frameState?.framebuffer.props.handle, xrFramebufferHandle, 'wraps XR framebuffer');
    t.deepEqual(frameState?.views[0]?.viewport, [0, 0, 32, 32], 'left viewport resolves');
    t.deepEqual(frameState?.views[1]?.viewport, [32, 0, 32, 32], 'right viewport resolves');
    t.equal(frameState?.views[1]?.index, 1, 'view state keeps pose view order');
    t.equal(frameState?.views[0]?.projectionMatrix, leftView.projectionMatrix, 'keeps projection');
    t.equal(
      frameState?.views[0]?.viewMatrix,
      leftView.transform.inverse.matrix,
      'uses inverse XR transform as view matrix'
    );

    webXRManager.destroy();
    t.equal(deleteFramebufferCallCount, 0, 'destroying wrapper does not delete XR framebuffer');
  } finally {
    globalThis.XRWebGLLayer = originalXRWebGLLayer;
    gl.makeXRCompatible = originalMakeXRCompatible;
    gl.deleteFramebuffer = originalDeleteFramebuffer;
    originalDeleteFramebuffer(xrFramebufferHandle);
  }

  t.end();
});

test('webxr#WebXRManager accepts null XRWebGLLayer framebuffer handles', async t => {
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

    t.ok(frameState, 'active XR frame resolves state');
    t.equal(frameState?.framebuffer.props.handle, null, 'wraps null as the default framebuffer');
    t.deepEqual(frameState?.views[0]?.viewport, [0, 0, 64, 32], 'viewport still resolves');

    webXRManager.destroy();
  } finally {
    globalThis.XRWebGLLayer = originalXRWebGLLayer;
    gl.makeXRCompatible = originalMakeXRCompatible;
  }

  t.end();
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
