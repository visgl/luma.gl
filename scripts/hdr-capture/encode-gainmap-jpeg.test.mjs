import assert from 'node:assert/strict';
import {chmod, link, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  LIBULTRAHDR_VERSION,
  applyCaptureManifestOptions,
  buildEncoderArguments,
  encodeGainMapJpeg,
  inspectGainMapJpeg,
  loadCaptureManifestOptions,
  parseCliArguments,
  readJpegDimensions,
  resolveUltrahdrAppPath
} from './encode-gainmap-jpeg.mjs';

const ISO_GAIN_MAP_NAMESPACE = 'urn:iso:std:iso:ts:21496:-1';
const XMP_PACKET_NAMESPACE = 'http://ns.adobe.com/xap/1.0/';
const XMP_GAIN_MAP_NAMESPACE = 'http://ns.adobe.com/hdr-gain-map/1.0/';

test('parseCliArguments selects the paired Display P3 raw defaults', () => {
  const options = parseCliArguments(
    [
      '--hdr',
      'frame.rgba16float',
      '--sdr-raw=frame.rgba8',
      '--width',
      '1280',
      '--height',
      '720',
      '--output',
      'frame.jpg'
    ],
    {ULTRAHDR_APP: '/tools/ultrahdr_app'}
  );

  assert.equal(options.highDynamicRangePath, 'frame.rgba16float');
  assert.equal(options.standardDynamicRangeRawPath, 'frame.rgba8');
  assert.equal(options.standardDynamicRangeJpegPath, undefined);
  assert.equal(options.highDynamicRangeGamut, 'display-p3');
  assert.equal(options.standardDynamicRangeGamut, 'display-p3');
  assert.equal(options.targetPeakNits, 1000);
  assert.equal(options.targetPeakNitsWasExplicitlySpecified, false);
  assert.equal(options.gainMapScale, 4);
  assert.equal(options.useMultiChannelGainMap, true);
  assert.equal(options.ultrahdrAppPath, '/tools/ultrahdr_app');
});

test('parseCliArguments rejects unknown, duplicate, and malformed options', () => {
  assert.throws(() => parseCliArguments(['--wat']), /Unknown option/);
  assert.throws(
    () => parseCliArguments(['--width', '1', '--width', '2']),
    /may only be specified once/
  );
  assert.throws(() => parseCliArguments(['--width', '1.5']), /must be an integer/);
  assert.throws(() => parseCliArguments(['--overwrite=yes']), /does not accept a value/);
});

test('resolveUltrahdrAppPath honors the build cache override', async context => {
  const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'luma-hdr-encoder-cache-'));
  context.after(async () => {
    await rm(cacheRoot, {recursive: true, force: true});
  });
  const executableName = process.platform === 'win32' ? 'ultrahdr_app.exe' : 'ultrahdr_app';
  const executableDirectory = path.join(
    cacheRoot,
    `libultrahdr-${LIBULTRAHDR_VERSION}`,
    'build',
    ...(process.platform === 'win32' ? ['Release'] : [])
  );
  const executablePath = path.join(executableDirectory, executableName);
  await mkdir(executableDirectory, {recursive: true});
  await writeFile(executablePath, 'test encoder');

  assert.equal(
    await resolveUltrahdrAppPath(undefined, {HDR_CAPTURE_CACHE_DIR: cacheRoot}),
    executablePath
  );
});

test('loadCaptureManifestOptions consumes the Playwright v2 paired raw artifact schema', async context => {
  const fixture = await createRawCaptureFixture(context, 7, 3);
  const manifestPath = await writeCaptureManifest(fixture);

  const options = await loadCaptureManifestOptions(manifestPath);

  assert.equal(options.captureManifestPath, manifestPath);
  assert.equal(options.captureManifestVersion, 2);
  assert.equal(options.exampleId, 'showcase/tempest-ocean');
  assert.equal(options.highDynamicRangePath, fixture.highDynamicRangePath);
  assert.equal(options.standardDynamicRangeRawPath, fixture.standardDynamicRangePath);
  assert.equal(options.width, fixture.width);
  assert.equal(options.height, fixture.height);
  assert.equal(options.highDynamicRangeGamut, 'display-p3');
  assert.equal(options.standardDynamicRangeGamut, 'display-p3');
  assert.equal(options.targetPeakNits, 1117);
});

