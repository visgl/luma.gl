// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  GLTFAccessorPostprocessed,
  GLTFMeshPostprocessed,
  GLTFNodePostprocessed,
  GLTFPostprocessed
} from '@loaders.gl/gltf';
import {assert} from '@luma.gl/core';
import {simplifyMesh, type MeshSimplificationAttribute} from '@luma.gl/engine';

const DEFAULT_LOD_RATIOS = [0.5, 0.25] as const;
const DEFAULT_SCREEN_COVERAGE = [0.5, 0.2, 0.01] as const;
const LOD_EXTENSION_NAME = 'MSFT_lod';

/** One authored or generated node level, ordered from highest to lowest detail. */
export type GLTFNodeLODLevel = {
  /** Zero-based detail level; zero is the original highest-quality scene node. */
  level: number;
  /** Index into the postprocessed document's node array. */
  nodeIndex: number;
  /** Original postprocessed node, including its mesh, material, and optional skin. */
  node: GLTFNodePostprocessed;
  /** Minimum projected screen coverage before the next lower level is selected. */
  screenCoverage: number;
};

/** Options for deriving lower-detail glTF meshes without changing source vertex attributes. */
export type GenerateGLTFLODLevelsOptions = {
  /** Target index-count fractions, ordered from highest to lowest detail. */
  ratios?: readonly number[];
  /** Optional screen-coverage thresholds, including the original highest-detail level. */
  screenCoverage?: readonly number[];
  /** Keep chart boundaries fixed. Defaults to false so distant faceted meshes can simplify. */
  preserveBoundary?: boolean;
};

/**
 * Resolves vendor-authored `MSFT_lod` node levels and optional screen-coverage thresholds.
 *
 * Material-level LOD extensions are not interpreted by this node-specific helper.
 */
export function getGLTFNodeLODs(
  gltf: GLTFPostprocessed,
  source: number | GLTFNodePostprocessed
): GLTFNodeLODLevel[] | null {
  const sourceNodeIndex =
    typeof source === 'number' ? source : gltf.nodes.findIndex(node => node === source);
  const sourceNode = gltf.nodes[sourceNodeIndex];
  if (!sourceNode) {
    return null;
  }

  const extension = sourceNode.extensions?.[LOD_EXTENSION_NAME] as {ids?: unknown} | undefined;
  if (!extension) {
    return null;
  }

  // LOD alternatives must be a nonempty, acyclic list of existing node indices.
  assert(Array.isArray(extension.ids) && extension.ids.length > 0);
  const nodeIndices = [sourceNodeIndex, ...extension.ids];
  const uniqueNodeIndices = new Set<number>();
  for (const nodeIndex of nodeIndices) {
    assert(
      Number.isSafeInteger(nodeIndex) &&
        nodeIndex >= 0 &&
        nodeIndex < gltf.nodes.length &&
        !uniqueNodeIndices.has(nodeIndex)
    );
    uniqueNodeIndices.add(nodeIndex);
  }

  const authoredCoverage = sourceNode.extras?.['MSFT_screencoverage'];
  const screenCoverage = resolveScreenCoverage(
    nodeIndices.length,
    Array.isArray(authoredCoverage) ? authoredCoverage : undefined
  );

  return nodeIndices.map((nodeIndex, level) => ({
    level,
    nodeIndex,
    node: gltf.nodes[nodeIndex],
    screenCoverage: screenCoverage[level]
  }));
}

/**
 * Produces an independent postprocessed document with generated index-only `MSFT_lod` levels.
 *
 * Original vertex accessors, materials, skins, morph targets, and animation tracks remain shared
 * and immutable. Only lower-detail index accessors, meshes, and detached alternative nodes are
 * allocated. Existing authored node levels are preserved unchanged.
 */
