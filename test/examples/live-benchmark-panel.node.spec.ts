import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

import React from 'react';
import {renderToString} from 'react-dom/server';
import typescript from 'typescript';
import {describe, expect, test, vi} from 'vitest';

const benchmarkPanelSource = readFileSync(
  new URL('../../website/src/components/docs/live-benchmark-panel.tsx', import.meta.url),
  'utf8'
);
const transpiledBenchmarkPanel = typescript.transpileModule(benchmarkPanelSource, {
  compilerOptions: {
    esModuleInterop: true,
    jsx: typescript.JsxEmit.ReactJSX,
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2022
  }
});
type BenchmarkPanelComponent = React.ComponentType<{
  title: string;
  description: string;
  onRun: () => Promise<React.ReactNode>;
  unsupportedReason?: string;
  idleContent?: React.ReactNode;
}>;
const benchmarkPanelModule: {exports: Record<string, BenchmarkPanelComponent>} = {exports: {}};
const loadBenchmarkPanel = new Function(
  'require',
  'module',
  'exports',
  transpiledBenchmarkPanel.outputText
);
loadBenchmarkPanel(
  createRequire(import.meta.url),
  benchmarkPanelModule,
  benchmarkPanelModule.exports
);
const LiveBenchmarkPanel = benchmarkPanelModule.exports.LiveBenchmarkPanel;

describe('live documentation benchmark panel', () => {
  test('server-renders without running or requesting benchmark work', () => {
    const runBenchmark = vi.fn(async () => React.createElement('p', null, 'Measured results'));

    const markup = renderToString(
      React.createElement(LiveBenchmarkPanel, {
        title: 'Live projection benchmark',
        description: 'Measures actual CPU and WebGPU execution.',
        onRun: runBenchmark
      })
    );

    expect(runBenchmark).not.toHaveBeenCalled();
    expect(markup).toContain('Live projection benchmark');
    expect(markup).toContain('Measures actual CPU and WebGPU execution.');
    expect(markup).toContain('Run live WebGPU benchmark');
    expect(markup).not.toContain('Measured results');
  });

  test('explains unavailable capabilities without claiming benchmark results', () => {
    const runBenchmark = vi.fn(async () => React.createElement('p', null, 'Invalid results'));

    const markup = renderToString(
      React.createElement(LiveBenchmarkPanel, {
        title: 'Live spatial benchmark',
        description: 'Runs on WebGPU adapters.',
        onRun: runBenchmark,
        unsupportedReason: 'WebGPU is unavailable in this browser.',
        idleContent: React.createElement('p', null, 'Portable Supported ✓')
      })
    );

    expect(runBenchmark).not.toHaveBeenCalled();
    expect(markup).toContain('WebGPU is unavailable in this browser.');
    expect(markup).toContain('disabled=""');
    expect(markup).not.toContain('Invalid results');
    expect(markup).not.toContain('Portable Supported');
  });
});
