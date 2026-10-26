// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {GLTFWithBuffers, GLTFPostprocessed} from '@luma.gl/gltf';
import {postProcessGLTF} from '@luma.gl/gltf';
const TEST_CASES: {
  name: string;
  input: GLTFWithBuffers;
  output: Partial<GLTFPostprocessed>;
}[] = [
  {
    name: 'Simple scene',
    input: {
      json: {
        asset: {version: '2.0'},
        scenes: [
          {
            nodes: [0, 1]
          }
        ],
        nodes: [{mesh: 0}, {mesh: 1}],
        meshes: [{primitives: []}, {primitives: []}],
        buffers: []
      },
      buffers: []
    },
    output: {
      asset: {version: '2.0'},
      scenes: [
        {
          nodes: [
            {mesh: {id: 'mesh-0', primitives: []}, id: 'node-0'},
            {mesh: {id: 'mesh-1', primitives: []}, id: 'node-1'}
          ],
          id: 'scene-0'
        }
      ],
      nodes: [
        {mesh: {id: 'mesh-0', primitives: []}, id: 'node-0'},
        {mesh: {id: 'mesh-1', primitives: []}, id: 'node-1'}
      ],
      meshes: [
        {id: 'mesh-0', primitives: []},
        {id: 'mesh-1', primitives: []}
      ],
      buffers: []
    }
  }
];
test('gltf#postProcessGLTF', () => {
  for (const testCase of TEST_CASES) {
    const json = postProcessGLTF(testCase.input as unknown as GLTFWithBuffers);
    expect(json, testCase.name).toMatchObject(testCase.output);
  }
});
test('gltf#postProcessGLTF preserves loaded buffer data', () => {
  const arrayBuffer = new Uint8Array([1, 2, 3, 4]).buffer;
  const generatedArrayBuffer = new Uint8Array([5, 6, 7, 8]).buffer;
  const gltf = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: arrayBuffer.byteLength, uri: 'mesh.bin'}]
    },
    buffers: [
      {arrayBuffer, byteOffset: 0, byteLength: arrayBuffer.byteLength},
      {
        arrayBuffer: generatedArrayBuffer,
        byteOffset: 0,
        byteLength: generatedArrayBuffer.byteLength
      }
    ]
  } as GLTFWithBuffers);

  expect(gltf.buffers[0].arrayBuffer, 'retains the loaded buffer').toBe(arrayBuffer);
  expect(gltf.buffers[0].byteOffset, 'retains the loaded buffer offset').toBe(0);
  expect(gltf.buffers[0].byteLength, 'retains the loaded buffer length').toBe(4);
  expect(gltf.buffers[0].uri, 'retains the source buffer metadata').toBe('mesh.bin');
  expect(gltf.buffers[1].arrayBuffer, 'retains extension-generated buffers').toBe(
    generatedArrayBuffer
  );
});
test('gltf#postProcessGLTF resolves a draft glTF 2.1 thumbnail', () => {
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.1', thumbnail: 0},
      images: [{uri: 'thumbnail.png'}]
    },
    buffers: [],
    images: [{width: 2, height: 2}]
  } as unknown as GLTFWithBuffers);
  expect(json.asset.thumbnail, 'resolves the thumbnail to the processed image').toBe(
    json.images[0]
  );
  expect(json.asset.thumbnail?.image.width, 'preserves the decoded thumbnail image').toBe(2);
});
test('gltf#postProcessGLTF normalizes indexed LINE_LOOP topology without mutating source data', () => {
  const sourceIndices = new Uint16Array([3, 1, 4, 2]);
  const source = {
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: sourceIndices.byteLength}],
      bufferViews: [{buffer: 0, byteLength: sourceIndices.byteLength}],
      accessors: [
        {bufferView: 0, componentType: 5123, count: sourceIndices.length, type: 'SCALAR'},
        {componentType: 5126, count: 5, type: 'VEC3'}
      ],
      meshes: [{primitives: [{attributes: {POSITION: 1}, indices: 0, mode: 2}]}]
    },
    buffers: [
      {
        arrayBuffer: sourceIndices.buffer,
        byteOffset: 0,
        byteLength: sourceIndices.byteLength
      }
    ]
  } as GLTFWithBuffers;
  const json = postProcessGLTF(source);
  const primitive = json.meshes[0].primitives[0];
  expect(primitive.mode, 'converts LINE_LOOP to LINES').toBe(1);
  expect(
    Array.from(primitive.indices?.value || []),
    'expands the loop into line-list indices'
  ).toEqual([3, 1, 1, 4, 4, 2, 2, 3]);
  expect(primitive.indices?.componentType, 'uses portable unsigned-short indices').toBe(5123);
  expect(source.json.meshes?.[0].primitives[0].mode, 'preserves the source primitive mode').toBe(2);
  expect(source.json.accessors?.[0].count, 'preserves the source index accessor').toBe(4);
  expect(Array.from(sourceIndices), 'preserves the source index buffer').toEqual([3, 1, 4, 2]);
});
test('gltf#postProcessGLTF normalizes non-indexed TRIANGLE_FAN topology', () => {
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      accessors: [{componentType: 5126, count: 4, type: 'VEC3'}],
      meshes: [{primitives: [{attributes: {POSITION: 0}, mode: 6}]}]
    },
    buffers: []
  } as GLTFWithBuffers);
  const primitive = json.meshes[0].primitives[0];
  expect(primitive.mode, 'converts TRIANGLE_FAN to TRIANGLES').toBe(4);
  expect(
    Array.from(primitive.indices?.value || []),
    'expands the fan into triangle-list indices'
  ).toEqual([0, 1, 2, 0, 2, 3]);
  expect(primitive.indices?.count, 'updates the generated index count').toBe(6);
  expect(primitive.indices?.max?.[0], 'records the generated maximum index').toBe(3);
});
test('gltf#postProcessGLTF materializes an implicit-zero index accessor', () => {
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      accessors: [
        {componentType: 5123, count: 3, type: 'SCALAR'},
        {componentType: 5126, count: 1, type: 'VEC3'}
      ],
      meshes: [{primitives: [{attributes: {POSITION: 1}, indices: 0, mode: 2}]}]
    },
    buffers: []
  } as GLTFWithBuffers);
  const primitive = json.meshes[0].primitives[0];
  expect(primitive.mode, 'converts LINE_LOOP to LINES').toBe(1);
  expect(
    Array.from(primitive.indices?.value || []),
    'uses the accessor implicit-zero values'
  ).toEqual([0, 0, 0, 0, 0, 0]);
});
test('gltf#postProcessGLTF applies sparse-only index accessor substitutions', () => {
  const sparseData = new Uint8Array([1, 3, 5, 0, 2, 0]);
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: sparseData.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 2},
        {buffer: 0, byteOffset: 2, byteLength: 4}
      ],
      accessors: [
        {
          componentType: 5123,
          count: 4,
          type: 'SCALAR',
          sparse: {
            count: 2,
            indices: {bufferView: 0, componentType: 5121},
            values: {bufferView: 1}
          }
        },
        {componentType: 5126, count: 6, type: 'VEC3'}
      ],
      meshes: [{primitives: [{attributes: {POSITION: 1}, indices: 0, mode: 2}]}]
    },
    buffers: [{arrayBuffer: sparseData.buffer, byteOffset: 0, byteLength: sparseData.byteLength}]
  } as GLTFWithBuffers);
  const primitive = json.meshes[0].primitives[0];
  expect(primitive.mode, 'converts LINE_LOOP to LINES').toBe(1);
  expect(
    Array.from(primitive.indices?.value || []),
    'applies sparse substitutions to the implicit-zero base'
  ).toEqual([0, 5, 5, 0, 0, 2, 2, 0]);
});

