// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium, webkit} from 'playwright';

const baseUrl = process.env.MOBILE_EXAMPLE_BASE_URL || 'http://127.0.0.1:3011';
const outputDirectory = process.env.MOBILE_LAYOUT_OUTPUT || '/tmp/luma-iphone-layout';
await mkdir(outputDirectory, {recursive: true});
for (const [browserName, browserType] of Object.entries({chromium, webkit})) {
  if (process.env.MOBILE_EXAMPLE_BROWSERS && !process.env.MOBILE_EXAMPLE_BROWSERS.split(',').includes(browserName)) continue;
  const browser = await browserType.launch({headless: true});
  try {
    for (const [orientation, width, height] of [['portrait', 390, 844], ['landscape', 844, 390]]) {
      const context = await browser.newContext({viewport: {width, height}, hasTouch: true, isMobile: true, deviceScaleFactor: 3});
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        for (const route of ['/docs', '/docs/tutorials/shader-injection', '/examples/tutorials/hello-triangle']) {
          await page.goto(`${baseUrl}${route}`, {waitUntil: 'domcontentloaded', timeout: 120000});
          const navigation = page.locator('.navbar__toggle');
          await navigation.waitFor({state: 'visible'});
          const target = await navigation.boundingBox();
          assert(target.width >= 44 && target.height >= 44, 'navigation target must be at least 44px');
          await navigation.click();
          await page.locator('.navbar-sidebar').waitFor({state: 'visible'});
          await page.locator('.navbar-sidebar__close').click();
          await navigation.waitFor({state: 'visible'});
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'page must not overflow horizontally');
          const example = page.locator('[data-luma-example-page]').first();
          if (await example.count()) {
            const rectangle = await example.boundingBox();
            assert(rectangle.height <= height, 'example must fit the phone viewport');
            assert.equal(await example.getAttribute('data-luma-example-immersive'), 'false');
            const toggle = example.locator('[data-luma-example-fullscreen-toggle]');
            await toggle.scrollIntoViewIfNeeded();
            await toggle.click();
            await page.waitForFunction(() => document.querySelector('[data-luma-example-immersive="true"]'));
            const expanded = await example.boundingBox();
            assert(Math.abs(expanded.height - height) < 2, 'expanded view must fill dynamic viewport');
            await toggle.click();
            await navigation.waitFor({state: 'visible'});
          }
          await page.screenshot({path: `${outputDirectory}/${browserName}-${orientation}-${route.split('/').at(-1)}.png`});
          console.log(`PASS ${browserName} ${orientation} ${route}`);
        }
        assert.deepEqual(errors, [], 'no uncaught runtime errors');
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
}
