// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import {GroupNode} from '@luma.gl/engine';
import {GLTFAnimation} from './animations/animations';
import {interpolate} from './animations/interpolate';

type GLTFSingleAnimatorProps = {
  animation: GLTFAnimation;
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
  startTime?: number;
  playing?: boolean;
  speed?: number;
};

class GLTFSingleAnimator {
  animation: GLTFAnimation;
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
  startTime: number = 0;
  playing: boolean = true;
  speed: number = 1;

  constructor(props: GLTFSingleAnimatorProps) {
    this.animation = props.animation;
    this.gltfNodeIdToNodeMap = props.gltfNodeIdToNodeMap;
    this.animation.name ||= 'unnamed';
    Object.assign(this, props);
  }

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

export type GLTFAnimatorProps = {
  animations: GLTFAnimation[];
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
};

export class GLTFAnimator {
  animations: GLTFSingleAnimator[];

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

  setTime(time: number): void {
    this.animations.forEach(animation => animation.setTime(time));
  }

  getAnimations() {
    return this.animations;
  }
}
