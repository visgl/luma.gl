// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import type {PBREnvironment} from '@luma.gl/gltf';

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
