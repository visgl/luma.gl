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
import {expect, it} from 'vitest';
import {WebXRManager} from '../../src/webxr/webxr-manager';

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
  updatedBaseLayer: XRWebGLLayer | null;
  updatedLayers: XRProjectionLayer[] | null;
};

it('webxr#WebXRManager resolves independent borrowed WebGPU stereo framebuffers', async () => {
  const device = makeMockWebGPUDevice();
  const referenceSpace = {} as XRReferenceSpace;
  const session = makeMockXRSession(referenceSpace, ['webgpu']);
  const leftView = makeMockXRView('left', 0);
  const rightView = makeMockXRView('right', 1);
  const projectionLayer = new EventTarget() as XRProjectionLayer;
  const colorTextureHandle = makeMockTextureHandle('bgra8unorm', 2);
  const depthTextureHandle = makeMockTextureHandle('depth24plus', 2);
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
      expect(receivedLayer, 'queries the configured projection layer').toBe(projectionLayer);
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
    const frame = {
      session,
      getViewerPose: () => ({views: activeViews})
    } as XRFrame;
    const frameState = manager.getFrameState(frame);

    expect(receivedBindingSession, 'binding receives the active XR session').toBe(session);
    expect(receivedBindingDevice, 'binding receives the native GPU device').toBe(device.handle);
    expect(
      receivedProjectionLayerInit,
      'projection layer uses preferred formats and caller options'
    ).toEqual({colorFormat: 'bgra8unorm', depthStencilFormat: 'depth24plus', scaleFactor: 0.8});
    expect(session.updatedLayers, 'installs a native projection layer').toEqual([projectionLayer]);
    expect(session.updatedBaseLayer, 'WebGPU does not install a legacy WebGL layer').toBe(null);
    expect(manager.baseLayer, 'legacy layer remains unset').toBe(null);
    expect(manager.projectionLayer, 'exposes the native projection layer').toBe(projectionLayer);
    expect(frameState?.views.length, 'resolves both stereo views').toBe(2);
    expect(frameState?.framebuffer, 'legacy frame framebuffer points to the first WebGPU eye').toBe(
      frameState?.views[0]?.framebuffer
    );
    expect(
      frameState?.views[0]?.framebuffer,
      'WebGPU eyes receive independently clearable framebuffers'
    ).not.toBe(frameState?.views[1]?.framebuffer);
    expect(frameState?.views[0]?.viewport, 'keeps left viewport').toEqual([0, 2, 30, 28]);
    expect(frameState?.views[1]?.viewport, 'keeps right viewport').toEqual([32, 2, 30, 28]);
    expect(frameState?.views[1]?.projectionMatrix, 'retains each eye projection matrix').toBe(
      rightView.projectionMatrix
    );
    expect(device.createdTextures.length, 'wraps both color and depth for each eye').toBe(4);
    expect(device.createdFramebuffers.length, 'creates one framebuffer per eye').toBe(2);
    expect(
      device.createdTextures.map(texture => texture.props.view?.baseArrayLayer),
      'color and depth views honor compositor-selected array layers'
    ).toEqual([0, 0, 1, 1]);
    expect(
      Boolean(device.createdTextures.every(texture => texture.props._isHandleBorrowed)),
      'every compositor texture handle is explicitly borrowed'
    ).toBe(true);
    expect(
      Boolean(
        device.createdTextures.every(
          texture =>
            texture.props.view?.dimension === '2d' && texture.props.view?.arrayLayerCount === 1
        )
      ),
      'array-backed stereo render attachments use single-layer 2D views'
    ).toBe(true);

    const repeatedFrameState = manager.getFrameState(frame);
    expect(device.createdTextures.length, 'reuses wrappers while native textures are stable').toBe(
      4
    );
    expect(repeatedFrameState?.views[1]?.framebuffer, 'reuses unchanged eye framebuffers').toBe(
      frameState?.views[1]?.framebuffer
    );

    activeViews = [leftView];
    manager.getFrameState(frame);
    expect(device.createdFramebuffers[1]?.destroyCount, 'releases removed eye framebuffer').toBe(1);
    expect(device.createdTextures[2]?.destroyCount, 'releases removed eye color wrapper').toBe(1);
    expect(device.createdTextures[3]?.destroyCount, 'releases removed eye depth wrapper').toBe(1);

    manager.destroy();
    manager.destroy();
    expect(device.createdFramebuffers[0]?.destroyCount, 'cleanup is idempotent').toBe(1);
    expect(colorTextureHandle.destroyCount, 'never destroys browser-owned color texture').toBe(0);
    expect(depthTextureHandle.destroyCount, 'never destroys browser-owned depth texture').toBe(0);
    expect(manager.projectionLayer, 'clears native projection layer').toBe(null);
    expect(manager.webGPUBinding, 'clears native GPU binding').toBe(null);
  } finally {
    globalThis.XRGPUBinding = originalXRGPUBinding;
  }

  void 0;
});

