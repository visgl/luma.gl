// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GPURigidBodyWorldProps} from '@luma.gl/graph/gpu-physics';

export const MATCHED_SCENES = {
  matchedPile: 'Box3D comparison · box pile',
  matchedMixed: 'Box3D comparison · mixed sizes',
  matchedStack: 'Box3D comparison · tall stacks',
  matchedChain: 'Box3D comparison · joint chain',
  matchedFast: 'Box3D comparison · fast rotating bars',
  matchedBallistic: 'Box3D comparison · ballistic control'
};
export type MatchedScene = keyof typeof MATCHED_SCENES;
type Vector = [number, number, number];
export type MatchedBody = {
  position: Vector;
  orientation: [number, number, number, number];
  velocity: Vector;
  angularVelocity: Vector;
  halfExtents: Vector;
  mass: number;
  friction: number;
  restitution: number;
};
export type MatchedFixture = {
  version: 1;
  scene: MatchedScene;
  seed: number;
  gravity: Vector;
  bodies: MatchedBody[];
  joints: {first: number; second: number; distance: number}[];
  continuous: boolean;
  description: string;
};

export function isMatchedScene(value: string): value is MatchedScene {
  return Object.hasOwn(MATCHED_SCENES, value);
}

/** One engine-neutral definition, consumed unchanged by the C adapter and GPU runner. */
export function makeMatchedFixture(scene: MatchedScene, count = 32, seed = 42): MatchedFixture {
  if (
    !Object.hasOwn(MATCHED_SCENES, scene) ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 4096 ||
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 0xffffffff ||
    (scene === 'matchedChain' && count > 64)
  )
    throw new Error('Invalid matched fixture');
  let randomState = seed >>> 0;
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 4294967296;
  };
  const details: Record<MatchedScene, string> = {
    matchedPile:
      'Identical boxes fall onto a slab; compare settled overlap, energy dissipation and contact cost.',
    matchedMixed:
      'Seeded sizes and uniform density vary both mass and inertia; compare broad-phase work and overlap.',
    matchedStack: 'Eight-high stacks expose solver drift and sustained contact error.',
    matchedChain:
      'A rigid distance-joint chain swings under gravity; compare length error and energy loss. This scenario requires the ordered GPU solver.',
    matchedFast:
      'Fast rotating bars strike thin walls. Incomplete CCD steps are rolled back and reported; a stopped or energy-losing body is not automatically a successful result.',
    matchedBallistic:
      'Free fall has an exact position/velocity oracle, separating integration error from contact behavior.'
  };
  const fixture: MatchedFixture = {
    version: 1,
    scene,
    seed,
    gravity: [0, 0, -9.81],
    bodies: [],
    joints: [],
    continuous: scene === 'matchedFast',
    description: `${details[scene]} Shared Box3D/GPU inputs; this diagnostic view is not timed. Use the matched runner for independent quality and performance replays.`
  };
  const add = (position: Vector, halfExtents: Vector, mass = 1): MatchedBody => {
    const body: MatchedBody = {
      position,
      halfExtents,
      mass,
      orientation: [0, 0, 0, 1],
      velocity: [0, 0, 0],
      angularVelocity: [0, 0, 0],
      friction: 0.5,
      restitution: 0
    };
    fixture.bodies.push(body);
    return body;
  };
  if (scene === 'matchedChain') {
    add([0, 0, count * 0.8 + 2], [0.2, 0.2, 0.2], 0);
    for (let index = 1; index <= count; index++) {
      add([index * 0.48, 0, count * 0.8 + 2 - index * 0.64], [0.2, 0.2, 0.2]);
      fixture.joints.push({first: index - 1, second: index, distance: 0.8});
    }
  } else if (scene === 'matchedFast') {
    fixture.gravity = [0, 0, 0];
    for (let index = 0; index < count; index++) {
      const depth = index * 2;
      for (const horizontal of [-5, 5]) add([horizontal, depth, 0], [0.03, 0.8, 1000], 0);
      const body = add([0, depth, 0], [0.6, 0.12, 0.12]);
      body.velocity = [120, 0, 0];
      body.angularVelocity = [0, 60, 0];
    }
    for (const body of fixture.bodies) {
      body.friction = 0;
      body.restitution = 1;
    }
  } else if (scene === 'matchedBallistic') {
    for (let index = 0; index < count; index++)
      add([index * 2, 0, 10], [0.3, 0.3, 0.3]).velocity = [1, 0, 2];
  } else {
    const width = Math.ceil(Math.sqrt(scene === 'matchedStack' ? Math.ceil(count / 8) : count));
    add([0, 0, -0.5], [width * 1.5 + 4, width * 1.5 + 4, 0.5], 0);
    for (let index = 0; index < count; index++) {
      const layer = scene === 'matchedStack' ? index % 8 : Math.floor(index / 16);
      const column = scene === 'matchedStack' ? Math.floor(index / 8) : index % 16;
      const size = scene === 'matchedMixed' ? 0.2 + random() * 0.3 : 0.45;
      const body = add(
        [
          ((column % 4) - 1.5) * 1.4,
          (Math.floor(column / 4) - 1.5) * 1.4,
          0.5 + layer * (scene === 'matchedStack' ? 0.92 : 1.4)
        ],
        [size, size, size],
        8 * size ** 3
      );
      if (scene !== 'matchedStack') {
        const angle = (random() - 0.5) * 0.4;
        body.orientation = [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)];
      }
    }
  }
  return fixture;
}

export function makeMatchedWorld(
  fixture: MatchedFixture,
  timeStep: number,
  solver: 'ordered' | 'parallel' = 'ordered',
  iterations = 16
): GPURigidBodyWorldProps {
  return {
    timeStep,
    solver,
    iterations,
    gravity: fixture.gravity,
    sleepAfter: 0,
    restitutionThreshold: 0,
    broadPhase: 'hierarchical-grid',
    failurePolicy: fixture.continuous ? 'rollback' : 'report',
    compactContacts: true,
    bodies: fixture.bodies.map(body => ({
      ...body,
      mode: body.mass === 0 ? 'static' : 'dynamic',
      shape: {type: 'box', halfExtents: body.halfExtents}
    })),
    joints: fixture.joints.map(joint => ({...joint, type: 'distance', collideConnected: false})),
    ...(fixture.continuous
      ? {
          continuous: {
            mode: 'convex',
            bodies: fixture.bodies.flatMap((body, index) => (body.mass ? [index] : [])),
            maximumImpacts: 16
          }
        }
      : {})
  };
}
