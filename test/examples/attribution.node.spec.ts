// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {spawnSync} from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {afterEach, describe, expect, test} from 'vitest';

const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const temporaryDirectories: string[] = [];

function makeAttributionFixture(): string {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'luma-attributions-'));
  temporaryDirectories.push(fixtureRoot);
  const copyFile = (filename: string) => {
    mkdirSync(path.dirname(path.join(fixtureRoot, filename)), {recursive: true});
    cpSync(path.join(REPOSITORY_ROOT, filename), path.join(fixtureRoot, filename), {
      recursive: true
    });
  };
  for (const filename of [
    'scripts/check-attributions.mjs',
    'dev-docs/attribution-inventory.json',
    'README.md',
    'LICENSE',
    'docs/references-and-credits.md',
    'docs/table-of-contents.json',
    'website/docusaurus.config.js',
    'website/static/standalone-examples/THIRD-PARTY-NOTICES.txt',
    'examples/THIRD-PARTY-NOTICES.md',
    'examples/licenses',
    'examples/anari/scenes/public/gltf/ASSET-LICENSE.md',
    'examples/anari/scenes/public/usd/ASSET-LICENSE.md',
    'examples/experimental/text-space-crawl/public/fonts/OFL.txt'
  ]) {
    copyFile(filename);
  }
  for (const directory of readdirSync(path.join(REPOSITORY_ROOT, 'modules'))) {
    const packageRoot = 'modules/' + directory;
    if (!existsSync(path.join(REPOSITORY_ROOT, packageRoot, 'package.json'))) {
      continue;
    }
    for (const filename of ['package.json', 'LICENSE', 'THIRD-PARTY-NOTICES.md', 'licenses']) {
      if (existsSync(path.join(REPOSITORY_ROOT, packageRoot, filename))) {
        copyFile(packageRoot + '/' + filename);
      }
    }
  }
  const inventory = JSON.parse(
    readFileSync(path.join(REPOSITORY_ROOT, 'dev-docs/attribution-inventory.json'), 'utf8')
  );
  for (const source of inventory.sources) {
    source.files.forEach(copyFile);
    source.notices.forEach(copyFile);
  }
  const guide = readFileSync(path.join(REPOSITORY_ROOT, 'docs/references-and-credits.md'), 'utf8');
  for (const match of guide.matchAll(/\]\((\.\/[^)#]+)(?:#[^)]*)?\)/gu)) {
    copyFile(path.normalize(path.join('docs', match[1])));
  }
  for (const match of guide.matchAll(
    /https:\/\/github\.com\/visgl\/luma\.gl\/blob\/master\/([^\s)#]+)/gu
  )) {
    copyFile(match[1]);
  }
  return fixtureRoot;
}

function runAttributionCheck(fixtureRoot: string) {
  return spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts/check-attributions.mjs')], {
    encoding: 'utf8'
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, {recursive: true, force: true});
  }
});

describe('Attribution guardrails', () => {
  test('accepts the current source, notice, and distribution inventory', () => {
    const result = runAttributionCheck(makeAttributionFixture());
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  test('rejects an upstream notice omitted from the package manifest', () => {
    const fixtureRoot = makeAttributionFixture();
    const filename = path.join(fixtureRoot, 'modules/core/package.json');
    const manifest = JSON.parse(readFileSync(filename, 'utf8'));
    manifest.files = manifest.files.filter((entry: string) => entry !== 'licenses');
    writeFileSync(filename, JSON.stringify(manifest));
    const result = runAttributionCheck(fixtureRoot);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Notice missing from files manifest');
  });

  test('rejects removed upstream ownership', () => {
    const fixtureRoot = makeAttributionFixture();
    const filename = path.join(fixtureRoot, 'modules/gltf/src/types/gltf-json-schema.ts');
    writeFileSync(
      filename,
      readFileSync(filename, 'utf8').replace('2018 Benjamin Wasty', 'upstream')
    );
    const result = runAttributionCheck(fixtureRoot);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Missing upstream attribution');
  });

  test('rejects an inventoried notice dropped from both Markdown and the manifest', () => {
    const fixtureRoot = makeAttributionFixture();
    const manifestPath = path.join(fixtureRoot, 'modules/core/package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.files = manifest.files.filter((entry: string) => entry !== 'licenses');
    writeFileSync(manifestPath, JSON.stringify(manifest));
    const noticePath = path.join(fixtureRoot, 'modules/core/THIRD-PARTY-NOTICES.md');
    writeFileSync(noticePath, readFileSync(noticePath, 'utf8').replace(/^Full terms:.*$/gmu, ''));
    const result = runAttributionCheck(fixtureRoot);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Notice missing from files manifest');
  });

  test('rejects removed Evan Wallace filter ownership', () => {
    const fixtureRoot = makeAttributionFixture();
    const filename = path.join(
      fixtureRoot,
      'modules/effects/src/passes/postprocessing/image-adjust-filters/brightnesscontrast.ts'
    );
    writeFileSync(
      filename,
      readFileSync(filename, 'utf8').replace('2011 by Evan Wallace', 'upstream')
    );
    const result = runAttributionCheck(fixtureRoot);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Missing upstream attribution');
  });

  test('rejects an allowlist that omits code from a previously unrestricted package', () => {
    const fixtureRoot = makeAttributionFixture();
    const sourcePath = 'modules/three/src/index.ts';
    mkdirSync(path.dirname(path.join(fixtureRoot, sourcePath)), {recursive: true});
    cpSync(path.join(REPOSITORY_ROOT, sourcePath), path.join(fixtureRoot, sourcePath));
    const manifestPath = path.join(fixtureRoot, 'modules/three/package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.files = ['LICENSE', 'THIRD-PARTY-NOTICES.md'];
    writeFileSync(manifestPath, JSON.stringify(manifest));
    const result = runAttributionCheck(fixtureRoot);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Code missing from files manifest');
  });

  test('rejects stale standalone distribution notices', () => {
    const fixtureRoot = makeAttributionFixture();
    const filename = path.join(
      fixtureRoot,
      'website/static/standalone-examples/THIRD-PARTY-NOTICES.txt'
    );
    writeFileSync(filename, 'stale');
    const result = runAttributionCheck(fixtureRoot);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Refresh standalone notices');
  });
});