it('webxr#WebXRManager handles legacy image indices and rotating GPU compositor textures', async () => {
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
    const frame = {session, getViewerPose: () => ({views: [view]})} as XRFrame;
    const firstFrameState = manager.getFrameState(frame);

    expect(device.createdTextures.length, 'depth attachment remains optional').toBe(1);
    expect(
      device.createdTextures[0]?.props.view?.baseArrayLayer,
      'legacy image index selects the requested array slice'
    ).toBe(1);
    expect(
      firstFrameState?.views[0]?.framebuffer.depthStencilAttachment,
      'framebuffer does not synthesize browser-owned depth'
    ).toBe(null);

    activeTextureHandle = secondTextureHandle;
    activeImageIndex = 0;
    const secondFrameState = manager.getFrameState(frame);

    expect(
      secondFrameState?.views[0]?.framebuffer,
      'rotating native textures rebuild the eye framebuffer'
    ).not.toBe(firstFrameState?.views[0]?.framebuffer);
    expect(device.createdFramebuffers[0]?.destroyCount, 'releases obsolete framebuffer').toBe(1);
    expect(device.createdTextures[0]?.destroyCount, 'releases obsolete texture wrapper').toBe(1);
    expect(device.createdTextures[1]?.props.view?.baseArrayLayer, 'updates array slice').toBe(0);
    expect(firstTextureHandle.destroyCount, 'obsolete compositor texture remains borrowed').toBe(0);

    manager.clearSession();
    expect(secondTextureHandle.destroyCount, 'active compositor texture remains borrowed').toBe(0);
    expect(manager.getFrameState(frame), 'cleared session no longer resolves frames').toBe(null);
  } finally {
    globalThis.XRGPUBinding = originalXRGPUBinding;
  }

  void 0;
});

it('webxr#WebXRManager shares identical WebGPU atlas attachments across stereo eyes', async () => {
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
      getViewerPose: () => ({views: activeViews})
    } as XRFrame;
    const frameState = manager.getFrameState(frame);

    expect(device.createdTextures.length, 'wraps shared color and depth only once').toBe(2);
    expect(device.createdFramebuffers.length, 'deduplicates shared atlas framebuffer').toBe(1);
    expect(
      frameState?.views[0]?.framebuffer,
      'both atlas eyes expose identical framebuffer identity'
    ).toBe(frameState?.views[1]?.framebuffer);
    expect(frameState?.views[0]?.viewport, 'keeps left atlas viewport').toEqual([0, 0, 32, 32]);
    expect(frameState?.views[1]?.viewport, 'keeps right atlas viewport').toEqual([32, 0, 32, 32]);

    activeViews = [leftView];
    manager.getFrameState(frame);
    expect(
      device.createdFramebuffers[0]?.destroyCount,
      'remaining eye retains shared framebuffer when another eye disappears'
    ).toBe(0);

    manager.destroy();
    expect(device.createdFramebuffers[0]?.destroyCount, 'destroys shared wrapper once').toBe(1);
    expect(device.createdTextures[0]?.destroyCount, 'destroys shared color wrapper once').toBe(1);
    expect(device.createdTextures[1]?.destroyCount, 'destroys shared depth wrapper once').toBe(1);
    expect(colorTextureHandle.destroyCount, 'preserves browser-owned shared color texture').toBe(0);
    expect(depthTextureHandle.destroyCount, 'preserves browser-owned shared depth texture').toBe(0);
  } finally {
    globalThis.XRGPUBinding = originalXRGPUBinding;
  }

  void 0;
});

