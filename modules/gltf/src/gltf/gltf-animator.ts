// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '../types/gltf-postprocessed-schema';
import {
  AnimationClip,
  makeAdapterAnimationBinding,
  type InteractivityPropertyAdapter,
  MixerAnimationClip,
  type AnimationInterpolation,
  AnimationMixer,
  AnimationTrack,
  ScenegraphAnimator,
  makeMaterialAnimationBinding,
  makeTextureTransformAnimationBinding,
  makePropertyAnimationBinding,
  makeNodeAnimationBinding,
  GroupNode,
  Material
} from '@luma.gl/engine';
import {
  getTextureTransformSlotDefinition,
  type PBRTextureTransform,
  type PBRTextureTransformSlot
} from '../pbr/texture-transform';
import {GLTFAnimation, GLTFAnimationChannel} from './animations/animations';

/** Construction props for a single glTF animation controller. */
export type GLTFAnimationClipProps = {
  properties?: InteractivityPropertyAdapter;
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
  /** Primitive material instances indexed by their source material, including inactive variants. */
  materialInstances?: ReadonlyMap<number, readonly Material[]>;
  /** Optional shared playback mixer for clips belonging to the same scene. */
  mixer?: AnimationMixer;
};

/** Import adapter: resolves source channels into engine tracks and playback. */
export class GLTFAnimationClip extends MixerAnimationClip {
  readonly animation: GLTFAnimation;
  readonly gltfNodeIdToNodeMap: Map<string, GroupNode>;
  readonly materials: Material[];
  readonly materialTextureTransformState: Map<
    Material,
    Partial<Record<PBRTextureTransformSlot, PBRTextureTransform>>
  >;

  constructor(props: GLTFAnimationClipProps) {
    const state = new Map<
      Material,
      Partial<Record<PBRTextureTransformSlot, PBRTextureTransform>>
    >();
    const name = props.animation.name || 'unnamed';
    super(
      new AnimationClip({
        name,
        tracks: props.animation.channels.map(channel => createAnimationTrack(channel, props, state))
      }),
      props.mixer
    );
    this.animation = props.animation;
    this.gltfNodeIdToNodeMap = props.gltfNodeIdToNodeMap;
    this.materials = props.materials || [];
    this.materialTextureTransformState = state;
  }
}

function createAnimationTrack(
  channel: GLTFAnimationChannel,
  props: GLTFAnimationClipProps,
  state: GLTFAnimationClip['materialTextureTransformState']
): AnimationTrack {
  const interpolation = getAnimationInterpolation(channel.sampler.interpolation);
  if (channel.type === 'property') {
    if (!props.properties)
      throw new Error(`Missing runtime property adapter for ${channel.pointer}`);
    return new AnimationTrack({
      name: channel.pointer,
      times: channel.sampler.input,
      values: channel.sampler.output,
      interpolation,
      valueType: channel.pointer.endsWith('/inertiaOrientation') ? 'quaternion' : 'vector',
      binding: makeAdapterAnimationBinding(props.properties, channel.pointer)
    });
  }
  if (channel.type === 'node') {
    return new AnimationTrack({
      name: `${channel.targetNodeId}.${channel.path}`,
      times: channel.sampler.input,
      values: channel.sampler.output,
      interpolation,
      valueType: channel.path === 'rotation' ? 'quaternion' : 'vector',
      binding: makeNodeAnimationBinding(
        getTargetNode(props.gltfNodeIdToNodeMap, channel.targetNodeId),
        channel.path,
        {
          id: `node:${channel.targetNodeId}:${channel.path}`,
          onVisibilityChange: props.onVisibilityChange
        }
      )
    });
  }

  if (channel.type === 'camera' || channel.type === 'light') {
    const target: Record<string, any> | undefined =
      channel.type === 'camera'
        ? (props.cameras || [])[channel.targetCameraIndex]?.[channel.projection]
        : (props.lightDefinitions || [])[channel.targetLightIndex];
    if (!target) throw new Error(`Cannot find animation target ${channel.pointer}`);
    let object = target;
    if (
      channel.type === 'light' &&
      (channel.property === 'innerConeAngle' || channel.property === 'outerConeAngle')
    ) {
      target['spot'] ||= {};
      object = target['spot'];
    }
    return new AnimationTrack({
      name: channel.pointer,
      times: channel.sampler.input,
      values: channel.sampler.output,
      interpolation,
      binding: makePropertyAnimationBinding(object, channel.property, {
        id: channel.pointer,
        component: channel.type === 'light' ? channel.component : undefined,
        onChange: channel.type === 'light' ? props.onLightChange : undefined
      })
    });
  }

  const material = (props.materials || [])[channel.targetMaterialIndex];
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
    binding:
      channel.type === 'material'
        ? makeMaterialAnimationBinding(
            [
              ...new Set([
                material,
                ...(props.materialInstances?.get(channel.targetMaterialIndex) || [])
              ])
            ],
            channel,
            channel.pointer
          )
        : makeTextureTransformAnimationBinding(
            [
              ...new Set([
                material,
                ...(props.materialInstances?.get(channel.targetMaterialIndex) || [])
              ])
            ],
            {
              ...channel,
              uniform: getTextureTransformSlotDefinition(channel.textureSlot).uvTransformUniform
            },
            state,
            channel.pointer
          )
  });
}

function getTargetNode(nodes: Map<string, GroupNode>, id: string): GroupNode {
  const node = nodes.get(id);
  if (!node) throw new Error(`Cannot find animation target node ${id}`);
  return node;
}

/** Construction props for {@link GLTFAnimator}. */
export type GLTFAnimatorProps = {
  properties?: InteractivityPropertyAdapter;
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
  /** Primitive material instances indexed by their source material, including inactive variants. */
  materialInstances?: ReadonlyMap<number, readonly Material[]>;
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
export class GLTFAnimator extends ScenegraphAnimator<GLTFAnimationClip> {
  /** Creates an animator for the supplied glTF scenegraph. */
  constructor(props: GLTFAnimatorProps) {
    const mixer = new AnimationMixer();
    super(
      props.animations.map((animation, index) => {
        const name = animation.name || `Animation-${index}`;
        return new GLTFAnimationClip({
          properties: props.properties,
          gltfNodeIdToNodeMap: props.gltfNodeIdToNodeMap,
          onVisibilityChange: props.onVisibilityChange,
          cameras: props.cameras,
          lightDefinitions: props.lightDefinitions,
          onLightChange: props.onLightChange,
          materials: props.materials,
          materialInstances: props.materialInstances,
          mixer,
          animation: {name, channels: animation.channels}
        });
      }),
      mixer,
      props
    );
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
