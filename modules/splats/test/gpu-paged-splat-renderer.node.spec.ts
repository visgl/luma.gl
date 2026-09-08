// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';
import {makeGPUSplatData, type SplatSource} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUPagedSplatRenderer} from '../src/gpu-paged-splat-renderer';
import {
  GPU_PAGED_SPLAT_FEATURE_SHADER,
  GPU_PAGED_SPLAT_FEATURE_SHADER_LAYOUT,
  GPU_PAGED_SPLAT_PROJECTION_SHADER,
  GPU_PAGED_SPLAT_PROJECTION_SHADER_LAYOUT,
  GPU_PAGED_SPLAT_RENDER_SHADER,
  GPU_PAGED_SPLAT_RENDER_SHADER_LAYOUT
} from '../src/gpu-paged-splat-shaders';

it('paged Gaussian GPU shaders preserve sparse source rows within baseline storage limits', () => {
  const projection = new WgslReflect(GPU_PAGED_SPLAT_PROJECTION_SHADER);
  const features = new WgslReflect(GPU_PAGED_SPLAT_FEATURE_SHADER);
  const render = new WgslReflect(GPU_PAGED_SPLAT_RENDER_SHADER);

  for (const [name, reflection, layout] of [
    ['projection', projection, GPU_PAGED_SPLAT_PROJECTION_SHADER_LAYOUT],
    ['features', features, GPU_PAGED_SPLAT_FEATURE_SHADER_LAYOUT]
  ] as const) {
    expect(reflection.storage.length, `${name} uses only eight portable storage bindings`).toBe(8);
    expect(
      reflection.storage.map(resource => ({name: resource.name, location: resource.binding})),
      `${name} retains separate caller-owned source storage and renderer-owned sparse indices`
    ).toEqual(
      layout.bindings
        .filter(binding => binding.type !== 'uniform')
        .map(binding => ({name: binding.name, location: binding.location}))
    );
    const uniforms = reflection.uniforms.find(uniform => uniform.name === 'graphUniforms');
    expect(uniforms?.size, `${name} reuses the existing 128-byte camera uniform allocation`).toBe(
      128
    );
    expect(
      uniforms?.members?.slice(-2).map(member => ({name: member.name, offset: member.offset})),
      `${name} fills previously unused source-index uniform padding`
    ).toEqual([
      {name: 'hasActiveRows', offset: 120},
      {name: 'sourceRowOffset', offset: 124}
    ]);
  }

  expect(render.storage.length, 'globally gathered presentation binds one projected segment').toBe(
    1
  );
  expect(
    [
      ...render.uniforms.map(resource => ({name: resource.name, location: resource.binding})),
      ...render.storage.map(resource => ({name: resource.name, location: resource.binding}))
    ],
    'ordered output segments need no duplicated source or sorted-index presentation bindings'
  ).toEqual(
    GPU_PAGED_SPLAT_RENDER_SHADER_LAYOUT.bindings.map(binding => ({
      name: binding.name,
      location: binding.location
    }))
  );
  expect(
    projection.structs.find(struct => struct.name === 'ProjectedSplat')?.size,
    'preserves shared 48-byte anisotropic HDR projected records'
  ).toBe(48);
  expect(
    GPU_PAGED_SPLAT_PROJECTION_SHADER,
    'projects only compact selected page-local source rows'
  ).toMatch(/batchRowIndex = activeRows\[projectedRowIndex\]/);
  expect(
    GPU_PAGED_SPLAT_PROJECTION_SHADER,
    'publishes every page into one exact global depth-key domain'
  ).toMatch(/depthKeys\[graphUniforms\.batchOffset \+ projectedRowIndex\]/);
  expect(
    GPU_PAGED_SPLAT_FEATURE_SHADER,
    'counts only sparse rows surviving projection, semantic filtering, and SH evaluation'
  ).toMatch(/atomicAdd\(&drawCommands\[1u\], 1u\)/);
  expect(
    GPU_PAGED_SPLAT_FEATURE_SHADER,
    'converts each selected sRGB source after SH without assuming uniform cross-page color formats'
  ).toMatch(/pow\(max\(projectedColor\.rgb, vec3<f32>\(0\.0\)\), vec3<f32>\(2\.2\)\)/);
  expect(
    GPU_PAGED_SPLAT_RENDER_SHADER,
    'consumes already globally ordered projected output segments directly'
  ).toMatch(/projectedRecords\[instanceIndex\]/);
  expect(
    GPU_PAGED_SPLAT_PROJECTION_SHADER,
    'projects world covariance through the analytic homogeneous perspective Jacobian'
  ).toMatch(/fn getProjectedScreenAxis\(clipCenter: vec4<f32>, worldAxis: vec3<f32>\)/);
  expect(
    GPU_PAGED_SPLAT_PROJECTION_SHADER,
    'preserves integrated Gaussian opacity when adding a screen-space antialias kernel'
  ).toMatch(/alpha \*= sqrt\(originalDeterminant \/ filteredDeterminant\)/);
  expect(
    GPU_PAGED_SPLAT_PROJECTION_SHADER,
    'maps already-decoded Spark hierarchy opacity from 1–2 into its authored 1–5 domain'
  ).toMatch(/min\(sourceAlpha \* 4\.0 - 3\.0, 5\.0\)/);
  expect(
    GPU_PAGED_SPLAT_PROJECTION_SHADER,
    'caps opted-in RAD support axes individually after parent opacity expansion'
  ).toMatch(/min\(firstSupportAxisLength, maximumSupportAxisLength\)/);
  expect(
    GPU_PAGED_SPLAT_RENDER_SHADER,
    "retains Spark's nonlinear opaque-parent falloff without expanding projected records"
  ).toMatch(/1\.0 - pow\(max\(1\.0 - gaussianWeight, 0\.0\), opaqueExponent\)/);
  void 0;
});

