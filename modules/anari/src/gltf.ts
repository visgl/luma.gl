// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type AnimationBinding,
  AnimationClip,
  type AnimationLoopMode,
  AnimationMixer,
  AnimationTrack,
  GroupNode
} from '@luma.gl/engine';
import {
  type GLTFAnimation,
  type GLTFAnimationChannel,
  type GLTFScenegraphs,
  getTextureTransformMatrix,
  type PBRTextureTransform
} from '@luma.gl/gltf';
import {Matrix4, type NumberArray9} from '@math.gl/core';
import type {
  ANARICamera,
  ANARIGeometry,
  ANARIInstance,
  ANARILight,
  ANARIMaterial,
  ANARISampler
} from './anari-objects';
import type {
  ANARICameraParameters,
  ANARIGeometryParameters,
  ANARILightParameters,
  ANARIMaterialParameters
} from './anari-types';
import type {
  ANARIAnimationClipDescription,
  ANARIAnimationInterpolation,
  ANARIAnimationNodeDescription,
  ANARIAnimationSceneDescription,
  ANARIAnimationTarget,
  ANARIAnimationTrackDescription
} from './animation-types';

/** Maps format-owned node/material identities into an existing ANARI JSON scene. */
export type ANARIGLTFAnimationMappings = {
  nodeIdentifiers?: Readonly<Record<string, string>>;
  materialIdentifiers?: readonly (string | undefined)[];
  materialAlphaModes?: readonly ('OPAQUE' | 'MASK' | 'BLEND' | undefined)[];
  samplerIdentifiers?: Readonly<Record<string, string>>;
  instanceIdentifiers?: Readonly<Record<string, readonly string[]>>;
  geometryIdentifiers?: Readonly<Record<string, readonly string[]>>;
};

/** Retained objects supplied by the caller rather than owned by this adapter. */
export type ANARIAnimationBindings = {
  instances: ReadonlyMap<string, ANARIInstance>;
  geometries?: ReadonlyMap<string, ANARIGeometry>;
  materials?: ReadonlyMap<string, ANARIMaterial>;
  samplers?: ReadonlyMap<string, ANARISampler>;
  lights?: ReadonlyMap<string, ANARILight>;
  camera?: ANARICamera;
};

/** Shared mixer and orchestration helpers for one retained animated ANARI scene. */
export type ANARIAnimationSceneHandle = {
  mixer: AnimationMixer;
  clipNames: readonly string[];
  activeClip: string | undefined;
  update(timeSeconds: number): void;
  selectClip(name: string): void;
  play(): void;
  pause(): void;
  seek(timeSeconds: number): void;
  setSpeed(speed: number): void;
};

type RetainedAnimationObject =
  | ANARIGeometry
  | ANARIInstance
  | ANARIMaterial
  | ANARISampler
  | ANARILight
  | ANARICamera;

const MATERIAL_PROPERTY_NAMES: Record<string, string> = {
  alphaCutoff: 'alphaCutoff',
  anisotropyRotation: 'anisotropyRotation',
  anisotropyStrength: 'anisotropyStrength',
  attenuationColor: 'attenuationColor',
  attenuationDistance: 'attenuationDistance',
  baseColorFactor: 'baseColor',
  clearcoatFactor: 'clearcoat',
  clearcoatRoughnessFactor: 'clearcoatRoughness',
  emissiveFactor: 'emissive',
  emissiveStrength: 'emissiveStrength',
  ior: 'indexOfRefraction',
  iridescenceFactor: 'iridescence',
  iridescenceIor: 'iridescenceIndexOfRefraction',
  normalScale: 'normalScale',
  occlusionStrength: 'occlusionStrength',
  sheenColorFactor: 'sheenColor',
  sheenRoughnessFactor: 'sheenRoughness',
  specularColorFactor: 'specularColor',
  specularIntensityFactor: 'specularIntensity',
  thicknessFactor: 'thickness',
  transmissionFactor: 'transmission'
};

/** Projects glTF-owned parsed channels into declarative ANARI JSON clips. */
export function makeANARIAnimationClipsFromGLTF(
  animations: readonly GLTFAnimation[],
  mappings: ANARIGLTFAnimationMappings = {}
): ANARIAnimationClipDescription[] {
  return animations.flatMap(animation => {
    const tracks = animation.channels.flatMap(channel => makeAnimationTracks(channel, mappings));
    return tracks.length > 0 ? [{name: animation.name, tracks}] : [];
  });
}

