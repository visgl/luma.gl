// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Framebuffer, FramebufferProps, Texture, TextureProps} from '@luma.gl/core';
import test from 'test/utils/vitest-tape';
import {
  getWebXRCompositionLayerControls,
  getWebXRLayersSessionInit,
  setWebXRCompositionLayerControls,
  WebXRCompositionLayerManager
} from '../../src/webxr/webxr-layers';

type MockFramebuffer = Framebuffer & {
  destroyCount: number;
};

type MockTexture = Texture & {
  destroyCount: number;
};

type MockTextureProps = TextureProps & {
  handle?: unknown;
  _isHandleBorrowed?: boolean;
};

type MockXRCompositionLayer = XRCompositionLayer & {
  destroyCount: number;
};

test('webxr#WebXRCompositionLayerManager creates quad layers and resolves subimages', async testCase => {
  const originalXRWebGLBinding = globalThis.XRWebGLBinding;
  const session = makeMockXRSession();
  const device = makeMockDevice();
  const xrSpace = {} as XRSpace;
  const colorTextureHandle = {} as WebGLTexture;
  const depthStencilTextureHandle = {} as WebGLTexture;
  const subImage = makeMockXRWebGLSubImage({
    colorTexture: colorTextureHandle,
    depthStencilTexture: depthStencilTextureHandle,
    imageIndex: 2,
    colorTextureWidth: 512,
    colorTextureHeight: 256,
    depthStencilTextureWidth: 512,
    depthStencilTextureHeight: 256
  });
  const frame = {session} as XRFrame;

  globalThis.XRWebGLBinding = makeMockXRWebGLBindingClass(subImage);

  try {
    const manager = new WebXRCompositionLayerManager(device);
    await manager.setSession(session);
    const layer = manager.createQuadLayer({
      space: xrSpace,
      viewPixelWidth: 512,
      viewPixelHeight: 256,
      width: 1.5,
      height: 0.75
    });
    await manager.updateRenderState([layer]);

    const state = manager.getLayerState(frame, layer);
    const secondState = manager.getLayerState(frame, layer);
    const colorTexture = state?.colorTexture as MockTexture | null | undefined;
    const depthStencilTexture = state?.depthStencilTexture as MockTexture | null | undefined;
    const colorTextureProps = colorTexture?.props as MockTextureProps | undefined;
    const depthStencilTextureProps = depthStencilTexture?.props as MockTextureProps | undefined;

    testCase.equal(device.compatibilityCallCount, 1, 'makes WebGL context XR compatible');
    testCase.equal(session.updatedLayers[0], layer, 'updates render state with layer');
    testCase.equal(state?.session, session, 'retains source session');
    testCase.equal(state?.xrFrame, frame, 'retains source frame');
    testCase.equal(state?.layer, layer, 'retains composition layer');
    testCase.deepEqual(
      state?.controls,
      getWebXRCompositionLayerControls(layer),
      'exposes common layer controls'
    );
    testCase.equal(state?.subImage, subImage, 'retains source subimage');
    testCase.deepEqual(state?.viewport, [4, 8, 128, 64], 'exposes subimage viewport');
    testCase.equal(state?.layout, 'mono', 'exposes layer layout');
    testCase.equal(state?.imageIndex, 2, 'exposes texture-array image index');
    testCase.equal(secondState?.framebuffer, state?.framebuffer, 'reuses stable framebuffer');
    testCase.equal(secondState?.colorTexture, state?.colorTexture, 'reuses stable color texture');
    testCase.equal(device.createdTextures.length, 2, 'wraps color and depth textures once');
    testCase.equal(device.createdFramebuffers.length, 1, 'creates one framebuffer');
    testCase.equal(
      colorTextureProps?.handle,
      colorTextureHandle,
      'wraps browser-owned color texture'
    );
    testCase.equal(
      depthStencilTextureProps?.handle,
      depthStencilTextureHandle,
      'wraps browser-owned depth texture'
    );
    testCase.equal(colorTextureProps?._isHandleBorrowed, true, 'marks color texture borrowed');
    testCase.equal(
      depthStencilTextureProps?._isHandleBorrowed,
      true,
      'marks depth texture borrowed'
    );
    testCase.equal(colorTextureProps?.dimension, '2d-array', 'uses array texture for image index');
    testCase.equal(colorTextureProps?.depth, 3, 'exposes minimum array depth');
    testCase.equal(state?.framebuffer.colorAttachments[0], colorTexture?.view, 'binds color view');
    testCase.equal(
      state?.framebuffer.depthStencilAttachment,
      depthStencilTexture?.view,
      'binds depth view'
    );

    layer.dispatchEvent(new Event('redraw'));
    testCase.equal(manager.getLayerState(frame, layer)?.needsRedraw, true, 'tracks redraw events');
    testCase.equal(
      manager.getLayerState(frame, layer)?.needsRedraw,
      false,
      'redraw event is consumed once'
    );

    session.dispatchEvent(new Event('end'));
    testCase.equal(colorTexture?.destroyCount, 1, 'session end destroys color wrapper');
    testCase.equal(depthStencilTexture?.destroyCount, 1, 'session end destroys depth wrapper');
    testCase.equal(
      (state?.framebuffer as MockFramebuffer | undefined)?.destroyCount,
      1,
      'session end destroys framebuffer'
    );
    testCase.equal(manager.session, null, 'session end clears active session');
  } finally {
    globalThis.XRWebGLBinding = originalXRWebGLBinding;
  }

  testCase.end();
});

