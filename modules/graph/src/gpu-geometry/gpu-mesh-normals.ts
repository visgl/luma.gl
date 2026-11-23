// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import type {GPUCommandGraph, GraphDataView} from '../gpu-core/gpu-command-graph';
import {getSpatialOperationNodes} from '../utils/gpu-spatial-operation';

export type GPUMeshNormalsProps = {
  id?: string;
  positions: GraphDataView<'float32x3'>;
  /** Packed triangle-list indices, three vertex IDs per face. */
  indices: GraphDataView<'uint32'>;
  /** One normal per face. Degenerate or invalid faces produce zero. */
  normals: GraphDataView<'float32x3'>;
  /** Keep cross products for area-weighted vertex normal accumulation. Default false. */
  areaWeighted?: boolean;
};

/** Computes triangle normals in O(triangle count), preserving winding and source face IDs. */
export class GPUMeshNormals {
  readonly id: string;
  constructor(readonly props: GPUMeshNormalsProps) {
    this.id = props.id ?? 'gpu-mesh-normals';
    // Triangle lists require three indices and one output row per face.
    assert(props.indices.length % 3 === 0 && props.normals.length === props.indices.length / 3);
  }
  getCommandNodes<Parameters>(graph: GPUCommandGraph<Parameters>) {
    const {positions, indices, normals, areaWeighted} = this.props;
    return getSpatialOperationNodes(graph, {
      id: this.id,
      length: normals.length,
      inputs: {positions, indices},
      outputs: {normals},
      body: `let first = readIndices(index * 3u);
let second = readIndices(index * 3u + 1u);
let third = readIndices(index * 3u + 2u);
var normal = vec3f(0.0);
if (first < ${positions.length}u && second < ${positions.length}u && third < ${positions.length}u) {
  normal = cross(readPositions(second) - readPositions(first), readPositions(third) - readPositions(first));
}
writeNormals(index, ${areaWeighted ? 'normal' : 'safeNormal(normal)'});`
    });
  }
}

export type GPUMeshVertexNormalsProps = {
  id?: string;
  faceNormals: GraphDataView<'float32x3'>;
  /** CSR vertex-to-face incidence. Must be monotonic, start at zero and end at faceIndices.length. */
  offsets: GraphDataView<'uint32'>;
  faceIndices: GraphDataView<'uint32'>;
  normals: GraphDataView<'float32x3'>;
};

/** Normalizes incident face sums. Use area-weighted face normals for area-weighted smoothing. */
export class GPUMeshVertexNormals {
  readonly id: string;
  constructor(readonly props: GPUMeshVertexNormalsProps) {
    this.id = props.id ?? 'gpu-mesh-vertex-normals';
    // CSR offsets contain one sentinel after the final vertex.
    assert(props.offsets.length === props.normals.length + 1);
  }
  getCommandNodes<Parameters>(graph: GPUCommandGraph<Parameters>) {
    const {faceNormals, offsets, faceIndices, normals} = this.props;
    return getSpatialOperationNodes(graph, {
      id: this.id,
      length: normals.length,
      inputs: {faceNormals, offsets, faceIndices},
      outputs: {normals},
      body: `var normal = vec3f(0.0);
let end = min(readOffsets(index + 1u), ${faceIndices.length}u);
for (var entry = readOffsets(index); entry < end; entry++) {
  let face = readFaceIndices(entry);
  if (face < ${faceNormals.length}u) { normal += readFaceNormals(face); }
}
writeNormals(index, safeNormal(normal));`
    });
  }
}
