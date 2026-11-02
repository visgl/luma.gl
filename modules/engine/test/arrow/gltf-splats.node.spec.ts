// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {makeArrowFixedSizeListVector} from '@luma.gl/graph/arrow';
import {NullDevice} from '@luma.gl/core/test-utils';
import {getGLTFSplatSceneInstances, makeGPUSplatDataFromGLTFScene} from '@luma.gl/engine/arrow';
import {createScenegraphsFromGLTF, postProcessGLTF} from '@luma.gl/engine/gltf';
import type {GLTFSplatPrimitive} from '@luma.gl/engine/splats';

const extension = {kernel: 'ellipse', colorSpace: 'lin_rec709_display'};

/** Creates a minimal resolved glTF Gaussian primitive. */
function makePrimitive(): GLTFSplatPrimitive {
  return {
    mode: 0,
    extensions: {KHR_gaussian_splatting: extension},
    attributes: {
      POSITION: new Float32Array([1, 2, 3]),
      'KHR_gaussian_splatting:SCALE': new Float32Array([1, 2, 3]),
      'KHR_gaussian_splatting:ROTATION': new Float32Array([0, 0, 0, 1]),
      'KHR_gaussian_splatting:OPACITY': new Float32Array([0.5]),
      'KHR_gaussian_splatting:SH_DEGREE_0_COEF_0': new Float32Array([0, 0, 0])
    }
  };
}

/** Creates one Arrow Gaussian record batch with linear scalar data. */
function makeArrowTable() {
  return new arrow.Table({
    POSITION: makeArrowFixedSizeListVector(new arrow.Float32(), 3, new Float32Array([4, 5, 6])),
    scale_0: arrow.makeVector(new Float32Array([0])),
    scale_1: arrow.makeVector(new Float32Array([0])),
    scale_2: arrow.makeVector(new Float32Array([0])),
    rot_0: arrow.makeVector(new Float32Array([1])),
    rot_1: arrow.makeVector(new Float32Array([0])),
    rot_2: arrow.makeVector(new Float32Array([0])),
    rot_3: arrow.makeVector(new Float32Array([0])),
    opacity: arrow.makeVector(new Float32Array([0])),
    f_dc_0: arrow.makeVector(new Float32Array([0])),
    f_dc_1: arrow.makeVector(new Float32Array([0])),
    f_dc_2: arrow.makeVector(new Float32Array([0]))
  });
}

test('postProcessGLTF preserves loader Gaussian descriptors', () => {
  const descriptors = [{meshIndex: 0, primitiveIndex: 0, decoded: {shape: 'arrow-table'}}];
  const gltf = postProcessGLTF({
    json: {asset: {version: '2.0'}},
    buffers: [],
    gaussianSplatPrimitives: descriptors
  } as any);
  expect(gltf.gaussianSplatPrimitives).toBe(descriptors);
});

test('prepares decoded Arrow and accessor primitives without re-decoding', async () => {
  const table = makeArrowTable();
  const decoded = {
    ...makePrimitive(),
    attributes: {},
    extensions: {
      KHR_gaussian_splatting: {
        ...extension,
        extensions: {KHR_gaussian_splatting_compression_spz_2: {bufferView: 0}}
      }
    }
  };
  const gltf = {
    meshes: [{primitives: [decoded, makePrimitive()]}],
    gaussianSplatPrimitives: [
      {meshIndex: 0, primitiveIndex: 0, decoded: {shape: 'arrow-table', data: table}}
    ]
  } as any;
  let decodedAgain = false;
  const groups = await makeGPUSplatDataFromGLTFScene(new NullDevice({}), gltf, {
    sourceBatchIndex: 4,
    rowIndexBase: 10,
    decodeCompressedPrimitive: async primitive => {
      decodedAgain = true;
      return primitive;
    }
  });
  expect(decodedAgain).toBe(false);
  expect(groups.map(group => [group.meshIndex, group.primitiveIndex])).toEqual([
    [0, 0],
    [0, 1]
  ]);
  expect(
    groups.map(group => [group.batches[0].sourceBatchIndex, group.batches[0].rowIndexBase])
  ).toEqual([
    [4, 10],
    [5, 11]
  ]);
  expect(Array.from(groups[0].batches[0].source.positions)).toEqual([4, 5, 6]);
  expect(Array.from(groups[1].batches[0].source.positions)).toEqual([1, 2, 3]);
  for (const group of groups) for (const batch of group.batches) batch.destroy();
});

