#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {constants as fileSystemConstants} from 'node:fs';
import {access, copyFile, lstat, mkdir, readFile, rm, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const LIBULTRAHDR_VERSION = 'v1.5.1';
export const LIBULTRAHDR_COMMIT = 'a8166d65171aef43cb4bc211538ee6619a9af680';

const ISO_GAIN_MAP_NAMESPACE = 'urn:iso:std:iso:ts:21496:-1';
const XMP_PACKET_NAMESPACE = 'http://ns.adobe.com/xap/1.0/';
const XMP_GAIN_MAP_NAMESPACE = 'http://ns.adobe.com/hdr-gain-map/1.0/';
const BYTES_PER_RGBA16_FLOAT_PIXEL = 8n;
const BYTES_PER_RGBA8_PIXEL = 4n;
const MINIMUM_TARGET_PEAK_NITS = 203;
const MAXIMUM_TARGET_PEAK_NITS = 10000;
const MINIMUM_GAIN_MAP_SCALE = 1;
const MAXIMUM_GAIN_MAP_SCALE = 128;

const COLOR_GAMUT_VALUES = {
  bt709: 0,
  'display-p3': 1,
  bt2100: 2
};

const ENCODING_PRESET_VALUES = {
  'real-time': 0,
  'best-quality': 1
};

const START_OF_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf
]);

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, '..', '..');

export const HELP_TEXT = `Encode a backward-compatible ISO 21496-1 + Ultra HDR XMP gain-map JPEG.

Usage:
  node scripts/hdr-capture/encode-gainmap-jpeg.mjs \\
    (--manifest <website-playwright-hdr.json> | \\
      --hdr <frame.rgba16float> \\
      (--sdr-raw <frame.rgba8> | --sdr-jpeg <frame.jpg>) \\
      --width <pixels> --height <pixels>) \\
    --output <frame.jpg> [options]

Required inputs:
  --manifest <path>            Playwright HDR capture manifest. Supplies both raw paths,
                               dimensions, formats, and Display P3 color metadata.
  --hdr <path>                 Tight, little-endian, linear RGBA16F pixels.
  --sdr-raw <path>             Tight, sRGB-transfer RGBA8888 pixels (preferred).
  --sdr-jpeg <path>            Authored SDR JPEG alternative; passed through unchanged.
  --width <integer>            Stored image width.
  --height <integer>           Stored image height.
  --output <path>              Gain-map JPEG output (.jpg or .jpeg).

Encoder setup:
  --ultrahdr-app <path>        Path to ultrahdr_app. Falls back to ULTRAHDR_APP,
                               then the pinned build created by build-libultrahdr.sh.

Color and quality options:
  --hdr-gamut <name>           bt709, display-p3 (default), or bt2100.
  --sdr-gamut <name>           bt709, display-p3 (default), or bt2100.
  --target-peak-nits <number>  HDR target peak in [203, 10000] (default: 1000).
  --base-quality <integer>     Base JPEG quality in [0, 100] for --sdr-raw (default: 95).
  --gainmap-quality <integer>  Gain-map JPEG quality in [0, 100] (default: 95).
  --gainmap-scale <integer>    Dimension downsample factor in [1, 128] (default: 4).
  --gainmap-gamma <number>     Positive gain-map gamma (default: 1).
  --single-channel             Encode a luminance gain map instead of RGB gain channels.
  --preset <name>              real-time or best-quality (default).

Safety and diagnostics:
  --overwrite                  Replace an existing output file.
  --dry-run                    Validate inputs and print the encoder command only.
  --help                       Show this help.
`;

