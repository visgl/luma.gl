// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
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

test('paged Gaussian GPU shaders preserve sparse source rows within baseline storage limits', t => {
  const projection = new WgslReflect(GPU_PAGED_SPLAT_PROJECTION_SHADER);
  const features = new WgslReflect(GPU_PAGED_SPLAT_FEATURE_SHADER);
  const render = new WgslReflect(GPU_PAGED_SPLAT_RENDER_SHADER);

  for (const [name, reflection, layout] of [
    ['projection', projection, GPU_PAGED_SPLAT_PROJECTION_SHADER_LAYOUT],
    ['features', features, GPU_PAGED_SPLAT_FEATURE_SHADER_LAYOUT]
  ] as const) {
    t.equal(reflection.storage.length, 8, `${name} uses only eight portable storage bindings`);
    t.deepEqual(
      reflection.storage.map(resource => ({name: resource.name, location: resource.binding})),
      layout.bindings
        .filter(binding => binding.type !== 'uniform')
        .map(binding => ({name: binding.name, location: binding.location})),
      `${name} retains separate caller-owned source storage and renderer-owned sparse indices`
    );
    const uniforms = reflection.uniforms.find(uniform => uniform.name === 'graphUniforms');
    t.equal(uniforms?.size, 128, `${name} reuses the existing 128-byte camera uniform allocation`);
    t.deepEqual(
      uniforms?.members?.slice(-2).map(member => ({name: member.name, offset: member.offset})),
      [
        {name: 'hasActiveRows', offset: 120},
        {name: 'sourceRowOffset', offset: 124}
      ],
      `${name} fills previously unused source-index uniform padding`
    );
  }

  t.equal(render.storage.length, 1, 'globally gathered presentation binds one projected segment');
  t.deepEqual(
    [
      ...render.uniforms.map(resource => ({name: resource.name, location: resource.binding})),
      ...render.storage.map(resource => ({name: resource.name, location: resource.binding}))
    ],
    GPU_PAGED_SPLAT_RENDER_SHADER_LAYOUT.bindings.map(binding => ({
      name: binding.name,
      location: binding.location
    })),
    'ordered output segments need no duplicated source or sorted-index presentation bindings'
  );
  t.equal(
    projection.structs.find(struct => struct.name === 'ProjectedSplat')?.size,
    48,
    'preserves shared 48-byte anisotropic HDR projected records'
  );
  t.match(
    GPU_PAGED_SPLAT_PROJECTION_SHADER,
    /batchRowIndex = activeRows\[projectedRowIndex\]/,
    'projects only compact selected page-local source rows'
  );
  t.match(
    GPU_PAGED_SPLAT_PROJECTION_SHADER,
    /depthKeys\[graphUniforms\.batchOffset \+ projectedRowIndex\]/,
    'publishes every page into one exact global depth-key domain'
  );
  t.match(
    GPU_PAGED_SPLAT_FEATURE_SHADER,
    /atomicAdd\(&drawCommands\[1u\], 1u\)/,
    'counts only sparse rows surviving projection, semantic filtering, and SH evaluation'
  );
  t.match(
    GPU_PAGED_SPLAT_FEATURE_SHADER,
    /pow\(max\(projectedColor\.rgb, vec3<f32>\(0\.0\)\), vec3<f32>\(2\.2\)\)/,
    'converts each selected sRGB source after SH without assuming uniform cross-page color formats'
  );
  t.match(
    GPU_PAGED_SPLAT_RENDER_SHADER,
    /projectedRecords\[instanceIndex\]/,
    'consumes already globally ordered projected output segments directly'
  );
  t.match(
    GPU_PAGED_SPLAT_PROJECTION_SHADER,
    /fn getProjectedScreenAxis\(clipCenter: vec4<f32>, worldAxis: vec3<f32>\)/,
    'projects world covariance through the analytic homogeneous perspective Jacobian'
  );
  t.match(
    GPU_PAGED_SPLAT_PROJECTION_SHADER,
    /alpha \*= sqrt\(originalDeterminant \/ filteredDeterminant\)/,
    'preserves integrated Gaussian opacity when adding a screen-space antialias kernel'
  );
  t.match(
    GPU_PAGED_SPLAT_PROJECTION_SHADER,
    /min\(sourceAlpha \* 4\.0 - 3\.0, 5\.0\)/,
    'maps already-decoded Spark hierarchy opacity from 1–2 into its authored 1–5 domain'
  );
  t.match(
    GPU_PAGED_SPLAT_PROJECTION_SHADER,
    /min\(firstSupportAxisLength, maximumSupportAxisLength\)/,
    'caps opted-in RAD support axes individually after parent opacity expansion'
  );
  t.match(
    GPU_PAGED_SPLAT_RENDER_SHADER,
    /1\.0 - pow\(max\(1\.0 - gaussianWeight, 0\.0\), opaqueExponent\)/,
    "retains Spark's nonlinear opaque-parent falloff without expanding projected records"
  );
  t.end();
});