it('webxr#WebXRManager rejects unsupported WebGPU sessions and foreign frames', async () => {
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
      expect(false, 'session without the webgpu feature should be rejected').toBe(true);
    } catch (error) {
      expect(
        error instanceof Error ? error.message : '',
        'rejects sessions that did not negotiate WebGPU'
      ).toMatch(/webgpu feature/);
    }

    const session = makeMockXRSession(referenceSpace, ['webgpu']);
    await manager.setSession(session);
    const foreignSession = makeMockXRSession(referenceSpace, ['webgpu']);
    const foreignFrame = {
      session: foreignSession,
      getViewerPose: () => ({views: [makeMockXRView('left', 0)]})
    } as XRFrame;

    expect(
      () => manager.getFrameState(foreignFrame),
      'rejects a frame belonging to another session'
    ).toThrow(/different XRSession/);
    expect(
      manager.getFrameState({session, getViewerPose: () => undefined} as XRFrame),
      'missing viewer poses do not create attachments'
    ).toBe(null);
    manager.destroy();

    globalThis.XRGPUBinding = undefined as unknown as typeof XRGPUBinding;
    const unavailableManager = new WebXRManager(device);
    try {
      await unavailableManager.setSession(session);
      expect(false, 'missing WebGPU XR browser binding should be rejected').toBe(true);
    } catch (error) {
      expect(
        error instanceof Error ? error.message : '',
        'reports unavailable browser WebGPU XR support'
      ).toMatch(/not supported/);
    }
  } finally {
    globalThis.XRGPUBinding = originalXRGPUBinding;
  }

  void 0;
});

