// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {deformPositions, type ScenegraphNode} from '@luma.gl/engine';
import type {
  GLTF,
  GLTFAccessor,
  GLTFBufferView,
  GLTFMesh,
  GLTFSkin
} from '../types/gltf-json-schema';

import {
  MAX_COLLISION_SNAPSHOT_VERTICES,
  MAX_COLLISION_SNAPSHOT_INDICES
} from './node-collision-geometry';
import {readPhysicsRotation, readPhysicsVector} from './physics-transforms';

/** Raw glTF access needed to snapshot collision meshes; compatible with loader scenegraphs. */
export type GLTFPhysicsMeshSource = {
  gltf: {json: Pick<GLTF, 'nodes'>};
  getMesh(index: number): GLTFMesh;
  getSkin(index: number): GLTFSkin;
  getAccessor(index: number): GLTFAccessor;
  getBufferView(index: number): GLTFBufferView;
  getTypedArrayForBufferView(index: number): Uint8Array;
};

/** Decode the initial mesh pose for geometry.node, before glTF postprocessing mutates indices. */
export function makeGLTFPhysicsMeshResolver(
  scenegraph: GLTFPhysicsMeshSource,
  liveNodes?: ReadonlyMap<number, ScenegraphNode>
) {
  const nodes = scenegraph.gltf.json.nodes ?? [];
  const parents = new Map<number, number>();
  for (const [parentIndex, node] of nodes.entries())
    for (const childIndex of node.children ?? []) {
      if (parents.has(childIndex)) throw new Error('Ambiguous skin hierarchy');
      parents.set(childIndex, parentIndex);
    }
  const worlds = new Map<number, Matrix4>();
  const visiting = new Set<number>();
  const worldMatrix = (nodeIndex: number): Matrix4 => {
    const cached = worlds.get(nodeIndex);
    if (cached) return cached;
    const node = nodes[nodeIndex];
    if (!node || visiting.has(nodeIndex)) throw new Error('Invalid skin hierarchy');
    visiting.add(nodeIndex);
    const live = liveNodes?.get(nodeIndex);
    const local = live
      ? new Matrix4(live.matrix)
      : node.matrix
        ? new Matrix4(node.matrix)
        : new Matrix4()
            .translate(readPhysicsVector(node.translation, [0, 0, 0]))
            .multiplyRight(new Matrix4().fromQuaternion(readPhysicsRotation(node.rotation)))
            .scale(readPhysicsVector(node.scale, [1, 1, 1]));
    const parentIndex = parents.get(nodeIndex);
    const world =
      parentIndex === undefined ? local : worldMatrix(parentIndex).clone().multiplyRight(local);
    visiting.delete(nodeIndex);
    worlds.set(nodeIndex, world);
    return world;
  };
  const cache = new Map<number, {positions: number[]; indices: number[]}>();
  return (nodeIndex: number) => {
    const cached = cache.get(nodeIndex);
    if (cached) return cached;
    const node = nodes[nodeIndex];
    if (!node || node.mesh === undefined) return undefined;
    const mesh = scenegraph.getMesh(node.mesh);
    const positions: number[] = [],
      indices: number[] = [];
    const weights = node.weights ?? mesh.weights ?? [];
    const skin = node.skin === undefined ? undefined : scenegraph.getSkin(node.skin);
    const inverseBinds =
      skin?.inverseBindMatrices === undefined
        ? undefined
        : readAccessor(scenegraph, skin.inverseBindMatrices, 'MAT4');
    const inverseMesh = skin ? worldMatrix(nodeIndex).clone().invert() : undefined;
    const jointMatrices = skin?.joints.map((jointIndex, index) => {
      const inverseBind = inverseBinds
        ? new Matrix4(inverseBinds.slice(index * 16, index * 16 + 16))
        : new Matrix4();
      return inverseMesh!.clone().multiplyRight(worldMatrix(jointIndex)).multiplyRight(inverseBind);
    });
    for (const primitive of mesh.primitives) {
      if (primitive.mode !== undefined && primitive.mode !== 4)
        throw new Error('Collision geometry requires triangle primitives');
      const positionsSource = readAccessor(scenegraph, primitive.attributes['POSITION'], 'VEC3');
      const targets = (primitive.targets ?? []).map(target =>
        target['POSITION'] === undefined
          ? new Float32Array(positionsSource.length)
          : new Float32Array(readAccessor(scenegraph, target['POSITION'], 'VEC3'))
      );
      const influences: {joints: number[]; weights: number[]}[] = [];
      if (jointMatrices)
        for (let setIndex = 0; primitive.attributes[`JOINTS_${setIndex}`] !== undefined; setIndex++)
          influences.push({
            joints: readAccessor(scenegraph, primitive.attributes[`JOINTS_${setIndex}`], 'VEC4'),
            weights: readAccessor(scenegraph, primitive.attributes[`WEIGHTS_${setIndex}`], 'VEC4')
          });
      const liveWeights = liveNodes?.get(nodeIndex)?.userData['morphWeights'];
      const vertices = deformPositions({
        positions: new Float32Array(positionsSource),
        targets,
        weights: Array.isArray(liveWeights) ? liveWeights : weights,
        jointMatrices,
        influences
      });
      const primitiveIndices =
        primitive.indices === undefined
          ? Array.from({length: vertices.length / 3}, (_, index) => index)
          : readAccessor(scenegraph, primitive.indices, 'SCALAR');
      if (primitiveIndices.length % 3) throw new Error('Invalid collision triangle index count');
      const referenced = new Set<number>();
      for (const index of primitiveIndices) {
        if (!Number.isSafeInteger(index) || index < 0 || index >= vertices.length / 3)
          throw new Error('Invalid collision triangle index');
        referenced.add(index);
      }
      if (
        positions.length / 3 + referenced.size > MAX_COLLISION_SNAPSHOT_VERTICES ||
        indices.length + primitiveIndices.length > MAX_COLLISION_SNAPSHOT_INDICES
      )
        throw new Error('Collision snapshot capacity exceeded');
      const remapped = new Map<number, number>();
      for (let vertex = 0; vertex < vertices.length / 3; vertex++) {
        if (!referenced.has(vertex)) continue;
        remapped.set(vertex, positions.length / 3);
        positions.push(vertices[vertex * 3], vertices[vertex * 3 + 1], vertices[vertex * 3 + 2]);
      }
      for (const index of primitiveIndices) indices.push(remapped.get(index)!);
    }
    const result = {positions, indices};
    cache.set(nodeIndex, result);
    return result;
  };
}

