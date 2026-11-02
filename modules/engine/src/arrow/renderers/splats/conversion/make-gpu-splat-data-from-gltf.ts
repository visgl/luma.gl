// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GroupNode} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {makeVector} from 'apache-arrow';
import type {GLTFPostprocessed} from '@luma.gl/engine/gltf';
import {
  loadGPUSplatDataFromGLTF,
  type GLTFSplatPrimitive,
  type GPUSplatData,
  type LoadGPUSplatDataFromGLTFOptions
} from '@luma.gl/engine/splats';
import {
  makeGPUSplatDataFromArrow,
  type GPUSplatArrowSource,
  type GPUSplatArrowTableLike
} from './make-gpu-splat-data-from-arrow';

/** GPU batches prepared from one glTF mesh primitive. */
export type GLTFSplatBatchGroup = {
  /** Source mesh index, shared by all node instances of this mesh. */
  meshIndex: number;
  /** Source primitive index within the mesh. */
  primitiveIndex: number;
  /** Ordered, independently owned batches; the caller must destroy them. */
  batches: GPUSplatData[];
};

/**
 * Prepares loader-decoded Arrow splats and uncompressed glTF splat attributes.
 * The returned identity refers to mesh primitives, not scene-node instances. The caller owns
 * the returned GPU batches and must apply each node's transform when drawing them.
 */
export async function makeGPUSplatDataFromGLTFScene(
  device: Device,
  gltf: GLTFPostprocessed,
  options: LoadGPUSplatDataFromGLTFOptions = {}
): Promise<GLTFSplatBatchGroup[]> {
  const groups: GLTFSplatBatchGroup[] = [];
  let sourceBatchIndex = options.sourceBatchIndex ?? 0;
  let rowIndexBase = options.rowIndexBase ?? 0;
  try {
    for (const [meshIndex, mesh] of gltf.meshes.entries()) {
      for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
        if (!primitive.extensions?.KHR_gaussian_splatting) continue;
        options.signal?.throwIfAborted();
        const descriptor = gltf.gaussianSplatPrimitives?.find(
          item => item.meshIndex === meshIndex && item.primitiveIndex === primitiveIndex
        );
        let batches: GPUSplatData[];
        let consumedSourceBatches = 1;
        const firstSourceBatchIndex = sourceBatchIndex;
        if (descriptor?.decoded !== undefined) {
          const extension = primitive.extensions.KHR_gaussian_splatting;
          if (
            primitive.mode !== 0 ||
            extension.kernel !== 'ellipse' ||
            extension.colorSpace !== 'lin_rec709_display' ||
            (extension.projection !== undefined && extension.projection !== 'perspective') ||
            (extension.sortingMethod !== undefined && extension.sortingMethod !== 'cameraDistance')
          ) {
            throw new Error('Unsupported decoded glTF Gaussian splat primitive');
          }
          if (
            typeof descriptor.decoded !== 'object' ||
            descriptor.decoded === null ||
            !('data' in descriptor.decoded) ||
            !('shape' in descriptor.decoded) ||
            descriptor.decoded.shape !== 'arrow-table'
          ) {
            throw new Error('Decoded glTF splats require a Mesh Arrow table');
          }
          // Decoded data is a loader result, not a glTF accessor-bearing primitive.
          const decoded = descriptor.decoded as GPUSplatArrowSource & {
            data: GPUSplatArrowTableLike;
          };
          if (!decoded.data || !Array.isArray(decoded.data.batches)) {
            throw new Error('Decoded glTF splats require a Mesh Arrow table');
          }
          consumedSourceBatches = decoded.data.batches.length;
          const declaredFeature = primitive.extensions?.EXT_mesh_features?.featureIds?.find(
            (feature: {attribute?: number}) => feature.attribute !== undefined
          );
          const featureName =
            options.featureIdAttribute ??
            (declaredFeature ? `_FEATURE_ID_${declaredFeature.attribute}` : undefined);
          let source: GPUSplatArrowSource = decoded;
          if (featureName) {
            const accessor = primitive.attributes[featureName];
            const values = accessor?.value;
            if (
              accessor?.normalized ||
              !(
                values instanceof Uint8Array ||
                values instanceof Uint16Array ||
                values instanceof Uint32Array
              )
            ) {
              throw new Error('glTF Gaussian splat feature IDs must be unsigned integers');
            }
            if (values.length !== decoded.data.numRows) {
              throw new Error('glTF Gaussian splat feature-ID count does not match decoded splats');
            }
            let offset = 0;
            const recordBatches = decoded.data.batches.map(recordBatch => {
              const ids = values.subarray(offset, offset + recordBatch.numRows);
              offset += recordBatch.numRows;
              const vector = makeVector(ids);
              return {
                numRows: recordBatch.numRows,
                schema: recordBatch.schema,
                getChild: (name: string) =>
                  name === '__gltf_feature_id' ? vector : recordBatch.getChild(name)
              };
            });
            const table = {
              numRows: decoded.data.numRows,
              schema: decoded.data.schema,
              batches: recordBatches,
              getChild: (name: string) => decoded.data.getChild(name)
            };
            source = {...decoded, data: table};
          }
          batches = makeGPUSplatDataFromArrow(device, source, {
            sourceBatchIndex,
            rowIndexBase,
            maxSphericalHarmonicsDegree: options.maxSphericalHarmonicsDegree,
            ...(featureName ? {semanticColumn: '__gltf_feature_id'} : {})
          });
        } else {
          const batch = await loadGPUSplatDataFromGLTF(
            device,
            primitive as unknown as GLTFSplatPrimitive,
            {...options, sourceBatchIndex, rowIndexBase}
          );
          batches = [batch];
        }
        groups.push({meshIndex, primitiveIndex, batches});
        options.signal?.throwIfAborted();
        for (const batch of batches) {
          sourceBatchIndex = batch.sourceBatchIndex + 1;
          rowIndexBase = batch.rowIndexBase + batch.rowCount;
        }
        sourceBatchIndex = Math.max(
          sourceBatchIndex,
          firstSourceBatchIndex + consumedSourceBatches
        );
      }
    }
    return groups;
  } catch (error) {
    for (const group of groups) for (const batch of group.batches) batch.destroy();
    throw error;
  }
}

