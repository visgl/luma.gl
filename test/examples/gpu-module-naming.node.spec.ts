// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import * as experimentalRoot from '@luma.gl/graph/experimental/simulation';
import * as simpleGraphRoot from '@luma.gl/graph/gpu-simple-graph';
import * as executionGraph from '@luma.gl/graph/gpu-graph';
import * as gpuCore from '@luma.gl/graph/gpu-core';
import * as gpuData from '@luma.gl/graph/gpu-data';
import * as gpuCrossfilter from '@luma.gl/graph/gpu-crossfilter';
import * as gpuDataframe from '@luma.gl/graph/gpu-dataframe';
import * as gpuGraphModule from '@luma.gl/graph/gpu-graph-algorithms';
import * as gpuVectorSearch from '@luma.gl/graph/gpu-vector-search';
import * as gpuProject from '@luma.gl/graph/gpu-project';
import * as gpuRaster from '@luma.gl/graph/gpu-raster';
import * as gpuTables from '@luma.gl/graph/gpu-tables';
import * as models from '@luma.gl/engine/models';
import * as gpuModels from '@luma.gl/graph/experimental/models';
import * as gpuTrace from '@luma.gl/graph/gpu-trace';
import {describe, expect, test} from 'vitest';

const DATA_MODULES = ['gpu-data'] as const;
const EXPERIMENTAL_MODULES = ['models', 'simulation'] as const;
const GRAPH_MODULES = [
  'gpu-core',
  'gpu-graph',
  'gpu-graph-algorithms',
  'gpu-parse',
  'gpu-physics',
  'gpu-vector-search',
  'gpu-timeseries',
  'gpu-geometry',
  'gpu-pointcloud',
  'gpu-dggs',
  'gpu-h3',
  'gpu-a5',
  'gpu-tables',
  'gpu-dataframe',
  'gpu-sql',
  'gpu-crossfilter',
  'gpu-project',
  'gpu-raster',
  'gpu-trace',
  'geospatial',
  'lucim',
  'gpu-simulation',
  'gpu-effects'
] as const;
const UNPUBLISHED_WORKING_NAMES = [
  'gpu-primitives',
  'lugraph',
  'luraster',
  'luproj',
  'ludf',
  'luvs',
  'luxfilter',
  'lutrace'
] as const;

