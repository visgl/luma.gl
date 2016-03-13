/* eslint-disable max-statements */
import {
  ConeGeometry, CubeGeometry, CylinderGeometry, IcoSphereGeometry,
  PlaneGeometry, SphereGeometry
} from '../../src';
import test from 'tape';

const GEOMETRY_TESTS = [
  {Geometry: ConeGeometry, opts: {}},
  {Geometry: CubeGeometry, opts: {}},
  {Geometry: CylinderGeometry, opts: {}},
  {Geometry: IcoSphereGeometry, opts: {}},
  {Geometry: PlaneGeometry, opts: {}},
  {Geometry: SphereGeometry, opts: {}}
];

test('Object#Geometries', t => {
  for (const geometryTest of GEOMETRY_TESTS) {
    const {Geometry, opts} = geometryTest;
    t.ok(Geometry, 'Import of geometry class succceeded');

    const geometry = new Geometry(opts);
    t.assert(geometry.vertices instanceof Float32Array);
    t.assert(geometry.normals instanceof Float32Array);
    t.assert(geometry.texCoords instanceof Float32Array);
    t.assert(!geometry.indices || geometry.indices instanceof Uint16Array,
      'Indices (if present) must be Uint16Array');
  }
  t.end();
});
