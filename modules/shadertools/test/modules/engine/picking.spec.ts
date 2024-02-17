// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';

import {BufferTransform} from '@luma.gl/engine';
import {picking} from '@luma.gl/shadertools';

/* eslint-disable camelcase */

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
    highlightedObjectColor: null,
    isPicked: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    highlightedObjectColor: [255, 255, 255],
    isPicked: [0, 0, 0, 0, 0, 0, 0, 1, 0]
  },
  {
    highlightedObjectColor: [255, 100, 150],
    isPicked: [0, 1, 0, 0, 0, 0, 0, 0, 0]
  }
];

test('picking#getUniforms', (t) => {
  t.deepEqual(picking.getUniforms({}), {}, 'Empty input');

  t.deepEqual(
    picking.getUniforms({
      isActive: true,
      highlightedObjectColor: undefined,
      highlightColor: [255, 0, 0]
    }),
    {
      isActive: true,
      isAttribute: false,
      highlightColor: [1, 0, 0, 1]
    }, 'Undefined input (no change to highlighted object)');

  t.deepEqual(
    picking.getUniforms({
      isActive: true,
      highlightedObjectColor: null,
      highlightColor: [255, 0, 0]
    }),
    {
      isActive: true,
      isAttribute: false,
      isHighlightActive: false,
      highlightColor: [1, 0, 0, 1]
    }, 'Null input (clear highlighted object)');

  t.deepEqual(
    picking.getUniforms({
      highlightedObjectColor: [0, 0, 1],
      highlightColor: [102, 0, 0, 51]
    }),
    {
      isHighlightActive: true,
      highlightedObjectColor: [0, 0, 1],
      highlightColor: [0.4, 0, 0, 0.2]
    }, 'Picked input (set highlighted object)'
  );

  t.deepEqual(
    picking.getUniforms({
      highlightedObjectColor: [0, 0, 1],
      highlightColor: [102, 0, 0, 51],
      useFloatColors: false
    }),
    {
      useFloatColors: false,
      isHighlightActive: true,
      highlightedObjectColor: [0, 0, 1],
      highlightColor: [0.4, 0, 0, 0.2],
    }, 'Override useFloatColors'
  );

  t.end();
});

// TODO(v9): Restore picking tests.
test.skip('picking#isVertexPicked(highlightedObjectColor invalid)', async (t) => {
  if (!BufferTransform.isSupported(webglDevice)) {
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

  const vertexCount = vertexColorData.length / 3;
  const vertexColor = webglDevice.createBuffer(vertexColorData);
  const isPicked = webglDevice.createBuffer({byteLength: vertexCount * 4});

  const transform = new BufferTransform(webglDevice, {
    // @ts-expect-error
    sourceBuffers: {
      vertexColor
    },
    feedbackBuffers: {
      isPicked
    },
    vs: VS,
    varyings: ['isPicked'],
    modules: [picking],
    vertexCount
  });

  await Promise.all(TEST_CASES.map(async (testCase) => {
    const uniforms = picking.getUniforms({
      highlightedObjectColor: testCase.highlightedObjectColor
    });

    transform.model.setUniforms(uniforms);
    transform.run();

    const expectedData = testCase.isPicked;
    const outData = await transform.readAsync('isPicked');

    t.deepEqual(outData, expectedData, 'Vertex should correctly get picked');
  }));

  t.end();
});

// TODO(v9): Restore picking tests.
/* eslint-disable max-nested-callbacks */
test.skip('picking#picking_setPickingColor', async (t) => {
  if (!BufferTransform.isSupported(webglDevice)) {
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

  const vertexCount = vertexColorData.length / 3;
  const vertexColor = webglDevice.createBuffer(vertexColorData);
  const rgbColorASelected = webglDevice.createBuffer({byteLength: vertexCount * 4});

  const transform = new BufferTransform(webglDevice, {
    attributes: {vertexColor},
    bufferLayout: [{name: 'vertexColor', format: 'float32'}],
    feedbackBuffers: {rgbColorASelected},
    vs: VS,
    varyings: ['rgbColorASelected'],
    modules: [picking],
    vertexCount
  });

  await Promise.all(TEST_CASES.map(async (testCase) => {
    const uniforms = picking.getUniforms({
      highlightedObjectColor: testCase.highlightedObjectColor,
      // @ts-expect-error
      pickingThreshold: testCase.pickingThreshold
    });

    transform.model.setUniforms(uniforms);
    transform.run();

    const outData = await transform.readAsync('rgbColorASelected');

    t.deepEqual(outData, testCase.isPicked, 'Vertex should correctly get picked');
  }));
  t.ok(true, 'picking_setPickingColor successful');

  t.end();
});
/* eslint-enable max-nested-callbacks */
