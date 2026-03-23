import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {makeShaderBlockLayout, ShaderBlockWriter, UniformStore} from '../../src';

function almostEqual(a: number, b: number, eps = 1e-3): boolean {
  return Math.abs(a - b) <= eps;
}

function makeLayoutWriter(
  uniformTypes: Parameters<typeof makeShaderBlockLayout>[0],
  options?: Parameters<typeof makeShaderBlockLayout>[1]
) {
  const layout = makeShaderBlockLayout(uniformTypes, options);
  return {layout, writer: new ShaderBlockWriter(layout)};
}

test('unaligned scalar forces padding before vec4', t => {
  const uniformTypes = {
    scalar: 'f32',
    vector: 'vec4<f32>'
  } as const;

  const {writer} = makeLayoutWriter(uniformTypes);

  const data = writer.getData({
    scalar: 42,
    vector: [1, 2, 3, 4]
  });

  const view = new Float32Array(data.buffer);
  t.equal(view[0], 42, 'scalar');
  t.equal(view[1], 0, 'padding');
  t.equal(view[2], 0, 'padding');
  t.equal(view[3], 0, 'padding');
  t.equal(view[4], 1, 'vector[0]');
  t.equal(view[5], 2, 'vector[1]');
  t.equal(view[6], 3, 'vector[2]');
  t.equal(view[7], 4, 'vector[3]');
  t.end();
});

test('nested struct layout (struct inside struct)', t => {
  const uniformTypes = {
    light: {
      transform: {
        position: 'vec3<f32>',
        range: 'f32'
      },
      intensity: 'f32'
    }
  } as const;

  const {writer} = makeLayoutWriter(uniformTypes);

  const data = writer.getData({
    light: {
      transform: {
        position: [1, 2, 3],
        range: 10
      },
      intensity: 0.8
    }
  });

  const view = new Float32Array(data.buffer);

  t.equal(view[0], 1, 'transform.position[0]');
  t.equal(view[1], 2);
  t.equal(view[2], 3);
  t.equal(view[3], 10, 'transform.range reuses vec3 tail slot');
  t.ok(almostEqual(view[4], 0.8), 'light.intensity');
  t.end();
});

test('array of primitives uses std140 stride', t => {
  const uniformTypes = {
    thresholds: ['f32', 3]
  } as const;

  const {writer} = makeLayoutWriter(uniformTypes);

  const data = writer.getData({
    thresholds: [1, 2, 3]
  });

  const view = new Float32Array(data.buffer);
  t.equal(view[0], 1, 'thresholds[0]');
  t.equal(view[4], 2, 'thresholds[1]');
  t.equal(view[8], 3, 'thresholds[2]');
  t.end();
});

test('array of matrices accepts packed values', t => {
  const {writer} = makeLayoutWriter({
    jointMatrix: ['mat4x4<f32>', 2]
  });

  const data = writer.getData({
    jointMatrix: new Float32Array([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2
    ])
  });

  const view = new Float32Array(data.buffer);
  t.equal(view[0], 1, 'jointMatrix[0][0]');
  t.equal(view[15], 1, 'jointMatrix[0][15]');
  t.equal(view[16], 2, 'jointMatrix[1][0]');
  t.equal(view[31], 2, 'jointMatrix[1][15]');
  t.end();
});

test('array of structs layout', t => {
  const uniformTypes = {
    lights: [
      {
        position: 'vec3<f32>',
        intensity: 'f32'
      },
      2
    ]
  } as const;

  const {writer} = makeLayoutWriter(uniformTypes);

  const data = writer.getData({
    lights: [
      {position: [1, 2, 3], intensity: 0.5},
      {position: [4, 5, 6], intensity: 1.0}
    ]
  });

  const view = new Float32Array(data.buffer);

  // First struct
  t.equal(view[0], 1, 'lights[0].position[0]');
  t.equal(view[1], 2, 'lights[0].position[1]');
  t.equal(view[2], 3, 'lights[0].position[2]');
  t.equal(view[3], 0.5, 'lights[0].intensity reuses vec3 tail slot');

  // Second struct
  t.equal(view[4], 4, 'lights[1].position[0]');
  t.equal(view[5], 5, 'lights[1].position[1]');
  t.equal(view[6], 6, 'lights[1].position[2]');
  t.equal(view[7], 1.0, 'lights[1].intensity reuses vec3 tail slot');

  t.end();
});