test('destroys earlier batches if later decoding fails', async () => {
  const device = new NullDevice({});
  const first = makePrimitive();
  const second = {
    ...makePrimitive(),
    attributes: {},
    extensions: {
      KHR_gaussian_splatting: {
        ...extension,
        extensions: {KHR_gaussian_splatting_compression_spz_2: {bufferView: 0}}
      }
    }
  };
  const buffers: any[] = [];
  const originalCreateBuffer = device.createBuffer.bind(device);
  device.createBuffer = ((props: any) => {
    const buffer = originalCreateBuffer(props);
    buffers.push(buffer);
    return buffer;
  }) as typeof device.createBuffer;
  await expect(
    makeGPUSplatDataFromGLTFScene(device, {meshes: [{primitives: [first, second]}]} as any, {
      decodeCompressedPrimitive: async () => {
        throw new Error('decoder failed');
      }
    })
  ).rejects.toThrow('decoder failed');
  expect(buffers.length).toBeGreaterThan(0);
  expect(buffers.every(buffer => buffer.destroyed)).toBe(true);
});

test('aborted preparation allocates no buffers', async () => {
  const controller = new AbortController();
  controller.abort();
  const device = new NullDevice({});
  await expect(
    makeGPUSplatDataFromGLTFScene(device, {meshes: [{primitives: [makePrimitive()]}]} as any, {
      signal: controller.signal
    })
  ).rejects.toThrow();
});

test('opt-in scene creation skips compressed Gaussian primitives instead of creating mesh models', () => {
  const gltf = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      meshes: [
        {primitives: [{mode: 0, attributes: {}, extensions: {KHR_gaussian_splatting: extension}}]}
      ],
      nodes: [{mesh: 0, translation: [1, 2, 3]}],
      scenes: [{nodes: [0]}]
    },
    buffers: []
  } as any);
  const scene = createScenegraphsFromGLTF(new NullDevice({}), gltf, {
    excludeGaussianSplatPrimitives: true
  });
  expect(scene.gltfNodeIndexToNodeMap.get(0)?.position).toEqual([1, 2, 3]);
  expect(scene.gltfMeshIdToNodeMap.get(gltf.meshes[0].id)?.children).toHaveLength(0);
  scene.destroy();
});

test('prepares an embedded SPZ payload decoded by loaders.gl', async () => {
  const {parse} = await import('@loaders.gl/core');
  const {GLTFLoader} = await import('@loaders.gl/scene/gltf');
  const {SPZLoader} = await import('@loaders.gl/splats');
  const encoded = 'H4sIAAAAAAAAE/NzDw5gYmBgYARiBh4gFmCAgP8NDQ0LFiwAsgB3I+Z5IwAAAA==';
  const bytes = Buffer.from(encoded, 'base64');
  const json = JSON.stringify({
    asset: {version: '2.0'},
    extensionsUsed: ['KHR_gaussian_splatting', 'KHR_gaussian_splatting_compression_spz_2'],
    buffers: [{byteLength: bytes.length, uri: `data:application/octet-stream;base64,${encoded}`}],
    bufferViews: [{buffer: 0, byteLength: bytes.length}],
    meshes: [
      {
        primitives: [
          {
            mode: 0,
            attributes: {},
            extensions: {
              KHR_gaussian_splatting: {
                ...extension,
                extensions: {KHR_gaussian_splatting_compression_spz_2: {bufferView: 0}}
              }
            }
          }
        ]
      }
    ]
  });
  const loaded = await parse(json, [GLTFLoader, SPZLoader], {
    core: {mimeType: 'model/gltf+json'},
    splats: {shape: 'arrow-table'}
  });
  const gltf = postProcessGLTF(loaded as any);
  const groups = await makeGPUSplatDataFromGLTFScene(new NullDevice({}), gltf);
  expect(groups).toHaveLength(1);
  expect(Array.from(groups[0].batches[0].source.positions)).toEqual([1, 0, 0]);
  groups[0].batches[0].destroy();
});

