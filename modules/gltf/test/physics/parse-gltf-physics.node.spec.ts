// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {getRegisteredGLTFExtensions} from '../../src';
import {parseGLTFPhysics, createGLTFPhysicsWorld, GLTF_PHYSICS_DRAFT} from '../../src/physics';
import {makePhysicsDocument} from './physics-fixtures';

it('imports loader-decoded GLB extension data before postprocessing replaces node references', async () => {
  const encoded = new TextEncoder().encode(
    JSON.stringify({...makePhysicsDocument(), asset: {version: '2.0'}})
  );
  const chunkLength = Math.ceil(encoded.length / 4) * 4;
  const buffer = new ArrayBuffer(20 + chunkLength);
  const header = new DataView(buffer);
  header.setUint32(0, 0x46546c67, true);
  header.setUint32(4, 2, true);
  header.setUint32(8, buffer.byteLength, true);
  header.setUint32(12, chunkLength, true);
  header.setUint32(16, 0x4e4f534a, true);
  const chunk = new Uint8Array(buffer, 20);
  chunk.fill(0x20);
  chunk.set(encoded);
  const loaded = await parse(buffer, GLTFLoader, {gltf: {loadImages: false}});
  const original = structuredClone(loaded.json);
  const description = parseGLTFPhysics(loaded.json);
  expect(description.supported).toBe(true);
  postProcessGLTF(loaded);
  expect(description.source).toEqual(original);
  expect(description.colliders[0].shapeIndex).toBe(0);
});

it('does not claim automatic physics support in the ordinary renderer registry', () => {
  const extensions = getRegisteredGLTFExtensions();
  for (const extensionName of ['KHR_physics_rigid_bodies', 'KHR_implicit_shapes']) {
    expect(extensions.find(extension => extension.extensionName === extensionName)).toMatchObject({
      supported: false,
      standardStatus: 'draft'
    });
  }
});

it('imports a pinned, device-independent description without mutating raw JSON', () => {
  const source = makePhysicsDocument();
  const original = structuredClone(source);
  const result = parseGLTFPhysics(source);
  expect(result.issues).toEqual([]);
  expect(result.supported).toBe(true);
  expect(result.draft).toEqual(GLTF_PHYSICS_DRAFT);
  expect(result.bodies[0].body).toMatchObject({mode: 'dynamic', mass: 2, position: [0, 0, 0]});
  expect(result.colliders[0]).toMatchObject({
    nodeIndex: 0,
    bodyIndex: 0,
    colliderIndex: 0,
    shapeIndex: 0
  });
  expect(source).toEqual(original);
  expect(result.source).toEqual(source);
  expect(result.source).not.toBe(source);
  const world = createGLTFPhysicsWorld(result);
  expect(world.count).toBe(1);
  expect(world.colliderCount).toBe(1);
  world.destroy();
});

it('honors primitive and authored-material schema defaults and preserves names/extras', () => {
  const source = makePhysicsDocument([
    {
      extensions: {
        KHR_physics_rigid_bodies: {motion: {}, collider: {geometry: {shape: 0}, physicsMaterial: 0}}
      }
    }
  ]);
  source.extensions = {
    KHR_implicit_shapes: {shapes: [{type: 'sphere', name: 'default sphere', sphere: {}}]},
    KHR_physics_rigid_bodies: {
      physicsMaterials: [{name: 'default material', extras: {source: 'fixture'}, extensions: {}}]
    }
  };
  const result = parseGLTFPhysics(source);
  expect(result.issues).toEqual([]);
  expect(result.colliders[0].collider.shape).toEqual({type: 'sphere', radius: 0.5});
  expect(result.colliders[0].collider.material?.restitution).toBe(0);
  expect(result.source).toEqual(source);
});

it('resolves compound ownership, transformed child colliders and independent child motions', () => {
  const source = makePhysicsDocument([
    {
      translation: [10, 0, 0],
      children: [1, 2, 3],
      extensions: {KHR_physics_rigid_bodies: {motion: {mass: 3, centerOfMass: [0.5, 0, 0]}}}
    },
    {
      translation: [1, 0, 0],
      extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 0}, physicsMaterial: 0}}}
    },
    {
      translation: [-1, 0, 0],
      rotation: [0, 0, Math.SQRT1_2, Math.SQRT1_2],
      extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 1}}}}
    },
    {
      translation: [0, 5, 0],
      extensions: {KHR_physics_rigid_bodies: {motion: {mass: 1}, collider: {geometry: {shape: 0}}}}
    }
  ]);
  const result = parseGLTFPhysics(source);
  expect(result.issues).toEqual([]);
  expect(result.bodies.map(body => body.colliderIndices)).toEqual([[0, 1], [2]]);
  expect(result.bodies[0].centerOfMass).toEqual([0.5, 0, 0]);
  expect(result.colliders[0].collider.position).toEqual([1, 0, 0]);
  expect(result.colliders[1].collider.orientation?.[2]).toBeCloseTo(Math.SQRT1_2);
  expect(result.bodies[1].body.position).toEqual([10, 5, 0]);
  expect(result.colliders[0].collider.material).toMatchObject({
    staticFriction: 0.8,
    dynamicFriction: 0.3,
    frictionCombine: 'maximum',
    restitutionCombine: 'multiply'
  });
  expect(createGLTFPhysicsWorld(result).colliderCount).toBe(3);
});