/** Parse command-line options without accessing the file system. */
export function parseCliArguments(commandLineArguments, environment = process.env) {
  const options = {
    ultrahdrAppPath: environment.ULTRAHDR_APP,
    highDynamicRangeGamut: 'display-p3',
    standardDynamicRangeGamut: 'display-p3',
    targetPeakNits: 1000,
    baseQuality: 95,
    gainMapQuality: 95,
    gainMapScale: 4,
    gainMapGamma: 1,
    useMultiChannelGainMap: true,
    encodingPreset: 'best-quality',
    overwrite: false,
    dryRun: false,
    help: false
  };
  const seenOptions = new Set();

  for (let argumentIndex = 0; argumentIndex < commandLineArguments.length; argumentIndex++) {
    const commandLineArgument = commandLineArguments[argumentIndex];
    const equalsIndex = commandLineArgument.indexOf('=');
    const optionName =
      equalsIndex === -1 ? commandLineArgument : commandLineArgument.slice(0, equalsIndex);
    const inlineValue = equalsIndex === -1 ? undefined : commandLineArgument.slice(equalsIndex + 1);

    if (optionName === '--help') {
      options.help = true;
      continue;
    }
    if (optionName === '--overwrite') {
      assertFlagHasNoValue(optionName, inlineValue);
      options.overwrite = true;
      continue;
    }
    if (optionName === '--dry-run') {
      assertFlagHasNoValue(optionName, inlineValue);
      options.dryRun = true;
      continue;
    }
    if (optionName === '--single-channel') {
      assertFlagHasNoValue(optionName, inlineValue);
      options.useMultiChannelGainMap = false;
      continue;
    }

    const propertyName = getOptionPropertyName(optionName);
    if (!propertyName) {
      throw new Error(
        `Unknown option: ${commandLineArgument}. Use --help to list supported options.`
      );
    }
    if (seenOptions.has(optionName)) {
      throw new Error(`Option ${optionName} may only be specified once.`);
    }
    seenOptions.add(optionName);

    let optionValue = inlineValue;
    if (optionValue === undefined) {
      argumentIndex++;
      optionValue = commandLineArguments[argumentIndex];
    }
    if (optionValue === undefined || optionValue.startsWith('--')) {
      throw new Error(`Option ${optionName} requires a value.`);
    }
    options[propertyName] = parseOptionValue(optionName, optionValue);
  }

  return options;
}

