// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  makeConvexHullGeometry,
  makeTriangleMeshGeometry,
  type GPURigidBody,
  type GPURigidBodyWorldProps
} from '@luma.gl/graph/gpu-physics';

export const QUALIFICATION_SCENES = {
  geometryConvex: 'Geometry Torture · scaled convex hulls',
  geometryOpenings: 'Geometry Torture · real mesh opening',
  fastPrimitives: 'Fast Motion Lab · curved obstacles',
  fastMesh: 'Fast Motion Lab · mesh opening / rim',
  fastBudget: 'Fast Motion Lab · impact budget rejection'
};
export type QualificationScene = keyof typeof QUALIFICATION_SCENES;

export function isQualificationScene(value: string): value is QualificationScene {
  return Object.hasOwn(QUALIFICATION_SCENES, value);
}

export function makeOpeningGeometry() {
  const positions: number[] = [],
    indices: number[] = [];
  for (const [minimumX, maximumX, minimumY, maximumY] of [
    [-3, -0.6, -2, 2],
    [0.6, 3, -2, 2],
    [-0.6, 0.6, -2, -0.6],
    [-0.6, 0.6, 0.6, 2]
  ]) {
    const base = positions.length / 3;
    positions.push(
      minimumX,
      minimumY,
      0,
      maximumX,
      minimumY,
      0,
      maximumX,
      maximumY,
      0,
      minimumX,
      maximumY,
      0
    );
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return makeTriangleMeshGeometry(positions, indices);
}

export function makeQualificationScene(
  scene: QualificationScene,
  base: GPURigidBodyWorldProps
): {description: string; props: GPURigidBodyWorldProps} {
  if (scene === 'geometryConvex')
    return {
      description:
        'Geometry Torture: the same cooked convex cube appears at three sizes with rotated faces. Contact depths are qualified separately against independent rectangle SAT at scales 0.001, 1 and 1000, with reversed collider order. The diagnostic projection displays original hull triangles. This does not qualify all convex shapes or stable feature identity.',
      props: {
        ...base,
        bodies: [
          base.bodies[0],
          ...[0.25, 0.6, 1].map(
            (size, index): GPURigidBody => ({
              position: [-3 + index * 3, 0, 4 + index],
              orientation: [0, Math.sin(0.21), 0, Math.cos(0.21)],
              shape: {
                type: 'convex-hull',
                geometry: makeConvexHullGeometry(
                  Array.from({length: 8}, (_, corner) => [
                    corner & 1 ? size : -size,
                    corner & 2 ? size : -size,
                    corner & 4 ? size : -size
                  ]).flat()
                )
              },
              restitution: 0.1,
              friction: 0.6
            })
          )
        ]
      }
    };
  if (scene === 'geometryOpenings' || scene === 'fastMesh')
    return {
      description:
        scene === 'geometryOpenings'
          ? 'Geometry Torture: original triangles form a two-sided surface with a real central opening. An oblique projection reveals the opening. The center sphere fits through; the outer spheres meet the rim. No convex hull fills the hole. Meshes retain surface semantics: a closed mesh does not imply solid-volume containment.'
          : 'Fast Motion Lab: selected spheres sweep against the original mesh triangles. The center trajectory passes through the opening; rim trajectories rebound. Trails reveal motion between readbacks. Only centered spheres versus static geometry have CCD; rotating and dynamic obstacles retain discrete response.',
      props: {
        ...base,
        ...(scene === 'fastMesh'
          ? {
              gravity: [0, 0, 0] as const,
              continuous: {bodies: [1, 2, 3], maximumImpacts: 8},
              restitutionThreshold: 0
            }
          : {}),
        bodies: [
          {
            mode: 'static',
            position: [0, 0, 3],
            shape: {type: 'triangle-mesh', geometry: makeOpeningGeometry()},
            restitution: 1
          },
          ...[-1.5, 0, 1.5].map(
            (horizontal): GPURigidBody => ({
              position: [horizontal, 0, 7],
              velocity: [0, 0, scene === 'fastMesh' ? -180 : 0],
              shape: {type: 'sphere', radius: 0.25},
              restitution: 1
            })
          ),
          base.bodies[0],
          ...(scene === 'fastMesh'
            ? [
                {
                  mode: 'static' as const,
                  position: [0, 0, 8.5] as const,
                  shape: {type: 'box' as const, halfExtents: [4, 2, 0.03] as const},
                  restitution: 1,
                  friction: 0
                }
              ]
            : [])
        ]
      }
    };
  const exhausted = scene === 'fastBudget';
  return {
    description: exhausted
      ? 'Fast Motion Lab: a deliberately insufficient one-impact budget rejects the whole step. The accepted pose and velocity stay at their starting values; the red REJECTED status reports incomplete CCD. Reset repeats the failure. Rejection is the expected result, not a successful completed trajectory.'
      : 'Fast Motion Lab: a fast spinning sphere ricochets between capsule and cylinder obstacles. Curved surfaces use bounded conservative advancement; spheres, boxes and unbounded planes use exact feature sweeps. Pace is preserved at restitution 1 and zero friction. Trails show sampled centers, not an exact between-impact path. Spin is carried through, not spin-dependent CCD response.',
    props: {
      ...base,
      gravity: [0, 0, 0],
      continuous: {bodies: [0], maximumImpacts: exhausted ? 1 : 8},
      restitutionThreshold: 0,
      bodies: [
        {
          position: [0, 0, 3],
          velocity: [exhausted ? 3000 : 180, 0, 0],
          angularVelocity: [0, 18, 0],
          shape: {type: 'sphere', radius: 0.25},
          restitution: 1,
          friction: 0
        },
        ...[-4, 4].map(
          (horizontal, index): GPURigidBody => ({
            mode: 'static',
            position: [horizontal, 0, 3],
            shape:
              index === 0
                ? {type: 'capsule', height: 3, radiusBottom: 0.4, radiusTop: 0.4}
                : {type: 'cylinder', height: 3, radiusBottom: 0.4, radiusTop: 0.4},
            restitution: 1,
            friction: 0
          })
        )
      ]
    }
  };
}