test('gltf#postProcessGLTF resolves the complete scene, material, texture, and skin graph', () => {
  const bytes = new Uint8Array(64);
  new Float32Array(bytes.buffer, 8, 6).set([1, 2, 3, 4, 5, 6]);
  const json = postProcessGLTF({
    baseUri: 'https://example.com/models/',
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: bytes.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 8, byteLength: 24, byteStride: 12},
        {buffer: 0, byteOffset: 0, byteLength: 8}
      ],
      accessors: [
        {bufferView: 0, componentType: 5126, count: 2, type: 'VEC3'},
        {componentType: 5123, count: 2, type: 'SCALAR'}
      ],
      images: [{bufferView: 1, mimeType: 'image/png'}, {uri: 'fallback.png'}],
      samplers: [{magFilter: 9728, minFilter: 9984, wrapS: 33071, wrapT: 33648}],
      textures: [{sampler: 0, source: 0}, {source: 1}, {}],
      materials: [
        {
          normalTexture: {index: 0},
          occlusionTexture: {index: 0},
          emissiveTexture: {index: 1},
          pbrMetallicRoughness: {
            baseColorTexture: {index: 0},
            metallicRoughnessTexture: {index: 1}
          }
        },
        {}
      ],
      meshes: [
        {primitives: [{attributes: {POSITION: 0}, indices: 1, material: 0, mode: 4}]},
        {id: 'second', primitives: []}
      ],
      cameras: [{type: 'perspective', perspective: {yfov: 1, znear: 0.1}}],
      skins: [{inverseBindMatrices: 1, joints: [0]}],
      nodes: [{mesh: 0, camera: 0, skin: 0, children: [1]}, {mesh: 0}],
      scenes: [{nodes: [0]}],
      scene: 0
    },
    buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}],
    images: [{width: 4, height: 2}]
  } as unknown as GLTFWithBuffers);

  expect(Array.from(json.accessors[0].value)).toEqual([1, 2, 3, 4, 5, 6]);
  expect(json.images[0].image).toEqual({width: 4, height: 2});
  expect(json.images[1].image).toBeNull();
  expect(json.textures[0].sampler.parameters).toMatchObject({
    10240: 9728,
    10241: 9984,
    10242: 33071,
    10243: 33648
  });
  expect(json.textures[1].sampler.id).toBe('default-sampler');
  expect(json.textures[2].source).toBeUndefined();
  expect(json.materials[0].emissiveFactor).toEqual([0, 0, 0]);
  expect(json.materials[1].emissiveFactor).toEqual([0, 0, 0]);
  expect(json.materials[0].normalTexture?.texture).toBe(json.textures[0]);
  expect(json.nodes[0].children?.[0]).toBe(json.nodes[1]);
  expect(json.nodes[1].mesh?.primitives).toHaveLength(1);
  expect(json.skins[0].inverseBindMatrices).toBe(json.accessors[1]);
  expect(json.scene).toBe(json.scenes[0]);
});

