// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  buildText3DGlyphAtlas,
  extrudeShapes,
  layoutText3DGlyphRows,
  parseFont,
  TextGeometry
} from '../../src/text-3d/index';
import {simpleFont} from './data/simple-font';
import {Vector3} from '@math.gl/core';

it('extrudeShapes outputs complete attribute arrays', () => {
  const font = parseFont(simpleFont);
  const shapes = font.generateShapes('A', 20, 2);
  const attributes = extrudeShapes(shapes, {depth: 2, curveSegments: 2});

  expect(Boolean(attributes.positions.length > 0), 'positions are populated').toBe(true);
  expect(attributes.normals.length, 'normals align with positions').toBe(
    attributes.positions.length
  );
  expect(attributes.uvs.length, 'uv count matches vertices').toBe(
    (attributes.positions.length / 3) * 2
  );
  void 0;
});

it('TextGeometry exposes luma.gl attribute layout', () => {
  const font = parseFont(simpleFont);
  const geometry = new TextGeometry('A', {font, size: 10, depth: 2, curveSegments: 2});

  expect(geometry.topology, 'topology matches expected primitive type').toBe('triangle-list');
  expect(Boolean(geometry.attributes.positions.value.length > 0), 'positions are populated').toBe(
    true
  );
  expect(geometry.attributes.normals.value.length, 'normals align with position count').toBe(
    geometry.attributes.positions.value.length
  );
  expect(geometry.attributes.texCoords.value.length, 'uvs match vertex count').toBe(
    (geometry.attributes.positions.value.length / 3) * 2
  );
  expect(geometry.bounds.min, 'bounds expose the mesh minimum').toEqual([0, 0, 0]);
  expect(Boolean(geometry.bounds.max[0] > 0), 'bounds expose the mesh width').toBe(true);
  expect(Boolean(geometry.bounds.max[1] > 0), 'bounds expose the mesh height').toBe(true);
  expect(geometry.bounds.max[2], 'bounds expose the extrusion depth').toBe(2);
  void 0;
});

it('Font can center each line independently', () => {
  const font = parseFont(simpleFont);
  const shapes = font.generateShapes('A\nAA', 10, 2, {align: 'center'});

  expect(shapes.length, 'each glyph produced a shape').toBe(3);

  const lineBounds = new Map<number, {minX: number; maxX: number}>();
  for (const shape of shapes) {
    const points = shape.extractPoints(2).shape;
    const centerY = Math.round(
      ((Math.min(...points.map(point => point.y)) + Math.max(...points.map(point => point.y))) /
        2) *
        1000
    );
    const minX = Math.min(...points.map(point => point.x));
    const maxX = Math.max(...points.map(point => point.x));
    const existingBounds = lineBounds.get(centerY);

    if (existingBounds) {
      existingBounds.minX = Math.min(existingBounds.minX, minX);
      existingBounds.maxX = Math.max(existingBounds.maxX, maxX);
    } else {
      lineBounds.set(centerY, {minX, maxX});
    }
  }

  const [firstLineBounds, secondLineBounds] = [...lineBounds.values()];
  const firstLineCenter = (firstLineBounds.minX + firstLineBounds.maxX) / 2;
  const secondLineCenter = (secondLineBounds.minX + secondLineBounds.maxX) / 2;
  expect(
    Boolean(Math.abs(firstLineCenter - secondLineCenter) < 0.0001),
    'line centers align horizontally'
  ).toBe(true);
  void 0;
});

it('extrusion preserves holes in polygonal glyphs', () => {
  const font = parseFont(simpleFont);
  const shapes = font.generateShapes('A', 20, 4);
  const attributes = extrudeShapes(shapes, {depth: 2, bevelEnabled: false, curveSegments: 4});

  const frontFaceArea = computeFrontFaceArea(attributes.positions);
  const expectedOuterWidth = 10 * (20 / simpleFont.resolution);
  const expectedHoleWidth = 4 * (20 / simpleFont.resolution);
  const expectedArea =
    expectedOuterWidth * expectedOuterWidth - expectedHoleWidth * expectedHoleWidth;

  expect(Boolean(frontFaceArea > 0), 'front face area was measured').toBe(true);
  expect(
    Boolean(Math.abs(frontFaceArea - expectedArea) < expectedArea * 0.05),
    'triangulation honors inner hole'
  ).toBe(true);
  void 0;
});

