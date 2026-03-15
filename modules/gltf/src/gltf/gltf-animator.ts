// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import {GroupNode} from '@luma.gl/engine';
import {GLTFAnimation} from './animations/animations';
import {interpolate} from './animations/interpolate';

/** Construction props for a single glTF animation controller. */
type GLTFSingleAnimatorProps = {
  /** Animation data to evaluate. */
  animation: GLTFAnimation;
  /** Mapping from glTF node ids to scenegraph nodes. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
  /** Start time in seconds. */
  startTime?: number;
  /** Whether playback is active. */
  playing?: boolean;
  /** Playback speed multiplier. */
  speed?: number;
};

/** Evaluates one glTF animation against the generated scenegraph. */
class GLTFSingleAnimator {
  /** Animation definition being played. */
  animation: GLTFAnimation;
  /** Target scenegraph lookup table. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
  /** Playback start time in seconds. */
  startTime: number = 0;
  /** Whether playback is currently enabled. */
  playing: boolean = true;
  /** Playback speed multiplier. */
  speed: number = 1;

  /** Creates a single-animation controller. */
  constructor(props: GLTFSingleAnimatorProps) {
    this.animation = props.animation;
    this.gltfNodeIdToNodeMap = props.gltfNodeIdToNodeMap;
    this.animation.name ||= 'unnamed';
    Object.assign(this, props);
  }

  /** Advances the animation to the supplied wall-clock time in milliseconds. */
  setTime(timeMs: number) {
    if (!this.playing) {
      return;
    }

    const absTime = timeMs / 1000;
    const time = (absTime - this.startTime) * this.speed;

    this.animation.channels.forEach(({sampler, targetNodeId, path}) => {
      const targetNode = this.gltfNodeIdToNodeMap.get(targetNodeId);
      if (!targetNode) {
        throw new Error(`Cannot find animation target node ${targetNodeId}`);
      }

      interpolate(time, sampler, targetNode, path);
    });
  }
}

/** Construction props for {@link GLTFAnimator}. */
export type GLTFAnimatorProps = {
  /** Parsed animations from the source glTF. */
  animations: GLTFAnimation[];
  /** Mapping from glTF node ids to scenegraph nodes. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
};

/** Coordinates playback of every animation found in a glTF scene. */
export class GLTFAnimator {
  /** Individual animation controllers. */
  animations: GLTFSingleAnimator[];

  /** Creates an animator for the supplied glTF scenegraph. */
  constructor(props: GLTFAnimatorProps) {
    this.animations = props.animations.map((animation, index) => {
      const name = animation.name || `Animation-${index}`;
      return new GLTFSingleAnimator({
        gltfNodeIdToNodeMap: props.gltfNodeIdToNodeMap,
        animation: {name, channels: animation.channels}
      });
    });
  }

  /** @deprecated Use .setTime(). Will be removed (deck.gl is using this) */
  animate(time: number): void {
    log.warn('GLTFAnimator#animate is deprecated. Use GLTFAnimator#setTime instead')();
    this.setTime(time);
  }

  /** Advances every animation to the supplied wall-clock time in milliseconds. */
  setTime(time: number): void {
    this.animations.forEach(animation => animation.setTime(time));
  }

  /** Returns the per-animation controllers managed by this animator. */
  getAnimations() {
    return this.animations;
  }
}
