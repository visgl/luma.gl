// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { log } from '@luma.gl/core';
import { interpolate } from './animations/interpolate';
class GLTFSingleAnimator {
    animation;
    gltfNodeIdToNodeMap;
    startTime = 0;
    playing = true;
    speed = 1;
    constructor(props) {
        this.animation = props.animation;
        this.gltfNodeIdToNodeMap = props.gltfNodeIdToNodeMap;
        this.animation.name ||= 'unnamed';
        Object.assign(this, props);
    }
    setTime(timeMs) {
        if (!this.playing) {
            return;
        }
        const absTime = timeMs / 1000;
        const time = (absTime - this.startTime) * this.speed;
        this.animation.channels.forEach(({ sampler, targetNodeId, path }) => {
            const targetNode = this.gltfNodeIdToNodeMap.get(targetNodeId);
            if (!targetNode) {
                throw new Error(`Cannot find animation target node ${targetNodeId}`);
            }
            interpolate(time, sampler, targetNode, path);
        });
    }
}
export class GLTFAnimator {
    animations;
    constructor(props) {
        this.animations = props.animations.map((animation, index) => {
            const name = animation.name || `Animation-${index}`;
            return new GLTFSingleAnimator({
                gltfNodeIdToNodeMap: props.gltfNodeIdToNodeMap,
                animation: { name, channels: animation.channels }
            });
        });
    }
    /** @deprecated Use .setTime(). Will be removed (deck.gl is using this) */
    animate(time) {
        log.warn('GLTFAnimator#animate is deprecated. Use GLTFAnimator#setTime instead')();
        this.setTime(time);
    }
    setTime(time) {
        this.animations.forEach(animation => animation.setTime(time));
    }
    getAnimations() {
        return this.animations;
    }
}
