import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_CAPTURE_TIMEOUT_MILLISECONDS = 120_000;
const HDR_RAW_FILENAME = 'website-playwright-hdr.rgba16float';
const SDR_RAW_FILENAME = 'website-playwright-sdr.rgba8';
const MANIFEST_FILENAME = 'website-playwright-hdr.json';

/**
 * Requests the active example's high-dynamic-range capture and writes its raw planes plus metadata.
 * The normal Playwright PNG remains a separate diagnostic artifact.
 */
export async function captureHDRScreenshotArtifacts(page, artifactDirectory, options = {}) {
  const captureTimeoutMilliseconds =
    options.captureTimeoutMilliseconds || DEFAULT_CAPTURE_TIMEOUT_MILLISECONDS;
  const expectedDeviceType = options.expectedDeviceType || null;

  await page.waitForFunction(
    selectedDeviceType => {
      const captureFunction = globalThis.lumaCaptureHDRScreenshot;
      return (
        typeof captureFunction === 'function' &&
        (!selectedDeviceType || captureFunction.deviceType === selectedDeviceType)
      );
    },
    expectedDeviceType,
    {timeout: captureTimeoutMilliseconds}
  );

  const serializedCapture = await page.evaluate(async captureOptions => {
    const {expectedDeviceType, timeoutMilliseconds} = captureOptions;
    if (typeof globalThis.lumaCaptureHDRScreenshot !== 'function') {
      throw new Error('The active example does not expose lumaCaptureHDRScreenshot().');
    }
    if (
      expectedDeviceType &&
      globalThis.lumaCaptureHDRScreenshot.deviceType !== expectedDeviceType
    ) {
      throw new Error(
        `The HDR screenshot bridge belongs to ${globalThis.lumaCaptureHDRScreenshot.deviceType}, expected ${expectedDeviceType}.`
      );
    }

    let timeoutIdentifier;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutIdentifier = setTimeout(
        () => reject(new Error(`HDR screenshot capture timed out after ${timeoutMilliseconds}ms.`)),
        timeoutMilliseconds
      );
    });

    try {
      const capture = await Promise.race([globalThis.lumaCaptureHDRScreenshot(), timeoutPromise]);
      return {
        width: capture.width,
        height: capture.height,
        hdr: {
          format: capture.hdr.format,
          colorSpace: capture.hdr.colorSpace,
          transfer: capture.hdr.transfer,
          bytesPerRow: capture.hdr.bytesPerRow,
          dataBase64: encodeBytesAsBase64(capture.hdr.data)
        },
        sdr: {
          format: capture.sdr.format,
          colorSpace: capture.sdr.colorSpace,
          transfer: capture.sdr.transfer,
          bytesPerRow: capture.sdr.bytesPerRow,
          dataBase64: encodeBytesAsBase64(capture.sdr.data)
        }
      };
    } finally {
      clearTimeout(timeoutIdentifier);
    }

    function encodeBytesAsBase64(data) {
      if (!(data instanceof Uint8Array)) {
        throw new Error('HDR screenshot capture planes must use Uint8Array data.');
      }

      // Keep each call below the JavaScript argument limit and aligned to a three-byte base64 group.
      const chunkByteLength = 0x6000;
      let encodedData = '';
      for (let byteOffset = 0; byteOffset < data.byteLength; byteOffset += chunkByteLength) {
        const chunk = data.subarray(byteOffset, byteOffset + chunkByteLength);
        encodedData += btoa(String.fromCharCode(...chunk));
      }
      return encodedData;
    }
  }, {expectedDeviceType, timeoutMilliseconds: captureTimeoutMilliseconds});

  return await writeHDRScreenshotArtifacts(serializedCapture, artifactDirectory);
}

/** Writes a serialized browser capture to stable artifact filenames. */
export async function writeHDRScreenshotArtifacts(capture, artifactDirectory) {
  assertPositiveInteger(capture?.width, 'width');
  assertPositiveInteger(capture?.height, 'height');

  const hdrData = decodeCapturePlane(capture.hdr, {
    name: 'HDR',
    width: capture.width,
    height: capture.height,
    bytesPerPixel: 8,
    format: 'rgba16float',
    colorSpace: 'display-p3',
    transfer: 'linear'
  });
  const sdrData = decodeCapturePlane(capture.sdr, {
    name: 'SDR',
    width: capture.width,
    height: capture.height,
    bytesPerPixel: 4,
    format: 'rgba8unorm-srgb',
    colorSpace: 'display-p3',
    transfer: 'srgb'
  });

  const hdrRawPath = path.join(artifactDirectory, HDR_RAW_FILENAME);
  const sdrRawPath = path.join(artifactDirectory, SDR_RAW_FILENAME);
  const manifestPath = path.join(artifactDirectory, MANIFEST_FILENAME);
  const manifest = {
    schema: 'luma.gl/hdr-screenshot-capture',
    version: 1,
    width: capture.width,
    height: capture.height,
    orientation: 'top-down',
    hdr: makePlaneManifest(capture.hdr, HDR_RAW_FILENAME, hdrData, 8),
    sdr: makePlaneManifest(capture.sdr, SDR_RAW_FILENAME, sdrData, 4)
  };

  await mkdir(artifactDirectory, {recursive: true});
  await Promise.all([
    writeFile(hdrRawPath, hdrData),
    writeFile(sdrRawPath, sdrData),
    writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  ]);

  return {hdrRawPath, manifestPath, sdrRawPath, manifest};
}

function decodeCapturePlane(plane, expected) {
  if (!plane || typeof plane !== 'object') {
    throw new Error(`${expected.name} screenshot capture plane is missing.`);
  }
  for (const propertyName of ['format', 'colorSpace', 'transfer']) {
    if (plane[propertyName] !== expected[propertyName]) {
      throw new Error(
        `${expected.name} screenshot ${propertyName} must be ${expected[propertyName]}, received ${plane[propertyName]}.`
      );
    }
  }

  const expectedBytesPerRow = expected.width * expected.bytesPerPixel;
  if (plane.bytesPerRow !== expectedBytesPerRow) {
    throw new Error(
      `${expected.name} screenshot bytesPerRow must be tightly packed (${expectedBytesPerRow}), received ${plane.bytesPerRow}.`
    );
  }
  if (typeof plane.dataBase64 !== 'string') {
    throw new Error(`${expected.name} screenshot dataBase64 must be a string.`);
  }

  const data = Buffer.from(plane.dataBase64, 'base64');
  const expectedByteLength = expectedBytesPerRow * expected.height;
  if (data.byteLength !== expectedByteLength) {
    throw new Error(
      `${expected.name} screenshot data must contain ${expectedByteLength} bytes, received ${data.byteLength}.`
    );
  }
  return data;
}

function makePlaneManifest(plane, filename, data, bytesPerPixel) {
  return {
    file: filename,
    format: plane.format,
    colorSpace: plane.colorSpace,
    transfer: plane.transfer,
    bytesPerPixel,
    bytesPerRow: plane.bytesPerRow,
    byteLength: data.byteLength
  };
}

function assertPositiveInteger(value, propertyName) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(
      `HDR screenshot ${propertyName} must be a positive integer, received ${value}.`
    );
  }
}
