// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {compareChartImages, compareRadianceCaptures, decodeRadianceCapture} from './chart-image-metrics.mjs';
import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';

const {values} = parseArgs({options: {
  url: {type: 'string', default: 'http://127.0.0.1:5180/playground.html'},
  output: {type: 'string', default: '/tmp/luma-chart-capture'},
  renderer: {type: 'string', default: 'raytrace'},
  reference: {type: 'string'},
  'linear-hdr': {type: 'boolean'},
  'maximum-rmse': {type: 'string'},
  view: {type: 'string', default: 'color'},
  'frame-sweep': {type: 'string'},
  'small-emitter': {type: 'boolean'},
  'antique-camera': {type: 'boolean'},
  frames: {type: 'string', default: '8'}, seed: {type: 'string', default: '0'},
  width: {type: 'string', default: '960'}, height: {type: 'string', default: '720'},
  denoise: {type: 'string', default: '0'}, history: {type: 'string', default: '64'},
  hardware: {type: 'string', default: 'unspecified'},
  motion: {type: 'boolean', default: false},
  diffuse: {type: 'boolean', default: false},
  materials: {type: 'boolean', default: false},
  shapes: {type: 'boolean', default: false},
  lighting: {type: 'boolean', default: false},
  transport: {type: 'string'},
  emitters: {type: 'string'},
  'emitter-selection': {type: 'string'},
  resolution: {type: 'string'},
  bounces: {type: 'string'},
  'software-gpu': {type: 'boolean', default: false}
}});
const maximumRootMeanSquaredError = values['maximum-rmse'] === undefined ? undefined : Number(values['maximum-rmse']);
if (maximumRootMeanSquaredError !== undefined && (!values.reference || !Number.isFinite(maximumRootMeanSquaredError) || maximumRootMeanSquaredError < 0 || (!values['linear-hdr'] && maximumRootMeanSquaredError > 1))) throw new Error('maximum-rmse requires a reference and a finite nonnegative value (at most 1 for display RGB)');
if (!['color', 'normal', 'cameraDistance', 'identity', 'history'].includes(values.view)) throw new Error('Unknown ray debug view');
if (values.renderer !== 'raytrace' && values.view !== 'color') throw new Error('Debug views require raytrace');
if (values.transport !== undefined && !['diffuse', 'pbr'].includes(values.transport)) throw new Error('transport must be diffuse or pbr');
if (values.bounces !== undefined && (!Number.isInteger(Number(values.bounces)) || Number(values.bounces) < 0 || Number(values.bounces) > 8)) throw new Error('bounces must be an integer between 0 and 8');
if (values.renderer !== 'raytrace' && (values.transport !== undefined || values.bounces !== undefined)) throw new Error('Transport overrides require raytrace');
if (values.emitters !== undefined && !['on', 'off'].includes(values.emitters)) throw new Error('emitters must be on or off');
if (values.renderer !== 'raytrace' && values.emitters !== undefined) throw new Error('Emitter overrides require raytrace');
if (values['emitter-selection'] !== undefined && !['uniform', 'power'].includes(values['emitter-selection'])) throw new Error('emitter-selection must be uniform or power');
if (values.resolution !== undefined && ![0.25, 0.5, 0.75, 1].includes(Number(values.resolution))) throw new Error('resolution must be 0.25, 0.5, 0.75 or 1');
if (values.renderer !== 'raytrace' && (values['emitter-selection'] !== undefined || values.resolution !== undefined)) throw new Error('Ray quality overrides require raytrace');
const denoise = Number(values.denoise);
const history = Number(values.history);
if (![0, 1, 2].includes(denoise)) throw new Error('denoise must be 0, 1 or 2');
if (!Number.isInteger(history) || history < 1 || history > 256) throw new Error('history must be an integer between 1 and 256');
const frameCounts = (values['frame-sweep'] ?? values.frames).split(',').map(Number);
if (frameCounts.some((frames, index) => !Number.isInteger(frames) || frames < 1 || frames > 256 ||
  (index > 0 && frames <= frameCounts[index - 1]))) {
  throw new Error('Frame counts must be strictly increasing integers between 1 and 256');
}
if (values['frame-sweep'] && !values.reference) throw new Error('frame-sweep requires a reference image');
const seed = Number(values.seed);
const width = Number(values.width);
const height = Number(values.height);
if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('seed must be a uint32');
if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || height < 320) throw new Error('viewport dimensions must be integers of at least 320 pixels');
if (!['default', 'raytrace'].includes(values.renderer)) throw new Error('renderer must be default or raytrace');
if (values['linear-hdr'] && (values.renderer !== 'raytrace' || values.view !== 'color')) {
  throw new Error('Linear HDR capture requires the raytrace color view');
}
const url = new URL(values.url);
if (values['linear-hdr']) {
  url.searchParams.set('captureRadiance', '1');
  url.searchParams.set('captureWidth', String(width));
  url.searchParams.set('captureHeight', String(height));
}
url.searchParams.set('preset', values['antique-camera'] ? 'antique-camera' : values['small-emitter'] ? 'small-emitter' : values.lighting ? 'chart-lighting' : values.shapes ? 'chart-shapes' : values.materials ? 'chart-materials' : values.diffuse ? 'chart-diffuse' : values.motion ? 'chart-motion' : 'chart');
url.searchParams.set('renderer', values.renderer);
url.searchParams.set('quality', 'still');
url.searchParams.set('seed', String(seed));
url.searchParams.set('denoise', String(denoise));
url.searchParams.set('history', String(history));
url.searchParams.set('view', values.view);
if (values.transport !== undefined) url.searchParams.set('transport', values.transport);
if (values.emitters !== undefined) url.searchParams.set('emitters', values.emitters);
if (values['emitter-selection'] !== undefined) url.searchParams.set('emitterSelection', values['emitter-selection']);
if (values.resolution !== undefined) url.searchParams.set('resolution', values.resolution);
if (values.bounces !== undefined) url.searchParams.set('bounces', values.bounces);
url.searchParams.set('editor', 'hidden');
// Decode before any output is written, including when output aliases the reference.
const referenceBytes = values.reference ? await readFile(resolve(values.reference)) : undefined;
const referenceImage = referenceBytes
  ? (values['linear-hdr'] ? decodeRadianceCapture(referenceBytes) : PNG.sync.read(referenceBytes))
  : undefined;
