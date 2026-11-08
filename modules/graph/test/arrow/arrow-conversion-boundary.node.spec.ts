// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {build} from 'esbuild';
import ts from 'typescript';
import {describe, expect, test} from 'vitest';

const entryPoints = [
  'modules/graph/src/arrow/gpu/arrow-gpu-vector-adapters.ts',
  'modules/graph/src/arrow/gpu/arrow-gpu-vector-conversion.ts'
];

describe('primitive Arrow conversion boundaries', () => {
  test('keeps engine out of the complete local source and type dependency closure', () => {
    const visited = new Set<string>();
    const violations: string[] = [];
    function visitFile(filename: string): void {
      if (visited.has(filename)) return;
      visited.add(filename);
      const source = readFileSync(filename, 'utf8');
      for (const importedFile of ts.preProcessFile(source, true).importedFiles) {
        const specifier = importedFile.fileName;
        if (/^@luma\.gl\/(?:arrow|engine)(?:\/|$)/.test(specifier)) {
          violations.push(`${filename}: ${specifier}`);
        }
        if (!specifier.startsWith('.')) continue;
        const importedPath = resolve(dirname(filename), specifier);
        const dependency = [importedPath, `${importedPath}.ts`, `${importedPath}/index.ts`].find(
          candidate => existsSync(candidate) && candidate.endsWith('.ts')
        );
        expect(dependency, `${filename}: ${specifier} resolves to source`).toBeDefined();
        if (dependency) visitFile(dependency);
      }
    }
    for (const entryPoint of entryPoints) visitFile(resolve(entryPoint));
    expect(violations).toEqual([]);
    expect(
      [...visited].some(filename => /arrow-gpu-table-(?:adapters|conversion)/.test(filename))
    ).toBe(false);
  });

  test('bundles primitive adapters without engine implementations', async () => {
    const result = await build({
      entryPoints,
      bundle: true,
      outdir: 'unused-arrow-conversion-test-output',
      platform: 'node',
      format: 'esm',
      external: ['apache-arrow'],
      metafile: true,
      logLevel: 'silent',
      write: false
    });
    expect(
      Object.keys(result.metafile.inputs).filter(filename =>
        /^(?:modules\/engine\/|node_modules\/@luma\.gl\/engine\/)/.test(filename)
      )
    ).toEqual([]);
  });
});
