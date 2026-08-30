// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {AnimationLoopMode} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {
  type GLTFAnimatedCrowd,
  type GLTFCrowdActor,
  type GLTFScenegraphs,
  setGLTFMorphWeights
} from '@luma.gl/gltf';

/** An authored facial-expression or morph-target control. */
export type GLTFStudioMorphTarget = {
  identifier: string;
  nodeIndex: number;
  targetIndex: number;
  label: string;
  value: number;
};

/** Readable playback state for one independently animated crowd actor. */
export type GLTFStudioActorState = {
  index: number;
  id: string;
  clip: string;
  time: number;
  speed: number;
  playing: boolean;
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
  actors: readonly GLTFStudioActorState[];
  selectedActorIndex: number;
  variants: readonly string[];
  selectedVariant: string;
  morphTargets: readonly GLTFStudioMorphTarget[];
  skinCount: number;
  jointCount: number;
  cameraCount: number;
};

export type GLTFStudioCameraState = {
  projectionMatrix: Matrix4;
  viewMatrix: Matrix4;
  position: [number, number, number];
};

const DEFAULT_VARIANT = '__default__';

/**
 * Application controller composed from the public glTF animator, crowd, variant, and morph APIs.
 * It owns no renderer, scene graph, mixer, skeleton, or GPU resources.
 */
export class GLTFAnimationStudio {
  private scenegraphs: GLTFScenegraphs | undefined;
  private crowd: GLTFAnimatedCrowd | undefined;
  private selectedActorIndex = 0;
  private previousFrameTimeMilliseconds: number | undefined;
  private readonly morphTargets = new Map<string, GLTFStudioMorphTarget>();
  private playing = true;
  private speed = 1;
  private crossFadeDuration = 0.35;
  private loop: AnimationLoopMode = 'repeat';

