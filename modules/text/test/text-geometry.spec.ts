// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape.js'
import {extrudeShapes, parseFont, TextGeometry} from '../src/index'
import {simpleFont} from './data/simple-font'

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
  t.ok(geometry.attributes.POSITION.value.length > 0, 'positions are populated')
  t.equal(
    geometry.attributes.NORMAL.value.length,
    geometry.attributes.POSITION.value.length,
    'normals align with position count'
  )
  t.equal(
    geometry.attributes.TEXCOORD_0.value.length,
    (geometry.attributes.POSITION.value.length / 3) * 2,
    'uvs match vertex count'
  )
  t.end()
})