it('Text3D glyph atlas reuses renderable glyph geometry in stable first-use order', () => {
  const font = parseFont(simpleFont);
  const glyphAtlas = buildText3DGlyphAtlas(['ABBA'], {
    font,
    size: 10,
    depth: 2,
    curveSegments: 2
  });

  expect(
    glyphAtlas.glyphs.map(glyph => glyph.glyphCharacter),
    'missing source glyphs reuse the fallback glyph once'
  ).toEqual(['A', '?']);
  expect(glyphAtlas.glyphs[0].firstVertex, 'first glyph starts the shared geometry').toBe(0);
  expect(glyphAtlas.glyphs[1].firstVertex, 'second glyph starts after the first shared range').toBe(
    glyphAtlas.glyphs[0].vertexCount
  );
  expect(
    glyphAtlas.geometry.vertexCount,
    'shared geometry contains each renderable used glyph once'
  ).toBe(glyphAtlas.glyphs.reduce((vertexCount, glyph) => vertexCount + glyph.vertexCount, 0));
  void 0;
});

it('Text3D glyph layout advances spaces and rows without emitting whitespace geometry', () => {
  const font = parseFont(simpleFont);
  const glyphAtlas = buildText3DGlyphAtlas(['A A', 'A'], {
    font,
    size: 10,
    depth: 2,
    curveSegments: 2
  });
  const glyphLayout = layoutText3DGlyphRows(['A A', 'A'], glyphAtlas);

  expect(
    glyphAtlas.glyphs.map(glyph => glyph.glyphCharacter),
    'space advances text without entering the renderable glyph atlas'
  ).toEqual(['A']);
  expect(glyphLayout.instances.length, 'only visible glyphs emit instances').toBe(3);
  expect(
    Boolean(glyphLayout.instances[1].offset[0] > glyphLayout.instances[0].offset[0]),
    'space contributes horizontal advance between visible glyphs'
  ).toBe(true);
  expect(
    Boolean(glyphLayout.instances[2].offset[1] < glyphLayout.instances[0].offset[1]),
    'next row advances downward by line height'
  ).toBe(true);
  void 0;
});

it('Text3D glyph layout centers each row using the current font advances', () => {
  const font = parseFont(simpleFont);
  const glyphAtlas = buildText3DGlyphAtlas(['A', 'AA'], {
    font,
    size: 10,
    depth: 2,
    curveSegments: 2
  });
  const glyphLayout = layoutText3DGlyphRows(['A', 'AA'], glyphAtlas, {align: 'center'});
  const [firstRowGlyph, secondRowFirstGlyph, secondRowSecondGlyph] = glyphLayout.instances;

  expect(firstRowGlyph.offset[0], 'single glyph row centers').toBe(
    -font.measureLineWidth('A', 10) / 2
  );
  expect(secondRowFirstGlyph.offset[0], 'multi-glyph row starts at its centered advance').toBe(
    -font.measureLineWidth('AA', 10) / 2
  );
  expect(
    secondRowSecondGlyph.offset[0],
    'later glyphs retain source advance after centered start'
  ).toBe(secondRowFirstGlyph.offset[0] + font.getGlyphAdvance('A', 10));
  void 0;
});

/** Computes the area of the first lid in the extruded geometry. */
function computeFrontFaceArea(positions: Float32Array): number {
  let area = 0;
  const vectorAB = new Vector3();
  const vectorAC = new Vector3();

  for (let index = 0; index < positions.length; index += 9) {
    const ax = positions[index];
    const ay = positions[index + 1];
    const az = positions[index + 2];
    const bx = positions[index + 3];
    const by = positions[index + 4];
    const bz = positions[index + 5];
    const cx = positions[index + 6];
    const cy = positions[index + 7];
    const cz = positions[index + 8];

    if (az !== 0 || bz !== 0 || cz !== 0) {
      break;
    }

    vectorAB.set(bx - ax, by - ay, 0);
    vectorAC.set(cx - ax, cy - ay, 0);
    area += vectorAB.cross(vectorAC).len() * 0.5;
  }

  return area;
}