test('capture manifest v1 remains compatible with the 1000-nit default', async context => {
  const fixture = await createRawCaptureFixture(context, 7, 3);
  const manifestPath = await writeCaptureManifest(fixture, {
    version: 1,
    exampleId: undefined,
    targetPeakNits: undefined
  });

  const manifestOptions = await loadCaptureManifestOptions(manifestPath);
  const parsedOptions = parseCliArguments([
    '--manifest',
    manifestPath,
    '--output',
    fixture.outputPath
  ]);
  const appliedOptions = await applyCaptureManifestOptions(parsedOptions);
  const explicitOptions = await applyCaptureManifestOptions(
    parseCliArguments([
      '--manifest',
      manifestPath,
      '--output',
      fixture.outputPath,
      '--target-peak-nits',
      '850'
    ])
  );

  assert.equal(manifestOptions.captureManifestVersion, 1);
  assert.equal(manifestOptions.exampleId, undefined);
  assert.equal(manifestOptions.targetPeakNits, 1000);
  assert.equal(appliedOptions.targetPeakNits, 1000);
  assert.equal(explicitOptions.targetPeakNits, 850);
});

test('v2 manifest peak applies unless the CLI target peak is explicit', async context => {
  const fixture = await createRawCaptureFixture(context, 7, 3);
  const manifestPath = await writeCaptureManifest(fixture);
  const commonArguments = ['--manifest', manifestPath, '--output', fixture.outputPath];

  const manifestOptions = await applyCaptureManifestOptions(parseCliArguments(commonArguments));
  const explicitOptions = await applyCaptureManifestOptions(
    parseCliArguments([...commonArguments, '--target-peak-nits', '900'])
  );

  assert.equal(manifestOptions.targetPeakNits, 1117);
  assert.equal(manifestOptions.targetPeakNitsWasExplicitlySpecified, false);
  assert.equal(explicitOptions.targetPeakNits, 900);
  assert.equal(explicitOptions.targetPeakNitsWasExplicitlySpecified, true);
  assertOptionValue(buildEncoderArguments(manifestOptions, fixture.outputPath), '-L', '1117');
  assertOptionValue(buildEncoderArguments(explicitOptions, fixture.outputPath), '-L', '900');
});

test('capture manifest v2 requires identity and bounded integer peak metadata', async context => {
  const fixture = await createRawCaptureFixture(context, 7, 3);

  let manifestPath = await writeCaptureManifest(fixture, {exampleId: undefined});
  await assert.rejects(
    loadCaptureManifestOptions(manifestPath),
    /exampleId must be a non-empty string/
  );

  manifestPath = await writeCaptureManifest(fixture, {targetPeakNits: undefined});
  await assert.rejects(
    loadCaptureManifestOptions(manifestPath),
    /manifest targetPeakNits must be an integer in \[203, 10000\]/
  );

  manifestPath = await writeCaptureManifest(fixture, {targetPeakNits: 1117.5});
  await assert.rejects(
    loadCaptureManifestOptions(manifestPath),
    /manifest targetPeakNits must be an integer in \[203, 10000\]/
  );

  manifestPath = await writeCaptureManifest(fixture, {targetPeakNits: 10001});
  await assert.rejects(
    loadCaptureManifestOptions(manifestPath),
    /manifest targetPeakNits must be an integer in \[203, 10000\]/
  );

  manifestPath = await writeCaptureManifest(fixture, {version: 3});
  await assert.rejects(loadCaptureManifestOptions(manifestPath), /version must be 1 or 2/);
});

test('capture manifest rejects incompatible layout and ambiguous CLI overrides', async context => {
  const fixture = await createRawCaptureFixture(context, 5, 2);
  const manifestPath = await writeCaptureManifest(fixture, {
    hdr: {bytesPerRow: fixture.width * 8 + 8}
  });
  await assert.rejects(
    loadCaptureManifestOptions(manifestPath),
    /HDR plane bytesPerRow must be 40/
  );

  const parsedOptions = parseCliArguments([
    '--manifest',
    manifestPath,
    '--hdr',
    fixture.highDynamicRangePath,
    '--output',
    fixture.outputPath
  ]);
  await assert.rejects(applyCaptureManifestOptions(parsedOptions), /cannot be combined with --hdr/);
});

test('readJpegDimensions parses SOF markers after metadata segments', () => {
  const jpegData = createJpegFixture(321, 123, {
    includeIso: true,
    includeXmp: true
  });
  assert.deepEqual(readJpegDimensions(jpegData), {width: 321, height: 123});
  assert.throws(() => readJpegDimensions(Buffer.from('not a jpeg')), /valid JPEG SOI/);
});

