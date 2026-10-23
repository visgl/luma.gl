// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {getRegisteredGLTFExtensions} from '../../src';
import {parseGLTFPhysics, createGLTFPhysicsWorld, GLTF_PHYSICS_DRAFT} from '../../src/physics';
import {makePhysicsDocument} from './physics-fixtures';

function makeBoxVertices(): number[] {
  return Array.from({length: 8}, (_, corner) => [
    corner & 1 ? 3 : 1,
    corner & 2 ? 4 : 2,
    corner & 4 ? 5 : 3
  ]).flat();
}

it('opts into exact legacy box hulls without aliasing mesh and node references', () => {
  const source = makePhysicsDocument([
    {
      children: [1],
      translation: [10, 20, 30],
      extensions: {KHR_physics_rigid_bodies: {motion: {mass: 2}}}
    },
    {
      translation: [1, 0, 0],
      scale: [2, 3, 4],
      extensions: {
        KHR_physics_rigid_bodies: {
          collider: {geometry: {mesh: 7, convexHull: true}, collisionFilter: 0}
        }
      }
    }
  ]);
  const original = structuredClone(source);
  expect(parseGLTFPhysics(source).supported).toBe(false);
  const references: number[] = [];
  const description = parseGLTFPhysics(source, {
    resolveLegacyMeshPositions: meshIndex => {
      references.push(meshIndex);
      return makeBoxVertices();
    }
  });
  expect(description.issues).toEqual([]);
  expect(references).toEqual([7]);
  expect(description.colliders[0]).toMatchObject({
    meshIndex: 7,
    shapeIndex: undefined,
    nodeIndex: 1,
    bodyIndex: 0,
    collider: {shape: {type: 'box', halfExtents: [2, 3, 4]}, position: [5, 9, 16]}
  });
  expect(source).toEqual(original);
  expect(description.source).toEqual(original);
  expect(description.bodies[0].body.centerOfMass).toEqual([5, 9, 16]);
});

it('rejects non-box meshes instead of substituting their bounding boxes', () => {
  const source = makePhysicsDocument([
    {extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {mesh: 0, convexHull: true}}}}}
  ]);
  for (const positions of [
    makeBoxVertices().slice(0, -3),
    [...makeBoxVertices().slice(0, -3), 2, 3, 4],
    [NaN, ...makeBoxVertices().slice(1)],
    makeBoxVertices().map((value, index) => (index % 3 === 0 ? 1 : value))
  ]) {
    expect(parseGLTFPhysics(source, {resolveLegacyMeshPositions: () => positions}).supported).toBe(
      false
    );
  }
  expect(
    parseGLTFPhysics(source, {
      resolveLegacyMeshPositions: () => [...makeBoxVertices(), 2, 3, 4, ...makeBoxVertices()]
    }).supported
  ).toBe(true);
  for (const geometry of [
    {mesh: 0, convexHull: false},
    {mesh: 0, shape: 0, convexHull: true},
    {node: 0, convexHull: true},
    {mesh: -1, convexHull: true}
  ]) {
    const document = makePhysicsDocument([
      {extensions: {KHR_physics_rigid_bodies: {collider: {geometry}}}}
    ]);
    expect(
      parseGLTFPhysics(document, {resolveLegacyMeshPositions: makeBoxVertices}).supported
    ).toBe(false);
  }
});

it('keeps legacy compound child filters independent after collider ordering', () => {
  const source = makePhysicsDocument([
    {children: [1, 2], extensions: {KHR_physics_rigid_bodies: {motion: {mass: 1}}}},
    {
      translation: [0, -1, 0],
      extensions: {
        KHR_physics_rigid_bodies: {
          collider: {geometry: {mesh: 0, convexHull: true}, collisionFilter: 0}
        }
      }
    },
    {
      translation: [0, 1, 0],
      extensions: {
        KHR_physics_rigid_bodies: {
          collider: {geometry: {mesh: 0, convexHull: true}, collisionFilter: 1}
        }
      }
    },
    {
      extensions: {
        KHR_physics_rigid_bodies: {collider: {geometry: {shape: 1}, collisionFilter: 1}}
      }
    }
  ]);
  source.scenes = [{nodes: [0, 3]}];
  const description = parseGLTFPhysics(source, {resolveLegacyMeshPositions: makeBoxVertices});
  expect(description.issues).toEqual([]);
  expect(description.bodies[0].colliderIndices).toEqual([0, 1]);
  expect(description.colliders[0].collider.excludedColliders).toContain(2);
  expect(description.colliders[1].collider.excludedColliders).not.toContain(2);
  expect(description.colliders[2].collider.excludedColliders).toEqual([0]);
});

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
  {systems: ['allowed', 'extra'], include: ['allowed'], collides: true},
  {systems: [], include: ['allowed'], collides: false},
  {systems: ['allowed'], include: [], collides: false},
  {systems: ['other'], include: ['allowed'], collides: false}
])('include filters use nonempty membership intersection: %j', ({systems, include, collides}) => {
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
        {collisionSystems: systems},
        {collisionSystems: ['target'], collideWithSystems: include}
      ]
    }
  };
  const result = parseGLTFPhysics(source);
  expect(result.issues).toEqual([]);
  expect(result.bodies[0].body.colliders?.[0].excludedColliders).toEqual(collides ? [] : [1]);
  expect(result.bodies[1].body.colliders?.[0].excludedColliders).toEqual(collides ? [] : [0]);
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
      shapes: [{type: 'ellipsoid', ellipsoid: {radii: [1, 1, 1]}}]
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

