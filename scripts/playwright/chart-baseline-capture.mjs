// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {compareMotionGpuCosts, compareEmitterGpuCosts, compareChartImages, compareRadianceCaptures, decodeRadianceCapture, compareReconstructionGpuCosts, summarizeFrameGpuTimes, summarizeHistoryConfidence} from './chart-image-metrics.mjs';
import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';

const {values} = parseArgs({options: {
  url: {type: 'string', default: 'http://127.0.0.1:5180/playground.html'},
  output: {type: 'string', default: '/tmp/luma-chart-capture'},
  renderer: {type: 'string', default: 'raytrace'},
  reference: {type: 'string'},
  'linear-hdr': {type: 'boolean'},
  'gpu-timing': {type: 'boolean'},
  'sample-traversal': {type: 'boolean'},
  'batch-phases': {type: 'string'},
  'compare-emitters': {type: 'boolean'},
  'compare-reconstruction': {type: 'boolean'},
  'compare-motion': {type: 'boolean'},
  'separate-lobe-histories': {type: 'boolean'},
  'maximum-glossy-rmse-ratio': {type: 'string'},
  'pose-frame': {type: 'string', default: '16'},
  'reference-frames': {type: 'string', default: '64'},
  temporal: {type: 'string'},
  'maximum-rmse': {type: 'string'},
  view: {type: 'string', default: 'color'},
  'variance-guidance': {type: 'boolean'},
  'frame-sweep': {type: 'string'},
  'small-emitter': {type: 'boolean'},
  'mixed-emitters': {type: 'boolean'},
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
if (!['color', 'normal', 'cameraDistance', 'identity', 'history', 'variance'].includes(values.view)) throw new Error('Unknown ray debug view');
if (values.renderer !== 'raytrace' && (values.view !== 'color' || values['variance-guidance'])) throw new Error('Debug views require raytrace');
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
/** Whether to generate pose-matched HDR references and measure temporal reconstruction. */
const compareMotion = values['compare-motion'];
/** Optional recovery gate for the final glossy checkpoint. */
const maximumGlossyRatio = values['maximum-glossy-rmse-ratio'] === undefined
  ? undefined
  : Number(values['maximum-glossy-rmse-ratio']);
if (maximumGlossyRatio !== undefined &&
  (!compareMotion || !Number.isFinite(maximumGlossyRatio) || maximumGlossyRatio <= 0)) {
  throw new Error('maximum-glossy-rmse-ratio requires the motion benchmark and a positive ratio');
}
const frameCounts = (values['frame-sweep'] ?? (compareMotion ? '1,4,8,16' : values.frames)).split(',').map(Number);
if (frameCounts.some((frames, index) => !Number.isInteger(frames) || frames < 1 || frames > 256 ||
  (index > 0 && frames <= frameCounts[index - 1]))) {
  throw new Error('Frame counts must be strictly increasing integers between 1 and 256');
}
if (values['frame-sweep'] && !values.reference && !compareMotion) throw new Error('frame-sweep requires a reference image');
const seed = Number(values.seed);
const width = Number(values.width);
const height = Number(values.height);
if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('seed must be a uint32');
if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || height < 320) throw new Error('viewport dimensions must be integers of at least 320 pixels');
if (!['default', 'raytrace'].includes(values.renderer)) throw new Error('renderer must be default or raytrace');
if (values['linear-hdr'] && (values.renderer !== 'raytrace' || values.view !== 'color')) {
  throw new Error('Linear HDR capture requires the raytrace color view');
}
const batchPhases = values['batch-phases'] === undefined ? undefined : Number(values['batch-phases']);
if (batchPhases !== undefined && (
  ![1, 2, 4, 8].includes(batchPhases) || values.renderer !== 'raytrace' ||
  compareMotion || values.motion ||
  frameCounts.some(frames => (frames - 1) % batchPhases !== 0)
)) {
  throw new Error('Batch comparison requires a static raytrace preset and a full initial frame followed by complete sweeps');
}
const compareEmitters = values['compare-emitters'];
const compareReconstruction = values['compare-reconstruction'];
const gpuTiming = compareMotion || compareEmitters || compareReconstruction || values['gpu-timing'];
if (values['sample-traversal'] && (gpuTiming || values.renderer !== 'raytrace')) {
  throw new Error('Traversal sampling requires raytrace and a separate capture from GPU timing');
}
if (gpuTiming && values.renderer !== 'raytrace') throw new Error('GPU timing requires raytrace');
if (compareEmitters && (!values['linear-hdr'] || !values['frame-sweep'] ||
  values['emitter-selection'] !== undefined || values.emitters === 'off' || values.motion)) {
  throw new Error('Emitter comparison requires a static linear HDR frame sweep with both selection modes');
}
if (compareReconstruction && (compareEmitters || values['linear-hdr'] || !values['frame-sweep'] ||
  frameCounts.length < 2 || values.view !== 'color' || values.motion || !denoise || values['variance-guidance'])) {
  throw new Error('Reconstruction comparison requires a static display-RGB reference, two or more checkpoints, and a nonzero denoise radius');
}
if (values.temporal !== undefined && (values.renderer !== 'raytrace' || !['on', 'off'].includes(values.temporal))) {
  throw new Error('Temporal override requires raytrace and must be on or off');
}
/** Target pose index on the capture timeline. */
const poseFrame = Number(values['pose-frame']);
/** Independent stationary reference frame count at four samples per frame. */
const referenceFrames = Number(values['reference-frames']);
if (compareMotion && (
  compareEmitters || compareReconstruction || values.reference || values.view !== 'color' ||
  values.temporal !== undefined || denoise !== 0 || values['variance-guidance'] ||
  ['motion', 'diffuse', 'materials', 'shapes', 'lighting', 'small-emitter', 'mixed-emitters',
    'antique-camera', 'transport', 'bounces', 'emitters', 'emitter-selection', 'resolution']
    .some(option => values[option]) ||
  !Number.isInteger(poseFrame) || poseFrame < 1 || poseFrame + frameCounts.at(-1) > 256 ||
  !Number.isInteger(referenceFrames) || referenceFrames <= frameCounts.at(-1) || referenceFrames > 64
)) throw new Error('Motion comparison requires the built-in scenes, unfiltered color, a positive pose frame, and a longer reference of at most 64 frames');
/** The motion benchmark always compares pre-presentation linear radiance. */
const linearHdr = compareMotion || values['linear-hdr'];
const url = new URL(values.url);
if (gpuTiming) url.searchParams.set('captureGpuTiming', '1');
if (batchPhases !== undefined) url.searchParams.set('batchPhases', String(batchPhases));
if (values['sample-traversal']) url.searchParams.set('sampleTraversal', '1');
if (linearHdr) {
  url.searchParams.set('captureRadiance', '1');
  url.searchParams.set('captureWidth', String(width));
  url.searchParams.set('captureHeight', String(height));
}
url.searchParams.set('preset', values['antique-camera'] ? 'antique-camera' : values['mixed-emitters'] ? 'mixed-emitters' : values['small-emitter'] ? 'small-emitter' : values.lighting ? 'chart-lighting' : values.shapes ? 'chart-shapes' : values.materials ? 'chart-materials' : values.diffuse ? 'chart-diffuse' : values.motion ? 'chart-motion' : 'chart');
url.searchParams.set('renderer', values.renderer);
url.searchParams.set('quality', 'still');
url.searchParams.set('seed', String(seed));
url.searchParams.set('denoise', String(denoise));
url.searchParams.set('history', String(history));
url.searchParams.set('view', values.view);
if (values.temporal !== undefined) url.searchParams.set('temporal', values.temporal);
if (values['variance-guidance']) url.searchParams.set('varianceGuidance', '1');
if (values['separate-lobe-histories']) url.searchParams.set('separateLobeHistories', '1');
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
const root = resolve(values.output);
try {
  if (compareMotion) {
    await captureMotionBenchmark();
  } else if (compareEmitters) {
    url.searchParams.set('emitters', 'on');
    const measurementsBySelection = {};
    for (const selection of ['uniform', 'power']) {
      url.searchParams.set('emitterSelection', selection);
      measurementsBySelection[selection] = await captureSweep(resolve(root, selection));
    }
    const comparison = compareEmitterGpuCosts(measurementsBySelection.uniform, measurementsBySelection.power);
    await writeFile(resolve(root, 'emitter-comparison.json'), JSON.stringify(comparison, null, 2));
  } else if (compareReconstruction) {
    const measurements = {};
    for (const [mode, radius, varianceGuidance] of [
      ['unfiltered', 0, false], ['spatial', denoise, false], ['variance', denoise, true]
    ]) {
      url.searchParams.set('denoise', String(radius));
      url.searchParams.set('varianceGuidance', varianceGuidance ? '1' : '0');
      measurements[mode] = await captureSweep(resolve(root, mode));
    }
    const {unfiltered, spatial, variance} = measurements;
    await writeFile(resolve(root, 'reconstruction-comparison.json'), JSON.stringify({
      comparisonSpace: 'display-rgb',
      reference: resolve(values.reference),
      seed,
      viewport: [width, height],
      hardware: values.hardware,
      browser: browser.version(),
      measurements,
      matchedGpuCost: compareReconstructionGpuCosts(unfiltered, spatial, variance)
    }, null, 2));
  } else {
    await captureSweep(root);
  }
} finally {
  await browser.close();
}

/** Capture references with a fresh scene and no motion history, then sweep the target pose. */
async function captureMotionBenchmark() {
  /** A disjoint sampling seed prevents the reference from repeating candidate samples. */
  const referenceSeed = (seed ^ 0x80000000) >>> 0;
  url.searchParams.set('capturePoseFrame', String(poseFrame));
  url.searchParams.set('resolution', '1');
  url.searchParams.set('history', '256');
  const scenes = {};
  for (const preset of ['chart-motion', 'chart-glossy-motion']) {
    url.searchParams.set('preset', preset);
    url.searchParams.set('captureReferencePose', '1');
    url.searchParams.set('temporal', 'off');
    url.searchParams.set('seed', String(referenceSeed));
    url.searchParams.set('captureFrames', String(referenceFrames));
    const referenceDirectory = resolve(root, preset, 'reference');
    const reference = await captureFrameCount(browser, referenceDirectory, referenceFrames);
    const referencePath = resolve(referenceDirectory, 'radiance.rgba16f');
    const poseReference = decodeRadianceCapture(await readFile(referencePath));
    url.searchParams.delete('captureReferencePose');
    url.searchParams.set('seed', String(seed));
    const measurements = {};
    for (const mode of ['off', 'on']) {
      url.searchParams.set('temporal', mode);
      measurements[mode] = [];
      for (const framesAtPose of frameCounts) {
        const frames = poseFrame + framesAtPose;
        url.searchParams.set('captureFrames', String(frames));
        measurements[mode].push(await captureFrameCount(
          browser,
          resolve(root, preset, mode, String(framesAtPose)),
          frames,
          {image: poseReference, path: referencePath, pose: reference.pose, motionPrefixFrames: poseFrame}
        ));
      }
    }
    scenes[preset] = {
      reference,
      measurements,
      matchedGpuCost: compareMotionGpuCosts(measurements.off, measurements.on)
    };
  }
  /** Compare temporal modes at equal new sample counts, even when GPU timing is unavailable. */
  const glossyMeasurements = scenes['chart-glossy-motion'].measurements;
  const temporalError = glossyMeasurements.on.at(-1).comparison.rootMeanSquaredError;
  const controlError = glossyMeasurements.off.at(-1).comparison.rootMeanSquaredError;
  const passed = maximumGlossyRatio === undefined
    ? undefined
    : temporalError <= maximumGlossyRatio * controlError;
  await writeFile(resolve(root, 'motion-reconstruction.json'), JSON.stringify({
    comparisonSpace: 'linear-hdr',
    separateLobeHistories: Boolean(values['separate-lobe-histories']),
    poseFrame,
    poseTimeSeconds: poseFrame / 60,
    referenceFrames,
    seed,
    referenceSeed,
    viewport: [width, height],
    hardware: values.hardware,
    browser: browser.version(),
    scenes,
    glossyRecovery: {
      samplesAtPose: glossyMeasurements.on.at(-1).samplesAtPose,
      temporalError,
      controlError,
      maximumRatio: maximumGlossyRatio,
      passed
    }
  }, null, 2));
  if (passed === false) {
    throw new Error(`Glossy HDR RMSE ${temporalError} exceeds ${maximumGlossyRatio} times the control RMSE ${controlError}`);
  }
}

/** Capture each requested checkpoint in its own page. */
async function captureSweep(directory) {
  const measurements = [];
  for (const frames of frameCounts) {
    url.searchParams.set('captureFrames', String(frames));
    const output = values['frame-sweep'] ? resolve(directory, String(frames)) : directory;
    measurements.push(await captureFrameCount(browser, output, frames));
  }
  if (values['frame-sweep']) {
    await writeFile(resolve(directory, 'convergence.json'), JSON.stringify(measurements, null, 2));
  }
  return measurements;
}

/** Capture one exact checkpoint and collect image error and optional GPU timings. */
async function captureFrameCount(browser, output, frames, poseReference) {
  /** Use the seed passed to this page, including independently seeded references. */
  const captureSeed = Number(url.searchParams.get('seed'));
  const comparisonImage = poseReference?.image ?? referenceImage;
  const comparisonPath = poseReference?.path ?? values.reference;
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
        sceneError: document.querySelector('#scene-error').textContent,
        animationTimeSeconds: canvas.dataset.animationTimeSeconds,
        pose: canvas.dataset.capturePose};
    });
    await page.addStyleTag({content: '.preview-heading, .preview-statistics, .preview-hint {visibility: hidden !important}'});
    await mkdir(output, {recursive: true});
    const canvas = page.locator('#playground-canvas');
    const clip = await canvas.boundingBox();
    if (!clip) throw new Error('The capture canvas is hidden');
    const capture = await page.screenshot({clip, path: `${output}/chart.png`, timeout: 60000});
    const frameGpuTimes = gpuTiming ? await canvas.evaluate(element => element.readCaptureGpuTimes()) : undefined;
    const graphTimings = gpuTiming ? await canvas.evaluate(element => element.readCaptureGraphTimings()) : undefined;
    const traversalCounters = values['sample-traversal']
      ? await canvas.evaluate(element => element.readCaptureTraversal())
      : undefined;
    if (values['sample-traversal'] && !traversalCounters) throw new Error('No sampled traversal data was available');
    const frameGpuTiming = summarizeFrameGpuTimes(frameGpuTimes, frames);
    const gpuTimeMilliseconds = frameGpuTiming?.totalMilliseconds ?? null;
    const motionTimeSeconds = compareMotion || values.motion ? Number(metadata.animationTimeSeconds) : undefined;
    if (compareMotion && (motionTimeSeconds !== poseFrame / 60 || !metadata.pose ||
      (poseReference && poseReference.pose !== metadata.pose))) {
      throw new Error('Captured camera or instance transforms do not match the target pose');
    }
    const motionPrefixFrames = poseReference?.motionPrefixFrames ?? 0;
    const framesAtPose = frames - motionPrefixFrames;
    const gpuTimeAtPoseMilliseconds = compareMotion
      ? summarizeFrameGpuTimes(frameGpuTimes?.slice(motionPrefixFrames), framesAtPose)?.totalMilliseconds ?? null
      : undefined;
    const samplesAtPose = compareMotion ? framesAtPose * metadata.scene.renderer.samplesPerPixel : undefined;
    if (compareMotion && !poseReference && metadata.accumulatedSamples !== samplesAtPose) {
      throw new Error('The stationary reference did not accumulate its full sample budget');
    }
    const expectedBatchSamples = batchPhases === undefined ? undefined
      : Math.min(history, (1 + (frames - 1) / batchPhases) * metadata.scene.renderer.samplesPerPixel);
    if (expectedBatchSamples !== undefined && metadata.accumulatedSamples !== expectedBatchSamples) {
      throw new Error(`Expected ${expectedBatchSamples} completed samples, got ${metadata.accumulatedSamples}`);
    }
    let comparison;
    let radianceSize;
    let historyConfidence;
    if (linearHdr) {
      const radiance = await canvas.evaluate(element => element.readCaptureRadiance());
      if (!radiance) throw new Error('No ray-tracing history was available for linear HDR capture');
      const header = Buffer.alloc(8);
      header.writeUInt32LE(radiance.width, 0);
      header.writeUInt32LE(radiance.height, 4);
      const bytes = Buffer.concat([header, Buffer.from(radiance.base64, 'base64')]);
      const linearImage = decodeRadianceCapture(bytes);
      radianceSize = [linearImage.width, linearImage.height];
      historyConfidence = summarizeHistoryConfidence(linearImage);
      await writeFile(`${output}/radiance.rgba16f`, bytes);
      if (comparisonImage) comparison = {reference: resolve(comparisonPath), ...compareRadianceCaptures(linearImage, comparisonImage, {includeErrorTails: compareMotion})};
    } else if (referenceImage) {
      comparison = {reference: resolve(values.reference), ...compareChartImages(PNG.sync.read(capture), referenceImage)};
    }
    if (errors.length || metadata.sceneError) throw new Error(JSON.stringify({errors, sceneError: metadata.sceneError}));
    await writeFile(`${output}/metadata.json`, JSON.stringify({...metadata, comparison, seed: captureSeed, frames, viewport: [width, height],
      gpuTimeMilliseconds, gpuTimeAtPoseMilliseconds, samplesAtPose, frameGpuTimes, frameGpuTiming, graphTimings, traversalCounters, batchPhases, motionTimeSeconds,
      comparisonSpace: linearHdr ? 'linear-hdr' : 'display-rgb', radianceSize, historyConfidence,
      hardware: values.hardware, browser: browser.version(), timeToCaptureMilliseconds, elapsedMilliseconds: performance.now() - started,
      note: 'Elapsed time includes startup and output readback; GPU pass timestamps exclude browser startup, screenshots and readback. Owned memory is a logical allocation estimate, not measured VRAM; hardware convergence benchmarks remain separate.'}, null, 2));
    console.log(output);
    if (comparison && maximumRootMeanSquaredError !== undefined && comparison.rootMeanSquaredError > maximumRootMeanSquaredError) throw new Error(`RMSE ${comparison.rootMeanSquaredError} exceeds ${maximumRootMeanSquaredError}`);
    return {frames, seed: captureSeed, accumulatedSamples: metadata.accumulatedSamples, browser: browser.version(),
      hardware: values.hardware, timeToCaptureMilliseconds, gpuTimeMilliseconds, gpuTimeAtPoseMilliseconds, samplesAtPose, frameGpuTiming,
      motionTimeSeconds, pose: metadata.pose, drawingBuffer: metadata.drawingBuffer, ownedMemory: metadata.ownedMemory,
      radianceSize, historyConfidence, comparison};
  } finally {
    await page.close();
  }
}
