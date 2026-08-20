/** @typedef {import('@vis.gl/dev-tools').OcularConfig} OcularConfig */

import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const devModules = join(packageRoot, 'dev-modules');
const testDir = join(packageRoot, 'test');

/** @type {OcularConfig} */
const config = {

  lint: {
    paths: ['modules', 'docs', 'test', 'examples'],
    extensions: ['js', 'ts', 'jsx', 'tsx']
  },

  aliases: {
    // DEV MODULES
    'dev-modules': devModules,

    // TEST
    test: testDir
  },

  // Repo-specific configuration consumed by the local Playwright utilities.
  devtools: {
    // Local Playwright configuration layered on top of the reusable runner.
    playwright: {
      // Repo default example used when `yarn playwright` is run without `--example`.
      defaultExamplePath: '/examples/showcase/persistence',
      // Base route prefix for generic example resolution such as `showcase/persistence`.
      exampleBasePath: '/examples',
      // Repo-owned shorthand aliases for website examples.
      examples: {
        animation: '/examples/api/animation',
        scenes: '/examples/showcase/scene',
        'arrow-points': '/examples/arrow/arrow-points',
        'arrow-filtering': '/examples/arrow/arrow-filtering',
        cubemap: '/examples/api/cubemap',
        fp64: '/examples/experimental/fp64',
        'webxr-kaleidoscope': '/examples/experimental/webxr-kaleidoscope',
        'external-context': '/examples/integrations/external-context',
        'arrow-text-2d': '/examples/arrow/arrow-text-2d',
        'arrow-text-3d': '/examples/arrow/arrow-text-3d',
        'gaussian-splats': '/examples/showcase/gaussian-splats',
        gltf: '/examples/showcase/gltf',
        'hello-cube': '/examples/tutorials/hello-cube',
        'hello-instancing': '/examples/tutorials/hello-instancing',
        'hello-triangle-geometry': '/examples/tutorials/hello-triangle-geometry',
        'hello-gltf': '/examples/tutorials/hello-gltf',
        'hello-triangle': '/examples/tutorials/hello-triangle',
        globe: '/examples/showcase/globe',
        instancing: '/examples/showcase/instancing',
        'render-bundles': '/examples/api/render-bundles',
        'instanced-cubes': '/examples/tutorials/instanced-cubes',
        lighting: '/examples/tutorials/lighting',
        'multi-canvas': '/examples/api/multi-canvas',
        persistence: '/examples/showcase/persistence',
        postprocessing: '/examples/showcase/postprocessing',
        'quantum-state-studio': '/examples/showcase/quantum-state-studio',
        'react-strict-mode': '/examples/integrations/react-strict-mode',
        'shader-hooks': '/examples/tutorials/shader-hooks',
        'shader-modules': '/examples/tutorials/shader-modules',
        'texture-3d': '/examples/api/texture-3d',
        'texture-tester': '/examples/api/texture-tester',
        'video-texture': '/examples/api/video-texture',
        transform: '/examples/tutorials/transform',
        'transform-feedback': '/examples/tutorials/transform-feedback',
        'two-cubes': '/examples/tutorials/two-cubes'
      }
    }
  },

  bundle: {
    globalName: 'luma',
    externals: [],
    target: ['chrome110', 'firefox110', 'safari15'],
    format: 'umd',
    globals: {
      '@luma.gl/*': 'globalThis.luma'
    }
  },

  entry: {
    size: 'test/size/import-nothing.js',
    'modules/webgl/test/context/create-context.spec.ts':
      'modules/webgl/test/context/create-browser-context.spec.ts',
    'modules/webgl/test/context/create-context.spec.ts-browser': 'test/index.html'
  }
};

export default config;