it('imports beyond the reference capacity using the sparse GPU backend', () => {
  const nodes = [
    {children: Array.from({length: 129}, (_, index) => index + 1)},
    ...Array.from({length: 129}, () => ({
      extensions: {KHR_physics_rigid_bodies: {motion: {}, collider: {geometry: {shape: 0}}}}
    }))
  ];
  const result = parseGLTFPhysics(makePhysicsDocument(nodes));
  expect(result.issues).toEqual([]);
  expect(result.supported).toBe(true);
  const world = createGLTFPhysicsWorld(result);
  expect(world.broadPhase).toBe('hierarchical-grid');
  expect(world.count).toBe(129);
  world.destroy();
});

it('imports tapered primitives, signed gravity and scaled authored motion properties', () => {
  const source = makePhysicsDocument();
  source.extensions!.KHR_implicit_shapes = {
    shapes: [{type: 'capsule', capsule: {height: 1, radiusBottom: 0.5, radiusTop: 0.2}}]
  };
  source.nodes![0].scale = [2, 2, 2];
  source.nodes![0].extensions!.KHR_physics_rigid_bodies = {
    motion: {mass: 2, gravityFactor: -0.5, centerOfMass: [0, -0.2, 0], inertiaDiagonal: [0, 1, 0]},
    collider: {geometry: {shape: 0}}
  };
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  expect(description.colliders[0].collider.shape).toEqual({
    type: 'capsule',
    height: 2,
    radiusBottom: 1,
    radiusTop: 0.4
  });
  expect(description.bodies[0].body).toMatchObject({
    gravityFactor: -0.5,
    centerOfMass: [0, -0.4, 0],
    inertiaDiagonal: [0, 1, 0]
  });
});

it('accepts mesh-to-mesh surface contact without a fixed-separation exception', () => {
  const nodes = [0, 1].map(() => ({
    extensions: {
      KHR_physics_rigid_bodies: {
        motion: {mass: 0, inertiaDiagonal: [0, 1, 0]},
        collider: {geometry: {mesh: 0, convexHull: false}}
      }
    }
  }));
  const source = makePhysicsDocument(nodes);
  source.scenes![0].nodes = [0, 1];
  const description = parseGLTFPhysics(source, {
    resolveLegacyMeshGeometry: () => ({
      positions: [-1, 0, -1, 1, 0, -1, 0, 0, 1],
      indices: [0, 1, 2]
    })
  });
  expect(description.supported).toBe(true);
  expect(description.issues).toEqual([]);
});

it('resolves draft geometry.node subtrees and off-scene initial mesh snapshots without aliasing mesh indices', () => {
  const source = makePhysicsDocument([
    {
      translation: [10, 0, 0],
      extensions: {
        KHR_physics_rigid_bodies: {
          motion: {mass: 2},
          collider: {geometry: {node: 1, convexHull: true}}
        }
      }
    },
    {mesh: 7, translation: [100, 0, 0], children: [2], skin: 0, weights: [0.5]},
    {mesh: 8, translation: [4, 0, 0]}
  ]);
  const calls: number[] = [];
  const description = parseGLTFPhysics(source, {
    resolveNodeMeshGeometry: nodeIndex => {
      calls.push(nodeIndex);
      // Decoded snapshots include the initial morph/skin deformation in node-local space.
      return {
        positions: [...makeBoxVertices(), 1000, 1000, 1000],
        indices: [
          0, 1, 2, 1, 3, 2, 4, 6, 5, 5, 6, 7, 0, 4, 1, 1, 4, 5, 2, 3, 6, 3, 7, 6, 0, 2, 4, 2, 6, 4,
          1, 5, 3, 3, 5, 7
        ]
      };
    }
  });
  expect(calls).toEqual([1, 2]);
  expect(description.issues).toEqual([]);
  expect(description.colliders[0]).toMatchObject({
    nodeIndex: 0,
    geometryNodeIndex: 1,
    meshIndex: undefined
  });
  const shape = description.colliders[0].collider.shape;
  expect(shape).toEqual({type: 'box', halfExtents: [3, 1, 1]});
  expect(description.colliders[0].collider.position).toEqual([4, 3, 4]);
  expect(parseGLTFPhysics(source).supported).toBe(false);
});