/** Projects shared glTF scenegraph nodes and decoded clips without parsing the glTF format. */
export function makeANARIAnimationDataFromGLTF(
  scenegraphs: GLTFScenegraphs,
  mappings: ANARIGLTFAnimationMappings = {}
): ANARIAnimationSceneDescription {
  const nodeIdentifiers = new Map<GroupNode, string>();
  const sourceNodes = new Map(scenegraphs.gltf.nodes.map(node => [node.id, node]));
  const sourceNodesByScenegraphNode = new Map<GroupNode, (typeof scenegraphs.gltf.nodes)[number]>();
  for (const [identifier, node] of scenegraphs.gltfNodeIdToNodeMap) {
    nodeIdentifiers.set(node, mappings.nodeIdentifiers?.[identifier] || identifier);
    const sourceNode = sourceNodes.get(identifier);
    if (sourceNode) {
      sourceNodesByScenegraphNode.set(node, sourceNode);
    }
  }

  const nodes: Record<string, ANARIAnimationNodeDescription> = {};
  const visitNode = (node: GroupNode, parentIdentifier?: string): void => {
    const identifier = nodeIdentifiers.get(node);
    let nextParentIdentifier = parentIdentifier;
    if (identifier) {
      const sourceNode = sourceNodesByScenegraphNode.get(node);
      const rotation =
        node.rotation.length === 4
          ? ([node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]] as const)
          : undefined;
      nodes[identifier] = {
        ...(parentIdentifier ? {parent: parentIdentifier} : {}),
        translation: [node.position[0], node.position[1], node.position[2]],
        ...(rotation ? {rotation} : {}),
        scale: [node.scale[0], node.scale[1], node.scale[2]],
        ...(sourceNode?.weights || sourceNode?.mesh?.weights
          ? {weights: [...(sourceNode?.weights || sourceNode?.mesh?.weights || [])]}
          : {}),
        ...(mappings.geometryIdentifiers?.[sourceNode?.id || '']
          ? {geometries: [...mappings.geometryIdentifiers[sourceNode?.id || '']]}
          : {}),
        ...(sourceNode?.matrix ? {matrix: Array.from(node.matrix)} : {}),
        ...(mappings.instanceIdentifiers?.[identifier]
          ? {instances: mappings.instanceIdentifiers[identifier]}
          : {})
      };
      nextParentIdentifier = identifier;
    }

    for (const child of node.children) {
      if (child instanceof GroupNode) {
        visitNode(child, nextParentIdentifier);
      }
    }
  };

  for (const root of scenegraphs.scenes) {
    visitNode(root);
  }

  const clips = makeANARIAnimationClipsFromGLTF(scenegraphs.animations, mappings);
  return {
    ...(Object.keys(nodes).length > 0 ? {nodes} : {}),
    ...(clips.length > 0 ? {clips, playback: {clip: clips[0].name, playing: true}} : {})
  };
}