/** Locate an explicit, environment-provided, or pinned local ultrahdr_app executable. */
export async function resolveUltrahdrAppPath(configuredPath, environment = process.env) {
  if (configuredPath) {
    return path.resolve(configuredPath);
  }
  if (environment.ULTRAHDR_APP) {
    return path.resolve(environment.ULTRAHDR_APP);
  }

  const cacheRoot = environment.HDR_CAPTURE_CACHE_DIR
    ? path.resolve(environment.HDR_CAPTURE_CACHE_DIR)
    : path.join(REPOSITORY_ROOT, '.cache', 'hdr-capture');
  const buildDirectory = path.join(
    cacheRoot,
    `libultrahdr-${LIBULTRAHDR_VERSION}`,
    'build'
  );
  const candidates =
    process.platform === 'win32'
      ? [
          path.join(buildDirectory, 'Release', 'ultrahdr_app.exe'),
          path.join(buildDirectory, 'ultrahdr_app.exe')
        ]
      : [path.join(buildDirectory, 'ultrahdr_app')];

  for (const candidate of candidates) {
    if (await doesPathExist(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not find ultrahdr_app. Pass --ultrahdr-app, set ULTRAHDR_APP, or run ` +
      '`bash scripts/hdr-capture/build-libultrahdr.sh`.'
  );
}

/** Build the ultrahdr_app arguments for the requested raw or JPEG SDR workflow. */
export function buildEncoderArguments(options, encoderOutputPath) {
  const argumentsList = [
    '-m',
    '0',
    '-p',
    options.highDynamicRangePath,
    '-a',
    '4',
    '-t',
    '0',
    '-C',
    String(COLOR_GAMUT_VALUES[options.highDynamicRangeGamut])
  ];

  if (options.standardDynamicRangeRawPath) {
    argumentsList.push('-y', options.standardDynamicRangeRawPath, '-b', '3');
  } else {
    argumentsList.push('-i', options.standardDynamicRangeJpegPath);
  }

  argumentsList.push(
    '-c',
    String(COLOR_GAMUT_VALUES[options.standardDynamicRangeGamut]),
    '-w',
    String(options.width),
    '-h',
    String(options.height),
    '-q',
    String(options.baseQuality),
    '-Q',
    String(options.gainMapQuality),
    '-s',
    String(options.gainMapScale),
    '-G',
    String(options.gainMapGamma),
    '-M',
    options.useMultiChannelGainMap ? '1' : '0',
    '-D',
    String(ENCODING_PRESET_VALUES[options.encodingPreset]),
    '-L',
    String(options.targetPeakNits),
    '-z',
    encoderOutputPath
  );

  return argumentsList;
}

/** Read dimensions from a JPEG SOF marker without decoding its pixels. */
export function readJpegDimensions(imageData) {
  const data = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData);
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    throw new Error('The SDR JPEG does not begin with a valid JPEG SOI marker.');
  }

  let offset = 2;
  while (offset < data.length) {
    if (data[offset] !== 0xff) {
      throw new Error(`Invalid JPEG marker at byte ${offset}.`);
    }
    while (offset < data.length && data[offset] === 0xff) {
      offset++;
    }
    if (offset >= data.length) {
      break;
    }

    const marker = data[offset++];
    if (marker === 0xd9 || marker === 0xda) {
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    if (offset + 2 > data.length) {
      throw new Error(`Truncated JPEG segment length at byte ${offset}.`);
    }

    const segmentLength = data.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > data.length) {
      throw new Error(`Invalid JPEG segment length ${segmentLength} at byte ${offset}.`);
    }
    if (START_OF_FRAME_MARKERS.has(marker)) {
      if (segmentLength < 8) {
        throw new Error('The JPEG start-of-frame segment is too short.');
      }
      const height = data.readUInt16BE(offset + 3);
      const width = data.readUInt16BE(offset + 5);
      if (width === 0 || height === 0) {
        throw new Error(`The JPEG reports invalid dimensions ${width}x${height}.`);
      }
      return {width, height};
    }
    offset += segmentLength;
  }

  throw new Error('Could not find JPEG dimensions before the image scan data.');
}

/** Inspect the output for both metadata encodings required by this wrapper. */
export function inspectGainMapJpeg(imageData) {
  const data = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData);
  return {
    ...readJpegDimensions(data),
    hasIsoGainMapMetadata: data.includes(Buffer.from(ISO_GAIN_MAP_NAMESPACE, 'ascii')),
    hasXmpPacket: data.includes(Buffer.from(XMP_PACKET_NAMESPACE, 'ascii')),
    hasXmpGainMapMetadata: data.includes(Buffer.from(XMP_GAIN_MAP_NAMESPACE, 'ascii'))
  };
}

/** Load and strictly validate the paired raw artifacts written by the Playwright HDR capture. */
export async function loadCaptureManifestOptions(captureManifestPath) {
  const resolvedManifestPath = path.resolve(captureManifestPath);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(resolvedManifestPath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Could not read HDR capture manifest ${resolvedManifestPath}: ${error.message}`,
      {
        cause: error
      }
    );
  }

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('HDR capture manifest must contain a JSON object.');
  }
  assertManifestProperty(manifest, 'schema', 'luma.gl/hdr-screenshot-capture');
  assertManifestProperty(manifest, 'version', 1);
  assertManifestProperty(manifest, 'orientation', 'top-down');
  assertIntegerInRange(manifest.width, 'manifest width', 1, Number.MAX_SAFE_INTEGER);
  assertIntegerInRange(manifest.height, 'manifest height', 1, Number.MAX_SAFE_INTEGER);

  validateManifestPlane(manifest.hdr, {
    name: 'HDR',
    format: 'rgba16float',
    colorSpace: 'display-p3',
    transfer: 'linear',
    bytesPerPixel: Number(BYTES_PER_RGBA16_FLOAT_PIXEL),
    width: manifest.width,
    height: manifest.height
  });
  validateManifestPlane(manifest.sdr, {
    name: 'SDR',
    format: 'rgba8unorm-srgb',
    colorSpace: 'display-p3',
    transfer: 'srgb',
    bytesPerPixel: Number(BYTES_PER_RGBA8_PIXEL),
    width: manifest.width,
    height: manifest.height
  });

  const manifestDirectory = path.dirname(resolvedManifestPath);
  return {
    captureManifestPath: resolvedManifestPath,
    highDynamicRangePath: resolveManifestFilePath(manifestDirectory, manifest.hdr.file, 'HDR'),
    standardDynamicRangeRawPath: resolveManifestFilePath(
      manifestDirectory,
      manifest.sdr.file,
      'SDR'
    ),
    standardDynamicRangeJpegPath: undefined,
    width: manifest.width,
    height: manifest.height,
    highDynamicRangeGamut: 'display-p3',
    standardDynamicRangeGamut: 'display-p3'
  };
}

