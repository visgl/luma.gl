// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFScenegraph} from '@loaders.gl/gltf';

/** Decode the sample-era geometry.mesh references before glTF postprocessing. */
export function makeLegacyMeshPositionResolver(scenegraph: GLTFScenegraph) {
  const cache = new Map<number, number[]>();
  return (meshIndex: number): number[] => {
    const cached = cache.get(meshIndex);
    if (cached) return cached;
    const mesh = scenegraph.getMesh(meshIndex);
    const result: number[] = [];
    for (const primitive of mesh.primitives) {
      const positionIndex = primitive.attributes['POSITION'];
      const accessor = scenegraph.getAccessor(positionIndex);
      if (
        accessor.type !== 'VEC3' ||
        accessor.componentType !== 5126 ||
        accessor.normalized ||
        accessor.sparse ||
        primitive.targets?.length
      )
        throw new Error('Legacy mesh boxes require dense, undeformed FLOAT VEC3 positions');
      const positions: ArrayLike<number> = scenegraph.getTypedArrayForAccessor(positionIndex);
      if (primitive.indices !== undefined) {
        const indicesAccessor = scenegraph.getAccessor(primitive.indices);
        if (
          indicesAccessor.type !== 'SCALAR' ||
          ![5121, 5123, 5125].includes(indicesAccessor.componentType) ||
          indicesAccessor.normalized ||
          indicesAccessor.sparse
        )
          throw new Error('Legacy mesh indices must be dense unsigned integers');
      }
      const indices: ArrayLike<number> | undefined =
        primitive.indices === undefined
          ? undefined
          : scenegraph.getTypedArrayForAccessor(primitive.indices);
      const count = indices?.length ?? accessor.count;
      for (let vertex = 0; vertex < count; vertex++) {
        const position = indices ? indices[vertex] : vertex;
        if (!Number.isInteger(position) || position < 0 || position >= accessor.count)
          throw new Error('Legacy mesh index is outside its position accessor');
        result.push(
          positions[position * 3],
          positions[position * 3 + 1],
          positions[position * 3 + 2]
        );
      }
    }
    cache.set(meshIndex, result);
    return result;
  };
}
