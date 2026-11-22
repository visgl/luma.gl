// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {GroupNode} from '../../scenegraph/group-node';
import type {GLTFWithBuffers} from '../types/gltf-types';
import {postProcessGLTF} from '../parsers/post-process-gltf';
import type {ParseGLTFOptions} from '../parsers/parse-gltf';
import {createScenegraphsFromGLTF, type GLTFScenegraphs} from './create-scenegraph-from-gltf';

/** One independently instantiated glTF document in the composed tree. */
export type GLTFSceneInstance = {
  /** The document's own scenegraph, animation, joint and skin controllers. */
  readonly scenegraphs: GLTFScenegraphs;
  /** Decoded source with original document-local indices. */
  readonly source: GLTFWithBuffers;
  /** Selected scene container; its root nodes are mounted under the referencing node. */
  readonly scene: GroupNode;
  /** The node that references this instance, or null for the root document. */
  readonly mount: GroupNode | null;
};

/** An owned scene composition with independent document-local runtime instances. */
export type GLTFSceneComposition = {
  /** Root scene and its source document. */
  readonly root: GLTFSceneInstance;
  /** Runtime instances in the order their mounts were resolved. */
  readonly instances: readonly GLTFSceneInstance[];
  /** Detach and dispose all scenegraph instances exactly once. */
  destroy(): void;
};

/** Instantiate decoded glTF 2.1 external assets using the normal scenegraph parser. */
export function createComposedScenegraphsFromGLTF(
  device: Device,
  source: GLTFWithBuffers,
  options?: ParseGLTFOptions
): GLTFSceneComposition {
  /** Own each runtime instance once, even when decoded resources are shared. */
  const instances: GLTFSceneInstance[] = [];
  /** Reuse postprocessing for repeated references while keeping their runtime state separate. */
  const documents = new Map<GLTFWithBuffers, ReturnType<typeof postProcessGLTF>>();
  /** Protect callers that supply a manually linked document graph. */
  const ancestors = new Set<GLTFWithBuffers>();

  /** Detach each nested scene before destroying the render resources it owns. */
  const destroy = () => {
    for (const {mount, scene, scenegraphs} of instances.splice(0).reverse()) {
      if (mount) for (const node of scene.children) mount.remove(node);
      scenegraphs.destroy();
    }
  };

  /** Select each asset's scene and mount separate runtime instances for references in that scene. */
  const instantiate = (asset: GLTFWithBuffers, mount: GroupNode | null): GLTFSceneInstance => {
    if (ancestors.has(asset)) throw new Error('glTF external asset cycle');
    if (ancestors.size >= 64) throw new Error('glTF external asset nesting exceeds 64 documents');
    ancestors.add(asset);
    /** Retain original source indices for physics, animation pointers and nested asset references. */
    const document = documents.get(asset) ?? postProcessGLTF(asset);
    documents.set(asset, document);
    /** Only mount an asset's default scene, or its first scene if none is named. */
    const sceneIndex = asset.json.scene ?? 0;
    if (!document.scenes[sceneIndex]) throw new Error('glTF external asset has no selected scene');
    /** Keep document-local physics and animation binding scope for each instance. */
    const scenegraphs = createScenegraphsFromGLTF(device, document, options);
    /** The selected scene can be linked only after parsing its independent runtime bundle. */
    const scene = scenegraphs.scenes[sceneIndex];
    /** Track ownership before mounting so failure can always dispose this instance. */
    const instance = {scenegraphs, source: asset, scene, mount};
    instances.push(instance);
    mount?.add(scene.children);

    /** Snapshot reachable nodes before external scenes are attached. */
    const reachable = new Set<object>();
    scene.preorderTraversal(node => reachable.add(node));
    for (const [index, node] of scenegraphs.gltfNodeIndexToNodeMap) {
      /** External-asset indices are scoped to the referencing document. */
      const externalIndex = asset.json.nodes?.[index]?.externalAsset;
      if (externalIndex === undefined || !reachable.has(node)) continue;
      /** Decoding belongs to the loader, including URI alias and embedded buffer handling. */
      const external = asset.externalAssets?.[externalIndex];
      if (!external) throw new Error(`glTF external asset ${externalIndex} is unresolved`);
      // The draft defines a scene-less or default-less reference as having no children to attach.
      if (external.json.scene !== undefined) instantiate(external, node);
    }
    ancestors.delete(asset);
    return instance;
  };

  try {
    /** Establish one disposal boundary for the root and all nested instances. */
    const root = instantiate(source, null);
    return {root, instances, destroy};
  } catch (error) {
    destroy();
    throw error;
  }
}
