// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Run after yarn build: node scripts/benchmarks/shadertype-decoding.mjs
// Optionally pass a bundled shadertypes module to compare another revision.
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const {
  textureFormatDecoder,
  vertexFormatDecoder,
  dataTypeDecoder,
  shaderTypeDecoder
} = await import(pathToFileURL(resolve(process.argv[2] || 'modules/core/dist/shadertypes/index.js')));

const cases = [
  ['texture', () => textureFormatDecoder.getInfo('rgba32float'), 'bytesPerPixel'],
  ['vertex', () => vertexFormatDecoder.getVertexFormatInfo('float32x3'), 'byteLength'],
  ['scalar', () => dataTypeDecoder.getDataTypeInfo('float32'), 'byteLength'],
  ['attribute', () => shaderTypeDecoder.getAttributeShaderTypeInfo('vec3f'), 'components'],
  ['variable', () => shaderTypeDecoder.getVariableShaderTypeInfo('mat4x4f'), 'components']
];

const iterations = 1_000_000;
for (const [name, decode, field] of cases) {
  const coldStart = performance.now();
  const first = decode();
  const coldMicroseconds = (performance.now() - coldStart) * 1000;
  for (let index = 0; index < 10_000; index++) {
    decode();
  }
  const samples = [];
  let checksum = 0;
  for (let sample = 0; sample < 5; sample++) {
    const start = performance.now();
    for (let index = 0; index < iterations; index++) {
      checksum += decode()[field];
    }
    samples.push(performance.now() - start);
  }
  samples.sort((left, right) => left - right);
  // Identity measures metadata reuse, not total engine heap allocation.
  const uniqueResults = new Set(Array.from({length: 1000}, decode)).size;
  console.log(JSON.stringify({
    name, iterations, coldMicroseconds, medianMilliseconds: samples[2],
    uniqueResults, reusesFirst: decode() === first, checksum
  }));
}
