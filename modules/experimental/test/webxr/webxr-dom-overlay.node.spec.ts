// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  getWebXRDOMOverlaySessionInit,
  WebXRDOMOverlayManager
} from '../../src/webxr/webxr-dom-overlay';

test('webxr#WebXRDOMOverlayManager resolves overlay state and suppresses XR select', testCase => {
  const root = new EventTarget() as Element;
  const session = makeMockXRSession({domOverlayState: {type: 'screen'}});
  const manager = new WebXRDOMOverlayManager({root});

  manager.setSession(session);
  const overlayState = manager.getOverlayState();
  const beforeXRSelectEvent = new Event('beforexrselect', {cancelable: true});
  root.dispatchEvent(beforeXRSelectEvent);

  testCase.equal(overlayState?.session, session, 'retains source session');
  testCase.equal(overlayState?.root, root, 'retains overlay root');
  testCase.equal(overlayState?.type, 'screen', 'reports overlay type');
  testCase.equal(beforeXRSelectEvent.defaultPrevented, true, 'suppresses overlay select events');

  session.dispatchEvent(new Event('end'));
  testCase.equal(manager.session, null, 'session end clears session');
  testCase.equal(manager.root, null, 'session end clears root');

  const detachedEvent = new Event('beforexrselect', {cancelable: true});
  root.dispatchEvent(detachedEvent);
  testCase.equal(detachedEvent.defaultPrevented, false, 'cleanup removes overlay listener');
  testCase.end();
});

test('webxr#WebXRDOMOverlayManager handles disabled and unsupported overlays', testCase => {
  const root = new EventTarget() as Element;
  const session = makeMockXRSession({domOverlayState: null});
  const manager = new WebXRDOMOverlayManager({root, suppressXRSelectEvents: false});

  testCase.equal(manager.getOverlayState(), null, 'inactive manager returns null');

  manager.setSession(session);
  const beforeXRSelectEvent = new Event('beforexrselect', {cancelable: true});
  root.dispatchEvent(beforeXRSelectEvent);

  testCase.equal(manager.getOverlayState(), null, 'unsupported overlay returns null');
  testCase.equal(beforeXRSelectEvent.defaultPrevented, false, 'suppression can be disabled');

  manager.clearSession();
  manager.clearSession();
  testCase.equal(manager.session, null, 'clearSession is idempotent');
  testCase.end();
});

test('webxr#getWebXRDOMOverlaySessionInit creates optional and required feature init', testCase => {
  const root = new EventTarget() as Element;

  testCase.deepEqual(
    getWebXRDOMOverlaySessionInit(root),
    {
      optionalFeatures: ['dom-overlay'],
      domOverlay: {root}
    },
    'creates optional DOM overlay init'
  );
  testCase.deepEqual(
    getWebXRDOMOverlaySessionInit(root, {required: true}),
    {
      requiredFeatures: ['dom-overlay'],
      domOverlay: {root}
    },
    'creates required DOM overlay init'
  );
  testCase.end();
});

function makeMockXRSession(props: Partial<XRSession>): XRSession {
  return Object.assign(new EventTarget(), {
    inputSources: [],
    ...props
  }) as XRSession;
}
