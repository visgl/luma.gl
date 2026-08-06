// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

import React from 'react';
import {renderToString} from 'react-dom/server';
import typescript from 'typescript';
import {beforeEach, describe, expect, test, vi} from 'vitest';

type MockBenchmarkPanelProps = {
  title: string;
  description: string;
  runLabel: string;
  onRun: () => Promise<React.ReactNode>;
};

const projectionBenchmarkSource = readFileSync(
  new URL('../../website/src/components/docs/projection-benchmark.tsx', import.meta.url),
  'utf8'
);
const transpiledProjectionBenchmark = typescript.transpileModule(projectionBenchmarkSource, {
  compilerOptions: {
    esModuleInterop: true,
    jsx: typescript.JsxEmit.ReactJSX,
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2022
  }
});

const projectionProvider = {project: (coordinate: number[]) => coordinate};
const createWebMercatorProjection = vi.fn(() => projectionProvider);
const runGPUProjectionBenchmark = vi.fn();
const createDevice = vi.fn();
let selectedDevice: Record<string, unknown> | undefined;
let benchmarkPanelProps: MockBenchmarkPanelProps | undefined;

const nativeRequire = createRequire(import.meta.url);
function requireProjectionBenchmarkDependency(moduleName: string): unknown {
  if (moduleName === '@luma.gl/experimental/luproj') {
    return {createWebMercatorProjection};
  }
  if (moduleName === '@luma.gl/experimental/luproj/benchmarks') {
    return {runGPUProjectionBenchmark};
  }
  if (moduleName === '../../react-luma/store/device-store') {
    return {
      createDevice,
      useStore: (selector: (state: {presentationDevice?: unknown}) => unknown) =>
        selector({presentationDevice: selectedDevice})
    };
  }
  if (moduleName === './live-benchmark-panel') {
    return {
      LiveBenchmarkPanel: (props: MockBenchmarkPanelProps) => {
        benchmarkPanelProps = props;
        return React.createElement(
          'section',
          null,
          React.createElement('h3', null, props.title),
          React.createElement('p', null, props.description),
          React.createElement('button', null, props.runLabel)
        );
      }
    };
  }

  return nativeRequire(moduleName);
}

const projectionBenchmarkModule: {exports: Record<string, React.ComponentType>} = {exports: {}};
const loadProjectionBenchmark = new Function(
  'require',
  'module',
  'exports',
  transpiledProjectionBenchmark.outputText
);
loadProjectionBenchmark(
  requireProjectionBenchmarkDependency,
  projectionBenchmarkModule,
  projectionBenchmarkModule.exports
);
const ProjectionBenchmark = projectionBenchmarkModule.exports.ProjectionBenchmark;

beforeEach(() => {
  createWebMercatorProjection.mockClear();
  runGPUProjectionBenchmark.mockReset();
  createDevice.mockReset();
  selectedDevice = undefined;
  benchmarkPanelProps = undefined;
});