it('computes additive primitive mass and center and retains infinite-mass motion as dynamic', () => {
  const source = makePhysicsDocument([
    {children: [1, 2], extensions: {KHR_physics_rigid_bodies: {motion: {}}}},
    {
      translation: [-1, 0, 0],
      extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 0}}}}
    },
    {
      translation: [1, 0, 0],
      extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 0}}}}
    }
  ]);
  const result = parseGLTFPhysics(source, {density: 10});
  expect(result.issues).toEqual([]);
  expect(result.bodies[0].body.mass).toBeCloseTo((10 * Math.PI) / 3);
  expect(result.bodies[0].centerOfMass).toEqual([0, 0, 0]);
  const infinite = parseGLTFPhysics(
    makePhysicsDocument([
      {
        extensions: {
          KHR_physics_rigid_bodies: {
            motion: {mass: 0, inertiaDiagonal: [0, 1, 2]},
            collider: {geometry: {shape: 0}}
          }
        }
      }
    ])
  );
  expect(infinite.bodies[0].body).toMatchObject({
    mode: 'dynamic',
    mass: 0,
    inertiaDiagonal: [0, 1, 2]
  });
});

it('keeps filter identities aligned when nested independent motion interleaves source colliders', () => {
  const source = makePhysicsDocument([
    {children: [1, 2], extensions: {KHR_physics_rigid_bodies: {motion: {}}}},
    {
      extensions: {
        KHR_physics_rigid_bodies: {motion: {}, collider: {geometry: {shape: 0}, collisionFilter: 0}}
      }
    },
    {extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 0}, collisionFilter: 1}}}}
  ]);
  const result = parseGLTFPhysics(source);
  expect(result.issues).toEqual([]);
  expect(result.colliders.map(collider => collider.nodeIndex)).toEqual([2, 1]);
  expect(result.bodies.map(body => body.colliderIndices)).toEqual([[0], [1]]);
  expect(result.bodies[0].body.colliders?.[0].excludedColliders).toEqual([1]);
  expect(result.bodies[1].body.colliders?.[0].excludedColliders).toEqual([0]);
});

it('distinguishes static and kinematic bodies and maps node-space initial velocity', () => {
  const source = makePhysicsDocument([
    {rotation: [0, 0, Math.SQRT1_2, Math.SQRT1_2], children: [1, 2]},
    {
      extensions: {
        KHR_physics_rigid_bodies: {
          motion: {isKinematic: true, linearVelocity: [1, 0, 0], gravityFactor: -1},
          collider: {geometry: {shape: 0}}
        }
      }
    },
    {extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 1}}}}}
  ]);
  const result = parseGLTFPhysics(source);
  expect(result.issues).toEqual([]);
  expect(result.bodies[0].body.mode).toBe('kinematic');
  expect(result.bodies[0].body.velocity?.[1]).toBeCloseTo(1);
  expect(result.bodies[0].body.gravityFactor).toBe(-1);
  expect(result.bodies[1].body.mode).toBe('static');
});

it('compiles symmetric filters without a 32-system bitmask limit', () => {
  const source = makePhysicsDocument([
    {children: [1, 2]},
    {
      extensions: {
        KHR_physics_rigid_bodies: {motion: {}, collider: {geometry: {shape: 0}, collisionFilter: 0}}
      }
    },
    {
      extensions: {
        KHR_physics_rigid_bodies: {motion: {}, collider: {geometry: {shape: 0}, collisionFilter: 1}}
      }
    }
  ]);
  source.extensions = {
    ...source.extensions,
    KHR_physics_rigid_bodies: {
      collisionFilters: [
        {
          collisionSystems: Array.from({length: 40}, (_, system) => `system-${system}`),
          notCollideWithSystems: ['target']
        },
        {collisionSystems: ['target']}
      ]
    }
  };
  const result = parseGLTFPhysics(source);
  expect(result.issues).toEqual([]);
  expect(result.bodies[0].body.colliders?.[0].excludedColliders).toEqual([1]);
  expect(result.bodies[1].body.colliders?.[0].excludedColliders).toEqual([0]);
});

