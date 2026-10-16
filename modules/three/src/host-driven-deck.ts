// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, View, Viewport, OrbitController, type OrbitViewState} from '@deck.gl/core';

export type ThreeCameraViewState = Pick<OrbitViewState, 'transitionDuration'> & {
  zoom?: number;
  focalDistance?: number;
  viewMatrix?: number[];
  projectionMatrix?: number[];
};

// The host supplies matrices directly; no controller or orbit-angle reconstruction is needed.
export class ThreeCameraView extends View<ThreeCameraViewState> {
  getViewportType() {
    return Viewport;
  }

  get ControllerType() {
    return OrbitController;
  }
}

/** Localize the pinned deck scheduling hook; every frame still runs deck's normal lifecycle. */
export class HostDrivenDeck extends Deck<ThreeCameraView> {
  private startTime: number | undefined;
  stopScheduling(): void {
    this.animationLoop?.stop();
    this.animationLoop?.timeline?.pause();
  }

  disableInteractions(): void {
    this.eventManager?.destroy();
    this.eventManager = null;
    this.eventManagers = {};
  }

  dispose(): void {
    this.finalize();
    this.device?.destroy();
  }

  renderFrame(time = performance.now()): void {
    this.startTime ??= time;
    this.animationLoop?.timeline?.setTime(time - this.startTime);
    this.animationLoop?.redraw(time);
  }
}
