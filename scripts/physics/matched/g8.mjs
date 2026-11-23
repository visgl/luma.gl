// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {mkdirSync, writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {runSuite} from './run.mjs';
import {formatReport} from './report.mjs';

// Run sequentially: simultaneous GPU lanes would invalidate latency comparisons.
const {values} = parseArgs({
  options: Object.fromEntries(
    ['url', 'source', 'build', 'output', 'frames', 'repeats', 'count'].map(name => [
      name,
      {type: 'string'}
    ])
  )
});
const output = path.resolve(values.output ?? 'g8-results');
mkdirSync(output, {recursive: true});
for (const [contactSolver, iterations] of [
  ['scalar', 24],
  ['block', 12],
  ['block', 24]
]) {
  const report = await runSuite({
    ...values,
    count: values.count ?? 64,
    frames: values.frames ?? 1800,
    repeats: values.repeats ?? 3,
    warmup: 20,
    stride: 6,
    substeps: 4,
    solver: 'parallel',
    contactSolver,
    iterations,
    profile: true,
    scenes: ['matchedDense', 'matchedLoaded', 'matchedStack']
  });
  const filename = `${contactSolver}-${iterations}`;
  writeFileSync(path.join(output, `${filename}.json.gz`), gzipSync(JSON.stringify(report)));
  writeFileSync(path.join(output, `${filename}.md`), formatReport(report));
  if (report.results.some(result => !result.executionComplete)) process.exitCode = 2;
}
