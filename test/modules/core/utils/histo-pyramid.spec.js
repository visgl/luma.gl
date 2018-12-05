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

import {Buffer, Transform, Texture2D} from 'luma.gl';
import GL from 'luma.gl/constants';
import test from 'tape-catch';
import {fixture} from 'luma.gl/test/setup';
import {equals} from 'math.gl';
import transformModule from '../../../../modules/core/src/shadertools/src/modules/transform/transform';
import {HP_BUILD_VS_UTILS} from '../../../../modules/core/src/utils/histo-pyramid';

const gl = fixture.gl2;

test('histo-pyramid#hp_getTexCoord', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const VS = `\
  uniform vec2 size;
  uniform vec2 scale;
  attribute vec2 offset;
  varying vec2 texcoord;

  void main()
  {
    texcoord = hp_getTexCoord(size, scale, offset);
  }
  `;

  // const size = new Buffer(gl, new Float32Array([2, 2]));
  // const scale = new Buffer(gl, new Float32Array([2, 2]));
  const offset = new Buffer(gl, new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    1, 1
  ]));
  const expectedTexcoord = [
    0.25, 0.25,
    0.75, 0.25,
    0.25, 0.75,
    0.75, 0.75
  ];

  const texcoord = new Buffer(gl, 8 * 4); // 8 floats
  const elementCount = 4;

  const transform = new Transform(gl, {
    sourceBuffers: {
      // size,
      // scale,
      offset
    },
    feedbackBuffers: {
      texcoord
    },
    vs: `${HP_BUILD_VS_UTILS}${VS}`,
    varyings: ['texcoord'],
    modules: [transformModule],
    elementCount
  });

  transform.run({
    uniforms: {
      size: [1, 1],
      scale: [2, 2]
    }
  });

//  const expectedData = new Float32Array([0,0]);
  const outData = transform.getBuffer('texcoord').getData();
  t.ok(equals(expectedTexcoord, outData), 'texcoordinates should match');
  t.end();
});


const HP_GETINPUT_VS = `\
attribute float inTexture;
varying float outTexture;
uniform vec2 pixelOffset;
void main()
{
  vec2 size = transform_uSize_outTexture;
  vec2 scale = vec2(2., 2.);
  vec4 pixel = hp_getInput(transform_uSampler_inTexture, size, scale, pixelOffset);
  outTexture = pixel.x;
}
`;

test('histo-pyramid#hp_getInput', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const WIDTH = 8;
  const HEIGHT = 8;
  const TEX_OPTIONS = {
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    mipmaps: false,
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    }
  };

  let sourceData = new Float32Array(WIDTH * HEIGHT).map((_, index) => index % WIDTH);

  /* eslint-disable no-multi-spaces */
  sourceData = new Float32Array([
    0, 1,  10, 11,  20, 21,  30, 31,
    2, 3,  12, 13,  22, 23,  32, 33,

    40, 41,  50, 51,  60, 61,  70, 71,
    42, 43,  52, 53,  62, 63,  72, 73,

    80, 81,  90, 91,  100, 101,  110, 111,
    82, 83,  92, 93,  102, 103,  112, 113,

    120, 121,  130, 131,  140, 141,  150, 151,
    122, 123,  132, 133,  142, 143,  152, 153
  ]);
  /* eslint-enable no-multi-spaces */

  const expectedArray = new Array(WIDTH * HEIGHT / 4).fill(0);
  const TEST_CASES = [
    {
      name: 'current-pixel',
      offset: [0, 0],
      expected: expectedArray.map((_, index) => index * 10)
    },
    {
      name: 'right-pixel',
      offset: [1, 0],
      expected: expectedArray.map((_, index) => index * 10 + 1)
    },
    {
      name: 'botom-pixel',
      offset: [0, 1],
      expected: expectedArray.map((_, index) => index * 10 + 2)
    },
    {
      name: 'botom-right-pixel',
      offset: [1, 1],
      expected: expectedArray.map((_, index) => index * 10 + 3)
    }
  ];

  const sourceTexture = new Texture2D(gl2, Object.assign({}, TEX_OPTIONS, {
    data: sourceData,
    width: WIDTH,
    height: HEIGHT
  }));

  const destinationTexture = new Texture2D(gl2, Object.assign({}, TEX_OPTIONS, {
    width: WIDTH / 2,
    height: HEIGHT / 2
  }));

  const SCALE = [2, 2];

  const dstPixelCount = WIDTH * HEIGHT / 4;

  const transform = new Transform(gl2, {
    _sourceTextures: {
      inTexture: sourceTexture
    },
    _targetTexture: destinationTexture,
    _targetTextureVarying: 'outTexture',
    vs: HP_BUILD_VS_UTILS + HP_GETINPUT_VS,
    elementCount: dstPixelCount
  });

  TEST_CASES.forEach(testCase => {
    const {name, offset, expected} = testCase;
    transform.run({uniforms: {
      scale: SCALE,
      pixelOffset: offset
    }});

    const outTexData = transform.getData({packed: true});

    t.deepEqual(outTexData, expected, `Transform should access neighbor pixels correctly for ${name}`);
  });

  t.end();
});

const HP_BUILD_VS = `\
attribute float inTexture;
varying float outTexture;

void main()
{
  vec2 size = transform_uSize_outTexture;
  vec2 scale = vec2(2., 2.);
  vec4 pixel = hp_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 0));
  vec4 rightPixel = hp_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 0));
  vec4 bottomPixel = hp_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 1));
  vec4 rightBottomPixel = hp_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 1));
  outTexture = pixel.x + rightPixel.x + bottomPixel.x + rightBottomPixel.x;
}
`;


test('histo-pyramid#Minification to 1X1)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const WIDTH = 2;
  const HEIGHT = 2;
  const TEX_OPTIONS = {
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    mipmaps: false,
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    }
  };

  const sourceData = new Float32Array([
    0, 1,
    2, 3
  ]);
  let expectedData = 0;
  sourceData.forEach(value => {
    expectedData += value;
  })

  const sourceTexture = new Texture2D(gl2, Object.assign({}, TEX_OPTIONS, {
    data: sourceData,
    width: WIDTH,
    height: HEIGHT
  }));

  const destinationTexture = new Texture2D(gl2, Object.assign({}, TEX_OPTIONS, {
    width: WIDTH / 2,
    height: HEIGHT / 2
  }));

  const SCALE = [2, 2];

  const elementCount = WIDTH * HEIGHT;

  const transform = new Transform(gl2, {
    _sourceTextures: {
      inTexture: sourceTexture
    },
    _targetTexture: destinationTexture,
    _targetTextureVarying: 'outTexture',
    vs: HP_BUILD_VS_UTILS + HP_BUILD_VS,
    elementCount
  });

  transform.run({uniforms: {
    scale: SCALE
  }});

  const outTexData = transform.getData({packed: true});

  t.deepEqual(outTexData, [expectedData], `Transform should access neighbor pixels correctly for 1X1 minification`);

  t.end();
});
