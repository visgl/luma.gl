#!/usr/bin/env node

// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {mkdir, mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {PNG} from 'pngjs';

import {loadOcularConfig} from '../playwright/load-ocular-config.mjs';
import {runWebsiteExample} from '../playwright/run-website-example.mjs';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, '..', '..');
const CAPTURE_MANIFEST_SCHEMA = 'luma.gl/gltf-reference-capture-manifest';
const CAPTURE_MANIFEST_VERSION = 1;
const EVIDENCE_SCHEMA = 'luma.gl/gltf-reference-evidence';
const EVIDENCE_VERSION = 1;
const DEFAULT_ARTIFACT_BASE = '.playwright-artifacts/gltf-reference';
const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';
const DEFAULT_CHANNEL_TOLERANCE = 12;
const DEFAULT_MAXIMUM_DIFFERING_PIXEL_RATIO = 0.05;
const READY_FRAME_COUNT = 5;
const READY_TIMEOUT_MILLISECONDS = 120_000;
const SAMPLE_ASSETS_REVISION = '723ffc6706725b618b8c14ceb82e3e6904b08a76';
const SAMPLE_VIEWER_REVISION = 'f9fce9ee7bc62c5433d2a1bf84be229225c7bd19';
const SAMPLE_VIEWER_RELEASE_REVISION = 'dd024e4726c9e73f3dc87cccb4ab317a5cff7c3d';
const CAPTURE_ROUTE =
  '/examples/showcase/gltf?gltf-reference=1&model=BumpMaterial&variant=glTF&file=BumpMaterial.gltf&yaw=0.35&pitch=-0.15&distance=1';
const BACKENDS = [
  {id: 'webgpu-core', deviceType: 'webgpu'},
  {id: 'webgl2', deviceType: 'webgl'}
];

export const HELP_TEXT = `Capture deterministic glTF evidence for WebGPU and WebGL2.

Usage:
  node scripts/gltf-reference/capture-reference-evidence.mjs [options]

Options:
  --artifact-base <path>                 Parent for a unique retained run directory.
  --base-url <url>                       Website URL to reuse (default: ${DEFAULT_BASE_URL}).
  --channel <name>                       Chromium-family Playwright channel.
  --headless                             Run without a visible browser.
  --software-gpu                         Force SwiftShader flags for reproducible CI rendering.
  --skip-website-build                   Reuse an existing server or already-current production build.
  --max-differing-pixel-ratio <number>   Dual-backend failure budget (default: ${DEFAULT_MAXIMUM_DIFFERING_PIXEL_RATIO}).
  --help                                 Show this help message.

The runner captures only the luma.gl canvas at 1280x720. It stores per-backend evidence and
diagnostics, a highlighted pixel diff, and a versioned manifest. The Khronos Sample Viewer source
and deployment revisions are pinned in that manifest; its external reference frame remains a
separate approval-controlled capture.
`;

