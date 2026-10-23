// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GPURigidBodyWorldProps} from '@luma.gl/gpu-graph/gpu-physics';

export const STRESS_SCENES = {
  capacity: 'Capacity recovery',
  dense: 'Dense mixed-size pile',
  massRatio: 'Heavy-on-light stack',
  ballistic: 'Ballistic convergence',
  continuous: 'Fast sphere / thin walls'
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