test('inspectGainMapJpeg reports ISO and XMP metadata independently', () => {
  const completeImage = inspectGainMapJpeg(
    createJpegFixture(16, 9, {includeIso: true, includeXmp: true})
  );
  assert.deepEqual(completeImage, {
    width: 16,
    height: 9,
    hasIsoGainMapMetadata: true,
    hasXmpPacket: true,
    hasXmpGainMapMetadata: true
  });

  const isoOnlyImage = inspectGainMapJpeg(
    createJpegFixture(16, 9, {includeIso: true, includeXmp: false})
  );
  assert.equal(isoOnlyImage.hasIsoGainMapMetadata, true);
  assert.equal(isoOnlyImage.hasXmpPacket, false);
  assert.equal(isoOnlyImage.hasXmpGainMapMetadata, false);
});

test('buildEncoderArguments selects raw SDR API inputs and linear RGBA16F', () => {
  const options = createParsedOptions('/tmp/capture', {
    highDynamicRangePath: '/tmp/capture/frame.rgba16float',
    standardDynamicRangeRawPath: '/tmp/capture/frame.rgba8',
    outputPath: '/tmp/capture/frame.jpg',
    ultrahdrAppPath: '/tmp/capture/ultrahdr_app'
  });
  const encoderArguments = buildEncoderArguments(options, '/tmp/capture/output.tmp.jpg');

  assertOptionValue(encoderArguments, '-a', '4');
  assertOptionValue(encoderArguments, '-t', '0');
  assertOptionValue(encoderArguments, '-C', '1');
  assertOptionValue(encoderArguments, '-b', '3');
  assertOptionValue(encoderArguments, '-c', '1');
  assertOptionValue(encoderArguments, '-M', '1');
  assert.equal(encoderArguments.includes('-y'), true);
  assert.equal(encoderArguments.includes('-i'), false);
});

test('encodeGainMapJpeg validates, invokes, probes, and publishes a paired raw capture', async context => {
  const fixture = await createRawCaptureFixture(context, 8, 4);
  const invocations = [];
  const options = createParsedOptions(fixture.directory, {
    highDynamicRangePath: fixture.highDynamicRangePath,
    standardDynamicRangeRawPath: fixture.standardDynamicRangePath,
    outputPath: fixture.outputPath,
    ultrahdrAppPath: fixture.encoderPath,
    width: fixture.width,
    height: fixture.height
  });

  const result = await encodeGainMapJpeg(options, {
    async runEncoder(executablePath, commandArguments) {
      invocations.push({executablePath, commandArguments});
      if (commandArguments.includes('-P')) {
        return {
          stdout: 'Ultra HDR Image: Yes\nGainMap Metadata:\n',
          stderr: ''
        };
      }
      const temporaryOutputPath = getOptionValue(commandArguments, '-z');
      await writeFile(
        temporaryOutputPath,
        createJpegFixture(fixture.width, fixture.height, {
          includeIso: true,
          includeXmp: true
        })
      );
      return {stdout: '', stderr: ''};
    }
  });

  assert.equal(invocations.length, 2);
  assert.equal(invocations[0].executablePath, fixture.encoderPath);
  assertOptionValue(invocations[0].commandArguments, '-p', fixture.highDynamicRangePath);
  assertOptionValue(invocations[0].commandArguments, '-y', fixture.standardDynamicRangePath);
  assert.equal(invocations[1].commandArguments.includes('-P'), true);
  assert.equal(result.inspection.hasIsoGainMapMetadata, true);
  assert.equal(result.inspection.hasXmpGainMapMetadata, true);

  const publishedImage = await readFile(fixture.outputPath);
  assert.deepEqual(readJpegDimensions(publishedImage), {
    width: fixture.width,
    height: fixture.height
  });
});

