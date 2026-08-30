import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  captureAllHDRExamples,
  loadBatchCaptureManifest,
  parseArguments,
  publishStagedOutputs
} from './capture-all-hdr-examples.mjs';
import {
  HDR_EXAMPLE_CAPTURE_HEIGHT,
  HDR_EXAMPLE_CAPTURE_DELAY_MILLISECONDS,
  HDR_EXAMPLE_CAPTURE_WIDTH,
  HDR_EXAMPLE_CATALOG,
  HDR_EXAMPLE_FULL_WIDTH_VIEWPORT_WIDTH,
  HDR_EXAMPLE_VIEWPORT_HEIGHT,
  HDR_EXAMPLE_VIEWPORT_WIDTH
} from './hdr-example-catalog.mjs';

const EXPECTED_CATALOG = [
  ['showcase/gltf', 'website/static/images/examples/showcase/gltf.jpg', 10_000],
  [
    'showcase/instancing',
    'website/static/images/examples/showcase/instancing.jpg',
    HDR_EXAMPLE_FULL_WIDTH_VIEWPORT_WIDTH
  ],
  [
    'showcase/lightstorm-megacity',
    'website/static/images/examples/showcase/lightstorm-megacity.jpg'
  ],
  ['showcase/tempest-ocean', 'website/static/images/examples/showcase/tempest-ocean.jpg'],
  ['showcase/globe', 'website/static/images/examples/showcase/globe.jpg'],
  ['showcase/packet-spraying', 'website/static/images/examples/showcase/packet-spraying.jpg'],
  [
    'experimental/deferred-rendering',
    'website/static/images/examples/experimental/deferred-rendering.jpg',
    'webgpu-max'
  ],
  ['experimental/fluid-foundry', 'website/static/images/examples/experimental/fluid-foundry.jpg'],
  [
    'experimental/spectral-caustics',
    'website/static/images/examples/experimental/spectral-caustics.jpg'
  ],
  [
    'experimental/volumetric-fire-forge',
    'website/static/images/examples/experimental/volumetric-fire-forge.jpg'
  ],
  ['experimental/bloom', 'website/static/images/examples/experimental/bloom.jpg']
];

test('HDR catalog is the exact public 1280x720 gain-map set', () => {
  assert.equal(HDR_EXAMPLE_CAPTURE_WIDTH, 1280);
  assert.equal(HDR_EXAMPLE_CAPTURE_HEIGHT, 720);
  assert.equal(HDR_EXAMPLE_VIEWPORT_WIDTH, 1580);
  assert.equal(HDR_EXAMPLE_FULL_WIDTH_VIEWPORT_WIDTH, 1310);
  assert.equal(HDR_EXAMPLE_VIEWPORT_HEIGHT, 780);
  assert.equal(HDR_EXAMPLE_CAPTURE_DELAY_MILLISECONDS, 3000);
  assert.deepEqual(
    HDR_EXAMPLE_CATALOG.map(
      ({route, outputPath, captureDelayMilliseconds, viewportWidth, backend}) => [
        route,
        outputPath,
        ...(captureDelayMilliseconds === undefined ? [] : [captureDelayMilliseconds]),
        ...(viewportWidth === undefined ? [] : [viewportWidth]),
        ...(backend === undefined ? [] : [backend])
      ]
    ),
    EXPECTED_CATALOG
  );
  assert.equal(HDR_EXAMPLE_CATALOG.length, 11);
  assert.equal(
    HDR_EXAMPLE_CATALOG.every(example => !('targetPeakNits' in example)),
    true,
    'peak luminance comes from each version-2 manifest'
  );
});

