// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

const RENDERER_REFERENCE_PAGES = [
  'scene-renderer.md',
  'deferred-scene-renderer.md',
  'pbr-environment.md'
];

describe('renderer reference frame submission', () => {
  for (const pageName of RENDERER_REFERENCE_PAGES) {
    test(`${pageName} submits encoded work before destroying borrowed resources`, () => {
      const page = readFileSync(
        path.join(process.cwd(), 'docs/api-reference/experimental', pageName),
        'utf8'
      );
      const snippets = [...page.matchAll(/```(?:ts|typescript)\n([\s\S]*?)```/g)].map(
        match => match[1]
      );
      const lifecycleExamples = snippets.filter(
        snippet =>
          /renderer\.render\(/.test(snippet) && /(?:renderer|environment)\.destroy\(/.test(snippet)
      );

      expect(lifecycleExamples.length).toBeGreaterThan(0);
      for (const snippet of lifecycleExamples) {
        const submitPosition = snippet.indexOf('device.submit()');
        expect(submitPosition).toBeGreaterThan(snippet.indexOf('renderer.render('));
        expect(submitPosition).toBeLessThan(snippet.search(/(?:renderer|environment)\.destroy\(/));
      }
    });
  }
});
