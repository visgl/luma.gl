// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Geometry as MathGeometry, CubeGeometry as MathCubeGeometry} from '@math.gl/geometry';
import {NullDevice} from '@luma.gl/test-utils';
import {
  Model,
  Geometry,
  IcoSphereGeometry,
  TruncatedConeGeometry,
  CylinderGeometry,
  ConeGeometry,
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

test('explicit math.gl attribute selection resolves shader aliases in caller order', () => {
  const geometry = new MathGeometry({
    topology: 'point-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array([0, 0, 0])},
      positions: {size: 3, value: new Float32Array([1, 2, 3])}
    }
  });
  for (const attributes of [
    ['POSITION', 'positions'],
    ['positions', 'POSITION']
  ]) {
    const interleaved = makeInterleavedGeometry(geometry, {attributes});
    expect(interleaved.bufferLayout[0].attributes).toEqual([
      {attribute: 'positions', format: 'float32x3', byteOffset: 0}
    ]);
    expect(new Float32Array(interleaved.attributes['geometry'].value.buffer)).toEqual(
      geometry.attributes[attributes[1]].value
    );
  }
});

test('missing selected shader aliases do not erase existing geometry attributes', () => {
  const geometry = new MathGeometry({
    topology: 'point-list',
    attributes: {POSITION: {size: 3, value: new Float32Array([1, 2, 3])}}
  });
  const interleaved = makeInterleavedGeometry(geometry, {attributes: ['POSITION', 'positions']});
  expect(interleaved.bufferLayout[0].attributes).toEqual([
    {attribute: 'positions', format: 'float32x3', byteOffset: 0}
  ]);
  expect(new Float32Array(interleaved.attributes['geometry'].value.buffer)).toEqual(
    geometry.attributes['POSITION'].value
  );
});

test('Geometry accepts frozen attribute descriptors without modifying them', () => {
  const attribute = Object.freeze({size: 3, value: new Float32Array([0, 0, 0])});
  const geometry = new Geometry({topology: 'point-list', attributes: {POSITION: attribute}});
  expect(geometry.attributes['POSITION'].value).toBe(attribute.value);
  expect(geometry.vertexCount).toBe(1);
  expect(Object.keys(attribute)).toEqual(['size', 'value']);
});

test('remaining primitive adapters preserve dimensions, subdivisions, caps, and overrides', () => {
  const sphere = new IcoSphereGeometry({radius: 2, iterations: 1});
  expect(sphere.vertexCount).toBe(240);
  const spherePositions = sphere.attributes['POSITION'].value;
  for (let index = 0; index < spherePositions.length; index += 3) {
    expect(Math.hypot(...spherePositions.slice(index, index + 3))).toBeCloseTo(2);
  }
  for (const verticalAxis of ['x', 'y', 'z'] as const) {
    for (const Primitive of [TruncatedConeGeometry, CylinderGeometry, ConeGeometry]) {
      const uncapped = new Primitive({
        radius: 2,
        bottomRadius: 2,
        topRadius: 1,
        height: 4,
        nradial: 8,
        nvertical: 2,
        verticalAxis,
        cap: false
      });
      const capped = new Primitive({
        radius: 2,
        bottomRadius: 2,
        topRadius: 1,
        height: 4,
        nradial: 8,
        nvertical: 2,
        verticalAxis,
        cap: true,
        topCap: true,
        bottomCap: true
      });
      expect(uncapped.vertexCount).toBe(96);
      expect(capped.vertexCount).toBeGreaterThan(uncapped.vertexCount);
      const axisIndex = {x: 0, y: 1, z: 2}[verticalAxis];
      const positions = uncapped.attributes['POSITION'].value;
      const heights = Array.from(positions).filter((value, index) => index % 3 === axisIndex);
      expect(Math.min(...heights)).toBe(-2);
      expect(Math.max(...heights)).toBe(2);
      const radii = Array.from({length: positions.length / 3}, (value, vertexIndex) =>
        Math.hypot(
          ...Array.from(positions.slice(vertexIndex * 3, vertexIndex * 3 + 3)).filter(
            (coordinate, index) => index !== axisIndex
          )
        )
      );
      expect(Math.max(...radii)).toBeCloseTo(2);
    }
  }
  for (const Primitive of [
    IcoSphereGeometry,
    TruncatedConeGeometry,
    CylinderGeometry,
    ConeGeometry
  ]) {
    const source = new Primitive();
    const attribute = {
      size: 3,
      value: new Float32Array(source.attributes['POSITION'].value.length).fill(7)
    };
    const overridden = new Primitive({attributes: {POSITION: attribute}});
    expect(overridden.attributes['POSITION'].value).toBe(attribute.value);
  }
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
