// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  makeConvexHullGeometry,
  makeTriangleMeshGeometry,
  type GPURigidBody
} from '@luma.gl/graph/gpu-physics';

export const RIGID_BODY_SCENES = {
  suspension: {
    title: 'Mechanisms · spring suspension',
    description:
      'A suspended platform uses an implicit damped spring. It compresses under gravity and settles; push it to test damping and connected-island waking.'
  },
  servo: {
    title: 'Mechanisms · position-driven hinge',
    description:
      'A hinge tracks a 0.8-radian target with a compliant position drive and capped torque. Push the arm to disturb it; the drive returns it to its target within the authored limits.'
  },
  cradle: {
    title: "Mechanisms · Newton's cradle",
    description:
      'Five equal-mass spheres hang from distance constraints. The raised end ball transfers momentum through nearly touching, polished balls with slightly inelastic impacts. Reset releases it again. This scene uses 480 Hz substeps and low-speed contact settling to resolve closely spaced impacts. Gentle velocity damping models air and suspension losses. The stone frame has matching static colliders, so pushed balls rebound from it. The scene restarts after one simulated minute.'
  },
  pendulum: {
    title: 'Mechanisms · pendulum',
    description:
      'A distance constraint suspends a sphere. Joint rows share the ordered contact solver. This first joint envelope keeps connected bodies awake and does not warm-start joints.'
  },
  hinge: {
    title: 'Mechanisms · motorized hinge',
    description:
      'A hinged bar has angular limits and a torque-capped velocity motor. It can interact with the loose box. The hinge axis is the attachment frame Z axis; angular limits use wrapped radians.'
  },
  slider: {
    title: 'Mechanisms · powered slider',
    description:
      'A motor pushes a constrained carriage toward its linear stop and into a loose box. Translation is free only along the attachment Z axis; orientation is locked. Motor force is capped per step, independently of solver iteration count.'
  },
  continuous: {
    title: 'Fast sphere / thin walls',
    description:
      'A fast sphere crosses many wall thicknesses each step. Bounded sphere/static-surface CCD catches the walls and restitutes the remaining motion. Failed CCD steps roll back on the GPU. This qualifies translational spheres against static surfaces, not general rotating or dynamic-pair CCD.'
  },
  mesh: {
    title: 'Mesh openings',
    description:
      'Two moving triangle-mesh cubes fall toward an original triangle-mesh frame. One passes through the opening and lands on the floor; the other lands on the frame. Collision uses the original triangles, not a convex hull of the frame. This is discrete surface contact: high-speed tunneling and initially contained meshes still require separate handling.'
  },
  deep: {
    title: 'Deep stack',
    description:
      'Eight boxes form one connected stack. Compare drift, penetration and settling between solvers and iteration counts. This is a stability fixture, not a universal supported stack-depth guarantee.'
  },
  massRatio: {
    title: 'Heavy-on-light stack',
    description:
      'A box ten times heavier than its supports loads a four-box stack. This exposes convergence limits; compare ordered and parallel solving at 16, 32 and 64 iterations.'
  },
  support: {
    title: 'Moving support',
    description:
      'A kinematic platform moves at 0.5 units per second. Contact friction carries the boxes; the platform receives no impulses and must keep supported islands awake.'
  },
  friction: {
    title: 'Static friction',
    description:
      'Gravity has a horizontal component. Static friction 0.8 can hold the box, while dynamic friction is only 0.1. The solver tests the required accumulated impulse against the static cone rather than switching at an arbitrary slip speed.'
  },
  stack: {
    title: 'Independent stacks',
    description:
      'Three five-box stacks share a static floor. Each stack can sleep independently. Push the first stack to test waking and friction; gray bodies are sleeping.'
  },
  mixed: {
    title: 'Mixed-shape field',
    description:
      '256 boxes and spheres with varied sizes land on one large floor. This exercises hierarchical discovery and sparse contact storage beyond the 128-body all-pairs reference limit. It is a moderate-density scene, not a dense-stack performance claim.'
  },
  impact: {
    title: 'Unequal-mass impact',
    description:
      'A unit-mass sphere strikes a stationary sphere of mass two without gravity or friction. At restitution one, the light sphere reverses direction. The colored bands expose rotation. Reset to replay.'
  },
  torque: {
    title: 'Off-center impact',
    description:
      'A sphere strikes a heavier box away from its center. Contact impulses transfer both linear momentum and angular momentum. Reset or push the box to explore rotation.'
  }
};
export type RigidBodyScene = keyof typeof RIGID_BODY_SCENES;

