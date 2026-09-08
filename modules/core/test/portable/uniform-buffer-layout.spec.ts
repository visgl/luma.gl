import {expect, it} from 'vitest';
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

it('unaligned scalar forces padding before vec4', () => {
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
  expect(view[0], 'scalar').toBe(42);
  expect(view[1], 'padding').toBe(0);
  expect(view[2], 'padding').toBe(0);
  expect(view[3], 'padding').toBe(0);
  expect(view[4], 'vector[0]').toBe(1);
  expect(view[5], 'vector[1]').toBe(2);
  expect(view[6], 'vector[2]').toBe(3);
  expect(view[7], 'vector[3]').toBe(4);
  void 0;
});

it('nested struct layout (struct inside struct)', () => {
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

  expect(view[0], 'transform.position[0]').toBe(1);
  expect(view[1], '').toBe(2);
  expect(view[2], '').toBe(3);
  expect(view[3], 'transform.range reuses vec3 tail slot').toBe(10);
  expect(Boolean(almostEqual(view[4], 0.8)), 'light.intensity').toBe(true);
  void 0;
});

it('array of primitives uses std140 stride', () => {
  const uniformTypes = {
    thresholds: ['f32', 3]
  } as const;

  const {writer} = makeLayoutWriter(uniformTypes);

  const data = writer.getData({
    thresholds: [1, 2, 3]
  });

  const view = new Float32Array(data.buffer);
  expect(view[0], 'thresholds[0]').toBe(1);
  expect(view[4], 'thresholds[1]').toBe(2);
  expect(view[8], 'thresholds[2]').toBe(3);
  void 0;
});

it('array of matrices accepts packed values', () => {
  const {writer} = makeLayoutWriter({
    jointMatrix: ['mat4x4<f32>', 2]
  });

  const data = writer.getData({
    jointMatrix: new Float32Array([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2
    ])
  });

  const view = new Float32Array(data.buffer);
  expect(view[0], 'jointMatrix[0][0]').toBe(1);
  expect(view[15], 'jointMatrix[0][15]').toBe(1);
  expect(view[16], 'jointMatrix[1][0]').toBe(2);
  expect(view[31], 'jointMatrix[1][15]').toBe(2);
  void 0;
});

it('array of structs layout', () => {
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
  expect(view[0], 'lights[0].position[0]').toBe(1);
  expect(view[1], 'lights[0].position[1]').toBe(2);
  expect(view[2], 'lights[0].position[2]').toBe(3);
  expect(view[3], 'lights[0].intensity reuses vec3 tail slot').toBe(0.5);

  // Second struct
  expect(view[4], 'lights[1].position[0]').toBe(4);
  expect(view[5], 'lights[1].position[1]').toBe(5);
  expect(view[6], 'lights[1].position[2]').toBe(6);
  expect(view[7], 'lights[1].intensity reuses vec3 tail slot').toBe(1.0);

  void 0;
});

it('partial nested updates preserve unspecified leaves', () => {
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

  expect(view[0], 'default position[0] preserved').toBe(1);
  expect(view[1], 'default position[1] preserved').toBe(2);
  expect(view[2], 'default position[2] preserved').toBe(3);
  expect(view[3], 'default range preserved').toBe(10);
  expect(Boolean(almostEqual(view[4], 0.8)), 'updated intensity written').toBe(true);

  void 0;
});

it('UniformStore keeps minimum uniform buffer allocation separate from packed block size', () => {
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

  expect(packedLayout.byteLength, 'layout byteLength is the exact packed size').toBe(16);
  expect(
    uniformStore.getUniformBufferByteLength('app'),
    'UniformStore still reports the minimum allocation size'
  ).toBe(1024);
  expect(
    uniformStore.getUniformBufferData('app').byteLength,
    'serialized uniform data uses the exact packed size'
  ).toBe(16);

  void 0;
});

it('uniform layout accepts WGSL alias types', () => {
  const {writer} = makeLayoutWriter({
    camera: 'vec3f',
    modelMatrix: 'mat4x4f'
  } as any);

  const data = writer.getData({
    camera: [1, 2, 3],
    modelMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  });

  const view = new Float32Array(data.buffer);
  expect(view[0], 'camera[0]').toBe(1);
  expect(view[1], 'camera[1]').toBe(2);
  expect(view[2], 'camera[2]').toBe(3);
  expect(view[4], 'modelMatrix[0]').toBe(1);
  expect(view[9], 'modelMatrix[5]').toBe(1);
  expect(view[14], 'modelMatrix[10]').toBe(1);
  expect(view[19], 'modelMatrix[15]').toBe(1);
  void 0;
});

