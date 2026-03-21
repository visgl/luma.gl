import path from 'node:path';
import {createRequire} from 'node:module';

import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';
import tsconfigPaths from 'vite-tsconfig-paths';

import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';
import {loadOcularConfig} from './load-ocular-config.mjs';

const require = createRequire(import.meta.url);
const VITEST_PACKAGE_ROOT = path.dirname(require.resolve('vitest/package.json'));
const VITEST_INTERNAL_BROWSER_PATH = require.resolve('vitest/internal/browser');

export async function getVitestConfig(options = {}) {
  const ocularConfig = options.ocularConfig || (await loadOcularConfig(options));
  const vitestConfig = ocularConfig.devtools?.vitest || {};
  const tsconfigProjects = vitestConfig.tsconfigProjects || ['./tsconfig.json'];
  const excludePatterns = vitestConfig.excludePatterns || [];
  const browserName = vitestConfig.browserName || 'chromium';
  const testTimeout = vitestConfig.testTimeout || 60_000;

  const createTsconfigPathsPlugin = () =>
    tsconfigPaths({
      projects: tsconfigProjects,
      ignoreConfigErrors: true
    });

  const createPlaywrightProvider = () =>
    playwright({
      launchOptions: getPlaywrightLaunchOptions({
        ocularConfig,
        channel: vitestConfig.channel,
        softwareGpu: vitestConfig.softwareGpu,
        launchOptions: vitestConfig.launchOptions
      })
    });

  return defineConfig({
    plugins: [createTsconfigPathsPlugin()],
    resolve: {
      alias: [
        {find: /^vitest\/internal\/browser$/, replacement: VITEST_INTERNAL_BROWSER_PATH},
        {find: /^vitest\/(.+)$/, replacement: `${VITEST_PACKAGE_ROOT}/$1`},
        {find: /^vitest$/, replacement: VITEST_PACKAGE_ROOT}
      ]
    },
    test: {
      projects: [
        {
          plugins: [createTsconfigPathsPlugin()],
          test: {
            name: 'node',
            color: 'blue',
            environment: 'node',
            include: ['modules/**/*.node.spec.{ts,js}', 'test/**/*.node.spec.{ts,js}'],
            exclude: excludePatterns,
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
            testTimeout,
            include: ['modules/**/*.spec.{ts,js}', 'test/**/*.spec.{ts,js}'],
            exclude: ['modules/**/*.node.spec.{ts,js}', 'test/**/*.node.spec.{ts,js}', ...excludePatterns],
            browser: {
              enabled: true,
              provider: createPlaywrightProvider(),
              instances: [{browser: browserName, headless: false}]
            }
          }
        },
        {
          plugins: [createTsconfigPathsPlugin()],
          test: {
            name: 'headless',
            color: 'cyan',
            environment: 'node',
            testTimeout,
            include: ['modules/**/*.spec.{ts,js}', 'test/**/*.spec.{ts,js}'],
            exclude: ['modules/**/*.node.spec.{ts,js}', 'test/**/*.node.spec.{ts,js}', ...excludePatterns],
            browser: {
              enabled: true,
              provider: createPlaywrightProvider(),
              instances: [{browser: browserName, headless: true}]
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
}
