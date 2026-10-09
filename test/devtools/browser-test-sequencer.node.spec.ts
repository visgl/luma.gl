// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';
import type {TestSpecification} from 'vitest/node';
import {BrowserTestSequencer, SLOW_BROWSER_TEST_WEIGHTS} from '../utils/browser-test-sequencer';

const root = fileURLToPath(new URL('../../', import.meta.url));
const weightedPaths = Object.entries(SLOW_BROWSER_TEST_WEIGHTS).map(([path, weight]) => ({
  path,
  weight
}));

// Stale paths silently fall back to equal-count sharding, defeating the measured weights.
test('browser shard weights reference existing specs', () => {
  expect(weightedPaths.length).toBeGreaterThan(0);
  for (const {path} of weightedPaths) {
    expect(existsSync(resolve(root, path)), path).toBe(true);
  }
});

test('browser sharding preserves every spec and balances measured expensive suites', async () => {
  const paths = [
    ...weightedPaths,
    ...Array.from({length: 90}, (_, index) => ({path: `test/default-${index}.spec.ts`, weight: 3}))
  ];
  const specifications = paths.map(
    ({path}) => ({moduleId: resolve(root, path)}) as TestSpecification
  );
  const shards = await Promise.all(
    [1, 2, 3].map(async index => {
      const context = {config: {root, shard: {count: 3, index}}} as ConstructorParameters<
        typeof BrowserTestSequencer
      >[0];
      const sequencer = new BrowserTestSequencer(context);
      const shard = await sequencer.shard(specifications);
      expect(await sequencer.shard([...specifications].reverse())).toEqual(shard);
      return shard;
    })
  );
  expect(new Set(shards.flat()).size).toBe(specifications.length);
  expect(shards.flat()).toHaveLength(specifications.length);
  const weights = new Map(paths.map(({path, weight}) => [resolve(root, path), weight]));
  const totals = shards.map(shard =>
    shard.reduce((total, specification) => total + weights.get(specification.moduleId)!, 0)
  );
  expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(3);
});