it('imports independent finite plane extents and rejects invalid plane dimensions', () => {
  const source = makePhysicsDocument();
  source.extensions!.KHR_implicit_shapes = {
    shapes: [{type: 'plane', plane: {sizeX: 4, doubleSided: true}}]
  };
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  expect(description.colliders[0].collider.shape).toEqual({
    type: 'plane',
    sizeX: 4,
    sizeZ: undefined,
    doubleSided: true
  });
  source.extensions!.KHR_implicit_shapes = {shapes: [{type: 'plane', plane: {sizeZ: 0}}]};
  expect(parseGLTFPhysics(source).supported).toBe(false);
});

it('disables all-zero-scale colliders while retaining geometry-free authored motions', () => {
  const source = makePhysicsDocument([
    {
      scale: [0, 0, 0],
      extensions: {KHR_physics_rigid_bodies: {motion: {mass: 2}, collider: {geometry: {shape: 0}}}}
    }
  ]);
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  expect(description.colliders).toHaveLength(0);
  expect(description.bodies[0].body.colliders).toEqual([]);
  const world = createGLTFPhysicsWorld(description);
  expect(world.colliderCount).toBe(0);
  world.destroy();
});

it('rejects large filtered descriptions before expanding quadratic exclusions', () => {
  const source = makePhysicsDocument([
    {children: Array.from({length: 129}, (_, index) => index + 1)},
    ...Array.from({length: 129}, () => ({
      extensions: {
        KHR_physics_rigid_bodies: {motion: {}, collider: {geometry: {shape: 0}, collisionFilter: 0}}
      }
    }))
  ]);
  source.extensions!.KHR_physics_rigid_bodies = {collisionFilters: [{collideWithSystems: []}]};
  const result = parseGLTFPhysics(source);
  expect(result.supported).toBe(false);
  expect(result.issues.some(issue => issue.code === 'filtered-capacity-exceeded')).toBe(true);
  expect(
    result.colliders.every(collider => collider.collider.excludedColliders?.length === 0)
  ).toBe(true);
  expect(() => createGLTFPhysicsWorld(result)).toThrow();
});

it('rejects repeated off-scene geometry children before exponential expansion', () => {
  const nodes = [
    {
      extensions: {
        KHR_physics_rigid_bodies: {motion: {}, collider: {geometry: {node: 1, convexHull: true}}}
      }
    },
    ...Array.from({length: 30}, (_, index) =>
      index === 29 ? {mesh: 0} : {children: [index + 2, index + 2]}
    )
  ];
  const source = makePhysicsDocument(nodes);
  source.scenes = [{nodes: [0]}];
  let snapshots = 0;
  const result = parseGLTFPhysics(source, {
    resolveNodeMeshGeometry: () => {
      snapshots++;
      return {positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2]};
    }
  });
  expect(result.supported).toBe(false);
  expect(snapshots).toBe(1);
  expect(
    result.issues.some(issue => issue.message.includes('Invalid collision geometry subtree'))
  ).toBe(true);
});

it('keeps disabled collider descendants under zero-scaled parents importable', () => {
  const source = makePhysicsDocument([
    {scale: [0, 0, 0], children: [1]},
    {
      translation: [1, 0, 0],
      extensions: {KHR_physics_rigid_bodies: {motion: {mass: 2}, collider: {geometry: {shape: 0}}}}
    }
  ]);
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  expect(description.colliders).toHaveLength(0);
  expect(description.sceneNodes.get(1)!.matrix[12]).toBe(1);
});

it('reports animated collision mesh deformation instead of silently retaining the initial shape', () => {
  const source = makePhysicsDocument([
    {extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {node: 1, convexHull: false}}}}},
    {mesh: 0, weights: [0]}
  ]);
  source.animations = [{channels: [{target: {node: 1, path: 'weights'}}]}];
  const description = parseGLTFPhysics(source, {
    animationOwnership: 'scenegraph',
    resolveNodeMeshGeometry: () => ({positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2]})
  });
  expect(description.issues.map(issue => issue.code)).toEqual([
    'animation-requires-collider-rebuild'
  ]);
});

it('distinguishes rigid skeleton motion from animated collision-skin deformation', () => {
  const source = makePhysicsDocument([
    {
      children: [1, 2],
      extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {node: 1, convexHull: false}}}}
    },
    {mesh: 0, skin: 0},
    {}
  ]);
  source.skins = [{joints: [2]}];
  const options = {
    animationOwnership: 'scenegraph' as const,
    resolveNodeMeshGeometry: () => ({positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2]})
  };
  source.animations = [{channels: [{target: {node: 0, path: 'translation'}}]}];
  expect(parseGLTFPhysics(source, options).issues).toEqual([]);
  source.animations = [{channels: [{target: {node: 2, path: 'rotation'}}]}];
  expect(parseGLTFPhysics(source, options).issues.map(issue => issue.code)).toEqual([
    'animation-requires-collider-rebuild'
  ]);
});