test('destroys already allocated columns when a GPU allocation fails', async () => {
  const device = new NullDevice({});
  const originalCreateBuffer = device.createBuffer.bind(device);
  const buffers: any[] = [];
  device.createBuffer = ((props: any) => {
    if (buffers.length === 2) throw new Error('out of memory');
    const buffer = originalCreateBuffer(props);
    buffers.push(buffer);
    return buffer;
  }) as typeof device.createBuffer;
  await expect(
    makeGPUSplatDataFromGLTFScene(device, {meshes: [{primitives: [makePrimitive()]}]} as any)
  ).rejects.toThrow('out of memory');
  expect(buffers.every(buffer => buffer.destroyed)).toBe(true);
});

test('preserves glTF feature IDs alongside decoded Arrow rows', async () => {
  const sourceBatch = makeArrowTable().batches[0];
  const table = new arrow.Table([sourceBatch, sourceBatch]);
  const primitive = {
    ...makePrimitive(),
    attributes: {...makePrimitive().attributes, _FEATURE_ID_0: {value: new Uint16Array([17, 18])}},
    extensions: {...makePrimitive().extensions, EXT_mesh_features: {featureIds: [{attribute: 0}]}}
  };
  const gltf = {
    meshes: [{primitives: [primitive]}],
    gaussianSplatPrimitives: [
      {meshIndex: 0, primitiveIndex: 0, decoded: {shape: 'arrow-table', data: table}}
    ]
  };
  const groups = await makeGPUSplatDataFromGLTFScene(new NullDevice({}), gltf as any);
  expect(Array.from(groups[0].batches[0].source.semanticIds!)).toEqual([17]);
  expect(Array.from(groups[0].batches[1].source.semanticIds!)).toEqual([18]);
  expect(groups[0].batches.map(batch => batch.sourceBatchIndex)).toEqual([0, 1]);
  for (const batch of groups[0].batches) batch.destroy();
  primitive.attributes._FEATURE_ID_0.value = new Uint16Array([17]);
  await expect(makeGPUSplatDataFromGLTFScene(new NullDevice({}), gltf as any)).rejects.toThrow(
    'feature-ID count'
  );
});

test('rejects an incompatible decoded result rather than treating it as Arrow', async () => {
  const gltf = {
    meshes: [{primitives: [makePrimitive()]}],
    gaussianSplatPrimitives: [{meshIndex: 0, primitiveIndex: 0, decoded: {shape: 'mesh'}}]
  };
  await expect(makeGPUSplatDataFromGLTFScene(new NullDevice({}), gltf as any)).rejects.toThrow(
    'Mesh Arrow table'
  );
});

test('resolves visible splat node instances with their ancestor transforms', () => {
  const gltf = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      meshes: [
        {primitives: [{mode: 0, attributes: {}, extensions: {KHR_gaussian_splatting: extension}}]}
      ],
      nodes: [
        {translation: [10, 0, 0], children: [1, 2]},
        {mesh: 0, translation: [0, 2, 0]},
        {mesh: 0, translation: [0, 0, 3]}
      ],
      scenes: [{nodes: [0]}]
    },
    buffers: []
  } as any);
  const scene = createScenegraphsFromGLTF(new NullDevice({}), gltf, {
    excludeGaussianSplatPrimitives: true
  });
  const group = {meshIndex: 0, primitiveIndex: 0, batches: []};
  const instances = getGLTFSplatSceneInstances(scene, [group]);
  expect(instances.map(instance => instance.nodeIndex)).toEqual([1, 2]);
  expect(instances.map(instance => Array.from(instance.worldMatrix.slice(12, 15)))).toEqual([
    [10, 2, 0],
    [10, 0, 3]
  ]);
  scene.gltfNodeIndexToNodeMap.get(1)!.display = false;
  expect(getGLTFSplatSceneInstances(scene, [group]).map(instance => instance.nodeIndex)).toEqual([
    2
  ]);
  scene.destroy();
});

test('rejects decoded sRGB splats until their color space is converted', async () => {
  const primitive = {
    ...makePrimitive(),
    extensions: {KHR_gaussian_splatting: {...extension, colorSpace: 'srgb_rec709_display'}}
  };
  const gltf = {
    meshes: [{primitives: [primitive]}],
    gaussianSplatPrimitives: [
      {meshIndex: 0, primitiveIndex: 0, decoded: {shape: 'arrow-table', data: makeArrowTable()}}
    ]
  };
  await expect(makeGPUSplatDataFromGLTFScene(new NullDevice({}), gltf as any)).rejects.toThrow(
    'Unsupported decoded glTF Gaussian splat primitive'
  );
});
