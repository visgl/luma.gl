// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationTrack} from './animation-track';

/** Construction properties for a named, reusable animation clip. */
export type AnimationClipProps = {
  /** Application-visible clip name. */
  name: string;
  /** Tracks evaluated together whenever this clip plays. */
  tracks: AnimationTrack[];
  /** Optional explicit clip duration, in seconds. */
  duration?: number;
};

/** A named set of target-bound animation tracks. */
export class AnimationClip {
  readonly name: string;
  readonly tracks: AnimationTrack[];
  readonly duration: number;

  constructor(props: AnimationClipProps) {
    this.name = props.name || 'unnamed';
    this.tracks = props.tracks;
    this.duration = props.duration ?? Math.max(0, ...props.tracks.map(track => track.duration));
  }
}
