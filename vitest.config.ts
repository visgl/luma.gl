import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';
import tsconfigPaths from 'vite-tsconfig-paths';

const createTsconfigPathsPlugin = () =>
  tsconfigPaths({
    projects: ['./tsconfig.json'],
    ignoreConfigErrors: true
  });

const createPlaywrightProvider = () =>
  playwright({
    launchOptions: {
      channel: 'chromium',
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    }
  });

const EXCLUDE_PATTERNS = [
  '**/*.disabled.*',
  'modules/**/wip/**',
  'modules/arrow/test/arrow/arrow-column-info.spec.ts',
  'modules/arrow/test/arrow/get-arrow-data.spec.ts',
  'modules/core/test/shadertypes/shader-types.spec.ts',
  'modules/engine/test/shader-inputs-types.spec.ts',
  'modules/engine/test/geometry/gpu-geometry.browser.spec.ts',
  'modules/shadertools/test/lib/uniform-types.spec.ts',
  'modules/shadertools/test/modules/lighting/dirlight.spec.ts',
  'modules/webgl/test/adapter/helpers/get-shader-layout.browser.spec.ts',
  'test/browser.ts',
  'test/index.ts',
  'test/modules.ts',
  'test/perf/**',
  'test/render/**'
];

export default defineConfig({
  plugins: [createTsconfigPathsPlugin()],
  test: {
    projects: [
      {
        plugins: [createTsconfigPathsPlugin()],
        test: {
          name: 'node',
          color: 'blue',
          environment: 'node',
          include: ['modules/**/*.spec.{ts,js}', 'test/dev-modules/**/*.spec.{ts,js}'],
          exclude: ['modules/**/*.browser.spec.{ts,js}', ...EXCLUDE_PATTERNS],
          browser: {
            enabled: false
          }
        }
      },
      {
        plugins: [createTsconfigPathsPlugin()],
        test: {
          name: 'browser',
          color: 'green',
          environment: 'node',
          testTimeout: 60000,
          include: ['modules/**/*.browser.spec.{ts,js}', 'test/**/*.browser.spec.{ts,js}'],
          exclude: EXCLUDE_PATTERNS,
          browser: {
            enabled: true,
            provider: createPlaywrightProvider(),
            instances: [{browser: 'chromium', headless: false}]
          }
        }
      },
      {
        plugins: [createTsconfigPathsPlugin()],
        test: {
          name: 'headless',
          color: 'cyan',
          environment: 'node',
          testTimeout: 60000,
          include: ['modules/**/*.browser.spec.{ts,js}', 'test/**/*.browser.spec.{ts,js}'],
          exclude: EXCLUDE_PATTERNS,
          browser: {
            enabled: true,
            provider: createPlaywrightProvider(),
            instances: [{browser: 'chromium', headless: true}]
          }
        }
      }
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov']
    }
  }
});
