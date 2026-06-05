// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  buildText3DGlyphAtlas,
  extrudeShapes,
  layoutText3DGlyphRows,
  parseFont,
  TextGeometry
} from '../../src/text-3d/index';
import {
  makeArrowText3DGlyphData,
  makeArrowText3DTextTable
} from '../../../../examples/arrow/arrow-text-3d/arrow-text-3d-data';
import {simpleFont} from './data/simple-font';
import {Vector3} from '@math.gl/core';

test('extrudeShapes outputs complete attribute arrays', t => {
  const font = parseFont(simpleFont);
  const shapes = font.generateShapes('A', 20, 2);
  const attributes = extrudeShapes(shapes, {depth: 2, curveSegments: 2});

  t.ok(attributes.positions.length > 0, 'positions are populated');
  t.equal(attributes.normals.length, attributes.positions.length, 'normals align with positions');
  t.equal(
    attributes.uvs.length,
    (attributes.positions.length / 3) * 2,
    'uv count matches vertices'
  );
  t.end();
});

test('TextGeometry exposes luma.gl attribute layout', t => {
  const font = parseFont(simpleFont);
  const geometry = new TextGeometry('A', {font, size: 10, depth: 2, curveSegments: 2});

  t.equal(geometry.topology, 'triangle-list', 'topology matches expected primitive type');
  t.ok(geometry.attributes.positions.value.length > 0, 'positions are populated');
  t.equal(
    geometry.attributes.normals.value.length,
    geometry.attributes.positions.value.length,
    'normals align with position count'
  );
  t.equal(
    geometry.attributes.texCoords.value.length,
    (geometry.attributes.positions.value.length / 3) * 2,
    'uvs match vertex count'
  );
  t.end();
});

test('Font can center each line independently', t => {
  const font = parseFont(simpleFont);
  const shapes = font.generateShapes('A\nAA', 10, 2, {align: 'center'});

  t.equal(shapes.length, 3, 'each glyph produced a shape');

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
  t.ok(Math.abs(firstLineCenter - secondLineCenter) < 0.0001, 'line centers align horizontally');
  t.end();
});

test('extrusion preserves holes in polygonal glyphs', t => {
  const font = parseFont(simpleFont);
  const shapes = font.generateShapes('A', 20, 4);
  const attributes = extrudeShapes(shapes, {depth: 2, bevelEnabled: false, curveSegments: 4});

  const frontFaceArea = computeFrontFaceArea(attributes.positions);
  const expectedOuterWidth = 10 * (20 / simpleFont.resolution);
  const expectedHoleWidth = 4 * (20 / simpleFont.resolution);
  const expectedArea =
    expectedOuterWidth * expectedOuterWidth - expectedHoleWidth * expectedHoleWidth;

  t.ok(frontFaceArea > 0, 'front face area was measured');
  t.ok(
    Math.abs(frontFaceArea - expectedArea) < expectedArea * 0.05,
    'triangulation honors inner hole'
  );
  t.end();
});

test('Text3D glyph atlas reuses renderable glyph geometry in stable first-use order', t => {
  const font = parseFont(simpleFont);
  const glyphAtlas = buildText3DGlyphAtlas(['ABBA'], {
    font,
    size: 10,
    depth: 2,
    curveSegments: 2
  });

  t.deepEqual(
    glyphAtlas.glyphs.map(glyph => glyph.glyphCharacter),
    ['A', '?'],
    'missing source glyphs reuse the fallback glyph once'
  );
  t.equal(glyphAtlas.glyphs[0].firstVertex, 0, 'first glyph starts the shared geometry');
  t.equal(
    glyphAtlas.glyphs[1].firstVertex,
    glyphAtlas.glyphs[0].vertexCount,
    'second glyph starts after the first shared range'
  );
  t.equal(
    glyphAtlas.geometry.vertexCount,
    glyphAtlas.glyphs.reduce((vertexCount, glyph) => vertexCount + glyph.vertexCount, 0),
    'shared geometry contains each renderable used glyph once'
  );
  t.end();
});

test('Text3D glyph layout advances spaces and rows without emitting whitespace geometry', t => {
  const font = parseFont(simpleFont);
  const glyphAtlas = buildText3DGlyphAtlas(['A A', 'A'], {
    font,
    size: 10,
    depth: 2,
    curveSegments: 2
  });
  const glyphLayout = layoutText3DGlyphRows(['A A', 'A'], glyphAtlas);

  t.deepEqual(
    glyphAtlas.glyphs.map(glyph => glyph.glyphCharacter),
    ['A'],
    'space advances text without entering the renderable glyph atlas'
  );
  t.equal(glyphLayout.instances.length, 3, 'only visible glyphs emit instances');
  t.ok(
    glyphLayout.instances[1].offset[0] > glyphLayout.instances[0].offset[0],
    'space contributes horizontal advance between visible glyphs'
  );
  t.ok(
    glyphLayout.instances[2].offset[1] < glyphLayout.instances[0].offset[1],
    'next row advances downward by line height'
  );
  t.end();
});

test('Text3D glyph layout centers each row using the current font advances', t => {
  const font = parseFont(simpleFont);
  const glyphAtlas = buildText3DGlyphAtlas(['A', 'AA'], {
    font,
    size: 10,
    depth: 2,
    curveSegments: 2
  });
  const glyphLayout = layoutText3DGlyphRows(['A', 'AA'], glyphAtlas, {align: 'center'});
  const [firstRowGlyph, secondRowFirstGlyph, secondRowSecondGlyph] = glyphLayout.instances;

  t.equal(firstRowGlyph.offset[0], -font.measureLineWidth('A', 10) / 2, 'single glyph row centers');
  t.equal(
    secondRowFirstGlyph.offset[0],
    -font.measureLineWidth('AA', 10) / 2,
    'multi-glyph row starts at its centered advance'
  );
  t.equal(
    secondRowSecondGlyph.offset[0],
    secondRowFirstGlyph.offset[0] + font.getGlyphAdvance('A', 10),
    'later glyphs retain source advance after centered start'
  );
  t.end();
});

test('Arrow 3D text groups repeated glyph ids and keeps only used atlas glyphs', t => {
  const font = parseFont(simpleFont);
  const textTable = makeArrowText3DTextTable(['A A']);
  const glyphAtlas = buildText3DGlyphAtlas(['A A'], {
    font,
    size: 10,
    depth: 2,
    curveSegments: 2
  });
  const glyphData = makeArrowText3DGlyphData(textTable, glyphAtlas);
  const glyphIds = glyphData.glyphInstanceTable.getChild('glyphIds');

  t.deepEqual(
    glyphIds?.toArray(),
    new Uint32Array([0, 0]),
    'repeated visible glyphs reuse one grouped glyph id'
  );
  t.deepEqual(
    glyphAtlas.glyphs.map(glyph => glyph.glyphCharacter),
    ['A'],
    'shared glyph geometry excludes whitespace-only source characters'
  );
  t.equal(glyphData.drawRanges.length, 1, 'one used glyph produces one ranged draw');
  t.equal(
    glyphData.glyphInstanceTable.batches[0]?.numRows,
    2,
    'grouped Arrow record batch retains both visible glyph occurrences'
  );
  t.end();
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
