// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  ConeGeometry,
  CubeGeometry,
  CylinderGeometry,
  IcoSphereGeometry,
  PlaneGeometry,
  SphereGeometry,
  TruncatedConeGeometry
} from '@luma.gl/engine';
import {makeGPUGeometry} from '@luma.gl/engine/geometry/gpu-geometry';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

const BUILT_IN_GEOMETRY_TESTS = [
  {name: 'ConeGeometry', Geometry: ConeGeometry},
  {name: 'CubeGeometry', Geometry: CubeGeometry},
  {name: 'CylinderGeometry', Geometry: CylinderGeometry},
  {name: 'IcoSphereGeometry', Geometry: IcoSphereGeometry},
  {name: 'PlaneGeometry', Geometry: PlaneGeometry},
  {name: 'SphereGeometry', Geometry: SphereGeometry},
  {name: 'TruncatedConeGeometry', Geometry: TruncatedConeGeometry}
];

test('CubeGeometry exposes stable face indices for indexed and non-indexed cubes', t => {
  const indexedCube = new CubeGeometry({indices: true});
  const nonIndexedCube = new CubeGeometry({indices: false});

  t.ok(indexedCube.attributes.faceIndex, 'indexed cube includes faceIndex');
  t.deepEqual(
    indexedCube.attributes.faceIndex?.value,
    new Uint32Array([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5]),
    'indexed cube stores one semantic face id per duplicated vertex'
  );
  t.ok(nonIndexedCube.attributes.faceIndex, 'non-indexed cube includes faceIndex');
  t.deepEqual(
    nonIndexedCube.attributes.faceIndex?.value,
    new Uint32Array([
      3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 1,
      1, 1, 1, 1, 1
    ]),
    'non-indexed cube preserves semantic face ids across its vertex block order'
  );

  t.end();
});

test('makeGPUGeometry interleaves built-in geometry attributes', async t => {
  const device = await getWebGLTestDevice();

  for (const {name, Geometry} of BUILT_IN_GEOMETRY_TESTS) {
    const gpuGeometry = makeGPUGeometry(device, new Geometry());
    const bufferLayout = gpuGeometry.bufferLayout[0];

    t.deepEqual(
      Object.keys(gpuGeometry.attributes),
      ['geometry'],
      `${name}: has one vertex buffer`
    );
    t.is(gpuGeometry.bufferLayout.length, 1, `${name}: has one buffer layout`);
    t.is(bufferLayout.name, 'geometry', `${name}: buffer layout is named geometry`);
    t.ok(bufferLayout.attributes?.length, `${name}: buffer layout maps geometry attributes`);
    t.ok(gpuGeometry.indices, `${name}: keeps index buffer`);

    gpuGeometry.destroy();
  }

  t.end();
});

test('makeGPUGeometry interleaves cube geometry into one vertex buffer', async t => {
  const device = await getWebGLTestDevice();
  const gpuGeometry = makeGPUGeometry(device, new CubeGeometry({indices: true}));

  t.deepEqual(gpuGeometry.bufferLayout, [
    {
      name: 'geometry',
      stepMode: 'vertex',
      byteStride: 36,
      attributes: [
        {attribute: 'positions', format: 'float32x3', byteOffset: 0},
        {attribute: 'normals', format: 'float32x3', byteOffset: 12},
        {attribute: 'texCoords', format: 'float32x2', byteOffset: 24},
        {attribute: 'faceIndex', format: 'uint32', byteOffset: 32}
      ]
    }
  ]);
  t.is(
    gpuGeometry.attributes.geometry.byteLength,
    24 * 36,
    'cube has one interleaved vertex buffer'
  );
  t.is(gpuGeometry.vertexCount, 36, 'indexed cube draw count is preserved');
  t.ok(gpuGeometry.indices, 'indexed cube keeps index buffer');

  gpuGeometry.destroy();
  t.end();
});
