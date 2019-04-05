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

import {Buffer, Transform, Texture2D} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import test from 'tape-catch';
import {fixture} from 'test/setup';
import {equals} from 'math.gl';
import {_transform as transformModule} from '@luma.gl/shadertools';
import {
  _buildHistopyramidBaseLevel as buildHistopyramidBaseLevel,
  _getHistoPyramid as getHistoPyramid,
  _histoPyramidGenerateIndices as histoPyramidGenerateIndices
} from '@luma.gl/gpgpu';
import {
  HISTOPYRAMID_BUILD_VS_UTILS,
  HISTOPYRAMID_TRAVERSAL_UTILS
} from '@luma.gl/gpgpu/histopyramid/histopyramid-shaders';

const gl = fixture.gl2;

test('histopyramid#histoPyramid_getTexCoord', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const VS = `\
  uniform vec2 size;
  uniform vec2 scale;
  attribute float unusedAttribute;
  uniform vec2 offset;
  varying vec2 texcoord;

  void main()
  {
    texcoord = histoPyramid_getTexCoord(size, scale, offset);
  }
  `;

  const TEST_CASES = [
    {
      offset: [0, 0],
      expected: [0.25, 0.25]
    },
    {
      offset: [1, 0],
      expected: [0.75, 0.25]
    },
    {
      offset: [0, 1],
      expected: [0.25, 0.75]
    },
    {
      offset: [1, 1],
      expected: [0.75, 0.75]
    }
  ];

  const texcoord = new Buffer(gl, 2 * 4); // 2 floats

  const transform = new Transform(gl, {
    _sourceTextures: {
      // dummy attribute to enable texture functionality
      inTexture: new Texture2D(gl)
    },
    feedbackBuffers: {
      texcoord
    },
    vs: `${HISTOPYRAMID_BUILD_VS_UTILS}${VS}`,
    varyings: ['texcoord'],
    modules: [transformModule],
    elementCount: 1
  });

  transform.run({
    uniforms: {
      size: [1, 1],
      scale: [2, 2]
    }
  });

  TEST_CASES.forEach(testCase => {
    const {offset, expected} = testCase;
    transform.run({
      uniforms: {
        offset
      }
    });

    const outData = transform
      .getBuffer('texcoord')
      .getData()
      .slice(0, expected.length);
    t.ok(equals(expected, outData), 'texcoord should match');
  });

  t.end();
});

