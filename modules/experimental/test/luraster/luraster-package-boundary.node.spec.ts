// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import {describe, expect, test} from 'vitest';
import * as experimentalModule from '@luma.gl/experimental';
import * as lurasterModule from '@luma.gl/experimental/luraster';

describe('@luma.gl/experimental/luraster package boundary', () => {
  test('declares an isolated side-effect-free ESM, CommonJS, and types subpath', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {
      name?: string;
      private?: boolean;
      sideEffects?: boolean;
      exports?: Record<string, Record<string, string>>;
    };

    expect(packageJson.name).toBe('@luma.gl/experimental');
    expect(packageJson.private).toBe(true);
    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.exports?.['./luraster']).toEqual({
      import: './dist/luraster/index.js',
      require: './dist/luraster/index.cjs',
      types: './dist/luraster/index.d.ts'
    });
    expect(packageJson.exports?.['./geospatial']).toBeDefined();
    expect(packageJson.exports?.['./luxfilter']).toBeDefined();
  });

  test('keeps every LuRaster runtime export outside the experimental root', () => {
    for (const exportName of Object.keys(lurasterModule)) {
      expect(exportName in experimentalModule).toBe(false);
    }
  });

  test('exposes raster metadata, graph contributors, and device-limit planning', () => {
    expect(lurasterModule.GPURaster).toBeTypeOf('function');
    expect(lurasterModule.GPURasterBufferToTexture).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTextureToBuffer).toBeTypeOf('function');
    expect(lurasterModule.getRasterDeviceLimits).toBeTypeOf('function');
    expect(lurasterModule.planRasterDispatchStripes).toBeTypeOf('function');
  });
});
