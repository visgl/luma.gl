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

import {Buffer, Transform} from 'luma.gl';
import test from 'tape-catch';
import {default as pack} from '../../../../modules/imageprocessing/src/modules/pack';
import {fixture} from 'luma.gl/test/setup';
// TODO: test WebGL1 when Transform class is ready
const gl = fixture.gl2;

const EPSILON = 1e-5;

// failure when EPSILON = 1e-6
// expected: 100.54000091552734 actual: 100.54000854492188 diff: 0.00000762939453125

// failure when EPSILON = 1e-7
// expected: 1.2640000581741333 actual: 1.2640001773834229 diff: 1.1920928955078125e-7

// Random floats
const TEST_DATA = [1e-4, 1e4, 1e-6, 1.264, 100.54, -321.4872, 0, -0.231, 0.8082];

test('pack#floatToRGBA8tofloat)', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const VS = `\
  attribute float inFloat;
  varying float outFloat;

  void main()
  {
    vec4 rgba8 = pack_floatToRGBA8(inFloat);
    outFloat = pack_RGBA8ToFloat(rgba8);
  }
  `;

  const inputData = new Float32Array(TEST_DATA);
  const elementCount = inputData.length;
  const input = new Buffer(gl, inputData);
  const output = new Buffer(gl, {bytes: elementCount * 4});

  const transform = new Transform(gl, {
    sourceBuffers: {
      inFloat: input
    },
    feedbackBuffers: {
      outFloat: output
    },
    vs: VS,
    varyings: ['outFloat'],
    modules: [pack],
    elementCount
  });

  transform.run();

  const outData = transform.getBuffer('outFloat').getData();
  t.equal(inputData.length, outData.length, 'Array length should match');
  inputData.forEach((element, index) => {
    const diff = Math.abs(element - outData[index]);
    if (diff > EPSILON) {
      t.fail(
        `Invalid data found at index: ${index} expected: ${element} actual: ${
          outData[index]
        } diff: ${diff}`
      );
    }
  });

  t.ok(true, 'Packing float to RGBA to float passed');
  t.end();
});