export function generateGLTFLODLevels(
  gltf: GLTFPostprocessed,
  options: GenerateGLTFLODLevelsOptions = {}
): GLTFPostprocessed {
  const ratios = options.ratios || DEFAULT_LOD_RATIOS;
  if (ratios.length === 0) {
    return gltf;
  }

  // Detail ratios must strictly decrease and describe fractions of the original index count.
  let previousRatio = 1;
  for (const ratio of ratios) {
    assert(Number.isFinite(ratio) && ratio > 0 && ratio < previousRatio);
    previousRatio = ratio;
  }

  const sourceNodeIndices = new Map(gltf.nodes.map((node, index) => [node, index]));
  const reachableNodeIndices = getReachableNodeIndices(gltf, sourceNodeIndices);
  const nodes: GLTFNodePostprocessed[] = gltf.nodes.map(node => ({
    ...node,
    ...(node.extensions ? {extensions: {...node.extensions}} : {}),
    ...(node.extras ? {extras: {...node.extras}} : {})
  }));
  const meshes = [...gltf.meshes];
  const accessors = [...gltf.accessors];

  for (const [nodeIndex, originalNode] of gltf.nodes.entries()) {
    if (originalNode.children) {
      nodes[nodeIndex].children = originalNode.children.map(
        child => nodes[sourceNodeIndices.get(child)!]
      );
    }
  }

  let hasGeneratedLevels = false;
  for (const [nodeIndex, originalNode] of gltf.nodes.entries()) {
    if (
      !reachableNodeIndices.has(nodeIndex) ||
      !originalNode.mesh ||
      originalNode.extensions?.[LOD_EXTENSION_NAME]
    ) {
      continue;
    }

    const alternativeNodeIndices: number[] = [];
    for (const [ratioIndex, targetRatio] of ratios.entries()) {
      const simplifiedMesh = simplifyGLTFMesh(
        originalNode.mesh,
        accessors,
        targetRatio,
        `${nodeIndex}-${ratioIndex + 1}`,
        options.preserveBoundary ?? false
      );
      if (!simplifiedMesh) {
        continue;
      }

      meshes.push(simplifiedMesh);
      const alternativeNodeIndex = nodes.length;
      alternativeNodeIndices.push(alternativeNodeIndex);
      nodes.push({
        ...originalNode,
        id: `${originalNode.id}-lod-${ratioIndex + 1}`,
        name: `${originalNode.name || originalNode.id} LOD ${ratioIndex + 1}`,
        mesh: simplifiedMesh,
        children: undefined,
        extensions: undefined,
        extras: {geometricError: simplifiedMesh.extras?.['geometricError']}
      });
    }

    if (alternativeNodeIndices.length > 0) {
      const sourceNode = nodes[nodeIndex];
      sourceNode.extensions = {
        ...sourceNode.extensions,
        [LOD_EXTENSION_NAME]: {ids: alternativeNodeIndices}
      };
      sourceNode.extras = {
        ...sourceNode.extras,
        MSFT_screencoverage: resolveScreenCoverage(
          alternativeNodeIndices.length + 1,
          options.screenCoverage
        )
      };
      hasGeneratedLevels = true;
    }
  }

  if (!hasGeneratedLevels) {
    return gltf;
  }

  const scenes = gltf.scenes.map(scene => ({
    ...scene,
    nodes: scene.nodes?.map(node => nodes[sourceNodeIndices.get(node)!])
  }));
  const sceneIndex = gltf.scene ? gltf.scenes.indexOf(gltf.scene) : -1;

  return {
    ...gltf,
    nodes,
    meshes,
    accessors,
    scenes,
    ...(sceneIndex >= 0 ? {scene: scenes[sceneIndex]} : {}),
    extensionsUsed: [...new Set([...(gltf.extensionsUsed || []), LOD_EXTENSION_NAME])]
  };
}

function getReachableNodeIndices(
  gltf: GLTFPostprocessed,
  sourceNodeIndices: ReadonlyMap<GLTFNodePostprocessed, number>
): Set<number> {
  const reachableNodeIndices = new Set<number>();
  const pendingNodes = gltf.scenes.flatMap(scene => scene.nodes || []);

  for (const node of pendingNodes) {
    const nodeIndex = sourceNodeIndices.get(node);
    if (nodeIndex === undefined || reachableNodeIndices.has(nodeIndex)) {
      continue;
    }
    reachableNodeIndices.add(nodeIndex);
    pendingNodes.push(...(node.children || []));
  }

  return reachableNodeIndices;
}

