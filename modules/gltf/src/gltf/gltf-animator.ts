// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {AnimationClipController, Animator, GroupNode, Material} from '@luma.gl/engine';
import {
  GLTFAnimation,
  GLTFMaterialAnimationChannel,
  GLTFMaterialAnimationProperty,
  GLTFTextureTransformAnimationChannel
} from './animations/animations';
import {evaluateSampler, interpolate} from './animations/interpolate';
import {
  getTextureTransformDeltaMatrix,
  getTextureTransformSlotDefinition,
  type PBRTextureTransform,
  type PBRTextureTransformSlot
} from '../pbr/texture-transform';

/** Construction props for a single glTF animation controller. */
type GLTFAnimationClipProps = {
  /** Animation data to evaluate. */
  animation: GLTFAnimation;
  /** Mapping from glTF node ids to scenegraph nodes. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
  /** Materials aligned with the source glTF materials array. */
  materials?: Material[];
};

/** Evaluates one glTF animation against the generated scenegraph. */
export class GLTFAnimationClip extends AnimationClipController {
  /** Animation definition being played. */
  animation: GLTFAnimation;
  /** Target scenegraph lookup table. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;
  /** Materials aligned with the source glTF materials array. */
  materials: Material[];
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
    Object.assign(this, props);

    if (
      this.animation.channels.some(channel => channel.type !== 'node') &&
      !this.materials.length
    ) {
      throw new Error(
        `Animation ${this.animation.name} targets materials, but GLTFAnimator was created without a materials array`
      );
    }
  }

  /** Applies the resolved local clip time in seconds. */
  protected override applyTime(time: number): void {
    this.animation.channels.forEach(channel => {
      if (channel.type === 'node') {
        const {sampler, targetNodeId, path} = channel;
        const targetNode = this.gltfNodeIdToNodeMap.get(targetNodeId);
        if (!targetNode) {
          throw new Error(`Cannot find animation target node ${targetNodeId}`);
        }

        interpolate(time, sampler, targetNode, path);
        return;
      }

      const material = this.materials[channel.targetMaterialIndex];
      if (!material) {
        throw new Error(
          `Cannot find animation target material ${channel.targetMaterialIndex} for ${channel.pointer}`
        );
      }

      const value = evaluateSampler(time, channel.sampler);
      if (value) {
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
    });
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
  /** Creates an animator for the supplied glTF scenegraph. */
  constructor(props: GLTFAnimatorProps) {
    super(
      props.animations.map((animation, index) => {
        const name = animation.name || `Animation-${index}`;
        return new GLTFAnimationClip({
          gltfNodeIdToNodeMap: props.gltfNodeIdToNodeMap,
          materials: props.materials,
          animation: {name, channels: animation.channels}
        });
      })
    );
  }
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
