// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, type GLTFPostprocessed, postProcessGLTF} from '@loaders.gl/gltf';
import {ModelNode} from '@luma.gl/engine';
import {
  assertSupportedGLTFExtensions,
  createScenegraphsFromGLTF,
  getGLTFExtensionSupport,
  getGLTFNodeInstancing,
  getUnsupportedRequiredGLTFExtensions,
  parseGLTFLights
} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test} from 'vitest';

async function loadNativeExtensionFixture(name: string): Promise<GLTFPostprocessed> {
  const data = await readFile(new URL(`../data/${name}.glb`, import.meta.url));
  return postProcessGLTF(await parse(data, GLTFLoader, {gltf: {loadImages: false}}));
}

function getVisibleModelNodes(gltf: ReturnType<typeof createScenegraphsFromGLTF>): ModelNode[] {
  const modelNodes: ModelNode[] = [];
  for (const scene of gltf.scenes) {
    scene.traverse(node => {
      if (node instanceof ModelNode) {
        modelNodes.push(node);
      }
    });
  }
  return modelNodes;
}

function destroyScenegraphs(
  device: NullDevice,
  scenegraphs: ReturnType<typeof createScenegraphsFromGLTF>
): void {
  for (const scene of scenegraphs.scenes) {
    scene.destroy();
  }
  device.destroy();
}

