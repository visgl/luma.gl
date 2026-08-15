// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  Device,
  Framebuffer,
  FramebufferProps,
  Texture,
  TextureProps,
  TextureView
} from '@luma.gl/core';
import test from 'test/utils/vitest-tape';
import {
  WebXRManager,
  getWebXRProjectionLayerState,
  getWebXRReferenceSpaceTypes,
  setWebXRProjectionLayerControls
} from '../../src/webxr/webxr-manager';

type MockTextureHandle = GPUTexture & {destroyCount: number};
type MockTexture = Texture & {destroyCount: number};
type MockFramebuffer = Framebuffer & {destroyCount: number};
type MockWebGPUDevice = Device & {
  type: 'webgpu';
  handle: GPUDevice;
  createdTextures: MockTexture[];
  createdFramebuffers: MockFramebuffer[];
};
type MockXRSession = XRSession & {
  inputSources: XRInputSource[];
  requestedReferenceSpaceTypes: XRReferenceSpaceType[];
  updatedBaseLayer: XRWebGLLayer | null;
  updatedLayers: XRProjectionLayer[] | null;
};

test('webxr#WebXRManager resolves independent borrowed WebGPU stereo framebuffers', async testCase => {
  const device = makeMockWebGPUDevice();
  const referenceSpace = {} as XRReferenceSpace;
  const session = makeMockXRSession(referenceSpace, ['webgpu']);
  const leftView = makeMockXRView('left', 0);
  const rightView = makeMockXRView('right', 1);
  const projectionLayer = makeMockXRProjectionLayer({
    textureWidth: 1024,
    textureHeight: 768,
    textureArrayLength: 2,
    ignoreDepthValues: false,
    fixedFoveation: 0.25
  });
  const colorTextureHandle = makeMockTextureHandle('bgra8unorm', 2);
  const depthTextureHandle = makeMockTextureHandle('depth24plus', 2);
  const deltaPose = {matrix: new Float32Array([1, 0, 0, 0]), inverse: {}} as XRRigidTransform;
  let activeViews = [leftView, rightView];
  let receivedProjectionLayerInit: XRProjectionLayerInit | undefined;
  let receivedBindingSession: XRSession | undefined;
  let receivedBindingDevice: GPUDevice | undefined;
  const originalXRGPUBinding = globalThis.XRGPUBinding;

  globalThis.XRGPUBinding = class {
    constructor(receivedSession: XRSession, receivedDevice: GPUDevice) {
      receivedBindingSession = receivedSession;
      receivedBindingDevice = receivedDevice;
    }

    getPreferredColorFormat(): GPUTextureFormat {
      return 'bgra8unorm';
    }

    createProjectionLayer(layerInit?: XRProjectionLayerInit): XRProjectionLayer {
      receivedProjectionLayerInit = layerInit;
      return projectionLayer;
    }

    getViewSubImage(receivedLayer: XRProjectionLayer, view: XRView): XRGPUSubImage {
      testCase.equal(receivedLayer, projectionLayer, 'queries the configured projection layer');
      const viewIndex = view.eye === 'left' ? 0 : 1;
      return {
        colorTexture: colorTextureHandle,
        depthStencilTexture: depthTextureHandle,
        viewport: {x: viewIndex * 32, y: 2, width: 30, height: 28},
        getViewDescriptor: () => ({
          dimension: '2d',
          baseMipLevel: 0,
          mipLevelCount: 1,
          baseArrayLayer: viewIndex,
          arrayLayerCount: 1
        })
      };
    }
  } as typeof XRGPUBinding;

  try {
    const manager = new WebXRManager(device, {projectionLayerInit: {scaleFactor: 0.8}});
    await manager.setSession(session);
    let viewerPose = makeMockXRViewerPose(activeViews);
    const frame = {
      session,
      getViewerPose: () => {
        viewerPose = makeMockXRViewerPose(activeViews);
        return viewerPose;
      }
    } as XRFrame;
    const frameState = manager.getFrameState(frame);

    testCase.equal(receivedBindingSession, session, 'binding receives the active XR session');
    testCase.equal(receivedBindingDevice, device.handle, 'binding receives the native GPU device');
    testCase.deepEqual(
      receivedProjectionLayerInit,
      {colorFormat: 'bgra8unorm', depthStencilFormat: 'depth24plus', scaleFactor: 0.8},
      'projection layer uses preferred formats and caller options'
    );
    testCase.deepEqual(
      session.updatedLayers,
      [projectionLayer],
      'installs a native projection layer'
    );
    testCase.equal(session.updatedBaseLayer, null, 'WebGPU does not install a legacy WebGL layer');
    testCase.equal(manager.baseLayer, null, 'legacy layer remains unset');
    testCase.equal(manager.projectionLayer, projectionLayer, 'exposes the native projection layer');
    testCase.equal(frameState?.viewer.pose, viewerPose, 'retains WebGPU viewer pose');
    testCase.equal(frameState?.viewer.matrix, viewerPose.transform.matrix, 'exposes viewer matrix');
    testCase.equal(
      frameState?.viewer.viewMatrix,
      viewerPose.transform.inverse.matrix,
      'exposes inverse viewer matrix'
    );
    testCase.deepEqual(frameState?.viewer.position, [1, 1.5, -2], 'exposes viewer position');
    testCase.deepEqual(
      manager.getProjectionLayerState(),
      getWebXRProjectionLayerState(projectionLayer),
      'snapshots native projection layer metadata'
    );
    testCase.deepEqual(
      manager.setProjectionLayerControls({fixedFoveation: 0.6, deltaPose}),
      {
        layer: projectionLayer,
        textureWidth: 1024,
        textureHeight: 768,
        textureArrayLength: 2,
        ignoreDepthValues: false,
        fixedFoveation: 0.6,
        deltaPose
      },
      'updates and snapshots projection layer controls'
    );
    testCase.equal(frameState?.views.length, 2, 'resolves both stereo views');
    testCase.equal(
      frameState?.framebuffer,
      frameState?.views[0]?.framebuffer,
      'legacy frame framebuffer points to the first WebGPU eye'
    );
    testCase.notEqual(
      frameState?.views[0]?.framebuffer,
      frameState?.views[1]?.framebuffer,
      'WebGPU eyes receive independently clearable framebuffers'
    );
    testCase.deepEqual(frameState?.views[0]?.viewport, [0, 2, 30, 28], 'keeps left viewport');
    testCase.deepEqual(frameState?.views[1]?.viewport, [32, 2, 30, 28], 'keeps right viewport');
    testCase.equal(
      frameState?.views[1]?.projectionMatrix,
      rightView.projectionMatrix,
      'retains each eye projection matrix'
    );
    testCase.equal(device.createdTextures.length, 4, 'wraps both color and depth for each eye');
    testCase.equal(device.createdFramebuffers.length, 2, 'creates one framebuffer per eye');
    testCase.deepEqual(
      device.createdTextures.map(texture => texture.props.view?.baseArrayLayer),
      [0, 0, 1, 1],
      'color and depth views honor compositor-selected array layers'
    );
    testCase.ok(
      device.createdTextures.every(texture => texture.props._isHandleBorrowed),
      'every compositor texture handle is explicitly borrowed'
    );
    testCase.ok(
      device.createdTextures.every(
        texture =>
          texture.props.view?.dimension === '2d' && texture.props.view?.arrayLayerCount === 1
      ),
      'array-backed stereo render attachments use single-layer 2D views'
    );

    const repeatedFrameState = manager.getFrameState(frame);
    testCase.equal(
      device.createdTextures.length,
      4,
      'reuses wrappers while native textures are stable'
    );
    testCase.equal(
      repeatedFrameState?.views[1]?.framebuffer,
      frameState?.views[1]?.framebuffer,
      'reuses unchanged eye framebuffers'
    );

    activeViews = [leftView];
    manager.getFrameState(frame);
    testCase.equal(
      device.createdFramebuffers[1]?.destroyCount,
      1,
      'releases removed eye framebuffer'
    );
    testCase.equal(
      device.createdTextures[2]?.destroyCount,
      1,
      'releases removed eye color wrapper'
    );
    testCase.equal(
      device.createdTextures[3]?.destroyCount,
      1,
      'releases removed eye depth wrapper'
    );

    manager.destroy();
    manager.destroy();
    testCase.equal(device.createdFramebuffers[0]?.destroyCount, 1, 'cleanup is idempotent');
    testCase.equal(
      colorTextureHandle.destroyCount,
      0,
      'never destroys browser-owned color texture'
    );
    testCase.equal(
      depthTextureHandle.destroyCount,
      0,
      'never destroys browser-owned depth texture'
    );
    testCase.equal(manager.projectionLayer, null, 'clears native projection layer');
    testCase.equal(
      manager.getProjectionLayerState(),
      null,
      'cleared projection layer has no state'
    );
    testCase.equal(
      manager.setProjectionLayerControls({fixedFoveation: 0.5}),
      null,
      'cleared projection layer ignores control updates'
    );
    testCase.equal(manager.webGPUBinding, null, 'clears native GPU binding');
  } finally {
    globalThis.XRGPUBinding = originalXRGPUBinding;
  }

  testCase.end();
});

