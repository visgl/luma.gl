// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  brightnessContrast,
  denoise,
  hueSaturation,
  noise,
  sepia,
  vibrance,
  vignette
} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from '@luma.gl/devtools-extensions/tape-test-utils';

test('brightnessContrast#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(brightnessContrast, {}, {});
  t.equal(uniforms.brightness, 0, 'brightness defaults to zero');
  t.equal(uniforms.contrast, 0, 'contrast defaults to zero');
  t.end();
});

test('denoise#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(denoise, {}, {});
  t.equal(uniforms.strength, 0.5, 'denoise strength defaults to 0.5');
  t.end();
});

test('hueSaturation#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(hueSaturation, {}, {});
  t.equal(uniforms.hue, 0, 'hue defaults to zero');
  t.equal(uniforms.saturation, 0, 'saturation defaults to zero');
  t.end();
});

test('noise#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(noise, {}, {});
  t.equal(uniforms.amount, 0.5, 'noise amount defaults to 0.5');
  t.end();
});

test('sepia#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(sepia, {}, {});
  t.equal(uniforms.amount, 0.5, 'sepia amount defaults to 0.5');
  t.end();
});

test('vibrance#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(vibrance, {}, {});
  t.equal(uniforms.amount, 0, 'vibrance amount defaults to zero');
  t.end();
});

test('vignette#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(vignette, {}, {});
  t.equal(uniforms.radius, 0.5, 'vignette radius defaults to 0.5');
  t.equal(uniforms.amount, 0.5, 'vignette amount defaults to 0.5');
  t.end();
});