/** Binds declarative ANARI channels to the shared engine mixer and batches retained commits. */
export function makeANARIAnimationScene(
  description: ANARIAnimationSceneDescription,
  bindings: ANARIAnimationBindings
): ANARIAnimationSceneHandle {
  const nodeDeclarations = description.nodes || {};
  const nodes = new Map<string, GroupNode>();
  const pendingObjects = new Map<RetainedAnimationObject, Record<string, unknown>>();
  const samplerTransforms = new Map<string, PBRTextureTransform>();
  let hierarchyChanged = false;
  let previousTimeSeconds: number | undefined;

  for (const [identifier, declaration] of Object.entries(nodeDeclarations)) {
    const node = new GroupNode({
      id: identifier,
      ...(declaration.translation ? {position: [...declaration.translation]} : {}),
      ...(declaration.rotation ? {rotation: [...declaration.rotation]} : {}),
      ...(declaration.scale ? {scale: [...declaration.scale]} : {}),
      ...(declaration.matrix ? {matrix: [...declaration.matrix]} : {})
    });
    if (declaration.weights) {
      node.userData['morphWeights'] = [...declaration.weights];
    }
    nodes.set(identifier, node);
  }

  for (const [identifier, declaration] of Object.entries(nodeDeclarations)) {
    if (declaration.parent) {
      nodes.get(declaration.parent)?.add(nodes.get(identifier)!);
    }
  }

  const queueProperty = (
    object: RetainedAnimationObject,
    target: ANARIAnimationTarget,
    value: number[]
  ): void => {
    const pendingValues = pendingObjects.get(object) || {};
    if (target.component !== undefined) {
      const committed = object.getParameters() as Record<string, unknown>;
      const priorValue = pendingValues[target.path] || committed[target.path];
      const nextValue = Array.isArray(priorValue) ? [...priorValue] : [];
      nextValue[target.component] = value[0];
      pendingValues[target.path] = nextValue;
    } else {
      pendingValues[target.path] = value.length === 1 ? value[0] : [...value];
    }
    pendingObjects.set(object, pendingValues);
  };

  const makeBinding = (track: ANARIAnimationTrackDescription): AnimationBinding | null => {
    const {target} = track;
    const bindingIdentifier = `${target.type}:${target.identifier}:${target.path}:${target.component ?? '*'}`;

    if (target.type === 'node') {
      const node = nodes.get(target.identifier);
      if (!node) {
        return null;
      }
      return {
        id: bindingIdentifier,
        getValue: () =>
          target.path === 'translation'
            ? node.position
            : target.path === 'rotation'
              ? node.rotation
              : target.path === 'scale'
                ? node.scale
                : (node.userData['morphWeights'] as readonly number[] | undefined) || [],
        setValue: value => {
          if (target.path === 'translation') {
            node.setPosition(value);
          } else if (target.path === 'rotation') {
            node.setRotation(value);
          } else if (target.path === 'scale') {
            node.setScale(value);
          } else if (target.path === 'weights') {
            node.userData['morphWeights'] = [...value];
            for (const geometryIdentifier of nodeDeclarations[target.identifier]?.geometries ||
              []) {
              const geometry = bindings.geometries?.get(geometryIdentifier);
              if (geometry) {
                const pendingValues = pendingObjects.get(geometry) || {};
                pendingValues['morphWeights'] = [...value];
                pendingObjects.set(geometry, pendingValues);
              }
            }
            return;
          }
          node.updateMatrix();
          hierarchyChanged = true;
        }
      };
    }

    if (target.type === 'sampler') {
      const sampler = bindings.samplers?.get(target.identifier);
      if (!sampler) {
        return null;
      }
      const initialTransform = track.baseTransform || {
        offset: [0, 0] as const,
        rotation: 0,
        scale: [1, 1] as const
      };
      let transform = samplerTransforms.get(target.identifier);
      if (!transform) {
        transform = {
          offset: [...initialTransform.offset],
          rotation: initialTransform.rotation,
          scale: [...initialTransform.scale]
        };
        samplerTransforms.set(target.identifier, transform);
      }
      const samplerTransform = transform;
      return {
        id: bindingIdentifier,
        setValue: value => {
          if (target.path === 'rotation') {
            samplerTransform.rotation = value[0];
          } else if (target.path === 'offset' || target.path === 'scale') {
            if (target.component !== undefined) {
              samplerTransform[target.path][target.component] = value[0];
            } else {
              samplerTransform[target.path] = [value[0], value[1]];
            }
          }
          const pendingValues = pendingObjects.get(sampler) || {};
          pendingValues['transform'] = getTextureTransformMatrix(samplerTransform);
          pendingObjects.set(sampler, pendingValues);
        }
      };
    }

    const object =
      target.type === 'instance'
        ? bindings.instances.get(target.identifier)
        : target.type === 'material'
          ? bindings.materials?.get(target.identifier)
          : target.type === 'light'
            ? bindings.lights?.get(target.identifier)
            : target.type === 'camera'
              ? bindings.camera
              : undefined;
    if (!object) {
      return null;
    }

    return {
      id: bindingIdentifier,
      getValue: () => {
        const currentValue = (object.getParameters() as Record<string, unknown>)[target.path];
        if (Array.isArray(currentValue)) {
          return target.component === undefined
            ? currentValue
            : [currentValue[target.component] || 0];
        }
        return typeof currentValue === 'number' ? [currentValue] : [];
      },
      setValue: value => queueProperty(object, target, value)
    };
  };

  const clips = (description.clips || []).map(clip => {
    const tracks = clip.tracks.flatMap(track => {
      const binding = makeBinding(track);
      if (!binding) {
        return [];
      }
      return [
        new AnimationTrack({
          name: `${track.target.type}:${track.target.identifier}:${track.target.path}`,
          times: track.times,
          values: track.values,
          interpolation: track.interpolation,
          valueType:
            track.target.path === 'rotation' && track.target.type === 'node'
              ? 'quaternion'
              : 'vector',
          binding
        })
      ];
    });
    return new AnimationClip({name: clip.name, tracks, duration: clip.duration});
  });
  const mixer = new AnimationMixer(clips);
  let activeClip = description.playback?.clip || clips[0]?.name;
  if (activeClip) {
    const action = mixer.clipAction(activeClip, {
      loop: description.playback?.loop,
      timeScale: description.playback?.speed
    });
    action.play();
    if (description.playback?.playing === false) {
      action.pause();
    }
  }

  const queueNodeInstances = (identifier: string, parentTransform: Matrix4): void => {
    const node = nodes.get(identifier);
    if (!node) {
      return;
    }
    const transform = new Matrix4(parentTransform).multiplyRight(node.matrix);
    for (const instanceIdentifier of nodeDeclarations[identifier]?.instances || []) {
      const instance = bindings.instances.get(instanceIdentifier);
      if (instance) {
        const pendingValues = pendingObjects.get(instance) || {};
        pendingValues['transform'] = Array.from(transform);
        pendingObjects.set(instance, pendingValues);
      }
    }
    for (const [childIdentifier, declaration] of Object.entries(nodeDeclarations)) {
      if (declaration.parent === identifier) {
        queueNodeInstances(childIdentifier, transform);
      }
    }
  };

  const flush = (): void => {
    if (hierarchyChanged) {
      for (const [identifier, declaration] of Object.entries(nodeDeclarations)) {
        if (!declaration.parent) {
          queueNodeInstances(identifier, new Matrix4());
        }
      }
      hierarchyChanged = false;
    }

    for (const [object, values] of pendingObjects) {
      const committedValues = object.getParameters() as Record<string, unknown>;
      const changedValues = Object.fromEntries(
        Object.entries(values).filter(
          ([parameterName, value]) =>
            !areAnimationValuesEqual(committedValues[parameterName], value)
        )
      );
      if (Object.keys(changedValues).length === 0) {
        continue;
      }
      if (object.type === 'geometry') {
        (object as ANARIGeometry).setParameters(changedValues as Partial<ANARIGeometryParameters>);
      } else if (object.type === 'material') {
        (object as ANARIMaterial).setParameters(changedValues as Partial<ANARIMaterialParameters>);
      } else if (object.type === 'light') {
        (object as ANARILight).setParameters(changedValues as Partial<ANARILightParameters>);
      } else if (object.type === 'camera') {
        (object as ANARICamera).setParameters(changedValues as Partial<ANARICameraParameters>);
      } else if (object.type === 'sampler') {
        (object as ANARISampler).setParameter(
          'transform',
          changedValues['transform'] as NumberArray9
        );
      } else if (object.type === 'instance') {
        (object as ANARIInstance).setParameter('transform', changedValues['transform'] as number[]);
      }
      object.commitParameters();
    }
    pendingObjects.clear();
  };

  return {
    mixer,
    clipNames: clips.map(clip => clip.name),
    get activeClip(): string | undefined {
      return activeClip;
    },
    update(timeSeconds: number): void {
      const elapsedSeconds =
        previousTimeSeconds === undefined ? 0 : timeSeconds - previousTimeSeconds;
      previousTimeSeconds = timeSeconds;
      mixer.update(elapsedSeconds);
      flush();
    },
    selectClip(name: string): void {
      if (activeClip && activeClip !== name) {
        mixer.getAction(activeClip)?.stop();
      }
      activeClip = name;
      mixer.clipAction(name).play();
      flush();
    },
    play(): void {
      if (activeClip) {
        mixer.clipAction(activeClip).play();
      }
    },
    pause(): void {
      if (activeClip) {
        mixer.clipAction(activeClip).pause();
      }
    },
    seek(timeSeconds: number): void {
      const action = activeClip ? mixer.getAction(activeClip) : undefined;
      if (action) {
        action.setTime(timeSeconds);
        mixer.time = timeSeconds;
        mixer.update(0);
      } else {
        mixer.setTime(timeSeconds);
      }
      flush();
    },
    setSpeed(speed: number): void {
      if (activeClip) {
        mixer.clipAction(activeClip).setEffectiveTimeScale(speed);
      }
    }
  };
}

