// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GLTFNodePostprocessed} from '@loaders.gl/gltf';
import {log} from '@luma.gl/core';
import {GroupNode} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {GLTFAnimation} from './animations/animations';
import {interpolate} from './animations/interpolate';

type GLTFSingleAnimatorProps = {
  animation: GLTFAnimation;
  startTime?: number;
  playing?: boolean;
  speed?: number;
};

class GLTFSingleAnimator {
  animation: GLTFAnimation;
  startTime: number = 0;
  playing: boolean = true;
  speed: number = 1;

  constructor(props: GLTFSingleAnimatorProps) {
    this.animation = props.animation;
    this.animation.name ||= 'unnamed';
    Object.assign(this, props);
  }

  setTime(timeMs: number) {
    if (!this.playing) {
      return;
    }

    const absTime = timeMs / 1000;
    const time = (absTime - this.startTime) * this.speed;

    this.animation.channels.forEach(({sampler, target, path}) => {
      interpolate(time, sampler, target, path);
      applyTranslationRotationScale(target, (target as any)._node as GroupNode);
    });
  }
}

export type GLTFAnimatorProps = {
  animations: GLTFAnimation[];
};

export class GLTFAnimator {
  animations: GLTFSingleAnimator[];

  constructor(props: GLTFAnimatorProps) {
    this.animations = props.animations.map((animation, index) => {
      const name = animation.name || `Animation-${index}`;
      return new GLTFSingleAnimator({
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

// TODO: share with GLTFInstantiator
const scratchMatrix = new Matrix4();

function applyTranslationRotationScale(gltfNode: GLTFNodePostprocessed, node: GroupNode) {
  node.matrix.identity();

  if (gltfNode.translation) {
    node.matrix.translate(gltfNode.translation);
  }

  if (gltfNode.rotation) {
    const rotationMatrix = scratchMatrix.fromQuaternion(gltfNode.rotation);
    node.matrix.multiplyRight(rotationMatrix);
  }

  if (gltfNode.scale) {
    node.matrix.scale(gltfNode.scale);
  }
}