test('webxr#projection layer control helpers update standalone layers', testCase => {
  const deltaPose = {matrix: new Float32Array([1]), inverse: {}} as XRRigidTransform;
  const projectionLayer = makeMockXRProjectionLayer({
    textureWidth: 512,
    textureHeight: 256,
    textureArrayLength: 1,
    ignoreDepthValues: true,
    fixedFoveation: null,
    deltaPose: null
  });

  const projectionLayerState = setWebXRProjectionLayerControls(projectionLayer, {
    fixedFoveation: 0.75,
    deltaPose
  });

  testCase.deepEqual(
    projectionLayerState,
    {
      layer: projectionLayer,
      textureWidth: 512,
      textureHeight: 256,
      textureArrayLength: 1,
      ignoreDepthValues: true,
      fixedFoveation: 0.75,
      deltaPose
    },
    'updates standalone projection layer controls'
  );
  testCase.deepEqual(
    getWebXRProjectionLayerState(projectionLayer),
    projectionLayerState,
    'snapshots standalone projection layer state'
  );
  testCase.end();
});

test('webxr#WebXRManager handles legacy image indices and rotating GPU compositor textures', async testCase => {
  const device = makeMockWebGPUDevice();
  const referenceSpace = {} as XRReferenceSpace;
  const session = makeMockXRSession(referenceSpace, ['webgpu']);
  const view = makeMockXRView('right', 1);
  const firstTextureHandle = makeMockTextureHandle('rgba8unorm', 2);
  const secondTextureHandle = makeMockTextureHandle('rgba8unorm', 2);
  const projectionLayer = new EventTarget() as XRProjectionLayer;
  let activeTextureHandle = firstTextureHandle;
  let activeImageIndex = 1;
  const originalXRGPUBinding = globalThis.XRGPUBinding;

  globalThis.XRGPUBinding = class {
    getPreferredColorFormat(): GPUTextureFormat {
      return 'rgba8unorm';
    }

    createProjectionLayer(): XRProjectionLayer {
      return projectionLayer;
    }

    getViewSubImage(): XRGPUSubImage {
      return {
        colorTexture: activeTextureHandle,
        depthStencilTexture: null,
        imageIndex: activeImageIndex,
        viewport: {x: 0, y: 0, width: 64, height: 32}
      };
    }
  } as typeof XRGPUBinding;

  try {
    const manager = new WebXRManager(device);
    await manager.setSession(session);
    const frame = {session, getViewerPose: () => makeMockXRViewerPose([view])} as XRFrame;
    const firstFrameState = manager.getFrameState(frame);

    testCase.equal(device.createdTextures.length, 1, 'depth attachment remains optional');
    testCase.equal(
      device.createdTextures[0]?.props.view?.baseArrayLayer,
      1,
      'legacy image index selects the requested array slice'
    );
    testCase.equal(
      firstFrameState?.views[0]?.framebuffer.depthStencilAttachment,
      null,
      'framebuffer does not synthesize browser-owned depth'
    );

    activeTextureHandle = secondTextureHandle;
    activeImageIndex = 0;
    const secondFrameState = manager.getFrameState(frame);

    testCase.notEqual(
      secondFrameState?.views[0]?.framebuffer,
      firstFrameState?.views[0]?.framebuffer,
      'rotating native textures rebuild the eye framebuffer'
    );
    testCase.equal(device.createdFramebuffers[0]?.destroyCount, 1, 'releases obsolete framebuffer');
    testCase.equal(device.createdTextures[0]?.destroyCount, 1, 'releases obsolete texture wrapper');
    testCase.equal(device.createdTextures[1]?.props.view?.baseArrayLayer, 0, 'updates array slice');
    testCase.equal(
      firstTextureHandle.destroyCount,
      0,
      'obsolete compositor texture remains borrowed'
    );

    manager.clearSession();
    testCase.equal(
      secondTextureHandle.destroyCount,
      0,
      'active compositor texture remains borrowed'
    );
    testCase.equal(manager.getFrameState(frame), null, 'cleared session no longer resolves frames');
  } finally {
    globalThis.XRGPUBinding = originalXRGPUBinding;
  }

  testCase.end();
});

