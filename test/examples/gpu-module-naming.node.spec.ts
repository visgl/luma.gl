// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import * as gpuCore from '@luma.gl/experimental/gpu-core';
import * as gpuCrossfilter from '@luma.gl/experimental/gpu-crossfilter';
import * as gpuDataframe from '@luma.gl/experimental/gpu-dataframe';
import * as gpuGraphModule from '@luma.gl/experimental/gpu-graph';
import * as gpuProject from '@luma.gl/experimental/gpu-project';
import * as gpuRaster from '@luma.gl/experimental/gpu-raster';
import * as gpuTrace from '@luma.gl/experimental/gpu-trace';
import {describe, expect, test} from 'vitest';

const CANONICAL_MODULES = [
  'gpu-core',
  'gpu-graph',
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
    const packageJson = JSON.parse(
      readFileSync(path.join(process.cwd(), 'modules/experimental/package.json'), 'utf8')
    ) as {exports: Record<string, unknown>};

    for (const moduleName of CANONICAL_MODULES) {
      expect(packageJson.exports[`./${moduleName}`], moduleName).toBeDefined();
    }
    for (const moduleName of UNPUBLISHED_WORKING_NAMES) {
      expect(packageJson.exports[`./${moduleName}`], moduleName).toBeUndefined();
    }
  });

  test('uses canonical source directories without compatibility copies', () => {
    for (const moduleName of CANONICAL_MODULES) {
      expect(
        existsSync(path.join(process.cwd(), 'modules/experimental/src', moduleName)),
        moduleName
      ).toBe(true);
    }
    for (const moduleName of UNPUBLISHED_WORKING_NAMES) {
      expect(
        existsSync(path.join(process.cwd(), 'modules/experimental/src', moduleName)),
        moduleName
      ).toBe(false);
    }
  });

  test('exports the canonical public entry points', () => {
    expect(gpuCore.GPUCommandGraph).toBeTypeOf('function');
    expect(gpuGraphModule.GPUGraph).toBeTypeOf('function');
    expect(gpuRaster.GPURaster).toBeTypeOf('function');
    expect(gpuProject.GPUProjection).toBeTypeOf('function');
    expect(gpuDataframe.GPUDataFrame).toBeTypeOf('function');
    expect(gpuCrossfilter.GPUCrossfilter).toBeTypeOf('function');
    expect(gpuTrace.GPUTraceScene).toBeTypeOf('function');

    for (const moduleExports of [gpuGraphModule, gpuDataframe, gpuCrossfilter]) {
      expect(Object.keys(moduleExports).some(exportName => /^Lu|^Lux/u.test(exportName))).toBe(
        false
      );
    }
  });

  test('publishes only canonical documentation routes', () => {
    const experimentalDocumentation = path.join(process.cwd(), 'docs/api-reference/experimental');
    for (const moduleName of CANONICAL_MODULES) {
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