it('GPUPagedSplatRenderer rejects devices without WebGPU compute graphs', () => {
  const device = new NullDevice({});
  expect(
    () => new GPUPagedSplatRenderer(device),
    'keeps WebGL source drawing on the existing fallback renderer'
  ).toThrow(/requires a WebGPU device/);
  void 0;
});

it('GPUPagedSplatRenderer retains sparse independent pages and bounded source segments lazily', () => {
  const device = makePagedWebGPUNullDevice();
  const firstSource = makePagedSplatSource([0.9, 0.1, 0.6, 0.2, 0.4], 100, 7);
  const secondSource = makePagedSplatSource([0.8, 0.3], 500, 8);
  const firstPage = makeGPUSplatData(device, firstSource);
  const secondPage = makeGPUSplatData(device, secondSource);
  const selectedFirstRows = new Uint32Array([4, 1, 3]);
  const selectedSecondRows = new Uint32Array([0]);
  const renderer = new GPUPagedSplatRenderer(device, {
    pages: [
      {id: 'first-source-page', data: firstPage, activeRows: selectedFirstRows},
      {id: 'second-source-page', data: secondPage, activeRows: selectedSecondRows}
    ],
    viewportSize: [32, 24],
    maxProjectedSplatsPerSegment: 2
  });

  expect(renderer.pages[0]?.data, 'retains the first intact original source page').toBe(firstPage);
  expect(renderer.pages[1]?.data, 'retains the independent second source page').toBe(secondPage);
  expect(renderer.pages[0]?.activeRows, 'retains caller-owned sparse row IDs').toBe(
    selectedFirstRows
  );
  expect(renderer.compiledGraph, 'defers all compute graph compilation until encoding').toBe(
    undefined
  );
  expect(renderer.sortedIndexBuffer, 'allocates no global permutation eagerly').toBe(undefined);
  expect(renderer.uniformBuffer, 'allocates no presentation uniforms eagerly').toBe(undefined);
  expect(renderer.projectedRecordBuffers, 'allocates no gathered output segment eagerly').toEqual(
    []
  );
  expect(renderer.stats.pageCount, 'tracks independently retained source pages').toBe(2);
  expect(renderer.stats.rowCount, 'reports the complete borrowed loaded source row count').toBe(7);
  expect(renderer.stats.activeRowCount, 'projects only four caller-selected page-local rows').toBe(
    4
  );
  expect(renderer.stats.splatCount, 'reports the actual sparse visible-work upper bound').toBe(4);
  expect(
    renderer.stats.sourceSegmentCount,
    'retains one bounded source topology independent of sparse frontier cardinality'
  ).toBe(4);
  expect(renderer.stats.maxProjectedSplatsPerSegment, 'honors the forced segment limit').toBe(2);
  expect(renderer.stats.segmentCount, 'keeps output segment allocation deferred').toBe(0);
  expect(renderer.stats.sortMode, 'plans one exact cross-page global depth ordering').toBe(
    'global'
  );
  expect(
    renderer.stats.sourceGpuByteLength,
    'accounts for borrowed GPU source pages independently of renderer-owned storage'
  ).toBe(firstPage.byteLength + secondPage.byteLength);

  const originalFirstPositions = firstPage.positions.data[0].buffer;
  const originalSecondPositions = secondPage.positions.data[0].buffer;
  const rendererIndirectCommands = renderer.drawCommands.buffer;
  renderer.destroy();
  renderer.destroy();
  expect(Boolean(renderer.destroyed), 'renderer destruction is idempotent').toBe(true);
  expect(
    Boolean(rendererIndirectCommands.destroyed),
    'releases its owned indirect command allocation'
  ).toBe(true);
  expect(
    Boolean(originalFirstPositions.destroyed),
    'never destroys the first borrowed source allocation'
  ).toBe(false);
  expect(
    Boolean(originalSecondPositions.destroyed),
    'never destroys the second source allocation'
  ).toBe(false);
  firstPage.destroy();
  secondPage.destroy();
  void 0;
});