test('webxr#WebXRManager shares identical WebGPU atlas attachments across stereo eyes', async testCase => {
  const device = makeMockWebGPUDevice();
  const referenceSpace = {} as XRReferenceSpace;
  const session = makeMockXRSession(referenceSpace, ['webgpu']);
  const leftView = makeMockXRView('left', 0);
  const rightView = makeMockXRView('right', 1);
  const projectionLayer = new EventTarget() as XRProjectionLayer;
  const colorTextureHandle = makeMockTextureHandle('rgba8unorm', 1);
  const depthTextureHandle = makeMockTextureHandle('depth24plus', 1);
  let activeViews = [leftView, rightView];
  const originalXRGPUBinding = globalThis.XRGPUBinding;

  globalThis.XRGPUBinding = class {
    getPreferredColorFormat(): GPUTextureFormat {
      return 'rgba8unorm';
    }

    createProjectionLayer(): XRProjectionLayer {
      return projectionLayer;
    }

    getViewSubImage(_projectionLayer: XRProjectionLayer, view: XRView): XRGPUSubImage {
      return {
        colorTexture: colorTextureHandle,
        depthStencilTexture: depthTextureHandle,
        viewport: {x: view.eye === 'left' ? 0 : 32, y: 0, width: 32, height: 32},
        getViewDescriptor: () => ({
          dimension: '2d',
          baseArrayLayer: 0,
          arrayLayerCount: 1,
          mipLevelCount: 1
        })
      };
    }
  } as typeof XRGPUBinding;

  try {
    const manager = new WebXRManager(device);
    await manager.setSession(session);
    const frame = {
      session,
      getViewerPose: () => makeMockXRViewerPose(activeViews)
    } as XRFrame;
    const frameState = manager.getFrameState(frame);

    testCase.equal(device.createdTextures.length, 2, 'wraps shared color and depth only once');
    testCase.equal(device.createdFramebuffers.length, 1, 'deduplicates shared atlas framebuffer');
    testCase.equal(
      frameState?.views[0]?.framebuffer,
      frameState?.views[1]?.framebuffer,
      'both atlas eyes expose identical framebuffer identity'
    );
    testCase.deepEqual(frameState?.views[0]?.viewport, [0, 0, 32, 32], 'keeps left atlas viewport');
    testCase.deepEqual(
      frameState?.views[1]?.viewport,
      [32, 0, 32, 32],
      'keeps right atlas viewport'
    );

    activeViews = [leftView];
    manager.getFrameState(frame);
    testCase.equal(
      device.createdFramebuffers[0]?.destroyCount,
      0,
      'remaining eye retains shared framebuffer when another eye disappears'
    );

    manager.destroy();
    testCase.equal(device.createdFramebuffers[0]?.destroyCount, 1, 'destroys shared wrapper once');
    testCase.equal(
      device.createdTextures[0]?.destroyCount,
      1,
      'destroys shared color wrapper once'
    );
    testCase.equal(
      device.createdTextures[1]?.destroyCount,
      1,
      'destroys shared depth wrapper once'
    );
    testCase.equal(
      colorTextureHandle.destroyCount,
      0,
      'preserves browser-owned shared color texture'
    );
    testCase.equal(
      depthTextureHandle.destroyCount,
      0,
      'preserves browser-owned shared depth texture'
    );
  } finally {
    globalThis.XRGPUBinding = originalXRGPUBinding;
  }

  testCase.end();
});

