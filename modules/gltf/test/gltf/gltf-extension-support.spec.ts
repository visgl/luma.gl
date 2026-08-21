// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import type {TextureFormat} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';

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

test('gltf#getGLTFExtensionSupport collects and annotates used extensions', t => {
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

  t.deepEqual(
    Array.from(extensionSupport.keys()),
    [
      'CUSTOM_unknown_extension',
      'KHR_animation_pointer',
      'KHR_draco_mesh_compression',
      'KHR_lights_punctual',
      'KHR_materials_specular',
      'KHR_materials_unlit',
      'KHR_texture_transform'
    ],
    'used, required, removed, and inferred extensions are included'
  );
  t.equal(
    extensionSupport.get('KHR_draco_mesh_compression')?.supported,
    true,
    'built-in extension is marked as supported'
  );
  t.equal(
    extensionSupport.get('KHR_animation_pointer')?.supported,
    true,
    'parsed-and-wired extension is marked as supported'
  );
  t.equal(
    extensionSupport.get('KHR_materials_specular')?.supported,
    true,
    'stock-shader material extensions are reported as built-in support'
  );
  t.equal(
    extensionSupport.get('CUSTOM_unknown_extension')?.comment,
    'Not currently listed in the luma.gl glTF extension support registry.',
    'unknown extensions get a fallback note'
  );

  t.end();
});

test('gltf#getGLTFExtensionSupport distinguishes actual loader implementations', t => {
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

  t.equal(
    support.get('EXT_meshopt_compression')?.supportLevel,
    'built-in',
    'the installed loaders.gl decoder handles EXT meshopt buffer views'
  );
  t.equal(
    support.get('KHR_meshopt_compression')?.supportLevel,
    'none',
    'the newer KHR meshopt spelling is not silently reported as implemented'
  );
  t.equal(
    support.get('EXT_mesh_features')?.supportLevel,
    'loader-only',
    'feature identifiers are decoded but have no automatic luma.gl runtime'
  );
  t.equal(
    support.get('EXT_structural_metadata')?.supportLevel,
    'loader-only',
    'structural metadata is decoded but remains application-owned'
  );
  t.equal(
    support.get('EXT_texture_webp')?.supportLevel,
    'loader-only',
    'WebP source selection is conditional on browser image support'
  );
  t.equal(
    support.get('EXT_texture_avif')?.supportLevel,
    'none',
    'generic AVIF image decoding does not imply glTF extension source selection'
  );

  t.end();
});

test('gltf#getGLTFExtensionSupport applies BasisU device format capabilities', t => {
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

  t.equal(unsupported?.supported, false, 'unsupported transcode format is reported truthfully');
  t.equal(unsupported?.supportLevel, 'none', 'device gap fails strict extension support');
  t.match(unsupported?.comment || '', /does not support.*bc7-rgba-unorm/);
  t.equal(supported?.supported, true, 'supported transcode format retains built-in support');
  t.throws(
    () => assertSupportedGLTFExtensions(gltf, unsupportedDevice),
    /KHR_texture_basisu/,
    'required BasisU rejects an unsupported selected GPU format'
  );
  t.throws(
    () => createScenegraphsFromGLTF(unsupportedDevice, gltf, {strictExtensions: true}),
    /KHR_texture_basisu/,
    'strict scenegraph creation checks the active device before allocating resources'
  );
  t.doesNotThrow(
    () => assertSupportedGLTFExtensions(gltf, supportedDevice),
    'required BasisU accepts a selected GPU format supported by the device'
  );

  unsupportedDevice.destroy();
  supportedDevice.destroy();
  t.end();
});

test('gltf#getRegisteredGLTFExtensions exposes generated support and maturity summaries', t => {
  const extensions = getRegisteredGLTFExtensions();
  const summary = getGLTFExtensionSupportSummary();

  t.deepEqual(
    extensions.map(extension => extension.extensionName),
    [...extensions.map(extension => extension.extensionName)].sort(),
    'registry entries are returned in stable extension-name order'
  );
  t.deepEqual(
    summary,
    {
      total: 35,
      supported: 25,
      bySupportLevel: {'built-in': 19, 'parsed-and-wired': 6, 'loader-only': 4, none: 6},
      byStandardStatus: {
        ratified: 26,
        'release-candidate': 2,
        'multi-vendor': 2,
        vendor: 1,
        draft: 2,
        archived: 2,
        unknown: 0
      }
    },
    'summary is derived from the registry rather than copied into documentation'
  );
  t.equal(
    extensions.find(extension => extension.extensionName === 'KHR_meshopt_compression')
      ?.standardStatus,
    'release-candidate',
    'a KHR prefix does not imply ratification'
  );
  t.equal(
    extensions.find(extension => extension.extensionName === 'MSFT_lod')?.standardStatus,
    'vendor',
    'vendor extensions retain their source maturity'
  );

  t.end();
});
