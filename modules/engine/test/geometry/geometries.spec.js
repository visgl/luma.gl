import test from 'tape-promise/tape';
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
  {name: 'ConeGeometry', Geometry: ConeGeometry},
  {name: 'CubeGeometry', Geometry: CubeGeometry},
  {
    name: 'CylinderGeometry',
    Geometry: CylinderGeometry,
    props: [{verticalAxis: 'z'}, {topCap: true, bottomCap: true}]
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

function checkAttribute(attribute, type = [Float32Array]) {
  return (
    attribute &&
    attribute.value &&
    type.some((t) => attribute.value instanceof t) &&
    attribute.value.length > 0 &&
    attribute.value.every(Number.isFinite)
  );
}

test('Object#Geometries', (t) => {
  for (const geometryTest of GEOMETRY_TESTS) {
    const {name, Geometry} = geometryTest;
    // `undefined` tests the default props
    const testProps = [undefined].concat(geometryTest.props || []);

    for (const props of testProps) {
      if (props && props._shouldThrow) {
        t.throws(() => new Geometry(props), `${name}: should throw`);
        continue; // eslint-disable-line
      }

      const geometry = new Geometry(props);

      t.is(typeof geometry.drawMode, 'number', `${name}: .drawMode is a number`);
      t.is(typeof geometry.mode, 'number', `${name}: .mode is a number`);
      t.is(typeof geometry.vertexCount, 'number', `${name}: .vertexCount is a number`);

      const attributes = geometry.getAttributes();

      t.ok(checkAttribute(attributes.POSITION), `${name}: POSITION is Float32Array`);
      t.ok(checkAttribute(attributes.NORMAL), `${name}: NORMAL is Float32Array`);
      t.ok(checkAttribute(attributes.TEXCOORD_0), `${name}: TEXCOORD_0 is Float32Array`);
      if (attributes.indices) {
        t.ok(
          checkAttribute(attributes.indices, [Uint16Array, Uint32Array]),
          `${name}: indices is Uint{16/32}Array`
        );
      }
    }
  }
  t.end();
});
