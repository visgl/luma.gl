// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, test} from 'vitest';

const modulesDirectory = join(process.cwd(), 'modules');

describe('published module loader boundary', () => {
  test('keeps loaders.gl packages out of module dependencies and source imports', () => {
    const violations: string[] = [];
    for (const moduleEntry of readdirSync(modulesDirectory, {withFileTypes: true})) {
      if (!moduleEntry.isDirectory()) continue;
      const moduleDirectory = join(modulesDirectory, moduleEntry.name);
      const packagePath = join(moduleDirectory, 'package.json');
      const packageMetadata = JSON.parse(readFileSync(packagePath, 'utf8'));
      for (const dependencyGroup of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
        for (const name of Object.keys(packageMetadata[dependencyGroup] ?? {})) {
          if (name.startsWith('@loaders.gl/')) violations.push(`${packagePath}: ${name}`);
        }
      }
      const sourceDirectory = join(moduleDirectory, 'src');
      for (const sourcePath of readdirSync(sourceDirectory, {recursive: true})) {
        if (!/\.[cm]?[jt]sx?$/.test(sourcePath)) continue;
        const source = readFileSync(join(sourceDirectory, sourcePath), 'utf8');
        if (/(?:from\s*|import\s*\(?\s*|require\s*\(\s*)['"]@loaders\.gl\//.test(source)) {
          violations.push(join(sourceDirectory, sourcePath));
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