test('webxr#WebXRManager rejects unsupported WebGPU sessions and foreign frames', async testCase => {
  const device = makeMockWebGPUDevice();
  const referenceSpace = {} as XRReferenceSpace;
  const sessionWithoutWebGPU = makeMockXRSession(referenceSpace, ['local-floor']);
  const originalXRGPUBinding = globalThis.XRGPUBinding;

  globalThis.XRGPUBinding = class {
    getPreferredColorFormat(): GPUTextureFormat {
      return 'rgba8unorm';
    }

    createProjectionLayer(): XRProjectionLayer {
      return new EventTarget() as XRProjectionLayer;
    }

    getViewSubImage(): XRGPUSubImage {
      throw new Error('Unexpected view lookup');
    }
  } as typeof XRGPUBinding;

  try {
    const manager = new WebXRManager(device);
    try {
      await manager.setSession(sessionWithoutWebGPU);
      testCase.fail('session without the webgpu feature should be rejected');
    } catch (error) {
      testCase.match(
        error instanceof Error ? error.message : '',
        /webgpu feature/,
        'rejects sessions that did not negotiate WebGPU'
      );
    }

    const session = makeMockXRSession(referenceSpace, ['webgpu']);
    await manager.setSession(session);
    const foreignSession = makeMockXRSession(referenceSpace, ['webgpu']);
    const foreignFrame = {
      session: foreignSession,
      getViewerPose: () => makeMockXRViewerPose([makeMockXRView('left', 0)])
    } as XRFrame;

    testCase.throws(
      () => manager.getFrameState(foreignFrame),
      /different XRSession/,
      'rejects a frame belonging to another session'
    );
    testCase.equal(
      manager.getFrameState({session, getViewerPose: () => undefined} as XRFrame),
      null,
      'missing viewer poses do not create attachments'
    );
    manager.destroy();

    globalThis.XRGPUBinding = undefined as unknown as typeof XRGPUBinding;
    const unavailableManager = new WebXRManager(device);
    try {
      await unavailableManager.setSession(session);
      testCase.fail('missing WebGPU XR browser binding should be rejected');
    } catch (error) {
      testCase.match(
        error instanceof Error ? error.message : '',
        /not supported/,
        'reports unavailable browser WebGPU XR support'
      );
    }
  } finally {
    globalThis.XRGPUBinding = originalXRGPUBinding;
  }

  testCase.end();
});

