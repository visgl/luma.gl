// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {
  type AnimationAction,
  AnimationClip,
  AnimationClipController,
  type AnimationInterpolation,
  AnimationMixer,
  AnimationTrack,
  Animator,
  GroupNode,
  Material
} from '@luma.gl/engine';
import {
  getTextureTransformDeltaMatrix,
  getTextureTransformSlotDefinition,
  type PBRTextureTransform,
  type PBRTextureTransformSlot
} from '../pbr/texture-transform';
import {
  GLTFAnimation,
  GLTFAnimationChannel,
  GLTFAnimationPath,
  GLTFCameraAnimationChannel,
  GLTFLightAnimationChannel,
  GLTFMaterialAnimationChannel,
  GLTFMaterialAnimationProperty,
  GLTFTextureTransformAnimationChannel
} from './animations/animations';
import {setGLTFMorphWeights} from './morph-targets';

/** Construction props for a single glTF animation controller. */
export type GLTFAnimationClipProps = {
  /** Animation data to evaluate. */
  animation: GLTFAnimation;
  /** Mapping from glTF node ids to scenegraph nodes. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
  /** Refreshes runtime punctual lights after a node-visibility channel changes. */
  onVisibilityChange?: () => void;
  /** Runtime camera projection definitions aligned with the source camera array. */
  cameras?: GLTFPostprocessed['cameras'];
  /** Mutable runtime punctual-light definitions aligned with the source extension array. */
  lightDefinitions?: Record<string, any>[];
  /** Refreshes derived punctual lights after one source light property changes. */
  onLightChange?: () => void;
  /** Materials aligned with the source glTF materials array. */
  materials?: Material[];
  /** Optional shared playback mixer for clips belonging to the same scene. */
  mixer?: AnimationMixer;
};

/** Evaluates one glTF animation against the generated scenegraph. */
export class GLTFAnimationClip extends AnimationClipController {
  /** Animation definition being played. */
  animation: GLTFAnimation;
  /** Target scenegraph lookup table. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
  private readonly onVisibilityChange?: () => void;
  private readonly cameras: GLTFPostprocessed['cameras'];
  private readonly lightDefinitions: Record<string, any>[];
  private readonly onLightChange?: () => void;
  /** Materials aligned with the source glTF materials array. */
  materials: Material[];
  /** Format-independent engine clip generated from the parsed glTF channels. */
  readonly clip: AnimationClip;
  /** Shared engine animation mixer. */
  readonly mixer: AnimationMixer;
  /** Engine playback action controlling this animation clip. */
  readonly action: AnimationAction;
  /** Mutable runtime texture-transform state for animated material slots. */
  materialTextureTransformState = new Map<
    Material,
    Partial<Record<PBRTextureTransformSlot, PBRTextureTransform>>
  >();

  /** Creates a single-animation controller. */
  constructor(props: GLTFAnimationClipProps) {
    super({name: props.animation.name || 'unnamed'});
    this.animation = props.animation;
    this.gltfNodeIdToNodeMap = props.gltfNodeIdToNodeMap;
    this.onVisibilityChange = props.onVisibilityChange;
    this.cameras = props.cameras || [];
    this.lightDefinitions = props.lightDefinitions || [];
    this.onLightChange = props.onLightChange;
    this.materials = props.materials || [];
    this.animation.name ||= 'unnamed';
    this.name = this.animation.name;
    if (
      this.animation.channels.some(
        channel => channel.type === 'material' || channel.type === 'textureTransform'
      ) &&
      !this.materials.length
    ) {
      throw new Error(
        `Animation ${this.animation.name} targets materials, but GLTFAnimator was created without a materials array`
      );
    }

    this.mixer = props.mixer || new AnimationMixer();
    this.clip = new AnimationClip({
      name: this.name,
      tracks: this.animation.channels.map(channel => this.createAnimationTrack(channel))
    });
    this.action = this.mixer.clipAction(this.clip).play();
  }

  /** Applies the resolved local clip time in seconds. */
  protected override applyTime(time: number): void {
    this.action.setTime(time);
    this.mixer.update(0);
  }

