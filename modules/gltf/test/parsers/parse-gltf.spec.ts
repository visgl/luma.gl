// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF, type GLTFPostprocessed} from '@loaders.gl/gltf';
import {createScenegraphsFromGLTF, type PBREnvironment} from '@luma.gl/gltf';
import {GroupNode, ModelNode} from '@luma.gl/engine';
import {NullDevice, getWebGLTestDevice} from '@luma.gl/test-utils';

import {parseGLTF} from '@luma.gl/gltf/parsers/parse-gltf';

const device = new NullDevice({});

function makeCompressedImage() {
  return {
    compressed: true as const,
    mipmaps: true,
    data: [
      {
        data: new Uint8Array(16),
        width: 4,
        height: 4,
        textureFormat: 'bc7-rgba-unorm' as const
      }
    ]
  };
}

function testGetVertexCount(attributes: any): number {
  let vertexCount = Infinity;
  for (const attribute of Object.values(attributes)) {
    if (attribute) {
      const {value, size, components} = attribute as any;
      const attributeSize = size ?? components;
      if (value?.length !== undefined && attributeSize >= 1) {
        vertexCount = Math.min(vertexCount, value.length / attributeSize);
      }
    }
  }

  if (!Number.isFinite(vertexCount)) {
    throw new Error('Could not determine vertex count from attributes');
  }

  return vertexCount;
}

function collectVertexCounts(scenes: GroupNode[]): number[] {
  const vertexCounts: number[] = [];
  for (const scene of scenes) {
    scene.traverse(node => {
      if (node instanceof ModelNode) {
        vertexCounts.push(node.model.vertexCount);
      }
    });
  }
  return vertexCounts;
}

it('gltf#getVertexCount - single POSITION attribute', () => {
  const attributes = {
    POSITION: {
      value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      size: 3
    }
  };

  expect(testGetVertexCount(attributes), 'Should calculate correct vertex count').toBe(3);
  void 0;
});

it('gltf#getVertexCount - multiple attributes', () => {
  const attributes = {
    POSITION: {value: new Float32Array(12), size: 3},
    NORMAL: {value: new Float32Array(12), size: 3}
  };

  expect(testGetVertexCount(attributes), 'Should return consistent vertex count').toBe(4);
  void 0;
});

// loaders.gl uses 'components' (derived from glTF accessor.type: "VEC3" -> 3)
// while luma.gl uses 'size'. This test ensures compatibility with loaders.gl output.
it('gltf#getVertexCount - components instead of size', () => {
  const attributes = {
    POSITION: {value: new Float32Array(9), components: 3}
  };

  expect(testGetVertexCount(attributes), 'Should handle components attribute').toBe(3);
  void 0;
});

it('gltf#getVertexCount - non-float typed array', () => {
  const attributes = {
    POSITION: {
      value: new Uint16Array([0, 32767, 65535, 1000, 2000, 3000]),
      size: 3
    }
  };

  expect(testGetVertexCount(attributes), 'Should handle quantized data').toBe(2);
  void 0;
});

it('gltf#getVertexCount - empty attributes throws', () => {
  expect(() => testGetVertexCount({}), 'Should throw for empty attributes').toThrow(
    /Could not determine vertex count from attributes/
  );
  void 0;
});

it('gltf#getVertexCount - null attributes skipped', () => {
  expect(
    () => testGetVertexCount({POSITION: null, NORMAL: undefined}),
    'Should throw when all attributes are null/undefined'
  ).toThrow(/Could not determine vertex count from attributes/);
  void 0;
});

it('gltf#parseGLTF - box.glb integration', async () => {
  const webglDevice = await getWebGLTestDevice();

  try {
    const gltf = await load('test/data/box.glb', GLTFLoader);
    const processedGLTF = gltf.json ? postProcessGLTF(gltf) : gltf;
    const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);
    const vertexCounts = collectVertexCounts(result.scenes);

    expect(Boolean(result.scenes), 'Should create scenes').toBe(true);
    expect(Boolean(result.scenes.length > 0), 'Should have at least one scene').toBe(true);
    expect(Boolean(vertexCounts.length > 0), 'Should have at least one model').toBe(true);
    expect(vertexCounts[0], 'Vertex count should be 36 (from indices)').toBe(36);
  } finally {
    webglDevice.destroy();
  }

  void 0;
});