test('webxr#WebXRCompositionLayerManager handles cylinder layers and helpers', async testCase => {
  const originalXRWebGLBinding = globalThis.XRWebGLBinding;
  const session = makeMockXRSession();
  const device = makeMockDevice();
  const xrSpace = {} as XRSpace;
  const subImage = makeMockXRWebGLSubImage({
    colorTexture: {} as WebGLTexture,
    depthStencilTexture: null,
    imageIndex: undefined
  });

  globalThis.XRWebGLBinding = makeMockXRWebGLBindingClass(subImage);

  try {
    const manager = new WebXRCompositionLayerManager(device, {
      colorTextureFormat: 'rgba16float'
    });
    await manager.setSession(session);
    const layer = manager.createCylinderLayer({
      space: xrSpace,
      viewPixelWidth: 1024,
      viewPixelHeight: 512,
      radius: 2,
      centralAngle: Math.PI / 3,
      aspectRatio: 2
    });
    const state = manager.getLayerState({session} as XRFrame, layer, 'left');
    const textureProps = state?.colorTexture.props as MockTextureProps | undefined;
    const controls = manager.setLayerControls(layer, {
      blendTextureSourceAlpha: false,
      forceMonoPresentation: true,
      opacity: 0.42,
      quality: 'text-optimized'
    });

    testCase.equal(state?.eye, 'left', 'retains requested eye');
    testCase.deepEqual(
      controls,
      {
        layer,
        blendTextureSourceAlpha: false,
        forceMonoPresentation: true,
        opacity: 0.42,
        mipLevels: 1,
        quality: 'text-optimized',
        needsRedraw: false
      },
      'updates and snapshots common layer controls'
    );
    layer.dispatchEvent(new Event('redraw'));
    testCase.equal(
      manager.getLayerControls(layer).needsRedraw,
      true,
      'controls include redraw state'
    );
    testCase.equal(state?.depthStencilTexture, null, 'depth texture is optional');
    testCase.equal(textureProps?.dimension, '2d', 'uses 2d texture without image index');
    testCase.equal(textureProps?.format, 'rgba16float', 'uses configured color texture format');
    testCase.throws(
      () => manager.getLayerState({session: makeMockXRSession()} as XRFrame, layer),
      /different XRSession/,
      'rejects frames from another session'
    );
    manager.destroyLayer(layer);
    testCase.equal((layer as MockXRCompositionLayer).destroyCount, 1, 'destroys tracked layer');
    testCase.equal(
      (state?.colorTexture as MockTexture | undefined)?.destroyCount,
      1,
      'destroys layer color wrapper'
    );
  } finally {
    globalThis.XRWebGLBinding = originalXRWebGLBinding;
  }

  testCase.deepEqual(
    getWebXRLayersSessionInit(),
    {optionalFeatures: ['layers']},
    'creates optional layers session init'
  );
  testCase.deepEqual(
    getWebXRLayersSessionInit({required: true}),
    {requiredFeatures: ['layers']},
    'creates required layers session init'
  );
  const standaloneLayer = makeMockCompositionLayer('mono', {
    viewPixelWidth: 1,
    viewPixelHeight: 1
  } as XRQuadLayerInit);
  testCase.equal(
    setWebXRCompositionLayerControls(standaloneLayer, {opacity: 0.75}).opacity,
    0.75,
    'standalone helper updates common controls'
  );
  testCase.end();
});

