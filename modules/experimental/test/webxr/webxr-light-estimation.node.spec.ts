// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Texture, TextureProps} from '@luma.gl/core';
import test from 'test/utils/vitest-tape';
import {
  getWebXRLightEstimationSessionInit,
  getWebXRReflectionTextureFormat,
  WebXRLightEstimationManager
} from '../../src/webxr/webxr-light-estimation';

type MockTexture = Texture & {
  destroyCount: number;
};

type MockTextureProps = TextureProps & {
  handle?: unknown;
  _isHandleBorrowed?: boolean;
};

test('webxr#WebXRLightEstimationManager resolves light estimates and probe poses', async testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const probeSpace = {} as XRSpace;
  const lightProbe = makeMockXRLightProbe(probeSpace);
  const requestLightProbeOptions: XRLightProbeInit[] = [];
  const session = makeMockXRSession({
    preferredReflectionFormat: 'rgba16f',
    async requestLightProbe(options?: XRLightProbeInit): Promise<XRLightProbe> {
      requestLightProbeOptions.push(options || {});
      return lightProbe;
    }
  });
  const estimate = makeMockXRLightEstimate({
    sphericalHarmonicsCoefficients: new Float32Array([1, 2, 3]),
    primaryLightDirection: makeMockDOMPoint(0.25, 0.5, -0.75),
    primaryLightIntensity: makeMockDOMPoint(1.5, 1.25, 1)
  });
  const pose = makeMockXRPose([1, 0, 0, 0]);
  let receivedProbe: XRLightProbe | undefined;
  let receivedProbeSpace: XRSpace | undefined;
  let receivedReferenceSpace: XRReferenceSpace | undefined;
  const frame = {
    session,
    getLightEstimate(xrLightProbe: XRLightProbe): XRLightEstimate | null {
      receivedProbe = xrLightProbe;
      return estimate;
    },
    getPose(space: XRSpace, baseSpace: XRSpace): XRPose | undefined {
      receivedProbeSpace = space;
      receivedReferenceSpace = baseSpace as XRReferenceSpace;
      return pose;
    }
  } as XRFrame;
  const manager = new WebXRLightEstimationManager({reflectionFormat: 'preferred'});

  await manager.setSession(session, referenceSpace);
  const lightState = manager.getLightEstimationState(frame);

  testCase.deepEqual(
    requestLightProbeOptions,
    [{reflectionFormat: 'rgba16f'}],
    'requests preferred reflection format'
  );
  testCase.equal(receivedProbe, lightProbe, 'queries the active light probe');
  testCase.equal(receivedProbeSpace, probeSpace, 'queries probe pose');
  testCase.equal(receivedReferenceSpace, referenceSpace, 'uses app reference space for probe pose');
  testCase.equal(lightState?.xrFrame, frame, 'retains source frame');
  testCase.equal(lightState?.session, session, 'retains source session');
  testCase.equal(lightState?.lightProbe, lightProbe, 'retains light probe');
  testCase.equal(lightState?.lightEstimate, estimate, 'retains light estimate');
  testCase.equal(lightState?.probePose, pose, 'retains probe pose');
  testCase.equal(lightState?.matrix, pose.transform.matrix, 'exposes pose matrix');
  testCase.equal(
    lightState?.sphericalHarmonicsCoefficients,
    estimate.sphericalHarmonicsCoefficients,
    'exposes spherical harmonics'
  );
  testCase.deepEqual(
    lightState?.primaryLightDirection,
    [0.25, 0.5, -0.75],
    'exposes primary light direction'
  );
  testCase.deepEqual(
    lightState?.primaryLightIntensity,
    [1.5, 1.25, 1],
    'exposes primary light intensity'
  );
  testCase.equal(lightState?.reflectionCubeMap, null, 'reflection map is optional');
  testCase.equal(lightState?.reflectionCubeMapTexture, null, 'does not invent texture wrappers');
  testCase.equal(lightState?.reflectionRevision, 0, 'starts at reflection revision zero');

  manager.destroy();
  testCase.end();
});

