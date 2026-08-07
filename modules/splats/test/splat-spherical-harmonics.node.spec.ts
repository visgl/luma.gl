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

test('SplatRenderer preserves unclamped spherical-harmonic radiance for byte-backed WebGL colors', async t => {
  const device = new NullDevice({});
  const source = makeSphericalHarmonicSource();
  source.colors = new Uint8Array([128, 64, 32, 255]);
  source.sphericalHarmonics![2 * 3] = -4;
  source.sphericalHarmonics![2 * 3 + 1] = 2;
  const prepared = makeGPUSplatData(device, source);
  const renderer = new SplatRenderer(device, {
    data: prepared,
    cameraPosition: [0, 0, 0],
    sphericalHarmonicsDegree: 1,
    viewportSize: [32, 32],
    exposure: 0.25,
    toneMapping: 'none'
  });
  const renderPass = device.getDefaultRenderPass();
  renderer.draw(renderPass);
  const evaluatedColorBuffer = renderer.model?.vertexArray.attributes[3];
  if (!(evaluatedColorBuffer instanceof Buffer)) {
    t.fail('creates independently owned Float32 evaluated WebGL colors');
    renderer.destroy();
    prepared.destroy();
    t.end();
    return;
  }

  const evaluatedColors = await readFloat32Buffer(evaluatedColorBuffer);
  t.ok(evaluatedColors[0] > 2, 'retains HDR directional red radiance before exposure');
  t.ok(
    evaluatedColors[1] < 0,
    'retains negative directional green radiance before display mapping'
  );
  t.equal(evaluatedColors[3], 1, 'normalizes the byte-backed source alpha exactly once');
  t.equal(
    renderer.model?.bufferLayout.find(layout => layout.name === 'colors')?.format,
    'float32x4',
    'binds evaluated HDR radiance through a Float32 WebGL vertex attribute'
  );
  t.deepEqual(
    Array.from(source.colors),
    [128, 64, 32, 255],
    'does not clamp or mutate caller-owned byte source colors'
  );

  renderer.setProps({sphericalHarmonicsDegree: 0});
  renderer.draw(renderPass);
  t.equal(
    renderer.model?.bufferLayout.find(layout => layout.name === 'colors')?.format,
    'unorm8x4',
    'restores the original normalized-byte vertex layout when higher bands are disabled'
  );
  t.equal(
    renderer.model?.vertexArray.attributes[3],
    prepared.colors.data[0].buffer,
    'restores the caller-owned byte color buffer when higher bands are disabled'
  );

  renderer.destroy();
  t.ok(evaluatedColorBuffer.destroyed, 'releases only renderer-owned Float32 evaluated colors');
  t.notOk(prepared.colors.data[0].buffer.destroyed, 'preserves caller-owned byte source colors');
  prepared.destroy();
  t.end();
});

test('SplatRenderer uses one stable Float32 WebGL layout for mixed spherical-harmonic batches', async t => {
  const device = new NullDevice({});
  const directionalSource: SplatSource = {
    positions: new Float32Array([1, 0, 0.2, 1, 0, 0.8]),
    scales: new Float32Array([0.1, 0.1, 0.1, 0.1, 0.1, 0.1]),
    rotations: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0]),
    colors: new Uint8Array([128, 64, 32, 255, 128, 64, 32, 255]),
    opacities: new Float32Array([1, 1]),
    sphericalHarmonics: new Float32Array(18),
    sphericalHarmonicsDegree: 1,
    sourceBatchIndex: 0,
    rowIndexBase: 0
  };
  directionalSource.sphericalHarmonics![2 * 3] = -4;
  directionalSource.sphericalHarmonics![9 + 2 * 3] = -4;
  const standardSource: SplatSource = {
    positions: new Float32Array([1, 0, 0.5]),
    scales: new Float32Array([0.1, 0.1, 0.1]),
    rotations: new Float32Array([1, 0, 0, 0]),
    colors: new Uint8Array([64, 128, 255, 255]),
    opacities: new Float32Array([1]),
    sourceBatchIndex: 1,
    rowIndexBase: 2
  };
  const directionalBatch = makeGPUSplatData(device, directionalSource);
  const standardBatch = makeGPUSplatData(device, standardSource);
  const renderer = new SplatRenderer(device, {
    data: [directionalBatch, standardBatch],
    sphericalHarmonicsDegree: 1,
    viewportSize: [32, 32]
  });
  const model = renderer.model;
  if (!model) {
    t.fail('creates a shared Gaussian splat WebGL model');
    renderer.destroy();
    directionalBatch.destroy();
    standardBatch.destroy();
    t.end();
    return;
  }

  const originalDraw = model.draw.bind(model);
  const firstVertexArray = model.vertexArray;
  const firstPipeline = model.pipeline;
  const drawnColorBuffers: Buffer[] = [];
  model.draw = renderPass => {
    t.equal(
      model.vertexArray,
      firstVertexArray,
      'reuses one vertex array for every interleaved run'
    );
    t.equal(model.pipeline, firstPipeline, 'reuses one render pipeline for every interleaved run');
    const colorBuffer = model.vertexArray.attributes[3];
    if (colorBuffer instanceof Buffer) {
      drawnColorBuffers.push(colorBuffer);
    }
    return originalDraw(renderPass);
  };
  const renderPass = device.getDefaultRenderPass();
  renderer.draw(renderPass);
  t.deepEqual(
    Array.from(renderer.getSortedIndices()),
    [1, 2, 0],
    'interleaves both source batches'
  );
  t.equal(
    model.bufferLayout.find(bufferLayout => bufferLayout.name === 'colors')?.format,
    'float32x4',
    'uses one Float32 color layout for directional and ordinary byte-backed batches'
  );
  const ordinaryColorBuffer = drawnColorBuffers[1];
  if (!ordinaryColorBuffer) {
    t.fail('binds renderer-owned normalized colors for the ordinary interleaved batch');
    renderer.destroy();
    directionalBatch.destroy();
    standardBatch.destroy();
    t.end();
    return;
  }
  const normalizedOrdinaryColors = await readFloat32Buffer(ordinaryColorBuffer);
  t.ok(
    Math.abs(normalizedOrdinaryColors[0] - 64 / 255) < 1e-6 &&
      Math.abs(normalizedOrdinaryColors[1] - 128 / 255) < 1e-6,
    'normalizes ordinary source bytes into compatible renderer-owned Float32 colors'
  );

  drawnColorBuffers.length = 0;
  renderer.setProps({cameraPosition: [2, 0, 0]});
  renderer.draw(renderPass);
  t.equal(model.vertexArray, firstVertexArray, 'retains the vertex array across animated frames');
  t.equal(model.pipeline, firstPipeline, 'retains the pipeline across animated frames');
  t.deepEqual(
    Array.from(standardSource.colors),
    [64, 128, 255, 255],
    'preserves ordinary caller-owned byte colors'
  );

  model.draw = originalDraw;
  renderer.setProps({sphericalHarmonicsDegree: 0});
  renderer.draw(renderPass);
  t.equal(
    model.bufferLayout.find(bufferLayout => bufferLayout.name === 'colors')?.format,
    'unorm8x4',
    'switches once to the original byte layout when directional rendering is disabled'
  );
  t.ok(firstVertexArray.destroyed, 'releases the superseded Float32 vertex array');

  renderer.destroy();
  directionalBatch.destroy();
  standardBatch.destroy();
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
