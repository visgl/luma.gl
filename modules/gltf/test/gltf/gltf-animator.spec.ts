// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {GroupNode} from '@luma.gl/engine';

import {GLTFAnimator, parseGLTFAnimations} from '@luma.gl/gltf';

function makeMockMaterial(initialUniforms: Record<string, unknown>) {
  const uniformValues = {
    pbrMaterial: {...initialUniforms}
  };

  return {
    shaderInputs: {
      getUniformValues: () => uniformValues
    },
    setProps: ({pbrMaterial}: {pbrMaterial: Record<string, unknown>}) => {
      Object.assign(uniformValues.pbrMaterial, pbrMaterial);
    }
  };
}

test('gltf#GLTFAnimator updates node animation channels', t => {
  const node = new GroupNode({id: 'node-0'});
  const animator = new GLTFAnimator({
    animations: [
      {
        name: 'NodeAnimation',
        channels: [
          {
            type: 'node',
            path: 'translation',
            sampler: {
              input: [0, 1],
              interpolation: 'LINEAR',
              output: [
                [0, 0, 0],
                [2, 4, 6]
              ]
            },
            targetNodeId: 'node-0'
          }
        ]
      }
    ],
    gltfNodeIdToNodeMap: new Map([['node-0', node]])
  });

  animator.setTime(500);
  animator.animate(500);

  t.deepEqual(
    Array.from(node.position),
    [1, 2, 3],
    'node translation is updated at the sampled time'
  );
  t.equal(
    animator.animations,
    animator.getAnimations(),
    'compatibility animations alias is preserved'
  );

  t.end();
});

test('gltf#GLTFAnimator updates material animation channels and preserves sibling values', t => {
  const material = makeMockMaterial({
    baseColorFactor: [1, 0, 0, 1],
    metallicRoughnessValues: [0.2, 0.8]
  });
  const animator = new GLTFAnimator({
    animations: [
      {
        name: 'MaterialAnimation',
        channels: [
          {
            type: 'material',
            pointer: '/materials/0/pbrMetallicRoughness/baseColorFactor',
            property: 'baseColorFactor',
            sampler: {
              input: [0, 1],
              interpolation: 'LINEAR',
              output: [
                [1, 0, 0, 1],
                [0, 0, 1, 1]
              ]
            },
            targetMaterialIndex: 0
          },
          {
            type: 'material',
            pointer: '/materials/0/pbrMetallicRoughness/metallicFactor',
            property: 'metallicRoughnessValues',
            component: 0,
            sampler: {
              input: [0, 1],
              interpolation: 'LINEAR',
              output: [[0.2], [1.0]]
            },
            targetMaterialIndex: 0
          }
        ]
      }
    ],
    gltfNodeIdToNodeMap: new Map(),
    materials: [material as any]
  });

  animator.setTime(500);

  const uniforms = material.shaderInputs.getUniformValues().pbrMaterial;
  t.deepEqual(
    uniforms.baseColorFactor,
    [0.5, 0, 0.5, 1],
    'material vector uniforms are updated from pointer animation channels'
  );
  t.deepEqual(
    uniforms.metallicRoughnessValues,
    [0.6, 0.8],
    'component updates preserve the sibling metallic-roughness value'
  );

  t.end();
});

test('gltf#GLTFAnimator updates texture-transform animation channels with delta matrices', t => {
  const material = makeMockMaterial({
    normalUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
  });
  const animator = new GLTFAnimator({
    animations: [
      {
        name: 'TextureTransformAnimation',
        channels: [
          {
            type: 'textureTransform',
            pointer: '/materials/0/normalTexture/extensions/KHR_texture_transform/rotation',
            textureSlot: 'normal',
            path: 'rotation',
            baseTransform: {
              offset: [0, 0],
              rotation: 0.5,
              scale: [1, 1]
            },
            sampler: {
              input: [0, 1],
              interpolation: 'LINEAR',
              output: [[0.5], [1.5]]
            },
            targetMaterialIndex: 0
          }
        ]
      }
    ],
    gltfNodeIdToNodeMap: new Map(),
    materials: [material as any]
  });

  animator.setTime(500);

  const uniforms = material.shaderInputs.getUniformValues().pbrMaterial;
  t.deepEqual(
    uniforms.normalUVTransform.map((value: number) => Number(value.toFixed(6))),
    [0.877583, 0.479426, 0, -0.479426, 0.877583, 0, 0, 0, 1],
    'texture-transform animation writes the current transform delta relative to the baked base transform'
  );

  t.end();
});

