// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {collectBrowserTimings} from '../../scripts/ci/browser-timings.mjs';

test('browser timing extraction ignores Node runs and retains the slowest repeated measurement', () => {
  expect(
    collectBrowserTimings([
      'headless (chromium) modules/anari/test/example.spec.ts (2 tests) 1001ms\n' +
        'node modules/anari/test/example.spec.ts (2 tests) 999999ms\n' +
        'headless (chromium) modules/anari/test/example.spec.ts (2 tests) 200ms',
      'Browser coverage\t2026-11-15T18:00:00Z ^[[32m✓^[[39m headless (chromium) modules/anari/test/example.spec.ts (2 tests) ^[[33m 3100^[[2mms',
      '\u001b[32m✓\u001b[39m browser (chromium) test/example.spec.ts (1 test) 1ms',
      'headless (chromium) modules/anari/test/incomplete.spec.ts'
    ])
  ).toEqual({'modules/anari/test/example.spec.ts': 5, 'test/example.spec.ts': 2});
});