test('encodeGainMapJpeg accepts an authored dimension-matched SDR JPEG', async context => {
  const fixture = await createRawCaptureFixture(context, 6, 5);
  const standardDynamicRangeJpegPath = path.join(fixture.directory, 'authored-sdr.jpg');
  await writeFile(
    standardDynamicRangeJpegPath,
    createJpegFixture(fixture.width, fixture.height, {
      includeIso: false,
      includeXmp: false
    })
  );
  const options = createParsedOptions(fixture.directory, {
    highDynamicRangePath: fixture.highDynamicRangePath,
    standardDynamicRangeRawPath: undefined,
    standardDynamicRangeJpegPath,
    outputPath: fixture.outputPath,
    ultrahdrAppPath: fixture.encoderPath,
    width: fixture.width,
    height: fixture.height
  });
  let encodeArguments;

  await encodeGainMapJpeg(options, {
    async runEncoder(_executablePath, commandArguments) {
      if (commandArguments.includes('-P')) {
        return {stdout: 'Ultra HDR Image: Yes\n', stderr: ''};
      }
      encodeArguments = commandArguments;
      await writeFile(
        getOptionValue(commandArguments, '-z'),
        createJpegFixture(fixture.width, fixture.height, {
          includeIso: true,
          includeXmp: true
        })
      );
      return {stdout: '', stderr: ''};
    }
  });

  assertOptionValue(encodeArguments, '-i', standardDynamicRangeJpegPath);
  assert.equal(encodeArguments.includes('-y'), false);
});

test('encodeGainMapJpeg rejects padded raw data before invoking the encoder', async context => {
  const fixture = await createRawCaptureFixture(context, 4, 3);
  await writeFile(
    fixture.highDynamicRangePath,
    Buffer.alloc(fixture.width * fixture.height * 8 + 8)
  );
  const options = createParsedOptions(fixture.directory, {
    highDynamicRangePath: fixture.highDynamicRangePath,
    standardDynamicRangeRawPath: fixture.standardDynamicRangePath,
    outputPath: fixture.outputPath,
    ultrahdrAppPath: fixture.encoderPath,
    width: fixture.width,
    height: fixture.height
  });
  let invoked = false;

  await assert.rejects(
    encodeGainMapJpeg(options, {
      async runEncoder() {
        invoked = true;
        return {stdout: '', stderr: ''};
      }
    }),
    /expected exactly 96 bytes.*no per-row padding/
  );
  assert.equal(invoked, false);
});

test('encodeGainMapJpeg rejects output hard links that alias an input', async context => {
  const fixture = await createRawCaptureFixture(context, 4, 3);
  const originalHighDynamicRangeData = await readFile(fixture.highDynamicRangePath);
  await link(fixture.highDynamicRangePath, fixture.outputPath);
  const options = createParsedOptions(fixture.directory, {
    highDynamicRangePath: fixture.highDynamicRangePath,
    standardDynamicRangeRawPath: fixture.standardDynamicRangePath,
    outputPath: fixture.outputPath,
    ultrahdrAppPath: fixture.encoderPath,
    width: fixture.width,
    height: fixture.height,
    overwrite: true
  });

  await assert.rejects(encodeGainMapJpeg(options), /Output path aliases the HDR input/);
  assert.deepEqual(await readFile(fixture.highDynamicRangePath), originalHighDynamicRangeData);
});

test('encodeGainMapJpeg rejects output symbolic links', async context => {
  const fixture = await createRawCaptureFixture(context, 4, 3);
  const originalStandardDynamicRangeData = await readFile(fixture.standardDynamicRangePath);
  await symlink(fixture.standardDynamicRangePath, fixture.outputPath);
  const options = createParsedOptions(fixture.directory, {
    highDynamicRangePath: fixture.highDynamicRangePath,
    standardDynamicRangeRawPath: fixture.standardDynamicRangePath,
    outputPath: fixture.outputPath,
    ultrahdrAppPath: fixture.encoderPath,
    width: fixture.width,
    height: fixture.height,
    overwrite: true
  });

  await assert.rejects(encodeGainMapJpeg(options), /Output path must not be a symbolic link/);
  assert.deepEqual(
    await readFile(fixture.standardDynamicRangePath),
    originalStandardDynamicRangeData
  );
});

test('encodeGainMapJpeg rejects an encoder built without XMP metadata', async context => {
  const fixture = await createRawCaptureFixture(context, 4, 2);
  const options = createParsedOptions(fixture.directory, {
    highDynamicRangePath: fixture.highDynamicRangePath,
    standardDynamicRangeRawPath: fixture.standardDynamicRangePath,
    outputPath: fixture.outputPath,
    ultrahdrAppPath: fixture.encoderPath,
    width: fixture.width,
    height: fixture.height
  });

  await assert.rejects(
    encodeGainMapJpeg(options, {
      async runEncoder(_executablePath, commandArguments) {
        await writeFile(
          getOptionValue(commandArguments, '-z'),
          createJpegFixture(fixture.width, fixture.height, {
            includeIso: true,
            includeXmp: false
          })
        );
        return {stdout: '', stderr: ''};
      }
    }),
    /missing Ultra HDR XMP metadata.*UHDR_WRITE_XMP=ON/
  );
});

