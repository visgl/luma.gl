// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Geometry as MathGeometry, CubeGeometry as MathCubeGeometry} from '@math.gl/geometry';
import {NullDevice} from '@luma.gl/test-utils';
import {
  Model,
  CubeGeometry,
  PlaneGeometry,
  SphereGeometry,
  makeInterleavedGeometry
} from '@luma.gl/engine';
import {makeGPUGeometry} from '../../src/geometry/gpu-geometry';

test('Model uploads math.gl geometry and preserves CPU semantics at the shader boundary', () => {
  const device = new NullDevice({});
  const geometry = new MathCubeGeometry();
  const model = new Model(device, {
    geometry,
    vs: '#version 300 es\nin vec3 positions; void main() { gl_Position = vec4(positions, 1.0); }',
    fs: '#version 300 es\nprecision highp float; out vec4 color; void main() { color = vec4(1.0); }'
  });
  expect(Object.keys(geometry.attributes)).toEqual(['POSITION', 'NORMAL', 'TEXCOORD_0']);
  expect(model.vertexCount).toBe(36);
  expect(model.bufferLayout[0].attributes?.map(attribute => attribute.attribute)).toEqual([
    'positions',
    'normals',
    'texCoords'
  ]);
  model.destroy();
  device.destroy();
});

test('direct math.gl geometry keeps last-input-wins shader bindings without CPU aliases', () => {
  const geometry = new MathGeometry({
    topology: 'point-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array([0, 0, 0])},
      positions: {size: 3, value: new Float32Array([1, 2, 3])}
    }
  });
  const interleaved = makeInterleavedGeometry(geometry);
  expect(interleaved.bufferLayout[0].attributes).toEqual([
    {attribute: 'positions', format: 'float32x3', byteOffset: 0}
  ]);
  expect(new Float32Array(interleaved.attributes['geometry'].value.buffer)).toEqual(
    new Float32Array([1, 2, 3])
  );
  expect(Object.keys(geometry.attributes)).toEqual(['POSITION', 'positions']);
});

test('compatibility cubes retain size, semantic face ids, and indexed or expanded uploads', () => {
  const device = new NullDevice({});
  for (const indices of [true, false]) {
    const geometry = new CubeGeometry({indices});
    const normals = geometry.attributes['NORMAL'].value;
    const faces = geometry.attributes['faceIndex'].value;
    const positions = geometry.attributes['POSITION'].value;
    expect(Math.max(...positions)).toBe(1);
    expect(Math.min(...positions)).toBe(-1);
    for (let vertexIndex = 0; vertexIndex < faces.length; vertexIndex++) {
      const normal = Array.from(normals.slice(vertexIndex * 3, vertexIndex * 3 + 3));
      expect(normal).toEqual(
        [
          [0, 0, 1],
          [0, 0, -1],
          [0, 1, 0],
          [0, -1, 0],
          [1, 0, 0],
          [-1, 0, 0]
        ][faces[vertexIndex]]
      );
    }
    const gpuGeometry = makeGPUGeometry(device, geometry);
    expect(gpuGeometry.vertexCount).toBe(36);
    expect(Boolean(gpuGeometry.indices)).toBe(indices);
    gpuGeometry.destroy();
  }
  device.destroy();
});

test('compatibility planes retain orientation and winding for every axis pair', () => {
  for (const type of ['x,y', 'x,z', 'y,z'] as const) {
    for (const flipCull of [false, true]) {
      const geometry = new PlaneGeometry({type, flipCull, offset: 2, unpack: true});
      const positions = geometry.attributes['POSITION'].value;
      const normal = geometry.attributes['NORMAL'].value;
      const firstEdge = [0, 1, 2].map(component => positions[3 + component] - positions[component]);
      const secondEdge = [0, 1, 2].map(
        component => positions[6 + component] - positions[component]
      );
      const cross = [
        firstEdge[1] * secondEdge[2] - firstEdge[2] * secondEdge[1],
        firstEdge[2] * secondEdge[0] - firstEdge[0] * secondEdge[2],
        firstEdge[0] * secondEdge[1] - firstEdge[1] * secondEdge[0]
      ];
      expect(cross.reduce((sum, value, index) => sum + value * normal[index], 0)).toBeGreaterThan(
        0
      );
      expect(geometry.indices).toBeUndefined();
      expect(geometry.vertexCount).toBe(6);
    }
  }
});

test('compatibility spheres preserve longitude texture coordinates', () => {
  const geometry = new SphereGeometry();
  const positions = geometry.attributes['POSITION'].value;
  const texCoords = geometry.attributes['TEXCOORD_0'].value;
  for (let vertexIndex = 0; vertexIndex < positions.length / 3; vertexIndex++) {
    const longitude = texCoords[vertexIndex * 2] * Math.PI * 2;
    const latitude = (1 - texCoords[vertexIndex * 2 + 1]) * Math.PI;
    expect(positions[vertexIndex * 3]).toBeCloseTo(Math.cos(longitude) * Math.sin(latitude));
    expect(positions[vertexIndex * 3 + 1]).toBeCloseTo(Math.cos(latitude));
    expect(positions[vertexIndex * 3 + 2]).toBeCloseTo(Math.sin(longitude) * Math.sin(latitude));
  }
});
