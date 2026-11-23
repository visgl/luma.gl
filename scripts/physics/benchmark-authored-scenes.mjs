// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../playwright/get-playwright-launch-options.mjs';

/** Parse the local fixture and frame sample options. */
const {values} = parseArgs({
  options: {
    url: {type: 'string', default: 'http://127.0.0.1:5241/'},
    fixture: {type: 'string', default: 'AuthoredGrid'},
    samples: {type: 'string', default: '60'},
    warmup: {type: 'string', default: '30'},
    'software-gpu': {type: 'boolean', default: false}
  }
});

/** Address of the real example served by the local Vite process. */
const url = new URL(values.url);
/** Number of timed frame intervals. */
const samples = Number(values.samples);
/** Discard initial frames so compilation and upload are outside the frame sample. */
const warmup = Number(values.warmup);
/** Published example selected through its ordinary gallery control. */
const fixture = values.fixture;
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  !['AuthoredGrid', 'AnimatedScale'].includes(fixture) ||
  !Number.isSafeInteger(samples) || samples < 30 || samples > 1000 ||
  !Number.isSafeInteger(warmup) || warmup < 10 || warmup > 1000
) throw new Error('Invalid local authored-scene benchmark options');

url.searchParams.set('qualify', '1');
/** Launch Chromium with the selected WebGPU adapter policy. */
const browser = await chromium.launch(getPlaywrightLaunchOptions({
  headless: true, backend: 'webgpu-core', softwareGpu: values['software-gpu']
}));

/** Record wall-clock frame intervals of the live example with its canvas rendering enabled. */
async function sampleFrames(page, count) {
  return await page.evaluate(async count => {
    /** Read the example counters without synchronizing GPU resources. */
    const read = () => {
      /** Status element provides the opt-in qualification attributes. */
      const status = document.querySelector('[data-status]');
      return {
        rendered: Number(status.dataset.frames),
        steps: Number(status.dataset.steps),
        bodies: Number(status.dataset.bodies),
        published: Number(status.dataset.published),
        revision: Number(status.dataset.revision),
        adapter: JSON.parse(status.dataset.adapter)
      };
    };
    /** Snapshot counters before measuring frame progress. */
    const before = read();
    /** Retain each animation frame interval for percentile calculation. */
    const intervals = [];
    /** Timestamp of the previous animation frame callback. */
    let last = await new Promise(resolve => requestAnimationFrame(resolve));
    for (let index = 0; index < count; index++) {
      /** Timestamp of the next animation frame callback. */
      const now = await new Promise(resolve => requestAnimationFrame(resolve));
      intervals.push(now - last);
      last = now;
    }
    /** Compare end counters with the initial snapshot. */
    const after = read();
    return {
      ...after,
      rendered: after.rendered - before.rendered,
      steps: after.steps - before.steps,
      intervals
    };
  }, count);
}

/** Activate the real example controls and wait for the revision-changing operation to settle. */
async function runAction(page, action) {
  /** Clear and observe the action markers on the shared status element. */
  const status = page.locator('[data-status]');
  await status.evaluate(element => {
    delete element.dataset.action;
    delete element.dataset.actionError;
  });
  await page.locator(`button[data-action="${action}"]`).evaluate(button => button.click());
  await page.waitForFunction(
    action => {
      /** Either completion or an action error ends the wait. */
      const result = document.querySelector('[data-status]')?.dataset;
      return result?.action === action || Boolean(result?.actionError);
    },
    action,
    {timeout: 60000}
  );
  /** Surface application errors instead of a generic action timeout. */
  const error = await status.getAttribute('data-action-error');
  if (error) throw new Error(`${action}: ${error}`);
}

try {
  /** Keep render resolution comparable across runs. */
  const viewport = {width: 960, height: 640};
  /** A scale of one makes the canvas size independent of host pixel density. */
  const page = await browser.newPage({viewport, deviceScaleFactor: 1});
  /** Accumulate page, GPU, and shader failures throughout the run. */
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /WebGPU|physics|shader/i.test(message.text()))
      runtimeErrors.push(message.text());
  });
  await page.goto(url.href);
  await page.waitForFunction(() => Number(document.querySelector('[data-status]')?.dataset.published) > 0, null, {timeout: 90000});
  if (fixture !== 'AuthoredGrid') {
    // The panel may be collapsed. Use the same input event registered by the interactive gallery.
    await page.locator('#physics-sample').evaluate((select, name) => {
      select.value = name;
      select.dispatchEvent(new Event('change', {bubbles: true}));
    }, fixture);
    await page.waitForFunction(
      name => document.querySelector('[data-status]')?.dataset.sample === name,
      fixture,
      {timeout: 90000}
    );
  }
  await sampleFrames(page, warmup);
  /** The WebGPU scene canvas provides evidence of actual presentation. */
  const canvas = page.locator('canvas').first();
  /** Capture initial pixels outside the timed sample. */
  const before = await canvas.screenshot({timeout: 60000});
  /** Measure frames while the physics and rendering paths run together. */
  const measured = await sampleFrames(page, samples);
  /** Capture final pixels to verify the presentation changed. */
  const after = await canvas.screenshot({timeout: 60000});

  // Lifecycle checks and explicit export are outside the timed frame sample.
  await runAction(page, 'capture');
  await runAction(page, 'recook');
  await runAction(page, 'restore');
  /** Verify rendering resumes with a published pose after restore. */
  const settled = await sampleFrames(page, 12);
  /** Start observing downloads before activating the export control. */
  const [download] = await Promise.all([
    page.waitForEvent('download', {timeout: 60000}), runAction(page, 'export')
  ]);
  /** Verify the actual downloaded native glTF JSON. */
  const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
  /** Verify the export retains native shape declarations and body motion. */
  const roundTripInput = Boolean(exported.extensions?.KHR_implicit_shapes?.shapes?.length) &&
    exported.nodes?.some(node => node.extensions?.KHR_physics_rigid_bodies?.motion);
  /** Sort only the measured intervals. */
  const sorted = [...measured.intervals].sort((first, second) => first - second);
  /** Use the nearest rank for the report percentiles. */
  const percentile = fraction => sorted[Math.ceil(fraction * sorted.length) - 1];
  /** Require simulation progress, presentation, and a successful editing sequence. */
  const correct =
    measured.published > 0 && measured.rendered > 0 && measured.steps > 0 &&
    !before.equals(after) && settled.published === measured.published &&
    settled.revision >= measured.revision + 2 && settled.rendered > 0 &&
    roundTripInput && runtimeErrors.length === 0;
  /** Maximum permitted p95 frame interval in the qualification profile. */
  const budgetMilliseconds = 50;
  /** Machine-readable evidence consumed by the G7 qualification selector. */
  const result = {
    stage: 'authored-render',
    fixture,
    objectCount: measured.bodies,
    adapter: measured.adapter,
    browserVersion: browser.version(),
    softwareGpuRequested: values['software-gpu'],
    viewport,
    samples,
    warmup,
    renderedFrames: measured.rendered,
    acceptedSteps: measured.steps,
    gpuPublishedModels: measured.published,
    frameMilliseconds: {p50: percentile(0.5), p95: percentile(0.95)},
    budgetMilliseconds,
    revisionsAfterEdits: settled.revision - measured.revision,
    nativeExport: roundTripInput,
    presentedPixelsChanged: !before.equals(after),
    runtimeErrors,
    correct,
    qualified: correct && percentile(0.95) <= budgetMilliseconds
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.qualified) process.exitCode = 1;
} finally {
  await browser.close();
}