test('GPUPagedSplatRenderer rejects devices without WebGPU compute graphs', t => {
  const device = new NullDevice({});
  t.throws(
    () => new GPUPagedSplatRenderer(device),
    /requires a WebGPU device/,
    'keeps WebGL source drawing on the existing fallback renderer'
  );
  t.end();
});

test('GPUPagedSplatRenderer retains sparse independent pages and bounded source segments lazily', t => {
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

  t.equal(renderer.pages[0]?.data, firstPage, 'retains the first intact original source page');
  t.equal(renderer.pages[1]?.data, secondPage, 'retains the independent second source page');
  t.equal(renderer.pages[0]?.activeRows, selectedFirstRows, 'retains caller-owned sparse row IDs');
  t.equal(renderer.compiledGraph, undefined, 'defers all compute graph compilation until encoding');
  t.equal(renderer.sortedIndexBuffer, undefined, 'allocates no global permutation eagerly');
  t.equal(renderer.uniformBuffer, undefined, 'allocates no presentation uniforms eagerly');
  t.deepEqual(renderer.projectedRecordBuffers, [], 'allocates no gathered output segment eagerly');
  t.equal(renderer.stats.pageCount, 2, 'tracks independently retained source pages');
  t.equal(renderer.stats.rowCount, 7, 'reports the complete borrowed loaded source row count');
  t.equal(renderer.stats.activeRowCount, 4, 'projects only four caller-selected page-local rows');
  t.equal(renderer.stats.splatCount, 4, 'reports the actual sparse visible-work upper bound');
  t.equal(
    renderer.stats.sourceSegmentCount,
    4,
    'retains one bounded source topology independent of sparse frontier cardinality'
  );
  t.equal(renderer.stats.maxProjectedSplatsPerSegment, 2, 'honors the forced segment limit');
  t.equal(renderer.stats.segmentCount, 0, 'keeps output segment allocation deferred');
  t.equal(renderer.stats.sortMode, 'global', 'plans one exact cross-page global depth ordering');
  t.equal(
    renderer.stats.sourceGpuByteLength,
    firstPage.byteLength + secondPage.byteLength,
    'accounts for borrowed GPU source pages independently of renderer-owned storage'
  );

  const originalFirstPositions = firstPage.positions.data[0].buffer;
  const originalSecondPositions = secondPage.positions.data[0].buffer;
  const rendererIndirectCommands = renderer.drawCommands.buffer;
  renderer.destroy();
  renderer.destroy();
  t.ok(renderer.destroyed, 'renderer destruction is idempotent');
  t.ok(rendererIndirectCommands.destroyed, 'releases its owned indirect command allocation');
  t.notOk(originalFirstPositions.destroyed, 'never destroys the first borrowed source allocation');
  t.notOk(originalSecondPositions.destroyed, 'never destroys the second source allocation');
  firstPage.destroy();
  secondPage.destroy();
  t.end();
});

test('GPUPagedSplatRenderer validates page-local sparse ownership and source identities', t => {
  const device = makePagedWebGPUNullDevice();
  const foreignDevice = makePagedWebGPUNullDevice();
  const localPage = makeGPUSplatData(device, makePagedSplatSource([0.1, 0.8], 700, 4));
  const foreignPage = makeGPUSplatData(foreignDevice, makePagedSplatSource([0.2], 1, 5));
  const renderer = new GPUPagedSplatRenderer(device);

  t.equal(renderer.stats.activeRowCount, 0, 'starts safely with an empty streaming frontier');
  t.throws(
    () => renderer.setFrontier([{id: 'foreign', data: foreignPage}]),
    /own device/,
    'rejects pages borrowed from another WebGPU device'
  );
  t.throws(
    () =>
      renderer.setFrontier([
        {id: 'repeated', data: localPage},
        {id: 'repeated', data: localPage}
      ]),
    /unique nonempty/,
    'requires stable unique source page identities'
  );
  t.throws(
    () =>
      renderer.setFrontier([
        {id: 'outside-source', data: localPage, activeRows: new Uint32Array([2])}
      ]),
    /source-page-local/,
    'rejects global row offsets in a batch-local active-row frontier'
  );

  renderer.setFrontier([{id: 'source', data: localPage, activeRows: new Uint32Array([1])}]);
  t.equal(renderer.stats.activeRowCount, 1, 'accepts a valid original source-row selection');
  renderer.setPages([{id: 'source', data: localPage}]);
  t.equal(renderer.stats.activeRowCount, 2, 'accepts page-oriented aliases without row copies');
  renderer.setProps({data: localPage});
  t.equal(renderer.batches[0], localPage, 'accepts existing graph-style borrowed source props');
  renderer.setFrontier([]);
  t.equal(renderer.stats.pageCount, 0, 'supports empty hierarchy frontiers safely');
  t.notOk(localPage.destroyed, 'frontier replacement never destroys caller-owned source pages');

  renderer.destroy();
  localPage.destroy();
  foreignPage.destroy();
  t.end();
});

