// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GPURigidBodyWorldProps} from '@luma.gl/graph/gpu-physics';

export const CONTINUOUS_SCENES = {
  persistentContacts: 'Persistent contacts · moving platform',
  fastConvexPairs: 'Fast Motion Lab · dynamic convex pairs',
  fastMovingWall: 'Fast Motion Lab · translating wall',
  fastRotatingGate: 'Fast Motion Lab · rotating gate',
  fastConvexQueue: 'Fast Motion Lab · swept queue rejection'
};
export type ContinuousScene = keyof typeof CONTINUOUS_SCENES;
export function isContinuousScene(value: string): value is ContinuousScene {
  return Object.hasOwn(CONTINUOUS_SCENES, value);
}
export function makeContinuousScene(
  scene: ContinuousScene,
  base: GPURigidBodyWorldProps
): {description: string; props: GPURigidBodyWorldProps} {
  const material = {restitution: 1, friction: 0};
  const walls = [-6, 6].map(horizontal => ({
    ...material,
    mode: 'static' as const,
    position: [horizontal, 0, 4] as const,
    shape: {type: 'box' as const, halfExtents: [0.05, 2, 5] as const}
  }));
  const props: GPURigidBodyWorldProps = {
    ...base,
    gravity: [0, 0, 0],
    failurePolicy: 'rollback',
    restitutionThreshold: 0,
    continuous: {mode: 'convex', bodies: [0], maximumImpacts: 8, maximumCandidates: 128},
    bodies: []
  };
  if (scene === 'persistentContacts')
    return {
      description:
        'Two bodies translate together farther than the contact matching distance each step. Local anchors and feature keys preserve the warm start. The boxes ride the moving platform; reset restores the initial scene. This is a diagnostic, not a complete difficult-stack qualification.',
      props: {
        ...base,
        gravity: [0, 0, -10] as const,
        contactMatchDistance: 0.001,
        bodies: [
          {
            mode: 'kinematic' as const,
            position: [-5, 0, 0] as const,
            velocity: [0.5, 0, 0] as const,
            shape: {type: 'box' as const, halfExtents: [3, 1, 0.2] as const},
            friction: 0.8
          },
          ...[-1, 0, 1].map(horizontal => ({
            position: [horizontal - 5, 0, 0.7] as const,
            velocity: [0.5, 0, 0] as const,
            shape: {type: 'box' as const, halfExtents: [0.4, 0.4, 0.5] as const},
            friction: 0.8
          }))
        ]
      }
    };
  if (scene === 'fastConvexPairs')
    return {
      description:
        'Fast boxes meet between rendered samples. Bounded convex CCD advances both bodies to the earliest impact, applies normal and friction impulses, then consumes the remaining timestep. The queue is rebuilt after each rebound. Single convex dynamic colliders are supported; jointed and nonconvex CCD are outside this mode.',
      props: {
        ...props,
        continuous: {...props.continuous!, bodies: [0, 1]},
        bodies: [
          {
            ...material,
            position: [-4, 0, 3],
            velocity: [240, 0, 0],
            shape: {type: 'box', halfExtents: [0.35, 0.3, 0.35]}
          },
          {
            ...material,
            position: [4, 0, 3],
            velocity: [-180, 0, 0],
            shape: {type: 'box', halfExtents: [0.35, 0.3, 0.35]}
          },
          ...walls
        ]
      }
    };
  if (scene === 'fastRotatingGate')
    return {
      description:
        'A kinematic gate sweeps through a stationary sphere between samples. Conservative advancement includes an angular speed bound, and the impulse uses velocity at the moving contact point. A 128-iteration bound rejects unresolved grazing cases. This is bounded rotational CCD, not an unqualified guarantee for every angular speed or geometry.',
      props: {
        ...props,
        bodies: [
          {...material, position: [0, 0, 4.2], shape: {type: 'sphere', radius: 0.15}},
          {
            ...material,
            mode: 'kinematic',
            position: [0, 0, 3],
            angularVelocity: [0, 120, 0],
            shape: {type: 'box', halfExtents: [2, 0.15, 0.05]}
          },
          ...walls,
          ...[0, 9].map(vertical => ({
            ...material,
            mode: 'static' as const,
            position: [0, 0, vertical] as const,
            shape: {type: 'box' as const, halfExtents: [6, 2, 0.05] as const}
          }))
        ]
      }
    };
  if (scene === 'fastMovingWall')
    return {
      description:
        'A fast sphere meets an approaching kinematic wall. The rebound is computed in the wall contact frame; the moving wall can add kinetic energy. Convex CCD includes translation and rotation of both colliders. Initial overlaps stay with the discrete solver. The view follows the sphere after its moving-frame rebound.',
      props: {
        ...props,
        bodies: [
          {
            ...material,
            position: [-3, 0, 3],
            velocity: [240, 0, 0],
            shape: {type: 'sphere', radius: 0.25}
          },
          {
            ...material,
            mode: 'kinematic',
            position: [1, 0, 3],
            velocity: [-60, 0, 0],
            shape: {type: 'box', halfExtents: [0.1, 1, 1]}
          }
        ]
      }
    };
  return {
    description:
      'The swept queue has one slot but two reachable walls. The entire step is deliberately rejected, preserving the accepted positions, orientations, velocities and contact cache. Reset repeats the rejection. Increasing the capacity is an explicit policy; no collider is silently dropped.',
    props: {
      ...props,
      continuous: {mode: 'convex', bodies: [0], maximumCandidates: 1},
      bodies: [
        {
          ...material,
          position: [-2, 0, 3],
          velocity: [240, 0, 0],
          shape: {type: 'box', halfExtents: [0.2, 0.2, 0.2]}
        },
        ...[0, 1].map(horizontal => ({
          ...material,
          mode: 'static' as const,
          position: [horizontal, 0, 3] as const,
          shape: {type: 'box' as const, halfExtents: [0.03, 1, 1] as const}
        }))
      ]
    }
  };
}