test('histopyramid#histoPyramid_getPixelIndices', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const VS = `\
  attribute float unusedAttribute;
  varying vec2 pixelIndices;
  uniform vec2 size;

  void main()
  {
    pixelIndices = histoPyramid_getPixelIndices(size);
  }
  `;
  function getExpected(size) {
    const result = [];
    for (let y = 0; y < size[1]; y++) {
      for (let x = 0; x < size[1]; x++) {
        result.push(x, y);
      }
    }
    return result;
  }
  const TEST_CASES = [
    {
      size: [2, 2]
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
    const elementCount = size[0] * size[1];
    transform.update({elementCount});
    transform.run({
      uniforms: {
        size
      }
    });

    const outData = transform
      .getBuffer('pixelIndices')
      .getData()
      .slice(0, expected.length);
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

test('histopyramid#histoPyramid_getInput', t => {
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
    0,
    1,
    10,
    11,
    20,
    21,
    30,
    31,
    2,
    3,
    12,
    13,
    22,
    23,
    32,
    33,

    40,
    41,
    50,
    51,
    60,
    61,
    70,
    71,
    42,
    43,
    52,
    53,
    62,
    63,
    72,
    73,

    80,
    81,
    90,
    91,
    100,
    101,
    110,
    111,
    82,
    83,
    92,
    93,
    102,
    103,
    112,
    113,

    120,
    121,
    130,
    131,
    140,
    141,
    150,
    151,
    122,
    123,
    132,
    133,
    142,
    143,
    152,
    153
  ]);
  /* eslint-enable no-multi-spaces */

  const expectedArray = new Array((WIDTH * HEIGHT) / 4).fill(0);
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

  const sourceTexture = new Texture2D(
    gl2,
    Object.assign({}, TEX_OPTIONS, {
      data: sourceData,
      width: WIDTH,
      height: HEIGHT
    })
  );

  const destinationTexture = new Texture2D(
    gl2,
    Object.assign({}, TEX_OPTIONS, {
      width: WIDTH / 2,
      height: HEIGHT / 2
    })
  );

  const SCALE = [2, 2];

  const dstPixelCount = (WIDTH * HEIGHT) / 4;

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
    transform.run({
      uniforms: {
        scale: SCALE,
        pixelOffset: offset
      }
    });

    const outTexData = transform.getData({packed: true});

    t.deepEqual(
      outTexData,
      expected,
      `Transform should access neighbor pixels correctly for ${name}`
    );
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

test('histopyramid#Minification to 1X1)', t => {
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

  const sourceData = new Float32Array([0, 1, 2, 3]);
  let expectedData = 0;
  sourceData.forEach(value => {
    expectedData += value;
  });

  const sourceTexture = new Texture2D(
    gl2,
    Object.assign({}, TEX_OPTIONS, {
      data: sourceData,
      width: WIDTH,
      height: HEIGHT
    })
  );

  const destinationTexture = new Texture2D(
    gl2,
    Object.assign({}, TEX_OPTIONS, {
      width: WIDTH / 2,
      height: HEIGHT / 2
    })
  );

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

  transform.run({
    uniforms: {
      scale: SCALE
    }
  });

  const outTexData = transform.getData({packed: true});

  t.deepEqual(
    outTexData,
    [expectedData],
    `Transform should access neighbor pixels correctly for 1X1 minification`
  );

  t.end();
});

const HISTOPYRAMID_TEST_CASES = [
  {
    name: 'Square power of two texture 2X2',
    width: 2,
    height: 2,
    // // sourceData 2X2 texture
    // 0 1 2 3   	4 5 6 7
    // 8 9 10 11  	12 13 14 15
    // // will get transformed into 1X1 texture
    // 0 4 8 12
    expectedBaseLevelData: [0, 4, 8, 12],
    expectedTopLevelData: [0, 4, 8, 12]
  },
  {
    name: 'Square power of two texture 4X4',
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
    expectedBaseLevelData: [0, 4, 16, 20, 8, 12, 24, 28, 32, 36, 48, 52, 40, 44, 56, 60],

    // top level
    // 24 72 168 200
    expectedTopLevelData: [40, 72, 168, 200]
  },
  {
    name: 'Square non power of two texture 3X3',
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
    expectedBaseLevelData: [0, 4, 12, 16, 8, 0, 20, 0, 24, 28, 0, 0, 32, 0, 0, 0],

    // top level
    // 32 28 52 32
    expectedTopLevelData: [32, 28, 52, 32]
  },
  {
    name: 'Non squre non power of two texture 1X3',
    width: 1,
    height: 3,
    // // sourceData: 1X3 texture
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
    expectedBaseLevelData: [0, 0, 4, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0],

    // top level
    // 24 28 52 32
    expectedTopLevelData: [4, 0, 8, 0]
  }
];

test('histopyramid#getHistoPyramid)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const TEX_OPTIONS = {
    format: GL.RGBA32F,
    dataFormat: GL.RGBA,
    type: GL.FLOAT,
    mipmaps: false,
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    }
  };

  HISTOPYRAMID_TEST_CASES.forEach(testCase => {
    const {width, height, name, expectedBaseLevelData, expectedTopLevelData} = testCase;
    const sourceData = new Float32Array(width * height * 4).fill().map((_, index) => index);

    const sourceTexture = new Texture2D(
      gl2,
      Object.assign({}, TEX_OPTIONS, {
        data: sourceData,
        width,
        height
      })
    );

    const {textureData} = buildHistopyramidBaseLevel(gl2, {
      texture: sourceTexture,
      _readData: true
    });

    t.deepEqual(textureData, expectedBaseLevelData, `${name}: should return corret base texture`);

    const {topLevelData} = getHistoPyramid(gl2, {texture: sourceTexture});
    t.deepEqual(
      topLevelData,
      expectedTopLevelData,
      `${name}: should return corret top level texture`
    );
  });

  t.end();
});

