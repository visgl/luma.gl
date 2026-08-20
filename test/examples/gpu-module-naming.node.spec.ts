// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import * as experimentalRoot from '@luma.gl/experimental';
import * as gpgpuRoot from '@luma.gl/gpgpu';
import * as gpuCore from '@luma.gl/gpgpu/gpu-core';
import * as gpuData from '@luma.gl/gpgpu/gpu-data';
import * as gpuCrossfilter from '@luma.gl/experimental/gpu-crossfilter';
import * as gpuDataframe from '@luma.gl/experimental/gpu-dataframe';
import * as gpuGraphModule from '@luma.gl/gpgpu/gpu-graph';
import * as gpuProject from '@luma.gl/experimental/gpu-project';
import * as gpuRaster from '@luma.gl/experimental/gpu-raster';
import * as gpuTables from '@luma.gl/experimental/gpu-tables';
import * as models from '@luma.gl/experimental/models';
import * as gpuTrace from '@luma.gl/experimental/gpu-trace';
import {describe, expect, test} from 'vitest';

const GPGPU_MODULES = ['gpu-data', 'gpu-core', 'gpu-graph'] as const;
const EXPERIMENTAL_MODULES = [
  'gpu-tables',
  'models',
  'gpu-raster',
  'gpu-project',
  'gpu-dataframe',
  'gpu-crossfilter',
  'gpu-trace'
] as const;
const UNPUBLISHED_WORKING_NAMES = [
  'gpu-primitives',
  'lugraph',
  'luraster',
  'luproj',
  'ludf',
  'luxfilter',
  'lutrace'
] as const;

