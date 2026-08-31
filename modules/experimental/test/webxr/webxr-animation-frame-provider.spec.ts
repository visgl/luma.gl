// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {WebXRAnimationFrameProvider} from '../../src';

it('webxr#WebXRAnimationFrameProvider delegates to XRSession', () => {
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

  expect(animationFrameProvider.requestAnimationFrame(callback), 'delegates frame request').toBe(7);
  expect(Boolean(scheduledCallback), 'registers XR callback').toBe(true);
  animationFrameProvider.cancelAnimationFrame(7);
  expect(cancelledAnimationFrameId, 'delegates frame cancellation').toBe(7);
  void 0;
});
