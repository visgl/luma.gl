// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Texture, TextureProps} from '@luma.gl/core';
import test from 'test/utils/vitest-tape';
import {
  getWebXRDepthSensingSessionInit,
  getWebXRDepthTextureFormat,
  WebXRDepthSensingManager
} from '../../src/webxr/webxr-depth-sensing';

type MockTexture = Texture & {
  destroyCount: number;
};

type MockTextureProps = TextureProps & {
  handle?: unknown;
  _isHandleBorrowed?: boolean;
};

test('webxr#WebXRDepthSensingManager resolves CPU depth information', testCase => {
  const session = makeMockXRSession({depthActive: true, depthDataFormat: 'luminance-alpha'});
  const xrView = makeMockXRView();
  const emptyView = makeMockXRView();
  const depthInformation = makeMockCPUDepthInformation({
    width: 3,
    height: 2,
    rawValueToMeters: 0.01
  });
  let receivedView: XRView | undefined;
  const frame = {
    session,
    getDepthInformation(view: XRView): XRCPUDepthInformation | null {
      receivedView = view;
      return view === xrView ? depthInformation : null;
    }
  } as XRFrame;
  const manager = new WebXRDepthSensingManager();

  manager.setSession(session);
  const depthState = manager.getDepthState(frame, [xrView, emptyView]);

  testCase.equal(receivedView, emptyView, 'queries supplied views');
  testCase.equal(depthState?.xrFrame, frame, 'retains source frame');
  testCase.equal(depthState?.session, session, 'retains source session');
  testCase.equal(depthState?.views.length, 1, 'filters views without depth information');
  testCase.equal(depthState?.views[0]?.xrView, xrView, 'retains XR view');
  testCase.equal(
    depthState?.views[0]?.depthInformation,
    depthInformation,
    'retains depth information'
  );
  testCase.equal(
    depthState?.views[0]?.cpuDepthInformation,
    depthInformation,
    'retains CPU depth information'
  );
  testCase.equal(depthState?.views[0]?.webGLDepthInformation, null, 'does not invent WebGL depth');
  testCase.equal(depthState?.views[0]?.texture, null, 'CPU depth does not create a texture');
  testCase.equal(depthState?.views[0]?.width, 3, 'exposes depth width');
  testCase.equal(depthState?.views[0]?.height, 2, 'exposes depth height');
  testCase.equal(depthState?.views[0]?.rawValueToMeters, 0.01, 'exposes raw meter scale');
  testCase.equal(
    depthState?.views[0]?.matrix,
    depthInformation.normDepthBufferFromNormView.matrix,
    'exposes UV transform matrix'
  );

  manager.destroy();
  testCase.end();
});

test('webxr#WebXRDepthSensingManager wraps borrowed WebGL depth textures', testCase => {
  const session = makeMockXRSession({depthActive: true, depthDataFormat: 'float32'});
  const xrView = makeMockXRView();
  const textureHandle = {} as WebGLTexture;
  const depthInformation = makeMockWebGLDepthInformation({
    texture: textureHandle,
    textureType: 0x8c1a,
    imageIndex: 2,
    width: 5,
    height: 4
  });
  const device = makeMockDevice();
  const xrWebGLBinding = {
    getDepthInformation(view: XRView): XRWebGLDepthInformation | null {
      testCase.equal(view, xrView, 'queries depth for supplied view');
      return depthInformation;
    }
  } as XRWebGLBinding;
  const frame = {
    session
  } as XRFrame;
  const manager = new WebXRDepthSensingManager();

  manager.setWebGLBinding(device, xrWebGLBinding);
  manager.setSession(session);
  const depthState = manager.getDepthState(frame, [xrView]);
  const texture = depthState?.views[0]?.texture as MockTexture | null | undefined;
  const textureProps = texture?.props as MockTextureProps | undefined;
  const secondDepthState = manager.getDepthState(frame, [xrView]);

  testCase.equal(depthState?.views.length, 1, 'resolves WebGL depth view');
  testCase.equal(
    depthState?.views[0]?.webGLDepthInformation,
    depthInformation,
    'retains WebGL depth'
  );
  testCase.equal(depthState?.views[0]?.cpuDepthInformation, null, 'does not invent CPU depth');
  testCase.equal(depthState?.views[0]?.texture, texture, 'exposes borrowed luma texture');
  testCase.equal(secondDepthState?.views[0]?.texture, texture, 'reuses texture wrapper');
  testCase.equal(device.createdTextures.length, 1, 'creates one borrowed texture wrapper');
  testCase.equal(textureProps?.handle, textureHandle, 'wraps browser-owned depth texture handle');
  testCase.equal(textureProps?._isHandleBorrowed, true, 'marks depth texture handle borrowed');
  testCase.equal(textureProps?.dimension, '2d-array', 'preserves texture-array depth metadata');
  testCase.equal(textureProps?.depth, 3, 'uses image index to expose minimum array depth');
  testCase.equal(textureProps?.format, 'r32float', 'maps selected XR depth data format');
  testCase.equal(textureProps?.usage, 4, 'defaults to sampled texture usage');
  testCase.equal(texture?.destroyCount, 0, 'wrapper is live before cleanup');

  session.dispatchEvent(new Event('end'));
  testCase.equal(texture?.destroyCount, 1, 'session end destroys borrowed wrapper');
  testCase.equal(manager.session, null, 'session end clears active session');
  testCase.end();
});

