import {Buffer, Transform, _Attribute as Attribute, Texture2D} from 'luma.gl';
import test from 'tape-catch';
import {fixture} from 'luma.gl/test/setup';
import GL from 'luma.gl/constants';

const VS = `\
#version 300 es
in float inValue;
out float outValue;

void main()
{
  outValue = 2.0 * inValue;
}
`;

const VS_CONSTANT_ATTRIBUTE = `\
#version 300 es
in float inValue;
in float multiplier;
out float outValue;

void main()
{
  outValue = multiplier * inValue;
}
`;

const VS2 = `\
#version 300 es
in float inValue1;
in float inValue2;
out float doubleValue;
out float halfValue;

void main()
{
  doubleValue = 2.0 * inValue1;
  halfValue = 0.5 * inValue2;
}
`;

const VS_NO_SOURCE_BUFFER = `\
varying float outValue;
uniform float uValue;

void main()
{
  outValue = uValue * 2.;
}
`;

test('WebGL#Transform constructor/delete', t => {
  const {gl, gl2} = fixture;

  t.throws(
    () => new Transform(),
    /.*Requires WebGL2.*/,
    'Buffer throws on missing gl context');

  t.throws(
    () => new Transform(gl),
    /.*Requires WebGL2.*/,
    'Buffer throws on missing gl context');

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    feedbackMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  t.ok(transform instanceof Transform, 'Transform construction successful');

  transform.delete();
  t.ok(transform instanceof Transform, 'Transform delete successful');

  transform.delete();
  t.ok(transform instanceof Transform, 'Transform repeated delete successful');

  t.end();
});

test('WebGL#Transform run', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    feedbackMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  const expectedData = sourceData.map(x => x * 2);
  const outData = transform.getData('outValue');

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform run (no source buffer)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const INPUT = 101;
  const outBuffer = new Buffer(gl2, 4);

  const transform = new Transform(gl2, {
    feedbackBuffers: {
      outValue: outBuffer
    },
    vs: VS_NO_SOURCE_BUFFER,
    varyings: ['outValue'],
    elementCount: 1
  });

  transform.run({uniforms: {uValue: INPUT}});

  const expectedData = [INPUT * 2];
  const outData = transform.getBuffer('outValue').getData();

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform run (Attribute)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Attribute(gl2, {value: sourceData});
  const feedbackBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    feedbackBuffers: {
      outValue: feedbackBuffer
    },
    vs: VS,
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  const expectedData = sourceData.map(x => x * 2);
  const outData = transform.getData('outValue');

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform run (constant Attribute)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const MULTIPLIER = 5;
  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Attribute(gl2, {value: sourceData});
  const multiplier = new Attribute(gl2, {value: [MULTIPLIER], constant: true});
  const feedbackBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer,
      multiplier
    },
    feedbackBuffers: {
      outValue: feedbackBuffer
    },
    vs: VS_CONSTANT_ATTRIBUTE,
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  const expectedData = sourceData.map(x => x * MULTIPLIER);
  const outData = transform.getData('outValue');

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform swapBuffers', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    feedbackMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  transform.swapBuffers();
  transform.run();

  const expectedData = sourceData.map(x => x * 4);
  const outData = transform.getData('outValue');

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform swapBuffers + update', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let sourceData = new Float32Array([10, 20, 31, 0, -57]);
  let sourceBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    feedbackMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();
  transform.swapBuffers();

  // Increase the buffer size
  sourceData = new Float32Array([1, 2, 3, 4, 5, 6, 7]);
  sourceBuffer = new Buffer(gl2, {data: sourceData});

  transform.update({
    sourceBuffers: {
      inValue: sourceBuffer
    },
    elementCount: 7
  });

  transform.run();

  let expectedData = sourceData.map(x => x * 2);
  let outData = transform.getData('outValue');

  transform.swapBuffers();
  transform.run();

  expectedData = sourceData.map(x => x * 4);
  outData = transform.getData('outValue');

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform swapBuffers without varyings', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData1 = new Float32Array([10, 20, 30]);
  const sourceBuffer1 = new Buffer(gl2, {data: sourceData1});
  const sourceData2 = new Float32Array([10, 20, 30]);
  const sourceBuffer2 = new Buffer(gl2, {data: sourceData2});

  // varyings array is dedueced from feedbackMap.
  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue1: sourceBuffer1,
      inValue2: sourceBuffer2
    },
    vs: VS2,
    feedbackMap: {
      inValue2: 'halfValue',
      inValue1: 'doubleValue'
    },
    elementCount: 3
  });

  transform.run();

  transform.swapBuffers();
  transform.run();

  const expectedDoubleData = sourceData1.map(x => x * 4);
  const expectedHalfData = sourceData2.map(x => x * 0.25);

  const doubleData = transform.getData('doubleValue');
  const halfData = transform.getData('halfValue');

  t.deepEqual(doubleData, expectedDoubleData, 'Transform.getData: is successful');
  t.deepEqual(halfData, expectedHalfData, 'Transform.getData: is successful');

  t.end();
});