/** Capture both graphics backends and enforce the configured pixel-difference budget. */
export async function captureGLTFReferenceEvidence(options = {}, dependencies = {}) {
  const repositoryRoot = path.resolve(options.repositoryRoot ?? REPOSITORY_ROOT);
  const logger = dependencies.logger ?? console;
  const captureWebsiteExample = dependencies.runWebsiteExample ?? runWebsiteExample;
  const loadConfiguration = dependencies.loadOcularConfig ?? loadOcularConfig;
  const artifactBase = path.resolve(
    repositoryRoot,
    options.artifactBase ?? DEFAULT_ARTIFACT_BASE
  );
  await mkdir(artifactBase, {recursive: true});
  const runDirectory = await mkdtemp(path.join(artifactBase, 'run-'));
  await writeJson(path.join(runDirectory, 'run-metadata.json'), {
    schema: CAPTURE_MANIFEST_SCHEMA,
    version: CAPTURE_MANIFEST_VERSION,
    createdAt: new Date().toISOString(),
    repositoryCommit: process.env.GITHUB_SHA || null
  });
  const ocularConfig = options.ocularConfig ?? (await loadConfiguration({cwd: repositoryRoot}));
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  if (!(await isServerReady(baseUrl)) && options.buildWebsite !== false) {
    await buildProductionWebsite(repositoryRoot, logger);
  }
  const captures = [];

  for (const [backendIndex, backend] of BACKENDS.entries()) {
    logger.log(`[gltf-reference] Capturing ${backendIndex + 1}/${BACKENDS.length}: ${backend.id}`);
    const artifactDirectory = path.join(runDirectory, backend.id);
    const captureResult = await captureWebsiteExample({
      artifactDir: artifactDirectory,
      backend: backend.id,
      baseUrl,
      channel: options.channel,
      collectPageData: collectReferenceEvidence,
      cwd: repositoryRoot,
      example: CAPTURE_ROUTE,
      headless: Boolean(options.headless),
      keepOpen: false,
      logger,
      ocularConfig,
      preparePage: waitForReferenceEvidence,
      screenshotSelector: 'canvas',
      softwareGpu: Boolean(options.softwareGpu),
      viewportHeight: 720,
      viewportWidth: 1280,
      websiteServerMode: 'static'
    });
    assertCleanCaptureDiagnostics(captureResult.diagnostics, backend.id);
    assertReferenceEvidence(captureResult.pageData, backend);

    const evidencePath = path.join(artifactDirectory, 'gltf-reference-evidence.json');
    await writeJson(evidencePath, captureResult.pageData);
    captures.push({
      backend: backend.id,
      deviceType: captureResult.pageData.renderer.backend,
      evidence: captureResult.pageData,
      evidencePath: path.relative(runDirectory, evidencePath),
      screenshotPath: path.relative(runDirectory, captureResult.screenshotPath)
    });
  }

  const webgpuScreenshot = await readFile(path.join(runDirectory, captures[0].screenshotPath));
  const webglScreenshot = await readFile(path.join(runDirectory, captures[1].screenshotPath));
  const comparison = comparePNGScreenshots(webgpuScreenshot, webglScreenshot, {
    channelTolerance: options.channelTolerance ?? DEFAULT_CHANNEL_TOLERANCE,
    maximumDifferingPixelRatio:
      options.maximumDifferingPixelRatio ?? DEFAULT_MAXIMUM_DIFFERING_PIXEL_RATIO
  });
  const differencePath = path.join(runDirectory, 'webgpu-webgl2-difference.png');
  await writeFile(differencePath, comparison.differencePNG);

  const manifest = {
    schema: CAPTURE_MANIFEST_SCHEMA,
    version: CAPTURE_MANIFEST_VERSION,
    createdAt: new Date().toISOString(),
    repositoryCommit: process.env.GITHUB_SHA || null,
    capture: {
      route: CAPTURE_ROUTE,
      width: comparison.width,
      height: comparison.height,
      model: 'BumpMaterial',
      sampleAssetsRevision: SAMPLE_ASSETS_REVISION,
      camera: {yaw: 0.35, pitch: -0.15, distanceMultiplier: 1},
      rendering: {
        animation: 'disabled',
        automaticLevelOfDetail: 'disabled',
        environment: 'fixed-fallback-lights',
        exposure: 1,
        toneMapping: 'none',
        outputColorSpace: 'srgb'
      }
    },
    captures: captures.map(capture => ({
      backend: capture.backend,
      deviceType: capture.deviceType,
      evidencePath: capture.evidencePath,
      screenshotPath: capture.screenshotPath
    })),
    dualBackendComparison: {
      channelTolerance: comparison.channelTolerance,
      maximumDifferingPixelRatio: comparison.maximumDifferingPixelRatio,
      differingPixelCount: comparison.differingPixelCount,
      differingPixelRatio: comparison.differingPixelRatio,
      meanAbsoluteChannelDifference: comparison.meanAbsoluteChannelDifference,
      maximumAbsoluteChannelDifference: comparison.maximumAbsoluteChannelDifference,
      differencePath: path.relative(runDirectory, differencePath),
      passed: comparison.passed
    },
    referenceRenderer: {
      name: 'Khronos glTF Sample Viewer',
      sourceRevision: SAMPLE_VIEWER_REVISION,
      sourceUrl: `https://github.com/KhronosGroup/glTF-Sample-Viewer/tree/${SAMPLE_VIEWER_REVISION}`,
      releaseRevision: SAMPLE_VIEWER_RELEASE_REVISION,
      releaseSourceUrl: `https://github.com/KhronosGroup/glTF-Sample-Viewer-Release/tree/${SAMPLE_VIEWER_RELEASE_REVISION}`,
      comparisonStatus: 'source-pinned-reference-frame-not-captured'
    }
  };
  const manifestPath = path.join(runDirectory, 'manifest.json');
  await writeJson(manifestPath, manifest);

  if (!comparison.passed) {
    throw new Error(
      `WebGPU/WebGL2 differing-pixel ratio ${comparison.differingPixelRatio.toFixed(6)} exceeds ` +
        `${comparison.maximumDifferingPixelRatio}; retained evidence: ${runDirectory}`
    );
  }

  logger.log(`[gltf-reference] Evidence retained in ${runDirectory}`);
  return {captures, comparison, manifest, manifestPath, runDirectory};
}