test('webxr#WebXRDepthSensingManager handles unsupported sessions and helpers', testCase => {
  const session = makeMockXRSession({depthActive: false});
  const activeSession = makeMockXRSession({depthActive: true});
  const xrView = makeMockXRView();
  const manager = new WebXRDepthSensingManager();

  manager.setSession(session);
  testCase.equal(
    manager.getDepthState({session} as XRFrame, [xrView]),
    null,
    'paused depth sensing returns null'
  );

  manager.setSession(activeSession);
  testCase.equal(
    manager.getDepthState({session: activeSession} as XRFrame, [xrView]),
    null,
    'unsupported frames return null'
  );
  testCase.throws(
    () => manager.getDepthState({session: session as XRSession} as XRFrame, [xrView]),
    /different XRSession/,
    'rejects frames from a different session'
  );

  testCase.deepEqual(
    getWebXRDepthSensingSessionInit({required: true, usagePreference: ['gpu-optimized']}),
    {
      requiredFeatures: ['depth-sensing'],
      depthSensing: {
        usagePreference: ['gpu-optimized'],
        dataFormatPreference: ['luminance-alpha', 'float32', 'unsigned-short'],
        depthTypeRequest: undefined,
        matchDepthView: undefined
      }
    },
    'builds required depth-sensing session init'
  );
  testCase.equal(
    getWebXRDepthTextureFormat('luminance-alpha'),
    'rg8unorm',
    'maps luminance-alpha depth'
  );
  testCase.equal(getWebXRDepthTextureFormat('float32'), 'r32float', 'maps float depth');
  testCase.equal(getWebXRDepthTextureFormat('unsigned-short'), 'r16uint', 'maps uint depth');

  manager.clearSession();
  manager.clearSession();
  testCase.equal(manager.session, null, 'clearSession is idempotent');
  testCase.end();
});

function makeMockXRSession(props: Partial<XRSession>): XRSession {
  return Object.assign(new EventTarget(), {
    inputSources: [],
    ...props
  }) as XRSession;
}

function makeMockXRView(): XRView {
  return {
    eye: 'none',
    projectionMatrix: new Float32Array(16),
    transform: makeMockXRRigidTransform([1])
  } as XRView;
}

function makeMockCPUDepthInformation(options: {
  width: number;
  height: number;
  rawValueToMeters: number;
}): XRCPUDepthInformation {
  return {
    width: options.width,
    height: options.height,
    rawValueToMeters: options.rawValueToMeters,
    normDepthBufferFromNormView: makeMockXRRigidTransform([1, 0, 0, 0]),
    data: new ArrayBuffer(options.width * options.height * 2),
    getDepthInMeters: () => 1.5
  } as XRCPUDepthInformation;
}

function makeMockWebGLDepthInformation(
  options: Partial<XRWebGLDepthInformation> & {texture: WebGLTexture}
): XRWebGLDepthInformation {
  return {
    width: options.width ?? 2,
    height: options.height ?? 2,
    rawValueToMeters: options.rawValueToMeters ?? 0.001,
    normDepthBufferFromNormView: makeMockXRRigidTransform([1, 0, 0, 0]),
    texture: options.texture,
    textureType: options.textureType ?? 0x0de1,
    imageIndex: options.imageIndex
  } as XRWebGLDepthInformation;
}

function makeMockXRRigidTransform(matrix: number[]): XRRigidTransform {
  return {
    matrix: new Float32Array(matrix),
    inverse: {matrix: new Float32Array(matrix)}
  } as XRRigidTransform;
}

function makeMockDevice(): Device & {createdTextures: MockTexture[]} {
  const createdTextures: MockTexture[] = [];
  return {
    type: 'webgl',
    createdTextures,
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
      createdTextures.push(texture);
      return texture;
    }
  } as Device & {createdTextures: MockTexture[]};
}
