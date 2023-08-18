import test from 'tape-promise/tape';
import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';

import {luma, glsl} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {Transform} from '@luma.gl/webgl-legacy';
import {Buffer, Texture2D, setParameters, getParameters} from '@luma.gl/webgl-legacy';
import {TypedArray} from 'modules/api/dist';
import {TextureFormat} from '@luma.gl/api/index';

// TODO - these tests have started failing on CI, we need to debug and fix
const DISABLE_FLAKY_TRANSFORM_TESTS = true;

const VS = glsl`\
#version 300 es
in float inValue;
out float outValue;

void main()
{
  outValue = 2.0 * inValue;
}
`;

const VS2 = glsl`\
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

const VS_NO_SOURCE_BUFFER = glsl`\
varying float outValue;
uniform float uValue;

void main()
{
  outValue = uValue * 2.;
}
`;

function getResourceCounts() {
  const resourceStats = luma.stats.get('Resource Counts');
  return {
    Texture2D: resourceStats.get('Texture2Ds Active').count,
    Buffer: resourceStats.get('Buffers Active').count
  };
}

function validateResourceCounts(t, startCounts, endCounts) {
  for (const resourceName in endCounts) {
    const leakCount = endCounts[resourceName] - startCounts[resourceName];
    t.ok(leakCount === 0, `should delete all ${resourceName}, remaining ${leakCount}`);
  }
}

test('WebGL#Transform construction', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const transform = new Transform(webgl2Device, {
    vs: VS,
    sourceBuffers: {
      inValue: new Buffer(webgl2Device, {id: 'inValue', data: new Float32Array([0, 2.7, -45])})
    },
    feedbackBuffers: {
      outValue: 'inValue'
    },
    elementCount: 3
  });

  t.ok(transform instanceof Transform, 'should construct Transform object');

  t.end();
});

test('WebGL#Transform constructor/delete', (t) => {
  // @ts-expect-error
  t.throws(() => new Transform(), 'Transform throws on missing gl context');

  t.throws(() => new Transform(webgl1Device), 'Transform throws on gl1 context');

  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(webgl2Device, {data: sourceData});

  const transform = new Transform(webgl2Device, {
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

  transform.destroy();
  t.ok(transform instanceof Transform, 'Transform delete successful');

  transform.destroy();
  t.ok(transform instanceof Transform, 'Transform repeated delete successful');

  t.end();
});

test('WebGL#Transform run', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(webgl2Device, {data: sourceData});

  const transform = new Transform(webgl2Device, {
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

  const expectedData = sourceData.map((x) => x * 2);
  const outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform run (feedbackBuffer offset)', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(webgl2Device, {data: sourceData});
  const outBuffer = new Buffer(webgl2Device, 10 * 4); // 10 floats
  const offset = 3;
  const transform = new Transform(webgl2Device, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    feedbackBuffers: {
      outValue: {buffer: outBuffer, byteOffset: 4 * offset}
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  const expectedData = sourceData.map((x) => x * 2);
  const outData = transform.getData({varyingName: 'outValue'}).slice(offset, offset + 5);

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform run (no source buffer)', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const INPUT = 101;
  const outBuffer = new Buffer(webgl2Device, 4);

  const transform = new Transform(webgl2Device, {
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

/*
TODO Attribute class has been moved out
Either remove these tests or create a dummy Attribute with getValue method.
If deck.gl is refactoring then we should just remove.

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
  const outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

// TODO - enabling this test breaks histopyramid.spec.js in headless mode
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
  const outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});
*/

test('WebGL#Transform swap', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(webgl2Device, {data: sourceData});

  const transform = new Transform(webgl2Device, {
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

  transform.swap();
  transform.run();

  const expectedData = sourceData.map((x) => x * 4);
  const outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform swap + update', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let sourceData = new Float32Array([10, 20, 31, 0, -57]);
  let sourceBuffer = new Buffer(webgl2Device, {data: sourceData});

  const transform = new Transform(webgl2Device, {
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
  transform.swap();

  // Increase the buffer size
  sourceData = new Float32Array([1, 2, 3, 4, 5, 6, 7]);
  sourceBuffer = new Buffer(webgl2Device, {data: sourceData});

  transform.update({
    sourceBuffers: {
      inValue: sourceBuffer
    },
    elementCount: 7
  });

  transform.run();

  let expectedData = sourceData.map((x) => x * 2);
  let outData = transform.getData({varyingName: 'outValue'});

  transform.swap();
  transform.run();

  expectedData = sourceData.map((x) => x * 4);
  outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform swap without varyings', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData1 = new Float32Array([10, 20, 30]);
  const sourceBuffer1 = new Buffer(webgl2Device, {data: sourceData1});
  const sourceData2 = new Float32Array([10, 20, 30]);
  const sourceBuffer2 = new Buffer(webgl2Device, {data: sourceData2});

  // varyings array is dedueced from feedbackMap.
  const transform = new Transform(webgl2Device, {
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

  transform.swap();
  transform.run();

  const expectedDoubleData = sourceData1.map((x) => x * 4);
  const expectedHalfData = sourceData2.map((x) => x * 0.25);

  const doubleData = transform.getData({varyingName: 'doubleValue'});
  const halfData = transform.getData({varyingName: 'halfValue'});

  t.deepEqual(doubleData, expectedDoubleData, 'Transform.getData: is successful');
  t.deepEqual(halfData, expectedHalfData, 'Transform.getData: is successful');

  t.end();
});

/* eslint-disable max-statements */
test('WebGL#Transform update', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let sourceData = new Float32Array([10, 20, 31, 0, -57]);
  let sourceBuffer = new Buffer(webgl2Device, {data: sourceData});
  let expectedData;
  let outData;

  const transform = new Transform(webgl2Device, {
    vs: VS,
    varyings: ['outValue']
  });

  t.ok(transform, 'should construct without buffers');

  transform.update({
    sourceBuffers: {
      inValue: sourceBuffer
    },
    feedbackMap: {
      inValue: 'outValue'
    },
    elementCount: 5
  });

  transform.run();

  expectedData = sourceData.map((x) => x * 2);
  outData = transform.getData({varyingName: 'outValue'});
  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  sourceData = new Float32Array([1, 2, 3, 0, -5]);
  sourceBuffer.destroy();
  sourceBuffer = new Buffer(webgl2Device, {data: sourceData});

  transform.update({
    sourceBuffers: {
      inValue: sourceBuffer
    }
  });
  t.is(transform.model.vertexCount, 5, 'Transform has correct element count');
  transform.run();

  expectedData = sourceData.map((x) => x * 2);
  outData = transform.getData({varyingName: 'outValue'});
  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  sourceData = new Float32Array([3, 4, 5, 2, -3, 0]);
  sourceBuffer.destroy();
  sourceBuffer = new Buffer(webgl2Device, {data: sourceData});

  transform.update({
    sourceBuffers: {
      inValue: sourceBuffer
    },
    feedbackBuffers: {
      outValue: new Buffer(webgl2Device, {data: new Float32Array(6)})
    },
    elementCount: 6
  });
  t.is(transform.model.vertexCount, 6, 'Element count is updated');
  transform.run();

  expectedData = sourceData.map((x) => x * 2);
  outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  transform.update({
    elementCount: 0
  });

  t.is(transform.model.vertexCount, 0, 'Element count is updated to 0');

  t.end();
});

const VSTexInput = glsl`\
#version 300 es
in float inBuffer;
in float inTexture;
out float outValue;

