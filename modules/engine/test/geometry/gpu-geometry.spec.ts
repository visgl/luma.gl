// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('CubeGeometry exposes stable face indices for indexed and non-indexed cubes', () => {
  const indexedCube = new CubeGeometry({indices: true});
  const nonIndexedCube = new CubeGeometry({indices: false});

  expect(indexedCube.attributes.faceIndex, 'indexed cube includes faceIndex').toBeTruthy();
  expect(
    indexedCube.attributes.faceIndex?.value,
    'indexed cube stores one semantic face id per duplicated vertex'
  ).toEqual(
    new Uint32Array([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5])
  );
  expect(nonIndexedCube.attributes.faceIndex, 'non-indexed cube includes faceIndex').toBeTruthy();
  expect(
    nonIndexedCube.attributes.faceIndex?.value,
    'non-indexed cube preserves semantic face ids across its vertex block order'
  ).toEqual(
    new Uint32Array([
      3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 1,
      1, 1, 1, 1, 1
    ])
  );
});

it('makeGPUGeometry interleaves built-in geometry attributes', async () => {
  const device = await getWebGLTestDevice();

  for (const {name, Geometry} of BUILT_IN_GEOMETRY_TESTS) {
    const gpuGeometry = makeGPUGeometry(device, new Geometry());
    const bufferLayout = gpuGeometry.bufferLayout[0];

    expect(Object.keys(gpuGeometry.attributes), `${name}: has one vertex buffer`).toEqual([
      'geometry'
    ]);
    expect(gpuGeometry.bufferLayout.length, `${name}: has one buffer layout`).toBe(1);
    expect(bufferLayout.name, `${name}: buffer layout is named geometry`).toBe('geometry');
    expect(
      bufferLayout.attributes?.length,
      `${name}: buffer layout maps geometry attributes`
    ).toBeTruthy();
    expect(gpuGeometry.indices, `${name}: keeps index buffer`).toBeTruthy();

    gpuGeometry.destroy();
  }
});

it('makeGPUGeometry interleaves cube geometry into one vertex buffer', async () => {
  const device = await getWebGLTestDevice();
  const gpuGeometry = makeGPUGeometry(device, new CubeGeometry({indices: true}));

  expect(gpuGeometry.bufferLayout).toEqual([
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
  expect(gpuGeometry.attributes.geometry.byteLength, 'cube has one interleaved vertex buffer').toBe(
    24 * 36
  );
  expect(gpuGeometry.vertexCount, 'indexed cube draw count is preserved').toBe(36);
  expect(gpuGeometry.indices, 'indexed cube keeps index buffer').toBeTruthy();

  gpuGeometry.destroy();
});
