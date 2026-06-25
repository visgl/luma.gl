// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {WebXRAnimationFrameProvider} from '../../src';

test('webxr#WebXRAnimationFrameProvider delegates to XRSession', t => {
  let scheduledCallback: XRFrameRequestCallback | null = null;
  let cancelledAnimationFrameId: number | null = null;
  const session = {
    requestAnimationFrame(callback: XRFrameRequestCallback) {
      scheduledCallback = callback;
      return 7;
    },
    cancelAnimationFrame(animationFrameId: number) {
      cancelledAnimationFrameId = animationFrameId;
    }
  } as XRSession;
  const animationFrameProvider = new WebXRAnimationFrameProvider(session);
  const callback = () => {};

  t.equal(animationFrameProvider.requestAnimationFrame(callback), 7, 'delegates frame request');
  t.ok(scheduledCallback, 'registers XR callback');
  animationFrameProvider.cancelAnimationFrame(7);
  t.equal(cancelledAnimationFrameId, 7, 'delegates frame cancellation');
  t.end();
});