it('wgsl-uniform keeps native WGSL matrix packing', () => {
  const {layout, writer} = makeLayoutWriter(
    {
      transform: 'mat2x2<f32>',
      exposure: 'f32'
    },
    {layout: 'wgsl-uniform'}
  );

  expect(layout.fields.transform?.offset, 'mat2x2 starts at 0').toBe(0);
  expect(layout.fields.transform?.size, 'mat2x2 uses native WGSL size').toBe(4);
  expect(layout.fields.exposure?.offset, 'scalar follows matrix without std140 padding').toBe(4);

  const data = writer.getData({
    transform: [1, 2, 3, 4],
    exposure: 5
  });

  const view = new Float32Array(data.buffer);
  expect(Array.from(view.slice(0, 5)), 'matrix columns are packed densely').toEqual([
    1, 2, 3, 4, 5
  ]);
  void 0;
});

it('wgsl-storage packs primitive arrays densely', () => {
  const {layout, writer} = makeLayoutWriter(
    {
      thresholds: ['f32', 3]
    },
    {layout: 'wgsl-storage'}
  );

  expect(layout.fields['thresholds[0]']?.offset, 'threshold[0] offset').toBe(0);
  expect(layout.fields['thresholds[1]']?.offset, 'threshold[1] offset').toBe(1);
  expect(layout.fields['thresholds[2]']?.offset, 'threshold[2] offset').toBe(2);

  const data = writer.getData({
    thresholds: [1, 2, 3]
  });

  const view = new Float32Array(data.buffer);
  expect(Array.from(view.slice(0, 3)), 'array elements use storage-buffer stride').toEqual([
    1, 2, 3
  ]);
  void 0;
});

it('wgsl-storage packs vec3 tails and nested structs without std140 struct padding', () => {
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
    {layout: 'wgsl-storage'}
  );

  expect(layout.fields['light.transform.position']?.offset, 'vec3 offset').toBe(0);
  expect(layout.fields['light.transform.position']?.size, 'vec3 uses native WGSL size').toBe(3);
  expect(layout.fields['light.transform.range']?.offset, 'scalar reuses vec3 tail slot').toBe(3);
  expect(
    layout.fields['light.intensity']?.offset,
    'outer struct is not rounded up to std140 size'
  ).toBe(4);

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
  expect(Array.from(view.slice(0, 5)), 'nested struct uses storage layout').toEqual([
    1, 2, 3, 4, 5
  ]);
  void 0;
});

it('ShaderBlockLayout matches project-style scalar/vec3 std140 packing', () => {
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
    expect(Boolean(actual), `${uniformName} exists`).toBe(true);
    expect(actual?.offset, `${uniformName} offset`).toBe(expected.offset);
    expect(actual?.size, `${uniformName} size`).toBe(expected.size);
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

  expect(view[0], 'flag0 value').toBe(1);
  expect(intView[1], 'mode0 value').toBe(2);
  expect(view[4], 'metersPerUnit[0]').toBe(11.125);
  expect(view[5], 'metersPerUnit[1]').toBe(12.25);
  expect(view[6], 'metersPerUnit[2]').toBe(13.5);
  expect(intView[7], 'mode1 value').toBe(3);
  expect(view[8], 'scale value').toBe(14.75);
  expect(view[20], 'viewportSize[0]').toBe(41.125);
  expect(view[21], 'viewportSize[1]').toBe(42.25);
  expect(view[35], 'flag1 value').toBe(4);

  for (const paddingIndex of [2, 3, 9, 10, 11, 27, 31]) {
    expect(view[paddingIndex], `padding at ${paddingIndex} remains zero`).toBe(0);
  }

  void 0;
});

it('ShaderBlockLayout matches original deck project std140 packing', () => {
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
    expect(Boolean(actual), `${uniformName} exists`).toBe(true);
    expect(actual?.offset, `${uniformName} offset`).toBe(expected.offset);
    expect(actual?.size, `${uniformName} size`).toBe(expected.size);
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

  expect(view[0], 'wrapLongitude value').toBe(1);
  expect(intView[1], 'coordinateSystem value').toBe(3);
  expect(view[4], 'commonUnitsPerMeter[0]').toBe(11.125);
  expect(view[8], 'scale value').toBe(14.75);
  expect(view[20], 'center[0]').toBe(41.125);
  expect(view[35], 'modelMatrix[11]').toBe(112);
  expect(view[55], 'viewProjectionMatrix[15]').toBe(216);
  expect(view[56], 'viewportSize[0]').toBe(301.25);
  expect(view[58], 'devicePixelRatio value').toBe(303.75);
  expect(view[59], 'focalDistance value').toBe(304.5);
  expect(view[60], 'cameraPosition[0]').toBe(401.125);
  expect(view[64], 'coordinateOrigin[0]').toBe(501.125);
  expect(view[68], 'commonOrigin[0]').toBe(601.125);
  expect(view[71], 'pseudoMeters value').toBe(1);

  for (const paddingIndex of [9, 10, 11, 63, 67]) {
    expect(view[paddingIndex], `vec3 tail padding at ${paddingIndex} remains zero`).toBe(0);
  }

  void 0;
});