test('webxr#WebXRCompositionLayerManager handles equirect and cube layers', async testCase => {
  const originalXRWebGLBinding = globalThis.XRWebGLBinding;
  const session = makeMockXRSession();
  const device = makeMockDevice();
  const referenceSpace = {} as XRReferenceSpace;
  const orientation = {x: 0, y: 0, z: 0, w: 1} as DOMPointReadOnly;
  const subImage = makeMockXRWebGLSubImage({
    colorTexture: {} as WebGLTexture,
    depthStencilTexture: null,
    imageIndex: undefined,
    colorTextureWidth: 2048,
    colorTextureHeight: 1024
  });

  globalThis.XRWebGLBinding = makeMockXRWebGLBindingClass(subImage);

  try {
    const manager = new WebXRCompositionLayerManager(device);
    await manager.setSession(session);
    const equirectLayer = manager.createEquirectLayer({
      space: referenceSpace,
      viewPixelWidth: 2048,
      viewPixelHeight: 1024,
      radius: 0,
      centralHorizontalAngle: Math.PI * 2,
      upperVerticalAngle: Math.PI / 2,
      lowerVerticalAngle: -Math.PI / 2
    });
    const cubeLayer = manager.createCubeLayer({
      space: referenceSpace,
      viewPixelWidth: 1024,
      viewPixelHeight: 1024,
      orientation
    });
    await manager.updateRenderState([equirectLayer, cubeLayer]);

    const equirectState = manager.getLayerState({session} as XRFrame, equirectLayer);
    const cubeState = manager.getLayerState({session} as XRFrame, cubeLayer);

    testCase.equal(session.updatedLayers[0], equirectLayer, 'updates render state with equirect');
    testCase.equal(session.updatedLayers[1], cubeLayer, 'updates render state with cube');
    testCase.equal(equirectState?.layer, equirectLayer, 'resolves equirect subimage state');
    testCase.equal(cubeState?.layer, cubeLayer, 'resolves cube subimage state');
    testCase.equal(equirectState?.colorTexture.width, 2048, 'uses equirect subimage width');
    testCase.equal(equirectState?.colorTexture.height, 1024, 'uses equirect subimage height');
    testCase.equal((cubeLayer as XRCubeLayer).orientation, orientation, 'retains cube orientation');
  } finally {
    globalThis.XRWebGLBinding = originalXRWebGLBinding;
  }

  testCase.end();
});

