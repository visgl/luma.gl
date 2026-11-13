// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parseArgs} from 'node:util';
import {writeFile} from 'node:fs/promises';
import {benchmarkRigidBody} from './benchmark-rigid-body.mjs';
import {qualifyRigidBodyReport} from './qualify-rigid-body-report.mjs';

const {values} = parseArgs({options: {url: {type: 'string'}, output: {type: 'string'}}});
const reports = [];
for (const fixture of ['deep', 'massRatio', 'impact', 'continuous']) {
  const raw = await benchmarkRigidBody({
    url: values.url,
    fixture,
    solver: 'parallel',
    iterations: ['deep', 'massRatio'].includes(fixture) ? 48 : 16,
    failurePolicy: 'rollback',
    maximumPairs: 64,
    warmup: 120,
    samples: 60,
    sleepAfter: 0,
    warmStartFactor: 0.8,
    penetrationRecoveryFraction: fixture === 'impact' ? 0 : 0.1
  });
  const report = qualifyRigidBodyReport(raw);
  reports.push(report);
  console.error(`${fixture}: ${report.qualified ? 'passed' : report.failures.join(', ')}`);
  await writeFile(
    values.output || 'rigid-body-qualification.json',
    `${JSON.stringify(reports, null, 2)}\n`
  );
}
if (reports.some(report => !report.qualified)) process.exitCode = 2;