function createParsedOptions(directory, overrides) {
  return {
    highDynamicRangePath: path.join(directory, 'frame.rgba16float'),
    standardDynamicRangeRawPath: path.join(directory, 'frame.rgba8'),
    standardDynamicRangeJpegPath: undefined,
    outputPath: path.join(directory, 'frame.jpg'),
    ultrahdrAppPath: path.join(directory, 'ultrahdr_app'),
    width: 8,
    height: 4,
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
    ...overrides
  };
}

async function createRawCaptureFixture(context, width, height) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'luma-hdr-capture-'));
  context.after(async () => {
    await rm(directory, {recursive: true, force: true});
  });
  const highDynamicRangePath = path.join(directory, 'frame.rgba16float');
  const standardDynamicRangePath = path.join(directory, 'frame.rgba8');
  const outputPath = path.join(directory, 'frame.jpg');
  const encoderPath = path.join(directory, 'ultrahdr_app');
  await writeFile(highDynamicRangePath, Buffer.alloc(width * height * 8));
  await writeFile(standardDynamicRangePath, Buffer.alloc(width * height * 4));
  await writeFile(encoderPath, '#!/usr/bin/env sh\nexit 0\n');
  await chmod(encoderPath, 0o755);
  return {
    directory,
    width,
    height,
    highDynamicRangePath,
    standardDynamicRangePath,
    outputPath,
    encoderPath
  };
}

async function writeCaptureManifest(fixture, overrides = {}) {
  const manifestPath = path.join(fixture.directory, 'website-playwright-hdr.json');
  const {
    hdr: highDynamicRangeOverrides,
    sdr: standardDynamicRangeOverrides,
    ...manifestOverrides
  } = overrides;
  const manifest = {
    schema: 'luma.gl/hdr-screenshot-capture',
    version: 2,
    exampleId: 'showcase/tempest-ocean',
    targetPeakNits: 1117,
    width: fixture.width,
    height: fixture.height,
    orientation: 'top-down',
    hdr: {
      file: path.basename(fixture.highDynamicRangePath),
      format: 'rgba16float',
      colorSpace: 'display-p3',
      transfer: 'linear',
      bytesPerPixel: 8,
      bytesPerRow: fixture.width * 8,
      byteLength: fixture.width * fixture.height * 8,
      ...highDynamicRangeOverrides
    },
    sdr: {
      file: path.basename(fixture.standardDynamicRangePath),
      format: 'rgba8unorm-srgb',
      colorSpace: 'display-p3',
      transfer: 'srgb',
      bytesPerPixel: 4,
      bytesPerRow: fixture.width * 4,
      byteLength: fixture.width * fixture.height * 4,
      ...standardDynamicRangeOverrides
    },
    ...manifestOverrides
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestPath;
}

function createJpegFixture(width, height, options) {
  const segments = [Buffer.from([0xff, 0xd8])];
  if (options.includeXmp) {
    segments.push(
      createJpegSegment(
        0xe1,
        Buffer.from(`${XMP_PACKET_NAMESPACE}\0${XMP_GAIN_MAP_NAMESPACE}\0`, 'ascii')
      )
    );
  }
  if (options.includeIso) {
    segments.push(createJpegSegment(0xe2, Buffer.from(`${ISO_GAIN_MAP_NAMESPACE}\0`, 'ascii')));
  }
  segments.push(
    createJpegSegment(
      0xc0,
      Buffer.from([
        8,
        (height >> 8) & 0xff,
        height & 0xff,
        (width >> 8) & 0xff,
        width & 0xff,
        3,
        1,
        0x11,
        0,
        2,
        0x11,
        1,
        3,
        0x11,
        1
      ])
    ),
    Buffer.from([0xff, 0xd9])
  );
  return Buffer.concat(segments);
}

function createJpegSegment(marker, payload) {
  const segment = Buffer.alloc(payload.length + 4);
  segment[0] = 0xff;
  segment[1] = marker;
  segment.writeUInt16BE(payload.length + 2, 2);
  payload.copy(segment, 4);
  return segment;
}

function getOptionValue(commandArguments, optionName) {
  const optionIndex = commandArguments.indexOf(optionName);
  assert.notEqual(optionIndex, -1, `Expected encoder option ${optionName}`);
  return commandArguments[optionIndex + 1];
}

function assertOptionValue(commandArguments, optionName, expectedValue) {
  assert.equal(getOptionValue(commandArguments, optionName), expectedValue);
}