test('webxr#WebXRManager negotiates reference-space fallbacks', async testCase => {
  const boundedReferenceSpace = {} as XRReferenceSpace;
  const localReferenceSpace = {} as XRReferenceSpace;
  const session = makeMockXRSession(boundedReferenceSpace, [], [], {
    rejectedReferenceSpaceTypes: ['bounded-floor', 'local-floor'],
    referenceSpacesByType: {
      local: localReferenceSpace
    }
  });
  const gl = {
    async makeXRCompatible() {}
  } as WebGL2RenderingContext;
  const device = {
    type: 'webgl',
    gl,
    createFramebuffer: (props: FramebufferProps) => makeMockFramebuffer(props)
  } as unknown as Device;
  const originalXRWebGLLayer = globalThis.XRWebGLLayer;

  globalThis.XRWebGLLayer = class {
    readonly framebuffer = null;
    readonly framebufferWidth = 1;
    readonly framebufferHeight = 1;

    getViewport(): XRViewport {
      return {x: 0, y: 0, width: 1, height: 1};
    }
  } as typeof XRWebGLLayer;

  try {
    const manager = new WebXRManager(device, {
      referenceSpaceTypes: ['bounded-floor', 'local-floor', 'local-floor', 'local']
    });
    await manager.setSession(session);

    testCase.deepEqual(
      getWebXRReferenceSpaceTypes({
        referenceSpaceTypes: ['bounded-floor', 'local-floor', 'local-floor', 'local']
      }),
      ['bounded-floor', 'local-floor', 'local'],
      'normalizes duplicate reference-space fallback entries'
    );
    testCase.deepEqual(
      getWebXRReferenceSpaceTypes({referenceSpaceType: 'unbounded'}),
      ['unbounded'],
      'keeps backwards-compatible single reference-space setup'
    );
    testCase.deepEqual(
      session.requestedReferenceSpaceTypes,
      ['bounded-floor', 'local-floor', 'local'],
      'tries reference spaces in caller order until one succeeds'
    );
    testCase.equal(
      manager.referenceSpace,
      localReferenceSpace,
      'stores the first supported reference space'
    );
    testCase.equal(manager.referenceSpaceType, 'local', 'stores the first supported type');

    manager.clearSession();
    testCase.equal(manager.referenceSpaceType, null, 'clears resolved reference-space type');
  } finally {
    globalThis.XRWebGLLayer = originalXRWebGLLayer;
  }

  testCase.end();
});