void main()
{
  outValue = inBuffer + inTexture;
}
`;

test('WebGL#Transform run (source texture + feedback buffer)', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([20, -31, 0, 23.45]);
  const sourceBuffer = new Buffer(webgl2Device, {data: sourceData});
  const sourceTexture = new Texture2D(webgl2Device, {
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
  const transform = new Transform(webgl2Device, {
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

  const expectedData = sourceData.map((x) => x * 2);
  const outData = transform.getData({varyingName: 'outValue'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

type TestCase = {
  name: string,
  sourceData: TypedArray,
  format: TextureFormat,
  // dataFormat: GL.RED,
  // type: GL.FLOAT,
  width: number,
  height: number,
  vs: string;
}

const TEXTURE_BUFFER_TEST_CASES: TestCase[] = [
  // NOTE: elementCount is equal to width * height
  // TODO: determine width and height based on elementCount and padding if needed
  {
    name: 'RED-FLOAT',
    sourceData: new Float32Array([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    format: 'r32float',
    // dataFormat: GL.RED,
    // type: GL.FLOAT,
    width: 4,
    height: 4,
    vs: glsl`\
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
    // dataFormat: GL.RGBA,
    // type: GL.UNSIGNED_BYTE,
    width: 2,
    height: 2,
    vs: glsl`\
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

if (!DISABLE_FLAKY_TRANSFORM_TESTS) {
  test('WebGL#Transform run (source&destination texture + feedback buffer)', (t) => {
    if (!webgl2Device) {
      t.comment('WebGL2 not available, skipping tests');
      t.end();
      return;
    }

    TEXTURE_BUFFER_TEST_CASES.forEach((testCase) => {
      const {sourceData, format, dataFormat, type, width, height, name, vs} = testCase;
      const sourceBuffer = new Buffer(webgl2Device, {data: new Float32Array(sourceData)});
      const sourceTexture = new Texture2D(webgl2Device, {
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
      const transform = new Transform(webgl2Device, {
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

      const expectedData = sourceData.map((x) => x * 2);
      const outData = transform.getData({varyingName: 'outBuffer'});
      t.deepEqual(outData, expectedData, `${name} Transform should write correct data into Buffer`);

      // By default getData reads data from current Framebuffer.
      const outTexData = transform.getData({varyingName: 'outTexture', packed: true});

      // t.deepEqual(outData, expectedData, 'Transform should write correct data into Buffer');
      t.deepEqual(
        outTexData,
        expectedData,
        `${name} Transform should write correct data into Texture`
      );
    });

    t.end();
  });
}

const TEXTURE_TEST_CASES = [
  // NOTE: elementCount is equal to width * height
  // TODO: determine width and height based on elementCount and padding if needed
  {
    name: 'RGBA-FLOAT',
    sourceData: new Float32Array([
      0, 0, 0, 0, -1, -2, -3, -4, 2, 3, 4, 5, 10, 20, 30, 40, 5, 6, 7, 8, 51, 61, 71, 81, -15, -16,
      70, 81, 50, 100, -2, -5, 9, 10, 11, 12, 0, -20, 52, 78, -3, -4, 2, 3, 8, 51, 61, 71, 3, 14,
      15, 16, -4, 2, 3, 4, 11, 12, 0, -20, 0, 0, -1, -2
    ]),
    format: GL.RGBA32F,
    dataFormat: GL.RGBA,
    type: GL.FLOAT,
    width: 4,
    height: 4,
    vs: glsl`\
