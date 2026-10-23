// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GPURigidBody, GPURigidBodyWorldProps} from '@luma.gl/gpu-graph/gpu-physics';

import {
  QUALIFICATION_SCENES,
  makeQualificationScene,
  isQualificationScene
} from './qualification-scenes';

export const STRESS_SCENES = {
  ...QUALIFICATION_SCENES,
  capacity: 'Capacity recovery',
  dense: 'Dense mixed-size pile',
  massRatio: 'Heavy-on-light stack',
  ballistic: 'Ballistic convergence',
  continuous: 'Fast sphere / thin walls',
  sparseContacts: 'Sparse contact queue',
  geometry: 'Rotated geometry torture',
  deepStack: 'Eight-box sustained stack',
  offsetStack: 'Offset COM stack'
};
export type StressScene = keyof typeof STRESS_SCENES;
export function makeStressScene(
  scene: StressScene,
  solver: 'ordered' | 'parallel',
  timeStep: number
): {description: string; props: GPURigidBodyWorldProps} {
  const props: GPURigidBodyWorldProps = {
    solver,
    timeStep,
    iterations: 32,
    broadPhase: 'hierarchical-grid',
    sleepAfter: 0,
    gravity: [0, 0, -10],
    bodies: [
      {
        mode: 'static',
        mass: 0,
        position: [0, 0, -0.5],
        shape: {type: 'box', halfExtents: [8, 3, 0.5]},
        restitution: 0,
        friction: 0.5
      }
    ]
  };
  if (isQualificationScene(scene)) return makeQualificationScene(scene, props);
  if (scene === 'ballistic')
    return {
      description:
        'A freely falling sphere starts at height 8. The outline follows the exact ballistic solution. Halve the timestep and compare vertical error. Position uses semi-implicit Euler; the error should decrease with timestep.',
      props: {
        ...props,
        bodies: [{position: [-3, 0, 8], velocity: [2, 0, 0], shape: {type: 'sphere', radius: 0.3}}]
      }
    };
  if (scene === 'continuous')
    return {
      description:
        'A sphere travels at 180 units/second between 0.06-unit walls. Sphere/static CCD should prevent escape and preserve speed. This does not qualify rotating or dynamic-pair CCD.',
      props: {
        ...props,
        gravity: [0, 0, 0],
        continuous: {bodies: [0], maximumImpacts: 8},
        restitutionThreshold: 0,
        bodies: [
          {
            position: [0, 0, 3],
            velocity: [180, 0, 0],
            shape: {type: 'sphere', radius: 0.3},
            restitution: 1,
            friction: 0
          },
          ...[-5, 5].map(horizontal => ({
            position: [horizontal, 0, 3] as [number, number, number],
            mode: 'static' as const,
            shape: {type: 'box' as const, halfExtents: [0.03, 1, 3] as [number, number, number]},
            restitution: 1,
            friction: 0
          }))
        ]
      }
    };
  if (scene === 'sparseContacts')
    return {
      description:
        '24 independent impacts reserve 8192 pair slots. Select Parallel and compare Compact queue with Full scan. The queue is built once on GPU and reused by every solver iteration. Empty steps dispatch zero pair workgroups. This measures work reduction; timing also includes fixed discovery and body work.',
      props: {
        ...props,
        gravity: [0, 0, 0],
        maximumPairs: 8192,
        restitutionThreshold: 0,
        bodies: Array.from(
          {length: 48},
          (_, index): GPURigidBody => ({
            position: [
              ((Math.floor(index / 2) % 6) - 2.5) * 2 + (index % 2 ? 0.23 : -0.23),
              0,
              1 + Math.floor(index / 12) * 2
            ],
            velocity: [index % 2 ? -1 : 1, 0, 0],
            shape: {type: 'sphere', radius: 0.23},
            restitution: 1,
            friction: 0
          })
        )
      }
    };
  if (scene === 'geometry')
    return {
      description:
        'Spheres meet rotated thin boxes and edge/corner features. The companion numerical tests independently check signed depths, normal direction, scale and reversed collider order. This diagnostic projection shows X/Z rotation; general mesh containment remains outside this qualification.',
      props: {
        ...props,
        bodies: [
          ...props.bodies,
          ...[-3, 0, 3].map(
            (horizontal, index): GPURigidBody => ({
              mode: 'static' as const,
              position: [horizontal, 0, 1 + index],
              orientation: [0, Math.sin((index - 1) * 0.25), 0, Math.cos((index - 1) * 0.25)],
              shape: {type: 'box' as const, halfExtents: [1.2, 0.5, 0.12] as const},
              restitution: 0,
              friction: 0.5
            })
          ),
          ...Array.from(
            {length: 12},
            (_, index): GPURigidBody => ({
              position: [((index % 6) - 2.5) * 1.1, 0, 5 + Math.floor(index / 6)],
              shape: {type: 'sphere' as const, radius: 0.2 + (index % 3) * 0.07},
              restitution: 0.1,
              friction: 0.5
            })
          )
        ]
      }
    };
  if (scene === 'deepStack' || scene === 'offsetStack')
    return {
      description:
        scene === 'deepStack'
          ? 'Eight unit boxes run for six simulated seconds with sleeping disabled, 64 iterations, warm-start factor 0.8 and recovery fraction 0.1. Numerical checks sample support separation, height drift and residual energy at 1/120 and 1/240 s. Other timesteps are exploratory.'
          : 'Four unit boxes have a 0.1-unit center-of-mass offset. The six-second numerical fixture measures drift, support separation and residual energy with sleeping disabled. Compare the ordered and parallel solvers.',
      props: {
        ...props,
        iterations: 64,
        maximumPairs: 64,
        warmStartFactor: 0.8,
        penetrationRecoveryFraction: 0.1,
        gravity: [0, 0, -9.81],
        bodies: [
          {...props.bodies[0], friction: 0.8},
          ...Array.from(
            {length: scene === 'deepStack' ? 8 : 4},
            (_, level): GPURigidBody => ({
              position: [0, 0, level + 0.5],
              centerOfMass: [scene === 'offsetStack' ? 0.1 : 0, 0, 0],
              shape: {type: 'box' as const, halfExtents: [0.5, 0.5, 0.5] as const},
              restitution: 0,
              friction: 0.8
            })
          )
        ]
      }
    };
  const bodies = [...props.bodies];
  const count = scene === 'dense' ? 64 : scene === 'massRatio' ? 5 : 12;
  for (let index = 0; index < count; index++) {
    const radius = scene === 'dense' ? 0.22 + (index % 3) * 0.08 : 0.45;
    bodies.push({
      position:
        scene === 'massRatio'
          ? [0, 0, 0.46 + index * 0.91]
          : [((index % 8) - 3.5) * 0.85, 0, 0.5 + Math.floor(index / 8) * 0.82],
      mass: scene === 'massRatio' && index === count - 1 ? 100 : 1,
      shape:
        scene === 'massRatio' || index % 2
          ? {type: 'box', halfExtents: [radius, radius, radius]}
          : {type: 'sphere', radius},
      restitution: 0,
      friction: 0.5
    });
  }
  return {
    props: {...props, bodies, ...(scene === 'capacity' ? {maximumPairs: 1} : {})},
    description:
      scene === 'capacity'
        ? 'Starts with one pair slot. Failed steps roll back, then the runner doubles recoverable budgets and replays commands from initial state. Watch retries and allocated capacity. Reset repeats the shortage.'
        : scene === 'massRatio'
          ? 'A 100:1 load rests on four light boxes. Compare solver drift and penetration at different timesteps. This is an adversarial demonstration, not a claim that this mass ratio is qualified.'
          : '64 mixed-size spheres and boxes form a dense pile. Watch candidate work, memory and full-step completion latency as contacts accumulate. The front projection overlaps bodies in depth.'
  };
}

export function isStressScene(value: string): value is StressScene {
  return Object.hasOwn(STRESS_SCENES, value);
}

export function getStressStepCount(scene: StressScene, timeStep: number): number {
  return scene === 'deepStack' || scene === 'offsetStack' ? Math.round(6 / timeStep) : 240;
}