it('webxr#WebXRManager resolves input source poses and select activity', async () => {
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
        expect(baseSpace, 'queries poses in the manager reference space').toBe(referenceSpace);
        return poseBySpace.get(space);
      },
      getViewerPose: () => undefined
    } as XRFrame;
    let inputState = manager.getInputState(frame);

    expect(inputState?.length, 'reports every active input source').toBe(2);
    expect(inputState?.[0]?.inputSource, 'retains input identity').toBe(controllerInputSource);
    expect(inputState?.[0]?.handedness, 'keeps handedness').toBe('left');
    expect(inputState?.[0]?.targetRayMode, 'keeps target ray mode').toBe('tracked-pointer');
    expect(inputState?.[0]?.profiles, 'keeps profile order').toEqual([
      'oculus-touch-v3',
      'generic-trigger-squeeze-thumbstick'
    ]);
    expect(inputState?.[0]?.gamepad, 'keeps gamepad').toBe(controllerInputSource.gamepad);
    expect(inputState?.[0]?.targetRayPose, 'keeps target ray pose').toBe(targetRayPose);
    expect(inputState?.[0]?.targetRayMatrix, 'keeps ray').toBe(targetRayPose.transform.matrix);
    expect(inputState?.[0]?.gripPose, 'keeps grip pose').toBe(gripPose);
    expect(inputState?.[0]?.gripMatrix, 'keeps grip').toBe(gripPose.transform.matrix);
    expect(inputState?.[0]?.selectActive, 'select starts inactive').toBe(false);
    expect(inputState?.[0]?.squeezeActive, 'squeeze starts inactive').toBe(false);
    expect(inputState?.[1]?.targetRayPose, 'missing poses become null').toBe(null);
    expect(inputState?.[1]?.gripPose, 'missing grip spaces become null').toBe(null);

    session.dispatchEvent(makeMockXRInputSourceEvent('selectstart', controllerInputSource, frame));
    inputState = manager.getInputState(frame);
    expect(inputState?.[0]?.selectActive, 'selectstart marks the source active').toBe(true);
    expect(inputState?.[0]?.squeezeActive, 'select does not affect squeeze').toBe(false);

    session.dispatchEvent(makeMockXRInputSourceEvent('squeezestart', controllerInputSource, frame));
    inputState = manager.getInputState(frame);
    expect(inputState?.[0]?.squeezeActive, 'squeezestart marks the source active').toBe(true);
    expect(inputState?.[0]?.selectActive, 'squeeze does not affect select').toBe(true);

    session.dispatchEvent(makeMockXRInputSourceEvent('squeezeend', controllerInputSource, frame));
    inputState = manager.getInputState(frame);
    expect(inputState?.[0]?.squeezeActive, 'squeezeend marks the source inactive').toBe(false);

    session.dispatchEvent(makeMockXRInputSourceEvent('selectend', controllerInputSource, frame));
    inputState = manager.getInputState(frame);
    expect(inputState?.[0]?.selectActive, 'selectend marks the source inactive').toBe(false);

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
    expect(inputState?.length, 'removed sources disappear from snapshots').toBe(1);
    expect(inputState?.[0]?.inputSource, 'keeps remaining source').toBe(screenInputSource);
    expect(inputState?.[0]?.selectActive, 'removed source cannot stay selected').toBe(false);
    expect(inputState?.[0]?.squeezeActive, 'removed source cannot stay squeezed').toBe(false);

    const foreignFrame = {
      session: makeMockXRSession(referenceSpace, []),
      getPose: () => undefined,
      getViewerPose: () => undefined
    } as XRFrame;
    expect(
      () => manager.getInputState(foreignFrame),
      'rejects foreign frames for input snapshots'
    ).toThrow(/different XRSession/);

    manager.clearSession();
    expect(manager.getInputState(frame), 'cleared sessions expose no inputs').toBe(null);
  } finally {
    globalThis.XRWebGLLayer = originalXRWebGLLayer;
  }

  void 0;
});

it('webxr#WebXRManager preserves shared WebGL framebuffers in a mocked Node session', async () => {
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
      getViewerPose: () => ({views: [leftView, rightView]})
    } as XRFrame);

    expect(compatibilityCallCount, 'makes WebGL context XR compatible').toBe(1);
    expect(session.updatedBaseLayer, 'retains legacy base layer setup').toBe(manager.baseLayer);
    expect(session.updatedLayers, 'does not request WebGPU projection layers').toBe(null);
    expect(frameState?.framebuffer.props.handle, 'borrows native layer').toBe(framebufferHandle);
    expect(
      frameState?.views[0]?.framebuffer,
      'both WebGL eyes still share the same framebuffer'
    ).toBe(frameState?.views[1]?.framebuffer);
    expect(frameState?.views[1]?.viewport, 'keeps eye viewport').toEqual([32, 0, 32, 32]);
    manager.destroy();
  } finally {
    globalThis.XRWebGLLayer = originalXRWebGLLayer;
  }

  void 0;
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

function makeMockXRSession(
  referenceSpace: XRReferenceSpace,
  enabledFeatures: readonly string[],
  inputSources: XRInputSource[] = []
): MockXRSession {
  const session = Object.assign(new EventTarget(), {
    enabledFeatures,
    inputSources,
    updatedBaseLayer: null as XRWebGLLayer | null,
    updatedLayers: null as XRProjectionLayer[] | null,
    async updateRenderState(renderStateInit: XRRenderStateInit = {}) {
      session.updatedBaseLayer = renderStateInit.baseLayer || null;
      session.updatedLayers = renderStateInit.layers || null;
    },
    async requestReferenceSpace() {
      return referenceSpace;
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