describe('GPU projection live benchmark documentation', () => {
  test('publishes an embedded browser benchmark in both experimental documentation sidebars', () => {
    const documentationContent = readFileSync(
      new URL('../../docs/api-reference/experimental/luproj.md', import.meta.url),
      'utf8'
    );
    const sidebarContent = readFileSync(
      new URL('../../docs/table-of-contents.json', import.meta.url),
      'utf8'
    );
    const experimentalNavigation = readFileSync(
      new URL('../../website/src/components/docs/experimental-docs-tabs.tsx', import.meta.url),
      'utf8'
    );

    expect(documentationContent).toContain(
      "import {ProjectionBenchmark} from '@site/src/components/docs/projection-benchmark';"
    );
    expect(documentationContent).toContain('<ProjectionBenchmark />');
    expect(documentationContent).toContain("'@luma.gl/experimental/luproj/benchmarks'");
    expect(sidebarContent.match(/"api-reference\/experimental\/luproj"/g)).toHaveLength(2);
    expect(experimentalNavigation).toContain("href: '/docs/api-reference/experimental/luproj'");
  });

  test('server-renders dataset controls without creating a device or running benchmark work', () => {
    const markup = renderToString(React.createElement(ProjectionBenchmark));

    expect(markup).toContain('Live CPU versus WebGPU projection');
    expect(markup).toContain('Run projection benchmark');
    expect(markup).toContain('16,384');
    expect(markup).toContain('262,144');
    expect(createDevice).not.toHaveBeenCalled();
    expect(createWebMercatorProjection).not.toHaveBeenCalled();
    expect(runGPUProjectionBenchmark).not.toHaveBeenCalled();
  });

  test('compares direct CPU evaluation against all four real WebGPU execution paths', async () => {
    selectedDevice = {
      type: 'webgpu',
      info: {renderer: 'Reader GPU', vendor: 'Reader vendor', gpu: 'unknown'}
    };
    runGPUProjectionBenchmark.mockResolvedValue(makeProjectionBenchmarkReport());

    renderToString(React.createElement(ProjectionBenchmark));
    const benchmarkResult = await benchmarkPanelProps!.onRun();
    const markup = renderToString(React.createElement(React.Fragment, null, benchmarkResult));

    expect(createDevice).not.toHaveBeenCalled();
    expect(runGPUProjectionBenchmark).toHaveBeenCalledWith(
      selectedDevice,
      expect.objectContaining({
        projection: projectionProvider,
        coordinateCount: 16_384,
        warmupIterations: 1,
        measuredIterations: 3
      })
    );
    expect(markup).toContain('CPU provider');
    expect(markup).toContain('CPU compiled plan');
    expect(markup.match(/>WebGPU</g)).toHaveLength(4);
    expect(markup).toContain('Float32');
    expect(markup).toContain('Raw Float64');
    expect(markup).toContain('Patch scan');
    expect(markup).toContain('Explicit IDs');
    expect(markup).toContain('Reader GPU');
    expect(markup).toContain('completion fence');
  });

  test('lazily requests a cached WebGPU device when none is currently selected', async () => {
    const requestedDevice = {
      type: 'webgpu',
      info: {renderer: 'Requested GPU', vendor: 'Reader vendor', gpu: 'unknown'}
    };
    createDevice.mockResolvedValue(requestedDevice);
    runGPUProjectionBenchmark.mockResolvedValue(makeProjectionBenchmarkReport());

    renderToString(React.createElement(ProjectionBenchmark));
    expect(createDevice).not.toHaveBeenCalled();

    await benchmarkPanelProps!.onRun();

    expect(createDevice).toHaveBeenCalledOnce();
    expect(createDevice).toHaveBeenCalledWith('webgpu-core');
    expect(runGPUProjectionBenchmark).toHaveBeenCalledWith(
      requestedDevice,
      expect.objectContaining({coordinateCount: 16_384})
    );
  });
});

function makeProjectionBenchmarkReport() {
  const duration = {minimum: 0.4, median: 0.5, percentile95: 0.6, maximum: 0.6};
  const providerThroughput = 20_000_000;

  return {
    cpu: {
      coordinateCount: 16_384,
      patchCount: 4,
      warmupIterations: 1,
      measuredIterations: 3,
      maxError: 0.012,
      compilationTimeMilliseconds: duration,
      paths: [
        {
          strategy: 'provider',
          durationMilliseconds: duration,
          coordinatesPerSecond: providerThroughput
        },
        {
          strategy: 'plan-scan',
          durationMilliseconds: duration,
          coordinatesPerSecond: 30_000_000
        },
        {
          strategy: 'plan-patch-ids',
          durationMilliseconds: duration,
          coordinatesPerSecond: 40_000_000
        }
      ]
    },
    timestampQueries: false,
    paths: [
      {inputFormat: 'float32x2', patchStrategy: 'scan'},
      {inputFormat: 'float32x2', patchStrategy: 'patch-ids'},
      {inputFormat: 'uint32x4', patchStrategy: 'scan'},
      {inputFormat: 'uint32x4', patchStrategy: 'patch-ids'}
    ].map(path => ({
      ...path,
      memoryByteLength: 262_144,
      maxError: 0.012,
      cpuEncodeTimeMilliseconds: duration,
      synchronizedTimeMilliseconds: duration,
      synchronizedCoordinatesPerSecond: 100_000_000,
      synchronizedSpeedupOverCPUProvider: 100_000_000 / providerThroughput
    }))
  };
}