describe('experimental GPU module naming', () => {
  test('publishes only the canonical package subpaths', () => {
    const experimentalPackage = JSON.parse(
      readFileSync(path.join(process.cwd(), 'modules/experimental/package.json'), 'utf8')
    ) as {exports: Record<string, unknown>};
    const gpgpuPackage = JSON.parse(
      readFileSync(path.join(process.cwd(), 'modules/gpgpu/package.json'), 'utf8')
    ) as {exports: Record<string, unknown>};

    for (const moduleName of GPGPU_MODULES) {
      expect(gpgpuPackage.exports[`./${moduleName}`], moduleName).toBeDefined();
    }
    expect(gpgpuPackage.exports['./gpu-graph/benchmarks']).toBeDefined();
    for (const moduleName of EXPERIMENTAL_MODULES) {
      expect(experimentalPackage.exports[`./${moduleName}`], moduleName).toBeDefined();
    }
    expect(experimentalPackage.exports['./gpu-core']).toBeUndefined();
    expect(experimentalPackage.exports['./gpu-graph']).toBeUndefined();
    expect(experimentalPackage.exports['./gpu-graph/benchmarks']).toBeUndefined();
    for (const moduleName of UNPUBLISHED_WORKING_NAMES) {
      expect(experimentalPackage.exports[`./${moduleName}`], moduleName).toBeUndefined();
      expect(gpgpuPackage.exports[`./${moduleName}`], moduleName).toBeUndefined();
    }
  });

  test('uses canonical source directories without compatibility copies', () => {
    for (const moduleName of GPGPU_MODULES) {
      expect(
        existsSync(path.join(process.cwd(), 'modules/gpgpu/src', moduleName)),
        moduleName
      ).toBe(true);
    }
    for (const moduleName of EXPERIMENTAL_MODULES) {
      expect(
        existsSync(path.join(process.cwd(), 'modules/experimental/src', moduleName)),
        moduleName
      ).toBe(true);
    }
    expect(existsSync(path.join(process.cwd(), 'modules/experimental/src/gpu-core'))).toBe(false);
    expect(existsSync(path.join(process.cwd(), 'modules/experimental/src/gpu-graph'))).toBe(false);
    expect(existsSync(path.join(process.cwd(), 'modules/tables'))).toBe(false);
    for (const moduleName of UNPUBLISHED_WORKING_NAMES) {
      expect(
        existsSync(path.join(process.cwd(), 'modules/experimental/src', moduleName)),
        moduleName
      ).toBe(false);
    }
  });

  test('resolves new package subpaths and rejects removed package paths', () => {
    for (const packagePath of [
      '@luma.gl/gpgpu/gpu-data',
      '@luma.gl/gpgpu/gpu-core',
      '@luma.gl/gpgpu/gpu-graph',
      '@luma.gl/gpgpu/gpu-graph/benchmarks',
      '@luma.gl/experimental/gpu-tables',
      '@luma.gl/experimental/models'
    ]) {
      expect(() => import.meta.resolve(packagePath), packagePath).not.toThrow();
    }
    for (const packagePath of [
      '@luma.gl/tables',
      '@luma.gl/experimental/gpu-core',
      '@luma.gl/experimental/gpu-graph',
      '@luma.gl/experimental/gpu-graph/benchmarks'
    ]) {
      expect(() => import.meta.resolve(packagePath), packagePath).toThrow();
    }
  });

  test('exports the canonical public entry points', () => {
    expect(gpuData.GPUData).toBeTypeOf('function');
    expect(gpuData.GPUDataView).toBeTypeOf('function');
    expect(gpuData.GPUVector).toBeTypeOf('function');
    expect(gpuData.getDataTypeByteLength).toBeTypeOf('function');
    expect(gpuCore.GPUCommandGraph).toBeTypeOf('function');
    expect(gpuGraphModule.GPUGraph).toBeTypeOf('function');
    expect(gpuTables.GPURecordBatch).toBeTypeOf('function');
    expect(gpuTables.GPUTable).toBeTypeOf('function');
    expect(models.PathStorageModel).toBeTypeOf('function');
    expect(models.PolygonStorageModel).toBeTypeOf('function');
    expect(models.createGpuPathRangeState).toBeTypeOf('function');
    expect(gpuRaster.GPURaster).toBeTypeOf('function');
    expect(gpuProject.GPUProjection).toBeTypeOf('function');
    expect(gpuDataframe.GPUDataFrame).toBeTypeOf('function');
    expect(gpuCrossfilter.GPUCrossfilter).toBeTypeOf('function');
    expect(gpuTrace.GPUTraceScene).toBeTypeOf('function');

    for (const exportName of ['GPUData', 'GPUCommandGraph', 'GPUGraph']) {
      expect(exportName in gpgpuRoot, exportName).toBe(false);
    }
    for (const exportName of ['GPURecordBatch', 'GPUTable', 'PathStorageModel']) {
      expect(exportName in experimentalRoot, exportName).toBe(false);
    }

    for (const moduleExports of [gpuGraphModule, gpuDataframe, gpuCrossfilter]) {
      expect(Object.keys(moduleExports).some(exportName => /^Lu|^Lux/u.test(exportName))).toBe(
        false
      );
    }
  });

  test('publishes only canonical documentation routes', () => {
    const experimentalDocumentation = path.join(process.cwd(), 'docs/api-reference/experimental');
    for (const moduleName of [
      'gpu-core',
      'gpu-graph',
      'gpu-raster',
      'gpu-project',
      'gpu-dataframe',
      'gpu-crossfilter',
      'gpu-trace'
    ]) {
      expect(
        existsSync(path.join(experimentalDocumentation, `${moduleName}.md`)) ||
          existsSync(path.join(experimentalDocumentation, moduleName, 'README.md')),
        moduleName
      ).toBe(true);
    }
    for (const moduleName of UNPUBLISHED_WORKING_NAMES) {
      expect(existsSync(path.join(experimentalDocumentation, `${moduleName}.md`))).toBe(false);
      expect(existsSync(path.join(experimentalDocumentation, moduleName))).toBe(false);
    }
  });
});
