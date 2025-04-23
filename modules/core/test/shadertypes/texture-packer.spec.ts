// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape';
import {TexturePacker} from '@luma.gl/core'; // adjust path as needed

function makeSequentialData(length: number): Uint8Array {
  const data = new Uint8Array(length);
  for (let i = 0; i < length; i++) data[i] = i % 251;
  return data;
}

test('TexturePacker#round-trip for 2D texture', t => {
  const width = 4;
  const height = 2;
  const bytesPerRow = 8; // padded
  const rowsPerImage = height;
  const layers = 1;

  const unpaddedSize = width * height;
  const paddedSize = bytesPerRow * rowsPerImage * layers;

  const source = makeSequentialData(unpaddedSize);
  const padded = new Uint8Array(paddedSize);
  const packed = new Uint8Array(unpaddedSize);

  TexturePacker.alignDataToBuffer({
    source,
    target: padded,
    bytesPerRow,
    rowsPerImage,
    depthOrArrayLayers: layers
  });

  TexturePacker.packDataFromBuffer({
    source: padded,
    target: packed,
    bytesPerRow,
    rowsPerImage,
    depthOrArrayLayers: layers
  });

  t.deepEqual(packed, source, '2D round-trip succeeds');
  t.end();
});

test('TexturePacker#round-trip for 3D/2D-array texture', t => {
  const width = 4;
  const height = 2;
  const layers = 3;
  const bytesPerRow = 8;
  const rowsPerImage = height;

  const unpaddedSize = width * height * layers;
  const paddedSize = bytesPerRow * rowsPerImage * layers;

  const source = makeSequentialData(unpaddedSize);
  const padded = new Uint8Array(paddedSize);
  const packed = new Uint8Array(unpaddedSize);

  TexturePacker.alignDataToBuffer({
    source,
    target: padded,
    bytesPerRow,
    rowsPerImage,
    depthOrArrayLayers: layers
  });

  TexturePacker.packDataFromBuffer({
    source: padded,
    target: packed,
    bytesPerRow,
    rowsPerImage,
    depthOrArrayLayers: layers
  });

  t.deepEqual(packed, source, '3D / 2D-array round-trip succeeds');
  t.end();
});

test('TexturePacker#round-trip for cube texture (6 faces)', t => {
  const width = 2;
  const height = 2;
  const layers = 6; // cube
  const bytesPerRow = 4;
  const rowsPerImage = height;

  const unpaddedSize = width * height * layers;
  const paddedSize = bytesPerRow * rowsPerImage * layers;

  const source = makeSequentialData(unpaddedSize);
  const padded = new Uint8Array(paddedSize);
  const packed = new Uint8Array(unpaddedSize);

  TexturePacker.alignDataToBuffer({
    source,
    target: padded,
    bytesPerRow,
    rowsPerImage,
    depthOrArrayLayers: layers
  });

  TexturePacker.packDataFromBuffer({
    source: padded,
    target: packed,
    bytesPerRow,
    rowsPerImage,
    depthOrArrayLayers: layers
  });

  t.deepEqual(packed, source, 'cube map (6 layers) round-trip succeeds');
  t.end();
});

test('TexturePacker#round-trip for cube array (12 layers)', t => {
  const width = 2;
  const height = 2;
  const layers = 12; // cube-array (e.g. 2 cubes)
  const bytesPerRow = 4;
  const rowsPerImage = height;

  const unpaddedSize = width * height * layers;
  const paddedSize = bytesPerRow * rowsPerImage * layers;

  const source = makeSequentialData(unpaddedSize);
  const padded = new Uint8Array(paddedSize);
  const packed = new Uint8Array(unpaddedSize);

  TexturePacker.alignDataToBuffer({
    source,
    target: padded,
    bytesPerRow,
    rowsPerImage,
    depthOrArrayLayers: layers
  });

  TexturePacker.packDataFromBuffer({
    source: padded,
    target: packed,
    bytesPerRow,
    rowsPerImage,
    depthOrArrayLayers: layers
  });

  t.deepEqual(packed, source, 'cube map array (12 layers) round-trip succeeds');
  t.end();
});
