import {getVitestConfig} from '@vis.gl/dev-tools';

const excludePatterns = [
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
];
const browserExcludePatterns = [
  'modules/**/*.node.spec.{ts,js}',
  'test/**/*.node.spec.{ts,js}',
  ...excludePatterns
];
const launchArguments = [
  '--enable-unsafe-webgpu',
  '--ignore-gpu-blocklist',
  ...(process.env.CI ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [])
];

export default getVitestConfig({
  excludePatterns,
  launchOptions: {
    channel: 'chromium',
    args: launchArguments
  },
  overrides: {
    // Keep deck.gl in Vite's source graph so it shares this repository's luma.gl runtime.
    ssr: {noExternal: ['@deck.gl/core']},
    optimizeDeps: {exclude: ['@deck.gl/core']}
  },
  projects: {
    node: {
      test: {
        color: 'blue',
        browser: {enabled: false}
      }
    },
    browser: {
      test: {
        color: 'green',
        environment: 'node',
        fileParallelism: !process.env.CI,
        setupFiles: ['./test/utils/browser-process-shim.mjs'],
        include: ['modules/**/*.spec.{ts,js}', 'test/**/*.spec.{ts,js}'],
        exclude: browserExcludePatterns
      }
    },
    headless: {
      test: {
        color: 'cyan',
        environment: 'node',
        fileParallelism: !process.env.CI,
        setupFiles: ['./test/utils/browser-process-shim.mjs'],
        include: ['modules/**/*.spec.{ts,js}', 'test/**/*.spec.{ts,js}'],
        exclude: browserExcludePatterns
      }
    }
  },
  coverage: {
    provider: 'istanbul',
    include: ['modules/**/src/**/*.{js,ts,tsx}'],
    exclude: [
      '**/*.d.ts',
      '**/*.map',
      '**/*.{bundle,min}.{js,ts}',
      '**/{build,coverage,dist,node_modules,vendor,vendored}/**',
      'examples/**',
      'website/**',
      'test/**',
      'modules/**/test/**'
    ],
    excludeAfterRemap: true
  }
});