describe('experimental GPU module naming', () => {
  test('distinguishes semantic graphs, command graphs, and graph analytics', () => {
    expect(executionGraph.GPUGraph).toBe(gpuCore.GPUGraph);
    expect(gpuCore.GPUGraph).not.toBe(gpuCore.GPUCommandGraph);
    expect(gpuCore.GPUCommandGraph.name).toBe('GPUCommandGraph');
    expect(gpuGraphModule.GPUGraphAlgorithmsData.name).toBe('GPUGraphAlgorithmsData');
    expect(executionGraph.GPUCommandGraph).toBe(gpuCore.GPUCommandGraph);
    expect(gpuCore.GPUCommandGraph).not.toBe(gpuGraphModule.GPUGraphAlgorithmsData);
  });

  test('publishes only the canonical package subpaths', () => {
    expect(existsSync(path.join(process.cwd(), 'modules/experimental/package.json'))).toBe(false);
    expect(existsSync(path.join(process.cwd(), 'modules/gpgpu'))).toBe(false);

    const graphPackage = JSON.parse(
      readFileSync(path.join(process.cwd(), 'modules/graph/package.json'), 'utf8')
    ) as {exports: Record<string, unknown>};
    for (const moduleName of GRAPH_MODULES) {
      expect(graphPackage.exports[`./${moduleName}`], moduleName).toBeDefined();
    }
    for (const moduleName of DATA_MODULES) {
      expect(graphPackage.exports[`./${moduleName}`], moduleName).toBeDefined();
    }
    expect(graphPackage.exports['./gpu-graph-algorithms/benchmarks']).toBeDefined();
    for (const moduleName of EXPERIMENTAL_MODULES) {
      expect(graphPackage.exports[`./experimental/${moduleName}`], moduleName).toBeDefined();
    }
    for (const moduleName of UNPUBLISHED_WORKING_NAMES) {
      expect(graphPackage.exports[`./${moduleName}`]).toBeUndefined();
    }
  });

  test('uses canonical source directories without compatibility copies', () => {
    for (const moduleName of DATA_MODULES) {
      expect(
        existsSync(path.join(process.cwd(), 'modules/graph/src', moduleName)),
        moduleName
      ).toBe(true);
    }
    for (const moduleName of EXPERIMENTAL_MODULES) {
      expect(
        existsSync(path.join(process.cwd(), 'modules/graph/src/experimental', moduleName)),
        moduleName
      ).toBe(true);
    }
    for (const moduleName of GRAPH_MODULES) {
      expect(
        existsSync(path.join(process.cwd(), 'modules/graph/src', moduleName)),
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
      '@luma.gl/graph/gpu-data',
      '@luma.gl/graph/gpu-core',
      '@luma.gl/graph/gpu-graph-algorithms',
      '@luma.gl/graph/gpu-physics',
      '@luma.gl/graph/gpu-graph-algorithms/benchmarks',
      '@luma.gl/graph/gpu-vector-search',
      '@luma.gl/graph/gpu-tables',
      '@luma.gl/graph/experimental/models',
      '@luma.gl/graph/experimental/simulation'
    ]) {
      expect(() => import.meta.resolve(packagePath), packagePath).not.toThrow();
    }
    for (const packagePath of [
      '@luma.gl/tables',
      '@luma.gl/experimental/gpu-tables',
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
    expect(gpuGraphModule.GPUGraphAlgorithmsData).toBeTypeOf('function');
    expect(gpuVectorSearch.GPUSimilaritySearch).toBeTypeOf('function');
    expect(gpuTables.GPURecordBatch).toBeTypeOf('function');
    expect(gpuTables.GPUTable).toBeTypeOf('function');
    expect(models.PathStorageModel).toBeTypeOf('function');
    expect(models.PolygonStorageModel).toBeTypeOf('function');
    expect(gpuModels.createGpuPathRangeState).toBeTypeOf('function');
    expect(gpuRaster.GPURaster).toBeTypeOf('function');
    expect(gpuProject.GPUProjection).toBeTypeOf('function');
    expect(gpuDataframe.GPUDataFrame).toBeTypeOf('function');
    expect(gpuCrossfilter.GPUCrossfilter).toBeTypeOf('function');
    expect(gpuTrace.GPUTraceScene).toBeTypeOf('function');

    for (const exportName of ['GPUData', 'GPUCommandGraph', 'GPUGraphAlgorithmsData']) {
      expect(exportName in simpleGraphRoot, exportName).toBe(false);
    }
    for (const exportName of ['GPURecordBatch', 'GPUTable', 'PathStorageModel']) {
      expect(exportName in experimentalRoot, exportName).toBe(false);
    }

    for (const moduleExports of [gpuGraphModule, gpuVectorSearch, gpuDataframe, gpuCrossfilter]) {
      expect(Object.keys(moduleExports).some(exportName => /^Lu|^Lux/u.test(exportName))).toBe(
        false
      );
    }
  });

  test('gives every public GPU submodule a subgroup in the GPGPU API reference', () => {
    type DocumentationCategory = {label: string; items: Array<string | DocumentationCategory>};
    const documentation = JSON.parse(
      readFileSync(path.join(process.cwd(), 'docs/table-of-contents.json'), 'utf8')
    ) as DocumentationCategory[];
    const reference = documentation.find(category => category.label === 'API Reference');
    const packageReference = reference?.items.find(
      (category): category is DocumentationCategory =>
        typeof category !== 'string' && category.label === '@luma.gl/graph/gpu-simple-graph'
    );
    const moduleGroups: Record<string, string> = {'gpu-data': 'GPU Data'};
    const graphReference = reference?.items.find(
      (category): category is DocumentationCategory =>
        typeof category !== 'string' && category.label === '@luma.gl/graph'
    );
    for (const label of [
      'GPU Core',
      'GPU Graph',
      'GPU Graph Algorithms',
      'GPU Tables',
      'GPU Raster',
      'GPU Project',
      'GPU Trace',
      'GPU Dataframe',
      'GPU Crossfilter'
    ]) {
      expect(
        graphReference?.items.some(
          category => typeof category !== 'string' && category.label === label
        ),
        label
      ).toBe(true);
    }
    const packageManifest = JSON.parse(
      readFileSync(path.join(process.cwd(), 'modules/graph/package.json'), 'utf8')
    ) as {exports: Record<string, unknown>};
    const publicGPUSubmodules = Object.keys(packageManifest.exports)
      .filter(subpath => /^\.\/gpu-[^/]+$/.test(subpath))
      .map(subpath => subpath.slice(2));
    expect(publicGPUSubmodules).toEqual(expect.arrayContaining(Object.keys(moduleGroups)));
    for (const label of Object.values(moduleGroups)) {
      const group = packageReference?.items.find(
        (category): category is DocumentationCategory =>
          typeof category !== 'string' && category.label === label
      );
      expect(group, label).toBeDefined();
      expect(group?.items.length, label).toBeGreaterThan(0);
    }
  });

  test('publishes only canonical documentation routes', () => {
    const experimentalDocumentation = path.join(process.cwd(), 'docs/api-reference/experimental');
    const gpgpuDocumentation = path.join(process.cwd(), 'docs/api-reference/graph');
    expect(existsSync(path.join(gpgpuDocumentation, 'gpu-vector-search.md'))).toBe(true);
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