test('GPUPagedSplatRenderer plans aligned source ranges beyond one storage binding', t => {
  const device = makePagedWebGPUNullDevice();
  device.limits.maxStorageBufferBindingSize = 1_024;
  device.limits.minStorageBufferOffsetAlignment = 256;
  const depths = Array.from({length: 130}, (_, rowIndex) => rowIndex / 130);
  const sourcePage = makeGPUSplatData(device, makePagedSplatSource(depths, 70_000, 12));
  const renderer = new GPUPagedSplatRenderer(device, {
    pages: [{id: 'oversized-source', data: sourcePage}],
    maxProjectedSplatsPerSegment: 20
  });

  t.ok(
    sourcePage.positions.data[0].buffer.byteLength > device.limits.maxStorageBufferBindingSize,
    'retains the original caller allocation even when it exceeds one storage binding'
  );
  t.equal(renderer.stats.maxProjectedSplatsPerSegment, 20, 'respects bounded output capacity');
  t.equal(renderer.stats.sourceSegmentCount, 9, 'splits two aligned 64-row windows and a tail');
  t.equal(renderer.stats.activeRowCount, 130, 'retains every original source row exactly once');

  renderer.setFrontier([
    {
      id: 'oversized-source',
      data: sourcePage,
      activeRows: new Uint32Array([65, 127, 3, 128])
    }
  ]);
  t.equal(
    renderer.stats.sourceSegmentCount,
    9,
    'retains every aligned source window while sparse row counts change'
  );
  t.equal(renderer.stats.activeRowCount, 4, 'keeps sparse work proportional to active rows');
  renderer.destroy();
  t.notOk(sourcePage.destroyed, 'never destroys the oversized borrowed source allocation');
  sourcePage.destroy();
  t.end();
});

test('GPUPagedSplatRenderer retains directional SH, semantic controls, and HDR source ownership', t => {
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

  t.equal(sourcePage.colors.format, 'float32x4', 'preserves original source HDR radiance');
  t.equal(renderer.props.toneMapping, 'reinhard', 'adapts HDR source pages for SDR presentation');
  t.deepEqual(renderer.props.cameraPosition, [1, 2, 3], 'keeps source SH camera direction');
  t.equal(renderer.props.sphericalHarmonicsDegree, 2, 'preserves requested higher-order SH bands');
  t.equal(renderer.props.semanticFilter, filter, 'preserves source semantic selection controls');
  t.equal(
    renderer.props.lodOpacity,
    false,
    'leaves Spark parent-opacity behavior explicitly opt-in'
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
  t.deepEqual(renderer.props.cameraPosition, [3, 2, 1], 'updates source SH lighting direction');
  t.equal(renderer.props.sphericalHarmonicsDegree, 3, 'supports all three Khronos SH bands');
  t.equal(renderer.props.semanticFilter, undefined, 'restores unfiltered source visibility');
  t.equal(renderer.props.toneMapping, 'none', 'respects explicit display tone-map controls');
  t.equal(renderer.props.alphaCutoff, 0.2, 'preserves opacity-threshold compatibility');
  t.equal(renderer.props.radiusScale, 1.5, 'preserves point-size compatibility');
  t.equal(renderer.props.lodOpacity, true, 'enables Spark opacity only for explicit RAD callers');
  renderer.setProps({lodOpacity: false});
  t.equal(renderer.props.lodOpacity, false, 'restores ordinary non-hierarchy opacity explicitly');
  t.throws(
    () => renderer.setProps({semanticFilter: {predicate: () => true}}),
    /JavaScript predicates/,
    'rejects CPU callbacks incompatible with sparse GPU-native source traversal'
  );
  t.throws(
    () => renderer.setProps({semanticFilter: {include: [-1]}}),
    /unsigned 32-bit/,
    'rejects classes unrepresentable in caller-owned source semantic buffers'
  );

  const sparkRenderer = new GPUPagedSplatRenderer(device, {
    pages: [{id: 'spark-rad-float-source', data: sourcePage}],
    lodOpacity: true,
    toneMapping: 'none'
  });
  t.equal(
    sparkRenderer.props.toneMapping,
    'none',
    'keeps explicit Spark Float32 sRGB colors uncompressed on ordinary SDR canvases'
  );
  sparkRenderer.setFrontier([{id: 'spark-rad-float-source', data: sourcePage}]);
  t.equal(
    sparkRenderer.props.toneMapping,
    'none',
    'does not reintroduce automatic Reinhard tone mapping when a RAD frontier changes'
  );
  sparkRenderer.destroy();

  const sphericalHarmonics = sourcePage.sphericalHarmonics!.data[0].buffer;
  const semanticIdentifiers = sourcePage.semanticIds!.data[0].buffer;
  renderer.destroy();
  t.notOk(sphericalHarmonics.destroyed, 'preserves independently borrowed source SH storage');
  t.notOk(semanticIdentifiers.destroyed, 'preserves independently borrowed source class storage');
  sourcePage.destroy();
  t.end();
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