test('partial nested updates preserve unspecified leaves', t => {
  const uniformStore = new UniformStore({type: 'webgl'} as any, {
    lighting: {
      uniformTypes: {
        light: {
          transform: {
            position: 'vec3<f32>',
            range: 'f32'
          },
          intensity: 'f32'
        }
      },
      defaultUniforms: {
        light: {
          transform: {
            position: [1, 2, 3],
            range: 10
          },
          intensity: 0.5
        }
      }
    }
  });

  uniformStore.setUniforms({
    lighting: {
      light: {
        intensity: 0.8
      }
    }
  });

  const data = uniformStore.getUniformBufferData('lighting');
  const view = new Float32Array(data.buffer);

  t.equal(view[0], 1, 'default position[0] preserved');
  t.equal(view[1], 2, 'default position[1] preserved');
  t.equal(view[2], 3, 'default position[2] preserved');
  t.equal(view[3], 10, 'default range preserved');
  t.ok(almostEqual(view[4], 0.8), 'updated intensity written');

  t.end();
});

test('UniformStore keeps minimum uniform buffer allocation separate from packed block size', t => {
  const uniformStore = new UniformStore({type: 'webgl'} as any, {
    app: {
      uniformTypes: {
        opacity: 'f32',
        offset: 'vec2<f32>'
      },
      defaultUniforms: {
        opacity: 1,
        offset: [2, 3]
      }
    }
  });

  const packedLayout = makeShaderBlockLayout({
    opacity: 'f32',
    offset: 'vec2<f32>'
  });

  t.equal(packedLayout.byteLength, 16, 'layout byteLength is the exact packed size');
  t.equal(
    uniformStore.getUniformBufferByteLength('app'),
    1024,
    'UniformStore still reports the minimum allocation size'
  );
  t.equal(
    uniformStore.getUniformBufferData('app').byteLength,
    16,
    'serialized uniform data uses the exact packed size'
  );

  t.end();
});

test('uniform layout accepts WGSL alias types', t => {
  const {writer} = makeLayoutWriter({
    camera: 'vec3f',
    modelMatrix: 'mat4x4f'
  } as any);

  const data = writer.getData({
    camera: [1, 2, 3],
    modelMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  });

  const view = new Float32Array(data.buffer);
  t.equal(view[0], 1, 'camera[0]');
  t.equal(view[1], 2, 'camera[1]');
  t.equal(view[2], 3, 'camera[2]');
  t.equal(view[4], 1, 'modelMatrix[0]');
  t.equal(view[9], 1, 'modelMatrix[5]');
  t.equal(view[14], 1, 'modelMatrix[10]');
  t.equal(view[19], 1, 'modelMatrix[15]');
  t.end();
});

test('wgsl-uniform keeps native WGSL matrix packing', t => {
  const {layout, writer} = makeLayoutWriter(
    {
      transform: 'mat2x2<f32>',
      exposure: 'f32'
    },
    {format: 'wgsl-uniform'}
  );

  t.equal(layout.fields.transform?.offset, 0, 'mat2x2 starts at 0');
  t.equal(layout.fields.transform?.size, 4, 'mat2x2 uses native WGSL size');
  t.equal(layout.fields.exposure?.offset, 4, 'scalar follows matrix without std140 padding');

  const data = writer.getData({
    transform: [1, 2, 3, 4],
    exposure: 5
  });

  const view = new Float32Array(data.buffer);
  t.deepEqual(Array.from(view.slice(0, 5)), [1, 2, 3, 4, 5], 'matrix columns are packed densely');
  t.end();
});

test('wgsl-storage packs primitive arrays densely', t => {
  const {layout, writer} = makeLayoutWriter(
    {
      thresholds: ['f32', 3]
    },
    {format: 'wgsl-storage'}
  );

  t.equal(layout.fields['thresholds[0]']?.offset, 0, 'threshold[0] offset');
  t.equal(layout.fields['thresholds[1]']?.offset, 1, 'threshold[1] offset');
  t.equal(layout.fields['thresholds[2]']?.offset, 2, 'threshold[2] offset');

  const data = writer.getData({
    thresholds: [1, 2, 3]
  });

  const view = new Float32Array(data.buffer);
  t.deepEqual(Array.from(view.slice(0, 3)), [1, 2, 3], 'array elements use storage-buffer stride');
  t.end();
});

