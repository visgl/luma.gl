// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import type {GLTFNodePostprocessed, GLTFPostprocessed} from '../types/gltf-postprocessed-schema';
import type {Light} from '@luma.gl/shaders';
import {
  makePunctualLight,
  type PunctualLightBinding,
  type PunctualLightDefinition
} from '../../scenegraph/controllers/punctual-light-controller';
import type {ScenegraphNode} from '../../scenegraph/scenegraph-node';

/** Resolves source light references to paths of runtime nodes during import. */
export function bindGLTFPunctualLights(
  nodes: GLTFNodePostprocessed[],
  runtimeNodes: ReadonlyMap<string, ScenegraphNode>,
  definitions: readonly PunctualLightDefinition[]
): PunctualLightBinding[] {
  if (!definitions.length) return [];
  const parents = createParentNodeMap(nodes);
  const bindings: PunctualLightBinding[] = [];
  for (const node of nodes) {
    const lightIndex = getLightIndex(node);
    const definition = lightIndex === undefined ? undefined : definitions[lightIndex];
    if (!definition) continue;
    const path: ScenegraphNode[] = [];
    let source: GLTFNodePostprocessed | undefined = node;
    while (source && path.length < nodes.length) {
      const runtime = runtimeNodes.get(source.id);
      if (!runtime) break;
      path.push(runtime);
      source = parents.get(source.id);
    }
    if (!source) bindings.push({path: path.reverse(), definition});
  }
  return bindings;
}

function getLightIndex(node: GLTFNodePostprocessed): number | undefined {
  return (
    (node as GLTFNodePostprocessed & {light?: number}).light ??
    node.extensions?.['KHR_lights_punctual']?.light
  );
}

export type ParseGLTFLightsOptions = {
  /** Restricts authored lights to nodes belonging to the selected scene hierarchy. */
  nodeIdentifiers?: ReadonlySet<string>;
  /** When true, parsed light colors are converted into luma.gl's legacy byte-style range. */
  useByteColors?: boolean;
  /** Optional live scenegraph visibility used for animated `KHR_node_visibility` updates. */
  nodeVisibility?: ReadonlyMap<string, {display: boolean}>;
  /** Optional mutable light definitions used by typed punctual-light animation pointers. */
  lightDefinitions?: readonly Record<string, any>[];
};

/** Parse KHR_lights_punctual extension into luma.gl light definitions */
export function parseGLTFLights(
  gltf: GLTFPostprocessed,
  options: ParseGLTFLightsOptions = {}
): Light[] {
  const lightDefs =
    options.lightDefinitions ||
    // `postProcessGLTF()` moves KHR_lights_punctual into `gltf.lights`.
    (gltf as GLTFPostprocessed & {lights?: any[]}).lights ||
    gltf.extensions?.['KHR_lights_punctual']?.['lights'];
  if (!lightDefs || !Array.isArray(lightDefs) || lightDefs.length === 0) {
    return [];
  }

  const lights: Light[] = [];
  const parentNodeById = createParentNodeMap(gltf.nodes || []);
  const worldMatrixByNodeId = new Map<string, Matrix4>();

  for (const node of gltf.nodes || []) {
    if (!isNodeVisible(node, parentNodeById, options.nodeVisibility)) {
      continue;
    }

    const lightIndex = getLightIndex(node);
    if (
      typeof lightIndex !== 'number' ||
      (options.nodeIdentifiers && !options.nodeIdentifiers.has(node.id))
    ) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const gltfLight = lightDefs[lightIndex];
    if (!gltfLight) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const worldMatrix = getNodeWorldMatrix(node, parentNodeById, worldMatrixByNodeId);
    const light = makePunctualLight(gltfLight, worldMatrix, options.useByteColors ?? true);
    if (light) lights.push(light);
  }

  return lights;
}

/** Applies source-authored or live visibility recursively through a punctual light's parent chain. */
function isNodeVisible(
  node: GLTFNodePostprocessed,
  parentNodeById: ReadonlyMap<string, GLTFNodePostprocessed>,
  liveNodeVisibility?: ReadonlyMap<string, {display: boolean}>
): boolean {
  let currentNode: GLTFNodePostprocessed | undefined = node;
  while (currentNode) {
    const liveNode = liveNodeVisibility?.get(currentNode.id);
    if (
      liveNode
        ? !liveNode.display
        : currentNode.extensions?.['KHR_node_visibility']?.visible === false
    ) {
      return false;
    }
    currentNode = parentNodeById.get(currentNode.id);
  }
  return true;
}

/**
 * Builds a parent lookup so punctual lights can be resolved in world space.
 */
function createParentNodeMap(nodes: GLTFNodePostprocessed[]): Map<string, GLTFNodePostprocessed> {
  const parentNodeById = new Map<string, GLTFNodePostprocessed>();

  for (const node of nodes) {
    for (const childNode of node.children || []) {
      parentNodeById.set(childNode.id, node);
    }
  }

  return parentNodeById;
}

/**
 * Resolves a glTF node's world matrix from its local transform and parent chain.
 */
function getNodeWorldMatrix(
  node: GLTFNodePostprocessed,
  parentNodeById: Map<string, GLTFNodePostprocessed>,
  worldMatrixByNodeId: Map<string, Matrix4>
): Matrix4 {
  const cachedWorldMatrix = worldMatrixByNodeId.get(node.id);
  if (cachedWorldMatrix) {
    return cachedWorldMatrix;
  }

  const localMatrix = getNodeLocalMatrix(node);
  const parentNode = parentNodeById.get(node.id);
  const worldMatrix = parentNode
    ? new Matrix4(
        getNodeWorldMatrix(parentNode, parentNodeById, worldMatrixByNodeId)
      ).multiplyRight(localMatrix)
    : localMatrix;

  worldMatrixByNodeId.set(node.id, worldMatrix);
  return worldMatrix;
}

/**
 * Resolves a glTF node's local matrix from its matrix or TRS components.
 */
function getNodeLocalMatrix(node: GLTFNodePostprocessed): Matrix4 {
  if (node.matrix) {
    return new Matrix4(node.matrix);
  }

  const matrix = new Matrix4();

  if (node.translation) {
    matrix.translate(node.translation);
  }

  if (node.rotation) {
    matrix.multiplyRight(new Matrix4().fromQuaternion(node.rotation));
  }

  if (node.scale) {
    matrix.scale(node.scale);
  }

  return matrix;
}
