// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

import React from 'react';
import {renderToString} from 'react-dom/server';
import typescript from 'typescript';
import {beforeEach, describe, expect, test, vi} from 'vitest';

type MockLuvsBenchmarkPanelProps = {
  title: string;
  description: string;
  runLabel: string;
  onRun: () => Promise<React.ReactNode>;
};

const benchmarkSource = readFileSync(
  new URL('../../website/src/components/docs/luvs-benchmark.tsx', import.meta.url),
  'utf8'
);

const transpiledBenchmark = typescript.transpileModule(benchmarkSource, {
  compilerOptions: {
    esModuleInterop: true,
    jsx: typescript.JsxEmit.ReactJSX,
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2022
  }
});

const createDevice = vi.fn();
const runLuvsBenchmark = vi.fn();
let selectedDevice: Record<string, unknown> | undefined;
let benchmarkPanelProps: MockLuvsBenchmarkPanelProps | undefined;

const nativeRequire = createRequire(import.meta.url);
function requireLuvsBenchmarkDependency(moduleName: string): unknown {
  if (moduleName === './luvs-benchmark-runtime') {
    return {
      LUVS_BENCHMARK_MEASURED_ITERATIONS: 5,
      LUVS_BENCHMARK_WARMUP_ITERATIONS: 1,
      runLuvsBenchmark
    };
  }
  if (moduleName === '../../react-luma/store/device-store') {
    return {
      createDevice,
      useStore: (selector: (state: {presentationDevice?: unknown; device?: unknown}) => unknown) =>
        selector({presentationDevice: selectedDevice})
    };
  }
  if (moduleName === './live-benchmark-panel') {
    return {
      LiveBenchmarkPanel: (props: MockLuvsBenchmarkPanelProps) => {
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

const benchmarkModule: {exports: Record<string, React.ComponentType>} = {exports: {}};
const loadLuvsBenchmark = new Function(
  'require',
  'module',
  'exports',
  transpiledBenchmark.outputText
);
loadLuvsBenchmark(requireLuvsBenchmarkDependency, benchmarkModule, benchmarkModule.exports);
const LuvsBenchmark = benchmarkModule.exports.LuvsBenchmark;

beforeEach(() => {
  createDevice.mockReset();
  runLuvsBenchmark.mockReset();
  selectedDevice = undefined;
  benchmarkPanelProps = undefined;
});

describe('luVS live vector-similarity benchmark documentation', () => {
  test('server-renders every workload control without creating a GPU device or starting work', () => {
    const markup = renderToString(React.createElement(LuvsBenchmark));

    for (const label of [
      'Dataset rows',
      'Dimensions',
      'Queries',
      'Nearest neighbors (K)',
      'Selected rows (%)',
      'IVF lists',
      'IVF probes',
      'Run live CPU and WebGPU vector benchmark'
    ]) {
      expect(markup).toContain(label);
    }
    expect(markup).toContain('384');
    expect(markup).toContain('768');
    expect(markup).toContain('1,536');
    expect(createDevice).not.toHaveBeenCalled();
    expect(runLuvsBenchmark).not.toHaveBeenCalled();
  });

  test('requests a WebGPU device only when the reader starts the benchmark', async () => {
    createDevice.mockRejectedValue(new Error('Deferred WebGPU device request'));
    renderToString(React.createElement(LuvsBenchmark));

    expect(createDevice).not.toHaveBeenCalled();
    await expect(benchmarkPanelProps!.onRun()).rejects.toThrow('Deferred WebGPU device request');
    expect(createDevice).toHaveBeenCalledOnce();
    expect(createDevice).toHaveBeenCalledWith('webgpu-core');
  });

  test('renders verified CPU, exact, filtered, and IVF results after an explicit run', async () => {
    selectedDevice = {type: 'webgpu'};
    runLuvsBenchmark.mockResolvedValue({
      results: [
        {label: 'CPU exact', medianMilliseconds: 2, resultCount: 10, candidateCount: 8192},
        {label: 'WebGPU exact', medianMilliseconds: 1, resultCount: 10, candidateCount: 8192},
        {
          label: 'WebGPU exact + selection',
          medianMilliseconds: 0.8,
          resultCount: 10,
          candidateCount: 512
        },
        {
          label: 'WebGPU IVF-flat + selection',
          medianMilliseconds: 0.5,
          resultCount: 10,
          candidateCount: 128,
          recall: 0.75
        }
      ],
      uploadMilliseconds: 3,
      indexBuildMilliseconds: 4,
      indexByteLength: 4096,
      options: {
        datasetRowCount: 2048,
        dimensions: 128,
        queryCount: 4,
        resultCount: 10,
        filterPercentage: 25,
        listCount: 8,
        probeCount: 2
      },
      timestampQueries: false,
      deviceLabel: 'Reader GPU'
    });
    renderToString(React.createElement(LuvsBenchmark));

    const output = await benchmarkPanelProps!.onRun();
    const markup = renderToString(output as React.ReactElement);

    expect(createDevice).not.toHaveBeenCalled();
    expect(runLuvsBenchmark).toHaveBeenCalledOnce();
    expect(markup).toContain('CPU exact');
    expect(markup).toContain('WebGPU exact + selection');
    expect(markup).toContain('WebGPU IVF-flat + selection');
    expect(markup).toContain('75.0%');
    expect(markup).toContain('Recall@K');
    expect(markup).toContain('Candidate evaluations');
    expect(markup).toContain('8,192');
    expect(markup).not.toContain('Eligible rows');
    expect(markup).toContain('Reader GPU');
    expect(markup).toContain('completion fence');
  });
});
