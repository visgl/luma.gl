// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';

const PRECISION_DOCUMENTATION_PAGES = [
  '../../docs/api-guide/shaders/gpu-floating-point-precision.md',
  '../../docs/api-reference/shadertools/shader-modules/fp64.md',
  '../../docs/api-reference/shadertools/shader-modules/fp64-arithmetic.md'
] as const;

describe('FP64 live benchmark documentation', () => {
  test.each(
    PRECISION_DOCUMENTATION_PAGES
  )('embeds an explicit-launch, device-backed benchmark in %s', documentationPath => {
    const documentationContent = readFileSync(new URL(documentationPath, import.meta.url), 'utf8');

    expect(documentationContent).toContain(
      "import {DeferredFP64Example} from '@site/src/components/docs/deferred-fp64-example';"
    );
    expect(documentationContent).toContain('<DeferredFP64Example embeddedHeight={900} />');
    expect(documentationContent).not.toContain("from '@site/src/examples'");
  });

  test('explains that fp64 arithmetic benchmarks run only when requested', () => {
    const documentationContent = readFileSync(
      new URL(
        '../../docs/api-reference/shadertools/shader-modules/fp64-arithmetic.md',
        import.meta.url
      ),
      'utf8'
    );

    expect(documentationContent).toContain('## Live WebGPU benchmark');
    expect(documentationContent).toContain('**Run WebGPU benchmark**');
    expect(documentationContent).toContain('the benchmark runs only when requested');
  });
});