test('webxr#WebXRManager resolves input source poses and select activity', async testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const targetRaySpace = {} as XRSpace;
  const gripSpace = {} as XRSpace;
  const screenTargetRaySpace = {} as XRSpace;
  const targetRayPose = makeMockXRPose([1, 2, 3, 4]);
  const gripPose = makeMockXRPose([5, 6, 7, 8]);
  const poseBySpace = new Map<XRSpace, XRPose>([
    [targetRaySpace, targetRayPose],
    [gripSpace, gripPose]
  ]);
  const controllerInputSource = makeMockXRInputSource({
    handedness: 'left',
    targetRayMode: 'tracked-pointer',
    targetRaySpace,
    gripSpace,
    profiles: ['oculus-touch-v3', 'generic-trigger-squeeze-thumbstick'],
    gamepad: {} as Gamepad
  });
  const screenInputSource = makeMockXRInputSource({
    handedness: 'none',
    targetRayMode: 'screen',
    targetRaySpace: screenTargetRaySpace,
    profiles: ['generic-screen']
  });
  const session = makeMockXRSession(referenceSpace, [], [controllerInputSource, screenInputSource]);
  const gl = {
    async makeXRCompatible() {}
  } as WebGL2RenderingContext;
  const device = {
    type: 'webgl',
    gl,
    createFramebuffer: (props: FramebufferProps) => makeMockFramebuffer(props)
  } as unknown as Device;
  const originalXRWebGLLayer = globalThis.XRWebGLLayer;

  globalThis.XRWebGLLayer = class {
    readonly framebuffer = null;
    readonly framebufferWidth = 1;
    readonly framebufferHeight = 1;

    getViewport(): XRViewport {
      return {x: 0, y: 0, width: 1, height: 1};
    }
  } as typeof XRWebGLLayer;

  try {
    const manager = new WebXRManager(device);
    await manager.setSession(session);
    const frame = {
      session,
      getPose(space: XRSpace, baseSpace: XRReferenceSpace): XRPose | undefined {
        testCase.equal(baseSpace, referenceSpace, 'queries poses in the manager reference space');
        return poseBySpace.get(space);
      },
      getViewerPose: () => undefined
    } as XRFrame;
    let inputState = manager.getInputState(frame);

    testCase.equal(inputState?.length, 2, 'reports every active input source');
    testCase.equal(inputState?.[0]?.inputSource, controllerInputSource, 'retains input identity');
    testCase.equal(inputState?.[0]?.handedness, 'left', 'keeps handedness');
    testCase.equal(inputState?.[0]?.targetRayMode, 'tracked-pointer', 'keeps target ray mode');
    testCase.deepEqual(
      inputState?.[0]?.profiles,
      ['oculus-touch-v3', 'generic-trigger-squeeze-thumbstick'],
      'keeps profile order'
    );
    testCase.equal(inputState?.[0]?.gamepad, controllerInputSource.gamepad, 'keeps gamepad');
    testCase.equal(inputState?.[0]?.targetRayPose, targetRayPose, 'keeps target ray pose');
    testCase.equal(inputState?.[0]?.targetRayMatrix, targetRayPose.transform.matrix, 'keeps ray');
    testCase.equal(inputState?.[0]?.gripPose, gripPose, 'keeps grip pose');
    testCase.equal(inputState?.[0]?.gripMatrix, gripPose.transform.matrix, 'keeps grip');
    testCase.equal(inputState?.[0]?.selectActive, false, 'select starts inactive');
    testCase.equal(inputState?.[0]?.squeezeActive, false, 'squeeze starts inactive');
    testCase.equal(inputState?.[1]?.targetRayPose, null, 'missing poses become null');
    testCase.equal(inputState?.[1]?.gripPose, null, 'missing grip spaces become null');

    session.dispatchEvent(makeMockXRInputSourceEvent('selectstart', controllerInputSource, frame));
    inputState = manager.getInputState(frame);
    testCase.equal(inputState?.[0]?.selectActive, true, 'selectstart marks the source active');
    testCase.equal(inputState?.[0]?.squeezeActive, false, 'select does not affect squeeze');

    session.dispatchEvent(makeMockXRInputSourceEvent('squeezestart', controllerInputSource, frame));
    inputState = manager.getInputState(frame);
    testCase.equal(inputState?.[0]?.squeezeActive, true, 'squeezestart marks the source active');
    testCase.equal(inputState?.[0]?.selectActive, true, 'squeeze does not affect select');

    session.dispatchEvent(makeMockXRInputSourceEvent('squeezeend', controllerInputSource, frame));
    inputState = manager.getInputState(frame);
    testCase.equal(inputState?.[0]?.squeezeActive, false, 'squeezeend marks the source inactive');

    session.dispatchEvent(makeMockXRInputSourceEvent('selectend', controllerInputSource, frame));
    inputState = manager.getInputState(frame);
    testCase.equal(inputState?.[0]?.selectActive, false, 'selectend marks the source inactive');

    session.dispatchEvent(makeMockXRInputSourceEvent('selectstart', controllerInputSource, frame));
    session.dispatchEvent(makeMockXRInputSourceEvent('squeezestart', controllerInputSource, frame));
    session.inputSources = [screenInputSource];
    session.dispatchEvent(
      Object.assign(new Event('inputsourceschange'), {
        added: [],
        removed: [controllerInputSource],
        session
      }) as XRInputSourcesChangeEvent
    );
    inputState = manager.getInputState(frame);
    testCase.equal(inputState?.length, 1, 'removed sources disappear from snapshots');
    testCase.equal(inputState?.[0]?.inputSource, screenInputSource, 'keeps remaining source');
    testCase.equal(inputState?.[0]?.selectActive, false, 'removed source cannot stay selected');
    testCase.equal(inputState?.[0]?.squeezeActive, false, 'removed source cannot stay squeezed');

    const foreignFrame = {
      session: makeMockXRSession(referenceSpace, []),
      getPose: () => undefined,
      getViewerPose: () => undefined
    } as XRFrame;
    testCase.throws(
      () => manager.getInputState(foreignFrame),
      /different XRSession/,
      'rejects foreign frames for input snapshots'
    );

    manager.clearSession();
    testCase.equal(manager.getInputState(frame), null, 'cleared sessions expose no inputs');
  } finally {
    globalThis.XRWebGLLayer = originalXRWebGLLayer;
  }

  testCase.end();
});

