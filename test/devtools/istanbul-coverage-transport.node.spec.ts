// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import istanbulCoverage from '@vitest/coverage-istanbul/browser';
import {expect, test} from 'vitest';

type FileCoverage = {
  hash: string;
  statementMap: Record<string, unknown>;
  fnMap: Record<string, unknown>;
  branchMap: Record<string, unknown>;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number[]>;
};
type Coverage = Record<string, FileCoverage>;

function makeFileCoverage(): FileCoverage {
  return {
    hash: 'source-hash',
    statementMap: {'0': {start: {line: 1, column: 0}, end: {line: 1, column: 10}}},
    fnMap: {},
    branchMap: {},
    s: {'0': 0},
    f: {'0': 0},
    b: {'0': [0, 0]}
  };
}

async function withCoverage(run: (coverage: Coverage, reports: Coverage[]) => Promise<void>) {
  const previousCoverage = Reflect.get(globalThis, '__VITEST_COVERAGE__');
  const previousRunner = Reflect.get(globalThis, '__vitest_browser_runner__');
  const coverage: Coverage = {
    '/source.ts': makeFileCoverage(),
    '/uncovered.ts': makeFileCoverage()
  };
  const reports: Coverage[] = [];
  Reflect.set(globalThis, '__VITEST_COVERAGE__', coverage);
  Reflect.set(globalThis, '__vitest_browser_runner__', {
    commands: {
      triggerCommand(command: string, [report]: [Coverage]) {
        expect(command).toBe('__vitest_writeCoverageFile');
        reports.push(structuredClone(report));
        return Promise.resolve(`coverage-${reports.length}.json`);
      }
    }
  });
  try {
    await istanbulCoverage.startCoverage?.();
    await run(coverage, reports);
  } finally {
    Reflect.set(globalThis, '__VITEST_COVERAGE__', {});
    await istanbulCoverage.startCoverage?.();
    Reflect.set(globalThis, '__VITEST_COVERAGE__', previousCoverage);
    Reflect.set(globalThis, '__vitest_browser_runner__', previousRunner);
  }
}

test('incremental Istanbul transport preserves exact statement, function, and branch totals', async () => {
  await withCoverage(async (coverage, reports) => {
    coverage['/source.ts'].s['0'] = 3;
    await istanbulCoverage.takeCoverage?.();
    expect(Object.keys(reports[0])).toEqual(['/source.ts', '/uncovered.ts']);
    expect(reports[0]['/uncovered.ts']).toEqual(makeFileCoverage());
    await istanbulCoverage.takeCoverage?.();
    expect(reports).toHaveLength(1);

    coverage['/source.ts'].s['0'] += 4;
    coverage['/source.ts'].f['0'] += 2;
    coverage['/source.ts'].b['0'][0] += 5;
    await istanbulCoverage.takeCoverage?.();
    expect(Object.keys(reports[1])).toEqual(['/source.ts']);
    expect(reports[1]['/source.ts'].s).toEqual({'0': 4});
    coverage['/source.ts'].f['0'] += 1;
    await istanbulCoverage.takeCoverage?.();
    coverage['/source.ts'].b['0'][1] += 6;
    const beforeCapture = structuredClone(coverage);
    await istanbulCoverage.takeCoverage?.();
    expect(coverage).toEqual(beforeCapture);
    expect(reports).toHaveLength(4);

    const totals = {s: 0, f: 0, b: [0, 0]};
    for (const report of reports) {
      const source = report['/source.ts'];
      totals.s += source.s['0'];
      totals.f += source.f['0'];
      source.b['0'].forEach((count, index) => {
        totals.b[index] += count;
      });
      expect(source.statementMap).toEqual(coverage['/source.ts'].statementMap);
    }
    expect(totals).toEqual({s: 7, f: 3, b: [5, 6]});
  });
});

test('incremental Istanbul transport resets snapshots for a new coverage run', async () => {
  await withCoverage(async (coverage, reports) => {
    coverage['/source.ts'].s['0'] = 7;
    await istanbulCoverage.takeCoverage?.();
    await istanbulCoverage.startCoverage?.();
    expect(coverage['/source.ts'].s['0']).toBe(0);
    coverage['/source.ts'].s['0'] = 2;
    await istanbulCoverage.takeCoverage?.();
    expect(reports[1]['/source.ts'].s['0']).toBe(2);
    expect(Object.keys(reports[1])).toEqual(['/source.ts', '/uncovered.ts']);
  });
});

test('incremental Istanbul transport emits fresh metadata when a source hash changes', async () => {
  await withCoverage(async (coverage, reports) => {
    coverage['/source.ts'].s['0'] = 7;
    await istanbulCoverage.takeCoverage?.();
    coverage['/source.ts'] = {...makeFileCoverage(), hash: 'updated-source-hash', s: {'0': 2}};
    await istanbulCoverage.takeCoverage?.();
    expect(reports[1]['/source.ts']).toEqual(coverage['/source.ts']);
  });
});
