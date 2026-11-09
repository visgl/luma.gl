// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {describe, expect, it} from 'vitest';

const owners = ['graph', 'engine'];

describe('optional Arrow conversion entries', () => {
  it('publishes Arrow through optional subpaths without a standalone package', () => {
    expect(existsSync('modules/arrow')).toBe(false);
    for (const owner of owners) {
      const manifest = JSON.parse(readFileSync(`modules/${owner}/package.json`, 'utf8'));
      expect(manifest.exports['./arrow']).toEqual({
        types: './dist/arrow/index.d.ts',
        import: './dist/arrow/index.js',
        require: './dist/arrow/index.cjs'
      });
      expect(manifest.peerDependencies['apache-arrow']).toBe('>=17.0.0');
      expect(manifest.peerDependenciesMeta['apache-arrow'].optional).toBe(true);
      expect(manifest.dependencies?.['apache-arrow']).toBeUndefined();
    }
  });

  it('installs the GeoArrow runtime required by table and rendering adapter entries', () => {
    const manifest = JSON.parse(readFileSync('modules/graph/package.json', 'utf8'));
    expect(manifest.dependencies['@math.gl/geospatial']).toBeDefined();
    expect(manifest.peerDependenciesMeta['@math.gl/geospatial']).toBeUndefined();
  });

  it('keeps generic package roots usable without Apache Arrow', async () => {
    const result = await build({
      entryPoints: owners.map(owner => `modules/${owner}/src/index.ts`),
      bundle: true,
      outdir: 'unused-arrow-root-test-output',
      platform: 'node',
      format: 'esm',
      metafile: true,
      write: false,
      logLevel: 'silent',
      plugins: [
        {
          name: 'require-arrow-free-roots',
          setup(builder) {
            builder.onResolve({filter: /^apache-arrow(?:\/|$)/}, arguments_ => {
              throw new Error(
                `Generic package root imports Apache Arrow from ${arguments_.importer}`
              );
            });
          }
        }
      ]
    });
    expect(
      Object.keys(result.metafile.inputs).filter(filename =>
        /^modules\/(?:graph|engine)\/src\/arrow\//.test(filename)
      )
    ).toEqual([]);
  });

  it('keeps the complete graph Arrow bundle independent of engine', async () => {
    const result = await build({
      entryPoints: ['modules/graph/src/arrow/index.ts'],
      bundle: true,
      outdir: 'unused-graph-arrow-test-output',
      platform: 'node',
      format: 'esm',
      external: ['apache-arrow'],
      metafile: true,
      write: false,
      logLevel: 'silent'
    });
    expect(
      Object.keys(result.metafile.inputs).filter(filename =>
        /^(?:modules\/engine\/|node_modules\/@luma\.gl\/engine\/)/.test(filename)
      )
    ).toEqual([]);
  });
});
