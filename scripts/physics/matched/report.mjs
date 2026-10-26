// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export function formatReport(report) {
  const number = value => (Number.isFinite(value) ? value.toFixed(3) : '—');
  return [
    '# Box3D / WebGPU matched benchmark',
    '',
    `Reference: Box3D \`${report.reference.commit}\`. Host: ${report.host.cpu}, ${report.host.platform}/${report.host.architecture}.`,
    '',
    'Native CPU and browser GPU are distinct execution lanes. Ratios appear only for complete hardware runs where both engines meet the declared sampled-quality budgets.',
    '',
    '| Scenario | CPU p95 ms | GPU completion p95 ms | GPU / CPU | Execution | Max overlap CPU / GPU (m) | Max joint error CPU / GPU (m) | Conservative energy error CPU / GPU | Quality CPU / GPU |',
    '| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- |',
    ...report.results.map(result =>
      result.error
        ? `| ${result.scene} | — | — | — | — | — | — | — | ERROR: ${String(result.error).replaceAll('|', '/').replaceAll('\n', ' ')} |`
        : `| ${result.scene} | ${number(result.performance.box3dNativeMilliseconds?.p95)} | ${number(result.performance.gpuCompletionMilliseconds?.p95)} | ${number(result.performance.gpuToNativeCompletionRatio)} | ${result.executionComplete ? 'complete' : 'INCOMPLETE'} | ${number(result.quality.box3d.maximumPenetration)} / ${number(result.quality.gpu.maximumPenetration)} | ${number(result.quality.box3d.maximumJointError)} / ${number(result.quality.gpu.maximumJointError)} | ${number(result.quality.box3d.maximumConservativeEnergyError)} / ${number(result.quality.gpu.maximumConservativeEnergyError)} | ${result.qualityAssessment.box3d.passed ? 'pass' : result.qualityAssessment.box3d.failures.join(', ')} / ${result.qualityAssessment.gpu.passed ? 'pass' : result.qualityAssessment.gpu.failures.join(', ')} |`
    ),
    '',
    ...report.notes.map(note => `- ${note}`),
    ''
  ].join('\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  console.log(formatReport(JSON.parse(readFileSync(process.argv[2], 'utf8'))));
