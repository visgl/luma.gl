#!/usr/bin/env node

// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium, webkit} from 'playwright';

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '../..');
const BASE_URL = process.env.MOBILE_EXAMPLE_BASE_URL || 'http://127.0.0.1:3010';
const SHARD_INDEX = Number(process.env.MOBILE_EXAMPLE_SHARD_INDEX || 0);
const SHARD_TOTAL = Number(process.env.MOBILE_EXAMPLE_SHARD_TOTAL || 1);
const REQUESTED_BROWSERS = (process.env.MOBILE_EXAMPLE_BROWSERS || 'chromium,webkit').split(',');
const FIRST_FRAME_TIMEOUT = 10_000;
const PHONE_PROFILES = [
  {name: 'galaxy-s-current', width: 412, height: 915, deviceScaleFactor: 3},
  {name: 'galaxy-s-previous', width: 384, height: 854, deviceScaleFactor: 3}
];
const BROWSER_TYPES = {chromium, webkit};

validateShard();
const routes = await discoverExampleRoutes();
const allCases = REQUESTED_BROWSERS.flatMap(browserName =>
  PHONE_PROFILES.flatMap(profile =>
    ['portrait', 'landscape'].flatMap(orientation =>
      routes.map(route => ({browserName, orientation, profile, route}))
    )
  )
);
const cases = allCases.filter((_testCase, index) => index % SHARD_TOTAL === SHARD_INDEX);
const server = await ensureWebsiteServer();
const failures = [];

