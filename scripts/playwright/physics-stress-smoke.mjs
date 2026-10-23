// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';

const browser = await chromium.launch(getPlaywrightLaunchOptions({headless: true, backend: 'webgpu-core'}));
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 960}});
  // Force a rendered frame during pose readback: scene publication must be atomic.
  await page.addInitScript(() => {
    const destroyDevice = GPUDevice.prototype.destroy;
    GPUDevice.prototype.destroy = function () {
      const element = document.documentElement;
      element.dataset.destroyedDevices = String(Number(element.dataset.destroyedDevices || 0) + 1);
      return destroyDevice.call(this);
    };
    const mapAsync = GPUBuffer.prototype.mapAsync;
    GPUBuffer.prototype.mapAsync = async function (...parameters) {
      await mapAsync.apply(this, parameters);
      await new Promise(resolve => requestAnimationFrame(resolve));
    };
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.PHYSICS_STRESS_URL || 'http://127.0.0.1:5235/');
  await page.getByRole('button', {name: 'Expand info box', exact: true}).first().click();
  const waitForTicks = async minimum => page.waitForFunction(expected => {
    const value = document.querySelector('#status')?.textContent ?? '';
    return value.startsWith('ACCEPTED') && Number(value.match(/tick (\d+)\//)?.[1]) >= expected;
  }, minimum, {timeout: 120000});
  const reports = [];
  for (const scene of ['capacity', 'dense', 'massRatio', 'ballistic', 'continuous', 'sparseContacts', 'geometry', 'deepStack', 'offsetStack', 'geometryConvex', 'geometryOpenings', 'fastPrimitives', 'fastMesh']) {
    if (scene !== 'capacity') await page.locator('#scene').selectOption(scene);
    // Numerical duration/accuracy belongs in GPU specs; UI smoke checks live scene switching.
    // Ballistic playback must continue beyond the former 240-step cutoff.
    await waitForTicks(scene === 'ballistic' ? 300 : 12);
    const status = await page.locator('#status').textContent();
    assert.match(status, /ACCEPTED/);
    assert.match(status, /\/14400/);
    assert.equal(await page.locator('#error').textContent(), '');
    reports.push({scene, status});
    console.log(`${scene}: accepted`);
    if (scene === 'sparseContacts') {
      assert.match(status, /Pair workgroups\/iteration: 0 \/ 128 capacity/);
      await page.locator('#pair-work').selectOption('scan');
      await waitForTicks(12);
      assert.match(await page.locator('#status').textContent(), /Pair workgroups\/iteration: 128 \/ 128 capacity/);
      await page.locator('#pair-work').selectOption('compact');
      await waitForTicks(12);
    }
    if (scene === 'dense') await page.screenshot({path: '/tmp/physics-stress-thumbnail.jpg', type: 'jpeg', quality: 85});
  }
  await page.locator('#scene').selectOption('fastBudget');
  await page.waitForFunction(() => document.querySelector('#status')?.textContent?.startsWith('REJECTED'), undefined, {timeout: 120000});
  assert.match(await page.locator('#status').textContent(), /tick 0\/14400/);
  assert.equal(await page.locator('#error').textContent(), '');
  await page.locator('#scene').selectOption('geometryOpenings');
  await waitForTicks(12);
  await page.locator('#pause').click();
  await page.locator('#run-limit').selectOption('30');
  await page.waitForFunction(() => !document.querySelector('#reset')?.disabled);
  assert.match(await page.locator('#status').textContent(), /READY · tick 0\/3600/);
  await page.screenshot({path: '/tmp/physics-stress.png'});
  // Leave synchronously after starting a rebuild, before its asynchronous creation finishes.
  await page.evaluate(() => {
    document.querySelector('#reset').click();
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
  });
  await page.waitForFunction(() => document.documentElement.dataset.destroyedDevices === '1');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(reports, null, 2));
} finally {await browser.close();}
