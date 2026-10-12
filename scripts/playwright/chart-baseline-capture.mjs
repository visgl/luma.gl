// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {compareChartImages} from './chart-image-metrics.mjs';
import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';

const {values} = parseArgs({options: {
  url: {type: 'string', default: 'http://127.0.0.1:5180/playground.html'},
  output: {type: 'string', default: '/tmp/luma-chart-capture'},
  renderer: {type: 'string', default: 'raytrace'},
  reference: {type: 'string'},
  'maximum-rmse': {type: 'string'},
  view: {type: 'string', default: 'color'},
  frames: {type: 'string', default: '8'}, seed: {type: 'string', default: '0'},
  width: {type: 'string', default: '960'}, height: {type: 'string', default: '720'},
  denoise: {type: 'string', default: '0'}, history: {type: 'string', default: '64'},
  hardware: {type: 'string', default: 'unspecified'},
  motion: {type: 'boolean', default: false},
  diffuse: {type: 'boolean', default: false},
  materials: {type: 'boolean', default: false},
  shapes: {type: 'boolean', default: false},
  transport: {type: 'string'},
  bounces: {type: 'string'},
  'software-gpu': {type: 'boolean', default: false}
}});
const maximumRootMeanSquaredError = values['maximum-rmse'] === undefined ? undefined : Number(values['maximum-rmse']);
if (maximumRootMeanSquaredError !== undefined && (!values.reference || !Number.isFinite(maximumRootMeanSquaredError) || maximumRootMeanSquaredError < 0 || maximumRootMeanSquaredError > 1)) throw new Error('maximum-rmse requires a reference and a finite value between 0 and 1');
if (!['color', 'normal', 'cameraDistance', 'identity', 'history'].includes(values.view)) throw new Error('Unknown ray debug view');
if (values.renderer !== 'raytrace' && values.view !== 'color') throw new Error('Debug views require raytrace');
if (values.transport !== undefined && !['diffuse', 'pbr'].includes(values.transport)) throw new Error('transport must be diffuse or pbr');
if (values.bounces !== undefined && (!Number.isInteger(Number(values.bounces)) || Number(values.bounces) < 0 || Number(values.bounces) > 8)) throw new Error('bounces must be an integer between 0 and 8');
if (values.renderer !== 'raytrace' && (values.transport !== undefined || values.bounces !== undefined)) throw new Error('Transport overrides require raytrace');
const denoise = Number(values.denoise);
const history = Number(values.history);
if (![0, 1, 2].includes(denoise)) throw new Error('denoise must be 0, 1 or 2');
if (!Number.isInteger(history) || history < 1 || history > 256) throw new Error('history must be an integer between 1 and 256');
const frames = Number(values.frames);
const seed = Number(values.seed);
const width = Number(values.width);
const height = Number(values.height);
if (!Number.isInteger(frames) || frames < 1 || frames > 256) throw new Error('frames must be an integer between 1 and 256');
if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('seed must be a uint32');
if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || height < 320) throw new Error('viewport dimensions must be integers of at least 320 pixels');
if (!['default', 'raytrace'].includes(values.renderer)) throw new Error('renderer must be default or raytrace');
const url = new URL(values.url);
url.searchParams.set('preset', values.shapes ? 'chart-shapes' : values.materials ? 'chart-materials' : values.diffuse ? 'chart-diffuse' : values.motion ? 'chart-motion' : 'chart');
url.searchParams.set('renderer', values.renderer);
url.searchParams.set('quality', 'still');
url.searchParams.set('seed', String(seed));
url.searchParams.set('denoise', String(denoise));
url.searchParams.set('history', String(history));
url.searchParams.set('view', values.view);
if (values.transport !== undefined) url.searchParams.set('transport', values.transport);
if (values.bounces !== undefined) url.searchParams.set('bounces', values.bounces);
url.searchParams.set('captureFrames', String(frames));
url.searchParams.set('editor', 'hidden');
// Decode before any output is written, including when output aliases the reference.
const referenceImage = values.reference ? PNG.sync.read(await readFile(resolve(values.reference))) : undefined;
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
    return {rayTracingCapabilities: JSON.parse(canvas.dataset.rayTracingCapabilities ?? 'null'), drawingBuffer: [canvas.width, canvas.height], renderedFrames: Number(canvas.dataset.renderedFrames),
      backend: document.querySelector('#backend-label').textContent,
      scene: JSON.parse(document.querySelector('#scene-editor').value),
      rayResolution: document.querySelector('#scene-ray-tracing-resolution').textContent,
      rayFrame: document.querySelector('#scene-ray-tracing-frame').textContent,
      ownedMemory: document.querySelector('#scene-ray-memory').textContent,
      sceneError: document.querySelector('#scene-error').textContent};
  });
  await page.addStyleTag({content: '.preview-heading, .preview-statistics, .preview-hint {visibility: hidden !important}'});
  const output = resolve(values.output);
  await mkdir(output, {recursive: true});
  const capture = await page.locator('#playground-canvas').screenshot({path: `${output}/chart.png`, timeout: 60000});
  const comparison = referenceImage ? {reference: resolve(values.reference), ...compareChartImages(PNG.sync.read(capture), referenceImage)} : undefined;
  if (errors.length || metadata.sceneError) throw new Error(JSON.stringify({errors, sceneError: metadata.sceneError}));
  await writeFile(`${output}/metadata.json`, JSON.stringify({...metadata, comparison, seed, frames, viewport: [width, height],
    hardware: values.hardware, browser: browser.version(), elapsedMilliseconds: performance.now() - started,
    note: 'Elapsed time includes startup and screenshot; telemetry is CPU frame timing, not GPU timestamps. Owned memory is a logical allocation estimate, not measured VRAM; hardware convergence benchmarks remain separate.'}, null, 2));
  console.log(output);
  if (comparison && maximumRootMeanSquaredError !== undefined && comparison.rootMeanSquaredError > maximumRootMeanSquaredError) throw new Error(`Display RGB RMSE ${comparison.rootMeanSquaredError} exceeds ${maximumRootMeanSquaredError}`);
} finally { await browser.close(); }