/** Merge a capture manifest into parsed CLI options while rejecting ambiguous overrides. */
export async function applyCaptureManifestOptions(options) {
  if (!options.captureManifestPath) {
    return options;
  }

  const incompatibleOptions = [
    ['highDynamicRangePath', '--hdr'],
    ['standardDynamicRangeRawPath', '--sdr-raw'],
    ['standardDynamicRangeJpegPath', '--sdr-jpeg'],
    ['width', '--width'],
    ['height', '--height']
  ];
  const specifiedOptions = incompatibleOptions
    .filter(([propertyName]) => options[propertyName] !== undefined)
    .map(([, optionName]) => optionName);
  if (specifiedOptions.length > 0) {
    throw new Error(
      `--manifest cannot be combined with ${specifiedOptions.join(', ')}; the manifest supplies those values.`
    );
  }
  if (
    options.highDynamicRangeGamut !== 'display-p3' ||
    options.standardDynamicRangeGamut !== 'display-p3'
  ) {
    throw new Error('--manifest requires Display P3 HDR and SDR gamut metadata.');
  }

  const manifestOptions = await loadCaptureManifestOptions(options.captureManifestPath);
  return {...options, ...manifestOptions};
}

/** Execute encoding, verify both metadata representations, and publish the output. */
export async function encodeGainMapJpeg(inputOptions, dependencies = {}) {
  const runEncoder = dependencies.runEncoder ?? runEncoderProcess;
  const options = normalizeCaptureOptions(inputOptions);
  validateCaptureOptions(options);
  await validateCaptureFiles(options);

  const outputDirectory = path.dirname(options.outputPath);
  const temporaryOutputPath = path.join(
    outputDirectory,
    `.${path.basename(options.outputPath)}.${process.pid}-${randomUUID()}.tmp.jpg`
  );
  const encoderOutputPath = options.dryRun ? options.outputPath : temporaryOutputPath;
  const encoderArguments = buildEncoderArguments(options, encoderOutputPath);
  const formattedCommand = formatCommand(options.ultrahdrAppPath, encoderArguments);

  if (options.dryRun) {
    return {options, encoderArguments, formattedCommand, dryRun: true};
  }

  await mkdir(outputDirectory, {recursive: true});
  try {
    const encodeResult = await runEncoder(options.ultrahdrAppPath, encoderArguments);
    const encodedImageData = await readFile(temporaryOutputPath);
    const inspection = inspectGainMapJpeg(encodedImageData);
    assertEncodedOutput(inspection, options);

    const probeResult = await runEncoder(options.ultrahdrAppPath, [
      '-m',
      '1',
      '-j',
      temporaryOutputPath,
      '-P'
    ]);
    const probeOutput = `${probeResult.stdout ?? ''}\n${probeResult.stderr ?? ''}`;
    if (!/Ultra HDR Image:\s*Yes/i.test(probeOutput)) {
      throw new Error(
        'ultrahdr_app encoded a file but did not recognize it as Ultra HDR in probe mode. ' +
          `Probe output: ${probeOutput.trim() || '(empty)'}`
      );
    }

    const copyMode = options.overwrite ? 0 : fileSystemConstants.COPYFILE_EXCL;
    await copyFile(temporaryOutputPath, options.outputPath, copyMode);

    return {
      options,
      encoderArguments,
      formattedCommand,
      inspection,
      encodeOutput: `${encodeResult.stdout ?? ''}${encodeResult.stderr ?? ''}`.trim(),
      probeOutput: probeOutput.trim(),
      dryRun: false
    };
  } finally {
    await rm(temporaryOutputPath, {force: true});
  }
}