export function makeRigidBodyScene(scene: RigidBodyScene): GPURigidBody[] {
  if (scene === 'continuous')
    return [
      {
        position: [-3, 0, 1],
        velocity: [180, 0, 0],
        shape: {type: 'sphere', radius: 0.2},
        restitution: 1,
        friction: 0
      },
      {
        position: [-5, 0, 1],
        mode: 'static',
        shape: {type: 'box', halfExtents: [0.03, 2, 2]},
        restitution: 1
      },
      {
        position: [5, 0, 1],
        mode: 'static',
        shape: {type: 'box', halfExtents: [0.03, 2, 2]},
        restitution: 1
      }
    ];
  if (scene === 'mesh') {
    const cube = makeConvexHullGeometry(
      Array.from({length: 8}, (_, corner) => [
        corner & 1 ? 0.25 : -0.25,
        corner & 2 ? 0.25 : -0.25,
        corner & 4 ? 0.25 : -0.25
      ]).flat()
    );
    const positions: number[] = [];
    const indices: number[] = [];
    for (const [center, halfExtents] of [
      [
        [-1.5, 0, 0],
        [0.5, 2, 0.25]
      ],
      [
        [1.5, 0, 0],
        [0.5, 2, 0.25]
      ],
      [
        [0, -1.5, 0],
        [1, 0.5, 0.25]
      ],
      [
        [0, 1.5, 0],
        [1, 0.5, 0.25]
      ]
    ]) {
      const bar = makeConvexHullGeometry(
        Array.from({length: 8}, (_, corner) =>
          center.map((value, axis) => value + (corner & (1 << axis) ? 1 : -1) * halfExtents[axis])
        ).flat()
      );
      const firstVertex = positions.length / 3;
      positions.push(...bar.positions);
      indices.push(...bar.indices.map(index => firstVertex + index));
    }
    return [
      {
        position: [0, 0, -0.5],
        mass: 0,
        shape: {type: 'box', halfExtents: [7, 7, 0.5]},
        restitution: 0
      },
      {
        position: [0, 0, 3],
        mass: 0,
        shape: {type: 'triangle-mesh', geometry: makeTriangleMeshGeometry(positions, indices)},
        restitution: 0
      },
      {position: [0, 0, 5], shape: {type: 'triangle-mesh', geometry: cube}, restitution: 0},
      {position: [1.5, 0, 5], shape: {type: 'triangle-mesh', geometry: cube}, restitution: 0}
    ];
  }
  if (scene === 'impact')
    return [
      {
        shape: {type: 'sphere', radius: 0.5},
        position: [-2, 0, 1],
        velocity: [3, 0, 0],
        mass: 1,
        restitution: 1,
        friction: 0
      },
      {
        shape: {type: 'sphere', radius: 0.5},
        position: [0, 0, 1],
        mass: 2,
        restitution: 1,
        friction: 0
      }
    ];
  const bodies: GPURigidBody[] = [
    {
      shape: {type: 'box', halfExtents: [14, 14, 0.5]},
      position: [0, 0, -0.5],
      mass: 0,
      restitution: 0,
      friction: 0.7
    }
  ];
  if (scene === 'torque') {
    bodies.push({
      shape: {type: 'box', halfExtents: [0.8, 0.45, 0.6]},
      position: [0, 0, 0.6],
      mass: 3
    });
    bodies.push({
      shape: {type: 'sphere', radius: 0.35},
      position: [-4, 0.3, 0.7],
      velocity: [6, 0, 0],
      restitution: 0.5
    });
  } else if (scene === 'support') {
    bodies[0] = {
      shape: {type: 'box', halfExtents: [8, 4, 0.5]},
      position: [0, 0, -0.5],
      mode: 'kinematic',
      mass: 1,
      velocity: [0.5, 0, 0],
      friction: 1,
      restitution: 0
    };
    for (let index = 0; index < 4; index++)
      bodies.push({
        shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]},
        position: [(index - 1.5) * 2, 0, 0.5],
        friction: 1,
        restitution: 0
      });
  } else if (scene === 'friction') {
    const material = {staticFriction: 0.8, dynamicFriction: 0.1, restitution: 0};
    bodies[0] = {
      position: [0, 0, -0.5],
      mass: 0,
      colliders: [{shape: {type: 'box', halfExtents: [14, 14, 0.5]}, material}]
    };
    bodies.push({
      position: [0, 0, 0.5],
      colliders: [{shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}, material}]
    });
  } else if (scene === 'deep' || scene === 'massRatio') {
    const levels = scene === 'deep' ? 8 : 4;
    for (let level = 0; level < levels; level++)
      bodies.push({
        shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]},
        position: [0, 0, 0.5 + level],
        mass: scene === 'massRatio' && level === levels - 1 ? 10 : 1,
        restitution: 0,
        friction: 0.8
      });
  } else if (scene === 'mixed') {
    for (let index = 0; index < 256; index++) {
      const radius = 0.25 + (index % 4) * 0.05;
      bodies.push({
        shape:
          index % 2
            ? {type: 'sphere', radius}
            : {type: 'box', halfExtents: [radius, radius, radius]},
        position: [
          ((index % 16) - 7.5) * 1.4,
          (Math.floor(index / 16) - 7.5) * 1.4,
          1 + (index % 5) * 0.35
        ],
        restitution: 0.15,
        friction: 0.6
      });
    }
  } else {
    for (let tower = 0; tower < 3; tower++)
      for (let level = 0; level < 5; level++) {
        const angle = tower === 1 ? 0.25 : 0;
        bodies.push({
          shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]},
          position: [(tower - 1) * 2.5, 0, 0.5 + level * 1.01],
          orientation: [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)],
          restitution: 0,
          friction: 0.7
        });
      }
  }
  return bodies;
}

export function getRigidBodySceneGravity(scene: RigidBodyScene): [number, number, number] {
  return scene === 'impact' || scene === 'continuous'
    ? [0, 0, 0]
    : scene === 'friction'
      ? [3, 0, -9.81]
      : [0, 0, -9.81];
}

export function isRigidBodyScene(value: string): value is RigidBodyScene {
  return Object.hasOwn(RIGID_BODY_SCENES, value);
}
