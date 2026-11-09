// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {build} from 'esbuild';

test('ordinary PBR imports remove baking targets and filter shaders', async () => {
  const result = await build({
    stdin: {
      contents: "export {createPBRModel} from './modules/engine/src/lighting/index.ts';",
      resolveDir: process.cwd()
    },
    bundle: true,
    write: false,
    minify: true,
    metafile: true,
    format: 'esm',
    platform: 'browser',
    external: [
      '@luma.gl/core',
      '@luma.gl/core/*',
      '@luma.gl/graph',
      '@luma.gl/graph/*',
      '@luma.gl/shaders',
      '@math.gl/*',
      'probe.gl'
    ]
  });
  const contributors = Object.values(result.metafile!.outputs).flatMap(output =>
    Object.entries(output.inputs)
      .filter(([, input]) => input.bytesInOutput > 0)
      .map(([path]) => path)
  );
  expect(contributors.some(path => path.endsWith('/lightmap-baker.ts'))).toBe(false);
});