/** Run a child executable without involving a shell. */
export function runEncoderProcess(executablePath, commandArguments) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(executablePath, commandArguments, {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let standardOutput = '';
    let standardError = '';

    childProcess.stdout.setEncoding('utf8');
    childProcess.stderr.setEncoding('utf8');
    childProcess.stdout.on('data', chunk => {
      standardOutput += chunk;
    });
    childProcess.stderr.on('data', chunk => {
      standardError += chunk;
    });
    childProcess.on('error', error => {
      reject(
        new Error(`Could not start ${executablePath}: ${error.message}`, {
          cause: error
        })
      );
    });
    childProcess.on('close', exitCode => {
      if (exitCode === 0) {
        resolve({stdout: standardOutput, stderr: standardError});
        return;
      }
      reject(
        new Error(
          `ultrahdr_app exited with code ${exitCode}.\n` +
            `${standardError.trim() || standardOutput.trim() || '(no encoder output)'}`
        )
      );
    });
  });
}

function getOptionPropertyName(optionName) {
  return {
    '--manifest': 'captureManifestPath',
    '--hdr': 'highDynamicRangePath',
    '--sdr-raw': 'standardDynamicRangeRawPath',
    '--sdr-jpeg': 'standardDynamicRangeJpegPath',
    '--output': 'outputPath',
    '--width': 'width',
    '--height': 'height',
    '--ultrahdr-app': 'ultrahdrAppPath',
    '--hdr-gamut': 'highDynamicRangeGamut',
    '--sdr-gamut': 'standardDynamicRangeGamut',
    '--target-peak-nits': 'targetPeakNits',
    '--base-quality': 'baseQuality',
    '--gainmap-quality': 'gainMapQuality',
    '--gainmap-scale': 'gainMapScale',
    '--gainmap-gamma': 'gainMapGamma',
    '--preset': 'encodingPreset'
  }[optionName];
}

function parseOptionValue(optionName, optionValue) {
  if (
    optionName === '--width' ||
    optionName === '--height' ||
    optionName === '--base-quality' ||
    optionName === '--gainmap-quality' ||
    optionName === '--gainmap-scale'
  ) {
    if (!/^\d+$/.test(optionValue)) {
      throw new Error(`${optionName} must be an integer; received ${optionValue}.`);
    }
    return Number(optionValue);
  }
  if (optionName === '--target-peak-nits' || optionName === '--gainmap-gamma') {
    const numericValue = Number(optionValue);
    if (!Number.isFinite(numericValue)) {
      throw new Error(`${optionName} must be a finite number; received ${optionValue}.`);
    }
    return numericValue;
  }
  return optionValue;
}

function assertFlagHasNoValue(optionName, inlineValue) {
  if (inlineValue !== undefined) {
    throw new Error(`${optionName} does not accept a value.`);
  }
}

function normalizeCaptureOptions(inputOptions) {
  return {
    ...inputOptions,
    captureManifestPath: resolveOptionalPath(inputOptions.captureManifestPath),
    highDynamicRangePath: resolveOptionalPath(inputOptions.highDynamicRangePath),
    standardDynamicRangeRawPath: resolveOptionalPath(inputOptions.standardDynamicRangeRawPath),
    standardDynamicRangeJpegPath: resolveOptionalPath(inputOptions.standardDynamicRangeJpegPath),
    outputPath: resolveOptionalPath(inputOptions.outputPath),
    ultrahdrAppPath: resolveOptionalPath(inputOptions.ultrahdrAppPath)
  };
}

function resolveOptionalPath(filePath) {
  return filePath ? path.resolve(filePath) : undefined;
}