  attach(scenegraphs: GLTFScenegraphs): void {
    this.scenegraphs = scenegraphs;
    this.crowd = undefined;
    this.selectedActorIndex = 0;
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

  attachCrowd(crowd: GLTFAnimatedCrowd | undefined): void {
    this.crowd = crowd;
    this.scenegraphs = crowd?.scenegraphs || this.scenegraphs;
    this.selectedActorIndex = Math.min(
      this.selectedActorIndex,
      Math.max(0, (crowd?.actorCount || 1) - 1)
    );
    this.previousFrameTimeMilliseconds = undefined;
    this.morphTargets.clear();
    this.discoverMorphTargets();
  }

  detach(): void {
    this.scenegraphs = undefined;
    this.crowd = undefined;
    this.selectedActorIndex = 0;
    this.previousFrameTimeMilliseconds = undefined;
    this.morphTargets.clear();
  }

  /** Advances ordinary scene playback; crowd playback stays owned by GLTFAnimatedCrowd. */
  update(timeMilliseconds: number): void {
    const previousTimeMilliseconds = this.previousFrameTimeMilliseconds;
    this.previousFrameTimeMilliseconds = timeMilliseconds;
    if (
      !this.scenegraphs ||
      this.crowd ||
      !this.playing ||
      previousTimeMilliseconds === undefined
    ) {
      return;
    }

    const elapsedSeconds = Math.max(0, (timeMilliseconds - previousTimeMilliseconds) / 1000);
    this.scenegraphs.animator.update(elapsedSeconds);
  }

  selectActor(actorIndex: number): void {
    const maximumActorIndex = Math.max(0, (this.crowd?.actorCount || 1) - 1);
    this.selectedActorIndex = Math.max(0, Math.min(maximumActorIndex, Math.floor(actorIndex)));
    this.previousFrameTimeMilliseconds = undefined;
  }

  selectClip(clipName: string): void {
    if (!clipName) {
      return;
    }
    const actor = this.getSelectedActor();
    if (actor) {
      actor.selectClip(clipName, {crossFadeDuration: this.crossFadeDuration});
      actor.setLoop(this.loop);
      return;
    }
    if (!this.scenegraphs) {
      return;
    }

    const clip = this.scenegraphs.animator.selectClip(clipName, {
      crossFadeDuration: this.crossFadeDuration
    });
    clip.action.setLoop(this.loop);
    this.previousFrameTimeMilliseconds = undefined;
  }

  setPlaying(playing: boolean): void {
    const actor = this.getSelectedActor();
    if (this.playing === playing && (!actor || actor.playing === playing)) {
      return;
    }
    this.playing = playing;
    if (actor) {
      if (playing) {
        actor.play();
      } else {
        actor.pause();
      }
    }
    this.previousFrameTimeMilliseconds = undefined;
  }

  setSpeed(speed: number): void {
    this.speed = Math.max(0, Math.min(4, speed));
    const actor = this.getSelectedActor();
    if (actor) {
      actor.setSpeed(this.speed);
    } else if (this.scenegraphs) {
      this.scenegraphs.animator.mixer.timeScale = this.speed;
    }
  }

  setCrossFadeDuration(duration: number): void {
    this.crossFadeDuration = Math.max(0, Math.min(2, duration));
  }

  setLoop(loop: AnimationLoopMode): void {
    this.loop = loop;
    const actor = this.getSelectedActor();
    if (actor) {
      actor.setLoop(loop);
    } else {
      this.getActiveAction()?.setLoop(loop);
    }
  }

  seek(timeSeconds: number): void {
    const actor = this.getSelectedActor();
    if (actor) {
      actor.seek(timeSeconds);
      return;
    }
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
    const actor = this.getSelectedActor();
    const animator = actor?.animator || scenegraphs?.animator;
    const activeAction = actor
      ? actor.activeClip
        ? actor.mixer.getAction(actor.activeClip)
        : undefined
      : this.getActiveAction();
    const actors = this.crowd?.actors.map((crowdActor, index) => ({
      index,
      id: crowdActor.id,
      clip: crowdActor.activeClip || '',
      time: crowdActor.time,
      speed: crowdActor.speed,
      playing: crowdActor.playing
    }));

    return {
      clipNames: animator?.clips.map(clip => clip.name) || [],
      selectedClip: animator?.activeClip || '',
      duration: activeAction?.clip.duration || 0,
      time: activeAction?.time || 0,
      playing: actor?.playing ?? this.playing,
      speed: actor?.speed ?? this.speed,
      crossFadeDuration: this.crossFadeDuration,
      loop: this.loop,
      actors:
        actors ||
        (scenegraphs
          ? [
              {
                index: 0,
                id: 'gltf-scene-actor',
                clip: animator?.activeClip || '',
                time: activeAction?.time || 0,
                speed: this.speed,
                playing: this.playing
              }
            ]
          : []),
      selectedActorIndex: this.selectedActorIndex,
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

  private getSelectedActor(): GLTFCrowdActor | undefined {
    return this.crowd?.actors[this.selectedActorIndex];
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

/** Resolves a source-authored camera through its actual animated scene-node world transform. */
export function getGLTFStudioCameraState(
  scenegraphs: GLTFScenegraphs,
  cameraIndex: number,
  options: {aspect: number; near: number; far: number}
): GLTFStudioCameraState | undefined {
  const camera = scenegraphs.cameras?.[cameraIndex];
  const sourceCamera = scenegraphs.gltf.cameras?.[cameraIndex];
  if (!camera || !sourceCamera) {
    return undefined;
  }

  const sourceNodeIndex = scenegraphs.gltf.nodes.findIndex(node => {
    const nodeCamera: unknown = node.camera;
    return nodeCamera === cameraIndex || nodeCamera === sourceCamera;
  });
  const cameraNode = scenegraphs.gltfNodeIndexToNodeMap.get(sourceNodeIndex);
  if (!cameraNode) {
    return undefined;
  }

  let worldMatrix: Matrix4 | undefined;
  for (const scene of scenegraphs.scenes) {
    scene.preorderTraversal((node, {worldMatrix: nodeWorldMatrix}) => {
      if (node === cameraNode) {
        worldMatrix = new Matrix4(nodeWorldMatrix);
      }
    });
    if (worldMatrix) {
      break;
    }
  }
  if (!worldMatrix) {
    return undefined;
  }

  const orthographic = camera.orthographic;
  const perspective = camera.perspective;
  const projectionMatrix = orthographic
    ? new Matrix4().ortho({
        left: -orthographic.xmag,
        right: orthographic.xmag,
        bottom: -orthographic.ymag,
        top: orthographic.ymag,
        near: orthographic.znear,
        far: orthographic.zfar
      })
    : new Matrix4().perspective({
        fovy: perspective?.yfov || Math.PI / 3,
        aspect: perspective?.aspectRatio || options.aspect,
        near: perspective?.znear || options.near,
        far: perspective?.zfar || options.far
      });
  return {
    projectionMatrix,
    viewMatrix: new Matrix4(worldMatrix).invert(),
    position: [worldMatrix[12], worldMatrix[13], worldMatrix[14]]
  };
}

export {DEFAULT_VARIANT as GLTF_STUDIO_DEFAULT_VARIANT};
