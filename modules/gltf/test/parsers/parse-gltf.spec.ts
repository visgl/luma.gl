// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
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

test('gltf#getVertexCount - single POSITION attribute', t => {
  const attributes = {
    POSITION: {
      value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      size: 3
    }
  };

  t.equals(testGetVertexCount(attributes), 3, 'Should calculate correct vertex count');
  t.end();
});

test('gltf#getVertexCount - multiple attributes', t => {
  const attributes = {
    POSITION: {value: new Float32Array(12), size: 3},
    NORMAL: {value: new Float32Array(12), size: 3}
  };

  t.equals(testGetVertexCount(attributes), 4, 'Should return consistent vertex count');
  t.end();
});

test('gltf#getVertexCount - components instead of size', t => {
  const attributes = {
    POSITION: {value: new Float32Array(9), components: 3}
  };

  t.equals(testGetVertexCount(attributes), 3, 'Should handle components attribute');
  t.end();
});

test('gltf#getVertexCount - quantized Uint16Array', t => {
  const attributes = {
    POSITION: {
      value: new Uint16Array([0, 32767, 65535, 1000, 2000, 3000]),
      size: 3
    }
  };

  t.equals(testGetVertexCount(attributes), 2, 'Should handle quantized data');
  t.end();
});

test('gltf#getVertexCount - empty attributes throws', t => {
  t.throws(
    () => testGetVertexCount({}),
    /Could not determine vertex count from attributes/,
    'Should throw for empty attributes'
  );
  t.end();
});

test('gltf#getVertexCount - null attributes skipped', t => {
  t.throws(
    () => testGetVertexCount({POSITION: null, NORMAL: undefined}),
    /Could not determine vertex count from attributes/,
    'Should throw when all attributes are null/undefined'
  );
  t.end();
});

test('gltf#parseGLTF - box.glb integration', async t => {
  const webglDevice = await getWebGLTestDevice();

  try {
    const gltf = await load('data/box.glb', GLTFLoader);
    const processedGLTF = gltf.json ? postProcessGLTF(gltf) : gltf;
    const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);
    const vertexCounts = collectVertexCounts(result.scenes);

    t.ok(result.scenes, 'Should create scenes');
    t.ok(result.scenes.length > 0, 'Should have at least one scene');
    t.ok(vertexCounts.length > 0, 'Should have at least one model');
    t.equals(vertexCounts[0], 36, 'Vertex count should be 36 (from indices)');
  } finally {
    webglDevice.destroy();
  }

  t.end();
});

test('gltf#parseGLTF resolves extension textures for shared materials', t => {
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

  t.ok(bindings.pbr_clearcoatSampler, 'shared material owns clearcoat sampler binding');

  materials.forEach(parsedMaterial => parsedMaterial.destroy());
  t.end();
});

test('gltf#parseGLTF routes IBL bindings onto model shader inputs', t => {
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

  t.ok(firstModelNode, 'scene contains a model node');
  t.equal(
    bindingValues.pbr_diffuseEnvSampler,
    diffuseTexture,
    'diffuse IBL texture is routed to model bindings'
  );
  t.equal(
    bindingValues.pbr_specularEnvSampler,
    specularTexture,
    'specular IBL texture is routed to model bindings'
  );
  t.equal(bindingValues.pbr_brdfLUT, brdfTexture, 'BRDF LUT is routed to model bindings');
  t.notOk(
    materials[0].getBindings().pbr_diffuseEnvSampler,
    'IBL bindings are not stranded on the material bind group'
  );

  firstModelNode.model.destroy();
  materials.forEach(parsedMaterial => parsedMaterial.destroy());
  diffuseTexture.destroy();
  specularTexture.destroy();
  brdfTexture.destroy();
  t.end();
});
