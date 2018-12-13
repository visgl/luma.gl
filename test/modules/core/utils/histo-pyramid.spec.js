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
import {HISTOPYRAMID_BUILD_VS_UTILS, buildHistopyramidBaseLevel} from '../../../../modules/core/src/utils/histo-pyramid';

const gl = fixture.gl2;

test('histo-pyramid#histoPyramid_getTexCoord', t => {
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
    texcoord = histoPyramid_getTexCoord(size, scale, offset);
  }
  `;

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
      offset
    },
    feedbackBuffers: {
      texcoord
    },
    vs: `${HISTOPYRAMID_BUILD_VS_UTILS}${VS}`,
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

  const outData = transform.getBuffer('texcoord').getData();
  t.ok(equals(expectedTexcoord, outData), 'texcoordinates should match');
  t.end();
});

test('histo-pyramid#histoPyramid_getPixelIndices', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const VS = `\
  attribute float dummyAttribute;
  varying vec2 pixelIndices;
  uniform vec2 size;

  void main()
  {
    pixelIndices = histoPyramid_getPixelIndices(size);
    // pixelIndices.x = float(transform_elementID);
    // pixelIndices.y = size.x;
  }
  `;
  function getExpected(size) {
    const result = [];
    for(let y = 0; y < size[1]; y++) {
      for(let x = 0; x < size[1]; x++) {
        result.push(x, y);
      }
    }
    return result;
  }
  const TEST_CASES = [
    {
      size: [2, 2],
    },
    {
      size: [3, 3]
    },
    {
      size: [4, 4]
    }
  ];

  const pixelIndices = new Buffer(gl, 10 * 10 * 2 * 4); // enough to hold 10X10 size
  const transform = new Transform(gl, {
    _sourceTextures: {
      // dummy attribute to enable texture functionality
      inTexture: new Texture2D(gl)
    },
    feedbackBuffers: {
      pixelIndices
    },
    vs: `${HISTOPYRAMID_BUILD_VS_UTILS}${VS}`,
    varyings: ['pixelIndices'],
    modules: [transformModule],
    elementCount: 1
  });

  TEST_CASES.forEach(testCase => {
    const {size} = testCase;
    const expected = getExpected(size);
    const elementCount = size[0]*size[1];
      transform.update({elementCount});
      transform.run({
        uniforms: {
          size
        }
      });

      const outData = transform.getBuffer('pixelIndices').getData().slice(0, expected.length);
      t.ok(equals(expected, outData), 'pixelIndices should match');
  });

  t.end();
});

const HISTOPYRAMID_GETINPUT_VS = `\
attribute float inTexture;
varying float outTexture;
uniform vec2 pixelOffset;
void main()
{
  vec2 size = transform_uSize_outTexture;
  vec2 scale = vec2(2., 2.);
  vec4 pixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, pixelOffset);
  outTexture = pixel.x;
}
`;

test('histo-pyramid#histoPyramid_getInput', t => {
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
    vs: HISTOPYRAMID_BUILD_VS_UTILS + HISTOPYRAMID_GETINPUT_VS,
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

const HISTOPYRAMID_BUILD_VS = `\
attribute float inTexture;
varying float outTexture;

void main()
{
  vec2 size = transform_uSize_outTexture;
  vec2 scale = vec2(2., 2.);
  vec4 pixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 0));
  vec4 rightPixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 0));
  vec4 bottomPixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 1));
  vec4 rightBottomPixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 1));
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
    vs: HISTOPYRAMID_BUILD_VS_UTILS + HISTOPYRAMID_BUILD_VS,
    elementCount
  });

  transform.run({uniforms: {
    scale: SCALE
  }});

  const outTexData = transform.getData({packed: true});

  t.deepEqual(outTexData, [expectedData], `Transform should access neighbor pixels correctly for 1X1 minification`);

  t.end();
});

