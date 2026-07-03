// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {colorHalftone, dotScreen, edgeWork, hexagonalPixelate, ink} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from '@luma.gl/devtools-extensions/tape-test-utils';

test('colorHalftone#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(colorHalftone, {}, {});
  t.deepEqual(uniforms.center, [0.5, 0.5], 'halftone center defaults correctly');
  t.equal(uniforms.angle, 1.1, 'halftone angle defaults to 1.1');
  t.equal(uniforms.size, 4, 'halftone size defaults to 4');
  t.end();
});

test('dotScreen#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(dotScreen, {}, {});
  t.deepEqual(uniforms.center, [0.5, 0.5], 'dot screen center defaults correctly');
  t.equal(uniforms.angle, 1.1, 'dot screen angle defaults to 1.1');
  t.equal(uniforms.size, 3, 'dot screen size defaults to 3');
  t.end();
});

test('edgeWork#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(edgeWork, {}, {});
  t.equal(uniforms.radius, 2, 'edge work radius defaults to 2');
  t.equal(uniforms.mode, 0, 'edge work mode defaults to zero');
  t.end();
});

test('hexagonalPixelate#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(hexagonalPixelate, {}, {});
  t.deepEqual(uniforms.center, [0.5, 0.5], 'hexagonal pixelate center defaults correctly');
  t.equal(uniforms.scale, 10, 'hexagonal pixelate scale defaults to 10');
  t.end();
});

test('ink#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(ink, {}, {});
  t.equal(uniforms.strength, 0.25, 'ink strength defaults to 0.25');
  t.end();
});
