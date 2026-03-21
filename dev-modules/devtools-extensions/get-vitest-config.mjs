import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';
import ts from 'typescript';

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
  const tsconfigAliases = getTsconfigAliases(tsconfigProjects);

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
    resolve: {
      alias: [
        ...tsconfigAliases,
        {find: /^vitest\/internal\/browser$/, replacement: VITEST_INTERNAL_BROWSER_PATH}
      ]
    },
    test: {
      alias: tsconfigAliases,
      projects: [
        {
          extends: true,
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
          extends: true,
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
          extends: true,
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

function getTsconfigAliases(tsconfigProjects) {
  const aliasEntries = [];

  for (const tsconfigProject of tsconfigProjects) {
    const tsconfigPath = path.resolve(tsconfigProject);
    if (!fs.existsSync(tsconfigPath)) {
      continue;
    }

    const {config, error} = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    if (error || !config?.compilerOptions?.paths) {
      continue;
    }

    const baseUrl = config.compilerOptions.baseUrl || '.';
    const configDirectory = path.dirname(tsconfigPath);

    for (const [aliasPattern, targets] of Object.entries(config.compilerOptions.paths)) {
      const firstTarget = Array.isArray(targets) ? targets[0] : undefined;
      if (!firstTarget) {
        continue;
      }

      if (aliasPattern.endsWith('/*') && firstTarget.endsWith('/*')) {
        const escapedPrefix = escapeRegExp(aliasPattern.slice(0, -2));
        const replacementPrefix = path
          .resolve(configDirectory, baseUrl, firstTarget.slice(0, -2))
          .replace(/\\/g, '/');
        aliasEntries.push({
          key: aliasPattern,
          alias: {
            find: new RegExp(`^${escapedPrefix}/(.+)$`),
            replacement: `${replacementPrefix}/$1`
          }
        });
      } else {
        aliasEntries.push({
          key: aliasPattern,
          alias: {
            find: aliasPattern,
            replacement: path.resolve(configDirectory, baseUrl, firstTarget).replace(/\\/g, '/')
          }
        });
      }
    }
  }

  aliasEntries.sort((left, right) => right.key.length - left.key.length);
  return aliasEntries.map(entry => entry.alias);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