/** A mesh primitive's splat batches placed by one visible glTF node in one scene. */
export type GLTFSplatInstance = {
  /** Source scene index. */
  sceneIndex: number;
  /** Source node index. */
  nodeIndex: number;
  /** Source mesh and primitive indices and their borrowed batches. */
  group: GLTFSplatBatchGroup;
  /** Current column-major world transform, including the complete ancestor hierarchy. */
  worldMatrix: Float32Array;
};

/** Resolves visible instances without baking node transforms into borrowed splat data. */
export function getGLTFSplatSceneInstances(
  scenegraphs: import('@luma.gl/engine/gltf').GLTFScenegraphs,
  groups: readonly GLTFSplatBatchGroup[]
): GLTFSplatInstance[] {
  const instances: GLTFSplatInstance[] = [];
  const nodeIndices = new Map(
    Array.from(scenegraphs.gltfNodeIndexToNodeMap, ([index, node]) => [node, index])
  );
  for (const [sceneIndex, scene] of scenegraphs.scenes.entries()) {
    const visit = (node: GroupNode, parent: Matrix4): void => {
      if (!node.display) return;
      const world = parent.clone().multiplyRight(node.matrix);
      const nodeIndex = nodeIndices.get(node);
      if (nodeIndex !== undefined) {
        const mesh = scenegraphs.gltf.nodes[nodeIndex]?.mesh;
        const meshIndex = mesh ? scenegraphs.gltf.meshes.indexOf(mesh) : -1;
        for (const group of groups) {
          if (group.meshIndex === meshIndex) {
            instances.push({sceneIndex, nodeIndex, group, worldMatrix: Float32Array.from(world)});
          }
        }
      }
      for (const child of node.children) {
        if (child instanceof GroupNode) visit(child, world);
      }
    };
    visit(scene, new Matrix4());
  }
  return instances;
}
