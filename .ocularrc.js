/** @typedef {import('ocular-dev-tools').OcularConfig} OcularConfig */

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

  coverage: {
    test: 'browser'
  },

  // Local extensions for the in-repo devtools workspace.
  // Reusable logic lives under `dev-modules/devtools-extensions/`; repo-specific policy belongs here.
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
        cubemap: '/examples/api/cubemap',
        fp64: '/examples/api/fp64',
        'external-context': '/examples/integrations/external-context',
        gltf: '/examples/showcase/gltf',
        'hello-cube': '/examples/tutorials/hello-cube',
        'hello-instancing': '/examples/tutorials/hello-instancing',
        'hello-react': '/examples/integrations/hello-react',
        'hello-triangle-geometry': '/examples/tutorials/hello-triangle-geometry',
        'hello-gltf': '/examples/tutorials/hello-gltf',
        'hello-triangle': '/examples/tutorials/hello-triangle',
        instancing: '/examples/showcase/instancing',
        'instanced-cubes': '/examples/tutorials/instanced-cubes',
        lighting: '/examples/tutorials/lighting',
        'multi-canvas': '/examples/api/multi-canvas',
        peristence: '/examples/showcase/persistence',
        persistence: '/examples/showcase/persistence',
        postprocessing: '/examples/showcase/postprocessing',
        'water-globe': '/examples/showcase/water-globe',
        'react-strict-mode': '/examples/integrations/react-strict-mode',
        'shader-hooks': '/examples/tutorials/shader-hooks',
        'shader-modules': '/examples/tutorials/shader-modules',
        'texture-3d': '/examples/api/texture-3d',
        'texture-tester': '/examples/api/texture-tester',
        transform: '/examples/tutorials/transform',
        'transform-feedback': '/examples/tutorials/transform-feedback',
        'two-cubes': '/examples/tutorials/two-cubes'
      }
    },
    // Local Vitest configuration layered on top of the reusable config factory.
    vitest: {
      // Force Chromium browser projects onto SwiftShader in CI for deterministic rendering.
      // Local runs should use the machine GPU unless explicitly overridden.
      softwareGpu: Boolean(process.env.CI),
      // Repo-owned exclusions that should not live in reusable devtools code.
      excludePatterns: [
        '**/*.disabled.*',
        'modules/**/wip/**',
        'modules/arrow/test/arrow/arrow-column-info.spec.ts',
        'modules/arrow/test/arrow/get-arrow-data.spec.ts',
        'modules/core/test/shadertypes/shader-types.spec.ts',
        'modules/engine/test/shader-inputs-types.spec.ts',
        'modules/engine/test/geometry/gpu-geometry.spec.ts',
        'modules/shadertools/test/lib/uniform-types.spec.ts',
        'modules/shadertools/test/modules/lighting/dirlight.spec.ts',
        'modules/webgl/test/adapter/helpers/get-shader-layout.spec.ts',
        'test/browser.ts',
        'test/index.ts',
        'test/modules.ts',
        'test/perf/**',
        'test/render/**'
      ]
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
    test: 'test/index.ts',
    'test-browser': 'test/index.html',
    bench: 'test/bench/index.js',
    'bench-browser': 'test/bench/index.html',
    size: 'test/size/import-nothing.js',
    'modules/webgl/test/context/create-context.spec.ts':
      'modules/webgl/test/context/create-browser-context.spec.ts',
    'modules/webgl/test/context/create-context.spec.ts-browser': 'test/index.html'
  }
};

export default config;
