// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TypedArrayConstructor} from '@math.gl/types';
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

const GEOMETRY_TESTS = [
  {name: 'ConeGeometry', Geometry: ConeGeometry, props: [{height: 2}, {verticalAxis: 'z'}]},
  {name: 'CubeGeometry', Geometry: CubeGeometry},
  {
    name: 'CylinderGeometry',
    Geometry: CylinderGeometry,
    props: [{verticalAxis: 'z'}, {topCap: true, bottomCap: true}, {height: 2}]
  },
  {
    name: 'IcoSphereGeometry',
    Geometry: IcoSphereGeometry,
    props: [{iterations: 2}]
  },
  {
    name: 'PlaneGeometry',
    Geometry: PlaneGeometry,
    props: [
      {flipCull: true, unpack: true},
      {type: 'x,z'},
      {type: 'x,z', flipCull: true},
      {type: 'y,z'},
      {type: 'y,z', flipCull: true},
      {type: null, _shouldThrow: true}
    ]
  },
  {name: 'SphereGeometry', Geometry: SphereGeometry},
  {name: 'TruncatedConeGeometry', Geometry: TruncatedConeGeometry}
];

function checkAttribute(attribute, type: TypedArrayConstructor[] = [Float32Array]) {
  return (
    attribute &&
    attribute.value &&
    type.some(t => attribute.value instanceof t) &&
    attribute.value.length > 0 &&
    attribute.value.every(Number.isFinite)
  );
}

export function registerGeometriesTests(): void {
  it('Object#Geometries', () => {
    for (const geometryTest of GEOMETRY_TESTS) {
      const {name, Geometry} = geometryTest;
      const testProps = [undefined].concat(geometryTest.props || []);

      for (const props of testProps) {
        if (props?._shouldThrow) {
          expect(() => new Geometry(props), `${name}: should throw`).toThrow();
          continue; // eslint-disable-line no-continue
        }

        const geometry = new Geometry(props);

        expect(typeof geometry.topology, `${name}: .topology is a string`).toBe('string');
        expect(typeof geometry.vertexCount, `${name}: .vertexCount is a number`).toBe('number');
        expect(geometry.vertexCount > 0, `${name}: .vertexCount is positive`).toBe(true);

        const attributes = geometry.attributes;

        expect(checkAttribute(attributes.POSITION), `${name}: POSITION is Float32Array`).toBe(true);
        expect(checkAttribute(attributes.NORMAL), `${name}: NORMAL is Float32Array`).toBe(true);
        expect(checkAttribute(attributes.TEXCOORD_0), `${name}: TEXCOORD_0 is Float32Array`).toBe(
          true
        );
        expect(geometry.bufferLayout.length > 0, `${name}: bufferLayout is populated`).toBe(true);
        if (geometry.indices) {
          expect(
            checkAttribute(geometry.indices, [Uint16Array, Uint32Array]),
            `${name}: indices is Uint{16/32}Array`
          ).toBe(true);
        }
      }
    }
  });
}
