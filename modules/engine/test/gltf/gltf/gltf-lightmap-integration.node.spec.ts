// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import type {GLTFPostprocessed} from '@luma.gl/engine/gltf';
import {ModelNode, type GroupNode} from '@luma.gl/engine';
import {log} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils/device';
import {createScenegraphsFromGLTF} from '../../../src/gltf/gltf/create-scenegraph-from-gltf';

function makeDocument(instanced = false): GLTFPostprocessed {
  const material = {
    id: 'baked',
    extensions: {KHR_lightmap: {lightmapTexture: {index: 0, texCoord: 1}, intensity: 4}}
  };
  const variant = {...material, id: 'variant'};
  const mesh = {
    id: 'triangle',
    primitives: [
      {
        attributes: {
          POSITION: {
            components: 3,
            value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
            min: [0, 0, 0],
            max: [1, 1, 0]
          },
          TEXCOORD_1: {components: 2, value: new Float32Array([0, 0, 1, 0, 0, 1])}
        },
        material,
        extensions: {KHR_materials_variants: {mappings: [{material: 1, variants: [0]}]}}
      }
    ]
  };
  const node = {
    id: 'overridden',
    mesh,
    extensions: {
      KHR_lightmap: {
        lightmaps: [{primitive: 0, lightmapTexture: {index: 0, texCoord: 1}, intensity: 2}]
      }
    }
  };
  const nodes: unknown[] = [node, {id: 'shared-source', mesh}];
  if (instanced) {
    nodes.splice(0, nodes.length, {
      ...node,
      extensions: {
        ...node.extensions,
        EXT_mesh_gpu_instancing: {
          attributes: {
            TRANSLATION: {count: 2, components: 3, value: new Float32Array([0, 0, 0, 2, 0, 0])},
            _LIGHTMAP_INTENSITY: {count: 2, components: 1, value: new Float32Array([1, 0.25])},
            _LIGHTMAP_OFFSET: {count: 2, components: 2, value: new Float32Array([0, 0, 0.5, 0])}
          }
        }
      }
    });
  }
  return {
    asset: {version: '2.0'},
    accessors: [],
    animations: [],
    buffers: [],
    bufferViews: [],
    cameras: [],
    images: [],
    materials: [material, variant],
    meshes: [mesh],
    nodes,
    samplers: [],
    scenes: [{id: 'scene', nodes}],
    skins: [],
    extensions: {KHR_materials_variants: {variants: [{name: 'alternate'}]}},
    textures: [
      {
        id: 'atlas',
        sampler: {},
        source: {
          image: {
            compressed: true,
            data: [{data: new Uint8Array(16), width: 4, height: 4, textureFormat: 'bc7-rgba-unorm'}]
          }
        }
      }
    ]
  } as unknown as GLTFPostprocessed;
}

function collectModels(scenes: GroupNode[]): ModelNode[] {
  const models: ModelNode[] = [];
  for (const scene of scenes)
    scene.preorderTraversal(node => {
      if (node instanceof ModelNode) models.push(node);
    });
  return models;
}

function getLightmapIntensity(model: ModelNode): unknown {
  return model.model.material?.shaderInputs.getUniformValues().pbrMaterial.lightmapIntensity;
}

test('KHR_lightmap node overrides remain independent across material variants and are released', () => {
  const bundle = createScenegraphsFromGLTF(new NullDevice({}), makeDocument());
  const models = collectModels(bundle.scenes);
  expect(models.map(getLightmapIntensity)).toEqual([2, 4]);
  const defaultMaterials = models.map(model => model.model.material!);
  bundle.variants.selectVariant('alternate');
  expect(models.map(getLightmapIntensity)).toEqual([2, 4]);
  const variantMaterials = models.map(model => model.model.material!);
  expect(variantMaterials[0]).not.toBe(defaultMaterials[0]);
  bundle.variants.resetVariant();
  expect(models.map(model => model.model.material)).toEqual(defaultMaterials);
  const destruction = [...defaultMaterials, ...variantMaterials].map(material =>
    vi.spyOn(material, 'destroy')
  );
  bundle.destroy();
  for (const spy of destruction) expect(spy).toHaveBeenCalledTimes(1);
});

test('KHR_lightmap atlas instance multipliers and transforms survive variants', () => {
  const bundle = createScenegraphsFromGLTF(new NullDevice({}), makeDocument(true));
  const models = collectModels(bundle.scenes);
  expect(models.map(getLightmapIntensity)).toEqual([2, 0.5]);
  const transforms = models.map(
    model => model.model.material!.shaderInputs.getUniformValues().pbrMaterial.lightmapUVTransform
  );
  expect(transforms[0]?.[6]).toBe(0);
  expect(transforms[1]?.[6]).toBe(0.5);
  bundle.variants.selectVariant('alternate');
  expect(models.map(getLightmapIntensity)).toEqual([2, 0.5]);
  bundle.destroy();
});

