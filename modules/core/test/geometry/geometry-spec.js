import test from 'tape-catch';
import {
  ConeGeometry,
  CubeGeometry,
  CylinderGeometry,
  IcoSphereGeometry,
  PlaneGeometry,
  SphereGeometry
} from '@luma.gl/core';

const GEOMETRY_TESTS = [
  {name: 'ConeGeometry', Geometry: ConeGeometry, props: {}},
  {name: 'CubeGeometry', Geometry: CubeGeometry, props: {}},
  {name: 'CylinderGeometry', Geometry: CylinderGeometry, props: {}},
  {name: 'IcoSphereGeometry', Geometry: IcoSphereGeometry, props: {}},
  {name: 'PlaneGeometry', Geometry: PlaneGeometry, props: {}},
  {name: 'SphereGeometry', Geometry: SphereGeometry, props: {}}
];

test('Object#Geometries', t => {
  for (const geometryTest of GEOMETRY_TESTS) {
    const {name, Geometry, props} = geometryTest;
    const geometry = new Geometry(props);

    t.assert(typeof geometry.drawMode, 'number', `${name}: .drawMode is a number`);
    t.assert(typeof geometry.mode, 'number', `${name}: .mode is a number`);
    t.assert(typeof geometry.vertexCount, 'number', `${name}: .vertexCount is a number`);

    const {attributes, indices} = geometry;

    let array;

    array = attributes.POSITION && attributes.POSITION.value;
    t.assert(array instanceof Float32Array, `${name}: POSITION is Float32Array`);

    array = attributes.NORMAL && attributes.NORMAL.value;
    t.assert(array instanceof Float32Array, `${name}: NORMAL is Float32Array`);

    array = attributes.TEXCOORD_0 && attributes.TEXCOORD_0.value;
    t.assert(array instanceof Float32Array, `${name}: TEXCOORD_0 is Float32Array`);

    array = indices && indices.value;
    t.assert(
      !array || array instanceof Uint16Array || array instanceof Uint32Array,
      `${name}: indices (if present) must be Uint{16/32}Array`
    );
  }
  t.end();
});

test('Object#Geometries', t => {
  for (const geometryTest of GEOMETRY_TESTS) {
    const {name, Geometry, props} = geometryTest;
    const geometry = new Geometry({...props, attributeMap: false});

    // Backwards compatible map
    const attributes = geometry.getAttributes();

    let array;

    array = attributes.POSITION && attributes.POSITION.value;
    t.assert(array instanceof Float32Array, `${name}: POSITION is Float32Array`);

    array = attributes.NORMAL && attributes.NORMAL.value;
    t.assert(array instanceof Float32Array, `${name}: NORMAL is Float32Array`);

    array = attributes.TEXCOORD_0 && attributes.TEXCOORD_0.value;
    t.assert(array instanceof Float32Array, `${name}: TEXCOORD_0 is Float32Array`);

    array = attributes.indices && attributes.indices.value;
    t.assert(
      !array || array instanceof Uint16Array || array instanceof Uint32Array,
      `${name}: indices (if present) must be Uint{16/32}Array`
    );
  }
  t.end();
});