#version 300 es
in vec4 inTexture;
out vec4 outTexture;

void main()
{
  outTexture = 2. *  inTexture;
}
`
  },
  {
    name: 'RED-FLOAT',
    sourceData: new Float32Array([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    width: 4,
    height: 4,
    vs: glsl`\
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
    vs: glsl`\
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

if (!DISABLE_FLAKY_TRANSFORM_TESTS) {
  test('WebGL#Transform run (source&destination texture)', (t) => {
    if (!webgl2Device) {
      t.comment('WebGL2 not available, skipping tests');
      t.end();
      return;
    }

    TEXTURE_TEST_CASES.forEach((testCase) => {
      const {sourceData, format, dataFormat, type, width, height, name, vs} = testCase;
      const sourceTexture = new Texture2D(webgl2Device, {
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
      const transform = new Transform(webgl2Device, {
        _sourceTextures: {
          inTexture: sourceTexture
        },
        _targetTexture: 'inTexture',
        _targetTextureVarying: 'outTexture',
        _swapTexture: 'inTexture',
        vs,
        elementCount: sourceData.length
      });

      transform.run();

      let expectedData = sourceData.map((x) => x * 2);
      // By default getData reads data from current Framebuffer.
      let outTexData = transform.getData({packed: true});
      t.deepEqual(
        outTexData,
        expectedData,
        `${name} Transform should write correct data into Texture`
      );

      transform.swap();
      transform.run();
      expectedData = sourceData.map((x) => x * 4);

      // By default getData reads data from current Framebuffer.
      outTexData = transform.getData({packed: true});

      t.deepEqual(outTexData, expectedData, `${name} Transform swap Textures`);
    });

    t.end();
  });

  /*
test('WebGL#Transform update (source&destination texture)', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const {sourceData, format, dataFormat, type, width, height, name, vs} = TEXTURE_TEST_CASES[0];
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
    _targetTextureVarying: 'outTexture',
    _swapTexture: 'inTexture',
    vs
  });

  transform.update({
    _sourceTextures: {
      inTexture: sourceTexture
    },
    _targetTexture: 'inTexture',
    elementCount: sourceData.length
  })

  transform.run();

  let expectedData = sourceData.map(x => x * 2);
  // By default getData reads data from current Framebuffer.
  let outTexData = transform.getData({packed: true});
  t.deepEqual(
    outTexData,
    expectedData,
    `${name} Transform should write correct data into Texture`
  );

  transform.swap();
  transform.run();
  expectedData = sourceData.map(x => x * 4);

  // By default getData reads data from current Framebuffer.
  outTexData = transform.getData({packed: true});

  t.deepEqual(outTexData, expectedData, `${name} Transform swap Textures`);

  t.end();
});
*/

  test('WebGL#Transform run (source&destination texture update)', (t) => {
    if (!webgl2Device) {
      t.comment('WebGL2 not available, skipping tests');
      t.end();
      return;
    }

    TEXTURE_TEST_CASES.forEach((testCase) => {
      const startCounts = getResourceCounts();

      const {sourceData, format, dataFormat, type, width, height, name, vs} = testCase;
      // const sourceBuffer = new Buffer(gl2, {data: new Float32Array(sourceData)});
      const sourceTexture = new Texture2D(webgl2Device, {
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
      const transform = new Transform(webgl2Device, {
        _sourceTextures: {
          inTexture: sourceTexture
        },
        _targetTexture: 'inTexture',
        _targetTextureVarying: 'outTexture',
        _swapTexture: 'inTexture',
        vs,
        elementCount: sourceData.length
      });

      transform.run();

      const updateData = sourceData.map((x) => x + 3);
      const updateTexture = new Texture2D(webgl2Device, {
        data: updateData,
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

      transform.update({_sourceTextures: {inTexture: updateTexture}});
      transform.run();

      const expectedData = updateData.map((x) => x * 2);
      // By default getData reads data from current Framebuffer.
      const outTexData = transform.getData({packed: true});
      t.deepEqual(
        outTexData,
        expectedData,
        `${name} Transform should write correct data into Texture`
      );
      sourceTexture.destroy();
      updateTexture.destroy();
      transform.destroy();
      const endCounts = getResourceCounts();
      validateResourceCounts(t, startCounts, endCounts);
    });

    t.end();
  });
}

const OFFLINE_RENDERING_TEST_CASES = [
  {
    name: 'RED-FLOAT',
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    width: 4,
    height: 4,
    expected: 123,
    position: new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]),
    vs: glsl`\
