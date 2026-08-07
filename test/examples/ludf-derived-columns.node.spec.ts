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

describe('GPU data-analysis luDF derived-column demo', () => {
  test('offers an explicit interactive derived-column action without changing automatic startup', () => {
    expect(EXAMPLE_SOURCE).toContain('data-ludf-adjustment');
    expect(EXAMPLE_SOURCE).toContain('data-ludf-run');
    expect(EXAMPLE_SOURCE).toContain('data-ludf-result');
    expect(EXAMPLE_SOURCE).toContain("addEventListener('click', this.handleLuDataFrameRun)");
    expect(EXAMPLE_SOURCE).toContain("removeEventListener('click', this.handleLuDataFrameRun)");
    expect(EXAMPLE_SOURCE).not.toContain('await this.runLuDataFrameDemo()');
  });

  test('reuses Arrow-uploaded GPU columns and validates parameterized derivation and filtering', () => {
    expect(EXAMPLE_SOURCE).toContain("from '@luma.gl/experimental/ludf'");
    expect(EXAMPLE_SOURCE).toContain('resources.values.data.map(');
    expect(EXAMPLE_SOURCE).toContain(
      'gpuData: {value: valueData, category: resources.groupKeys.data[batchIndex]}'
    );
    expect(EXAMPLE_SOURCE).toContain('.withColumn(');
    expect(EXAMPLE_SOURCE).toContain("parameter('adjustment', adjustment)");
    expect(EXAMPLE_SOURCE).toContain(
      ".filter(column('adjustedValue').greaterThan(literal(adjustment)))"
    );
    expect(EXAMPLE_SOURCE).toContain(".select(['category', 'adjustedValue'])");
    expect(EXAMPLE_SOURCE).toContain('compiled.selectedCounts');
    expect(EXAMPLE_SOURCE).toContain('CPU verified');
    expect(EXAMPLE_SOURCE).toContain('compiled?.destroy()');
    expect(EXAMPLE_SOURCE).toContain('frame?.destroy()');
  });
});