describe('standards-native glTF extension runtime', () => {
  test('draws the official instancing asset with one source primitive and authored matrices', async () => {
    const source = await loadNativeExtensionFixture('SimpleInstancing');
    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source, {strictExtensions: true});

    try {
      const instancing = getGLTFNodeInstancing(source, source.nodes[0]);
      const modelNodes = getVisibleModelNodes(scenegraphs);

      expect(instancing).not.toBeNull();
      expect(instancing?.matrices.length).toBeGreaterThan(1);
      expect(Object.keys(instancing?.attributes || {})).toEqual([
        'TRANSLATION',
        'ROTATION',
        'SCALE'
      ]);
      expect(modelNodes).toHaveLength(1);
      expect(modelNodes[0].model.instanceCount).toBe(instancing?.matrices.length);
      expect(modelNodes[0].model.isInstanced).toBe(true);
      expect(modelNodes[0].instanceMatrices).toHaveLength(instancing?.matrices.length || 0);
      expect(
        modelNodes[0].model.bufferLayout.filter(layout => layout.stepMode === 'instance')
      ).toHaveLength(4);
      expect(scenegraphs.extensionSupport.get('EXT_mesh_gpu_instancing')).toMatchObject({
        supportLevel: 'built-in',
        supported: true
      });
      expect(scenegraphs.modelBounds.size[0]).toBeGreaterThan(1);
    } finally {
      destroyScenegraphs(device, scenegraphs);
    }
  });

  test('preserves custom instance semantics and normalized signed rotation accessors', async () => {
    const source = await loadNativeExtensionFixture('SimpleInstancing');
    const extension = source.nodes[0].extensions!['EXT_mesh_gpu_instancing'];
    const originalRotation = source.accessors[extension.attributes.ROTATION];
    const normalizedRotation = new Int8Array(originalRotation.count * 4);
    for (let index = 0; index < originalRotation.count; index++) {
      normalizedRotation[index * 4 + 3] = 127;
    }
    source.accessors.push({
      ...originalRotation,
      componentType: 5120,
      normalized: true,
      value: normalizedRotation
    });
    extension.attributes.ROTATION = source.accessors.length - 1;
    extension.attributes._FEATURE_ID = extension.attributes.TRANSLATION;

    const instancing = getGLTFNodeInstancing(source, source.nodes[0]);
    expect(instancing?.attributes['_FEATURE_ID']).toBeDefined();
    expect(instancing?.attributes['ROTATION'].normalized).toBe(true);
    expect(instancing?.matrices[0].every(Number.isFinite)).toBe(true);
  });

  test('recursively hides official visibility descendants and evaluates boolean STEP pointers', async () => {
    const source = await loadNativeExtensionFixture('CubeVisibility');
    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source, {strictExtensions: true});

    try {
      expect(scenegraphs.gltfNodeIndexToNodeMap.get(1)?.display).toBe(false);
      expect(getVisibleModelNodes(scenegraphs)).toHaveLength(2);
      expect(scenegraphs.animations[0].channels[0]).toMatchObject({
        type: 'node',
        path: 'visibility'
      });

      const channel = scenegraphs.animations[0].channels[0];
      const hiddenKeyframe = channel.sampler.output.findIndex(value => value[0] === 0);
      expect(hiddenKeyframe).toBeGreaterThanOrEqual(0);
      scenegraphs.animator.setTime(channel.sampler.input[hiddenKeyframe] * 1000);

      expect(scenegraphs.gltfNodeIndexToNodeMap.get(5)?.display).toBe(false);
      expect(getVisibleModelNodes(scenegraphs)).toHaveLength(1);

      const visibleKeyframe = channel.sampler.output.findIndex(value => value[0] === 1);
      scenegraphs.animator.setTime(channel.sampler.input[visibleKeyframe] * 1000);
      expect(scenegraphs.gltfNodeIndexToNodeMap.get(5)?.display).toBe(true);
      expect(getVisibleModelNodes(scenegraphs)).toHaveLength(2);
    } finally {
      destroyScenegraphs(device, scenegraphs);
    }
  });

  test('filters hidden authored lights and refreshes the stable light array when visibility animates', async () => {
    const source = await loadNativeExtensionFixture('LightVisibility');
    expect(parseGLTFLights(source, {useByteColors: false})).toHaveLength(2);

    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source, {
      strictExtensions: true,
      useByteColors: false
    });

    try {
      const originalLights = scenegraphs.lights;
      expect(originalLights).toHaveLength(2);

      const channel = scenegraphs.animations[0].channels[0];
      const hiddenKeyframe = channel.sampler.output.findIndex(value => value[0] === 0);
      scenegraphs.animator.setTime(channel.sampler.input[hiddenKeyframe] * 1000);

      expect(scenegraphs.lights).toBe(originalLights);
      expect(scenegraphs.lights).toHaveLength(1);
      expect(scenegraphs.gltfNodeIndexToNodeMap.get(5)?.display).toBe(false);
    } finally {
      destroyScenegraphs(device, scenegraphs);
    }
  });

  test('animates camera projections and typed punctual-light properties without mutating source data', async () => {
    const source = await loadNativeExtensionFixture('LightVisibility');
    source.cameras = [
      {
        id: 'camera-0',
        type: 'perspective',
        perspective: {id: 'perspective-0', yfov: 1, znear: 0.1}
      }
    ] as GLTFPostprocessed['cameras'];

    function addScalarAccessor(values: number[]): number {
      const typedValues = new Float32Array(values);
      source.accessors.push({
        id: `animation-accessor-${source.accessors.length}`,
        componentType: 5126,
        count: values.length,
        type: 'SCALAR',
        components: 1,
        value: typedValues,
        bufferView: {data: {buffer: typedValues.buffer}}
      } as GLTFPostprocessed['accessors'][number]);
      return source.accessors.length - 1;
    }

    const timeAccessor = addScalarAccessor([0, 1]);
    const fieldOfViewAccessor = addScalarAccessor([1, 2]);
    const intensityAccessor = addScalarAccessor([1, 5]);
    const redAccessor = addScalarAccessor([1, 0.2]);
    source.animations = [
      {
        id: 'typed-scene-animation',
        name: 'Typed scene animation',
        channels: [
          {
            sampler: 0,
            target: {
              path: 'pointer',
              extensions: {KHR_animation_pointer: {pointer: '/cameras/0/perspective/yfov'}}
            }
          },
          {
            sampler: 1,
            target: {
              path: 'pointer',
              extensions: {
                KHR_animation_pointer: {
                  pointer: '/extensions/KHR_lights_punctual/lights/1/intensity'
                }
              }
            }
          },
          {
            sampler: 2,
            target: {
              path: 'pointer',
              extensions: {
                KHR_animation_pointer: {
                  pointer: '/extensions/KHR_lights_punctual/lights/1/color/0'
                }
              }
            }
          }
        ],
        samplers: [
          {input: timeAccessor, output: fieldOfViewAccessor, interpolation: 'LINEAR'},
          {input: timeAccessor, output: intensityAccessor, interpolation: 'LINEAR'},
          {input: timeAccessor, output: redAccessor, interpolation: 'LINEAR'}
        ]
      }
    ] as GLTFPostprocessed['animations'];

    const originalIntensity = (source as GLTFPostprocessed & {lights: {intensity: number}[]})
      .lights[1].intensity;
    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source, {useByteColors: false});

    try {
      expect(scenegraphs.animations[0].channels.map(channel => channel.type)).toEqual([
        'camera',
        'light',
        'light'
      ]);
      const originalLights = scenegraphs.lights;
      scenegraphs.animator.setTime(500);

      expect(scenegraphs.cameras[0].perspective?.yfov).toBeCloseTo(1.5);
      expect(source.cameras[0].perspective?.yfov).toBe(1);
      expect(scenegraphs.lights).toBe(originalLights);
      expect(scenegraphs.lights[0].intensity).toBeCloseTo(3);
      expect(scenegraphs.lights[0].color?.[0]).toBeCloseTo(0.6);
      expect(
        (source as GLTFPostprocessed & {lights: {intensity: number}[]}).lights[1].intensity
      ).toBe(originalIntensity);
    } finally {
      destroyScenegraphs(device, scenegraphs);
    }
  });

  test('reports required extension capabilities and rejects unsupported required features', async () => {
    const source = await loadNativeExtensionFixture('CubeVisibility');
    expect(getGLTFExtensionSupport(source).get('KHR_node_visibility')).toMatchObject({
      required: true,
      supported: true
    });
    expect(getUnsupportedRequiredGLTFExtensions(source)).toEqual([]);
    expect(() => assertSupportedGLTFExtensions(source)).not.toThrow();

    source.extensionsRequired = [...(source.extensionsRequired || []), 'VENDOR_unimplemented'];
    expect(
      getUnsupportedRequiredGLTFExtensions(source).map(extension => extension.extensionName)
    ).toEqual(['VENDOR_unimplemented']);
    expect(() => assertSupportedGLTFExtensions(source)).toThrow('VENDOR_unimplemented');

    const device = new NullDevice({});
    try {
      expect(() => createScenegraphsFromGLTF(device, source, {strictExtensions: true})).toThrow(
        'VENDOR_unimplemented'
      );
    } finally {
      device.destroy();
    }
  });

  test('switches and restores authored material variants without replacing model nodes', async () => {
    const source = await loadNativeExtensionFixture('CubeVisibility');
    const sourceMaterial = source.materials[0];
    const alternateMaterial = {
      ...sourceMaterial,
      id: 'variant-material',
      alphaMode: 'BLEND',
      doubleSided: true,
      pbrMetallicRoughness: {
        ...sourceMaterial.pbrMetallicRoughness,
        baseColorFactor: [0, 1, 0, 0.5]
      }
    } as GLTFPostprocessed['materials'][number];
    source.materials.push(alternateMaterial);
    source.extensions = {
      ...source.extensions,
      KHR_materials_variants: {variants: [{name: 'Emerald'}, {name: 'Unmapped'}]}
    } as GLTFPostprocessed['extensions'];
    source.extensionsUsed = [...(source.extensionsUsed || []), 'KHR_materials_variants'];
    const primitive = source.meshes[1].primitives[0];
    primitive.extensions = {
      ...primitive.extensions,
      KHR_materials_variants: {
        mappings: [{material: source.materials.length - 1, variants: [0]}]
      }
    };

    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source);
    try {
      const target = getVisibleModelNodes(scenegraphs).find(
        node => node.userData['gltfMaterialVariants']
      );
      expect(target).toBeDefined();
      const originalModel = target!.model;
      const originalMaterial = target!.model.material;
      expect(scenegraphs.variants.names).toEqual(['Emerald', 'Unmapped']);

      scenegraphs.variants.selectVariant('Emerald');
      expect(target!.model).toBe(originalModel);
      expect(target!.model.material).toBe(scenegraphs.materials.at(-1));
      expect(target!.model.parameters.depthWriteEnabled).toBe(false);
      expect(scenegraphs.variants.activeVariant).toBe('Emerald');

      scenegraphs.variants.selectVariant('Unmapped');
      expect(target!.model.material).toBe(originalMaterial);
      expect(() => scenegraphs.variants.selectVariant('Missing')).toThrow('Missing');
      expect(scenegraphs.variants.activeVariant).toBe('Unmapped');

      scenegraphs.variants.selectVariant('Emerald');
      scenegraphs.variants.resetVariant();
      expect(target!.model.material).toBe(originalMaterial);
      expect(scenegraphs.variants.activeVariant).toBeNull();
    } finally {
      destroyScenegraphs(device, scenegraphs);
    }
  });
});
