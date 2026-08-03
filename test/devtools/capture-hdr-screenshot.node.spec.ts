import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {afterEach, describe, expect, test} from 'vitest';

import {
  captureHDRScreenshotArtifacts,
  writeHDRScreenshotArtifacts
} from '../../dev-modules/devtools-extensions/playwright/capture-hdr-screenshot.mjs';
import {applyViewportSize} from '../../dev-modules/devtools-extensions/playwright/run-website-example.mjs';
import {parseArguments} from '../../dev-modules/devtools-extensions/playwright/website-playwright-cli.mjs';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(directory => rm(directory, {recursive: true, force: true}))
  );
});

describe('writeHDRScreenshotArtifacts', () => {
  test('writes tightly packed HDR and SDR planes with a versioned manifest', async () => {
    const artifactDirectory = await makeTemporaryDirectory();
    const capture = makeSerializedCapture();
    const artifacts = await writeHDRScreenshotArtifacts(capture, artifactDirectory);

    expect(await readFile(artifacts.hdrRawPath)).toEqual(Buffer.alloc(32, 0x3c));
    expect(await readFile(artifacts.sdrRawPath)).toEqual(Buffer.alloc(16, 0x80));
    expect(artifacts.manifest).toMatchObject({
      schema: 'luma.gl/hdr-screenshot-capture',
      version: 1,
      width: 2,
      height: 2,
      orientation: 'top-down',
      hdr: {
        file: 'website-playwright-hdr.rgba16float',
        format: 'rgba16float',
        colorSpace: 'display-p3',
        transfer: 'linear',
        bytesPerRow: 16,
        byteLength: 32
      },
      sdr: {
        file: 'website-playwright-sdr.rgba8',
        format: 'rgba8unorm-srgb',
        colorSpace: 'display-p3',
        transfer: 'srgb',
        bytesPerRow: 8,
        byteLength: 16
      }
    });

    const savedManifest = JSON.parse(await readFile(artifacts.manifestPath, 'utf8'));
    expect(savedManifest).toEqual(artifacts.manifest);
  });

  test('rejects padded rows before writing ambiguous raw data', async () => {
    const artifactDirectory = await makeTemporaryDirectory();
    const capture = makeSerializedCapture();
    capture.hdr.bytesPerRow = 256;

    await expect(writeHDRScreenshotArtifacts(capture, artifactDirectory)).rejects.toThrow(
      'HDR screenshot bytesPerRow must be tightly packed (16), received 256.'
    );
  });

  test('waits for the capture bridge owned by the selected backend', async () => {
    const artifactDirectory = await makeTemporaryDirectory();
    const globalScope = globalThis as typeof globalThis & {
      lumaCaptureHDRScreenshot?: (() => Promise<ReturnType<typeof makeBrowserCapture>>) & {
        deviceType: string;
      };
    };
    const previousCaptureFunction = globalScope.lumaCaptureHDRScreenshot;
    const staleCaptureFunction = Object.assign(async () => makeBrowserCapture(), {
      deviceType: 'webgpu-max'
    });
    const selectedCaptureFunction = Object.assign(async () => makeBrowserCapture(), {
      deviceType: 'webgpu-core'
    });
    const page = {
      async waitForFunction(
        predicate: (expectedDeviceType: string) => boolean,
        expectedDeviceType: string,
        options: {timeout: number}
      ) {
        expect(options.timeout).toBe(1000);
        globalScope.lumaCaptureHDRScreenshot = staleCaptureFunction;
        expect(predicate(expectedDeviceType)).toBe(false);
        globalScope.lumaCaptureHDRScreenshot = selectedCaptureFunction;
        expect(predicate(expectedDeviceType)).toBe(true);
      },
      async evaluate(
        callback: (options: {
          expectedDeviceType: string;
          timeoutMilliseconds: number;
        }) => Promise<unknown>,
        options: {expectedDeviceType: string; timeoutMilliseconds: number}
      ) {
        return await callback(options);
      }
    };

    try {
      const artifacts = await captureHDRScreenshotArtifacts(page, artifactDirectory, {
        captureTimeoutMilliseconds: 1000,
        expectedDeviceType: 'webgpu-core'
      });
      expect(artifacts.manifest).toMatchObject({width: 2, height: 2});
    } finally {
      if (previousCaptureFunction) {
        globalScope.lumaCaptureHDRScreenshot = previousCaptureFunction;
      } else {
        delete globalScope.lumaCaptureHDRScreenshot;
      }
    }
  });
});

describe('website Playwright CLI', () => {
  test('enables the optional HDR capture without changing normal screenshot defaults', () => {
    expect(parseArguments(['--example', 'showcase/tempest-ocean'])).toMatchObject({
      highDynamicRangeCapture: false
    });
    expect(parseArguments(['--example', 'showcase/tempest-ocean', '--hdr-capture'])).toMatchObject({
      example: 'showcase/tempest-ocean',
      highDynamicRangeCapture: true
    });
  });

  test('parses positive viewport dimensions', () => {
    expect(parseArguments(['--viewport-width=1280', '--viewport-height', '780'])).toMatchObject({
      viewportWidth: 1280,
      viewportHeight: 780
    });
    expect(() => parseArguments(['--viewport-width', '0'])).toThrow(
      '--viewport-width must be a positive integer.'
    );
  });
});

describe('applyViewportSize', () => {
  test('sets explicit dimensions before capture', async () => {
    let viewportSize = {width: 900, height: 600};
    const page = {
      viewportSize: () => viewportSize,
      setViewportSize: async (nextViewportSize: typeof viewportSize) => {
        viewportSize = nextViewportSize;
      }
    };

    await applyViewportSize(page, 1280, 780);

    expect(viewportSize).toEqual({width: 1280, height: 780});
  });
});

function makeSerializedCapture() {
  return {
    width: 2,
    height: 2,
    hdr: {
      format: 'rgba16float',
      colorSpace: 'display-p3',
      transfer: 'linear',
      bytesPerRow: 16,
      dataBase64: Buffer.alloc(32, 0x3c).toString('base64')
    },
    sdr: {
      format: 'rgba8unorm-srgb',
      colorSpace: 'display-p3',
      transfer: 'srgb',
      bytesPerRow: 8,
      dataBase64: Buffer.alloc(16, 0x80).toString('base64')
    }
  };
}

function makeBrowserCapture() {
  return {
    width: 2,
    height: 2,
    hdr: {
      format: 'rgba16float',
      colorSpace: 'display-p3',
      transfer: 'linear',
      bytesPerRow: 16,
      data: new Uint8Array(32).fill(0x3c)
    },
    sdr: {
      format: 'rgba8unorm-srgb',
      colorSpace: 'display-p3',
      transfer: 'srgb',
      bytesPerRow: 8,
      data: new Uint8Array(16).fill(0x80)
    }
  } as const;
}

async function makeTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), 'luma-hdr-capture-'));
  temporaryDirectories.push(directory);
  return directory;
}
