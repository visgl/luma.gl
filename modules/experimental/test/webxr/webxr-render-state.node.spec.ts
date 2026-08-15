// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  WebXRRenderStateManager,
  getWebXRRenderStateInit,
  makeWebXRRenderState
} from '../../src/webxr/webxr-render-state';

type MockXRSession = XRSession & {
  renderState: XRRenderState;
  renderStateUpdates: XRRenderStateInit[];
};

test('webxr#WebXRRenderStateManager updates and snapshots render state', async testCase => {
  const baseLayer = {} as XRWebGLLayer;
  const layers = [{} as XRLayer];
  const session = makeMockXRSession({baseLayer, layers});
  const manager = new WebXRRenderStateManager({depthNear: 0.05, depthFar: 100});

  await manager.setSession(session);
  let renderState = manager.getRenderState();

  testCase.equal(manager.session, session, 'retains active session');
  testCase.deepEqual(
    session.renderStateUpdates,
    [{depthNear: 0.05, depthFar: 100}],
    'queues configured render-state update'
  );
  testCase.equal(renderState?.session, session, 'keeps session identity');
  testCase.equal(renderState?.depthNear, 0.05, 'snapshots depthNear');
  testCase.equal(renderState?.depthFar, 100, 'snapshots depthFar');
  testCase.equal(renderState?.inlineVerticalFieldOfView, null, 'keeps immersive inline FOV null');
  testCase.equal(renderState?.baseLayer, baseLayer, 'snapshots base layer');
  testCase.deepEqual(renderState?.layers, layers, 'snapshots layers');

  renderState = await manager.updateRenderState({inlineVerticalFieldOfView: Math.PI * 0.5});
  testCase.deepEqual(
    session.renderStateUpdates[1],
    {depthNear: 0.05, depthFar: 100, inlineVerticalFieldOfView: Math.PI * 0.5},
    'queues merged render-state props'
  );
  testCase.equal(
    renderState?.inlineVerticalFieldOfView,
    Math.PI * 0.5,
    'snapshots updated inline FOV'
  );

  session.dispatchEvent(new Event('end'));
  testCase.equal(manager.getRenderState(), null, 'ended sessions expose no render state');
  testCase.end();
});

test('webxr#WebXRRenderState helpers filter null values', async testCase => {
  const session = makeMockXRSession({});
  const manager = new WebXRRenderStateManager();

  testCase.deepEqual(
    getWebXRRenderStateInit({depthNear: 0.1, depthFar: null, inlineVerticalFieldOfView: undefined}),
    {depthNear: 0.1},
    'render-state init includes only defined values'
  );
  testCase.equal(
    await manager.updateRenderState({depthNear: 0.1}),
    null,
    'inactive updates return null'
  );

  await manager.setSession(session);
  testCase.deepEqual(session.renderStateUpdates, [], 'default props do not queue empty updates');
  testCase.deepEqual(makeWebXRRenderState(session), {
    session,
    depthNear: 0.1,
    depthFar: 1000,
    inlineVerticalFieldOfView: null,
    baseLayer: null,
    layers: []
  });

  manager.clearSession();
  testCase.equal(manager.session, null, 'clearSession is idempotent');
  testCase.end();
});

function makeMockXRSession(props: {
  baseLayer?: XRWebGLLayer;
  layers?: readonly XRLayer[];
}): MockXRSession {
  const session = Object.assign(new EventTarget(), {
    inputSources: [],
    renderState: {
      depthNear: 0.1,
      depthFar: 1000,
      inlineVerticalFieldOfView: null,
      baseLayer: props.baseLayer || null,
      layers: props.layers || []
    },
    renderStateUpdates: [] as XRRenderStateInit[],
    requestReferenceSpace: async () => ({}) as XRReferenceSpace,
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
    async end() {},
    async updateRenderState(renderStateInit: XRRenderStateInit = {}) {
      session.renderStateUpdates.push(renderStateInit);
      session.renderState = {...session.renderState, ...renderStateInit};
    }
  }) as MockXRSession;

  return session;
}