function validateManifestPlane(plane, expected) {
  if (!plane || typeof plane !== 'object' || Array.isArray(plane)) {
    throw new Error(`HDR capture manifest ${expected.name} plane is missing.`);
  }
  for (const propertyName of ['format', 'colorSpace', 'transfer', 'bytesPerPixel']) {
    assertManifestProperty(plane, propertyName, expected[propertyName], `${expected.name} plane`);
  }
  if (typeof plane.file !== 'string' || plane.file.length === 0) {
    throw new Error(`HDR capture manifest ${expected.name} plane file must be a non-empty string.`);
  }

  const expectedBytesPerRow = BigInt(expected.width) * BigInt(expected.bytesPerPixel);
  const expectedByteLength = expectedBytesPerRow * BigInt(expected.height);
  assertManifestInteger(
    plane.bytesPerRow,
    expectedBytesPerRow,
    `${expected.name} plane bytesPerRow`
  );
  assertManifestInteger(plane.byteLength, expectedByteLength, `${expected.name} plane byteLength`);
}

function assertManifestProperty(object, propertyName, expectedValue, objectName = 'manifest') {
  if (object[propertyName] !== expectedValue) {
    throw new Error(
      `HDR capture ${objectName} ${propertyName} must be ${JSON.stringify(expectedValue)}; ` +
        `received ${JSON.stringify(object[propertyName])}.`
    );
  }
}

function assertManifestInteger(value, expectedValue, description) {
  if (!Number.isSafeInteger(value) || BigInt(value) !== expectedValue) {
    throw new Error(
      `HDR capture manifest ${description} must be ${expectedValue}; received ${String(value)}.`
    );
  }
}

function resolveManifestFilePath(manifestDirectory, relativeFilePath, planeName) {
  if (path.isAbsolute(relativeFilePath)) {
    throw new Error(
      `HDR capture manifest ${planeName} plane file must be relative to the manifest.`
    );
  }
  const resolvedFilePath = path.resolve(manifestDirectory, relativeFilePath);
  const relativeResolvedPath = path.relative(manifestDirectory, resolvedFilePath);
  if (relativeResolvedPath === '..' || relativeResolvedPath.startsWith(`..${path.sep}`)) {
    throw new Error(
      `HDR capture manifest ${planeName} plane file must stay within the artifact directory.`
    );
  }
  return resolvedFilePath;
}

function validateCaptureOptions(options) {
  assertRequiredPath(options.highDynamicRangePath, '--hdr');
  assertRequiredPath(options.outputPath, '--output');
  assertRequiredPath(options.ultrahdrAppPath, '--ultrahdr-app or ULTRAHDR_APP');

  const standardDynamicRangeInputCount =
    Number(Boolean(options.standardDynamicRangeRawPath)) +
    Number(Boolean(options.standardDynamicRangeJpegPath));
  if (standardDynamicRangeInputCount !== 1) {
    throw new Error('Specify exactly one of --sdr-raw or --sdr-jpeg.');
  }

  assertIntegerInRange(options.width, '--width', 1, Number.MAX_SAFE_INTEGER);
  assertIntegerInRange(options.height, '--height', 1, Number.MAX_SAFE_INTEGER);
  assertIntegerInRange(options.baseQuality, '--base-quality', 0, 100);
  assertIntegerInRange(options.gainMapQuality, '--gainmap-quality', 0, 100);
  assertIntegerInRange(
    options.gainMapScale,
    '--gainmap-scale',
    MINIMUM_GAIN_MAP_SCALE,
    MAXIMUM_GAIN_MAP_SCALE
  );
  assertNumberInRange(
    options.targetPeakNits,
    '--target-peak-nits',
    MINIMUM_TARGET_PEAK_NITS,
    MAXIMUM_TARGET_PEAK_NITS
  );
  assertNumberInRange(options.gainMapGamma, '--gainmap-gamma', Number.MIN_VALUE, Infinity);

  if (!(options.highDynamicRangeGamut in COLOR_GAMUT_VALUES)) {
    throw new Error(`--hdr-gamut must be one of ${Object.keys(COLOR_GAMUT_VALUES).join(', ')}.`);
  }
  if (!(options.standardDynamicRangeGamut in COLOR_GAMUT_VALUES)) {
    throw new Error(`--sdr-gamut must be one of ${Object.keys(COLOR_GAMUT_VALUES).join(', ')}.`);
  }
  if (!(options.encodingPreset in ENCODING_PRESET_VALUES)) {
    throw new Error(`--preset must be one of ${Object.keys(ENCODING_PRESET_VALUES).join(', ')}.`);
  }
  if (!/\.jpe?g$/i.test(options.outputPath)) {
    throw new Error('--output must use a .jpg or .jpeg extension.');
  }

  const inputPaths = [
    options.highDynamicRangePath,
    options.standardDynamicRangeRawPath,
    options.standardDynamicRangeJpegPath
  ].filter(Boolean);
  if (inputPaths.includes(options.outputPath)) {
    throw new Error('The output path must be different from every input path.');
  }
}

