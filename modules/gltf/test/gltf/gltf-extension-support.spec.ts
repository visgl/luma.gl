// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';

import {getGLTFExtensionSupport} from '@luma.gl/gltf';

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
    false,
    'unsupported extension is marked as unsupported'
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
