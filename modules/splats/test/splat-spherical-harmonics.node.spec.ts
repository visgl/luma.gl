// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('Gaussian spherical harmonics retain GraphDECO basis order through degree three', () => {
  expect(
    ([0, 1, 2, 3] as const).map(getSplatSphericalHarmonicCoefficientCount),
    'counts only non-DC RGB scalar coefficients'
  ).toEqual([0, 9, 24, 45]);
  expect(
    [0, 9, 24, 45].map(getSplatSphericalHarmonicsDegree),
    'infers every supported spherical-harmonic degree'
  ).toEqual([0, 1, 2, 3]);
  expect(
    () => getSplatSphericalHarmonicsDegree(12),
    'rejects incomplete spherical-harmonic bands'
  ).toThrow(/coefficient count/);

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
  expect(
    Boolean(Math.abs(firstOrder[0] - (0.5 - 2 * 0.4886025119029199)) < 1e-6),
    'normalizes the view direction and evaluates the first-order X basis'
  ).toBe(true);
  expect(firstOrder[1], 'excludes higher bands when the requested degree is capped').toBe(0.25);

  const thirdOrder = evaluateSplatSphericalHarmonics(
    [0.5, 0.25, 0.125],
    coefficients,
    [0, 0, 1],
    3
  );
  expect(
    Boolean(Math.abs(thirdOrder[1] - (0.25 + 2 * 0.31539156525252005)) < 1e-6),
    'evaluates the second-order zonal basis'
  ).toBe(true);
  expect(
    Boolean(Math.abs(thirdOrder[2] - (0.125 + 2 * 0.3731763325901154)) < 1e-6),
    'evaluates the third-order zonal basis'
  ).toBe(true);
  void 0;
});

it('SplatRenderer evaluates view-dependent spherical harmonics without mutating source colors', async () => {
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
    expect(false, 'creates an independently owned evaluated color buffer').toBe(true);
    renderer.destroy();
    prepared.destroy();
    void 0;
    return;
  }

  const firstColors = await readFloat32Buffer(evaluatedColorBuffer);
  expect(
    Boolean(firstColors[0] < 0.5),
    'evaluates directional red radiance from the first camera position'
  ).toBe(true);
  expect(Array.from(source.colors), 'preserves caller-owned DC colors').toEqual([
    0.5, 0.25, 0.125, 1
  ]);
  const sortedReferences = renderer.sortedReferences;
  renderer.setProps({cameraPosition: [2, 0, 0]});
  renderer.draw(renderPass);
  const secondColors = await readFloat32Buffer(evaluatedColorBuffer);
  expect(
    Boolean(secondColors[0] > 0.5),
    'updates directional radiance as the camera crosses the Gaussian'
  ).toBe(true);
  expect(renderer.sortedReferences, 'updates radiance without resorting rows').toBe(
    sortedReferences
  );
  expect(
    renderer.model?.vertexArray.attributes[3],
    'reuses the renderer-owned evaluated color allocation'
  ).toBe(evaluatedColorBuffer);

  renderer.setProps({sphericalHarmonicsDegree: 0});
  renderer.draw(renderPass);
  expect(
    renderer.model?.vertexArray.attributes[3],
    'restores the caller-owned DC color buffer when higher bands are disabled'
  ).toBe(prepared.colors.data[0].buffer);

  const coefficientBuffer = prepared.sphericalHarmonics?.data[0].buffer;
  renderer.destroy();
  expect(
    Boolean(evaluatedColorBuffer.destroyed),
    'releases the renderer-owned evaluated colors'
  ).toBe(true);
  expect(
    Boolean(coefficientBuffer?.destroyed),
    'preserves the caller-owned coefficient buffer'
  ).toBe(false);
  prepared.destroy();
  expect(
    Boolean(coefficientBuffer?.destroyed),
    'caller destruction releases the coefficient buffer'
  ).toBe(true);
  void 0;
});

it('SplatRenderer preserves unclamped spherical-harmonic radiance for byte-backed WebGL colors', async () => {
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
    expect(false, 'creates independently owned Float32 evaluated WebGL colors').toBe(true);
    renderer.destroy();
    prepared.destroy();
    void 0;
    return;
  }

  const evaluatedColors = await readFloat32Buffer(evaluatedColorBuffer);
  expect(
    Boolean(evaluatedColors[0] > 2),
    'retains HDR directional red radiance before exposure'
  ).toBe(true);
  expect(
    Boolean(evaluatedColors[1] < 0),
    'retains negative directional green radiance before display mapping'
  ).toBe(true);
  expect(evaluatedColors[3], 'normalizes the byte-backed source alpha exactly once').toBe(1);
  expect(
    renderer.model?.bufferLayout.find(layout => layout.name === 'colors')?.format,
    'binds evaluated HDR radiance through a Float32 WebGL vertex attribute'
  ).toBe('float32x4');
  expect(
    Array.from(source.colors),
    'does not clamp or mutate caller-owned byte source colors'
  ).toEqual([128, 64, 32, 255]);

  renderer.setProps({sphericalHarmonicsDegree: 0});
  renderer.draw(renderPass);
  expect(
    renderer.model?.bufferLayout.find(layout => layout.name === 'colors')?.format,
    'restores the original normalized-byte vertex layout when higher bands are disabled'
  ).toBe('unorm8x4');
  expect(
    renderer.model?.vertexArray.attributes[3],
    'restores the caller-owned byte color buffer when higher bands are disabled'
  ).toBe(prepared.colors.data[0].buffer);

  renderer.destroy();
  expect(
    Boolean(evaluatedColorBuffer.destroyed),
    'releases only renderer-owned Float32 evaluated colors'
  ).toBe(true);
  expect(
    Boolean(prepared.colors.data[0].buffer.destroyed),
    'preserves caller-owned byte source colors'
  ).toBe(false);
  prepared.destroy();
  void 0;
});