/** Compare two same-sized RGBA PNG captures and create a highlighted difference image. */
export function comparePNGScreenshots(leftBuffer, rightBuffer, options = {}) {
  const leftImage = PNG.sync.read(leftBuffer);
  const rightImage = PNG.sync.read(rightBuffer);
  if (leftImage.width !== rightImage.width || leftImage.height !== rightImage.height) {
    throw new Error(
      `Screenshot dimensions differ: ${leftImage.width}x${leftImage.height} versus ` +
        `${rightImage.width}x${rightImage.height}`
    );
  }

  const channelTolerance = options.channelTolerance ?? DEFAULT_CHANNEL_TOLERANCE;
  const maximumDifferingPixelRatio =
    options.maximumDifferingPixelRatio ?? DEFAULT_MAXIMUM_DIFFERING_PIXEL_RATIO;
  const differenceImage = new PNG({width: leftImage.width, height: leftImage.height});
  let differingPixelCount = 0;
  let absoluteChannelDifference = 0;
  let maximumAbsoluteChannelDifference = 0;

  for (let offset = 0; offset < leftImage.data.length; offset += 4) {
    let pixelDiffers = false;
    for (let channel = 0; channel < 4; channel++) {
      const difference = Math.abs(leftImage.data[offset + channel] - rightImage.data[offset + channel]);
      absoluteChannelDifference += difference;
      maximumAbsoluteChannelDifference = Math.max(maximumAbsoluteChannelDifference, difference);
      pixelDiffers ||= difference > channelTolerance;
    }

    if (pixelDiffers) {
      differingPixelCount++;
      differenceImage.data.set([255, 0, 255, 255], offset);
    } else {
      const luminance = Math.round(
        (leftImage.data[offset] + leftImage.data[offset + 1] + leftImage.data[offset + 2]) / 6
      );
      differenceImage.data.set([luminance, luminance, luminance, 255], offset);
    }
  }

  const pixelCount = leftImage.width * leftImage.height;
  const differingPixelRatio = differingPixelCount / pixelCount;
  return {
    width: leftImage.width,
    height: leftImage.height,
    channelTolerance,
    maximumDifferingPixelRatio,
    differingPixelCount,
    differingPixelRatio,
    meanAbsoluteChannelDifference: absoluteChannelDifference / (pixelCount * 4),
    maximumAbsoluteChannelDifference,
    passed: differingPixelRatio <= maximumDifferingPixelRatio,
    differencePNG: PNG.sync.write(differenceImage)
  };
}