test('histo-pyramid#buildHistopyramidBaseLevel)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const TEST_CASES = [
    {
      name: 'Squre power of two texture 2X2',
      width: 2,
      height: 2,
      // // sourceData 2X2 texture
      // 0 1 2 3   	4 5 6 7
      // 8 9 10 11  	12 13 14 15
      // // will get transformed into 1X1 texture
      // 0 4 8 12
      expectedData: [0, 4, 8, 12]
    },
    {
      name: 'Squre power of two texture 4X4',
      width: 4,
      height: 4,
      // // sourceData: 4X4 texture
      // 0 1 2 3   	  4 5 6 7	      8 9 10 11  	12 13 14 15
      // 16 17 18 19 	20 21 22 23 	24 25 26 27	28 29 30 31
      //
      // 32 33 34 35	36 37 38 39	 40 41 42 43	44 45 46 47
      // 48 49 50 51	52 53 54 55	 56 57 58 59	60 61 62 63
      // will get transformed into 2X2 texture
      // 0 4 16 20     8 12 24 28
      // 32 36 48 52	40 44 56 60
      expectedData: [0, 4, 16, 20, 8, 12, 24, 28, 32, 36, 48, 52, 40, 44, 56, 60]
    },
    {
      name: 'Squre non power of two texture 3X3',
      width: 3,
      height: 3,
      // // sourceData: 3X3 texture
      // 0 1 2 3   	  4 5 6 7	      8 9 10 11
      // 12 13 14 15	16 17 18 19 	20 21 22 23
      // 24 25 26 27	28 29 30 31	  32 33 34 35

      // Texture sample should emulate following padding
      // 0 1 2 3   	4 5 6 7	       8 9 10 11	 0 0 0 0
      // 12 13 14 15	16 17 18 19  20 21 22 23 0 0 0 0
      //
      // 24 25 26 27	28 29 30 31	  32 33 34 35	0 0 0 0
      // 0 0 0 0	    0 0 0 0	      0 0 0 0	    0 0 0 0

      // will get transformed into 2X2 texture
      // 0 4 12 16	8 0 20 0
      // 24 28 0 0	32 0 0 0
      expectedData: [0, 4, 12, 16, 8, 0, 20, 0, 24, 28, 0, 0, 32, 0, 0, 0]
    },
    {
      name: 'Non squre non power of two texture 1X3',
      width: 1,
      height: 3,
      // // sourceData: 3X3 texture
      // 0 1 2 3
      // 4 5 6 7
      // 8 9 10 11

      // Texture sample should emulate following padding
      // 0 1 2 3    0 0 0 0	  0 0 0 0   0 0 0 0
      // 4 5 6 7    0 0 0 0	  0 0 0 0   0 0 0 0
      // 8 9 10 11  0 0 0 0	  0 0 0 0   0 0 0 0
      // 0 0 0 0	  0 0 0 0	  0 0 0 0	  0 0 0 0

      // will get transformed into 2X2 texture
      // 0 0 4 0	0 0 0 0
      // 8 0 0 0	0 0 0 0
      expectedData: [0, 0, 4, 0,  0, 0, 0, 0,  8, 0, 0, 0,  0, 0, 0, 0]
    }

  ];
  const TEX_OPTIONS = {
    format: GL.RGBA32F,
    dataFormat: GL.RGBA,
    type: GL.FLOAT,
    mipmaps: false,
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    }
  };

  TEST_CASES.forEach(testCase => {
    const {width, height, name, expectedData} = testCase;
    const sourceData = new Float32Array(width * height * 4).fill().map((_, index) => index);

    const sourceTexture = new Texture2D(gl2, Object.assign({}, TEX_OPTIONS, {
      data: sourceData,
      width,
      height
    }));

    const {textureData} = buildHistopyramidBaseLevel(gl2, {texture: sourceTexture, _readData: true});

    t.deepEqual(textureData, expectedData, `${name}: should return corret base texture`);

  });

  t.end();
});