it('GPUPagedSplatRenderer validates page-local sparse ownership and source identities', () => {
  const device = makePagedWebGPUNullDevice();
  const foreignDevice = makePagedWebGPUNullDevice();
  const localPage = makeGPUSplatData(device, makePagedSplatSource([0.1, 0.8], 700, 4));
  const foreignPage = makeGPUSplatData(foreignDevice, makePagedSplatSource([0.2], 1, 5));
  const renderer = new GPUPagedSplatRenderer(device);

  expect(renderer.stats.activeRowCount, 'starts safely with an empty streaming frontier').toBe(0);
  expect(
    () => renderer.setFrontier([{id: 'foreign', data: foreignPage}]),
    'rejects pages borrowed from another WebGPU device'
  ).toThrow(/own device/);
  expect(
    () =>
      renderer.setFrontier([
        {id: 'repeated', data: localPage},
        {id: 'repeated', data: localPage}
      ]),
    'requires stable unique source page identities'
  ).toThrow(/unique nonempty/);
  expect(
    () =>
      renderer.setFrontier([
        {id: 'outside-source', data: localPage, activeRows: new Uint32Array([2])}
      ]),
    'rejects global row offsets in a batch-local active-row frontier'
  ).toThrow(/source-page-local/);

  renderer.setFrontier([{id: 'source', data: localPage, activeRows: new Uint32Array([1])}]);
  expect(renderer.stats.activeRowCount, 'accepts a valid original source-row selection').toBe(1);
  renderer.setPages([{id: 'source', data: localPage}]);
  expect(renderer.stats.activeRowCount, 'accepts page-oriented aliases without row copies').toBe(2);
  renderer.setProps({data: localPage});
  expect(renderer.batches[0], 'accepts existing graph-style borrowed source props').toBe(localPage);
  renderer.setFrontier([]);
  expect(renderer.stats.pageCount, 'supports empty hierarchy frontiers safely').toBe(0);
  expect(
    Boolean(localPage.destroyed),
    'frontier replacement never destroys caller-owned source pages'
  ).toBe(false);

  renderer.destroy();
  localPage.destroy();
  foreignPage.destroy();
  void 0;
});

