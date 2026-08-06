// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {AnimationLoopMode} from '@luma.gl/engine';
import {type GLTFScenegraphs, setGLTFMorphWeights} from '@luma.gl/gltf';

/** An authored facial-expression or morph-target control. */
export type GLTFStudioMorphTarget = {
  identifier: string;
  nodeIndex: number;
  targetIndex: number;
  label: string;
  value: number;
};

/** Readable capabilities and the current application-controlled playback state. */
export type GLTFAnimationStudioState = {
  clipNames: readonly string[];
  selectedClip: string;
  duration: number;
  time: number;
  playing: boolean;
  speed: number;
  crossFadeDuration: number;
  loop: AnimationLoopMode;
  variants: readonly string[];
  selectedVariant: string;
  morphTargets: readonly GLTFStudioMorphTarget[];
  skinCount: number;
  jointCount: number;
  cameraCount: number;
};

const DEFAULT_VARIANT = '__default__';

/** Small application controller built entirely on the public glTF animation APIs. */
export class GLTFAnimationStudio {
  private scenegraphs: GLTFScenegraphs | undefined;
  private previousFrameTimeMilliseconds: number | undefined;
  private readonly morphTargets = new Map<string, GLTFStudioMorphTarget>();
  private playing = true;
  private speed = 1;
  private crossFadeDuration = 0.35;
  private loop: AnimationLoopMode = 'repeat';

  attach(scenegraphs: GLTFScenegraphs): void {
    this.scenegraphs = scenegraphs;
    this.previousFrameTimeMilliseconds = undefined;
    this.morphTargets.clear();
    this.discoverMorphTargets();

    const firstClip = scenegraphs.animator.clips[0];
    const initialClip = scenegraphs.animator.clips.find(clip => clip.name === 'Idle') || firstClip;
    if (initialClip) {
      scenegraphs.animator.selectClip(initialClip.name);
      initialClip.action.setLoop(this.loop);
    }
    scenegraphs.animator.mixer.timeScale = this.speed;
  }

  detach(): void {
    this.scenegraphs = undefined;
    this.previousFrameTimeMilliseconds = undefined;
    this.morphTargets.clear();
  }

  update(timeMilliseconds: number): void {
    const previousTimeMilliseconds = this.previousFrameTimeMilliseconds;
    this.previousFrameTimeMilliseconds = timeMilliseconds;
    if (!this.scenegraphs || !this.playing || previousTimeMilliseconds === undefined) {
      return;
    }

    const elapsedSeconds = Math.max(0, (timeMilliseconds - previousTimeMilliseconds) / 1000);
    this.scenegraphs.animator.update(elapsedSeconds);
  }

  selectClip(clipName: string): void {
    if (!this.scenegraphs || !clipName) {
      return;
    }

    const clip = this.scenegraphs.animator.selectClip(clipName, {
      crossFadeDuration: this.crossFadeDuration
    });
    clip.action.setLoop(this.loop);
    this.previousFrameTimeMilliseconds = undefined;
  }

  setPlaying(playing: boolean): void {
    if (this.playing === playing) {
      return;
    }
    this.playing = playing;
    this.previousFrameTimeMilliseconds = undefined;
  }

  setSpeed(speed: number): void {
    this.speed = Math.max(0, Math.min(4, speed));
    if (this.scenegraphs) {
      this.scenegraphs.animator.mixer.timeScale = this.speed;
    }
  }

  setCrossFadeDuration(duration: number): void {
    this.crossFadeDuration = Math.max(0, Math.min(2, duration));
  }

  setLoop(loop: AnimationLoopMode): void {
    this.loop = loop;
    const action = this.getActiveAction();
    action?.setLoop(loop);
  }

  seek(timeSeconds: number): void {
    const action = this.getActiveAction();
    if (!action || !this.scenegraphs) {
      return;
    }

    action.setTime(Math.max(0, Math.min(action.clip.duration, timeSeconds)));
    this.scenegraphs.animator.update(0);
    this.previousFrameTimeMilliseconds = undefined;
  }

