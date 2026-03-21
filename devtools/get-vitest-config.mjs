import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';
import tsconfigPaths from 'vite-tsconfig-paths';

import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';
import {loadOcularConfig} from './load-ocular-config.mjs';

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