it('GPUPagedSplatRenderer plans aligned source ranges beyond one storage binding', () => {
  const device = makePagedWebGPUNullDevice();
  device.limits.maxStorageBufferBindingSize = 1_024;
  device.limits.minStorageBufferOffsetAlignment = 256;
  const depths = Array.from({length: 130}, (_, rowIndex) => rowIndex / 130);
  const sourcePage = makeGPUSplatData(device, makePagedSplatSource(depths, 70_000, 12));
  const renderer = new GPUPagedSplatRenderer(device, {
    pages: [{id: 'oversized-source', data: sourcePage}],
    maxProjectedSplatsPerSegment: 20
  });

  expect(
    Boolean(
      sourcePage.positions.data[0].buffer.byteLength > device.limits.maxStorageBufferBindingSize
    ),
    'retains the original caller allocation even when it exceeds one storage binding'
  ).toBe(true);
  expect(renderer.stats.maxProjectedSplatsPerSegment, 'respects bounded output capacity').toBe(20);
  expect(renderer.stats.sourceSegmentCount, 'splits two aligned 64-row windows and a tail').toBe(9);
  expect(renderer.stats.activeRowCount, 'retains every original source row exactly once').toBe(130);

  renderer.setFrontier([
    {
      id: 'oversized-source',
      data: sourcePage,
      activeRows: new Uint32Array([65, 127, 3, 128])
    }
  ]);
  expect(
    renderer.stats.sourceSegmentCount,
    'retains every aligned source window while sparse row counts change'
  ).toBe(9);
  expect(renderer.stats.activeRowCount, 'keeps sparse work proportional to active rows').toBe(4);
  renderer.destroy();
  expect(
    Boolean(sourcePage.destroyed),
    'never destroys the oversized borrowed source allocation'
  ).toBe(false);
  sourcePage.destroy();
  void 0;
});

