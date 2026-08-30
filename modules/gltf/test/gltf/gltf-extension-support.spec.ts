// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import type {TextureFormat} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

import {
  assertSupportedGLTFExtensions,
  createScenegraphsFromGLTF,
  getGLTFExtensionSupport,
  getGLTFExtensionSupportSummary,
  getRegisteredGLTFExtensions
} from '@luma.gl/gltf';

class CompressedTextureNullDevice extends NullDevice {
  override isTextureFormatSupported(_format: TextureFormat): boolean {
    return true;
  }
}

type GLTFPostprocessedWithRemovedExtensions = GLTFPostprocessed & {
  extensionsRemoved?: string[];
  lights?: unknown[];
};

it('gltf#getGLTFExtensionSupport collects and annotates used extensions', () => {
  const gltf: GLTFPostprocessedWithRemovedExtensions = {
    id: 'test-gltf',
    extensionsUsed: ['KHR_texture_transform', 'KHR_materials_specular', 'CUSTOM_unknown_extension'],
    extensionsRequired: ['KHR_animation_pointer'],
    extensionsRemoved: ['KHR_draco_mesh_compression'],
    accessors: [],
    animations: [],
    asset: {version: '2.0'},
    buffers: [],
    bufferViews: [],
    cameras: [],
    images: [],
    materials: [{id: 'material-0', unlit: true} as GLTFPostprocessed['materials'][number]],
    meshes: [],
    nodes: [{id: 'node-0', light: 0} as GLTFPostprocessed['nodes'][number]],
    samplers: [],
    scenes: [],
    skins: [],
    textures: [],
    lights: [{}]
  };

  const extensionSupport = getGLTFExtensionSupport(gltf);

  expect(
    Array.from(extensionSupport.keys()),
    'used, required, removed, and inferred extensions are included'
  ).toEqual([
    'CUSTOM_unknown_extension',
    'KHR_animation_pointer',
    'KHR_draco_mesh_compression',
    'KHR_lights_punctual',
    'KHR_materials_specular',
    'KHR_materials_unlit',
    'KHR_texture_transform'
  ]);
  expect(
    extensionSupport.get('KHR_draco_mesh_compression')?.supported,
    'built-in extension is marked as supported'
  ).toBe(true);
  expect(
    extensionSupport.get('KHR_animation_pointer')?.supported,
    'parsed-and-wired extension is marked as supported'
  ).toBe(true);
  expect(
    extensionSupport.get('KHR_materials_specular')?.supported,
    'stock-shader material extensions are reported as built-in support'
  ).toBe(true);
  expect(
    extensionSupport.get('CUSTOM_unknown_extension')?.comment,
    'unknown extensions get a fallback note'
  ).toBe('Not currently listed in the luma.gl glTF extension support registry.');
});

it('gltf#getGLTFExtensionSupport distinguishes actual loader implementations', () => {
  const extensionNames = [
    'EXT_mesh_features',
    'EXT_meshopt_compression',
    'EXT_structural_metadata',
    'EXT_texture_avif',
    'EXT_texture_webp',
    'KHR_meshopt_compression'
  ];
  const gltf = {
    extensionsUsed: extensionNames,
    nodes: [],
    materials: []
  } as GLTFPostprocessed;
  const support = getGLTFExtensionSupport(gltf);

  expect(
    support.get('EXT_meshopt_compression')?.supportLevel,
    'the installed loaders.gl decoder handles EXT meshopt buffer views'
  ).toBe('built-in');
  expect(
    support.get('KHR_meshopt_compression')?.supportLevel,
    'the loaders.gl v5 decoder handles KHR meshopt buffer views'
  ).toBe('built-in');
  expect(
    support.get('EXT_mesh_features')?.supportLevel,
    'feature identifiers are decoded but have no automatic luma.gl runtime'
  ).toBe('loader-only');
  expect(
    support.get('EXT_structural_metadata')?.supportLevel,
    'structural metadata is decoded but remains application-owned'
  ).toBe('loader-only');
  expect(
    support.get('EXT_texture_webp')?.supportLevel,
    'WebP source selection is conditional on browser image support'
  ).toBe('loader-only');
  expect(
    support.get('EXT_texture_avif')?.supportLevel,
    'generic AVIF image decoding does not imply glTF extension source selection'
  ).toBe('none');
});

it('gltf#getGLTFExtensionSupport applies BasisU device format capabilities', () => {
  const gltf = {
    extensionsUsed: ['KHR_texture_basisu'],
    extensionsRequired: ['KHR_texture_basisu'],
    nodes: [],
    materials: [],
    textures: [
      {
        source: {
          image: {
            compressed: true,
            data: [
              {
                data: new Uint8Array(16),
                width: 4,
                height: 4,
                textureFormat: 'bc7-rgba-unorm'
              }
            ]
          }
        }
      }
    ]
  } as unknown as GLTFPostprocessed;
  const unsupportedDevice = new NullDevice({});
  const supportedDevice = new CompressedTextureNullDevice({});

  const unsupported = getGLTFExtensionSupport(gltf, unsupportedDevice).get('KHR_texture_basisu');
  const supported = getGLTFExtensionSupport(gltf, supportedDevice).get('KHR_texture_basisu');

  expect(unsupported?.supported, 'unsupported transcode format is reported truthfully').toBe(false);
  expect(unsupported?.supportLevel, 'device gap fails strict extension support').toBe('none');
  expect(unsupported?.comment || '').toMatch(/does not support.*bc7-rgba-unorm/);
  expect(supported?.supported, 'supported transcode format retains built-in support').toBe(true);
  expect(
    () => assertSupportedGLTFExtensions(gltf, unsupportedDevice),
    'required BasisU rejects an unsupported selected GPU format'
  ).toThrow(/KHR_texture_basisu/);
  expect(
    () => createScenegraphsFromGLTF(unsupportedDevice, gltf, {strictExtensions: true}),
    'strict scenegraph creation checks the active device before allocating resources'
  ).toThrow(/KHR_texture_basisu/);
  expect(
    () => assertSupportedGLTFExtensions(gltf, supportedDevice),
    'required BasisU accepts a selected GPU format supported by the device'
  ).not.toThrow();

  unsupportedDevice.destroy();
  supportedDevice.destroy();
});

it('gltf#getRegisteredGLTFExtensions exposes generated support and maturity summaries', () => {
  const extensions = getRegisteredGLTFExtensions();
  const summary = getGLTFExtensionSupportSummary();

  expect(
    extensions.map(extension => extension.extensionName),
    'registry entries are returned in stable extension-name order'
  ).toEqual([...extensions.map(extension => extension.extensionName)].sort());
  expect(
    summary,
    'summary is derived from the registry rather than copied into documentation'
  ).toEqual({
    total: 35,
    supported: 26,
    bySupportLevel: {'built-in': 20, 'parsed-and-wired': 6, 'loader-only': 4, none: 5},
    byStandardStatus: {
      ratified: 26,
      'release-candidate': 2,
      'multi-vendor': 2,
      vendor: 1,
      draft: 2,
      archived: 2,
      unknown: 0
    }
  });
  expect(
    extensions.find(extension => extension.extensionName === 'KHR_meshopt_compression')
      ?.standardStatus,
    'a KHR prefix does not imply ratification'
  ).toBe('release-candidate');
  expect(
    extensions.find(extension => extension.extensionName === 'MSFT_lod')?.standardStatus,
    'vendor extensions retain their source maturity'
  ).toBe('vendor');
});
