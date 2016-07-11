/* eslint-disable max-statements, max-len */
import {
  ConeGeometry, CubeGeometry, CylinderGeometry, IcoSphereGeometry,
  PlaneGeometry, SphereGeometry
} from '../../src/headless';
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

    let array;

    array = geometry.hasAttribute('positions') && geometry.getArray('positions');
    t.assert(array instanceof Float32Array,
      `${name}Geometry: expected positions to be Float32Array`);

    array = geometry.hasAttribute('normals') && geometry.getArray('normals');
    t.assert(array instanceof Float32Array,
      `${name}Geometry: expected normals to be Float32Array`);

    array = geometry.hasAttribute('texCoords') && geometry.getArray('texCoords');
    t.assert(array instanceof Float32Array,
      `${name}Geometry: expected textCoords to be Float32Array`);

    array = geometry.hasAttribute('indices') && geometry.getArray('indices');
    t.assert(!array || array instanceof Uint16Array,
      `${name}Geometry: indices (if present) must be Uint16Array`);
  }
  t.end();
});