  private createAnimationTrack(channel: GLTFAnimationChannel): AnimationTrack {
    const interpolation = getAnimationInterpolation(channel.sampler.interpolation);
    if (channel.type === 'node') {
      return new AnimationTrack({
        name: `${channel.targetNodeId}.${channel.path}`,
        times: channel.sampler.input,
        values: channel.sampler.output,
        interpolation,
        valueType: channel.path === 'rotation' ? 'quaternion' : 'vector',
        binding: {
          id: `node:${channel.targetNodeId}:${channel.path}`,
          getValue: () => this.getNodeAnimationValue(channel.targetNodeId, channel.path),
          setValue: value => this.applyNodeAnimationValue(channel.targetNodeId, channel.path, value)
        }
      });
    }

    if (channel.type === 'camera' || channel.type === 'light') {
      return new AnimationTrack({
        name: channel.pointer,
        times: channel.sampler.input,
        values: channel.sampler.output,
        interpolation,
        binding: {
          id: channel.pointer,
          getValue: () => this.getSceneAnimationValue(channel),
          setValue: value => this.applySceneAnimationValue(channel, value)
        }
      });
    }

    const material = this.materials[channel.targetMaterialIndex];
    if (!material) {
      throw new Error(
        `Cannot find animation target material ${channel.targetMaterialIndex} for ${channel.pointer}`
      );
    }

    return new AnimationTrack({
      name: channel.pointer,
      times: channel.sampler.input,
      values: channel.sampler.output,
      interpolation,
      binding: {
        id: channel.pointer,
        getValue:
          channel.type === 'material'
            ? () => getMaterialAnimationBindingValue(material, channel)
            : undefined,
        setValue: value => {
          if (channel.type === 'material') {
            applyMaterialAnimationValue(material, channel, value);
          } else {
            applyTextureTransformAnimationValue(
              material,
              channel,
              value,
              this.materialTextureTransformState
            );
          }
        }
      }
    });
  }

  private getNodeAnimationValue(targetNodeId: string, path: GLTFAnimationPath): number[] {
    const targetNode = this.getTargetNode(targetNodeId);
    switch (path) {
      case 'translation':
        return Array.from(targetNode.position);
      case 'rotation':
        return Array.from(targetNode.rotation);
      case 'scale':
        return Array.from(targetNode.scale);
      case 'weights':
        return Array.from(
          (targetNode.userData['morphWeights'] as readonly number[] | undefined) || []
        );
      case 'visibility':
        return [targetNode.display ? 1 : 0];
      default:
        return [];
    }
  }

  private applyNodeAnimationValue(
    targetNodeId: string,
    path: GLTFAnimationPath,
    value: number[]
  ): void {
    const targetNode = this.getTargetNode(targetNodeId);
    switch (path) {
      case 'translation':
        targetNode.setPosition(value).updateMatrix();
        break;
      case 'rotation':
        targetNode.setRotation(value).updateMatrix();
        break;
      case 'scale':
        targetNode.setScale(value).updateMatrix();
        break;
      case 'weights':
        setGLTFMorphWeights(targetNode, value);
        break;
      case 'visibility':
        targetNode.setProps({display: value[0] !== 0});
        this.onVisibilityChange?.();
        break;
      default:
        log.warn(`Bad animation path ${path}`)();
    }
  }

  private getTargetNode(targetNodeId: string): GroupNode {
    const targetNode = this.gltfNodeIdToNodeMap.get(targetNodeId);
    if (!targetNode) {
      throw new Error(`Cannot find animation target node ${targetNodeId}`);
    }
    return targetNode;
  }

  private getSceneAnimationValue(
    channel: GLTFCameraAnimationChannel | GLTFLightAnimationChannel
  ): number[] {
    if (channel.type === 'camera') {
      const camera = this.cameras[channel.targetCameraIndex] as Record<string, any> | undefined;
      const value = camera?.[channel.projection]?.[channel.property];
      return typeof value === 'number' ? [value] : [];
    }

    const light = this.lightDefinitions[channel.targetLightIndex];
    const value =
      channel.property === 'innerConeAngle' || channel.property === 'outerConeAngle'
        ? light?.['spot']?.[channel.property]
        : light?.[channel.property];
    if (Array.isArray(value)) {
      return channel.component === undefined ? [...value] : [value[channel.component]];
    }
    return typeof value === 'number' ? [value] : [];
  }

  private applySceneAnimationValue(
    channel: GLTFCameraAnimationChannel | GLTFLightAnimationChannel,
    value: number[]
  ): void {
    if (channel.type === 'camera') {
      const camera = this.cameras[channel.targetCameraIndex] as Record<string, any> | undefined;
      if (camera?.[channel.projection]) {
        camera[channel.projection][channel.property] = value[0];
      }
      return;
    }

    const light = this.lightDefinitions[channel.targetLightIndex];
    if (!light) {
      return;
    }
    if (channel.property === 'innerConeAngle' || channel.property === 'outerConeAngle') {
      light['spot'] ||= {};
      light['spot'][channel.property] = value[0];
    } else if (channel.component !== undefined) {
      const color = [...(light[channel.property] || [1, 1, 1])];
      color[channel.component] = value[0];
      light[channel.property] = color;
    } else {
      light[channel.property] = value.length === 1 ? value[0] : [...value];
    }
    this.onLightChange?.();
  }
}

