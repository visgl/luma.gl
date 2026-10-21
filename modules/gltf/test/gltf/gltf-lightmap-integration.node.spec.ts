// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {ModelNode, type GroupNode} from '@luma.gl/engine';
import {NullDevice} from '@luma.gl/test-utils';
import {createScenegraphsFromGLTF} from '../../src/gltf/create-scenegraph-from-gltf';

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
