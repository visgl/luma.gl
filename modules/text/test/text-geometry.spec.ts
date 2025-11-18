// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape.js'
import {extrudeShapes, parseFont, TextGeometry} from '../src/index'
import {simpleFont} from './data/simple-font'
import {Vector3} from '@math.gl/core'

test('extrudeShapes outputs complete attribute arrays', t => {
  const font = parseFont(simpleFont)
  const shapes = font.generateShapes('A', 20, 2)
  const attributes = extrudeShapes(shapes, {depth: 2, curveSegments: 2})

  t.ok(attributes.positions.length > 0, 'positions are populated')
  t.equal(attributes.normals.length, attributes.positions.length, 'normals align with positions')
  t.equal(attributes.uvs.length, (attributes.positions.length / 3) * 2, 'uv count matches vertices')
  t.end()
})

test('TextGeometry exposes luma.gl attribute layout', t => {
  const font = parseFont(simpleFont)
  const geometry = new TextGeometry('A', {font, size: 10, depth: 2, curveSegments: 2})

  t.equal(geometry.topology, 'triangle-list', 'topology matches expected primitive type')
  t.ok(geometry.attributes.positions.value.length > 0, 'positions are populated')
  t.equal(
    geometry.attributes.normals.value.length,
    geometry.attributes.positions.value.length,
    'normals align with position count'
  )
  t.equal(
    geometry.attributes.texCoords.value.length,
    (geometry.attributes.positions.value.length / 3) * 2,
    'uvs match vertex count'
  )
  t.end()
})

test('extrusion preserves holes in polygonal glyphs', t => {
  const font = parseFont(simpleFont)
  const shapes = font.generateShapes('A', 20, 4)
  const attributes = extrudeShapes(shapes, {depth: 2, bevelEnabled: false, curveSegments: 4})

  const frontFaceArea = computeFrontFaceArea(attributes.positions)
  const expectedOuterWidth = 10 * (20 / simpleFont.resolution)
  const expectedHoleWidth = 4 * (20 / simpleFont.resolution)
  const expectedArea = expectedOuterWidth * expectedOuterWidth - expectedHoleWidth * expectedHoleWidth

  t.ok(frontFaceArea > 0, 'front face area was measured')
  t.ok(Math.abs(frontFaceArea - expectedArea) < expectedArea * 0.05, 'triangulation honors inner hole')
  t.end()
})

/** Computes the area of the first lid in the extruded geometry. */
function computeFrontFaceArea(positions: Float32Array): number {
  let area = 0
  const vectorAB = new Vector3()
  const vectorAC = new Vector3()

  for (let index = 0; index < positions.length; index += 9) {
    const ax = positions[index]
    const ay = positions[index + 1]
    const az = positions[index + 2]
    const bx = positions[index + 3]
    const by = positions[index + 4]
    const bz = positions[index + 5]
    const cx = positions[index + 6]
    const cy = positions[index + 7]
    const cz = positions[index + 8]

    if (az !== 0 || bz !== 0 || cz !== 0) {
      break
    }

    vectorAB.set(bx - ax, by - ay, 0)
    vectorAC.set(cx - ax, cy - ay, 0)
    area += vectorAB.cross(vectorAC).len() * 0.5
  }

  return area
}
