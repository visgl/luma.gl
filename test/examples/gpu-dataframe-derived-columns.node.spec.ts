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

describe('GPU data-analysis luDF derived-column demo', () => {
  test('offers an explicit interactive derived-column action without changing automatic startup', () => {
    expect(EXAMPLE_SHELL).toContain('GPU DATAFRAME / DERIVED COLUMN LAB');
    expect(EXAMPLE_SHELL).toContain('data-gpu-dataframe-adjustment');
    expect(EXAMPLE_SHELL).toContain('data-gpu-dataframe-multiplier');
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

  test('reuses Arrow-uploaded GPU columns and validates parameterized derivation and filtering', () => {
    expect(EXAMPLE_SOURCE).toContain("from '@luma.gl/experimental/gpu-dataframe'");
    expect(EXAMPLE_SOURCE).toContain('resources.values.data.map(');
    expect(EXAMPLE_SOURCE).toContain(
      'gpuData: {value: valueData, category: resources.groupKeys.data[batchIndex]}'
    );
    expect(EXAMPLE_SOURCE).toContain('.withColumn(');
    expect(EXAMPLE_SOURCE).toContain("parameter('adjustment', adjustment)");
    expect(EXAMPLE_SOURCE).toContain("parameter('multiplier', multiplier)");
    expect(EXAMPLE_SOURCE).toContain("parameter('threshold', threshold)");
    expect(EXAMPLE_SOURCE).toContain(".filter(column('adjustedValue').greaterThan(");
    expect(EXAMPLE_SOURCE).toContain(".select(['category', 'adjustedValue'])");
    expect(EXAMPLE_SOURCE).toContain('compiled.selectedCounts');
    expect(EXAMPLE_SOURCE).toContain('CPU verified');
    expect(EXAMPLE_SOURCE).toContain('compiled?.destroy()');
    expect(EXAMPLE_SOURCE).toContain('frame?.destroy()');
  });
});