async function validateCaptureFiles(options) {
  await assertRegularFile(options.highDynamicRangePath, 'HDR RGBA16F input');
  await assertRegularFile(options.ultrahdrAppPath, 'ultrahdr_app executable');
  await access(options.ultrahdrAppPath, fileSystemConstants.X_OK);

  const expectedHighDynamicRangeBytes =
    BigInt(options.width) * BigInt(options.height) * BYTES_PER_RGBA16_FLOAT_PIXEL;
  await assertFileSize(
    options.highDynamicRangePath,
    expectedHighDynamicRangeBytes,
    'HDR RGBA16F input',
    'The file must be tightly packed with no per-row padding.'
  );

  if (options.standardDynamicRangeRawPath) {
    await assertRegularFile(options.standardDynamicRangeRawPath, 'SDR RGBA8888 input');
    const expectedStandardDynamicRangeBytes =
      BigInt(options.width) * BigInt(options.height) * BYTES_PER_RGBA8_PIXEL;
    await assertFileSize(
      options.standardDynamicRangeRawPath,
      expectedStandardDynamicRangeBytes,
      'SDR RGBA8888 input',
      'The file must be tightly packed with no per-row padding.'
    );
  } else {
    await assertRegularFile(options.standardDynamicRangeJpegPath, 'SDR JPEG input');
    const jpegData = await readFile(options.standardDynamicRangeJpegPath);
    const jpegDimensions = readJpegDimensions(jpegData);
    if (jpegDimensions.width !== options.width || jpegDimensions.height !== options.height) {
      throw new Error(
        `SDR JPEG dimensions are ${jpegDimensions.width}x${jpegDimensions.height}, but ` +
          `--width/--height specify ${options.width}x${options.height}.`
      );
    }
  }

  const outputLinkStatus = await getOptionalLinkStatus(options.outputPath);
  if (outputLinkStatus) {
    if (outputLinkStatus.isSymbolicLink()) {
      throw new Error(`Output path must not be a symbolic link: ${options.outputPath}`);
    }
    const outputStatus = await stat(options.outputPath);
    if (!outputStatus.isFile()) {
      throw new Error(`Output path exists and is not a regular file: ${options.outputPath}`);
    }
    await assertOutputDoesNotAliasInput(options, outputStatus);
    if (!options.overwrite) {
      throw new Error(
        `Output already exists: ${options.outputPath}. Pass --overwrite to replace it.`
      );
    }
  }
}

async function getOptionalLinkStatus(filePath) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function assertOutputDoesNotAliasInput(options, outputStatus) {
  const inputFiles = [
    {path: options.highDynamicRangePath, description: 'HDR input'},
    {path: options.standardDynamicRangeRawPath, description: 'SDR raw input'},
    {path: options.standardDynamicRangeJpegPath, description: 'SDR JPEG input'}
  ].filter(inputFile => inputFile.path);

  for (const inputFile of inputFiles) {
    const inputStatus = await stat(inputFile.path);
    if (inputStatus.dev === outputStatus.dev && inputStatus.ino === outputStatus.ino) {
      throw new Error(
        `Output path aliases the ${inputFile.description} and cannot be overwritten: ${options.outputPath}`
      );
    }
  }
}

