// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  WebXRSessionStateManager,
  getWebXRSessionRenderState,
  getWebXRSupportedFrameRates,
  getWebXRTargetFrameRate,
  makeWebXRSessionState
} from '../../src/webxr/webxr-session-state';

type MockXRSession = XRSession & {
  visibilityState: XRVisibilityState;
  frameRate: number;
  supportedFrameRates: Float32Array;
  updatedTargetFrameRates: number[];
};

test('webxr#WebXRSessionStateManager tracks visibility and frame-rate state', async testCase => {
  const session = makeMockXRSession({
    visibilityState: 'visible-blurred',
    frameRate: 72,
    supportedFrameRates: [72, 90, 120],
    isSystemKeyboardSupported: true
  });
  const manager = new WebXRSessionStateManager({targetFrameRate: 'highest'});

  await manager.setSession(session);
  let sessionState = manager.getSessionState();

  testCase.equal(manager.session, session, 'retains active session');
  testCase.deepEqual(session.updatedTargetFrameRates, [120], 'requests highest frame rate');
  testCase.equal(sessionState?.visibilityState, 'visible-blurred', 'keeps visibility state');
  testCase.equal(sessionState?.isVisible, true, 'visible-blurred sessions still render');
  testCase.equal(sessionState?.isFocused, false, 'visible-blurred sessions are not focused');
  testCase.equal(sessionState?.frameRate, 120, 'keeps current frame rate');
  testCase.deepEqual(
    sessionState?.supportedFrameRates,
    [72, 90, 120],
    'normalizes supported frame rates'
  );
  testCase.equal(
    sessionState?.isSystemKeyboardSupported,
    true,
    'keeps system-keyboard support state'
  );

  session.visibilityState = 'hidden';
  session.dispatchEvent(new Event('visibilitychange'));
  sessionState = manager.getSessionState();
  testCase.equal(sessionState?.isVisible, false, 'visibility changes update cached state');
  testCase.deepEqual(
    getWebXRSessionRenderState(sessionState),
    {isRenderable: false, acceptsInput: false, intensityScale: 0},
    'hidden sessions are not renderable or interactive'
  );

  await manager.updateTargetFrameRate(90);
  testCase.deepEqual(session.updatedTargetFrameRates, [120, 90], 'requests explicit frame rate');

  session.dispatchEvent(new Event('end'));
  testCase.equal(manager.getSessionState(), null, 'ended sessions expose no state');
  testCase.end();
});

test('webxr#getWebXRSessionRenderState maps visibility to render behavior', testCase => {
  const visibleSessionState = makeWebXRSessionState(
    makeMockXRSession({
      visibilityState: 'visible',
      frameRate: 90,
      supportedFrameRates: [90],
      isSystemKeyboardSupported: false
    })
  );
  const blurredSessionState = makeWebXRSessionState(
    makeMockXRSession({
      visibilityState: 'visible-blurred',
      frameRate: 90,
      supportedFrameRates: [90],
      isSystemKeyboardSupported: false
    })
  );
  const hiddenSessionState = makeWebXRSessionState(
    makeMockXRSession({
      visibilityState: 'hidden',
      frameRate: 90,
      supportedFrameRates: [90],
      isSystemKeyboardSupported: false
    })
  );

  testCase.deepEqual(
    getWebXRSessionRenderState(null),
    {isRenderable: true, acceptsInput: true, intensityScale: 1},
    'missing session state keeps non-XR rendering behavior enabled'
  );
  testCase.deepEqual(
    getWebXRSessionRenderState(visibleSessionState),
    {isRenderable: true, acceptsInput: true, intensityScale: 1},
    'focused visible sessions render normally'
  );
  testCase.deepEqual(
    getWebXRSessionRenderState(blurredSessionState),
    {isRenderable: true, acceptsInput: false, intensityScale: 0.62},
    'visible-blurred sessions render dimmed without accepting input'
  );
  testCase.deepEqual(
    getWebXRSessionRenderState(hiddenSessionState),
    {isRenderable: false, acceptsInput: false, intensityScale: 0},
    'hidden sessions do not render'
  );
  testCase.end();
});

test('webxr#WebXRSessionState helpers handle unsupported frame-rate controls', async testCase => {
  const session = Object.assign(new EventTarget(), {
    inputSources: [],
    visibilityState: 'visible',
    frameRate: undefined,
    supportedFrameRates: undefined,
    isSystemKeyboardSupported: undefined,
    requestReferenceSpace: async () => ({}) as XRReferenceSpace,
    updateRenderState: async () => {},
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
    end: async () => {}
  }) as unknown as XRSession;
  const manager = new WebXRSessionStateManager();

  await manager.setSession(session);

  testCase.deepEqual(getWebXRSupportedFrameRates(session), [], 'missing rates become empty list');
  testCase.equal(getWebXRTargetFrameRate(session, 'highest'), null, 'no highest rate is available');
  testCase.equal(getWebXRTargetFrameRate(session, 80), 80, 'explicit rates can be requested');
  testCase.equal(await manager.updateTargetFrameRate(80), null, 'missing updater returns null');
  testCase.deepEqual(makeWebXRSessionState(session), {
    session,
    visibilityState: 'visible',
    frameRate: null,
    supportedFrameRates: [],
    isVisible: true,
    isFocused: true,
    isSystemKeyboardSupported: null
  });
  manager.clearSession();
  testCase.equal(manager.session, null, 'clearSession is idempotent');
  testCase.end();
});

function makeMockXRSession(props: {
  visibilityState: XRVisibilityState;
  frameRate: number;
  supportedFrameRates: number[];
  isSystemKeyboardSupported: boolean;
}): MockXRSession {
  const session = Object.assign(new EventTarget(), {
    inputSources: [],
    visibilityState: props.visibilityState,
    frameRate: props.frameRate,
    supportedFrameRates: new Float32Array(props.supportedFrameRates),
    isSystemKeyboardSupported: props.isSystemKeyboardSupported,
    updatedTargetFrameRates: [] as number[],
    requestReferenceSpace: async () => ({}) as XRReferenceSpace,
    async updateRenderState() {},
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
    async end() {},
    async updateTargetFrameRate(frameRate: number) {
      session.updatedTargetFrameRates.push(frameRate);
      session.frameRate = frameRate;
      session.dispatchEvent(new Event('frameratechange'));
    }
  }) as MockXRSession;

  return session;
}