it('GPUPagedSplatRenderer retains directional SH, semantic controls, and HDR source ownership', () => {
  const device = makePagedWebGPUNullDevice();
  const source = makePagedSplatSource([0.4, 0.8], 90, 3);
  source.colors = new Float32Array([4, 1, 0.5, 1, 2, 0.5, 0.25, 1]);
  source.semanticIds = new Uint32Array([4, 9]);
  source.sphericalHarmonics = new Float32Array(90);
  source.sphericalHarmonicsDegree = 3;
  const sourcePage = makeGPUSplatData(device, source);
  const filter = {include: new Set([4, 9]), exclude: [9], includeUnlabeled: true};
  const renderer = new GPUPagedSplatRenderer(device, {
    pages: [{id: 'directional-source', data: sourcePage}],
    cameraPosition: [1, 2, 3],
    sphericalHarmonicsDegree: 2,
    semanticFilter: filter
  });

  expect(sourcePage.colors.format, 'preserves original source HDR radiance').toBe('float32x4');
  expect(renderer.props.toneMapping, 'adapts HDR source pages for SDR presentation').toBe(
    'reinhard'
  );
  expect(renderer.props.cameraPosition, 'keeps source SH camera direction').toEqual([1, 2, 3]);
  expect(renderer.props.sphericalHarmonicsDegree, 'preserves requested higher-order SH bands').toBe(
    2
  );
  expect(renderer.props.semanticFilter, 'preserves source semantic selection controls').toBe(
    filter
  );
  expect(renderer.props.lodOpacity, 'leaves Spark parent-opacity behavior explicitly opt-in').toBe(
    false
  );
  renderer.setProps({
    cameraPosition: [3, 2, 1],
    sphericalHarmonicsDegree: 3,
    semanticFilter: undefined,
    toneMapping: 'none',
    opacityThreshold: 0.2,
    pointSize: 1.5,
    lodOpacity: true
  });
  expect(renderer.props.cameraPosition, 'updates source SH lighting direction').toEqual([3, 2, 1]);
  expect(renderer.props.sphericalHarmonicsDegree, 'supports all three Khronos SH bands').toBe(3);
  expect(renderer.props.semanticFilter, 'restores unfiltered source visibility').toBe(undefined);
  expect(renderer.props.toneMapping, 'respects explicit display tone-map controls').toBe('none');
  expect(renderer.props.alphaCutoff, 'preserves opacity-threshold compatibility').toBe(0.2);
  expect(renderer.props.radiusScale, 'preserves point-size compatibility').toBe(1.5);
  expect(renderer.props.lodOpacity, 'enables Spark opacity only for explicit RAD callers').toBe(
    true
  );
  renderer.setProps({lodOpacity: false});
  expect(renderer.props.lodOpacity, 'restores ordinary non-hierarchy opacity explicitly').toBe(
    false
  );
  expect(
    () => renderer.setProps({semanticFilter: {predicate: () => true}}),
    'rejects CPU callbacks incompatible with sparse GPU-native source traversal'
  ).toThrow(/JavaScript predicates/);
  expect(
    () => renderer.setProps({semanticFilter: {include: [-1]}}),
    'rejects classes unrepresentable in caller-owned source semantic buffers'
  ).toThrow(/unsigned 32-bit/);

  const sparkRenderer = new GPUPagedSplatRenderer(device, {
    pages: [{id: 'spark-rad-float-source', data: sourcePage}],
    lodOpacity: true,
    toneMapping: 'none'
  });
  expect(
    sparkRenderer.props.toneMapping,
    'keeps explicit Spark Float32 sRGB colors uncompressed on ordinary SDR canvases'
  ).toBe('none');
  sparkRenderer.setFrontier([{id: 'spark-rad-float-source', data: sourcePage}]);
  expect(
    sparkRenderer.props.toneMapping,
    'does not reintroduce automatic Reinhard tone mapping when a RAD frontier changes'
  ).toBe('none');
  sparkRenderer.destroy();

  const sphericalHarmonics = sourcePage.sphericalHarmonics!.data[0].buffer;
  const semanticIdentifiers = sourcePage.semanticIds!.data[0].buffer;
  renderer.destroy();
  expect(
    Boolean(sphericalHarmonics.destroyed),
    'preserves independently borrowed source SH storage'
  ).toBe(false);
  expect(
    Boolean(semanticIdentifiers.destroyed),
    'preserves independently borrowed source class storage'
  ).toBe(false);
  sourcePage.destroy();
  void 0;
});

function makePagedWebGPUNullDevice(): NullDevice {
  const device = new NullDevice({});
  Object.defineProperties(device, {
    type: {value: 'webgpu'},
    info: {value: {...device.info, type: 'webgpu', shadingLanguage: 'wgsl'}}
  });
  return device;
}

function makePagedSplatSource(
  depths: readonly number[],
  rowIndexBase: number,
  sourceBatchIndex: number
): SplatSource {
  const positions = new Float32Array(depths.length * 3);
  const scales = new Float32Array(depths.length * 3);
  const rotations = new Float32Array(depths.length * 4);
  const colors = new Uint8Array(depths.length * 4);
  const opacities = new Float32Array(depths.length);
  for (const [rowIndex, depth] of depths.entries()) {
    positions[rowIndex * 3 + 2] = depth;
    scales.set([0.3, 0.2, 0.1], rowIndex * 3);
    rotations[rowIndex * 4] = 1;
    colors.set([255, 128, 32, 255], rowIndex * 4);
    opacities[rowIndex] = 1;
  }
  return {positions, scales, rotations, colors, opacities, rowIndexBase, sourceBatchIndex};
}
