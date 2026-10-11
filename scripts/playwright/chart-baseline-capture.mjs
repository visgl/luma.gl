// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';

const {values} = parseArgs({options: {
  url: {type: 'string', default: 'http://127.0.0.1:5180/playground.html'},
  output: {type: 'string', default: '/tmp/luma-chart-capture'},
  renderer: {type: 'string', default: 'raytrace'},
  frames: {type: 'string', default: '8'}, seed: {type: 'string', default: '0'},
  width: {type: 'string', default: '960'}, height: {type: 'string', default: '720'},
  hardware: {type: 'string', default: 'unspecified'},
  motion: {type: 'boolean', default: false},
  'software-gpu': {type: 'boolean', default: false}
}});
const frames = Number(values.frames);
const seed = Number(values.seed);
const width = Number(values.width);
const height = Number(values.height);
if (!Number.isInteger(frames) || frames < 1 || frames > 256) throw new Error('frames must be an integer between 1 and 256');
if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('seed must be a uint32');
if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || height < 320) throw new Error('viewport dimensions must be integers of at least 320 pixels');
if (!['default', 'raytrace'].includes(values.renderer)) throw new Error('renderer must be default or raytrace');
const url = new URL(values.url);
url.searchParams.set('preset', values.motion ? 'chart-motion' : 'chart');
url.searchParams.set('renderer', values.renderer);
url.searchParams.set('quality', 'still');
url.searchParams.set('seed', String(seed));
url.searchParams.set('captureFrames', String(frames));
url.searchParams.set('editor', 'hidden');
const browser = await chromium.launch(getPlaywrightLaunchOptions({backend: 'webgpu', softwareGpu: values['software-gpu']}));
try {
  const page = await browser.newPage({viewport: {width, height}, deviceScaleFactor: 1});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const started = performance.now();
  await page.goto(url.href);
  await page.waitForFunction(expected => Number(document.querySelector('#playground-canvas')?.dataset.renderedFrames) === expected, frames, {timeout: 120000});
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const metadata = await page.evaluate(() => {
    const canvas = document.querySelector('#playground-canvas');
    return {drawingBuffer: [canvas.width, canvas.height], renderedFrames: Number(canvas.dataset.renderedFrames),
      backend: document.querySelector('#backend-label').textContent,
      scene: JSON.parse(document.querySelector('#scene-editor').value),
      rayResolution: document.querySelector('#scene-ray-tracing-resolution').textContent,
      rayFrame: document.querySelector('#scene-ray-tracing-frame').textContent,
      sceneError: document.querySelector('#scene-error').textContent};
  });
  await page.addStyleTag({content: '.preview-heading, .preview-statistics, .preview-hint {visibility: hidden !important}'});
  const output = resolve(values.output);
  await mkdir(output, {recursive: true});
  await page.locator('#playground-canvas').screenshot({path: `${output}/chart.png`, timeout: 60000});
  if (errors.length || metadata.sceneError) throw new Error(JSON.stringify({errors, sceneError: metadata.sceneError}));
  await writeFile(`${output}/metadata.json`, JSON.stringify({...metadata, seed, frames, viewport: [width, height],
    hardware: values.hardware, browser: browser.version(), elapsedMilliseconds: performance.now() - started,
    note: 'Elapsed time includes startup and screenshot; telemetry is CPU frame timing, not GPU timestamps. Memory and convergence benchmarks remain separate.'}, null, 2));
  console.log(output);
} finally { await browser.close(); }
