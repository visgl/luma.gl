// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import {
  AnimationClip,
  AnimationClipController,
  AnimationMixer,
  AnimationTrack,
  Animator,
  GroupNode,
  Material,
  type AnimationAction,
  type AnimationInterpolation
} from '@luma.gl/engine';
import {
  GLTFAnimation,
  GLTFAnimationChannel,
  GLTFAnimationPath,
  GLTFMaterialAnimationChannel,
  GLTFMaterialAnimationProperty,
  GLTFTextureTransformAnimationChannel
} from './animations/animations';
import {
  getTextureTransformDeltaMatrix,
  getTextureTransformSlotDefinition,
  type PBRTextureTransform,
  type PBRTextureTransformSlot
} from '../pbr/texture-transform';

/** Construction props for a single glTF animation controller. */
export type GLTFAnimationClipProps = {
  /** Animation data to evaluate. */
  animation: GLTFAnimation;
  /** Mapping from glTF node ids to scenegraph nodes. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
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
    this.materials = props.materials || [];
    this.animation.name ||= 'unnamed';
    this.name = this.animation.name;
    if (
      this.animation.channels.some(channel => channel.type !== 'node') &&
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
}

/** Construction props for {@link GLTFAnimator}. */
export type GLTFAnimatorProps = {
  /** Parsed animations from the source glTF. */
  animations: GLTFAnimation[];
  /** Mapping from glTF node ids to scenegraph nodes. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
  /** Materials aligned with the source glTF materials array. */
  materials?: Material[];
};

/** Coordinates playback of every animation found in a glTF scene. */
export class GLTFAnimator extends Animator<GLTFAnimationClip> {
  /** Shared engine mixer containing every parsed glTF clip and target binding. */
  readonly mixer: AnimationMixer;

  /** Creates an animator for the supplied glTF scenegraph. */
  constructor(props: GLTFAnimatorProps) {
    const mixer = new AnimationMixer();
    super(
      props.animations.map((animation, index) => {
        const name = animation.name || `Animation-${index}`;
        return new GLTFAnimationClip({
          gltfNodeIdToNodeMap: props.gltfNodeIdToNodeMap,
          materials: props.materials,
          mixer,
          animation: {name, channels: animation.channels}
        });
      })
    );
    this.mixer = mixer;
  }

  /** Resolves legacy wall-clock milliseconds while evaluating all clips in one mixer pass. */
  override setTime(timeMs: number): void {
    const absoluteTimeSeconds = timeMs / 1000;
    this.clips.forEach(clip => {
      if (!clip.playing) {
        clip.action.stop();
        return;
      }
      clip.action.resume();
      clip.action.setTime(Math.max(0, absoluteTimeSeconds - clip.startTime) * clip.speed);
    });
    this.mixer.update(0);
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