test('gltf#postProcessGLTF covers portable topology size boundaries', () => {
  const emptyLoop = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      accessors: [{componentType: 5126, count: 1, type: 'VEC3'}],
      meshes: [{primitives: [{attributes: {POSITION: 0}, mode: 2}]}]
    },
    buffers: []
  } as GLTFWithBuffers).meshes[0].primitives[0];
  expect(emptyLoop.indices?.value).toHaveLength(0);
  expect(emptyLoop.indices?.min).toBeUndefined();

  const largeFan = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      accessors: [{componentType: 5126, count: 65_537, type: 'VEC3'}],
      meshes: [{primitives: [{attributes: {POSITION: 0}, mode: 6}]}]
    },
    buffers: []
  } as GLTFWithBuffers).meshes[0].primitives[0];
  expect(largeFan.indices?.value).toBeInstanceOf(Uint32Array);
  expect(largeFan.indices?.componentType).toBe(5125);
  expect(largeFan.indices?.max).toEqual([65_536]);
});

test('gltf#postProcessGLTF validates sparse index types, ranges, and byte lengths', () => {
  const makeSparseSource = (componentType: number, index: number, valueByteLength = 4) => {
    const bytes = new Uint8Array([index, 0, 0, 0, 9, 0, 0, 0]);
    return {
      json: {
        asset: {version: '2.0'},
        buffers: [{byteLength: bytes.byteLength}],
        bufferViews: [
          {buffer: 0, byteLength: 4},
          {buffer: 0, byteOffset: 4, byteLength: valueByteLength}
        ],
        accessors: [
          {
            componentType: 5125,
            count: 2,
            type: 'SCALAR',
            sparse: {
              count: 1,
              indices: {bufferView: 0, componentType},
              values: {bufferView: 1}
            }
          }
        ]
      },
      buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}]
    } as unknown as GLTFWithBuffers;
  };

  expect(() => postProcessGLTF(makeSparseSource(5122, 0))).toThrow();
  expect(() => postProcessGLTF(makeSparseSource(5121, 4))).toThrow();
  expect(() => postProcessGLTF(makeSparseSource(5121, 0, 2))).toThrow();
});