#version 300 es
in vec2 position;
out float outTexture;

void main()
{
  outTexture = 123.;
  gl_Position = vec4(position, 0., 1.);
}
`
  },
  {
    name: 'RGBA-UNSIGNED_BYTE',
    format: GL.RGBA,
    dataFormat: GL.RGBA,
    type: GL.UNSIGNED_BYTE,
    width: 2,
    height: 2,
    expected: 255,
    position: new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]),
    vs: glsl`\
#version 300 es
in vec2 position;
out vec4 outTexture;

void main()
{
  outTexture = vec4(1.);
  gl_Position = vec4(position, 0., 1.);
}
`
  }
];

test('WebGL#Transform run (offline rendering)', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  OFFLINE_RENDERING_TEST_CASES.forEach((testCase) => {
    const {position, format, dataFormat, type, width, height, name, vs, expected} = testCase;
    const _targetTexture = new Texture2D(webgl2Device, {
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
    const transform = new Transform(webgl2Device, {
      sourceBuffers: {
        position: new Buffer(webgl2Device, position)
      },
      _targetTexture,
      _targetTextureVarying: 'outTexture',
      vs,
      drawMode: GL.TRIANGLE_STRIP,
      elementCount: position.length / 2
    });

    transform.run();

    const outTexData = transform.getData({packed: true});
    const testPassed = outTexData.every((item) => {
      return item === expected;
    });
    t.ok(testPassed, `${name} Transform should write correct data into Texture`);

    transform.destroy();
  });

  t.end();
});

test('WebGL#Transform run with shader injects', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const vs = glsl`\
attribute float inValue;
varying float outValue;