/** Construction props for {@link GLTFAnimator}. */
export type GLTFAnimatorProps = {
  /** Refreshes runtime punctual lights after a node-visibility channel changes. */
  onVisibilityChange?: () => void;
  /** Runtime camera projection definitions aligned with the source camera array. */
  cameras?: GLTFPostprocessed['cameras'];
  /** Mutable runtime punctual-light definitions aligned with the source extension array. */
  lightDefinitions?: Record<string, any>[];
  /** Refreshes derived punctual lights after one source light property changes. */
  onLightChange?: () => void;
  /** Parsed animations from the source glTF. */
  animations: GLTFAnimation[];
  /** Mapping from glTF node ids to scenegraph nodes. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
  /** Materials aligned with the source glTF materials array. */
  materials?: Material[];
  /** Called once after all animation channels have been evaluated. */
  onUpdate?: () => void;
  /** Optional initial clip policy; omitted preserves legacy simultaneous playback. */
  autoplay?: 'all' | 'first' | false;
};

/** Optional transition settings when choosing an imported animation clip. */
export type GLTFAnimationSelectionOptions = {
  /** Crossfade duration in seconds; omitted selects the new clip immediately. */
  crossFadeDuration?: number;
};

/** Coordinates playback of every animation found in a glTF scene. */
export class GLTFAnimator extends Animator<GLTFAnimationClip> {
  /** Shared engine mixer containing every parsed glTF clip and target binding. */
  readonly mixer: AnimationMixer;

  /** Name of the currently selected clip, when explicit selection has been requested. */
  activeClip: string | undefined;

  private onUpdate?: () => void;
  private previousTimeSeconds: number | undefined;

  /** Creates an animator for the supplied glTF scenegraph. */
  constructor(props: GLTFAnimatorProps) {
    const mixer = new AnimationMixer();
    super(
      props.animations.map((animation, index) => {
        const name = animation.name || `Animation-${index}`;
        return new GLTFAnimationClip({
          gltfNodeIdToNodeMap: props.gltfNodeIdToNodeMap,
          onVisibilityChange: props.onVisibilityChange,
          cameras: props.cameras,
          lightDefinitions: props.lightDefinitions,
          onLightChange: props.onLightChange,
          materials: props.materials,
          mixer,
          animation: {name, channels: animation.channels}
        });
      })
    );
    this.mixer = mixer;
    this.onUpdate = props.onUpdate;
    this.activeClip = this.clips[0]?.name;

    if (props.autoplay === false) {
      this.clips.forEach(clip => {
        clip.playing = false;
        clip.action.stop();
      });
    } else if (props.autoplay === 'first' && this.activeClip) {
      this.selectClip(this.activeClip);
    }
  }

  /** Registers the dependent scenegraph update performed once after each animation frame. */
  setUpdateHandler(callback: (() => void) | undefined): this {
    this.onUpdate = callback;
    return this;
  }

  /** Resolves legacy wall-clock milliseconds while evaluating all clips in one mixer pass. */
  override setTime(timeMs: number): void {
    const absoluteTimeSeconds = timeMs / 1000;
    const elapsedSeconds =
      this.previousTimeSeconds === undefined ? 0 : absoluteTimeSeconds - this.previousTimeSeconds;
    this.previousTimeSeconds = absoluteTimeSeconds;
    const scaledElapsedSeconds = elapsedSeconds * this.mixer.timeScale;

    this.clips.forEach(clip => {
      if (!clip.playing) {
        clip.action.stop();
        return;
      }
      if (clip.action.paused) {
        return;
      }
      clip.action.resume();
      const localTime = Math.max(0, absoluteTimeSeconds - clip.startTime) * clip.speed;
      clip.action.setTime(localTime - scaledElapsedSeconds * clip.action.timeScale);
    });
    this.mixer.update(elapsedSeconds);
    this.onUpdate?.();
  }

  /** Advances clips using delta seconds without converting the legacy millisecond clock. */
  update(deltaSeconds: number): void {
    this.mixer.update(deltaSeconds);
    this.onUpdate?.();
  }

