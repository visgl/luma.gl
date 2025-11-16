// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js TextGeometry (https://github.com/mrdoob/three.js/) under the MIT License.

// eslint-disable-next-line import/no-unresolved
import {Geometry, type GeometryProps} from '@luma.gl/engine'
import {extrudeShapes, type ExtrudeOptions} from './extrude'
import {Font} from './font'

export type TextGeometryOptions = ExtrudeOptions & {
  /** Typeface used to generate glyph shapes. */
  font: Font
  /** Desired font size for generated shapes. */
  size?: number
  /** Optional identifier forwarded to the underlying geometry. */
  id?: string
}

/** Geometry that extrudes character outlines into a mesh. */
export class TextGeometry extends Geometry {
  /** Creates geometry buffers representing the provided text. */
  constructor(text: string, options: TextGeometryOptions) {
    const {font, size = 100, id, ...extrudeOptions} = options
    const curveSegments = extrudeOptions.curveSegments ?? 12
    const shapes = font.generateShapes(text, size, curveSegments)
    const {positions, normals, uvs} = extrudeShapes(shapes, {
      depth: 50,
      bevelEnabled: false,
      ...extrudeOptions,
      curveSegments
    })

    const geometryProps: GeometryProps = {
      id,
      topology: 'triangle-list',
      attributes: {
        POSITION: {value: positions, size: 3},
        NORMAL: {value: normals, size: 3},
        TEXCOORD_0: {value: uvs, size: 2}
      }
    }

    super(geometryProps)
  }
}