try {
  for (const browserName of REQUESTED_BROWSERS) {
    const browserCases = cases.filter(testCase => testCase.browserName === browserName);
    if (!browserCases.length) continue;
    const browserType = BROWSER_TYPES[browserName];
    if (!browserType) throw new Error(`Unknown browser: ${browserName}`);
    const browser = await browserType.launch({headless: true});
    try {
      for (const testCase of browserCases) {
        try {
          await runSmokeCase(browser, testCase);
          console.log(`PASS ${formatCase(testCase)}`);
        } catch (error) {
          failures.push(`${formatCase(testCase)}: ${getErrorMessage(error)}`);
          console.error(`FAIL ${failures.at(-1)}`);
        }
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  if (server) {
    server.kill('SIGTERM');
  }
}

if (failures.length) {
  throw new Error(`${failures.length} mobile example smoke cases failed:\n${failures.join('\n')}`);
}

async function runSmokeCase(browser, testCase) {
  const landscape = testCase.orientation === 'landscape';
  const context = await browser.newContext({
    deviceScaleFactor: testCase.profile.deviceScaleFactor,
    hasTouch: true,
    isMobile: true,
    viewport: {
      width: landscape ? testCase.profile.height : testCase.profile.width,
      height: landscape ? testCase.profile.width : testCase.profile.height
    }
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = query => {
      const result = nativeMatchMedia(query);
      return query === '(pointer: coarse)'
        ? new Proxy(result, {
            get(target, property) {
              const value = property === 'matches' ? true : Reflect.get(target, property, target);
              return typeof value === 'function' ? value.bind(target) : value;
            }
          })
        : result;
    };
  });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    await page.goto(`${BASE_URL}/examples/${testCase.route}`, {waitUntil: 'domcontentloaded'});
    const example = page.locator('[data-luma-example-state]').first();
    await example.waitFor({state: 'visible', timeout: FIRST_FRAME_TIMEOUT});
    await page.waitForFunction(
      () => {
        const element = document.querySelector('[data-luma-example-state]');
        return ['running', 'unsupported', 'failed'].includes(
          element?.getAttribute('data-luma-example-state') || ''
        );
      },
      undefined,
      {timeout: FIRST_FRAME_TIMEOUT}
    );
    const state = await example.getAttribute('data-luma-example-state');
    if (state === 'failed') {
      throw new Error((await example.locator('[role="alert"]').first().textContent()) || 'failed');
    }
    if (state === 'unsupported') {
      const alert = example.locator('[role="alert"]').first();
      if (!(await alert.isVisible()) || !(await alert.textContent())?.trim()) {
        throw new Error('unsupported state does not include a visible reason');
      }
      return;
    }

    const output = await example.evaluate(element => {
      const canvas = element.querySelector('canvas');
      const rectangle = canvas?.getBoundingClientRect();
      return {
        canvasHeight: rectangle?.height || 0,
        canvasWidth: rectangle?.width || 0,
        hasCanvas: Boolean(canvas),
        horizontalOverflow: element.scrollWidth - element.clientWidth
      };
    });
    if (output.hasCanvas && (!output.canvasWidth || !output.canvasHeight)) {
      throw new Error('running example has a blank or zero-sized canvas');
    }
    if (output.horizontalOverflow > 1) {
      throw new Error(`example overflows horizontally by ${output.horizontalOverflow}px`);
    }
    const qualityBadge = example.locator('[data-luma-example-mobile-badge]:visible').first();
    try {
      await qualityBadge.waitFor({state: 'visible', timeout: 2_000});
    } catch {
      const diagnostics = await page.evaluate(() => ({
        badgeCount: document.querySelectorAll('[data-luma-example-mobile-badge]').length,
        badges: [...document.querySelectorAll('[data-luma-example-mobile-badge]')].map(element => {
          const rectangle = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            display: style.display,
            height: rectangle.height,
            text: element.textContent,
            visibility: style.visibility,
            width: rectangle.width
          };
        }),
        coarsePointer: window.matchMedia('(pointer: coarse)').matches,
        maxTouchPoints: navigator.maxTouchPoints,
        states: [...document.querySelectorAll('[data-luma-example-state]')].map(element => ({
          id: element.getAttribute('data-luma-example-id'),
          state: element.getAttribute('data-luma-example-state')
        })),
        viewport: [window.innerWidth, window.innerHeight]
      }));
      throw new Error(`mobile quality label is missing: ${JSON.stringify(diagnostics)}`);
    }
    const undersizedControl = await example.locator('button:visible, select:visible, [role="button"]:visible').evaluateAll(
      controls =>
        controls.find(control => {
          if (control.closest('[data-luma-example-stats]')) {
            return false;
          }
          const rectangle = control.getBoundingClientRect();
          return rectangle.width < 44 || rectangle.height < 44;
        })?.outerHTML || null
    );
    if (undersizedControl) {
      throw new Error(`primary control is smaller than 44 CSS pixels: ${undersizedControl}`);
    }
    if (pageErrors.length) {
      throw new Error(`uncaught page error: ${pageErrors.join('; ')}`);
    }
  } finally {
    await context.close();
  }
}

async function discoverExampleRoutes() {
  const tableOfContents = JSON.parse(
    await readFile(
      path.join(REPOSITORY_ROOT, 'website/content/examples/table-of-contents.json'),
      'utf8'
    )
  );
  const routes = [];
  const visit = entries => {
    for (const entry of entries) {
      if (typeof entry === 'string') {
        if (entry !== 'index') routes.push(entry);
      } else if (entry.type === 'category') {
        visit(entry.items);
      } else if (entry.id !== 'index') {
        routes.push(entry.id);
      }
    }
  };
  visit(tableOfContents);
  return routes;
}

async function ensureWebsiteServer() {
  if (await isServerReady()) return null;
  const server = spawn(
    process.execPath,
    [
      path.join(REPOSITORY_ROOT, 'scripts/playwright/serve-static-website.mjs'),
      '--root',
      path.join(REPOSITORY_ROOT, 'website/build'),
      '--host',
      '127.0.0.1',
      '--port',
      new URL(BASE_URL).port || '3010'
    ],
    {stdio: 'inherit'}
  );
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await isServerReady()) return server;
    await delay(500);
  }
  server.kill('SIGTERM');
  throw new Error(`Website did not become available at ${BASE_URL}`);
}

async function isServerReady() {
  try {
    return (await fetch(BASE_URL, {method: 'HEAD'})).ok;
  } catch {
    return false;
  }
}

function validateShard() {
  if (!Number.isSafeInteger(SHARD_TOTAL) || SHARD_TOTAL < 1) {
    throw new Error('MOBILE_EXAMPLE_SHARD_TOTAL must be a positive integer.');
  }
  if (!Number.isSafeInteger(SHARD_INDEX) || SHARD_INDEX < 0 || SHARD_INDEX >= SHARD_TOTAL) {
    throw new Error('MOBILE_EXAMPLE_SHARD_INDEX must be in the selected shard range.');
  }
}

function formatCase(testCase) {
  return `${testCase.browserName}/${testCase.profile.name}/${testCase.orientation}/${testCase.route}`;
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
