// Copyright (c) 2015 - 2018 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import {Buffer, Transform} from '@luma.gl/core';
import {picking} from '@luma.gl/shadertools';
import test from 'tape-catch';
import {fixture} from 'test/setup';

// TODO: test WebGL1 when Transform class is ready
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
    isPicked: [0, 1, 0, 0, 0, 1, 0, 0, 1]
  },
  {
    pickingSelectedColor: [255, 100, 150],
    pickingThreshold: 5,
    isPicked: [0, 1, 0, 1, 0, 1, 0, 0, 1]
  }
];

test('picking#isVertexPicked(pickingSelectedColor invalid)', t => {
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

  TEST_CASES.forEach(testCase => {
    const uniforms = picking.getUniforms({
      pickingSelectedColor: testCase.pickingSelectedColor,
      pickingThreshold: testCase.pickingThreshold
    });

    transform.run({uniforms});

    const expectedData = testCase.isPicked;
    const outData = transform.getBuffer('isPicked').getData();

    t.deepEqual(outData, expectedData, 'Vertex should correctly get picked');
  });

  t.end();
});

/* eslint-disable max-nested-callbacks */
test('picking#picking_setPickingColor', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }
  const VS = `\
  attribute vec3 vertexColor;
  varying vec4 rgbColorASelected;

  void main()
  {
    picking_setPickingColor(vertexColor);
    rgbColorASelected = picking_vRGBcolor_Aselected;
  }
  `;

  const COLOR_SCALE = 1 / 255;
  const EPSILON = 0.00001;
  const vertexColorData = TEST_DATA.vertexColorData;

  const elementCount = vertexColorData.length / 3;
  const vertexColor = new Buffer(gl, vertexColorData);
  const rgbColorASelected = new Buffer(gl, {byteLength: elementCount * 4 * 4});

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

  TEST_CASES.forEach(testCase => {
    const uniforms = picking.getUniforms({
      pickingSelectedColor: testCase.pickingSelectedColor,
      pickingThreshold: testCase.pickingThreshold
    });

    transform.run({uniforms});

    const expectedData = testCase.isPicked.reduce((result, element, index) => {
      const pickingColor = TEST_DATA.vertexColorData
        .slice(index * 3, index * 3 + 3)
        .map(e => e * COLOR_SCALE);
      result.push(pickingColor[0], pickingColor[1], pickingColor[2], element);
      return result;
    }, []);
    const outData = transform.getBuffer('rgbColorASelected').getData();

    outData.forEach((out, index) => {
      if (Math.abs(out - expectedData[index]) > EPSILON) {
        t.ok(false, 'Vertex should correctly get picked');
      }
    });
  });
  t.ok(true, 'picking_setPickingColor successful');

  t.end();
});
/* eslint-enable max-nested-callbacks */