const browser = await chromium.launch(getPlaywrightLaunchOptions({backend: 'webgpu', softwareGpu: values['software-gpu']}));
const measurements = [];
const root = resolve(values.output);
try {
  for (const frames of frameCounts) {
    url.searchParams.set('captureFrames', String(frames));
    const output = values['frame-sweep'] ? resolve(root, String(frames)) : root;
    measurements.push(await captureFrameCount(browser, output, frames));
  }
  if (values['frame-sweep']) {
    await writeFile(resolve(root, 'convergence.json'), JSON.stringify(measurements, null, 2));
  }
} finally {
  await browser.close();
}

async function captureFrameCount(browser, output, frames) {
  const page = await browser.newPage({viewport: {width, height}, deviceScaleFactor: 1});
  try {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const started = performance.now();
    await page.goto(url.href);
    await page.waitForFunction(expected => Number(document.querySelector('#playground-canvas')?.dataset.renderedFrames) === expected, frames, {timeout: 120000});
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const timeToCaptureMilliseconds = performance.now() - started;
    const metadata = await page.evaluate(() => {
      const canvas = document.querySelector('#playground-canvas');
      return {accumulatedSamples: canvas.dataset.accumulatedSamples === undefined ? null : Number(canvas.dataset.accumulatedSamples), rayTracingCapabilities: JSON.parse(canvas.dataset.rayTracingCapabilities ?? 'null'), drawingBuffer: [canvas.width, canvas.height], renderedFrames: Number(canvas.dataset.renderedFrames),
        backend: document.querySelector('#backend-label').textContent,
        scene: JSON.parse(document.querySelector('#scene-editor').value),
        rayResolution: document.querySelector('#scene-ray-tracing-resolution').textContent,
        rayFrame: document.querySelector('#scene-ray-tracing-frame').textContent,
        ownedMemory: document.querySelector('#scene-ray-memory').textContent,
        sceneError: document.querySelector('#scene-error').textContent};
    });
    await page.addStyleTag({content: '.preview-heading, .preview-statistics, .preview-hint {visibility: hidden !important}'});
    await mkdir(output, {recursive: true});
    const canvas = page.locator('#playground-canvas');
    const clip = await canvas.boundingBox();
    if (!clip) throw new Error('The capture canvas is hidden');
    const capture = await page.screenshot({clip, path: `${output}/chart.png`, timeout: 60000});
    let comparison;
    let radianceSize;
    if (values['linear-hdr']) {
      const radiance = await canvas.evaluate(element => element.readCaptureRadiance());
      if (!radiance) throw new Error('No ray-tracing history was available for linear HDR capture');
      const header = Buffer.alloc(8);
      header.writeUInt32LE(radiance.width, 0);
      header.writeUInt32LE(radiance.height, 4);
      const bytes = Buffer.concat([header, Buffer.from(radiance.base64, 'base64')]);
      const linearImage = decodeRadianceCapture(bytes);
      radianceSize = [linearImage.width, linearImage.height];
      await writeFile(`${output}/radiance.rgba16f`, bytes);
      if (referenceImage) comparison = {reference: resolve(values.reference), ...compareRadianceCaptures(linearImage, referenceImage)};
    } else if (referenceImage) {
      comparison = {reference: resolve(values.reference), ...compareChartImages(PNG.sync.read(capture), referenceImage)};
    }
    if (errors.length || metadata.sceneError) throw new Error(JSON.stringify({errors, sceneError: metadata.sceneError}));
    await writeFile(`${output}/metadata.json`, JSON.stringify({...metadata, comparison, seed, frames, viewport: [width, height],
      comparisonSpace: values['linear-hdr'] ? 'linear-hdr' : 'display-rgb', radianceSize,
      hardware: values.hardware, browser: browser.version(), timeToCaptureMilliseconds, elapsedMilliseconds: performance.now() - started,
      note: 'Elapsed time includes startup and output readback; telemetry is CPU frame timing, not GPU timestamps. Owned memory is a logical allocation estimate, not measured VRAM; hardware convergence benchmarks remain separate.'}, null, 2));
    console.log(output);
    if (comparison && maximumRootMeanSquaredError !== undefined && comparison.rootMeanSquaredError > maximumRootMeanSquaredError) throw new Error(`RMSE ${comparison.rootMeanSquaredError} exceeds ${maximumRootMeanSquaredError}`);
    return {frames, accumulatedSamples: metadata.accumulatedSamples, browser: browser.version(),
      hardware: values.hardware, timeToCaptureMilliseconds, radianceSize, comparison};
  } finally {
    await page.close();
  }
}