/* eslint-disable max-statements */
test('WebGL#Transform update', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let sourceData = new Float32Array([10, 20, 31, 0, -57]);
  let sourceBuffer = new Buffer(gl2, {data: sourceData});
  let expectedData;
  let outData;

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    feedbackMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  sourceData = new Float32Array([1, 2, 3, 0, -5]);
  sourceBuffer.delete();
  sourceBuffer = new Buffer(gl2, {data: sourceData});

  transform.update({
    sourceBuffers: {
      inValue: sourceBuffer
    }
  });
  t.is(transform.elementCount, 5, 'Transform has correct element count');
  transform.run();

  expectedData = sourceData.map(x => x * 2);
  outData = transform.getData('outValue');
  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  sourceData = new Float32Array([3, 4, 5, 2, -3, 0]);
  sourceBuffer.delete();
  sourceBuffer = new Buffer(gl2, {data: sourceData});

  transform.update({
    sourceBuffers: {
      inValue: sourceBuffer
    },
    feedbackBuffers: {
      outValue: new Buffer(gl2, {data: new Float32Array(6)})
    },
    elementCount: 6
  });
  t.is(transform.elementCount, 6, 'Element count is updated');
  transform.run();

  expectedData = sourceData.map(x => x * 2);
  outData = transform.getData('outValue');

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

const VSTexInput = `\
#version 300 es
in float inBuffer;
in float inTexture;
out float outValue;

void main()
{
  outValue = inBuffer + inTexture;
}
`;

test('WebGL#Transform run (source texture + feedback buffer)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([20, -31, 0, 23.45]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});
  const sourceTexture = new Texture2D(gl2, {
    data: sourceData,
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    mipmaps: false,
    width: 2,
    height: 2,
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    }
  });
  const transform = new Transform(gl2, {
    sourceBuffers: {
      inBuffer: sourceBuffer
    },
    _sourceTextures: {
      inTexture: sourceTexture
    },
    vs: VSTexInput,
    feedbackMap: {
      inBuffer: 'outValue'
    },
    elementCount: sourceData.length
  });

  transform.run();

  const expectedData = sourceData.map(x => x * 2);
  const outData = transform.getData('outValue');

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

const TEXTURE_BUFFER_TEST_CASES = [
  // NOTE: elementCount is equal to width * height
  // TODO: determine width and height based on elementCount and padding if needed
  {
    name: 'RED-FLOAT',
    sourceData: new Float32Array([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    width: 4,
    height: 4,
    vs: `\
#version 300 es
in float inBuffer;
in float inTexture;
out float outBuffer;
out float outTexture;

void main()
{
  outBuffer = inTexture + inBuffer;
  outTexture = inTexture + inBuffer;
}
`
  },
  {
    name: 'RGBA-UNSIGNED_BYTE',
    sourceData: new Uint8Array([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    format: GL.RGBA,
    dataFormat: GL.RGBA,
    type: GL.UNSIGNED_BYTE,
    width: 2,
    height: 2,
    vs: `\
#version 300 es
in float inBuffer;
in vec4 inTexture;
out float outBuffer;
out vec4 outTexture;

void main()
{
  outBuffer = 2. * inBuffer;
  outTexture = 2. *  inTexture;
}
`
  }
];

test('WebGL#Transform run (source&destination texture + feedback buffer)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  TEXTURE_BUFFER_TEST_CASES.forEach(testCase => {
    const {sourceData, format, dataFormat, type, width, height, name, vs} = testCase;
    const sourceBuffer = new Buffer(gl2, {data: new Float32Array(sourceData)});
    const sourceTexture = new Texture2D(gl2, {
      data: sourceData,
      format,
      dataFormat,
      type,
      mipmaps: false,
      width,
      height,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: false
      }
    });
    const transform = new Transform(gl2, {
      sourceBuffers: {
        inBuffer: sourceBuffer
      },
      _sourceTextures: {
        inTexture: sourceTexture
      },
      _targetTextureVarying: 'outTexture',
      _targetTexture: 'inTexture',
      vs,
      feedbackMap: {
        inBuffer: 'outBuffer'
      },
      elementCount: sourceData.length
    });

    transform.run();

    const expectedData = sourceData.map(x => x * 2);
    const outData = transform.getData('outBuffer');
    t.deepEqual(outData, expectedData, `${name} Transform should write correct data into Buffer`);

    // By default getData reads data from current Framebuffer.
    const outTexData = transform.getData();

    // t.deepEqual(outData, expectedData, 'Transform should write correct data into Buffer');
    t.deepEqual(outTexData, expectedData, `${name} Transform should write correct data into Texture`);
  });

  t.end();
});

const TEXTURE_TEST_CASES = [
  // NOTE: elementCount is equal to width * height
  // TODO: determine width and height based on elementCount and padding if needed
  {
    name: 'RED-FLOAT',
    sourceData: new Float32Array([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    width: 4,
    height: 4,
    vs: `\
#version 300 es
in float inTexture;
out float outTexture;

void main()
{
  outTexture = 2. *  inTexture;
}
`
  },
  {
    name: 'RGBA-UNSIGNED_BYTE',
    sourceData: new Uint8Array([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    format: GL.RGBA,
    dataFormat: GL.RGBA,
    type: GL.UNSIGNED_BYTE,
    width: 2,
    height: 2,
    vs: `\
#version 300 es
in vec4 inTexture;
out vec4 outTexture;

void main()
{
  outTexture = 2. *  inTexture;
}
`
  }
];

test('WebGL#Transform run (source&destination texture)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  TEXTURE_TEST_CASES.forEach(testCase => {
    const {sourceData, format, dataFormat, type, width, height, name, vs} = testCase;
    // const sourceBuffer = new Buffer(gl2, {data: new Float32Array(sourceData)});
    const sourceTexture = new Texture2D(gl2, {
      data: sourceData,
      format,
      dataFormat,
      type,
      mipmaps: false,
      width,
      height,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: false
      }
    });
    const transform = new Transform(gl2, {
      _sourceTextures: {
        inTexture: sourceTexture
      },
      _targetTexture: 'inTexture',
      _targetTextureVarying: 'outTexture',
      vs,
      elementCount: sourceData.length
    });

    transform.run();

    const expectedData = sourceData.map(x => x * 2);

    // By default getData reads data from current Framebuffer.
    const outTexData = transform.getData();

    t.deepEqual(outTexData, expectedData, `${name} Transform should write correct data into Texture`);
  });

  t.end();
});

const VS_MINIFICAION = `\
#version 300 es
in float inTexture;
out float outTexture;
uniform vec2 scale;
uniform vec2 offset;

// TODO: review and move it to 'transform' module
// overloaded versions that can access neighboring pixels using scale and offset.

// returns the top left texture coordiante corresponding to 4X4 block in higher level texture.
// size: minified texture size
// scale: usually (2, 2)
vec2 transform_getTexCoord(vec2 size, vec2 scale, vec2 offset) {
  // use actual (scaled) texture size to calcualte offset (multiplied by scale)
  vec2 scaledSize = size * scale;
  vec2 pixelOffset = transform_getPixelSizeHalf(scaledSize);

  // use the minified texture size to generate indices
  vec2 pixelIndices = transform_getPixelIndices(size, pixelOffset);

  // now scale the indices to point to correct 4X4 block
  pixelIndices = pixelIndices * scale;

  // generate tex coordinate using actual size
  vec2 texCoord = pixelIndices / scaledSize;

  return texCoord + (offset / scaledSize) + pixelOffset;
}

// can be used to retrieve neighbor pixels values
// returns current pixel's neighbors using scale and offset
vec4 transform_getInput(sampler2D texSampler, vec2 size, vec2 scale, vec2 offset) {
  vec2 texCoord = transform_getTexCoord(size, scale, offset);
  vec4 textureColor = texture(texSampler, texCoord);
  return textureColor;
}

void main()
{
  vec2 size = transform_uSize_outTexture;
  vec2 scale = vec2(2., 2.);
  vec4 pixel = transform_getInput(transform_uSampler_inTexture, size, scale, offset);
  outTexture = pixel.x;
}
`;

test('WebGL#Transform run (texture minification)', t => {
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
    vs: VS_MINIFICAION,
    elementCount: dstPixelCount
  });

  TEST_CASES.forEach(testCase => {
    const {name, offset, expected} = testCase;
    transform.run({uniforms: {
      scale: SCALE,
      offset
    }});

    const outTexData = transform.getData();

    t.deepEqual(outTexData, expected, `Transform should access neighbor pixels correctly for ${name}`);
  });

  t.end();
});