it('gltf#parseGLTF - non-indexed geometry', async () => {
  const webglDevice = await getWebGLTestDevice();

  try {
    const gltf = await load('test/data/box-non-indexed.glb', GLTFLoader);
    const processedGLTF = gltf.json ? postProcessGLTF(gltf) : gltf;
    const mesh = processedGLTF.meshes?.[0];
    const primitive = mesh?.primitives?.[0];
    const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);
    const vertexCounts = collectVertexCounts(result.scenes);

    expect(Boolean(primitive?.indices), 'Primitive should not have indices').toBe(false);
    expect(Boolean(result.scenes), 'Should create scenes from non-indexed glTF').toBe(true);
    expect(Boolean(result.scenes.length > 0), 'Should have at least one scene').toBe(true);
    expect(Boolean(vertexCounts.length > 0), 'Should have at least one model').toBe(true);
    expect(vertexCounts[0], 'Vertex count should be 24 (from POSITION attribute)').toBe(24);
  } finally {
    webglDevice.destroy();
  }

  void 0;
});

it('gltf#parseGLTF - KHR_mesh_quantization point cloud', async () => {
  const webglDevice = await getWebGLTestDevice();

  try {
    const gltf = await load('test/data/quantized-point-cloud.glb', GLTFLoader);
    const processedGLTF = gltf.json ? postProcessGLTF(gltf) : gltf;
    const extensions = processedGLTF.extensionsUsed || [];
    const mesh = processedGLTF.meshes?.[0];
    const primitive = mesh?.primitives?.[0];
    const positionAccessor = primitive?.attributes?.POSITION;
    const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);
    const vertexCounts = collectVertexCounts(result.scenes);

    expect(
      Boolean(extensions.includes('KHR_mesh_quantization')),
      'File should use KHR_mesh_quantization extension'
    ).toBe(true);
    expect(Boolean(positionAccessor?.normalized), 'POSITION should be normalized').toBe(true);
    expect(
      Boolean(positionAccessor?.value instanceof Uint16Array),
      'POSITION should use Uint16Array (quantized)'
    ).toBe(true);
    expect(Boolean(primitive?.indices), 'Point cloud should not have indices').toBe(false);
    expect(Boolean(result.scenes), 'Should create scenes from quantized glTF').toBe(true);
    expect(Boolean(result.scenes.length > 0), 'Should have at least one scene').toBe(true);
    expect(Boolean(vertexCounts.length > 0), 'Should have at least one model').toBe(true);
    expect(vertexCounts[0], 'Vertex count should be 24 (from POSITION attribute)').toBe(24);
  } finally {
    webglDevice.destroy();
  }

  void 0;
});

it('gltf#parseGLTF - nonquantized.glb (float32 mesh)', async () => {
  const webglDevice = await getWebGLTestDevice();

  try {
    const gltf = await load('test/data/nonquantized.glb', GLTFLoader);
    const processedGLTF = gltf.json ? postProcessGLTF(gltf) : gltf;
    const extensions = processedGLTF.extensionsUsed || [];
    const mesh = processedGLTF.meshes?.[0];
    const primitive = mesh?.primitives?.[0];
    const positionAccessor = primitive?.attributes?.POSITION;
    const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);
    const vertexCounts = collectVertexCounts(result.scenes);

    expect(
      Boolean(extensions.includes('KHR_mesh_quantization')),
      'File should NOT use KHR_mesh_quantization extension'
    ).toBe(false);
    expect(
      Boolean(positionAccessor?.value instanceof Float32Array),
      'POSITION should use Float32Array (non-quantized)'
    ).toBe(true);
    expect(Boolean(primitive?.indices), 'Mesh should have indices').toBe(true);
    expect(Boolean(result.scenes), 'Should create scenes from non-quantized glTF').toBe(true);
    expect(Boolean(result.scenes.length > 0), 'Should have at least one scene').toBe(true);
    expect(Boolean(vertexCounts.length > 0), 'Should have at least one model').toBe(true);
    expect(vertexCounts[0], 'Vertex count should be 3072 (from indices)').toBe(3072);
  } finally {
    webglDevice.destroy();
  }

  void 0;
});