test.each([
  ['SCALAR', 5123, new Uint16Array([9, 1, 2, 8]).subarray(1, 3), 1, 2],
  ['VEC2', 5123, new Uint16Array([0, 65535, 0, 65535]), 2, 2],
  ['VEC3', 5126, new Float32Array([0, 1, 2, 3, 4, 5]), 3, 4],
  ['VEC4', 5121, new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]), 4, 1]
] as const)('postprocessing completes inline decoded %s accessor metadata without copying storage', (type, componentType, value, components, bytesPerComponent) => {
  const decoded = {type, componentType, count: 2, value, normalized: true};
  const original = {...decoded};
  const output = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      meshes: [{primitives: [{attributes: {CUSTOM: decoded}, indices: decoded}]}]
    },
    buffers: []
  } as unknown as GLTFWithBuffers).meshes[0].primitives[0];
  for (const accessor of [output.attributes.CUSTOM, output.indices!]) {
    expect(accessor).toMatchObject({
      components,
      bytesPerComponent,
      bytesPerElement: components * bytesPerComponent,
      count: 2,
      normalized: true
    });
    expect(accessor.value).toBe(value);
    expect(accessor.value.byteOffset).toBe(value.byteOffset);
  }
  expect(decoded).toEqual(original);
});

test('postprocessing retains opaque interactivity indices and pointers', () => {
  const extension = {
    graphs: [{nodes: [{declaration: 0, configuration: {pointer: '/nodes/0/translation'}}]}]
  };
  const source: GLTFWithBuffers = {
    json: {
      asset: {version: '2.0'},
      extensions: {KHR_interactivity: extension},
      extensionsUsed: ['KHR_interactivity']
    },
    buffers: []
  };
  const snapshot = structuredClone(source);
  const output = postProcessGLTF(source);
  expect(output.extensions?.KHR_interactivity).toEqual(extension);
  expect(output.extensionsUsed).toContain('KHR_interactivity');
  expect(source).toEqual(snapshot);
});

test.each([
  [5124, new Int32Array([-123456789, 123456789])],
  [5130, new Float64Array([Math.PI, -0.25])],
  [5134, new BigInt64Array([-9007199254740993n, 9223372036854775807n])],
  [5135, new BigUint64Array([9007199254740993n, 18446744073709551615n])]
] as const)('postprocessing preserves extended accessor component type %s', (componentType, values) => {
  const output = postProcessGLTF({
    json: {
      asset: {version: '2.1'},
      buffers: [{byteLength: values.byteLength}],
      bufferViews: [{buffer: 0, byteLength: values.byteLength}],
      accessors: [{bufferView: 0, componentType, count: values.length, type: 'SCALAR'}]
    },
    buffers: [{arrayBuffer: values.buffer, byteOffset: 0, byteLength: values.byteLength}]
  });
  expect(output.accessors[0].value.constructor).toBe(values.constructor);
  expect(output.accessors[0].value).toEqual(values);
});

test('buffer-backed accessor values are independent copies and image URIs remain authored', () => {
  const values = new Float32Array([1, 2, 3]);
  const source: GLTFWithBuffers = {
    baseUri: 'https://example.com/models/',
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: values.byteLength}],
      bufferViews: [{buffer: 0, byteLength: values.byteLength}],
      accessors: [{bufferView: 0, componentType: 5126, count: 1, type: 'VEC3'}],
      images: [{uri: 'fallback.png'}]
    },
    buffers: [{arrayBuffer: values.buffer, byteOffset: 0, byteLength: values.byteLength}]
  };
  const output = postProcessGLTF(source);
  expect(output.accessors[0].value).toEqual(values);
  expect(output.accessors[0].value.buffer).not.toBe(values.buffer);
  values[0] = 99;
  expect(output.accessors[0].value[0]).toBe(1);
  expect(output.images[0].uri).toBe('fallback.png');
  expect(output.images[0].image).toBeNull();
});