test('webxr#WebXRManager preserves shared WebGL framebuffers in a mocked Node session', async testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const session = makeMockXRSession(referenceSpace, []);
  const leftView = makeMockXRView('left', 0);
  const rightView = makeMockXRView('right', 1);
  const framebufferHandle = {} as WebGLFramebuffer;
  let compatibilityCallCount = 0;
  const gl = {
    async makeXRCompatible() {
      compatibilityCallCount++;
    }
  } as WebGL2RenderingContext;
  const device = {
    type: 'webgl',
    gl,
    createFramebuffer: (props: FramebufferProps) => makeMockFramebuffer(props)
  } as unknown as Device;
  const originalXRWebGLLayer = globalThis.XRWebGLLayer;

  globalThis.XRWebGLLayer = class {
    readonly framebuffer = framebufferHandle;
    readonly framebufferWidth = 64;
    readonly framebufferHeight = 32;

    getViewport(view: XRView): XRViewport {
      return {x: view.eye === 'left' ? 0 : 32, y: 0, width: 32, height: 32};
    }
  } as typeof XRWebGLLayer;

  try {
    const manager = new WebXRManager(device);
    await manager.setSession(session);
    const frameState = manager.getFrameState({
      session,
      getViewerPose: () => makeMockXRViewerPose([leftView, rightView])
    } as XRFrame);

    testCase.equal(compatibilityCallCount, 1, 'makes WebGL context XR compatible');
    testCase.equal(session.updatedBaseLayer, manager.baseLayer, 'retains legacy base layer setup');
    testCase.equal(session.updatedLayers, null, 'does not request WebGPU projection layers');
    testCase.equal(frameState?.framebuffer.props.handle, framebufferHandle, 'borrows native layer');
    testCase.equal(
      frameState?.views[0]?.framebuffer,
      frameState?.views[1]?.framebuffer,
      'both WebGL eyes still share the same framebuffer'
    );
    testCase.deepEqual(frameState?.views[1]?.viewport, [32, 0, 32, 32], 'keeps eye viewport');
    manager.destroy();
  } finally {
    globalThis.XRWebGLLayer = originalXRWebGLLayer;
  }

  testCase.end();
});

function makeMockWebGPUDevice(): MockWebGPUDevice {
  const createdTextures: MockTexture[] = [];
  const createdFramebuffers: MockFramebuffer[] = [];

  return {
    type: 'webgpu',
    handle: {} as GPUDevice,
    preferredColorFormat: 'rgba8unorm',
    preferredDepthFormat: 'depth24plus',
    createdTextures,
    createdFramebuffers,
    createTexture(props: TextureProps): MockTexture {
      const texture = {
        props,
        handle: props.handle,
        width: props.width,
        height: props.height,
        destroyCount: 0,
        destroy() {
          this.destroyCount++;
        }
      } as unknown as MockTexture;
      texture.view = {texture, props: props.view} as TextureView;
      createdTextures.push(texture);
      return texture;
    },
    createFramebuffer(props: FramebufferProps): MockFramebuffer {
      const framebuffer = makeMockFramebuffer(props);
      createdFramebuffers.push(framebuffer);
      return framebuffer;
    }
  } as MockWebGPUDevice;
}

function makeMockFramebuffer(props: FramebufferProps): MockFramebuffer {
  return {
    props,
    width: props.width,
    height: props.height,
    colorAttachments: props.colorAttachments || [],
    depthStencilAttachment: props.depthStencilAttachment || null,
    destroyCount: 0,
    destroy() {
      this.destroyCount++;
    }
  } as unknown as MockFramebuffer;
}

