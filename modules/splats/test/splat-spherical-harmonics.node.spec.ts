// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer} from '@luma.gl/core';
import {
  evaluateSplatSphericalHarmonics,
  getSplatSphericalHarmonicCoefficientCount,
  getSplatSphericalHarmonicsDegree,
  makeGPUSplatData,
  SplatRenderer,
  SPLAT_STORAGE_WGSL_SHADER,
  type SplatSource
} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

test('Gaussian spherical harmonics retain GraphDECO basis order through degree three', t => {
  t.deepEqual(
    ([0, 1, 2, 3] as const).map(getSplatSphericalHarmonicCoefficientCount),
    [0, 9, 24, 45],
    'counts only non-DC RGB scalar coefficients'
  );
  t.deepEqual(
    [0, 9, 24, 45].map(getSplatSphericalHarmonicsDegree),
    [0, 1, 2, 3],
    'infers every supported spherical-harmonic degree'
  );
  t.throws(
    () => getSplatSphericalHarmonicsDegree(12),
    /coefficient count/,
    'rejects incomplete spherical-harmonic bands'
  );

  const coefficients = new Float32Array(45);
  coefficients[2 * 3] = 2;
  coefficients[5 * 3 + 1] = 1;
  coefficients[11 * 3 + 2] = 1;
  const firstOrder = evaluateSplatSphericalHarmonics(
    [0.5, 0.25, 0.125],
    coefficients,
    [2, 0, 0],
    1
  );
  t.ok(
    Math.abs(firstOrder[0] - (0.5 - 2 * 0.4886025119029199)) < 1e-6,
    'normalizes the view direction and evaluates the first-order X basis'
  );
  t.equal(firstOrder[1], 0.25, 'excludes higher bands when the requested degree is capped');

  const thirdOrder = evaluateSplatSphericalHarmonics(
    [0.5, 0.25, 0.125],
    coefficients,
    [0, 0, 1],
    3
  );
  t.ok(
    Math.abs(thirdOrder[1] - (0.25 + 2 * 0.31539156525252005)) < 1e-6,
    'evaluates the second-order zonal basis'
  );
  t.ok(
    Math.abs(thirdOrder[2] - (0.125 + 2 * 0.3731763325901154)) < 1e-6,
    'evaluates the third-order zonal basis'
  );
  t.end();
});

test('SplatRenderer evaluates view-dependent spherical harmonics without mutating source colors', async t => {
  const device = new NullDevice({});
  const source = makeSphericalHarmonicSource();
  const prepared = makeGPUSplatData(device, source);
  const renderer = new SplatRenderer(device, {
    data: prepared,
    cameraPosition: [0, 0, 0],
    sphericalHarmonicsDegree: 1,
    viewportSize: [32, 32]
  });
  const renderPass = device.getDefaultRenderPass();
  renderer.draw(renderPass);
  const evaluatedColorBuffer = renderer.model?.vertexArray.attributes[3];
  if (!(evaluatedColorBuffer instanceof Buffer)) {
    t.fail('creates an independently owned evaluated color buffer');
    renderer.destroy();
    prepared.destroy();
    t.end();
    return;
  }

  const firstColors = await readFloat32Buffer(evaluatedColorBuffer);
  t.ok(firstColors[0] < 0.5, 'evaluates directional red radiance from the first camera position');
  t.deepEqual(Array.from(source.colors), [0.5, 0.25, 0.125, 1], 'preserves caller-owned DC colors');
  const sortedReferences = renderer.sortedReferences;
  renderer.setProps({cameraPosition: [2, 0, 0]});
  renderer.draw(renderPass);
  const secondColors = await readFloat32Buffer(evaluatedColorBuffer);
  t.ok(secondColors[0] > 0.5, 'updates directional radiance as the camera crosses the Gaussian');
  t.equal(renderer.sortedReferences, sortedReferences, 'updates radiance without resorting rows');
  t.equal(
    renderer.model?.vertexArray.attributes[3],
    evaluatedColorBuffer,
    'reuses the renderer-owned evaluated color allocation'
  );

  renderer.setProps({sphericalHarmonicsDegree: 0});
  renderer.draw(renderPass);
  t.equal(
    renderer.model?.vertexArray.attributes[3],
    prepared.colors.data[0].buffer,
    'restores the caller-owned DC color buffer when higher bands are disabled'
  );

  const coefficientBuffer = prepared.sphericalHarmonics?.data[0].buffer;
  renderer.destroy();
  t.ok(evaluatedColorBuffer.destroyed, 'releases the renderer-owned evaluated colors');
  t.notOk(coefficientBuffer?.destroyed, 'preserves the caller-owned coefficient buffer');
  prepared.destroy();
  t.ok(coefficientBuffer?.destroyed, 'caller destruction releases the coefficient buffer');
  t.end();
});

test('SplatRenderer binds batch-local spherical harmonics to the WebGPU storage pipeline', t => {
  const device = new NullDevice({});
  Object.defineProperties(device, {
    type: {value: 'webgpu'},
    info: {value: {...device.info, type: 'webgpu', shadingLanguage: 'wgsl'}}
  });
  const prepared = makeGPUSplatData(device, makeSphericalHarmonicSource());
  const renderer = new SplatRenderer(device, {data: prepared, viewportSize: [32, 32]});
  const renderPass = device.getDefaultRenderPass();
  renderer.draw(renderPass);

  t.equal(
    renderer.model?.bindings['splatSphericalHarmonics'],
    prepared.sphericalHarmonics?.data[0].buffer,
    'binds the prepared source coefficient allocation without repacking it'
  );
  t.equal(
    renderer.getBatchSphericalHarmonicsBuffer(0),
    prepared.sphericalHarmonics?.data[0].buffer,
    'exposes borrowed coefficients to GPU picking passes'
  );
  t.ok(
    SPLAT_STORAGE_WGSL_SHADER.includes('getSplatSphericalHarmonicBasis'),
    'evaluates higher-order spherical harmonics inside the WebGPU vertex shader'
  );
  t.ok(
    SPLAT_STORAGE_WGSL_SHADER.includes('sourceRowIndex : i32'),
    'retains stable flat source indices for GPU picking'
  );

  renderer.destroy();
  prepared.destroy();
  t.end();
});

function makeSphericalHarmonicSource(): SplatSource {
  const sphericalHarmonics = new Float32Array(9);
  sphericalHarmonics[2 * 3] = 0.5;
  return {
    positions: new Float32Array([1, 0, 0]),
    scales: new Float32Array([0.1, 0.1, 0.1]),
    rotations: new Float32Array([1, 0, 0, 0]),
    colors: new Float32Array([0.5, 0.25, 0.125, 1]),
    opacities: new Float32Array([1]),
    sphericalHarmonics,
    sphericalHarmonicsDegree: 1
  };
}

async function readFloat32Buffer(buffer: {
  readAsync(): Promise<Uint8Array>;
}): Promise<Float32Array> {
  const bytes = await buffer.readAsync();
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}