function areAnimationValuesEqual(previousValue: unknown, nextValue: unknown): boolean {
  if (Array.isArray(previousValue) && Array.isArray(nextValue)) {
    return (
      previousValue.length === nextValue.length &&
      previousValue.every((value, index) => value === nextValue[index])
    );
  }
  return previousValue === nextValue;
}

function makeAnimationTracks(
  channel: GLTFAnimationChannel,
  mappings: ANARIGLTFAnimationMappings
): ANARIAnimationTrackDescription[] {
  let target: ANARIAnimationTarget;
  let baseTransform: ANARIAnimationTrackDescription['baseTransform'];

  if (channel.type === 'node') {
    target = {
      type: 'node',
      identifier: mappings.nodeIdentifiers?.[channel.targetNodeId] || channel.targetNodeId,
      path: channel.path
    };
  } else if (channel.type === 'material') {
    const identifier = mappings.materialIdentifiers?.[channel.targetMaterialIndex];
    if (!identifier) {
      return [];
    }
    const isOpacityComponent = channel.property === 'baseColorFactor' && channel.component === 3;
    if (
      isOpacityComponent &&
      mappings.materialAlphaModes?.[channel.targetMaterialIndex] === 'OPAQUE'
    ) {
      return [];
    }
    const isPackedScalar =
      channel.property === 'metallicRoughnessValues' ||
      channel.property === 'iridescenceThicknessRange' ||
      isOpacityComponent;
    const path = isOpacityComponent
      ? 'opacity'
      : channel.property === 'metallicRoughnessValues'
        ? channel.component === 0
          ? 'metallic'
          : 'roughness'
        : channel.property === 'iridescenceThicknessRange'
          ? channel.component === 0
            ? 'iridescenceThicknessMinimum'
            : 'iridescenceThicknessMaximum'
          : MATERIAL_PROPERTY_NAMES[channel.property];
    if (!path) {
      return [];
    }
    target = {
      type: 'material',
      identifier,
      path,
      ...(channel.component !== undefined && !isPackedScalar ? {component: channel.component} : {})
    };
  } else if (channel.type === 'textureTransform') {
    const identifier =
      mappings.samplerIdentifiers?.[`${channel.targetMaterialIndex}:${channel.textureSlot}`];
    if (!identifier) {
      return [];
    }
    target = {
      type: 'sampler',
      identifier,
      path: channel.path,
      ...(channel.component !== undefined ? {component: channel.component} : {})
    };
    baseTransform = {
      offset: [...channel.baseTransform.offset],
      rotation: channel.baseTransform.rotation,
      scale: [...channel.baseTransform.scale]
    };
  } else {
    // Camera and punctual-light pointers remain format-owned until explicitly adapted.
    return [];
  }

  const interpolation = channel.sampler.interpolation as ANARIAnimationInterpolation;
  const track: ANARIAnimationTrackDescription = {
    target,
    times: [...channel.sampler.input],
    values: channel.sampler.output.map(value => [...value]),
    ...(interpolation !== 'LINEAR' ? {interpolation} : {}),
    ...(baseTransform ? {baseTransform} : {})
  };
  const includesAnimatedOpacity =
    channel.type === 'material' &&
    channel.property === 'baseColorFactor' &&
    channel.component === undefined &&
    channel.sampler.output.every(value => value.length > 3) &&
    mappings.materialAlphaModes?.[channel.targetMaterialIndex] !== 'OPAQUE';
  if (!includesAnimatedOpacity) {
    return [track];
  }
  return [
    track,
    {
      ...track,
      target: {...target, path: 'opacity'},
      values: channel.sampler.output.map(value => [value[3]])
    }
  ];
}

export type {AnimationLoopMode};