function simplifyGLTFMesh(
  sourceMesh: GLTFMeshPostprocessed,
  accessors: GLTFAccessorPostprocessed[],
  targetRatio: number,
  suffix: string,
  preserveBoundary: boolean
): GLTFMeshPostprocessed | null {
  let hasReducedPrimitive = false;
  let geometricError = 0;
  const primitives = sourceMesh.primitives.map((primitive, primitiveIndex) => {
    const positions = primitive.attributes['POSITION'];
    if (!positions || (primitive.mode !== undefined && primitive.mode !== 4)) {
      return primitive;
    }

    const sourceIndices = getPrimitiveIndices(primitive.indices, positions.count);
    if (!sourceIndices || sourceIndices.length < 6) {
      return primitive;
    }

    const attributes: MeshSimplificationAttribute[] = [];
    for (const semantic of [
      'NORMAL',
      'TEXCOORD_0',
      'TEXCOORD_1',
      'JOINTS_0',
      'WEIGHTS_0',
      'JOINTS_1',
      'WEIGHTS_1'
    ]) {
      const attribute = primitive.attributes[semantic];
      if (attribute) {
        attributes.push({values: attribute.value, size: attribute.components});
      }
    }

    const simplified = simplifyMesh({
      positions: positions.value,
      indices: sourceIndices,
      targetRatio,
      attributes,
      preserveBoundary
    });
    if (simplified.indices.length >= sourceIndices.length || simplified.indices.length < 3) {
      return primitive;
    }

    hasReducedPrimitive = true;
    geometricError = Math.max(geometricError, simplified.geometricError);
    const indexAccessor: GLTFAccessorPostprocessed = {
      ...(primitive.indices || {
        components: 1,
        bytesPerComponent: simplified.indices.BYTES_PER_ELEMENT,
        bytesPerElement: simplified.indices.BYTES_PER_ELEMENT,
        type: 'SCALAR'
      }),
      id: `${primitive.indices?.id || sourceMesh.id}-lod-${suffix}-${primitiveIndex}`,
      componentType: getIndexComponentType(simplified.indices),
      count: simplified.indices.length,
      value: simplified.indices,
      byteOffset: 0,
      bufferView: undefined,
      min: undefined,
      max: undefined
    };
    accessors.push(indexAccessor);

    return {...primitive, indices: indexAccessor};
  });

  if (!hasReducedPrimitive) {
    return null;
  }

  return {
    ...sourceMesh,
    id: `${sourceMesh.id}-lod-${suffix}`,
    name: `${sourceMesh.name || sourceMesh.id} LOD ${suffix}`,
    primitives,
    extras: {...sourceMesh.extras, geometricError}
  };
}

function getPrimitiveIndices(
  accessor: GLTFAccessorPostprocessed | undefined,
  vertexCount: number
): Uint8Array | Uint16Array | Uint32Array | null {
  if (accessor) {
    const indices = accessor.value;
    return indices instanceof Uint8Array ||
      indices instanceof Uint16Array ||
      indices instanceof Uint32Array
      ? indices
      : null;
  }

  if (vertexCount < 3) {
    return null;
  }
  const indices =
    vertexCount <= 65535 ? new Uint16Array(vertexCount) : new Uint32Array(vertexCount);
  for (let index = 0; index < vertexCount; index++) {
    indices[index] = index;
  }
  return indices;
}

function getIndexComponentType(indices: Uint8Array | Uint16Array | Uint32Array): number {
  return indices instanceof Uint8Array ? 5121 : indices instanceof Uint16Array ? 5123 : 5125;
}

function resolveScreenCoverage(levelCount: number, authored?: readonly number[]): number[] {
  return Array.from({length: levelCount}, (_, level) => {
    const value =
      authored?.[level] ??
      DEFAULT_SCREEN_COVERAGE[level] ??
      DEFAULT_SCREEN_COVERAGE[DEFAULT_SCREEN_COVERAGE.length - 1] / 2 ** (level - 2);
    // Screen-coverage thresholds must be finite positive fractions.
    assert(Number.isFinite(value) && value > 0 && value <= 1);
    return value;
  });
}
