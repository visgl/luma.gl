// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {log} from '@luma.gl/core';
import {parseGLTFAnimations} from '@luma.gl/gltf/parsers/parse-gltf-animations';
import {expect, it} from 'vitest';

function makeAccessor(values: number[], type: 'SCALAR' | 'VEC3' | 'VEC4') {
  const componentsByType = {
    SCALAR: 1,
    VEC3: 3,
    VEC4: 4
  };
  const value = new Float32Array(values);
  return {
    componentType: 5126,
    count: values.length / componentsByType[type],
    type,
    components: componentsByType[type],
    value,
    bufferView: {
      data: {
        buffer: value.buffer
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

function captureWarnings(runTestCase: () => void): string[] {
  const warnings: string[] = [];
  const originalWarn = log.warn.bind(log);

  log.warn = ((message: string) => {
    return () => {
      warnings.push(message);
    };
  }) as typeof log.warn;

  try {
    runTestCase();
  } finally {
    log.warn = originalWarn;
  }

  return warnings;
}

it('gltf#parseGLTFAnimations supports scalar output accessors', () => {
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

  expect(animations.length, 'scalar-output animation is parsed').toBe(1);
  expect(animations[0].channels.length, 'supported channel is preserved').toBe(1);
  expect(
    animations[0].channels[0].sampler.output,
    'scalar keyframe outputs are wrapped as single-element arrays'
  ).toEqual([[0.25], [0.75]]);

  void 0;
});

it('gltf#parseGLTFAnimations groups scalar morph weights by target count', () => {
  const gltf = makeBaseGLTF({
    accessors: [
      makeAccessor([0, 1], 'SCALAR'),
      makeAccessor([0.25, 0.75, 0.875, 0.125], 'SCALAR')
    ] as any,
    animations: [
      {
        channels: [{sampler: 0, target: {node: 0, path: 'weights'}}],
        samplers: [{input: 0, interpolation: 'LINEAR', output: 1}]
      }
    ] as any,
    nodes: [{id: 'morph-node', mesh: {weights: [0, 0], primitives: [{targets: [{}, {}]}]}}] as any
  });

  const channels = parseGLTFAnimations(gltf)[0].channels;
  expect(
    channels[0].sampler.output,
    'groups both AnimatedMorphCube target weights at every keyframe'
  ).toEqual([
    [0.25, 0.75],
    [0.875, 0.125]
  ]);
  void 0;
});

it('gltf#parseGLTFAnimations groups cubic morph tangents with their target weights', () => {
  const gltf = makeBaseGLTF({
    accessors: [
      makeAccessor([0, 1], 'SCALAR'),
      makeAccessor([0, 0, 0.125, 0.25, 1, 1, 2, 2, 0.875, 0.625, 0, 0], 'SCALAR')
    ] as any,
    animations: [
      {
        channels: [{sampler: 0, target: {node: 0, path: 'weights'}}],
        samplers: [{input: 0, interpolation: 'CUBICSPLINE', output: 1}]
      }
    ] as any,
    nodes: [{id: 'morph-node', mesh: {primitives: [{targets: [{}, {}]}]}}] as any
  });

  expect(
    parseGLTFAnimations(gltf)[0].channels[0].sampler.output,
    'preserves in-tangent, value, and out-tangent vectors for each morph keyframe'
  ).toEqual([
    [0, 0],
    [0.125, 0.25],
    [1, 1],
    [2, 2],
    [0.875, 0.625],
    [0, 0]
  ]);
  void 0;
});

it('gltf#parseGLTFAnimations skips unsupported KHR_animation_pointer texCoord channels', () => {
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
                  pointer: '/materials/0/normalTexture/extensions/KHR_texture_transform/texCoord'
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

  expect(animations, 'unsupported texCoord pointer-only animations are skipped').toEqual([]);

  void 0;
});

it('gltf#parseGLTFAnimations animates KHR_materials_diffuse_transmission texture transforms', () => {
  const warnings = captureWarnings(() => {
    const gltf = makeBaseGLTF({
      accessors: [makeAccessor([0, 1], 'SCALAR'), makeAccessor([1, 2], 'SCALAR')] as any,
      animations: [
        {
          channels: [
            {
              sampler: 0,
              target: {
                path: 'pointer',
                extensions: {
                  KHR_animation_pointer: {
                    pointer:
                      '/materials/0/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionTexture/extensions/KHR_texture_transform/scale'
                  }
                }
              }
            }
          ],
          samplers: [{input: 0, interpolation: 'LINEAR', output: 1}]
        }
      ] as any,
      materials: [
        {
          id: 'material-0',
          extensions: {
            KHR_materials_diffuse_transmission: {
              diffuseTransmissionTexture: {
                extensions: {
                  KHR_texture_transform: {
                    scale: [1, 1]
                  }
                }
              }
            }
          }
        }
      ] as any
    });

    const animations = parseGLTFAnimations(gltf);
    expect(animations.length, 'diffuse transmission texture animation is preserved').toBe(1);
    expect(animations[0]?.channels[0]?.type, 'resolves a texture transform').toBe(
      'textureTransform'
    );
    expect(
      (animations[0]?.channels[0] as {textureSlot?: string})?.textureSlot,
      'selects the release-candidate diffuse-transmission texture slot'
    ).toBe('diffuseTransmission');
  });

  expect(warnings.length, 'supported material pointers do not emit unsupported warnings').toBe(0);

  void 0;
});

it('gltf#parseGLTFAnimations warns specifically for unsupported KHR_animation_pointer texCoord channels', () => {
  const warnings = captureWarnings(() => {
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
                    pointer: '/materials/0/normalTexture/extensions/KHR_texture_transform/texCoord'
                  }
                }
              }
            }
          ],
          samplers: [{input: 0, interpolation: 'LINEAR', output: 1}]
        }
      ] as any,
      materials: [{id: 'material-0', normalTexture: {texCoord: 0}}] as any
    });

    expect(
      parseGLTFAnimations(gltf),
      'unsupported texCoord pointer-only animations are skipped'
    ).toEqual([]);
  });

  expect(
    Boolean(
      warnings.some(warning =>
        warning.includes(
          'animated KHR_texture_transform.texCoord is unsupported because texCoord selection is structural, not a runtime float/vector update'
        )
      )
    ),
    'warning explains why texCoord animation is skipped'
  ).toBe(true);

  void 0;
});

