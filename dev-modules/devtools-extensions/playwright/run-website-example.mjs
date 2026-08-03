import {mkdir, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import {setTimeout as delay} from 'node:timers/promises';

import {attachDebugBrowser, launchDebugBrowser} from './browser-debug.mjs';
import {captureHDRScreenshotArtifacts} from './capture-hdr-screenshot.mjs';
import {collectPageDiagnostics, probeWebGPU} from './collect-page-diagnostics.mjs';
import {findTargetPage} from './find-target-page.mjs';
import {resolveExampleUrl} from './resolve-example-url.mjs';
import {
  normalizeBackend,
  selectDeviceBackend,
  selectPreferredDeviceBackend
} from './select-device-backend.mjs';

const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';
const DEFAULT_ARTIFACT_DIR = '.playwright-artifacts';
const DEFAULT_SCREENSHOT_NAME = 'website-playwright.png';
const DEFAULT_WATCH_INTERVAL_MS = 1000;
const START_TIMEOUT_MS = 120_000;
const SCREENSHOT_TIMEOUT_MS = 120_000;

function getWebsiteDir(cwd) {
  return path.resolve(cwd, 'website');
}

function getArtifactDir(cwd, artifactDir = DEFAULT_ARTIFACT_DIR) {
  return path.resolve(cwd, artifactDir);
}

export async function runWebsiteExample(options = {}) {
  const cwd = options.cwd || process.cwd();
  const ocularConfig = options.ocularConfig || {};
  const websiteDir = getWebsiteDir(cwd);
  const artifactDir = getArtifactDir(cwd, options.artifactDir);
  const requestedBaseUrl = options.baseUrl || DEFAULT_BASE_URL;
  let resolvedBaseUrl = requestedBaseUrl;
  let targetUrl = resolveTargetUrl(options, resolvedBaseUrl, ocularConfig);
  const targetTab = options.targetTab || options.example || targetUrl;

  let serverProcess = null;
  let browserHandle = null;

  try {
    const usingAttachMode = Boolean(options.attach);
    let usingExistingServer = usingAttachMode ? true : await isServerReady(resolvedBaseUrl);

    if (!usingAttachMode && !usingExistingServer) {
      const requestedEndpoint = parseBaseUrl(resolvedBaseUrl);

      if (await isPortListening(requestedEndpoint.host, requestedEndpoint.port)) {
        const availablePort = await findAvailablePort(requestedEndpoint.host, requestedEndpoint.port + 1);
        resolvedBaseUrl = buildBaseUrl(requestedEndpoint, availablePort);
      }

      targetUrl = resolveTargetUrl(options, resolvedBaseUrl, ocularConfig);
      serverProcess = startWebsiteServer(websiteDir, parseBaseUrl(resolvedBaseUrl));
      await waitForServer(resolvedBaseUrl, START_TIMEOUT_MS);
    } else if (usingExistingServer) {
      targetUrl = resolveTargetUrl(options, resolvedBaseUrl, ocularConfig);
    }

    await mkdir(artifactDir, {recursive: true});

    browserHandle = usingAttachMode
      ? await attachDebugBrowser(options)
      : await launchDebugBrowser({
          ...options,
          ocularConfig
        });

    if (options.backend && (!usingAttachMode || options.highDynamicRangeCapture)) {
      await seedBackendPreference(browserHandle.browser, options.backend);
    }

    const matchedPage = await findTargetPage(browserHandle.browser, targetTab);
    const page = matchedPage || (await createPage(browserHandle.browser));

    await applyViewportSize(page, options.viewportWidth, options.viewportHeight);

    const {diagnostics, dispose} = collectPageDiagnostics(page, options.logger || console);

    try {
      const navigationUrl = resolveNavigationUrl({
        highDynamicRangeCapture: options.highDynamicRangeCapture,
        matchedPage,
        page,
        targetUrl,
        usingAttachMode
      });
      if (navigationUrl) {
        targetUrl = navigationUrl;
        await page.goto(targetUrl, {waitUntil: 'networkidle'});
      }

      const selectedDeviceType = await applyBackendSelection(page, options.backend);
      if (options.highDynamicRangeCapture && !selectedDeviceType) {
        throw new Error('[playwright] HDR capture requires an available selected device backend.');
      }
      if (options.captureDelayMilliseconds) {
        await page.waitForTimeout(options.captureDelayMilliseconds);
      }
      const webgpuProbe = await probeWebGPU(page);

      await writeJsonArtifact(artifactDir, 'webgpu-probe.json', webgpuProbe);
      await writeJsonArtifact(artifactDir, 'page-diagnostics.json', diagnostics);
      await writeTextArtifact(artifactDir, 'last-url.txt', `${targetUrl}\n`);
      const screenshotPath = options.skipScreenshot
        ? null
        : path.join(artifactDir, DEFAULT_SCREENSHOT_NAME);
      if (screenshotPath) {
        await page.screenshot({
          path: screenshotPath,
          fullPage: !options.highDynamicRangeCapture,
          timeout: SCREENSHOT_TIMEOUT_MS
        });
      }

      const highDynamicRangeArtifacts = options.highDynamicRangeCapture
        ? await captureHDRScreenshotArtifacts(page, artifactDir, {
            captureTimeoutMilliseconds: options.highDynamicRangeCaptureTimeout,
            expectedDeviceType: selectedDeviceType
          })
        : null;

      if (options.watch) {
        await watchScreenshots(page, artifactDir, options.watchInterval);
      }

      return {
        artifactDir,
        baseUrl: resolvedBaseUrl,
        browserMode: browserHandle.mode,
        diagnostics,
        endpointURL: browserHandle.endpointURL,
        highDynamicRangeArtifacts,
        screenshotPath,
        targetUrl,
        usingExistingServer
      };
    } finally {
      dispose();
    }
  } finally {
    if (!options.keepOpen && browserHandle?.browser) {
      await browserHandle.browser.close();
    }

    if (serverProcess) {
      await stopWebsiteServer(serverProcess);
    }
  }
}

function resolveNavigationUrl(options) {
  if (!options.matchedPage) {
    return options.targetUrl;
  }
  if (!options.usingAttachMode) {
    return options.page.url() === options.targetUrl ? null : options.targetUrl;
  }
  if (!options.highDynamicRangeCapture) {
    return null;
  }

  const captureUrl = new URL(options.page.url());
  captureUrl.searchParams.set('luma-hdr-capture', '1');
  const resolvedCaptureUrl = captureUrl.toString();
  return resolvedCaptureUrl === options.page.url() ? null : resolvedCaptureUrl;
}

async function seedBackendPreference(browser, backend) {
  const normalizedBackend = normalizeBackend(backend);
  if (!normalizedBackend) {
    return;
  }
  const existingContext = browser.contexts()[0];
  const context = existingContext || (await browser.newContext());
  await context.addInitScript(deviceType => {
    globalThis.localStorage?.setItem('luma-device-type', deviceType);
  }, normalizedBackend);
}

function resolveTargetUrl(options, baseUrl, ocularConfig) {
  const targetUrl = resolveExampleUrl(options.example, baseUrl, ocularConfig);
  if (!options.highDynamicRangeCapture) {
    return targetUrl;
  }
  const captureUrl = new URL(targetUrl);
  captureUrl.searchParams.set('luma-hdr-capture', '1');
  return captureUrl.toString();
}

async function applyBackendSelection(page, backend) {
  if (backend) {
    return (await selectDeviceBackend(page, backend)) ? normalizeBackend(backend) : null;
  }

  let selectedDeviceType = await selectPreferredDeviceBackend(page, 'webgpu');
  const webgpuProbe = await probeWebGPU(page);
  if (!webgpuProbe.adapter) {
    selectedDeviceType = (await selectDeviceBackend(page, 'webgl2'))
      ? normalizeBackend('webgl2')
      : null;
  }
  return selectedDeviceType;
}

async function createPage(browser) {
  const existingContext = browser.contexts()[0];
  const context = existingContext || (await browser.newContext());
  return await context.newPage();
}

export async function applyViewportSize(page, viewportWidth, viewportHeight) {
  if (viewportWidth === undefined && viewportHeight === undefined) {
    return;
  }

  const currentViewportSize = page.viewportSize();
  if (!currentViewportSize && (viewportWidth === undefined || viewportHeight === undefined)) {
    throw new Error('Both viewport dimensions are required when the page has no viewport.');
  }

  await page.setViewportSize({
    width: viewportWidth ?? currentViewportSize.width,
    height: viewportHeight ?? currentViewportSize.height
  });
}

function startWebsiteServer(websiteDir, endpoint) {
  const child = spawn('yarn', ['start', '--host', endpoint.host, '--port', String(endpoint.port)], {
    cwd: websiteDir,
    env: {...process.env, CI: '1'},
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  child.on('exit', code => {
    if (code !== 0 && code !== null) {
      console.error(`[playwright] Website server exited with code ${code}`);
    }
  });
  return child;
}

async function stopWebsiteServer(serverProcess) {
  if (!serverProcess || serverProcess.exitCode !== null) {
    return;
  }

  serverProcess.kill('SIGTERM');
  await new Promise(resolve => {
    serverProcess.once('exit', resolve);
  });
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServerReady(url)) {
      return;
    }
    await delay(1000);
  }
  throw new Error(`[playwright] Timed out waiting for ${url}`);
}

async function isServerReady(url) {
  try {
    const response = await fetch(url, {signal: AbortSignal.timeout(2000)});
    return response.ok;
  } catch {
    return false;
  }
}

function parseBaseUrl(baseUrl) {
  const parsedUrl = new URL(baseUrl);
  return {
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80)),
    protocol: parsedUrl.protocol
  };
}

function buildBaseUrl(endpoint, port) {
  return `${endpoint.protocol}//${endpoint.host}:${port}`;
}

async function isPortListening(host, port) {
  return await new Promise(resolve => {
    const socket = net.createConnection({host, port});
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => {
      resolve(false);
    });
  });
}

async function findAvailablePort(host, startingPort) {
  let port = startingPort;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!(await isPortListening(host, port))) {
      return port;
    }
    port++;
  }
}

async function writeJsonArtifact(artifactDir, filename, value) {
  await writeFile(path.join(artifactDir, filename), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeTextArtifact(artifactDir, filename, value) {
  await writeFile(path.join(artifactDir, filename), value, 'utf8');
}

async function watchScreenshots(page, artifactDir, watchInterval = DEFAULT_WATCH_INTERVAL_MS) {
  const intervalMilliseconds = Number(watchInterval) || DEFAULT_WATCH_INTERVAL_MS;
  let screenshotIndex = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    screenshotIndex++;
    await page.screenshot({
      path: path.join(artifactDir, `website-playwright-${String(screenshotIndex).padStart(4, '0')}.png`),
      fullPage: true
    });
    await delay(intervalMilliseconds);
  }
}