test('KHR_lightmap expanded atlas models receive their owning skin palette', () => {
  const source = makeDocument(true);
  const primitive = source.meshes[0].primitives[0];
  primitive.attributes.JOINTS_0 = {components: 4, value: new Uint16Array(12)} as any;
  primitive.attributes.WEIGHTS_0 = {
    components: 4,
    value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0])
  } as any;
  source.nodes[0].skin = 0;
  const joint = {id: 'joint', translation: [0, 1, 0]} as (typeof source.nodes)[number];
  source.nodes.push(joint);
  source.skins.push({id: 'skin', joints: [1]} as (typeof source.skins)[number]);
  const bundle = createScenegraphsFromGLTF(new NullDevice({}), source);
  expect(bundle.skins.bindings[0].models).toHaveLength(2);
  expect(bundle.skins.bindings[0].jointMatrices[13]).toBe(1);
  for (const model of collectModels(bundle.scenes)) {
    expect(model.model.shaderInputs.getUniformValues().skin.jointMatrix[13]).toBe(1);
  }
  bundle.destroy();
});

test('KHR_lightmap private materials keep pointer animation while preserving atlas uniforms', () => {
  const source = makeDocument(true);
  source.materials[0].pbrMetallicRoughness = {
    baseColorFactor: [1, 0, 0, 1],
    metallicFactor: 0,
    baseColorTexture: {index: 0, texCoord: 1, extensions: {KHR_texture_transform: {offset: [0, 0]}}}
  } as any;
  source.accessors.push(
    {id: 'times', value: new Float32Array([0, 1]), components: 1, count: 2} as any,
    {
      id: 'colors',
      value: new Float32Array([1, 0, 0, 1, 0, 0, 1, 1]),
      components: 4,
      count: 2
    } as any,
    {id: 'metallic', value: new Float32Array([0, 1]), components: 1, count: 2} as any,
    {id: 'offset', value: new Float32Array([0, 0, 0.5, 0]), components: 2, count: 2} as any
  );
  const pointers = [
    'pbrMetallicRoughness/baseColorFactor',
    'pbrMetallicRoughness/metallicFactor',
    'pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset'
  ];
  source.animations.push({
    name: 'material',
    samplers: pointers.map((_, index) => ({input: 0, output: index + 1, interpolation: 'LINEAR'})),
    channels: pointers.map((pointer, index) => ({
      sampler: index,
      target: {
        path: 'pointer',
        extensions: {KHR_animation_pointer: {pointer: `/materials/0/${pointer}`}}
      }
    }))
  } as any);
  const bundle = createScenegraphsFromGLTF(new NullDevice({}), source);
  bundle.animator.setTime(500);
  const models = collectModels(bundle.scenes);
  for (const model of models) {
    const uniforms = model.model.material!.shaderInputs.getUniformValues().pbrMaterial;
    expect(uniforms.baseColorFactor).toEqual([0.5, 0, 0.5, 1]);
    expect(uniforms.metallicRoughnessValues[0]).toBe(0.5);
    expect(uniforms.baseColorUVTransform[6]).toBeCloseTo(0.25);
  }
  expect(models.map(getLightmapIntensity)).toEqual([2, 0.5]);
  bundle.destroy();
});

test('KHR_lightmap validates UVs after complete node overrides replace unused material bindings', () => {
  const source = makeDocument();
  const attributes = source.meshes[0].primitives[0].attributes;
  attributes.TEXCOORD_0 = attributes.TEXCOORD_1;
  delete attributes.TEXCOORD_1;
  for (const node of source.nodes)
    node.extensions = {
      KHR_lightmap: {lightmaps: [{primitive: 0, lightmapTexture: {index: 0, texCoord: 0}}]}
    };
  const bundle = createScenegraphsFromGLTF(new NullDevice({}), source);
  expect(collectModels(bundle.scenes).map(getLightmapIntensity)).toEqual([1, 1]);
  bundle.destroy();
  source.nodes[1].extensions = {};
  expect(() => createScenegraphsFromGLTF(new NullDevice({}), source)).toThrow();
});

test('cached ordinary meshes retain missing UV and normal diagnostics', () => {
  const source = makeDocument();
  for (const material of source.materials) {
    material.extensions = {};
    material.pbrMetallicRoughness = {baseColorTexture: {index: 0}};
  }
  for (const node of source.nodes) node.extensions = {};
  const warnings = vi.spyOn(log, 'warn').mockImplementation(() => () => {});
  try {
    const bundle = createScenegraphsFromGLTF(new NullDevice({}), source);
    const messages = warnings.mock.calls.map(([message]) => String(message));
    expect(messages.some(message => message.includes('missing TEXCOORD_0'))).toBe(true);
    expect(messages.some(message => message.includes('missing NORMAL'))).toBe(true);
    bundle.destroy();
  } finally {
    warnings.mockRestore();
  }
});