test('wgsl-storage packs vec3 tails and nested structs without std140 struct padding', t => {
  const {layout, writer} = makeLayoutWriter(
    {
      light: {
        transform: {
          position: 'vec3<f32>',
          range: 'f32'
        },
        intensity: 'f32'
      }
    },
    {format: 'wgsl-storage'}
  );

  t.equal(layout.fields['light.transform.position']?.offset, 0, 'vec3 offset');
  t.equal(layout.fields['light.transform.position']?.size, 3, 'vec3 uses native WGSL size');
  t.equal(layout.fields['light.transform.range']?.offset, 3, 'scalar reuses vec3 tail slot');
  t.equal(
    layout.fields['light.intensity']?.offset,
    4,
    'outer struct is not rounded up to std140 size'
  );

  const data = writer.getData({
    light: {
      transform: {
        position: [1, 2, 3],
        range: 4
      },
      intensity: 5
    }
  });

  const view = new Float32Array(data.buffer);
  t.deepEqual(Array.from(view.slice(0, 5)), [1, 2, 3, 4, 5], 'nested struct uses storage layout');
  t.end();
});

test('ShaderBlockLayout matches project-style scalar/vec3 std140 packing', t => {
  const uniformTypes = {
    flag0: 'f32',
    mode0: 'i32',
    metersPerUnit: 'vec3<f32>',
    mode1: 'i32',
    scale: 'f32',
    worldUnit: 'vec3<f32>',
    worldUnit2: 'vec3<f32>',
    viewportSize: 'vec2<f32>',
    devicePixelRatio: 'f32',
    focalDistance: 'f32',
    cameraPosition: 'vec3<f32>',
    coordinateOrigin: 'vec3<f32>',
    commonOrigin: 'vec3<f32>',
    flag1: 'f32'
  } as const;

  const {layout, writer} = makeLayoutWriter(uniformTypes);
  const expectedLayout = {
    flag0: {offset: 0, size: 1},
    mode0: {offset: 1, size: 1},
    metersPerUnit: {offset: 4, size: 3},
    mode1: {offset: 7, size: 1},
    scale: {offset: 8, size: 1},
    worldUnit: {offset: 12, size: 3},
    worldUnit2: {offset: 16, size: 3},
    viewportSize: {offset: 20, size: 2},
    devicePixelRatio: {offset: 22, size: 1},
    focalDistance: {offset: 23, size: 1},
    cameraPosition: {offset: 24, size: 3},
    coordinateOrigin: {offset: 28, size: 3},
    commonOrigin: {offset: 32, size: 3},
    flag1: {offset: 35, size: 1}
  } as const;

  for (const [uniformName, expected] of Object.entries(expectedLayout)) {
    const actual = layout.fields[uniformName];
    t.ok(actual, `${uniformName} exists`);
    t.equal(actual?.offset, expected.offset, `${uniformName} offset`);
    t.equal(actual?.size, expected.size, `${uniformName} size`);
  }

  const data = writer.getData({
    flag0: 1,
    mode0: 2,
    metersPerUnit: [11.125, 12.25, 13.5],
    mode1: 3,
    scale: 14.75,
    worldUnit: [21.125, 22.25, 23.5],
    worldUnit2: [31.125, 32.25, 33.5],
    viewportSize: [41.125, 42.25],
    devicePixelRatio: 43.5,
    focalDistance: 44.75,
    cameraPosition: [51.125, 52.25, 53.5],
    coordinateOrigin: [61.125, 62.25, 63.5],
    commonOrigin: [71.125, 72.25, 73.5],
    flag1: 4
  });

  const view = new Float32Array(data.buffer);
  const intView = new Int32Array(data.buffer);

  t.equal(view[0], 1, 'flag0 value');
  t.equal(intView[1], 2, 'mode0 value');
  t.equal(view[4], 11.125, 'metersPerUnit[0]');
  t.equal(view[5], 12.25, 'metersPerUnit[1]');
  t.equal(view[6], 13.5, 'metersPerUnit[2]');
  t.equal(intView[7], 3, 'mode1 value');
  t.equal(view[8], 14.75, 'scale value');
  t.equal(view[20], 41.125, 'viewportSize[0]');
  t.equal(view[21], 42.25, 'viewportSize[1]');
  t.equal(view[35], 4, 'flag1 value');

  for (const paddingIndex of [2, 3, 9, 10, 11, 27, 31]) {
    t.equal(view[paddingIndex], 0, `padding at ${paddingIndex} remains zero`);
  }

  t.end();
});