test('webxr#WebXRLightEstimationManager wraps reflection cube maps when size is supplied', async testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const lightProbe = makeMockXRLightProbe({} as XRSpace);
  const reflectionCubeMap = {} as WebGLTexture;
  const session = makeMockXRSession({
    async requestLightProbe(): Promise<XRLightProbe> {
      return lightProbe;
    }
  });
  const frame = {
    session,
    getLightEstimate(): XRLightEstimate | null {
      return makeMockXRLightEstimate({});
    },
    getPose(): XRPose | undefined {
      return undefined;
    }
  } as XRFrame;
  const device = makeMockDevice();
  const xrWebGLBinding = {
    getReflectionCubeMap(xrLightProbe: XRLightProbe): WebGLTexture | null {
      testCase.equal(xrLightProbe, lightProbe, 'queries reflection map for active probe');
      return reflectionCubeMap;
    }
  } as XRWebGLBinding;
  const manager = new WebXRLightEstimationManager({
    reflectionCubeMapSize: 64,
    reflectionFormat: 'rgba16f'
  });

  manager.setWebGLBinding(device, xrWebGLBinding);
  await manager.setSession(session, referenceSpace);
  lightProbe.dispatchEvent(new Event('reflectionchange'));
  const lightState = manager.getLightEstimationState(frame);
  const secondLightState = manager.getLightEstimationState(frame);
  const texture = lightState?.reflectionCubeMapTexture as MockTexture | null | undefined;
  const textureProps = texture?.props as MockTextureProps | undefined;

  testCase.equal(lightState?.reflectionCubeMap, reflectionCubeMap, 'exposes raw cubemap handle');
  testCase.equal(secondLightState?.reflectionCubeMapTexture, texture, 'reuses texture wrapper');
  testCase.equal(device.createdTextures.length, 1, 'creates one borrowed cubemap wrapper');
  testCase.equal(textureProps?.handle, reflectionCubeMap, 'wraps browser-owned cubemap handle');
  testCase.equal(textureProps?._isHandleBorrowed, true, 'marks cubemap handle borrowed');
  testCase.equal(textureProps?.dimension, 'cube', 'wraps as a cube texture');
  testCase.equal(textureProps?.width, 64, 'uses supplied cubemap size');
  testCase.equal(textureProps?.height, 64, 'uses supplied cubemap size');
  testCase.equal(textureProps?.depth, 6, 'exposes six cube faces');
  testCase.equal(textureProps?.format, 'rgba16float', 'maps rgba16f reflection format');
  testCase.equal(textureProps?.usage, 4, 'defaults to sampled texture usage');
  testCase.equal(lightState?.reflectionRevision, 1, 'tracks reflectionchange events');
  testCase.equal(texture?.destroyCount, 0, 'wrapper is live before cleanup');

  session.dispatchEvent(new Event('end'));
  testCase.equal(texture?.destroyCount, 1, 'session end destroys borrowed wrapper');
  testCase.equal(manager.session, null, 'session end clears active session');
  testCase.end();
});

test('webxr#WebXRLightEstimationManager handles unsupported sessions and helpers', async testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const session = makeMockXRSession({});
  const activeSession = makeMockXRSession({
    async requestLightProbe(): Promise<XRLightProbe> {
      return makeMockXRLightProbe({} as XRSpace);
    }
  });
  const manager = new WebXRLightEstimationManager();

  try {
    await manager.setSession(session, referenceSpace);
    testCase.fail('unsupported light probes should reject');
  } catch (error) {
    testCase.ok(/light-estimation probes/.test(String(error)), 'rejects unsupported sessions');
  }

  try {
    await manager.setSession(activeSession, null);
    testCase.fail('missing reference space should reject');
  } catch (error) {
    testCase.ok(
      /requires an app reference space/.test(String(error)),
      'rejects missing reference space'
    );
  }

  await manager.setSession(activeSession, referenceSpace);
  testCase.equal(
    manager.getLightEstimationState({session: activeSession} as XRFrame),
    null,
    'unsupported frames return null'
  );
  testCase.throws(
    () =>
      manager.getLightEstimationState({
        session,
        getLightEstimate(): XRLightEstimate | null {
          return makeMockXRLightEstimate({});
        }
      } as XRFrame),
    /different XRSession/,
    'rejects frames from a different session'
  );
  testCase.deepEqual(
    getWebXRLightEstimationSessionInit({required: true}),
    {requiredFeatures: ['light-estimation']},
    'builds required light-estimation session init'
  );
  testCase.deepEqual(
    getWebXRLightEstimationSessionInit(),
    {optionalFeatures: ['light-estimation']},
    'builds optional light-estimation session init'
  );
  testCase.equal(
    getWebXRReflectionTextureFormat('srgba8'),
    'rgba8unorm-srgb',
    'maps srgba8 reflections'
  );
  testCase.equal(
    getWebXRReflectionTextureFormat('rgba16f'),
    'rgba16float',
    'maps rgba16f reflections'
  );
  testCase.equal(
    getWebXRReflectionTextureFormat('preferred'),
    'rgba8unorm-srgb',
    'uses srgba8 metadata for unresolved preferred format'
  );

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

function makeMockXRLightProbe(probeSpace: XRSpace): XRLightProbe {
  return Object.assign(new EventTarget(), {
    probeSpace,
    onreflectionchange: null
  }) as XRLightProbe;
}

function makeMockXRLightEstimate(props: Partial<XRLightEstimate>): XRLightEstimate {
  return {
    sphericalHarmonicsCoefficients: props.sphericalHarmonicsCoefficients || new Float32Array(27),
    primaryLightDirection: props.primaryLightDirection || makeMockDOMPoint(0, 1, 0),
    primaryLightIntensity: props.primaryLightIntensity || makeMockDOMPoint(1, 1, 1)
  };
}

function makeMockXRPose(matrix: number[]): XRPose {
  return {
    transform: {
      matrix: new Float32Array(matrix),
      inverse: {matrix: new Float32Array(matrix)}
    } as XRRigidTransform
  } as XRPose;
}

function makeMockDOMPoint(x: number, y: number, z: number): DOMPointReadOnly {
  return {x, y, z, w: 1} as DOMPointReadOnly;
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
