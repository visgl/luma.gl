// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium, webkit} from 'playwright';

const baseUrl = process.env.MOBILE_EXAMPLE_BASE_URL || 'http://127.0.0.1:3011';
const outputDirectory = process.env.MOBILE_LAYOUT_OUTPUT || '/tmp/luma-iphone-layout';
await mkdir(outputDirectory, {recursive: true});
const server = await ensureWebsiteServer();
try {
  for (const [browserName, browserType] of Object.entries({chromium, webkit})) {
    if (
      process.env.MOBILE_EXAMPLE_BROWSERS &&
      !process.env.MOBILE_EXAMPLE_BROWSERS.split(',').includes(browserName)
    )
      continue;
    const browser = await browserType.launch({
      headless: true,
      ...(browserName === 'chromium'
        ? {
            args: [
              '--enable-unsafe-webgpu',
              '--ignore-gpu-blocklist',
              ...(process.env.CI && process.platform === 'linux'
                ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
                : [])
            ]
          }
        : {})
    });
    try {
      for (const [orientation, width, height] of [
        ['portrait', 390, 844],
        ['landscape', 844, 390]
      ]) {
        const context = await browser.newContext({
          viewport: {width, height},
          hasTouch: true,
          isMobile: true,
          deviceScaleFactor: 3
        });
        const page = await context.newPage();
        page.setDefaultTimeout(60000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        try {
          for (const route of [
            '/docs',
            '/docs/tutorials/shader-injection',
            '/examples/tutorials/hello-triangle',
            '/docs/api-reference/core/canvas-context',
            '/docs/api-reference/anari'
          ]) {
            await page.goto(`${baseUrl}${route}`, {waitUntil: 'domcontentloaded', timeout: 120000});
            await page.locator('html[data-has-hydrated="true"]').waitFor();
            const navigation = page.locator('.navbar__toggle');
            await navigation.waitFor({state: 'visible'});
            const target = await navigation.boundingBox();
            assert(
              target.width >= 44 && target.height >= 44,
              'navigation target must be at least 44px'
            );
            await navigation.click();
            await page.locator('.navbar-sidebar').waitFor({state: 'visible'});
            await page.locator('.navbar-sidebar__close').click();
            await navigation.waitFor({state: 'visible'});
            assert(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
              'page must not overflow horizontally'
            );
            if (route.endsWith('/anari')) {
              // Exercise the real wrapper's keyboard behavior independently of GPU startup.
              await page.route('**/standalone-examples/scene/playground.html', request =>
                request.fulfill({
                  contentType: 'text/html',
                  body: '<!doctype html><html><body><canvas width="100" height="30"></canvas><a href="#example">Example details</a><label>Scene editor <input aria-label="Scene editor"></label><button>Apply</button></body></html>'
                })
              );
              await page.getByRole('button', {name: 'Load scene playground'}).click();
              await page.frameLocator('iframe[title="ANARI Scene Lab"]').locator('body').waitFor();
            }
            const example = page.locator('[data-luma-example-page]').first();
            if (await example.count()) {
              const rectangle = await example.boundingBox();
              const contentSized =
                (await example.getAttribute('data-luma-example-content-sized')) !== null;
              if (!contentSized)
                assert(rectangle.height <= height, 'example must fit the phone viewport');
              if (contentSized) {
                await page.waitForFunction(() => {
                  const element = document.querySelector('[data-luma-example-content-sized]');
                  return element && element.scrollHeight <= element.clientHeight + 1;
                });
                assert(
                  await example.evaluate(
                    element => element.scrollHeight <= element.clientHeight + 1
                  ),
                  'content-sized examples must not clip their contents'
                );
              }
              assert.equal(await example.getAttribute('data-luma-example-immersive'), 'false');
              const toggle = example.locator('[data-luma-example-fullscreen-toggle]');
              await toggle.scrollIntoViewIfNeeded();
              await toggle.click();
              await page.waitForFunction(() =>
                document.querySelector('[data-luma-example-immersive="true"]')
              );
              const expanded = await example.boundingBox();
              assert(
                Math.abs(expanded.height - height) < 2,
                'expanded view must fill dynamic viewport'
              );
              await page.keyboard.press('Tab');
              if (await example.locator('iframe').count()) {
                assert(
                  await example
                    .locator('iframe')
                    .evaluate(frame => document.activeElement === frame),
                  'Tab must enter the expanded iframe'
                );
              }
              assert(
                await example.evaluate(element => element.contains(document.activeElement)),
                'expanded focus must stay inside the example'
              );
              if (route.endsWith('/anari')) {
                const firstLink = page
                  .frameLocator('iframe')
                  .getByRole('link', {name: 'Example details'});
                const editor = page
                  .frameLocator('iframe')
                  .getByRole('textbox', {name: 'Scene editor'});
                assert(
                  await firstLink.evaluate(
                    element => element === element.ownerDocument.activeElement
                  ),
                  'Tab must enter the first iframe link'
                );
                await page.frameLocator('iframe').locator('canvas').click();
                await page.keyboard.press('Tab');
                assert(
                  await firstLink.evaluate(element => element === element.ownerDocument.activeElement),
                  'Tab after clicking the canvas must enter iframe controls'
                );
                await page.keyboard.press('Shift+Tab');
                assert(
                  await toggle.evaluate(element => element === document.activeElement),
                  'backward tabbing must stay inside the expanded example'
                );
                await page.keyboard.press('Tab');
                assert(
                  await firstLink.evaluate(
                    element => element === element.ownerDocument.activeElement
                  ),
                  'forward wrapping must re-enter the first iframe link'
                );
                await page.keyboard.press('Tab');
                assert(
                  await editor.evaluate(element => element === element.ownerDocument.activeElement),
                  'keyboard users must reach controls inside the iframe'
                );
                const frameControlCount = await page
                  .frameLocator('iframe')
                  .locator('a, input, button')
                  .count();
                for (
                  let step = 0;
                  step <= frameControlCount &&
                  !(await toggle.evaluate(element => element === document.activeElement));
                  step++
                ) {
                  await page.keyboard.press('Tab');
                  assert(
                    await example.evaluate(element => element.contains(document.activeElement)),
                    'forward tabbing must remain inside the expanded example'
                  );
                }
                assert(
                  await toggle.evaluate(element => element === document.activeElement),
                  'forward tabbing must leave the iframe inside the dialog'
                );
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
              }
              const backendTrigger = example.locator('[data-luma-backend-trigger]');
              if ((await backendTrigger.count()) && (await backendTrigger.isVisible())) {
                await backendTrigger.click();
                const backendMenu = example.getByRole('menu', {name: 'Graphics backend options'});
                await backendMenu.waitFor({state: 'visible'});
                await page.keyboard.press('Escape');
                await backendMenu.waitFor({state: 'hidden'});
                assert.equal(
                  await example.getAttribute('data-luma-example-immersive'),
                  'true',
                  'closing the menu must preserve expanded mode'
                );
                assert(
                  await backendTrigger.evaluate(element => element === document.activeElement),
                  'closing the menu must restore its trigger focus'
                );
                await backendTrigger.click();
                await backendMenu.waitFor({state: 'visible'});
                const menuItemCount = await backendMenu.locator('button:not(:disabled)').count();
                for (
                  let step = 0;
                  step <= menuItemCount && (await backendMenu.isVisible());
                  step++
                ) {
                  await page.keyboard.press('Tab');
                }
                await backendMenu.waitFor({state: 'hidden'});
                assert.equal(
                  await example.getAttribute('data-luma-example-immersive'),
                  'true',
                  'leaving the menu must preserve expanded mode'
                );
              }
              await page.setViewportSize({width: height, height: width});
              await page.waitForFunction(
                expectedHeight =>
                  Math.abs(
                    document
                      .querySelector('[data-luma-example-immersive="true"]')
                      .getBoundingClientRect().height - expectedHeight
                  ) < 2,
                width
              );
              await page.keyboard.press('Escape');
              await navigation.waitFor({state: 'visible'});
              assert.equal(await example.getAttribute('data-luma-example-immersive'), 'false');
              await page.setViewportSize({width, height});
              const expandInfo = example.locator('button[aria-label="Expand info box"]').first();
              if ((await expandInfo.count()) && (await expandInfo.isVisible())) {
                await expandInfo.click();
                const panel = example.locator('[data-luma-info-box-collapsed="false"]');
                const panelBounds = await panel.boundingBox();
                const navbarBounds = await page.locator('.navbar').boundingBox();
                assert(
                  panelBounds.y >= navbarBounds.y + navbarBounds.height,
                  'information controls must remain below the navbar'
                );
                await example.locator('button[aria-label="Collapse info box"]').first().click();
              }
            }
            if (route.endsWith('/hello-triangle')) {
              const trigger = example.locator('[data-luma-backend-trigger]');
              await trigger.tap();
              const menu = example.getByRole('menu', {name: 'Graphics backend options'});
              const originalType = await menu
                .locator('[aria-checked="true"]')
                .getAttribute('data-luma-backend-option');
              const webglOption = menu.locator(
                '[data-luma-backend-option="webgl"][aria-checked="false"]:not(:disabled)'
              );
              const alternative = (await webglOption.count())
                ? webglOption
                : menu.locator('[aria-checked="false"]:not(:disabled)').first();
              const target = (await alternative.count())
                ? alternative
                : menu.locator('[aria-checked="true"]');
              const targetType = await target.getAttribute('data-luma-backend-option');
              await menu.evaluate(element => {
                const active = element.ownerDocument.activeElement;
                if (active instanceof HTMLElement) active.blur();
              });
              await target.tap();
              await menu.waitFor({state: 'hidden'});
              await trigger.tap();
              assert.equal(
                await menu
                  .locator(`[data-luma-backend-option="${targetType}"]`)
                  .getAttribute('aria-checked'),
                'true',
                'touch selection must update the backend'
              );
              if (originalType !== targetType) {
                await menu.locator(`[data-luma-backend-option="${originalType}"]`).tap();
                await menu.waitFor({state: 'hidden'});
                await trigger.tap();
                assert.equal(
                  await menu
                    .locator(`[data-luma-backend-option="${originalType}"]`)
                    .getAttribute('aria-checked'),
                  'true'
                );
              }
              await page.keyboard.press('Escape');
              await menu.waitFor({state: 'hidden'});
            }
            await page.screenshot({
              path: `${outputDirectory}/${browserName}-${orientation}-${route.split('/').at(-1)}.png`
            });
            console.log(
              `PASS ${browserName} ${orientation} ${route}${route.endsWith('/anari') ? ' (iframe keyboard fixture)' : ''}`
            );
          }
          assert.deepEqual(errors, [], 'no uncaught runtime errors');
        } catch (error) {
          await page
            .screenshot({path: `${outputDirectory}/${browserName}-${orientation}-failure.png`})
            .catch(() => {});
          throw error;
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  server?.kill('SIGTERM');
}

async function ensureWebsiteServer() {
  if (await isServerReady()) return null;
  const serverProcess = spawn(
    process.execPath,
    [
      fileURLToPath(new URL('./serve-static-website.mjs', import.meta.url)),
      '--root',
      fileURLToPath(new URL('../../website/build', import.meta.url)),
      '--host',
      '127.0.0.1',
      '--port',
      new URL(baseUrl).port || '3011'
    ],
    {stdio: 'inherit'}
  );
  try {
    for (let attempt = 0; attempt < 120; attempt++) {
      if (await isServerReady()) return serverProcess;
      await delay(500);
    }
    throw new Error(`Build the website before running mobile checks: ${baseUrl} is unavailable`);
  } catch (error) {
    serverProcess.kill('SIGTERM');
    throw error;
  }
}

async function isServerReady() {
  try {
    return (await fetch(`${baseUrl}/docs`, {method: 'HEAD'})).ok;
  } catch {
    return false;
  }
}