it('gltf#parseGLTFAnimations supports KHR_animation_pointer morph weight channels', () => {
  const gltf = makeBaseGLTF({
    accessors: [makeAccessor([0, 1], 'SCALAR'), makeAccessor([0.25, 0.75], 'SCALAR')] as any,
    animations: [
      {
        channels: [
          {
            sampler: 0,
            target: {
              path: 'pointer',
              extensions: {
                KHR_animation_pointer: {
                  pointer: '/nodes/0/weights'
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
  expect(animations.length, 'preserves the morph pointer clip').toBe(1);
  expect(animations[0].channels[0].type, 'maps the pointer onto the existing node track').toBe(
    'node'
  );
  expect(
    animations[0].channels[0].type === 'node' ? animations[0].channels[0].path : '',
    'retains morph weight playback'
  ).toBe('weights');

  void 0;
});

it('gltf#parseGLTFAnimations warns specifically for unsupported top-level pointer targets', () => {
  const warnings = captureWarnings(() => {
    const gltf = makeBaseGLTF({
      accessors: [makeAccessor([0, 1], 'SCALAR'), makeAccessor([0.1, 0.2], 'SCALAR')] as any,
      animations: [
        {
          channels: [
            {
              sampler: 0,
              target: {
                path: 'pointer',
                extensions: {
                  KHR_animation_pointer: {
                    pointer: '/asset/version'
                  }
                }
              }
            }
          ],
          samplers: [{input: 0, interpolation: 'LINEAR', output: 1}]
        }
      ] as any
    });

    expect(parseGLTFAnimations(gltf), 'unsupported top-level pointer target is skipped').toEqual(
      []
    );
  });

  expect(
    Boolean(
      warnings.some(warning =>
        warning.includes('top-level target "asset" has no runtime animation mapping')
      )
    ),
    'warning explains the unsupported top-level target'
  ).toBe(true);

  void 0;
});

it('gltf#parseGLTFAnimations normalizes supported KHR_animation_pointer node channels', () => {
  const gltf = makeBaseGLTF({
    accessors: [makeAccessor([0, 1], 'SCALAR'), makeAccessor([0, 0, 0, 1, 2, 3], 'VEC3')] as any,
    animations: [
      {
        channels: [
          {
            sampler: 0,
            target: {
              path: 'pointer',
              extensions: {
                KHR_animation_pointer: {
                  pointer: '/nodes/0/translation'
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

  expect(animations.length, 'pointer animation is preserved').toBe(1);
  expect(
    animations[0].channels[0],
    'node pointer channels are normalized into node animation channels'
  ).toEqual({
    type: 'node',
    sampler: animations[0].channels[0].sampler,
    targetNodeId: 'node-0',
    path: 'translation'
  });

  void 0;
});

it('gltf#parseGLTFAnimations parses supported KHR_animation_pointer material channels', () => {
  const gltf = makeBaseGLTF({
    accessors: [
      makeAccessor([0, 1], 'SCALAR'),
      makeAccessor([1, 0, 0, 1, 0, 1, 0, 1], 'VEC4')
    ] as any,
    animations: [
      {
        channels: [
          {
            sampler: 0,
            target: {
              path: 'pointer',
              extensions: {
                KHR_animation_pointer: {
                  pointer: '/materials/0/pbrMetallicRoughness/baseColorFactor'
                }
              }
            }
          }
        ],
        samplers: [{input: 0, interpolation: 'LINEAR', output: 1}]
      }
    ] as any,
    materials: [{id: 'material-0', pbrMetallicRoughness: {baseColorFactor: [1, 1, 1, 1]}}] as any
  });

  const animations = parseGLTFAnimations(gltf);
  const channel = animations[0].channels[0];

  expect(animations.length, 'material pointer animation is preserved').toBe(1);
  expect(channel.type, 'channel is marked as a material animation channel').toBe('material');
  if (channel.type === 'material') {
    expect(channel.pointer, 'pointer is preserved').toBe(
      '/materials/0/pbrMetallicRoughness/baseColorFactor'
    );
    expect(channel.targetMaterialIndex, 'material index is preserved').toBe(0);
    expect(channel.property, 'pointer is mapped to the PBR uniform').toBe('baseColorFactor');
    expect(channel.component, 'full-vector uniforms do not set a component index').toBe(undefined);
  }

  void 0;
});

it('gltf#parseGLTFAnimations parses scalar sub-property KHR_animation_pointer channels', () => {
  const gltf = makeBaseGLTF({
    accessors: [makeAccessor([0, 1], 'SCALAR'), makeAccessor([0.25, 0.75], 'SCALAR')] as any,
    animations: [
      {
        channels: [
          {
            sampler: 0,
            target: {
              path: 'pointer',
              extensions: {
                KHR_animation_pointer: {
                  pointer: '/materials/0/pbrMetallicRoughness/metallicFactor'
                }
              }
            }
          }
        ],
        samplers: [{input: 0, interpolation: 'LINEAR', output: 1}]
      }
    ] as any,
    materials: [{id: 'material-0', pbrMetallicRoughness: {metallicFactor: 0.5}}] as any
  });

  const animations = parseGLTFAnimations(gltf);
  const channel = animations[0].channels[0];

  expect(channel.type, 'scalar pointer channel is parsed as a material channel').toBe('material');
  if (channel.type === 'material') {
    expect(channel.property, 'scalar pointer is mapped to the packed PBR uniform').toBe(
      'metallicRoughnessValues'
    );
    expect(channel.component, 'metallicFactor writes the first metallic-roughness component').toBe(
      0
    );
  }

  void 0;
});

it('gltf#parseGLTFAnimations parses supported KHR_animation_pointer texture-transform channels', () => {
  const gltf = makeBaseGLTF({
    accessors: [makeAccessor([0, 1], 'SCALAR'), makeAccessor([0, 1.5707964], 'SCALAR')] as any,
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
    materials: [
      {
        id: 'material-0',
        normalTexture: {
          extensions: {
            KHR_texture_transform: {
              offset: [0.25, 0.5],
              rotation: 0.2,
              scale: [1.5, 0.75]
            }
          }
        }
      }
    ] as any
  });

  const animations = parseGLTFAnimations(gltf);
  const channel = animations[0].channels[0];

  expect(channel.type, 'texture-transform pointer channel is parsed').toBe('textureTransform');
  if (channel.type === 'textureTransform') {
    expect(channel.textureSlot, 'texture slot is resolved').toBe('normal');
    expect(channel.path, 'texture transform path is resolved').toBe('rotation');
    expect(channel.component, 'rotation does not set a component').toBe(undefined);
    expect(channel.baseTransform, 'base transform is captured for runtime delta math').toEqual({
      offset: [0.25, 0.5],
      rotation: 0.2,
      scale: [1.5, 0.75]
    });
  }

  void 0;
});