test('batch capture is sequential, isolated, fixed-size, and manifest-peak driven', async context => {
  const temporaryRoot = await makeTemporaryDirectory(context);
  const catalog = makeTestCatalog(['showcase/alpha', 'experimental/beta']);
  const targetPeakByRoute = new Map([
    ['showcase/alpha', 812],
    ['experimental/beta', 1117]
  ]);
  const events = [];
  const artifactDirectories = new Set();

  const result = await captureAllHDRExamples(
    {
      catalog,
      repositoryRoot: temporaryRoot,
      runDirectory: path.join(temporaryRoot, 'run')
    },
    {
      encodeCaptureManifest: async options => {
        const manifest = JSON.parse(await readFile(options.manifestPath, 'utf8'));
        assert.equal(options.targetPeakNits, manifest.targetPeakNits);
        assert.equal(options.ultrahdrAppPath, '/fake/ultrahdr_app');
        events.push(`encode:${manifest.route}:${options.targetPeakNits}`);
        await mkdir(path.dirname(options.outputPath), {recursive: true});
        await writeFile(options.outputPath, `gain-map:${manifest.route}`);
      },
      loadOcularConfig: async () => ({examples: {}}),
      logger: {log() {}},
      publishStagedOutputs: async captures => {
        events.push('publish');
        assert.equal(captures.length, catalog.length);
        for (const capture of captures) {
          assert.match(await readFile(capture.stagedOutputPath, 'utf8'), /^gain-map:/);
        }
      },
      resolveUltrahdrAppPath: async () => '/fake/ultrahdr_app',
      runWebsiteExample: async options => {
        assert.equal(
          options.backend,
          catalog.find(example => example.route === options.example)?.backend ?? 'webgpu-core'
        );
        assert.equal(options.headless, false);
        assert.equal(options.highDynamicRangeCapture, true);
        assert.equal(options.keepOpen, false);
        assert.equal(options.skipScreenshot, true);
        assert.equal(
          options.captureDelayMilliseconds,
          catalog.find(example => example.route === options.example)?.captureDelayMilliseconds ??
            HDR_EXAMPLE_CAPTURE_DELAY_MILLISECONDS
        );
        assert.equal(
          options.viewportWidth,
          catalog.find(example => example.route === options.example)?.viewportWidth ??
            HDR_EXAMPLE_VIEWPORT_WIDTH
        );
        assert.equal(options.viewportHeight, HDR_EXAMPLE_VIEWPORT_HEIGHT);
        assert.equal(artifactDirectories.has(options.artifactDir), false);
        artifactDirectories.add(options.artifactDir);
        events.push(`capture:${options.example}`);

        await mkdir(options.artifactDir, {recursive: true});
        const manifestPath = path.join(options.artifactDir, 'website-playwright-hdr.json');
        await writeFile(
          manifestPath,
          JSON.stringify({
            schema: 'luma.gl/hdr-screenshot-capture',
            version: 2,
            exampleId: options.example,
            width: HDR_EXAMPLE_CAPTURE_WIDTH,
            height: HDR_EXAMPLE_CAPTURE_HEIGHT,
            targetPeakNits: targetPeakByRoute.get(options.example),
            route: options.example
          })
        );
        return {
          diagnostics: {consoleMessages: [], pageErrors: [], requestFailures: []},
          highDynamicRangeArtifacts: {manifestPath}
        };
      }
    }
  );

  assert.deepEqual(events, [
    'capture:showcase/alpha',
    'encode:showcase/alpha:812',
    'capture:experimental/beta',
    'encode:experimental/beta:1117',
    'publish'
  ]);
  assert.equal(artifactDirectories.size, 2);
  assert.equal(result.outputs.length, 2);
});

test('an encode failure prevents publication of every catalog image', async context => {
  const temporaryRoot = await makeTemporaryDirectory(context);
  const catalog = makeTestCatalog(['showcase/alpha', 'experimental/beta']);
  let publishCalled = false;

  for (const example of catalog) {
    const outputPath = path.join(temporaryRoot, example.outputPath);
    await mkdir(path.dirname(outputPath), {recursive: true});
    await writeFile(outputPath, `old:${example.route}`);
  }

  await assert.rejects(
    captureAllHDRExamples(
      {
        catalog,
        repositoryRoot: temporaryRoot,
        runDirectory: path.join(temporaryRoot, 'run')
      },
      {
        encodeCaptureManifest: async options => {
          if (options.targetPeakNits === 812) {
            await mkdir(path.dirname(options.outputPath), {recursive: true});
            await writeFile(options.outputPath, 'first staged output');
            return;
          }
          throw new Error('synthetic encoder failure');
        },
        loadOcularConfig: async () => ({}),
        logger: {log() {}},
        publishStagedOutputs: async () => {
          publishCalled = true;
        },
        resolveUltrahdrAppPath: async () => '/fake/ultrahdr_app',
        runWebsiteExample: async options => {
          await mkdir(options.artifactDir, {recursive: true});
          const manifestPath = path.join(options.artifactDir, 'website-playwright-hdr.json');
          await writeFile(
            manifestPath,
            JSON.stringify({
              schema: 'luma.gl/hdr-screenshot-capture',
              version: 2,
              exampleId: options.example,
              width: 1280,
              height: 720,
              targetPeakNits: options.example === 'showcase/alpha' ? 812 : 1117
            })
          );
          return {
            diagnostics: {consoleMessages: [], pageErrors: [], requestFailures: []},
            highDynamicRangeArtifacts: {manifestPath}
          };
        }
      }
    ),
    /synthetic encoder failure/
  );

  assert.equal(publishCalled, false);
  for (const example of catalog) {
    assert.equal(
      await readFile(path.join(temporaryRoot, example.outputPath), 'utf8'),
      `old:${example.route}`
    );
  }
});