test('histopyramid#histopyramid_traversal_findRangeIndex', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const VS = `\
  attribute vec4 weights;
  attribute float currentKey;
  varying float relativeIndex;
  varying float lowerBound;

  void main()
  {
    relativeIndex = float(histopyramid_traversal_findRangeIndex(currentKey, weights, lowerBound));
  }
  `;

  const weights = new Buffer(gl, new Float32Array([3, 2, 3, 1, 1, 2, 0, 5, 0, 1, 2, 3]));
  const currentKey = new Buffer(gl, new Float32Array([4, 3, 1]));
  const relativeIndex = new Buffer(gl, 3 * 4); // 3 floats
  const lowerBound = new Buffer(gl, 3 * 4);
  const expectedRelativeIndex = [1, 3, 2];
  const expectedLowerBound = [3, 3, 1];

  const transform = new Transform(gl, {
    sourceBuffers: {
      weights,
      currentKey
    },
    feedbackBuffers: {
      relativeIndex,
      lowerBound
    },
    vs: `${HISTOPYRAMID_TRAVERSAL_UTILS}${VS}`,
    varyings: ['relativeIndex', 'lowerBound'],
    modules: [transformModule],
    elementCount: 3
  });

  transform.run();

  const actualRelativeIndex = transform.getData({varyingName: 'relativeIndex'});
  const actualLowerBound = transform.getData({varyingName: 'lowerBound'});
  t.ok(equals(expectedRelativeIndex, actualRelativeIndex), 'relative index should match');
  t.ok(equals(expectedLowerBound, actualLowerBound), 'lower bound should match');
  t.end();
});

test('histopyramid#histopyramid_traversal_findRangeIndex consecutive calls', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const VS = `\
  varying float lowerBound1;
  varying float lowerBound2;

  void main()
  {
    float lb = 0.;

    int rI = histopyramid_traversal_findRangeIndex(6., vec4(3., 2., 3., 1.), lb);
    lowerBound1 = lb;

    lb = 0.;
    rI = histopyramid_traversal_findRangeIndex(1., vec4(0., 2., 1., 0.), lb);
    lowerBound2 = lb;
  }
  `;

  const lowerBound1 = new Buffer(gl, 4);
  const lowerBound2 = new Buffer(gl, 4);

  const transform = new Transform(gl, {
    feedbackBuffers: {
      lowerBound1,
      lowerBound2
    },
    vs: `${HISTOPYRAMID_TRAVERSAL_UTILS}${VS}`,
    varyings: ['lowerBound1', 'lowerBound2'],
    modules: [transformModule],
    elementCount: 1
  });

  transform.run();

  const lb1 = transform.getData({varyingName: 'lowerBound1'});
  const lb2 = transform.getData({varyingName: 'lowerBound2'});
  t.ok(equals([5], lb1), 'lb1 should be 5');
  t.ok(equals([0], lb2), 'lb2 should be 0');
  t.end();
});

test('histopyramid#histopyramid_traversal_mapIndexToCoord', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const VS = `\
  attribute float index;
  varying vec2 coord;

  void main()
  {
    coord = histopyramid_traversal_mapIndexToCoord(int(index));
  }
  `;

  const index = new Buffer(gl, new Float32Array([0, 1, 2, 3]));
  const coord = new Buffer(gl, 8 * 4); // 8 floats
  const expectedCoord = [0, 0, 1, 0, 0, 1, 1, 1];

  const transform = new Transform(gl, {
    sourceBuffers: {index},
    feedbackBuffers: {coord},
    vs: `${HISTOPYRAMID_TRAVERSAL_UTILS}${VS}`,
    varyings: ['coord'],
    modules: [transformModule],
    elementCount: 4
  });

  transform.run();

  const actualCoord = transform.getData({varyingName: 'coord'});
  t.ok(equals(expectedCoord, actualCoord), 'texcoordinates should match');
  t.end();
});

