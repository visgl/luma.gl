// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {log} from '@luma.gl/core';

import {parseGLTFAnimations} from '@luma.gl/gltf/parsers/parse-gltf-animations';

function makeAccessor(values: number[], type: 'SCALAR' | 'VEC3' | 'VEC4') {
  const componentsByType = {
    SCALAR: 1,
    VEC3: 3,
    VEC4: 4
  };
  return {
    componentType: 5126,
    count: values.length / componentsByType[type],
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

test('gltf#parseGLTFAnimations skips unsupported KHR_animation_pointer texCoord channels', t => {
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

  t.deepEqual(animations, [], 'unsupported texCoord pointer-only animations are skipped');

  t.end();
});

test('gltf#parseGLTFAnimations warns specifically for unsupported KHR_materials_diffuse_transmission pointers', t => {
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

    t.deepEqual(
      parseGLTFAnimations(gltf),
      [],
      'unsupported diffuse transmission pointer is skipped'
    );
  });

  t.ok(
    warnings.some(warning =>
      warning.includes(
        'KHR_materials_diffuse_transmission is referenced by this pointer, but diffuse-transmission shading is not implemented in the stock PBR shader.'
      )
    ),
    'warning names the unsupported extension and reason'
  );

  t.end();
});

test('gltf#parseGLTFAnimations warns specifically for unsupported KHR_animation_pointer texCoord channels', t => {
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

    t.deepEqual(
      parseGLTFAnimations(gltf),
      [],
      'unsupported texCoord pointer-only animations are skipped'
    );
  });

  t.ok(
    warnings.some(warning =>
      warning.includes(
        'animated KHR_texture_transform.texCoord is unsupported because texCoord selection is structural, not a runtime float/vector update'
      )
    ),
    'warning explains why texCoord animation is skipped'
  );

  t.end();
});

test('gltf#parseGLTFAnimations warns specifically for morph weight pointers', t => {
  const warnings = captureWarnings(() => {
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

    t.deepEqual(parseGLTFAnimations(gltf), [], 'unsupported morph-weight pointer is skipped');
  });

  t.ok(
    warnings.some(warning =>
      warning.includes('will be skipped because morph weights are not implemented in GLTFAnimator')
    ),
    'warning explains morph weights are not implemented'
  );

  t.end();
});

test('gltf#parseGLTFAnimations warns specifically for unsupported top-level pointer targets', t => {
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
                    pointer: '/cameras/0/perspective/yfov'
                  }
                }
              }
            }
          ],
          samplers: [{input: 0, interpolation: 'LINEAR', output: 1}]
        }
      ] as any
    });

    t.deepEqual(parseGLTFAnimations(gltf), [], 'unsupported top-level pointer target is skipped');
  });

  t.ok(
    warnings.some(warning =>
      warning.includes('top-level target "cameras" has no runtime animation mapping')
    ),
    'warning explains the unsupported top-level target'
  );

  t.end();
});

test('gltf#parseGLTFAnimations normalizes supported KHR_animation_pointer node channels', t => {
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

  t.equal(animations.length, 1, 'pointer animation is preserved');
  t.deepEqual(
    animations[0].channels[0],
    {
      type: 'node',
      sampler: animations[0].channels[0].sampler,
      targetNodeId: 'node-0',
      path: 'translation'
    },
    'node pointer channels are normalized into node animation channels'
  );

  t.end();
});

test('gltf#parseGLTFAnimations parses supported KHR_animation_pointer material channels', t => {
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

  t.equal(animations.length, 1, 'material pointer animation is preserved');
  t.equal(channel.type, 'material', 'channel is marked as a material animation channel');
  if (channel.type === 'material') {
    t.equal(
      channel.pointer,
      '/materials/0/pbrMetallicRoughness/baseColorFactor',
      'pointer is preserved'
    );
    t.equal(channel.targetMaterialIndex, 0, 'material index is preserved');
    t.equal(channel.property, 'baseColorFactor', 'pointer is mapped to the PBR uniform');
    t.equal(channel.component, undefined, 'full-vector uniforms do not set a component index');
  }

  t.end();
});

test('gltf#parseGLTFAnimations parses scalar sub-property KHR_animation_pointer channels', t => {
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

  t.equal(channel.type, 'material', 'scalar pointer channel is parsed as a material channel');
  if (channel.type === 'material') {
    t.equal(
      channel.property,
      'metallicRoughnessValues',
      'scalar pointer is mapped to the packed PBR uniform'
    );
    t.equal(channel.component, 0, 'metallicFactor writes the first metallic-roughness component');
  }

  t.end();
});

test('gltf#parseGLTFAnimations parses supported KHR_animation_pointer texture-transform channels', t => {
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

  t.equal(channel.type, 'textureTransform', 'texture-transform pointer channel is parsed');
  if (channel.type === 'textureTransform') {
    t.equal(channel.textureSlot, 'normal', 'texture slot is resolved');
    t.equal(channel.path, 'rotation', 'texture transform path is resolved');
    t.equal(channel.component, undefined, 'rotation does not set a component');
    t.deepEqual(
      channel.baseTransform,
      {
        offset: [0.25, 0.5],
        rotation: 0.2,
        scale: [1.5, 0.75]
      },
      'base transform is captured for runtime delta math'
    );
  }

  t.end();
});
