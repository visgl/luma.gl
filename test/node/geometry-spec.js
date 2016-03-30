/* eslint-disable max-statements */
import {
  ConeGeometry, CubeGeometry, CylinderGeometry, IcoSphereGeometry,
  PlaneGeometry, SphereGeometry
} from '../../src';
import test from 'tape-catch';

const GEOMETRY_TESTS = [
  {name: 'Cone', Geometry: ConeGeometry, opts: {}},
  {name: 'Cube', Geometry: CubeGeometry, opts: {}},
  {name: 'Cylinder', Geometry: CylinderGeometry, opts: {}},
  {name: 'IcoSphere', Geometry: IcoSphereGeometry, opts: {}},
  {name: 'Plane', Geometry: PlaneGeometry, opts: {}},
  {name: 'Sphere', Geometry: SphereGeometry, opts: {}}
];

test('Object#Geometries', t => {
  for (const geometryTest of GEOMETRY_TESTS) {
    const {name, Geometry, opts} = geometryTest;
    const geometry = new Geometry(opts);
    t.assert(geometry.vertices instanceof Float32Array,
      `${name}Geometry: expected vertices to be Float32Array`);
    t.assert(geometry.normals instanceof Float32Array,
      `${name}Geometry: expected normals to be Float32Array`);
    t.assert(geometry.texCoords instanceof Float32Array,
      `${name}Geometry: expected textCoords to be Float32Array`);
    t.assert(!geometry.indices || geometry.indices instanceof Uint16Array,
      `${name}Geometry: indices (if present) must be Uint16Array`);
  }
  t.end();
});