  /** Selects one imported clip and optionally crossfades from the previous selection. */
  selectClip(name: string, options: GLTFAnimationSelectionOptions = {}): GLTFAnimationClip {
    const nextClip = this.clips.find(clip => clip.name === name);
    if (!nextClip) {
      throw new Error(`Unknown animation clip: ${name}`);
    }

    const previousClip = this.clips.find(clip => clip.name === this.activeClip);
    const crossFadeDuration = options.crossFadeDuration || 0;
    for (const clip of this.clips) {
      if (clip !== nextClip && !(crossFadeDuration > 0 && clip === previousClip)) {
        clip.playing = false;
        clip.action.stop();
      }
    }

    nextClip.playing = true;
    if (crossFadeDuration > 0 && previousClip && previousClip !== nextClip) {
      previousClip.playing = true;
      previousClip.action.crossFadeTo(nextClip.action, crossFadeDuration);
    } else {
      nextClip.action.reset().setEffectiveWeight(1).play();
    }
    this.activeClip = name;
    return nextClip;
  }
}

function getAnimationInterpolation(interpolation: string): AnimationInterpolation {
  switch (interpolation) {
    case 'STEP':
    case 'LINEAR':
    case 'CUBICSPLINE':
      return interpolation;
    default:
      throw new Error(`Unsupported animation interpolation: ${interpolation}`);
  }
}

function getMaterialAnimationBindingValue(
  material: Material,
  channel: GLTFMaterialAnimationChannel
): number[] {
  const uniformValues = material.shaderInputs.getUniformValues() as Record<string, any>;
  const currentValue = uniformValues['pbrMaterial']?.[channel.property];
  if (Array.isArray(currentValue)) {
    return channel.component === undefined ? [...currentValue] : [currentValue[channel.component]];
  }
  return typeof currentValue === 'number' ? [currentValue] : [];
}

function applyMaterialAnimationValue(
  material: Material,
  channel: GLTFMaterialAnimationChannel,
  value: number[]
): void {
  const pbrMaterial =
    channel.component !== undefined
      ? {
          [channel.property]: updateMaterialArrayComponent(
            getCurrentMaterialValue(material, channel.property),
            channel.component,
            value[0]
          )
        }
      : {
          [channel.property]: value.length === 1 ? value[0] : value
        };

  material.setProps({pbrMaterial});
}

function getCurrentMaterialValue(
  material: Material,
  property: GLTFMaterialAnimationProperty
): number[] {
  const uniformValues = material.shaderInputs.getUniformValues() as Record<string, any>;
  const currentValue = uniformValues['pbrMaterial']?.[property];
  return Array.isArray(currentValue) ? [...currentValue] : [];
}

function updateMaterialArrayComponent(
  currentValue: number[],
  component: number,
  nextValue: number
): number[] {
  const updatedValue = [...currentValue];
  updatedValue[component] = nextValue;
  return updatedValue;
}

function applyTextureTransformAnimationValue(
  material: Material,
  channel: GLTFTextureTransformAnimationChannel,
  value: number[],
  materialTextureTransformState: Map<
    Material,
    Partial<Record<PBRTextureTransformSlot, PBRTextureTransform>>
  >
): void {
  const slotDefinition = getTextureTransformSlotDefinition(channel.textureSlot);
  const currentTransform = getCurrentTextureTransform(
    materialTextureTransformState,
    material,
    channel
  );

  switch (channel.path) {
    case 'offset':
      if (channel.component !== undefined) {
        currentTransform.offset[channel.component] = value[0];
      } else {
        currentTransform.offset = [value[0], value[1]];
      }
      break;

    case 'rotation':
      currentTransform.rotation = value[0];
      break;

    case 'scale':
      if (channel.component !== undefined) {
        currentTransform.scale[channel.component] = value[0];
      } else {
        currentTransform.scale = [value[0], value[1]];
      }
      break;
  }

  material.setProps({
    pbrMaterial: {
      [slotDefinition.uvTransformUniform]: getTextureTransformDeltaMatrix(
        channel.baseTransform,
        currentTransform
      )
    }
  });
}

function getCurrentTextureTransform(
  materialTextureTransformState: Map<
    Material,
    Partial<Record<PBRTextureTransformSlot, PBRTextureTransform>>
  >,
  material: Material,
  channel: GLTFTextureTransformAnimationChannel
): PBRTextureTransform {
  const materialState = materialTextureTransformState.get(material) || {};
  let textureTransformState = materialState[channel.textureSlot];
  if (!textureTransformState) {
    textureTransformState = {
      offset: [...channel.baseTransform.offset] as [number, number],
      rotation: channel.baseTransform.rotation,
      scale: [...channel.baseTransform.scale] as [number, number]
    };
    materialState[channel.textureSlot] = textureTransformState;
    materialTextureTransformState.set(material, materialState);
  }

  return textureTransformState;
}
