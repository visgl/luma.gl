// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationFrameCallback, AnimationFrameProvider} from '@luma.gl/engine';

/** Experimental v10 XRSession-backed animation frame source. */
export class WebXRAnimationFrameProvider implements AnimationFrameProvider {
  readonly session: XRSession;

  constructor(session: XRSession) {
    this.session = session;
  }

  requestAnimationFrame(callback: AnimationFrameCallback): number {
    return this.session.requestAnimationFrame((time, xrFrame) => callback(time, xrFrame));
  }

  cancelAnimationFrame(animationFrameId: number): void {
    this.session.cancelAnimationFrame(animationFrameId);
  }
}
