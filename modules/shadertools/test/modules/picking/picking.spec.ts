// luma.gl, MIT license

import {Buffer, Transform} from '@luma.gl/webgl-legacy';
import {picking} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';
import {fixture} from 'test/setup';

/* eslint-disable camelcase */

// TODO: test WebGL1 when Transform class is ready
/** @type {WebGL2RenderingContext} */
const gl = fixture.gl2;

const TEST_DATA = {
  vertexColorData: new Float32Array([
    0,
    0,
    0,
    255,
    100,
    150,
    50,
    50,
    50,
    251,
    103,
    153, // is picked only when threshold is 5
    150,
    100,
    255,
    254.5,
    100,
    150, // is picked with default threshold (1)
    100,
    150,
    255,
    255,
    255,
    255,
    255,
    100,
    149.5 // // is picked with default threshold (1)
  ])
};

const TEST_CASES = [
  {
    pickingSelectedColor: null,
    isPicked: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    pickingSelectedColor: [255, 255, 255],
    isPicked: [0, 0, 0, 0, 0, 0, 0, 1, 0]
  },
  {
    pickingSelectedColor: [255, 100, 150],
    isPicked: [0, 1, 0, 0, 0, 0, 0, 0, 0]
  }
];

test('picking#getUniforms', (t) => {
  // @ts-expect-error
  t.deepEqual(picking.getUniforms({}), {}, 'Empty input');

  t.deepEqual(
    // @ts-expect-error
    picking.getUniforms({
      pickingActive: true,
      pickingSelectedColor: null,
      pickingHighlightColor: [255, 0, 0]
    }),
    {
      picking_uSelectedColorValid: 0,
      picking_uHighlightColor: [1, 0, 0, 1],
      picking_uActive: true,
      picking_uAttribute: false
    }
  );

  t.deepEqual(
    // @ts-expect-error
    picking.getUniforms({
      pickingSelectedColor: [0, 0, 1],
      pickingHighlightColor: [255, 0, 0, 51]
    }),
    {
      picking_uSelectedColorValid: 1,
      picking_uSelectedColor: [0, 0, 1],
      picking_uHighlightColor: [1, 0, 0, 0.2]
    }
  );

  t.end();
});

test('picking#isVertexPicked(pickingSelectedColor invalid)', (t) => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const VS = `\
  attribute vec3 vertexColor;
  varying float isPicked;

  void main()
  {
    isPicked = float(isVertexPicked(vertexColor));
  }
  `;
  const vertexColorData = TEST_DATA.vertexColorData;

  const elementCount = vertexColorData.length / 3;
  const vertexColor = new Buffer(gl, vertexColorData);
  const isPicked = new Buffer(gl, {byteLength: elementCount * 4});

  const transform = new Transform(gl, {
    sourceBuffers: {
      vertexColor
    },
    feedbackBuffers: {
      isPicked
    },
    vs: VS,
    varyings: ['isPicked'],
    modules: [picking],
    elementCount
  });

  TEST_CASES.forEach((testCase) => {
    // @ts-expect-error
    const uniforms = picking.getUniforms({
      pickingSelectedColor: testCase.pickingSelectedColor
    });

    transform.run({uniforms});

    const expectedData = testCase.isPicked;
    const outData = transform.getBuffer('isPicked').getData();

    t.deepEqual(outData, expectedData, 'Vertex should correctly get picked');
  });

  t.end();
});

/* eslint-disable max-nested-callbacks */
test('picking#picking_setPickingColor', (t) => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }
  const VS = `\
  attribute vec3 vertexColor;
  varying float rgbColorASelected;

  void main()
  {
    picking_setPickingColor(vertexColor);
    rgbColorASelected = picking_vRGBcolor_Avalid.a;
  }
  `;

  const vertexColorData = TEST_DATA.vertexColorData;

  const elementCount = vertexColorData.length / 3;
  const vertexColor = new Buffer(gl, vertexColorData);
  const rgbColorASelected = new Buffer(gl, {byteLength: elementCount * 4});

  const transform = new Transform(gl, {
    sourceBuffers: {
      vertexColor
    },
    feedbackBuffers: {
      rgbColorASelected
    },
    vs: VS,
    varyings: ['rgbColorASelected'],
    modules: [picking],
    elementCount
  });

  TEST_CASES.forEach((testCase) => {
    const uniforms = picking.getUniforms({
      pickingSelectedColor: testCase.pickingSelectedColor,
      // @ts-expect-error
      pickingThreshold: testCase.pickingThreshold
    });

    transform.run({uniforms});

    const outData = transform.getBuffer('rgbColorASelected').getData();

    t.deepEqual(outData, testCase.isPicked, 'Vertex should correctly get picked');
  });
  t.ok(true, 'picking_setPickingColor successful');

  t.end();
});
/* eslint-enable max-nested-callbacks */