function makeMockDevice(): Device & {
  compatibilityCallCount: number;
  createdFramebuffers: MockFramebuffer[];
  createdTextures: MockTexture[];
  gl: WebGL2RenderingContext & {makeXRCompatible(): Promise<void>};
} {
  const createdFramebuffers: MockFramebuffer[] = [];
  const createdTextures: MockTexture[] = [];
  const device = {
    type: 'webgl',
    compatibilityCallCount: 0,
    createdFramebuffers,
    createdTextures,
    gl: {
      async makeXRCompatible(): Promise<void> {
        device.compatibilityCallCount++;
      }
    },
    createFramebuffer(props: FramebufferProps): MockFramebuffer {
      const framebuffer = {
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
      createdFramebuffers.push(framebuffer);
      return framebuffer;
    },
    createTexture(props: TextureProps): MockTexture {
      const texture = {
        props,
        width: props.width,
        height: props.height,
        destroyCount: 0,
        destroy() {
          this.destroyCount++;
        }
      } as unknown as MockTexture;
      texture.view = {texture, props: props.view} as Texture['view'];
      createdTextures.push(texture);
      return texture;
    }
  } as Device & {
    compatibilityCallCount: number;
    createdFramebuffers: MockFramebuffer[];
    createdTextures: MockTexture[];
    gl: WebGL2RenderingContext & {makeXRCompatible(): Promise<void>};
  };

  return device;
}

function makeMockXRSession(): XRSession & {updatedLayers: XRLayer[]} {
  return Object.assign(new EventTarget(), {
    inputSources: [],
    updatedLayers: [] as XRLayer[],
    async updateRenderState(renderStateInit: XRRenderStateInit = {}) {
      this.updatedLayers = [...(renderStateInit.layers || [])];
    }
  }) as XRSession & {updatedLayers: XRLayer[]};
}

function makeMockXRWebGLBindingClass(subImage: XRWebGLSubImage): typeof XRWebGLBinding {
  return class MockXRWebGLBinding {
    constructor(
      public session: XRSession,
      public context: WebGLRenderingContext | WebGL2RenderingContext
    ) {}

    createQuadLayer(init: XRQuadLayerInit): XRQuadLayer {
      return makeMockCompositionLayer('mono', init) as XRQuadLayer;
    }

    createCylinderLayer(init: XRCylinderLayerInit): XRCylinderLayer {
      return makeMockCompositionLayer('mono', init) as XRCylinderLayer;
    }

    createEquirectLayer(init: XREquirectLayerInit): XREquirectLayer {
      return makeMockCompositionLayer('mono', init) as XREquirectLayer;
    }

    createCubeLayer(init: XRCubeLayerInit): XRCubeLayer {
      return Object.assign(makeMockCompositionLayer('mono', init), {
        orientation: init.orientation || null
      }) as XRCubeLayer;
    }

    getSubImage(): XRWebGLSubImage {
      return subImage;
    }
  } as unknown as typeof XRWebGLBinding;
}

function makeMockCompositionLayer(
  layout: XRLayerLayout,
  init: XRQuadLayerInit | XRCylinderLayerInit | XREquirectLayerInit | XRCubeLayerInit
): MockXRCompositionLayer {
  return Object.assign(new EventTarget(), {
    layout,
    blendTextureSourceAlpha: true,
    forceMonoPresentation: false,
    opacity: 1,
    mipLevels: init.mipLevels || 1,
    quality: 'default' as XRLayerQuality,
    needsRedraw: false,
    destroyCount: 0,
    space: init.space,
    transform: init.transform,
    destroy() {
      this.destroyCount++;
    }
  }) as MockXRCompositionLayer;
}

function makeMockXRWebGLSubImage(
  props: Partial<XRWebGLSubImage> & {colorTexture: WebGLTexture}
): XRWebGLSubImage {
  return {
    colorTexture: props.colorTexture,
    depthStencilTexture: props.depthStencilTexture === undefined ? null : props.depthStencilTexture,
    motionVectorTexture: props.motionVectorTexture || null,
    imageIndex: props.imageIndex,
    colorTextureWidth: props.colorTextureWidth || 256,
    colorTextureHeight: props.colorTextureHeight || 128,
    depthStencilTextureWidth: props.depthStencilTextureWidth,
    depthStencilTextureHeight: props.depthStencilTextureHeight,
    viewport: props.viewport || {x: 4, y: 8, width: 128, height: 64}
  } as XRWebGLSubImage;
}