float sum(float a, float b) {
  return a + b;
}

void main()
{
  outValue = 2.0 * inValue;
}
`;

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(webgl2Device, {data: sourceData});
  const inject = {
    'vs:#decl': `
attribute float injectedAttribute;
varying float injectedVarying;
`,
    'vs:#main-start': '  if (true) { injectedVarying = sum(1., injectedAttribute); } else {\n',
    'vs:#main-end': '  }\n'
  };

  const transform = new Transform(webgl2Device, {
    sourceBuffers: {
      injectedAttribute: sourceBuffer
    },
    vs,
    inject,
    feedbackMap: {
      injectedAttribute: 'injectedVarying'
    },
    varyings: ['injectedVarying'],
    elementCount: 5
  });

  transform.run();

  const expectedData = sourceData.map((x) => x + 1);
  const outData = transform.getData({varyingName: 'injectedVarying'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

if (!DISABLE_FLAKY_TRANSFORM_TESTS) {
  test('WebGL#Transform run (source&destination with custom FS)', (t) => {
    if (!webgl2Device) {
      t.comment('WebGL2 not available, skipping tests');
      t.end();
      return;
    }

    const startCounts = getResourceCounts();

    const name = 'RGBA-FLOAT';
    const sourceData = new Float32Array([
      0, 0, 0, 0, -1, -2, -3, -4, 2, 3, 4, 5, 10, 20, 30, 40, 5, 6, 7, 8, 51, 61, 71, 81, -15, -16,
      70, 81, 50, 100, -2, -5, 9, 10, 11, 12, 0, -20, 52, 78, -3, -4, 2, 3, 8, 51, 61, 71, 3, 14,
      15, 16, -4, 2, 3, 4, 11, 12, 0, -20, 0, 0, -1, -2
    ]);
    const format = GL.RGBA32F;
    const dataFormat = GL.RGBA;
    const type = GL.FLOAT;
    const width = 4;
    const height = 4;
    const vs = glsl`\
#version 300 es
in vec4 inTexture;
out vec4 outTexture;

void main()
{
outTexture = inTexture;
}
`;
    const fs = glsl`\
