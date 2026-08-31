// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry, GroupNode, ModelNode} from '@luma.gl/engine';
import {GLTFAnimator, parseGLTFAnimations} from '@luma.gl/gltf';
import {expect, it} from 'vitest';

function makeMorphModelNode(identifier: string) {
  const writes: Uint8Array[] = [];
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])},
      NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
      TANGENT: {size: 4, value: new Float32Array([1, 0, 0, -1, 1, 0, 0, -1, 1, 0, 0, -1])}
    }
  });
  const packedBuffer = {
    write(values: ArrayBufferView) {
      writes.push(
        new Uint8Array(
          values.buffer.slice(values.byteOffset, values.byteOffset + values.byteLength)
        )
      );
    }
  };
  const modelNode = new ModelNode({
    id: identifier,
    model: {
      bufferAttributes: {geometry: packedBuffer},
      _gpuGeometry: {attributes: {geometry: packedBuffer}}
    } as any
  });
  modelNode.userData['morphTargets'] = {
    geometry,
    baseAttributes: {
      POSITION: geometry.attributes['POSITION']?.value,
      NORMAL: geometry.attributes['NORMAL']?.value,
      TANGENT: geometry.attributes['TANGENT']?.value
    },
    targets: [
      {
        POSITION: new Float32Array([2, 0, 0, 0, 2, 0, 0, 0, 2]),
        NORMAL: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]),
        TANGENT: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0])
      },
      {POSITION: new Float32Array([0, 2, 0, 2, 0, 0, 0, 2, 0])}
    ]
  };
  return {modelNode, writes};
}

it('gltf#GLTFAnimator morphs existing packed vertex buffers without touching child nodes', () => {
  const parent = new GroupNode({id: 'parent-node'});
  const child = new GroupNode({id: 'child-node'});
  const parentPrimitive = makeMorphModelNode('parent-primitive');
  const childPrimitive = makeMorphModelNode('child-primitive');
  const parentMesh = new GroupNode({id: 'parent-mesh', children: [parentPrimitive.modelNode]});
  const childMesh = new GroupNode({id: 'child-mesh', children: [childPrimitive.modelNode]});
  parent.add(parentMesh, child);
  child.add(childMesh);
  parent.userData['morphMeshes'] = [parentMesh];
  parent.userData['morphWeights'] = [0, 0];
  child.userData['morphMeshes'] = [childMesh];
  child.userData['morphWeights'] = [0, 0];

  const animator = new GLTFAnimator({
    animations: [
      {
        name: 'MorphAnimation',
        channels: [
          {
            type: 'node',
            path: 'weights',
            sampler: {
              input: [0, 1],
              interpolation: 'LINEAR',
              output: [
                [0, 0],
                [1, 0.5]
              ]
            },
            targetNodeId: 'parent-node'
          }
        ]
      }
    ],
    gltfNodeIdToNodeMap: new Map([
      ['parent-node', parent],
      ['child-node', child]
    ])
  });

  animator.setTime(500);

  expect(parent.userData['morphWeights'], 'interpolates all parent weights').toEqual([0.5, 0.25]);
  expect(
    Boolean(parentPrimitive.writes.length > 0),
    'updates the existing interleaved GPU vertex buffer'
  ).toBe(true);
  expect(childPrimitive.writes.length, 'never mutates an independently animated child mesh').toBe(
    0
  );
  expect(child.userData['morphWeights'], 'preserves child morph bind weights').toEqual([0, 0]);
  void 0;
});

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

it('gltf#GLTFAnimator updates node animation channels', () => {
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

  expect(Array.from(node.position), 'node translation is updated at the sampled time').toEqual([
    1, 2, 3
  ]);
  expect(animator.animations, 'compatibility animations alias is preserved').toBe(
    animator.getAnimations()
  );

  void 0;
});

it('gltf#GLTFAnimator updates material animation channels and preserves sibling values', () => {
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
  expect(
    uniforms.baseColorFactor,
    'material vector uniforms are updated from pointer animation channels'
  ).toEqual([0.5, 0, 0.5, 1]);
  expect(
    uniforms.metallicRoughnessValues,
    'component updates preserve the sibling metallic-roughness value'
  ).toEqual([0.6, 0.8]);

  void 0;
});

it('gltf#GLTFAnimator updates texture-transform animation channels with delta matrices', () => {
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
  expect(
    uniforms.normalUVTransform.map((value: number) => Number(value.toFixed(6))),
    'texture-transform animation writes the current transform delta relative to the baked base transform'
  ).toEqual([0.877583, 0.479426, 0, -0.479426, 0.877583, 0, 0, 0, 1]);

  void 0;
});

it('gltf#GLTFAnimator exposes shared clips, named mixer actions, and animation parsing', () => {
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
  expect(clip.clip.name, 'the adapter exposes its engine-owned clip').toBe('ReusableAnimation');
  expect(clip.clip.duration, 'engine clip duration follows source keyframe times').toBe(2);
  expect(animator.mixer.getAction('ReusableAnimation'), 'named actions share one mixer').toBe(
    clip.action
  );
  expect(typeof parseGLTFAnimations, 'source animation parsing is publicly available').toBe(
    'function'
  );

  clip.action.setLoop('once').setTime(1.5);
  animator.mixer.update(0);
  expect(Array.from(node.position), 'engine actions directly control glTF targets').toEqual([
    3, 0, 0
  ]);

  void 0;
});

