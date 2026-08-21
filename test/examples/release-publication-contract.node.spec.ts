// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

type PackageExport = {types?: string; import?: string; require?: string};
type PackageManifest = {
  name: string;
  private?: boolean;
  publishConfig?: {access?: string};
  exports?: Record<string, PackageExport>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

const PUBLIC_EXPERIMENTAL_PACKAGES = ['text', 'splats', 'experimental', 'scene'] as const;

describe('9.4 publication contract', () => {
  test('keeps the Arrow adapter package private', () => {
    const manifest = readManifest('arrow');

    expect(manifest.private).toBe(true);
    expect(manifest.publishConfig?.access).not.toBe('public');
  });

  test.each(
    PUBLIC_EXPERIMENTAL_PACKAGES
  )('publishes @luma.gl/%s with complete entry points', packageDirectory => {
    const manifest = readManifest(packageDirectory);

    expect(manifest.private, `${manifest.name} must be publishable`).not.toBe(true);
    expect(manifest.publishConfig?.access).toBe('public');
    expect(manifest.exports).toBeDefined();

    for (const [subpath, packageExport] of Object.entries(manifest.exports || {})) {
      expect(packageExport.types, `${manifest.name}${subpath} needs declarations`).toMatch(
        /\.d\.ts$/
      );
      expect(packageExport.import, `${manifest.name}${subpath} needs ESM`).toMatch(/\.js$/);
      expect(packageExport.require, `${manifest.name}${subpath} needs CommonJS`).toMatch(/\.cjs$/);
    }

    for (const dependencies of [
      manifest.dependencies,
      manifest.peerDependencies,
      manifest.optionalDependencies
    ]) {
      expect(dependencies || {}).not.toHaveProperty('@math.gl/geoarrow');
      for (const dependencyVersion of Object.values(dependencies || {})) {
        expect(dependencyVersion).not.toMatch(/^workspace:/);
      }
    }
  });

  test('retains undocumented compute implementation exports', () => {
    const manifest = readManifest('gpgpu');

    expect(manifest.exports).toHaveProperty('./gpu-core');
    expect(manifest.exports).toHaveProperty('./gpu-graph');
    expect(manifest.exports).toHaveProperty('./gpu-graph/benchmarks');
  });

  test('removes pruned workspaces, examples, and documentation routes', () => {
    for (const removedPath of [
      'modules/math-geoarrow',
      'examples/deck',
      'examples/v10',
      'examples/arrow/arrow-geoarrow',
      'examples/arrow/arrow-polygons',
      'docs/api-reference/arrow',
      'docs/api-reference/experimental/gpu-core',
      'docs/api-reference/experimental/gpu-graph.md',
      'website/content/examples/deck',
      'website/content/examples/v10',
      'website/content/examples/arrow',
      'website/content/examples/experimental/gpu-graph-explorer.mdx'
    ]) {
      expect(existsSync(path.join(process.cwd(), removedPath)), removedPath).toBe(false);
    }

    const documentationNavigation = readFileSync(
      path.join(process.cwd(), 'docs/table-of-contents.json'),
      'utf8'
    );
    const exampleNavigation = readFileSync(
      path.join(process.cwd(), 'website/content/examples/table-of-contents.json'),
      'utf8'
    );
    const exampleRegistry = readFileSync(
      path.join(process.cwd(), 'website/src/examples.tsx'),
      'utf8'
    );

    expect(documentationNavigation).not.toMatch(/experimental\/gpu-(?:core|graph)/);
    expect(documentationNavigation).not.toMatch(/api-reference\/arrow/);
    expect(exampleNavigation).not.toMatch(/(?:deck|v10)\//);
    expect(exampleNavigation).not.toMatch(/arrow/);
    expect(exampleRegistry).not.toMatch(/(?:Deck|Arrow|GeoArrow|GPUGraphExplorer)Example/);
  });
});

function readManifest(packageDirectory: string): PackageManifest {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), 'modules', packageDirectory, 'package.json'), 'utf8')
  ) as PackageManifest;
}