export function parseCLIArguments(argv) {
  const options = {
    artifactBase: undefined,
    baseUrl: DEFAULT_BASE_URL,
    buildWebsite: true,
    channel: undefined,
    headless: false,
    help: false,
    maximumDifferingPixelRatio: DEFAULT_MAXIMUM_DIFFERING_PIXEL_RATIO,
    softwareGpu: false
  };

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (argument === '--headless') {
      options.headless = true;
    } else if (argument === '--software-gpu') {
      options.softwareGpu = true;
    } else if (argument === '--skip-website-build') {
      options.buildWebsite = false;
    } else if (argument === '--artifact-base') {
      options.artifactBase = requireArgumentValue(argv, ++index, argument);
    } else if (argument === '--base-url') {
      options.baseUrl = requireArgumentValue(argv, ++index, argument);
    } else if (argument === '--channel') {
      options.channel = requireArgumentValue(argv, ++index, argument);
    } else if (argument === '--max-differing-pixel-ratio') {
      options.maximumDifferingPixelRatio = Number(requireArgumentValue(argv, ++index, argument));
      if (
        !Number.isFinite(options.maximumDifferingPixelRatio) ||
        options.maximumDifferingPixelRatio < 0 ||
        options.maximumDifferingPixelRatio > 1
      ) {
        throw new Error(`${argument} must be a finite number between 0 and 1.`);
      }
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

async function waitForReferenceEvidence(page) {
  await page.waitForFunction(
    frameCount =>
      globalThis.__lumaGLTFReferenceError ||
      globalThis.__lumaGLTFReferenceEvidence?.metrics?.frameCount >= frameCount,
    READY_FRAME_COUNT,
    {timeout: READY_TIMEOUT_MILLISECONDS}
  );
  const captureError = await page.evaluate(() => globalThis.__lumaGLTFReferenceError || null);
  if (captureError) {
    throw new Error(`glTF reference page failed: ${captureError}`);
  }
  await page.evaluate(async () => {
    const canvas = document.querySelector('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('glTF reference canvas was not found.');
    }
    for (const element of document.body.querySelectorAll('*')) {
      if (element !== canvas && !element.contains(canvas) && 'style' in element) {
        element.style.setProperty('visibility', 'hidden', 'important');
      }
    }
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function collectReferenceEvidence(page) {
  return await page.evaluate(() => structuredClone(globalThis.__lumaGLTFReferenceEvidence));
}

async function buildProductionWebsite(repositoryRoot, logger) {
  logger.log('[gltf-reference] Building workspace packages required by the production website');
  await runYarnCommand(repositoryRoot, ['build']);
  logger.log('[gltf-reference] Building the production website once for lightweight static capture');
  await runYarnCommand(repositoryRoot, ['website:build']);
}

async function runYarnCommand(repositoryRoot, arguments_) {
  await new Promise((resolve, reject) => {
    const child = spawn('yarn', arguments_, {
      cwd: repositoryRoot,
      env: {...process.env, CI: '1'},
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    child.once('error', reject);
    child.once('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yarn ${arguments_.join(' ')} exited with code ${code}.`));
      }
    });
  });
}

async function isServerReady(url) {
  try {
    const response = await fetch(url, {signal: AbortSignal.timeout(2000)});
    return response.ok;
  } catch {
    return false;
  }
}

function assertReferenceEvidence(evidence, backend) {
  if (!evidence || evidence.schema !== EVIDENCE_SCHEMA || evidence.version !== EVIDENCE_VERSION) {
    throw new Error(`${backend.id} did not publish versioned glTF reference evidence.`);
  }
  if (evidence.renderer?.backend !== backend.deviceType) {
    throw new Error(
      `${backend.id} published device type ${evidence.renderer?.backend}; expected ${backend.deviceType}.`
    );
  }
  if (evidence.metrics?.frameCount < READY_FRAME_COUNT) {
    throw new Error(`${backend.id} captured before ${READY_FRAME_COUNT} completed frames.`);
  }
  if (
    evidence.metrics.drawCount !== 1 ||
    evidence.metrics.submittedIndexReferences !== 3 ||
    evidence.metrics.triangleCount !== 1
  ) {
    throw new Error(`${backend.id} did not render the complete indexed BumpMaterial fixture.`);
  }
}

export function assertCleanCaptureDiagnostics(diagnostics, backend) {
  const browserErrors =
    diagnostics?.consoleMessages?.filter(
      message => message.type === 'error' && !isKnownDocusaurusHydrationDiagnostic(message.text)
    ) ?? [];
  const pageErrors = diagnostics?.pageErrors ?? [];
  const requestFailures = diagnostics?.requestFailures ?? [];
  const failureCount = browserErrors.length + pageErrors.length + requestFailures.length;
  if (failureCount > 0) {
    throw new Error(`${backend} emitted ${failureCount} browser diagnostic error(s).`);
  }
}

/**
 * The production showcase emits these recoverable shell-hydration diagnostics without the
 * reference query too. Keep them in page-diagnostics.json, but do not misclassify them as glTF
 * renderer failures. Any other console error still fails the capture.
 */
export function isKnownDocusaurusHydrationDiagnostic(message) {
  return /^Docusaurus React Root onRecoverableError: Error: Minified React error #(418|423|425);/.test(
    message
  );
}

function requireArgumentValue(argv, index, argument) {
  const value = argv[index];
  if (!value || value.startsWith('--')) {
    throw new Error(`${argument} requires a value.`);
  }
  return value;
}

async function writeJson(filename, value) {
  await writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseCLIArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(HELP_TEXT);
  } else {
    captureGLTFReferenceEvidence(options).catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
