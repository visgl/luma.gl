// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import test from 'node:test';

import {PNG} from 'pngjs';

import {
  assertCleanCaptureDiagnostics,
  comparePNGScreenshots,
  isKnownDocusaurusHydrationDiagnostic,
  parseCLIArguments
} from './capture-reference-evidence.mjs';

test('comparePNGScreenshots applies channel and differing-pixel tolerances', () => {
  const left = makePNG([
    [10, 20, 30, 255],
    [100, 100, 100, 255]
  ]);
  const right = makePNG([
    [15, 20, 30, 255],
    [130, 100, 100, 255]
  ]);

  const comparison = comparePNGScreenshots(left, right, {
    channelTolerance: 5,
    maximumDifferingPixelRatio: 0.5
  });

  assert.equal(comparison.differingPixelCount, 1);
  assert.equal(comparison.differingPixelRatio, 0.5);
  assert.equal(comparison.maximumAbsoluteChannelDifference, 30);
  assert.equal(comparison.passed, true);
  assert.deepEqual(
    [...PNG.sync.read(comparison.differencePNG).data.slice(4, 8)],
    [255, 0, 255, 255]
  );
});

test('comparePNGScreenshots rejects mismatched dimensions', () => {
  assert.throws(
    () => comparePNGScreenshots(makePNG([[0, 0, 0, 255]]), makePNG([[0, 0, 0, 255]], 1, 2)),
    /Screenshot dimensions differ/
  );
});

test('parseCLIArguments validates the ratio budget', () => {
  assert.deepEqual(parseCLIArguments(['--headless', '--software-gpu']), {
    artifactBase: undefined,
    baseUrl: 'http://127.0.0.1:3000',
    buildWebsite: true,
    channel: undefined,
    headless: true,
    help: false,
    maximumDifferingPixelRatio: 0.05,
    softwareGpu: true
  });
  assert.throws(
    () => parseCLIArguments(['--max-differing-pixel-ratio', '1.1']),
    /between 0 and 1/
  );
});

test('assertCleanCaptureDiagnostics only tolerates the known production-shell diagnostics', () => {
  const knownDiagnostic =
    'Docusaurus React Root onRecoverableError: Error: Minified React error #425; details';
  assert.equal(isKnownDocusaurusHydrationDiagnostic(knownDiagnostic), true);
  assert.doesNotThrow(() =>
    assertCleanCaptureDiagnostics(
      {
        consoleMessages: [{type: 'error', text: knownDiagnostic}],
        pageErrors: [],
        requestFailures: []
      },
      'webgpu-core'
    )
  );
  assert.throws(
    () =>
      assertCleanCaptureDiagnostics(
        {
          consoleMessages: [{type: 'error', text: 'WebGPU validation error'}],
          pageErrors: [],
          requestFailures: []
        },
        'webgpu-core'
      ),
    /1 browser diagnostic error/
  );
});

function makePNG(pixels, width = pixels.length, height = 1) {
  const image = new PNG({width, height});
  for (const [pixelIndex, pixel] of pixels.entries()) {
    image.data.set(pixel, pixelIndex * 4);
  }
  return PNG.sync.write(image);
}