it.each([
  {geometry: {shape: 100}},
  {geometry: {node: 0, convexHull: true}},
  {geometry: {shape: 0}, physicsMaterial: 100},
  {geometry: {shape: 0}, collisionFilter: -1},
  {geometry: {shape: 0}, futureColliderProperty: true}
])('reports unsupported collider declarations and prevents partial world creation: %j', collider => {
  const result = parseGLTFPhysics(
    makePhysicsDocument([{extensions: {KHR_physics_rigid_bodies: {motion: {}, collider}}}])
  );
  expect(result.supported).toBe(false);
  expect(result.issues.length).toBeGreaterThan(0);
  expect(() => createGLTFPhysicsWorld(result)).toThrow('Unsupported glTF');
});

it('diagnoses unsupported shapes, shear, singular transforms and draft aliases', () => {
  const source = makePhysicsDocument();
  source.extensions = {
    KHR_implicit_shapes: {
      shapes: [{type: 'capsule', capsule: {height: 1, radiusTop: 1, radiusBottom: 1}}]
    }
  };
  expect(
    parseGLTFPhysics(source).issues.some(issue =>
      issue.message.includes('Unsupported implicit shape')
    )
  ).toBe(true);
  for (const matrix of [[1, 0, 0, 0, 0.5, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], Array(16).fill(0)]) {
    const result = parseGLTFPhysics(
      makePhysicsDocument([
        {matrix, extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 1}}}}}
      ])
    );
    expect(result.supported).toBe(false);
  }
  const legacy = makePhysicsDocument();
  legacy.extensionsRequired = ['KHR_collision_shapes'];
  expect(parseGLTFPhysics(legacy).issues.some(issue => issue.code === 'draft-mismatch')).toBe(true);
});

it('preserves reflected static boxes and rejects ellipsoid approximation', () => {
  const staticBox = makePhysicsDocument([
    {scale: [-2, 3, 4], extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 1}}}}}
  ]);
  expect(parseGLTFPhysics(staticBox).colliders[0].collider.shape).toEqual({
    type: 'box',
    halfExtents: [1, 3, 6]
  });
  const sphere = makePhysicsDocument([
    {scale: [1, 2, 1], extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 0}}}}}
  ]);
  expect(parseGLTFPhysics(sphere).supported).toBe(false);
});

it('rejects cyclic and multiply-parented hierarchies without hanging', () => {
  for (const nodes of [
    [{children: [1]}, {children: [0]}],
    [{children: [1, 2]}, {children: [2]}, {}]
  ]) {
    const result = parseGLTFPhysics(makePhysicsDocument(nodes));
    expect(result.issues.some(issue => issue.code === 'invalid-hierarchy')).toBe(true);
  }
});

it('reports physics animation ownership but permits unrelated material animation', () => {
  const source = makePhysicsDocument();
  source.animations = [{channels: [{target: {node: 0, path: 'translation'}}]}];
  expect(
    parseGLTFPhysics(source).issues.some(
      issue => issue.code === 'animation-requires-runtime-binding'
    )
  ).toBe(true);
  source.animations = [
    {
      channels: [
        {
          target: {
            path: 'pointer',
            extensions: {
              KHR_animation_pointer: {pointer: '/materials/0/pbrMetallicRoughness/baseColorFactor'}
            }
          }
        }
      ]
    }
  ];
  expect(parseGLTFPhysics(source).issues).toEqual([]);
});

it('reports deferred trigger, joint and render-instancing semantics without partial simulation', () => {
  for (const extra of [{trigger: {}}, {joint: {}}, {futureMotionFeature: true}]) {
    const result = parseGLTFPhysics(
      makePhysicsDocument([
        {
          extensions: {
            KHR_physics_rigid_bodies: {motion: {}, collider: {geometry: {shape: 0}}, ...extra}
          }
        }
      ])
    );
    expect(result.supported).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  }
  const instanced = parseGLTFPhysics(
    makePhysicsDocument([
      {
        extensions: {
          EXT_mesh_gpu_instancing: {attributes: {}},
          KHR_physics_rigid_bodies: {motion: {}, collider: {geometry: {shape: 0}}}
        }
      }
    ])
  );
  expect(instanced.issues.some(issue => issue.code === 'unsupported-physics-instancing')).toBe(
    true
  );
});