async function assertRegularFile(filePath, description) {
  let fileStatus;
  try {
    fileStatus = await stat(filePath);
  } catch (error) {
    throw new Error(`${description} does not exist: ${filePath}`, {
      cause: error
    });
  }
  if (!fileStatus.isFile()) {
    throw new Error(`${description} is not a regular file: ${filePath}`);
  }
}

async function assertFileSize(filePath, expectedBytes, description, hint) {
  const fileStatus = await stat(filePath, {bigint: true});
  if (fileStatus.size !== expectedBytes) {
    throw new Error(
      `${description} has ${fileStatus.size} bytes; expected exactly ${expectedBytes} bytes. ${hint}`
    );
  }
}

function assertEncodedOutput(inspection, options) {
  if (inspection.width !== options.width || inspection.height !== options.height) {
    throw new Error(
      `Encoded JPEG dimensions are ${inspection.width}x${inspection.height}; expected ` +
        `${options.width}x${options.height}.`
    );
  }
  if (
    !inspection.hasIsoGainMapMetadata ||
    !inspection.hasXmpPacket ||
    !inspection.hasXmpGainMapMetadata
  ) {
    const missingMetadata = [];
    if (!inspection.hasIsoGainMapMetadata) {
      missingMetadata.push('ISO 21496-1');
    }
    if (!inspection.hasXmpPacket || !inspection.hasXmpGainMapMetadata) {
      missingMetadata.push('Ultra HDR XMP');
    }
    throw new Error(
      `Encoded JPEG is missing ${missingMetadata.join(' and ')} metadata. Rebuild the pinned ` +
        'libultrahdr with -DUHDR_WRITE_ISO=ON -DUHDR_WRITE_XMP=ON by running ' +
        '`bash scripts/hdr-capture/build-libultrahdr.sh`.'
    );
  }
}

function assertRequiredPath(filePath, optionName) {
  if (!filePath) {
    throw new Error(`Missing required option ${optionName}.`);
  }
}

function assertIntegerInRange(value, optionName, minimum, maximum) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `${optionName} must be an integer in [${minimum}, ${maximum}]; received ${value}.`
    );
  }
}

function assertNumberInRange(value, optionName, minimum, maximum) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${optionName} must be in [${minimum}, ${maximum}]; received ${value}.`);
  }
}

async function doesPathExist(filePath) {
  try {
    await access(filePath, fileSystemConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function formatCommand(executablePath, commandArguments) {
  return [executablePath, ...commandArguments].map(quoteCommandArgument).join(' ');
}

function quoteCommandArgument(argument) {
  return /^[A-Za-z0-9_./:=+-]+$/.test(argument) ? argument : JSON.stringify(argument);
}

export async function runCli(
  commandLineArguments = process.argv.slice(2),
  environment = process.env
) {
  let parsedOptions = parseCliArguments(commandLineArguments, environment);
  if (parsedOptions.help) {
    process.stdout.write(HELP_TEXT);
    return;
  }

  parsedOptions = await applyCaptureManifestOptions(parsedOptions);
  parsedOptions.ultrahdrAppPath = await resolveUltrahdrAppPath(
    parsedOptions.ultrahdrAppPath,
    environment
  );
  const result = await encodeGainMapJpeg(parsedOptions);
  if (result.dryRun) {
    process.stdout.write(`${result.formattedCommand}\n`);
    return;
  }

  process.stdout.write(
    `Wrote ISO + XMP gain-map JPEG: ${result.options.outputPath}\n` +
      `Dimensions: ${result.inspection.width}x${result.inspection.height}\n` +
      `Encoder: libultrahdr ${LIBULTRAHDR_VERSION}\n`
  );
}

const invokedModuleUrl = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : undefined;
if (invokedModuleUrl === import.meta.url) {
  runCli().catch(error => {
    const errorText = process.env.HDR_CAPTURE_DEBUG === '1' ? error.stack : error.message;
    process.stderr.write(`[hdr-capture] ${errorText}\n`);
    process.exitCode = 1;
  });
}