it('gltf#GLTFAnimator loops complete clips instead of individual channel samplers', () => {
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
  expect(Array.from(shortNode.position), 'finished channels retain their final key').toEqual([
    1, 0, 0
  ]);
  expect(Array.from(longNode.position), 'longer channels continue interpolating').toEqual([
    1.5, 0, 0
  ]);

  animator.setTime(2500);
  expect(Array.from(shortNode.position), 'all channels restart at the clip boundary').toEqual([
    0.5, 0, 0
  ]);
  expect(Array.from(longNode.position), 'clip looping stays synchronized').toEqual([0.5, 0, 0]);

  void 0;
});

it('gltf#GLTFAnimator preserves legacy speed, start time, and paused clip controls', () => {
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
  expect(Array.from(node.position), 'legacy wall-clock offsets and speed are preserved').toEqual([
    1, 0, 0
  ]);

  clip.playing = false;
  animator.setTime(1250);
  expect(Array.from(node.position), 'paused legacy clips preserve the current value').toEqual([
    1, 0, 0
  ]);

  clip.playing = true;
  animator.setTime(1250);
  expect(Array.from(node.position), 'legacy clips resume with resolved wall time').toEqual([
    1.5, 0, 0
  ]);

  void 0;
});

it('gltf#GLTFAnimator removes disabled clips from shared target blending', () => {
  const node = new GroupNode({id: 'node-0'});
  const animator = new GLTFAnimator({
    animations: [
      {
        name: 'Enabled clip',
        channels: [
          {
            type: 'node',
            path: 'translation',
            sampler: {
              input: [0, 1],
              interpolation: 'LINEAR',
              output: [
                [0, 0, 0],
                [10, 0, 0]
              ]
            },
            targetNodeId: 'node-0'
          }
        ]
      },
      {
        name: 'Disabled clip',
        channels: [
          {
            type: 'node',
            path: 'translation',
            sampler: {
              input: [0, 1],
              interpolation: 'LINEAR',
              output: [
                [20, 0, 0],
                [30, 0, 0]
              ]
            },
            targetNodeId: 'node-0'
          }
        ]
      }
    ],
    gltfNodeIdToNodeMap: new Map([['node-0', node]])
  });

  animator.setTime(250);
  expect(Array.from(node.position), 'enabled clips initially blend together').toEqual([12.5, 0, 0]);

  animator.clips[1].playing = false;
  animator.setTime(500);
  expect(Array.from(node.position), 'disabled clips no longer influence the target').toEqual([
    5, 0, 0
  ]);

  animator.clips[1].playing = true;
  animator.setTime(500);
  expect(Array.from(node.position), 're-enabled clips rejoin target blending').toEqual([15, 0, 0]);

  void 0;
});

it('gltf#GLTFAnimator clamps samples before a delayed clip start', () => {
  const node = new GroupNode({id: 'node-0'});
  const animator = new GLTFAnimator({
    animations: [
      {
        name: 'Delayed clip',
        channels: [
          {
            type: 'node',
            path: 'translation',
            sampler: {
              input: [0, 2],
              interpolation: 'LINEAR',
              output: [
                [1, 0, 0],
                [5, 0, 0]
              ]
            },
            targetNodeId: 'node-0'
          }
        ]
      }
    ],
    gltfNodeIdToNodeMap: new Map([['node-0', node]])
  });
  animator.clips[0].startTime = 2;

  animator.setTime(1000);
  expect(Array.from(node.position), 'future clips retain their first keyframe').toEqual([1, 0, 0]);

  animator.setTime(2500);
  expect(Array.from(node.position), 'clips advance normally after their start').toEqual([2, 0, 0]);

  void 0;
});

it('gltf#GLTFAnimator keeps node bind poses stable during partial-weight playback', () => {
  const node = new GroupNode({id: 'node-0', position: [2, 0, 0]});
  const animator = new GLTFAnimator({
    animations: [
      {
        name: 'Weighted clip',
        channels: [
          {
            type: 'node',
            path: 'translation',
            sampler: {
              input: [0, 2],
              interpolation: 'LINEAR',
              output: [
                [10, 0, 0],
                [10, 0, 0]
              ]
            },
            targetNodeId: 'node-0'
          }
        ]
      }
    ],
    gltfNodeIdToNodeMap: new Map([['node-0', node]])
  });
  const action = animator.clips[0].action.setEffectiveWeight(0.5);

  animator.mixer.update(0.25);
  expect(Array.from(node.position), 'half weight blends against the original pose').toEqual([
    6, 0, 0
  ]);

  animator.mixer.update(0.25);
  expect(Array.from(node.position), 'repeated samples do not drift toward full weight').toEqual([
    6, 0, 0
  ]);

  action.fadeOut(1);
  animator.mixer.update(1);
  expect(Array.from(node.position), 'completed fade-outs restore the bind pose').toEqual([2, 0, 0]);

  void 0;
});

it('gltf#GLTFAnimator normalizes cubic quaternion animation tracks', () => {
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

  expect(
    Boolean(Math.abs(Math.hypot(...Array.from(node.rotation)) - 1) < 1e-12),
    'cubic quaternion channels remain normalized after node binding'
  ).toBe(true);

  void 0;
});