test('histopyramid#histopyramid_traversal_getWeight', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const VS = `\
  attribute float level;
  attribute vec2 offset;
  uniform sampler2D flatPyramid;
  uniform vec2 size;
  uniform float numLevels;
  varying vec4 weight;

  void main()
  {
    weight = histopyramid_traversal_getWeight(flatPyramid, size, int(level), int(numLevels), offset);
  }
  `;

  // sourceData: 4X4 texture
  // 0 1 2 3   	  4 5 6 7	      8 9 10 11  	12 13 14 15
  // 16 17 18 19 	20 21 22 23 	24 25 26 27	28 29 30 31
  //
  // 32 33 34 35	36 37 38 39	 40 41 42 43	44 45 46 47
  // 48 49 50 51	52 53 54 55	 56 57 58 59	60 61 62 63

  // level-0 2X2 (base level)
  // 0 4 16 20     8 12 24 28
  // 32 36 48 52	40 44 56 60

  // level-1 1X1
  // 40 72 168 200

  // flat pyramid texture 4X4
  // 0 4 16 20     8 12 24 28   40 72 168 200   0 0 0 0
  // 32 36 48 52	40 44 56 60    0 0 0 0        0 0 0 0

  const width = 4;
  const height = 4;
  const numLevels = 2; // (2X2 and 1X1 in flat pyramid)
  const TEX_OPTIONS = {
    format: GL.RGBA32F,
    dataFormat: GL.RGBA,
    type: GL.FLOAT,
    mipmaps: false,
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    }
  };
  const sourceData = new Float32Array(4 * 4 * 4).fill().map((_, index) => index);

  const sourceTexture = new Texture2D(
    gl,
    Object.assign({}, TEX_OPTIONS, {
      data: sourceData,
      width,
      height
    })
  );

  const {flatPyramidTexture} = getHistoPyramid(gl, {texture: sourceTexture}); // _TODO: follow (gl, opts)
  const size = [flatPyramidTexture.width, flatPyramidTexture.height];

  // level 0 is 1X1
  const level = new Buffer(gl, new Float32Array([0, 0, 0, 0, 1]));
  const offset = new Buffer(gl, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1, 0, 0]));
  const weight = new Buffer(gl, 20 * 4); // 20 floats

  const expectedWeight = [
    0,
    4,
    16,
    20,
    8,
    12,
    24,
    28,
    32,
    36,
    48,
    52,
    40,
    44,
    56,
    60,
    40,
    72,
    168,
    200
  ];

  const transform = new Transform(gl, {
    sourceBuffers: {level, offset},
    feedbackBuffers: {weight},
    vs: `${HISTOPYRAMID_TRAVERSAL_UTILS}${VS}`,
    varyings: ['weight'],
    modules: [transformModule],
    elementCount: 5
  });

  transform.run({
    uniforms: {flatPyramid: flatPyramidTexture, numLevels, size}
  });

  const actualWeight = transform.getData({varyingName: 'weight'});
  t.ok(equals(expectedWeight, actualWeight), 'texcoordinates should match');
  t.end();
});

test('histopyramid#histoPyramidGenerateIndices', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const TEX_OPTIONS = {
    format: GL.RGBA32F,
    dataFormat: GL.RGBA,
    type: GL.FLOAT,
    mipmaps: false,
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    }
  };
  const sourceData = new Float32Array([
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    2,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ]);

  const sourceTexture = new Texture2D(
    gl,
    Object.assign({}, TEX_OPTIONS, {
      data: sourceData,
      width: 4,
      height: 4
    })
  );

  const {locationAndIndexBuffer} = histoPyramidGenerateIndices(gl, {
    texture: sourceTexture,
    _readData: true
  }); // _TODO: follow (gl, opts)
  const locationAndIndexData = locationAndIndexBuffer.getData();
  const actualData = [];
  // Given order of vertex generation can be different between CPU and GPU, extract
  // individual co-ordinates and key-index values and compare for equality.
  for (let i = 0; i < locationAndIndexData.length; i += 4) {
    actualData.push(locationAndIndexData.slice(i, i + 3)); // ignore keyIndex value
  }
  const expectedData = [
    [0, 0, 0],
    [1, 0, 0],
    [3, 0, 0],
    [0, 1, 0],
    [2, 1, 0],
    [1, 2, 0],
    [1, 2, 1], // non zero local key-index only for stream expansion case (value in 2 in texture)
    [3, 2, 0],
    [0, 3, 0]
  ];
  t.ok(equals(expectedData.length, actualData.length), 'Correct number of indices are generated');
  let foundIndex = true;
  expectedData.forEach(index => {
    foundIndex = foundIndex && actualData.some(actualIndex => equals(index, actualIndex));
  });
  t.ok(foundIndex, 'Generated indices should match');
  t.end();
});