test('gltf#GLTFAnimator exposes shared clips, named mixer actions, and animation parsing', t => {
  const node = new GroupNode({id: 'node-0'});
  const animator = new GLTFAnimator({
    animations: [
      {
        name: 'ReusableAnimation',
        channels: [
          {
            type: 'node',
            path: 'translation',
            sampler: {
              input: [0, 2],
              interpolation: 'LINEAR',
              output: [
                [0, 0, 0],
                [4, 0, 0]
              ]
            },
            targetNodeId: 'node-0'
          }
        ]
      }
    ],
    gltfNodeIdToNodeMap: new Map([['node-0', node]])
  });

  const clip = animator.clips[0];
  t.equal(clip.clip.name, 'ReusableAnimation', 'the adapter exposes its engine-owned clip');
  t.equal(clip.clip.duration, 2, 'engine clip duration follows source keyframe times');
  t.equal(
    animator.mixer.getAction('ReusableAnimation'),
    clip.action,
    'named actions share one mixer'
  );
  t.equal(typeof parseGLTFAnimations, 'function', 'source animation parsing is publicly available');

  clip.action.setLoop('once').setTime(1.5);
  animator.mixer.update(0);
  t.deepEqual(Array.from(node.position), [3, 0, 0], 'engine actions directly control glTF targets');

  t.end();
});

test('gltf#GLTFAnimator loops complete clips instead of individual channel samplers', t => {
  const shortNode = new GroupNode({id: 'short'});
  const longNode = new GroupNode({id: 'long'});
  const animator = new GLTFAnimator({
    animations: [
      {
        name: 'DifferentDurations',
        channels: [
          {
            type: 'node',
            path: 'translation',
            sampler: {
              input: [0, 1],
              interpolation: 'LINEAR',
              output: [
                [0, 0, 0],
                [1, 0, 0]
              ]
            },
            targetNodeId: 'short'
          },
          {
            type: 'node',
            path: 'translation',
            sampler: {
              input: [0, 2],
              interpolation: 'LINEAR',
              output: [
                [0, 0, 0],
                [2, 0, 0]
              ]
            },
            targetNodeId: 'long'
          }
        ]
      }
    ],
    gltfNodeIdToNodeMap: new Map([
      ['short', shortNode],
      ['long', longNode]
    ])
  });

  animator.setTime(1500);
  t.deepEqual(
    Array.from(shortNode.position),
    [1, 0, 0],
    'finished channels retain their final key'
  );
  t.deepEqual(Array.from(longNode.position), [1.5, 0, 0], 'longer channels continue interpolating');

  animator.setTime(2500);
  t.deepEqual(
    Array.from(shortNode.position),
    [0.5, 0, 0],
    'all channels restart at the clip boundary'
  );
  t.deepEqual(Array.from(longNode.position), [0.5, 0, 0], 'clip looping stays synchronized');

  t.end();
});

test('gltf#GLTFAnimator preserves legacy speed, start time, and paused clip controls', t => {
  const node = new GroupNode({id: 'node-0'});
  const animator = new GLTFAnimator({
    animations: [
      {
        name: 'LegacyControls',
        channels: [
          {
            type: 'node',
            path: 'translation',
            sampler: {
              input: [0, 2],
              interpolation: 'LINEAR',
              output: [
                [0, 0, 0],
                [2, 0, 0]
              ]
            },
            targetNodeId: 'node-0'
          }
        ]
      }
    ],
    gltfNodeIdToNodeMap: new Map([['node-0', node]])
  });
  const clip = animator.clips[0];
  clip.startTime = 0.5;
  clip.speed = 2;

  animator.setTime(1000);
  t.deepEqual(
    Array.from(node.position),
    [1, 0, 0],
    'legacy wall-clock offsets and speed are preserved'
  );

  clip.playing = false;
  animator.setTime(1250);
  t.deepEqual(
    Array.from(node.position),
    [1, 0, 0],
    'paused legacy clips preserve the current value'
  );

  clip.playing = true;
  animator.setTime(1250);
  t.deepEqual(
    Array.from(node.position),
    [1.5, 0, 0],
    'legacy clips resume with resolved wall time'
  );

  t.end();
});

test('gltf#GLTFAnimator normalizes cubic quaternion animation tracks', t => {
  const node = new GroupNode({id: 'node-0'});
  const animator = new GLTFAnimator({
    animations: [
      {
        name: 'CubicRotation',
        channels: [
          {
            type: 'node',
            path: 'rotation',
            sampler: {
              input: [0, 1],
              interpolation: 'CUBICSPLINE',
              output: [
                [0, 0, 0, 0],
                [0, 0, 0, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 0]
              ]
            },
            targetNodeId: 'node-0'
          }
        ]
      }
    ],
    gltfNodeIdToNodeMap: new Map([['node-0', node]])
  });

  animator.setTime(500);

  t.ok(
    Math.abs(Math.hypot(...Array.from(node.rotation)) - 1) < 1e-12,
    'cubic quaternion channels remain normalized after node binding'
  );

  t.end();
});