/** Decode strided, normalized and sparse accessors without modifying shared source buffers. */
function readAccessor(
  scenegraph: GLTFPhysicsMeshSource,
  accessorIndex: number,
  expectedType: string
): number[] {
  const accessor = scenegraph.getAccessor(accessorIndex);
  if (
    !Number.isSafeInteger(accessor.count) ||
    accessor.count < 0 ||
    accessor.count >
      (expectedType === 'SCALAR' ? MAX_COLLISION_SNAPSHOT_INDICES : MAX_COLLISION_SNAPSHOT_VERTICES)
  )
    throw new Error('Collision accessor capacity exceeded');
  if (accessor.type !== expectedType) throw new Error('Unexpected collision accessor type');
  const components = {SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16}[expectedType];
  if (!components) throw new Error('Unsupported collision accessor type');
  const bytes = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}[accessor.componentType];
  if (!bytes || (expectedType === 'MAT4' && accessor.componentType !== 5126))
    throw new Error('Unsupported collision accessor component');
  const readComponent = (view: DataView, offset: number, componentType: number): number => {
    switch (componentType) {
      case 5120:
        return view.getInt8(offset);
      case 5121:
        return view.getUint8(offset);
      case 5122:
        return view.getInt16(offset, true);
      case 5123:
        return view.getUint16(offset, true);
      case 5125:
        return view.getUint32(offset, true);
      case 5126:
        return view.getFloat32(offset, true);
      default:
        throw new Error('Unsupported collision accessor component');
    }
  };
  const dataView = (bufferViewIndex: number) => {
    const data = scenegraph.getTypedArrayForBufferView(bufferViewIndex);
    return new DataView(data.buffer, data.byteOffset, data.byteLength);
  };
  const result = Array<number>(accessor.count * components).fill(0);
  if (accessor.bufferView !== undefined) {
    const bufferView = scenegraph.getBufferView(accessor.bufferView);
    const data = dataView(accessor.bufferView);
    const stride = bufferView.byteStride ?? bytes * components;
    for (let element = 0; element < accessor.count; element++)
      for (let component = 0; component < components; component++)
        result[element * components + component] = readComponent(
          data,
          (accessor.byteOffset ?? 0) + element * stride + component * bytes,
          accessor.componentType
        );
  }
  if (accessor.sparse) {
    const sparse = accessor.sparse;
    const indexBytes = {5121: 1, 5123: 2, 5125: 4}[sparse.indices.componentType];
    if (!indexBytes) throw new Error('Invalid sparse collision accessor indices');
    const sparseIndices = dataView(sparse.indices.bufferView),
      values = dataView(sparse.values.bufferView);
    let previous = -1;
    for (let entry = 0; entry < sparse.count; entry++) {
      const index = readComponent(
        sparseIndices,
        (sparse.indices.byteOffset ?? 0) + entry * indexBytes,
        sparse.indices.componentType
      );
      if (index <= previous || index >= accessor.count)
        throw new Error('Invalid sparse collision accessor order');
      previous = index;
      for (let component = 0; component < components; component++)
        result[index * components + component] = readComponent(
          values,
          (sparse.values.byteOffset ?? 0) + (entry * components + component) * bytes,
          accessor.componentType
        );
    }
  }
  if (accessor.normalized) {
    const divisor = {5120: 127, 5121: 255, 5122: 32767, 5123: 65535}[accessor.componentType];
    if (!divisor) throw new Error('Invalid normalized collision accessor');
    for (let index = 0; index < result.length; index++)
      result[index] = Math.max(-1, result[index] / divisor);
  }
  if (!result.every(Number.isFinite)) throw new Error('Nonfinite collision accessor');
  return result;
}