it('gltf#parseGLTF - quantized.glb (snorm8x3 + uint16x3)', async () => {
  const webglDevice = await getWebGLTestDevice();

  try {
    const gltf = await load('test/data/quantized.glb', GLTFLoader);
    const processedGLTF = gltf.json ? postProcessGLTF(gltf) : gltf;
    const extensions = processedGLTF.extensionsUsed || [];
    const mesh = processedGLTF.meshes?.[0];
    const primitive = mesh?.primitives?.[0];
    const normalAccessor = primitive?.attributes?.NORMAL;
    const positionAccessor = primitive?.attributes?.POSITION;
    const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);
    const vertexCounts = collectVertexCounts(result.scenes);

    expect(
      Boolean(extensions.includes('KHR_mesh_quantization')),
      'File should use KHR_mesh_quantization extension'
    ).toBe(true);
    expect(Boolean(normalAccessor?.normalized), 'NORMAL should be normalized').toBe(true);
    expect(
      Boolean(normalAccessor?.value instanceof Int8Array),
      'NORMAL should use Int8Array (snorm8x3)'
    ).toBe(true);
    expect(
      Boolean(positionAccessor?.value instanceof Uint16Array),
      'POSITION should use Uint16Array (uint16x3)'
    ).toBe(true);
    expect(Boolean(primitive?.indices), 'Mesh should have indices').toBe(true);
    expect(Boolean(result.scenes), 'Should create scenes from quantized glTF').toBe(true);
    expect(Boolean(result.scenes.length > 0), 'Should have at least one scene').toBe(true);
    expect(Boolean(vertexCounts.length > 0), 'Should have at least one model').toBe(true);
    expect(vertexCounts[0], 'Vertex count should be 3072 (from indices)').toBe(3072);
  } finally {
    webglDevice.destroy();
  }

  void 0;
});

it('gltf#parseGLTF resolves extension textures for shared materials', () => {
  const material = {
    id: 'material-0',
    extensions: {
      KHR_materials_clearcoat: {
        clearcoatFactor: 1,
        clearcoatTexture: {
          id: 'clearcoat-texture-info',
          index: 0
        }
      }
    }
  } as GLTFPostprocessed['materials'][number];

  const primitive = {
    attributes: {
      POSITION: {
        components: 3,
        value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        min: [0, 0, 0],
        max: [1, 1, 0]
      },
      TEXCOORD_0: {
        components: 2,
        value: new Float32Array([0, 0, 1, 0, 0, 1])
      }
    },
    indices: {
      count: 3,
      value: new Uint16Array([0, 1, 2])
    },
    material
  };

  const mesh = {
    id: 'mesh-0',
    primitives: [primitive]
  } as GLTFPostprocessed['meshes'][number];

  const node = {
    id: 'node-0',
    mesh
  } as GLTFPostprocessed['nodes'][number];

  const scene = {
    id: 'scene-0',
    nodes: [node]
  } as GLTFPostprocessed['scenes'][number];

  const gltf = {
    id: 'test-gltf',
    accessors: [],
    animations: [],
    asset: {version: '2.0'},
    buffers: [],
    bufferViews: [],
    cameras: [],
    images: [],
    materials: [material],
    meshes: [mesh],
    nodes: [node],
    samplers: [],
    scenes: [scene],
    skins: [],
    textures: [
      {
        id: 'clearcoat-texture',
        source: {image: makeCompressedImage()},
        sampler: {}
      }
    ]
  } as unknown as GLTFPostprocessed;

  const {materials} = parseGLTF(device, gltf, {});
  const bindings = materials[0].getBindings();

  expect(
    Boolean(bindings.pbr_clearcoatSampler),
    'shared material owns clearcoat sampler binding'
  ).toBe(true);

  materials.forEach(parsedMaterial => parsedMaterial.destroy());
  void 0;
});

