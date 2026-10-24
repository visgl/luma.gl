// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export async function loadQualificationProfile() {
  return JSON.parse(
    await readFile(new URL('./qualification-profile.json', import.meta.url), 'utf8')
  );
}

/** Test passes, skipped tests and absent evidence remain distinct. No static support claims. */
export function makeQualificationReport(profile, reports, tranches = ['G1', 'G2', 'G3']) {
  if (
    !tranches.length ||
    tranches.some(tranche => !profile.features.some(feature => feature.tranche === tranche))
  )
    throw new Error('Unknown qualification tranche');
  const assertions = reports.flatMap(report =>
    (report.testResults ?? []).flatMap(file =>
      (file.assertionResults ?? []).map(assertion => ({
        file: file.name.replaceAll('\\', '/'),
        name: assertion.fullName ?? assertion.title,
        status: assertion.status
      }))
    )
  );
  const features = profile.features.map(feature => {
    const checks = Object.fromEntries(
      feature.requiredChecks.map(stage => {
        const selectors = feature.checks[stage] ?? [];
        const evidence = selectors.map(selector => {
          if (selector.benchmark) {
            const expected = selector.benchmark;
            const matches = reports.filter(
              report =>
                report.stage === expected.stage &&
                report.fixture === expected.fixture &&
                report.objectCount >= expected.minimumObjectCount &&
                (!expected.hardware || report.adapter?.fallback === false)
            );
            return {
              selector,
              status: matches.some(report => report.qualified !== true)
                ? 'failed'
                : matches.length
                  ? 'passed'
                  : 'missing',
              evidenceCount: matches.length
            };
          }
          const matches = assertions.filter(
            assertion =>
              assertion.file.endsWith(selector.file) &&
              new RegExp(selector.testPattern).test(assertion.name)
          );
          return {
            selector,
            status: matches.some(assertion => assertion.status === 'failed')
              ? 'failed'
              : matches.some(assertion => assertion.status === 'passed')
                ? 'passed'
                : 'missing',
            evidenceCount: matches.length
          };
        });
        const status = evidence.some(check => check.status === 'failed')
          ? 'failed'
          : evidence.length && evidence.every(check => check.status === 'passed')
            ? 'passed'
            : 'missing';
        return [stage, {status, evidence}];
      })
    );
    const stages = Object.values(checks).map(check => check.status);
    return {
      id: feature.id,
      tranche: feature.tranche,
      fields: feature.fields,
      status: stages.includes('failed')
        ? 'failed'
        : stages.length && stages.every(status => status === 'passed')
          ? 'passed'
          : 'missing',
      checks
    };
  });
  const requested = features.filter(feature => tranches.includes(feature.tranche));
  return {
    formatVersion: 1,
    profile: profile.profile,
    requestedTranches: tranches,
    requestedComplete:
      requested.length > 0 && requested.every(feature => feature.status === 'passed'),
    profileComplete: features.length > 0 && features.every(feature => feature.status === 'passed'),
    summary: {
      passed: requested.filter(feature => feature.status === 'passed').length,
      failed: requested.filter(feature => feature.status === 'failed').length,
      missing: requested.filter(feature => feature.status === 'missing').length
    },
    features
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const argumentsList = process.argv.slice(2);
  const trancheArgument = argumentsList.find(value => value.startsWith('--tranches='));
  const tranches = trancheArgument?.slice('--tranches='.length).split(',');
  const files = argumentsList.filter(value => value !== trancheArgument);
  if (!files.length)
    throw new Error('Provide Vitest JSON reports and physics benchmark JSON reports');
  const reports = await Promise.all(
    files.map(async file => JSON.parse(await readFile(file, 'utf8')))
  );
  const result = makeQualificationReport(await loadQualificationProfile(), reports, tranches);
  console.log(JSON.stringify(result, null, 2));
  if (!result.requestedComplete) process.exitCode = 2;
}
