// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';

/** Construction props shared by all animation clip controllers. */
export type AnimationClipControllerProps = {
  /** Application-visible clip name. */
  name?: string;
  /** Start time in seconds relative to wall-clock playback time. */
  startTime?: number;
  /** Whether playback is active. */
  playing?: boolean;
  /** Playback speed multiplier. */
  speed?: number;
};

/** Generic playback controller for one animation clip. */
export abstract class AnimationClipController {
  /** Application-visible clip name. */
  name: string;
  /** Whether playback is currently enabled. */
  playing: boolean = true;
  /** Playback speed multiplier. */
  speed: number = 1;
  /** Start time in seconds relative to wall-clock playback time. */
  startTime: number = 0;

  constructor(props: AnimationClipControllerProps = {}) {
    this.name = props.name || 'unnamed';
    Object.assign(this, props);
  }

  /** Advances the clip to the supplied wall-clock time in milliseconds. */
  setTime(timeMs: number): void {
    if (!this.playing) {
      return;
    }

    const absoluteTimeSeconds = timeMs / 1000;
    const localTimeSeconds = (absoluteTimeSeconds - this.startTime) * this.speed;
    this.applyTime(localTimeSeconds);
  }

  /** Applies the resolved local clip time in seconds. */
  protected abstract applyTime(localTimeSeconds: number): void;
}

/** Generic manager for a set of time-driven animation clips. */
export class Animator<TClip extends AnimationClipController> {
  /** Managed clip list. */
  readonly clips: TClip[];
  /** Compatibility alias for clip list. */
  readonly animations: TClip[];

  constructor(clips: TClip[]) {
    this.clips = clips;
    this.animations = clips;
  }

  /** @deprecated Use .setTime(). */
  animate(timeMs: number): void {
    log.warn(
      `${this.constructor.name}#animate is deprecated. Use ${this.constructor.name}#setTime instead`
    )();
    this.setTime(timeMs);
  }

  /** Advances every clip to the supplied wall-clock time in milliseconds. */
  setTime(timeMs: number): void {
    this.clips.forEach(clip => clip.setTime(timeMs));
  }

  /** Returns the managed animation clips. */
  getAnimations(): TClip[] {
    return this.clips;
  }
}