test('publication prepares the complete set before replacing any catalog image', async context => {
  const temporaryRoot = await makeTemporaryDirectory(context);
  const backupRoot = path.join(temporaryRoot, 'backups');
  const catalog = makeTestCatalog(['showcase/alpha', 'experimental/beta']);
  const firstOutputPath = path.join(temporaryRoot, catalog[0].outputPath);
  const secondOutputPath = path.join(temporaryRoot, catalog[1].outputPath);
  const firstStagedPath = path.join(temporaryRoot, 'staged', 'alpha.jpg');
  const missingStagedPath = path.join(temporaryRoot, 'staged', 'missing-beta.jpg');
  await Promise.all([
    mkdir(path.dirname(firstOutputPath), {recursive: true}),
    mkdir(path.dirname(secondOutputPath), {recursive: true}),
    mkdir(path.dirname(firstStagedPath), {recursive: true})
  ]);
  await Promise.all([
    writeFile(firstOutputPath, 'old alpha'),
    writeFile(secondOutputPath, 'old beta'),
    writeFile(firstStagedPath, 'new alpha')
  ]);

  await assert.rejects(
    publishStagedOutputs(
      [
        {example: catalog[0], stagedOutputPath: firstStagedPath},
        {example: catalog[1], stagedOutputPath: missingStagedPath}
      ],
      {backupRoot, repositoryRoot: temporaryRoot}
    ),
    /ENOENT/
  );
  assert.equal(await readFile(firstOutputPath, 'utf8'), 'old alpha');
  assert.equal(await readFile(secondOutputPath, 'utf8'), 'old beta');
});

test('batch manifest rejects stale versions, wrong dimensions, and invalid peaks', async context => {
  const temporaryRoot = await makeTemporaryDirectory(context);
  const manifestPath = path.join(temporaryRoot, 'capture.json');
  const manifest = {
    schema: 'luma.gl/hdr-screenshot-capture',
    version: 2,
    exampleId: 'showcase/tempest-ocean',
    width: 1280,
    height: 720,
    targetPeakNits: 1117
  };
  await writeFile(manifestPath, JSON.stringify(manifest));
  assert.equal((await loadBatchCaptureManifest(manifestPath)).targetPeakNits, 1117);

  await writeFile(manifestPath, JSON.stringify({...manifest, version: 1}));
  await assert.rejects(loadBatchCaptureManifest(manifestPath), /version 2/);
  await writeFile(manifestPath, JSON.stringify({...manifest, width: 1279}));
  await assert.rejects(loadBatchCaptureManifest(manifestPath), /expected 1280x720/);
  await writeFile(manifestPath, JSON.stringify({...manifest, targetPeakNits: 202}));
  await assert.rejects(loadBatchCaptureManifest(manifestPath), /targetPeakNits/);
  await writeFile(manifestPath, JSON.stringify({...manifest, exampleId: ''}));
  await assert.rejects(loadBatchCaptureManifest(manifestPath), /exampleId/);
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(
    loadBatchCaptureManifest(manifestPath, 'showcase/gltf'),
    /belongs to showcase\/tempest-ocean; expected showcase\/gltf/
  );
});

test('batch CLI parses reproducibility-related options', () => {
  assert.deepEqual(
    parseArguments([
      '--artifact-base=artifacts',
      '--base-url',
      'http://127.0.0.1:4000',
      '--channel=chromium',
      '--headless',
      '--software-gpu',
      '--ultrahdr-app',
      '/tools/ultrahdr_app'
    ]),
    {
      artifactBaseDirectory: 'artifacts',
      baseUrl: 'http://127.0.0.1:4000',
      channel: 'chromium',
      headless: true,
      help: false,
      softwareGpu: true,
      ultrahdrAppPath: '/tools/ultrahdr_app'
    }
  );
});

function makeTestCatalog(routes) {
  return routes.map(route => ({
    id: route.replace('/', '-'),
    route,
    outputPath: `website/static/images/examples/${route}.jpg`
  }));
}

async function makeTemporaryDirectory(context) {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'luma-hdr-batch-'));
  context.after(() => rm(temporaryDirectory, {recursive: true, force: true}));
  return temporaryDirectory;
}