#version 300 es
in vec4 outTexture;
out vec4 transform_output;
void main()
{
  transform_output = 2. * outTexture;
}
`;

    // const {sourceData, format, dataFormat, type, width, height, name, vs} = testCase;
    const sourceTexture = new Texture2D(webgl2Device, {
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
    const transform = new Transform(webgl2Device, {
      _sourceTextures: {
        inTexture: sourceTexture
      },
      _targetTexture: 'inTexture',
      _targetTextureVarying: 'outTexture',
      _swapTexture: 'inTexture',
      vs,
      _fs: fs,
      elementCount: sourceData.length
    });

    transform.run();

    let expectedData = sourceData.map((x) => x * 2);
    // By default getData reads data from current Framebuffer.
    let outTexData = transform.getData({packed: true});
    t.deepEqual(
      outTexData,
      expectedData,
      `${name} Transform should write correct data into Texture`
    );

    transform.swap();
    transform.run();
    expectedData = sourceData.map((x) => x * 4);

    // By default getData reads data from current Framebuffer.
    outTexData = transform.getData({packed: true});

    t.deepEqual(outTexData, expectedData, `${name} Transform swap Textures`);

    sourceTexture.destroy();
    transform.destroy();
    const endCounts = getResourceCounts();
    validateResourceCounts(t, startCounts, endCounts);
    t.end();
  });

  test('WebGL#Transform run (custom parameters)', (t) => {
    if (!webgl2Device) {
      t.comment('WebGL2 not available, skipping tests');
      t.end();
      return;
    }

    const {sourceData, format, dataFormat, type, width, height, name, vs} = TEXTURE_TEST_CASES[0];
    const sourceTexture = new Texture2D(webgl2Device, {
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

    // enable blending
    setParameters(webgl2Device, {blend: true, blendEquation: GL.MIN});

    const transform = new Transform(webgl2Device, {
      _sourceTextures: {
        inTexture: sourceTexture
      },
      _targetTexture: 'inTexture',
      _targetTextureVarying: 'outTexture',
      _swapTexture: 'inTexture',
      vs,
      elementCount: sourceData.length
    });

    // disable blending through parameters
    transform.run({parameters: {blend: false}});

    const expectedData = sourceData.map((x) => x * 2);
    const outTexData = transform.getData({packed: true});
    t.deepEqual(
      outTexData,
      expectedData,
      `${name} Transform should write correct data into Texture`
    );

    t.ok(getParameters(webgl2Device, [GL.BLEND])[GL.BLEND] === true, 'Parameters are properly set');

    setParameters(webgl2Device, {blend: false});

    t.end();
  });
}

test('WebGL#Transform (Buffer to Texture)', (t) => {
  if (!webgl2Device) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const vs = glsl`\
#define EPSILON 0.00001
attribute vec4 aCur;
attribute vec4 aNext;
varying float equal;

void main()
{
equal = length(aCur - aNext) > EPSILON ? 0. : 1.;
gl_Position = vec4(0, 0, 0, 1.);
}
`;

  const fs = glsl`\
varying float equal;
void main()
{
  if (equal == 1.) {
    discard;
  }
gl_FragColor = vec4(1.);
}
`;

  const data1 = new Float32Array([10, 20, 31, 0, -57, 28, 100, 53]);
  const data2 = new Float32Array([10, 20, 31, 0, 7, 10, -10, 43]);
  const aCur = new Buffer(webgl2Device, {data: data1});
  const aNext = new Buffer(webgl2Device, {data: data2}); // buffers contain different data
  const texture = new Texture2D(webgl2Device, {
    format: GL.RGBA,
    dataFormat: GL.RGBA,
    type: GL.UNSIGNED_BYTE,
    mipmaps: false
  });

  const transform = new Transform(webgl2Device, {
    sourceBuffers: {
      aCur,
      aNext
    },
    vs,
    _fs: fs,
    _targetTexture: texture,
    _targetTextureVarying: 'outTexture', // dummy varying to enable FB creation
    elementCount: 2
  });

  transform.run({clearRenderTarget: true});

  let expectedData = [255, 255, 255, 255];
  let outData = transform.getData({varyingName: 'outTexture'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  // update aNext to contain same data as aCur
  aNext.subData(data1);

  // re-run the tranform
  transform.run({clearRenderTarget: true});

  expectedData = [0, 0, 0, 0];
  outData = transform.getData({varyingName: 'outTexture'});

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});
