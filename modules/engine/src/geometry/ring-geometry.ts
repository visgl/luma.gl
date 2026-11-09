// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {
  PlaneGeometry as MathPlaneGeometry,
  type Geometry as MathGeometry,
  type GeometryAttributeInput
} from '@math.gl/geometry';
import {LatheGeometry} from '@math.gl/geometry';
import {Geometry} from './geometry';

export type RingGeometryProps = {
  id?: string;
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
  segments?: number;
  startAngle?: number;
  angle?: number;
  attributes?: Record<string, GeometryAttributeInput>;
};

/** Closed annular prism around Y, assembled from shared math.gl lathe and plane tessellation. */
export class RingGeometry extends Geometry {
  constructor(props: RingGeometryProps = {}) {
    const {
      innerRadius = 0.5,
      outerRadius = 1,
      height = 0.2,
      segments = 48,
      startAngle = 0,
      angle = Math.PI * 2
    } = props;
    // Radii define a nonempty annulus/disk; sweeps and tessellation must be finite and positive.
    assert(
      Number.isFinite(innerRadius) &&
        innerRadius >= 0 &&
        Number.isFinite(outerRadius) &&
        outerRadius > innerRadius &&
        Number.isFinite(height) &&
        height > 0 &&
        Number.isFinite(startAngle) &&
        Number.isFinite(angle) &&
        angle > 0 &&
        angle <= Math.PI * 2 &&
        Number.isInteger(segments) &&
        segments >= 3
    );
    const halfHeight = height / 2;
    const profiles: (readonly [number, number])[][] = [
      [
        [outerRadius, -halfHeight],
        [outerRadius, halfHeight]
      ],
      [
        [outerRadius, halfHeight],
        [innerRadius, halfHeight]
      ],
      [
        [innerRadius, -halfHeight],
        [outerRadius, -halfHeight]
      ]
    ];
    if (innerRadius > 0)
      profiles.push([
        [innerRadius, halfHeight],
        [innerRadius, -halfHeight]
      ]);
    const meshes: MathGeometry[] = profiles.map(
      points => new LatheGeometry({points, segments, phiStart: startAngle, phiLength: angle})
    );
    if (angle < Math.PI * 2) {
      for (const [capIndex, capAngle] of [startAngle, startAngle + angle].entries()) {
        const cap = new MathPlaneGeometry({sizeX: outerRadius - innerRadius, sizeZ: height});
        const positions = cap.attributes['POSITION'].value;
        const normals = cap.attributes['NORMAL'].value;
        const cosine = Math.cos(capAngle);
        const sine = Math.sin(capAngle);
        const normalSign = capIndex === 0 ? 1 : -1;
        for (let offset = 0; offset < positions.length; offset += 3) {
          const radius = Number(positions[offset]) + (innerRadius + outerRadius) / 2;
          const vertical = -normalSign * Number(positions[offset + 2]);
          positions[offset] = radius * cosine;
          positions[offset + 1] = vertical;
          positions[offset + 2] = -radius * sine;
          normals[offset] = normalSign * sine;
          normals[offset + 1] = 0;
          normals[offset + 2] = normalSign * cosine;
        }
        meshes.push(cap);
      }
    }
    const positions: number[] = [];
    const normals: number[] = [];
    const textureCoordinates: number[] = [];
    const indices: number[] = [];
    for (const mesh of meshes) {
      const vertexOffset = positions.length / 3;
      for (const value of mesh.attributes['POSITION'].value) positions.push(value);
      for (const value of mesh.attributes['NORMAL'].value) normals.push(value);
      for (const value of mesh.attributes['TEXCOORD_0'].value) textureCoordinates.push(value);
      for (const index of mesh.indices!.value) indices.push(Number(index) + vertexOffset);
    }
    super({
      id: props.id,
      topology: 'triangle-list',
      indices: new Uint32Array(indices),
      attributes: {
        POSITION: {size: 3, value: new Float32Array(positions)},
        NORMAL: {size: 3, value: new Float32Array(normals)},
        TEXCOORD_0: {size: 2, value: new Float32Array(textureCoordinates)},
        ...props.attributes
      }
    });
  }
}