function makeMockTextureHandle(
  format: GPUTextureFormat,
  depthOrArrayLayers: number
): MockTextureHandle {
  return {
    label: '',
    format,
    width: 64,
    height: 32,
    depthOrArrayLayers,
    mipLevelCount: 1,
    sampleCount: 1,
    usage: 0x10,
    destroyCount: 0,
    createView() {
      return {} as GPUTextureView;
    },
    destroy() {
      this.destroyCount++;
      return undefined;
    }
  } as unknown as MockTextureHandle;
}

function makeMockXRProjectionLayer(props: {
  textureWidth: number;
  textureHeight: number;
  textureArrayLength: number;
  ignoreDepthValues: boolean;
  fixedFoveation?: number | null;
  deltaPose?: XRRigidTransform | null;
}): XRProjectionLayer {
  return Object.assign(new EventTarget(), {
    layout: 'stereo' as XRLayerLayout,
    blendTextureSourceAlpha: true,
    forceMonoPresentation: false,
    opacity: 1,
    mipLevels: 1,
    quality: 'default' as XRLayerQuality,
    needsRedraw: false,
    textureWidth: props.textureWidth,
    textureHeight: props.textureHeight,
    textureArrayLength: props.textureArrayLength,
    ignoreDepthValues: props.ignoreDepthValues,
    fixedFoveation: props.fixedFoveation ?? null,
    deltaPose: props.deltaPose ?? null,
    destroy() {}
  }) as XRProjectionLayer;
}

function makeMockXRSession(
  referenceSpace: XRReferenceSpace,
  enabledFeatures: readonly string[],
  inputSources: XRInputSource[] = [],
  props: {
    rejectedReferenceSpaceTypes?: readonly XRReferenceSpaceType[];
    referenceSpacesByType?: Partial<Record<XRReferenceSpaceType, XRReferenceSpace>>;
  } = {}
): MockXRSession {
  const rejectedReferenceSpaceTypes = new Set(props.rejectedReferenceSpaceTypes || []);
  const session = Object.assign(new EventTarget(), {
    enabledFeatures,
    inputSources,
    requestedReferenceSpaceTypes: [] as XRReferenceSpaceType[],
    updatedBaseLayer: null as XRWebGLLayer | null,
    updatedLayers: null as XRProjectionLayer[] | null,
    async updateRenderState(renderStateInit: XRRenderStateInit = {}) {
      session.updatedBaseLayer = renderStateInit.baseLayer || null;
      session.updatedLayers = renderStateInit.layers || null;
    },
    async requestReferenceSpace(type: XRReferenceSpaceType) {
      session.requestedReferenceSpaceTypes.push(type);
      if (rejectedReferenceSpaceTypes.has(type)) {
        throw new Error(`Unsupported reference space: ${type}`);
      }
      return props.referenceSpacesByType?.[type] || referenceSpace;
    }
  }) as MockXRSession;

  return session;
}

function makeMockXRView(eye: XREye, index: number): XRView {
  return {
    camera: null,
    eye,
    projectionMatrix: new Float32Array([index + 1]),
    transform: {inverse: {matrix: new Float32Array([index + 10])}}
  } as XRView;
}

function makeMockXRViewerPose(views: readonly XRView[]): XRViewerPose {
  return {
    transform: {
      position: {x: 1, y: 1.5, z: -2, w: 1} as DOMPointReadOnly,
      orientation: {x: 0, y: 0, z: 0, w: 1} as DOMPointReadOnly,
      matrix: new Float32Array([7]),
      inverse: {
        position: {x: -1, y: -1.5, z: 2, w: 1} as DOMPointReadOnly,
        orientation: {x: 0, y: 0, z: 0, w: 1} as DOMPointReadOnly,
        matrix: new Float32Array([8])
      } as XRRigidTransform
    } as XRRigidTransform,
    views
  } as XRViewerPose;
}

function makeMockXRInputSource(props: {
  handedness: XRHandedness;
  targetRayMode: XRTargetRayMode;
  targetRaySpace: XRSpace;
  gripSpace?: XRSpace;
  profiles: readonly string[];
  gamepad?: Gamepad;
}): XRInputSource {
  return props as XRInputSource;
}

function makeMockXRPose(matrix: number[]): XRPose {
  return {
    transform: {
      matrix: new Float32Array(matrix),
      inverse: {matrix: new Float32Array(matrix)}
    }
  } as XRPose;
}

function makeMockXRInputSourceEvent(
  type: 'selectstart' | 'selectend' | 'squeezestart' | 'squeezeend',
  inputSource: XRInputSource,
  frame: XRFrame
): XRInputSourceEvent {
  return Object.assign(new Event(type), {inputSource, frame}) as XRInputSourceEvent;
}