it('SplatRenderer uses one stable Float32 WebGL layout for mixed spherical-harmonic batches', async () => {
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
    expect(false, 'creates a shared Gaussian splat WebGL model').toBe(true);
    renderer.destroy();
    directionalBatch.destroy();
    standardBatch.destroy();
    void 0;
    return;
  }

  const originalDraw = model.draw.bind(model);
  const firstVertexArray = model.vertexArray;
  const firstPipeline = model.pipeline;
  const drawnColorBuffers: Buffer[] = [];
  model.draw = renderPass => {
    expect(model.vertexArray, 'reuses one vertex array for every interleaved run').toBe(
      firstVertexArray
    );
    expect(model.pipeline, 'reuses one render pipeline for every interleaved run').toBe(
      firstPipeline
    );
    const colorBuffer = model.vertexArray.attributes[3];
    if (colorBuffer instanceof Buffer) {
      drawnColorBuffers.push(colorBuffer);
    }
    return originalDraw(renderPass);
  };
  const renderPass = device.getDefaultRenderPass();
  renderer.draw(renderPass);
  expect(Array.from(renderer.getSortedIndices()), 'interleaves both source batches').toEqual([
    1, 2, 0
  ]);
  expect(
    model.bufferLayout.find(bufferLayout => bufferLayout.name === 'colors')?.format,
    'uses one Float32 color layout for directional and ordinary byte-backed batches'
  ).toBe('float32x4');
  const ordinaryColorBuffer = drawnColorBuffers[1];
  if (!ordinaryColorBuffer) {
    expect(false, 'binds renderer-owned normalized colors for the ordinary interleaved batch').toBe(
      true
    );
    renderer.destroy();
    directionalBatch.destroy();
    standardBatch.destroy();
    void 0;
    return;
  }
  const normalizedOrdinaryColors = await readFloat32Buffer(ordinaryColorBuffer);
  expect(
    Boolean(
      Math.abs(normalizedOrdinaryColors[0] - 64 / 255) < 1e-6 &&
        Math.abs(normalizedOrdinaryColors[1] - 128 / 255) < 1e-6
    ),
    'normalizes ordinary source bytes into compatible renderer-owned Float32 colors'
  ).toBe(true);

  drawnColorBuffers.length = 0;
  renderer.setProps({cameraPosition: [2, 0, 0]});
  renderer.draw(renderPass);
  expect(model.vertexArray, 'retains the vertex array across animated frames').toBe(
    firstVertexArray
  );
  expect(model.pipeline, 'retains the pipeline across animated frames').toBe(firstPipeline);
  expect(Array.from(standardSource.colors), 'preserves ordinary caller-owned byte colors').toEqual([
    64, 128, 255, 255
  ]);

  model.draw = originalDraw;
  renderer.setProps({sphericalHarmonicsDegree: 0});
  renderer.draw(renderPass);
  expect(
    model.bufferLayout.find(bufferLayout => bufferLayout.name === 'colors')?.format,
    'switches once to the original byte layout when directional rendering is disabled'
  ).toBe('unorm8x4');
  expect(Boolean(firstVertexArray.destroyed), 'releases the superseded Float32 vertex array').toBe(
    true
  );

  renderer.destroy();
  directionalBatch.destroy();
  standardBatch.destroy();
  void 0;
});

it('SplatRenderer binds batch-local spherical harmonics to the WebGPU storage pipeline', () => {
  const device = new NullDevice({});
  Object.defineProperties(device, {
    type: {value: 'webgpu'},
    info: {value: {...device.info, type: 'webgpu', shadingLanguage: 'wgsl'}}
  });
  const prepared = makeGPUSplatData(device, makeSphericalHarmonicSource());
  const renderer = new SplatRenderer(device, {data: prepared, viewportSize: [32, 32]});
  const renderPass = device.getDefaultRenderPass();
  renderer.draw(renderPass);

  expect(
    renderer.model?.bindings['splatSphericalHarmonics'],
    'binds the prepared source coefficient allocation without repacking it'
  ).toBe(prepared.sphericalHarmonics?.data[0].buffer);
  expect(
    renderer.getBatchSphericalHarmonicsBuffer(0),
    'exposes borrowed coefficients to GPU picking passes'
  ).toBe(prepared.sphericalHarmonics?.data[0].buffer);
  expect(
    Boolean(SPLAT_STORAGE_WGSL_SHADER.includes('getSplatSphericalHarmonicBasis')),
    'evaluates higher-order spherical harmonics inside the WebGPU vertex shader'
  ).toBe(true);
  expect(
    Boolean(SPLAT_STORAGE_WGSL_SHADER.includes('sourceRowIndex : i32')),
    'retains stable flat source indices for GPU picking'
  ).toBe(true);

  renderer.destroy();
  prepared.destroy();
  void 0;
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
