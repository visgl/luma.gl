// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync, writeFileSync, statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';

/** Directory containing the four pinned upstream files documented in the fixture README. */
const directory = process.argv[2];
assert(directory, 'Usage: node scripts/advection/generate-gfs-fixture.mjs SOURCE_DIRECTORY');
/** Generated fixture destination. */
const destination = new URL(
  '../../modules/graph/test/experimental/simulation/fixtures/gfs-atlantic.json',
  import.meta.url
);
/** Pinned upstream bytes; reject accidental regeneration from a different archive. */
const expectedHashes = {
  '2016112000.png': '6f1a05f464b389598a68a3d13ab0cfe172b98cfe983c42296ca83f0a75913258',
  '2016112006.png': '0511d1e04f3181eb4c68bd42b5828e2d77de1d00aa2a2a2cd46b7ded273c2811',
  '2016112000.json': 'fd20350343af9bcb1bf4dc527015b735d9d58258dc45823e5e529ec868781047',
  '2016112006.json': 'c7c5a9e1dc6b9f00989d48789123201e2a20caddb0987a614d644d878d63c98f'
};
/** Verify source provenance before decoding. */
function readSource(name) {
  const bytes = readFileSync(directory + '/' + name);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHashes[name]);
  return bytes;
}
/** Geographic sample-center bounds of the Atlantic crop. */
const bounds = [-85, 20, -55, 50];
/** Longitude samples. */
const width = 31;
/** Latitude samples. */
const height = 31;
/** The two six-hourly GFS model snapshots. */
const dates = ['2016112000', '2016112006'];
/** Decode only the crop, preserving the upstream quantized values. */
const snapshots = dates.map(stamp => {
  const pngBytes = readSource(stamp + '.png');
  const metadataBytes = readSource(stamp + '.json');
  const image = PNG.sync.read(pngBytes);
  const metadata = JSON.parse(metadataBytes);
  const eastward = [];
  const northward = [];
  for (let latitude = bounds[1]; latitude <= bounds[3]; latitude++) {
    for (let longitude = bounds[0]; longitude <= bounds[2]; longitude++) {
      const offset = ((90 - latitude) * image.width + longitude + 180) * 4;
      eastward.push(
        Number(
          (metadata.uMin + ((metadata.uMax - metadata.uMin) * image.data[offset]) / 255).toFixed(6)
        )
      );
      northward.push(
        Number(
          (
            metadata.vMin +
            ((metadata.vMax - metadata.vMin) * image.data[offset + 1]) / 255
          ).toFixed(6)
        )
      );
    }
  }
  return {
    date: metadata.date,
    pngSha256: createHash('sha256').update(pngBytes).digest('hex'),
    metadataSha256: createHash('sha256').update(metadataBytes).digest('hex'),
    eastward,
    northward
  };
});
/** Match GPU input rounding while retaining double-precision reference arithmetic. */
const fields = snapshots.map(snapshot => ({
  eastward: Float32Array.from(snapshot.eastward),
  northward: Float32Array.from(snapshot.northward)
}));
/** Independent bilinear interpolation on the cropped regular grid. */
function sample(component, longitude, latitude) {
  const horizontal = longitude - bounds[0];
  const vertical = latitude - bounds[1];
  if (horizontal < 0 || horizontal > 30 || vertical < 0 || vertical > 30)
    throw Error('Reference left fixture bounds');
  const column = Math.min(29, Math.floor(horizontal));
  const row = Math.min(29, Math.floor(vertical));
  const horizontalFraction = horizontal - column;
  const verticalFraction = vertical - row;
  const lower =
    component[row * width + column] * (1 - horizontalFraction) +
    component[row * width + column + 1] * horizontalFraction;
  const upper =
    component[(row + 1) * width + column] * (1 - horizontalFraction) +
    component[(row + 1) * width + column + 1] * horizontalFraction;
  return lower * (1 - verticalFraction) + upper * verticalFraction;
}
/** Convert interpolated model velocities to geographic derivatives in degrees per second. */
function derivative(position, time) {
  const weight = time / 21600;
  const components = ['eastward', 'northward'].map(
    name =>
      sample(fields[0][name], ...position) * (1 - weight) +
      sample(fields[1][name], ...position) * weight
  );
  const metresPerDegree = (6371008.8 * Math.PI) / 180;
  return [
    components[0] / (metresPerDegree * Math.cos((position[1] * Math.PI) / 180)),
    components[1] / metresPerDegree
  ];
}
/** Independent fixed-step classical RK4, distinct from the GPU Fehlberg integrator. */
function step(position, time, deltaTime) {
  const first = derivative(position, time);
  const second = derivative(
    position.map((value, index) => value + (deltaTime * first[index]) / 2),
    time + deltaTime / 2
  );
  const third = derivative(
    position.map((value, index) => value + (deltaTime * second[index]) / 2),
    time + deltaTime / 2
  );
  const fourth = derivative(
    position.map((value, index) => value + deltaTime * third[index]),
    time + deltaTime
  );
  return position.map(
    (value, index) =>
      value +
      (deltaTime * (first[index] + 2 * second[index] + 2 * third[index] + fourth[index])) / 6
  );
}
/** Four releases safely inside the crop for a six-hour trajectory. */
const seeds = [
  [-70, 35],
  [-65, 30],
  [-75, 40],
  [-60, 45]
];
/** Retain hourly reference positions, starting from the same float32-normalized seeds as the GPU. */
function integrate(deltaTime) {
  let positions = seeds.map(position =>
    position.map((value, index) => bounds[index] + Math.fround((value - bounds[index]) / 30) * 30)
  );
  const frames = [{time: 0, positions}];
  for (let time = 0; time < 21600; time += deltaTime) {
    positions = positions.map(position => step(position, time, deltaTime));
    if ((time + deltaTime) % 3600 === 0) frames.push({time: time + deltaTime, positions});
  }
  return frames;
}
/** Reference integrated at 15 seconds. */
const reference = integrate(15);
/** Independent refinement comparison at 30 seconds. */
const coarse = integrate(30);
/** Maximum tangent-plane distance between the two reference step sizes. */
let maximumReferenceDifferenceMetres = 0;
for (let frame = 0; frame < reference.length; frame++)
  for (let particle = 0; particle < seeds.length; particle++) {
    const fine = reference[frame].positions[particle];
    const other = coarse[frame].positions[particle];
    maximumReferenceDifferenceMetres = Math.max(
      maximumReferenceDifferenceMetres,
      (Math.hypot((fine[0] - other[0]) * Math.cos((fine[1] * Math.PI) / 180), fine[1] - other[1]) *
        6371008.8 *
        Math.PI) /
        180
    );
  }
/** Versioned data and reproducible reference evidence; no network is used by tests. */
const fixture = {
  sourceRepository: 'https://github.com/mapbox/webgl-wind',
  sourceRevision: 'b1f6468d90d2f39763a8795a5042f316a32ff3c8',
  description: 'NOAA GFS 10 m model winds via the Mapbox 8-bit PNG archive; not observations',
  bounds,
  shape: [height, width],
  timeRange: [0, 21600],
  seeds,
  snapshots,
  reference: {
    method: 'Independent double-precision RK4 with bilinear space/linear time sampling',
    timeStep: 15,
    comparisonTimeStep: 30,
    maximumReferenceDifferenceMetres,
    frames: reference
  }
};
writeFileSync(destination, JSON.stringify(fixture, null, 2) + '\n');
console.log(
  JSON.stringify({
    maximumReferenceDifferenceMetres,
    final: reference.at(-1),
    bytes: statSync(destination).size
  })
);