  selectVariant(variant: string): void {
    if (!this.scenegraphs) {
      return;
    }
    if (variant === DEFAULT_VARIANT) {
      this.scenegraphs.variants.resetVariant();
    } else {
      this.scenegraphs.variants.selectVariant(variant);
    }
  }

  setMorphWeight(identifier: string, value: number): void {
    const target = this.morphTargets.get(identifier);
    const node = target
      ? this.scenegraphs?.gltfNodeIndexToNodeMap.get(target.nodeIndex)
      : undefined;
    if (!target || !node) {
      return;
    }

    const existingWeights = (node.userData['morphWeights'] as readonly number[] | undefined) || [];
    const targetCount = this.getMorphTargetCount(target.nodeIndex);
    const weights = Array.from({length: targetCount}, (_, index) => existingWeights[index] || 0);
    target.value = Math.max(0, Math.min(1, value));
    weights[target.targetIndex] = target.value;
    setGLTFMorphWeights(node, weights);
  }

  getState(): GLTFAnimationStudioState {
    const scenegraphs = this.scenegraphs;
    const activeAction = this.getActiveAction();

    return {
      clipNames: scenegraphs?.animator.clips.map(clip => clip.name) || [],
      selectedClip: scenegraphs?.animator.activeClip || '',
      duration: activeAction?.clip.duration || 0,
      time: activeAction?.time || 0,
      playing: this.playing,
      speed: this.speed,
      crossFadeDuration: this.crossFadeDuration,
      loop: this.loop,
      variants: scenegraphs?.variants.names || [],
      selectedVariant: scenegraphs?.variants.activeVariant || DEFAULT_VARIANT,
      morphTargets: Array.from(this.morphTargets.values()),
      skinCount: scenegraphs?.skins.bindings.length || 0,
      jointCount:
        scenegraphs?.skins.bindings.reduce(
          (jointCount, skin) => jointCount + skin.joints.length,
          0
        ) || 0,
      cameraCount: scenegraphs?.cameras?.length || 0
    };
  }

  private getActiveAction() {
    const activeClip = this.scenegraphs?.animator.activeClip;
    return activeClip ? this.scenegraphs?.animator.mixer.getAction(activeClip) : undefined;
  }

  private getMorphTargetCount(nodeIndex: number): number {
    const sourceNode = this.scenegraphs?.gltf.nodes[nodeIndex];
    const sourceMesh = sourceNode?.mesh;
    return (
      sourceMesh?.primitives.reduce(
        (targetCount, primitive) => Math.max(targetCount, primitive.targets?.length || 0),
        0
      ) || 0
    );
  }

  private discoverMorphTargets(): void {
    for (const [nodeIndex, sourceNode] of this.scenegraphs?.gltf.nodes.entries() || []) {
      const targetCount = this.getMorphTargetCount(nodeIndex);
      if (targetCount === 0) {
        continue;
      }

      const sourceMesh = sourceNode.mesh;
      const targetNames = sourceMesh?.extras?.['targetNames'];
      const sourceWeights = sourceNode.weights || sourceMesh?.weights || [];
      for (let targetIndex = 0; targetIndex < targetCount; targetIndex++) {
        const authoredName = Array.isArray(targetNames) ? targetNames[targetIndex] : undefined;
        const target = {
          identifier: `${nodeIndex}:${targetIndex}`,
          nodeIndex,
          targetIndex,
          label:
            typeof authoredName === 'string'
              ? authoredName
              : `${sourceNode.name || 'Morph'} ${targetIndex + 1}`,
          value: sourceWeights[targetIndex] || 0
        };
        this.morphTargets.set(target.identifier, target);
      }
    }
  }
}

export {DEFAULT_VARIANT as GLTF_STUDIO_DEFAULT_VARIANT};
