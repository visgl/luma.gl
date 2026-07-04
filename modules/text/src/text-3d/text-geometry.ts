// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js TextGeometry (https://github.com/mrdoob/three.js/) under the MIT License.

// eslint-disable-next-line import/no-unresolved
import {Geometry, type GeometryProps} from '@luma.gl/engine';
import {extrudeShapes, type ExtrudeOptions} from './extrude';
import {Font, type TextLayoutOptions} from './font';
import type {Text3DBounds} from './glyph-atlas';

export type TextGeometryOptions = ExtrudeOptions &
  TextLayoutOptions & {
    /** Typeface used to generate glyph shapes. */
    font: Font;
    /** Desired font size for generated shapes. */
    size?: number;
    /** Optional identifier forwarded to the underlying geometry. */
    id?: string;
  };

/** Geometry that extrudes character outlines into a mesh. */
export class TextGeometry extends Geometry {
  /** Axis-aligned bounds of the generated text mesh. */
  readonly bounds: Text3DBounds;

  /** Creates geometry buffers representing the provided text. */
  constructor(text: string, options: TextGeometryOptions) {
    const {font, size = 100, align, id, ...extrudeOptions} = options;
    const curveSegments = extrudeOptions.curveSegments ?? 12;
    const shapes = font.generateShapes(text, size, curveSegments, {align});
    const {positions, normals, uvs} = extrudeShapes(shapes, {
      depth: 50,
      bevelEnabled: false,
      ...extrudeOptions,
      curveSegments
    });

    const geometryProps: GeometryProps = {
      id,
      topology: 'triangle-list',
      attributes: {
        positions: {value: positions, size: 3},
        normals: {value: normals, size: 3},
        texCoords: {value: uvs, size: 2}
      }
    };

    super(geometryProps);
    this.bounds = getTextGeometryBounds(positions);
  }
}

function getTextGeometryBounds(positions: Float32Array): Text3DBounds {
  const bounds: Text3DBounds = {
    min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
    max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]
  };

  for (let positionIndex = 0; positionIndex < positions.length; positionIndex += 3) {
    for (let coordinateIndex = 0; coordinateIndex < 3; coordinateIndex++) {
      const coordinate = positions[positionIndex + coordinateIndex];
      bounds.min[coordinateIndex] = Math.min(bounds.min[coordinateIndex], coordinate);
      bounds.max[coordinateIndex] = Math.max(bounds.max[coordinateIndex], coordinate);
    }
  }

  return bounds.min.every(Number.isFinite) && bounds.max.every(Number.isFinite)
    ? bounds
    : {min: [0, 0, 0], max: [0, 0, 0]};
}
