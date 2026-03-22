// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';

import {parseGLTFAnimations} from '@luma.gl/gltf/parsers/parse-gltf-animations';

function makeAccessor(values: number[], type: 'SCALAR' | 'VEC3') {
  return {
    componentType: 5126,
    count: type === 'SCALAR' ? values.length : values.length / 3,
    type,
    bufferView: {
      data: {
        buffer: new Float32Array(values).buffer
      }
    }
  };
}

function makeBaseGLTF(overrides: Partial<GLTFPostprocessed>): GLTFPostprocessed {
  return {
    id: 'test-gltf',
    accessors: [],
    animations: [],
    asset: {version: '2.0'},
    buffers: [],
    bufferViews: [],
    cameras: [],
    images: [],
    materials: [],
    meshes: [],
    nodes: [],
    samplers: [],
    scenes: [],
    skins: [],
    textures: [],
    ...overrides
  };
}

test('gltf#parseGLTFAnimations supports scalar output accessors', t => {
  const gltf = makeBaseGLTF({
    accessors: [makeAccessor([0, 1], 'SCALAR'), makeAccessor([0.25, 0.75], 'SCALAR')] as any,
    animations: [
      {
        channels: [{sampler: 0, target: {node: 0, path: 'weights'}}],
        samplers: [{input: 0, interpolation: 'LINEAR', output: 1}]
      }
    ] as any,
    nodes: [{id: 'node-0'}] as any
  });

  const animations = parseGLTFAnimations(gltf);

  t.equal(animations.length, 1, 'scalar-output animation is parsed');
  t.equal(animations[0].channels.length, 1, 'supported channel is preserved');
  t.deepEqual(
    animations[0].channels[0].sampler.output,
    [[0.25], [0.75]],
    'scalar keyframe outputs are wrapped as single-element arrays'
  );

  t.end();
});

test('gltf#parseGLTFAnimations skips unsupported KHR_animation_pointer channels', t => {
  const gltf = makeBaseGLTF({
    accessors: [makeAccessor([0, 1], 'SCALAR'), makeAccessor([0, 6.2831855], 'SCALAR')] as any,
    animations: [
      {
        channels: [
          {
            sampler: 0,
            target: {
              path: 'pointer',
              extensions: {
                KHR_animation_pointer: {
                  pointer: '/materials/0/normalTexture/extensions/KHR_texture_transform/rotation'
                }
              }
            }
          }
        ],
        samplers: [{input: 0, interpolation: 'LINEAR', output: 1}]
      }
    ] as any,
    nodes: [{id: 'node-0'}] as any
  });

  const animations = parseGLTFAnimations(gltf);

  t.deepEqual(animations, [], 'unsupported pointer-only animations are skipped');

  t.end();
});