test('ShaderBlockLayout matches original deck project std140 packing', t => {
  // Mirrors deck.gl master:
  // modules/core/src/shaderlib/project/project.ts
  const uniformTypes = {
    wrapLongitude: 'f32',
    coordinateSystem: 'i32',
    commonUnitsPerMeter: 'vec3<f32>',
    projectionMode: 'i32',
    scale: 'f32',
    commonUnitsPerWorldUnit: 'vec3<f32>',
    commonUnitsPerWorldUnit2: 'vec3<f32>',
    center: 'vec4<f32>',
    modelMatrix: 'mat4x4<f32>',
    viewProjectionMatrix: 'mat4x4<f32>',
    viewportSize: 'vec2<f32>',
    devicePixelRatio: 'f32',
    focalDistance: 'f32',
    cameraPosition: 'vec3<f32>',
    coordinateOrigin: 'vec3<f32>',
    commonOrigin: 'vec3<f32>',
    pseudoMeters: 'f32'
  } as const;

  const {layout, writer} = makeLayoutWriter(uniformTypes);
  const expectedLayout = {
    wrapLongitude: {offset: 0, size: 1},
    coordinateSystem: {offset: 1, size: 1},
    commonUnitsPerMeter: {offset: 4, size: 3},
    projectionMode: {offset: 7, size: 1},
    scale: {offset: 8, size: 1},
    commonUnitsPerWorldUnit: {offset: 12, size: 3},
    commonUnitsPerWorldUnit2: {offset: 16, size: 3},
    center: {offset: 20, size: 4},
    modelMatrix: {offset: 24, size: 16},
    viewProjectionMatrix: {offset: 40, size: 16},
    viewportSize: {offset: 56, size: 2},
    devicePixelRatio: {offset: 58, size: 1},
    focalDistance: {offset: 59, size: 1},
    cameraPosition: {offset: 60, size: 3},
    coordinateOrigin: {offset: 64, size: 3},
    commonOrigin: {offset: 68, size: 3},
    pseudoMeters: {offset: 71, size: 1}
  } as const;

  for (const [uniformName, expected] of Object.entries(expectedLayout)) {
    const actual = layout.fields[uniformName];
    t.ok(actual, `${uniformName} exists`);
    t.equal(actual?.offset, expected.offset, `${uniformName} offset`);
    t.equal(actual?.size, expected.size, `${uniformName} size`);
  }

  const data = writer.getData({
    wrapLongitude: 1,
    coordinateSystem: 3,
    commonUnitsPerMeter: [11.125, 12.25, 13.5],
    projectionMode: 4,
    scale: 14.75,
    commonUnitsPerWorldUnit: [21.125, 22.25, 23.5],
    commonUnitsPerWorldUnit2: [31.125, 32.25, 33.5],
    center: [41.125, 42.25, 43.5, 44.75],
    modelMatrix: Array.from({length: 16}, (_, i) => 101 + i),
    viewProjectionMatrix: Array.from({length: 16}, (_, i) => 201 + i),
    viewportSize: [301.25, 302.5],
    devicePixelRatio: 303.75,
    focalDistance: 304.5,
    cameraPosition: [401.125, 402.25, 403.5],
    coordinateOrigin: [501.125, 502.25, 503.5],
    commonOrigin: [601.125, 602.25, 603.5],
    pseudoMeters: 1
  });

  const view = new Float32Array(data.buffer);
  const intView = new Int32Array(data.buffer);

  t.equal(view[0], 1, 'wrapLongitude value');
  t.equal(intView[1], 3, 'coordinateSystem value');
  t.equal(view[4], 11.125, 'commonUnitsPerMeter[0]');
  t.equal(view[8], 14.75, 'scale value');
  t.equal(view[20], 41.125, 'center[0]');
  t.equal(view[35], 112, 'modelMatrix[11]');
  t.equal(view[55], 216, 'viewProjectionMatrix[15]');
  t.equal(view[56], 301.25, 'viewportSize[0]');
  t.equal(view[58], 303.75, 'devicePixelRatio value');
  t.equal(view[59], 304.5, 'focalDistance value');
  t.equal(view[60], 401.125, 'cameraPosition[0]');
  t.equal(view[64], 501.125, 'coordinateOrigin[0]');
  t.equal(view[68], 601.125, 'commonOrigin[0]');
  t.equal(view[71], 1, 'pseudoMeters value');

  for (const paddingIndex of [9, 10, 11, 63, 67]) {
    t.equal(view[paddingIndex], 0, `vec3 tail padding at ${paddingIndex} remains zero`);
  }

  t.end();
});
