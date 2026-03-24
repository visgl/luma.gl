// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {GroupNode} from '@luma.gl/engine';

import {GLTFAnimator} from '@luma.gl/gltf';

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

  t.deepEqual(
    Array.from(node.position),
    [1, 2, 3],
    'node translation is updated at the sampled time'
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
