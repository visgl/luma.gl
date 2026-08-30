// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

import {chromium} from 'playwright';
import {createServer} from 'vite';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sampleMilliseconds = Number(process.env.SPATIAL_ATLAS_BENCHMARK_MILLISECONDS ?? 8_000);
assert(Number.isFinite(sampleMilliseconds) && sampleMilliseconds > 0);

const server = await createServer({
  root,
  logLevel: 'error',
  server: {host: '127.0.0.1', port: 0, strictPort: false}
});
let browser;
try {
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  assert(url, 'Vite did not publish a local URL');
  process.stderr.write(`Spatial Atlas benchmark loading ${url}\n`);
  browser = await chromium.launch({
    headless: true,
    args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist']
  });
  const browserSession = await browser.newBrowserCDPSession();
  const systemInfo = await browserSession.send('SystemInfo.getInfo');
  const primaryGPU = systemInfo.gpu.devices[0];
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack ?? error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const benchmarkUrl = new URL(url);
  benchmarkUrl.searchParams.set('benchmark-ms', String(sampleMilliseconds));
  // The one-million-row graph is constructed by the module script. Waiting only for navigation
  // commit keeps Playwright responsive while that deliberate warm-up work is in progress.
  await page.goto(benchmarkUrl.toString(), {waitUntil: 'commit', timeout: 60_000});
  process.stderr.write('Spatial Atlas benchmark warming one million resident points…\n');
  await page.waitForFunction(
    () => Boolean(window.__lumaSpatialAtlasBenchmarkResult),
    undefined,
    {timeout: 300_000}
  );
  process.stderr.write(`Spatial Atlas benchmark sampled ${sampleMilliseconds} ms after warm-up.\n`);
  const result = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    ...window.__lumaSpatialAtlasBenchmarkResult
  }));
  assert.deepEqual(errors, [], `browser errors: ${errors.join('\n')}`);
  process.stdout.write(
    `${JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        browser: browser.version(),
        sampleMilliseconds,
        adapter: primaryGPU
          ? {
              description: primaryGPU.deviceString,
              device: primaryGPU.deviceId,
              vendor: primaryGPU.vendorString,
              vendorId: primaryGPU.vendorId,
              renderer: systemInfo.gpu.auxAttributes.glRenderer
            }
          : null,
        ...result
      },
      null,
      2
    )}\n`
  );
} finally {
  await browser?.close();
  await server.close();
}
