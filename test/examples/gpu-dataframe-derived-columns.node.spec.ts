// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe, expect, test} from 'vitest';

const REPOSITORY_ROOT = new URL('../..', import.meta.url);
const EXAMPLE_SOURCE = readFileSync(
  fileURLToPath(new URL('examples/experimental/gpu-data-analysis/src/app.ts', REPOSITORY_ROOT)),
  'utf8'
);
const EXAMPLE_SHELL = readFileSync(
  fileURLToPath(
    new URL('examples/experimental/gpu-data-analysis/src/app-shell.ts', REPOSITORY_ROOT)
  ),
  'utf8'
);

describe('GPU data-analysis loaders.gl SQL demo', () => {
  test('offers an explicit interactive loaders.gl query action without changing automatic startup', () => {
    expect(EXAMPLE_SHELL).toContain('LOADERS.GL SQL / GPU DATAFRAME LAB');
    expect(EXAMPLE_SHELL).toContain('data-gpu-dataframe-threshold');
    expect(EXAMPLE_SHELL).toContain('data-gpu-dataframe-run');
    expect(EXAMPLE_SHELL).toContain('data-gpu-dataframe-result');
    expect(EXAMPLE_SHELL).toContain('data-gpu-dataframe-preview');
    expect(EXAMPLE_SOURCE).toContain('GPU_DATA_ANALYSIS_TEMPLATE');
    expect(EXAMPLE_SOURCE).not.toContain('const EXAMPLE_HTML');
    expect(EXAMPLE_SOURCE).toContain("addEventListener('click', this.handleGPUDataFrameRun)");
    expect(EXAMPLE_SOURCE).toContain("removeEventListener('click', this.handleGPUDataFrameRun)");
    expect(EXAMPLE_SOURCE).not.toContain('await this.runGPUDataFrameDemo()');
  });

  test('reuses Arrow-uploaded GPU columns and validates parameterized loaders.gl filtering', () => {
    expect(EXAMPLE_SOURCE).toContain("from '@luma.gl/experimental/gpu-dataframe'");
    expect(EXAMPLE_SOURCE).toContain("from '@loaders.gl/sql'");
    expect(EXAMPLE_SOURCE).toContain("from '@luma.gl/experimental/gpu-sql'");
    expect(EXAMPLE_SOURCE).toContain('resources.values.data.map(');
    expect(EXAMPLE_SOURCE).toContain(
      'gpuData: {value: valueData, category: resources.groupKeys.data[batchIndex]}'
    );
    expect(EXAMPLE_SOURCE).toContain("parseSQLPredicate('value > :threshold'");
    expect(EXAMPLE_SOURCE).toContain('planGPUDataFrameQuery(frame, {');
    expect(EXAMPLE_SOURCE).toContain("columns: ['category', 'value']");
    expect(EXAMPLE_SOURCE).toContain('parameters: {threshold}');
    expect(EXAMPLE_SOURCE).toContain('compiled.selectedCounts');
    expect(EXAMPLE_SOURCE).toContain('CPU verified');
    expect(EXAMPLE_SOURCE).toContain('compiled?.destroy()');
    expect(EXAMPLE_SOURCE).toContain('frame?.destroy()');
  });
});