it('gltf#parseGLTF routes IBL bindings onto model shader inputs', () => {
  const material = {
    id: 'material-0',
    pbrMetallicRoughness: {
      baseColorFactor: [1, 1, 1, 1],
      metallicFactor: 1,
      roughnessFactor: 0.2
    }
  } as GLTFPostprocessed['materials'][number];

  const primitive = {
    attributes: {
      POSITION: {
        components: 3,
        value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        min: [0, 0, 0],
        max: [1, 1, 0]
      },
      NORMAL: {
        components: 3,
        value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])
      }
    },
    indices: {
      count: 3,
      value: new Uint16Array([0, 1, 2])
    },
    material
  };

  const mesh = {
    id: 'mesh-0',
    primitives: [primitive]
  } as GLTFPostprocessed['meshes'][number];

  const node = {
    id: 'node-0',
    mesh
  } as GLTFPostprocessed['nodes'][number];

  const scene = {
    id: 'scene-0',
    nodes: [node]
  } as GLTFPostprocessed['scenes'][number];

  const gltf = {
    id: 'test-gltf',
    accessors: [],
    animations: [],
    asset: {version: '2.0'},
    buffers: [],
    bufferViews: [],
    cameras: [],
    images: [],
    materials: [material],
    meshes: [mesh],
    nodes: [node],
    samplers: [],
    scenes: [scene],
    skins: [],
    textures: []
  } as unknown as GLTFPostprocessed;

  const diffuseTexture = device.createTexture({
    id: 'ibl-diffuse',
    dimension: 'cube',
    width: 1,
    height: 1
  });
  const specularTexture = device.createTexture({
    id: 'ibl-specular',
    dimension: 'cube',
    width: 1,
    height: 1,
    mipLevels: 1
  });
  const brdfTexture = device.createTexture({id: 'ibl-brdf', width: 1, height: 1});
  const imageBasedLightingEnvironment = {
    diffuseEnvSampler: {texture: diffuseTexture},
    specularEnvSampler: {texture: specularTexture},
    brdfLutTexture: {texture: brdfTexture}
  } as PBREnvironment;

  const {scenes, materials} = parseGLTF(device, gltf, {imageBasedLightingEnvironment});

  let firstModelNode: any = null;
  scenes[0].traverse(scenegraphNode => {
    if ('model' in scenegraphNode && !firstModelNode) {
      firstModelNode = scenegraphNode;
    }
  });

  const bindingValues = firstModelNode?.model.shaderInputs.getBindingValues();

  expect(Boolean(firstModelNode), 'scene contains a model node').toBe(true);
  expect(
    bindingValues.pbr_diffuseEnvSampler,
    'diffuse IBL texture is routed to model bindings'
  ).toBe(diffuseTexture);
  expect(
    bindingValues.pbr_specularEnvSampler,
    'specular IBL texture is routed to model bindings'
  ).toBe(specularTexture);
  expect(bindingValues.pbr_brdfLUT, 'BRDF LUT is routed to model bindings').toBe(brdfTexture);
  expect(
    Boolean(materials[0].getBindings().pbr_diffuseEnvSampler),
    'IBL bindings are not stranded on the material bind group'
  ).toBe(false);

  firstModelNode.model.destroy();
  materials.forEach(parsedMaterial => parsedMaterial.destroy());
  diffuseTexture.destroy();
  specularTexture.destroy();
  brdfTexture.destroy();
  void 0;
});
