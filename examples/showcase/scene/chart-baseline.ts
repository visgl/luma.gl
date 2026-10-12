// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ANARIRendererSubtype, ANARIVector3} from '@luma.gl/scene';
import type {ANARIJSONScene, JSONInstanceDeclaration} from './playground-scene';

/** Fixed data shared by the raster and ray chart acceptance scenes. */
export const CHART_BASELINE_DATA = [
  {identifier: 'alpha', value: 1.2},
  {identifier: 'beta', value: 2.4},
  {identifier: 'gamma', value: 1.8},
  {identifier: 'delta', value: 3.2},
  {identifier: 'epsilon', value: 2.6},
  {identifier: 'zeta', value: 1.5}
] as const;

/** Renderer selection changes no geometry, placement, lighting, or camera inputs. */
export function makeChartBaseline(
  rendererSubtype: ANARIRendererSubtype = 'default'
): ANARIJSONScene {
  const instances: JSONInstanceDeclaration[] = [{'@@id': 'floor', surface: 'floor'}];
  const scene: ANARIJSONScene = {
    version: 1,
    name: 'CHART BASELINE',
    description: 'Fixed data and camera · 18 identified marks · cuboids, spheres, and cylinders',
    camera: {
      '@@type': 'perspective',
      position: [8, 7, 12],
      target: [0, 1.2, 0],
      fovy: Math.PI / 4,
      near: 0.1,
      far: 100
    },
    renderer: {
      '@@type': rendererSubtype,
      background: [0.04, 0.04, 0.04, 1],
      ambientRadiance: 0.1,
      exposure: 1,
      bloomIntensity: 0,
      fogDensity: 0,
      ...(rendererSubtype === 'raytrace'
        ? {
            resolutionScale: 1,
            adaptiveResolution: false,
            temporalReprojection: false,
            shadowSamplesPerFrame: 0,
            samplesPerPixel: 1,
            samplingSeed: 0,
            progressive: true,
            shadows: true
          }
        : {})
    },
    geometries: {
      bar: {'@@type': 'triangle', 'vertex.position': makeCuboidPositions()},
      point: {'@@type': 'sphere', radius: 0.3, segments: 24},
      column: {'@@type': 'cylinder', radius: 0.3, height: 1, segments: 24},
      floor: {'@@type': 'quad', width: 12, height: 9}
    },
    materials: {
      blue: {'@@type': 'physicallyBased', baseColor: [0.12, 0.42, 0.8], roughness: 0.6},
      orange: {'@@type': 'physicallyBased', baseColor: [0.9, 0.3, 0.08], roughness: 0.6},
      floor: {'@@type': 'physicallyBased', baseColor: [0.55, 0.55, 0.55], roughness: 1}
    },
    surfaces: {
      bar: {geometry: 'bar', material: 'blue'},
      point: {geometry: 'point', material: 'orange'},
      column: {geometry: 'column', material: 'blue'},
      floor: {geometry: 'floor', material: 'floor'}
    },
    instances,
    lights: [{'@@id': 'key', '@@type': 'directional', direction: [-0.5, -1, -0.5], irradiance: 2}]
  };

  for (const [datumIndex, datum] of CHART_BASELINE_DATA.entries()) {
    const horizontalPosition = (datumIndex - 2.5) * 1.4;
    instances.push(
      {
        '@@id': `bar-${datum.identifier}`,
        surface: 'bar',
        position: [horizontalPosition, datum.value / 2, 2],
        scale: [0.7, datum.value, 0.7]
      },
      {
        '@@id': `point-${datum.identifier}`,
        surface: 'point',
        position: [horizontalPosition, datum.value, 0]
      },
      {
        '@@id': `column-${datum.identifier}`,
        surface: 'column',
        position: [horizontalPosition, datum.value / 2, -2],
        scale: [1, datum.value, 1]
      }
    );
  }
  return scene;
}

function makeCuboidPositions(): number[] {
  const positions: number[] = [];
  // Counterclockwise faces emit non-indexed triangles for generated flat normals.
  const faces: readonly (readonly ANARIVector3[])[] = [
    [
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1]
    ],
    [
      [1, -1, -1],
      [-1, -1, -1],
      [-1, 1, -1],
      [1, 1, -1]
    ],
    [
      [1, -1, 1],
      [1, -1, -1],
      [1, 1, -1],
      [1, 1, 1]
    ],
    [
      [-1, -1, -1],
      [-1, -1, 1],
      [-1, 1, 1],
      [-1, 1, -1]
    ],
    [
      [-1, 1, 1],
      [1, 1, 1],
      [1, 1, -1],
      [-1, 1, -1]
    ],
    [
      [-1, -1, -1],
      [1, -1, -1],
      [1, -1, 1],
      [-1, -1, 1]
    ]
  ];
  for (const face of faces) {
    for (const vertexIndex of [0, 1, 2, 0, 2, 3]) {
      positions.push(...face[vertexIndex].map(component => component / 2));
    }
  }
  return positions;
}

/** The interaction acceptance scene shares baseline data and retained identities. */
export function makeChartMotionScene(): ANARIJSONScene {
  const scene = makeChartBaseline('raytrace');
  scene.name = 'CHART MOTION';
  scene.description = 'Click an animated mark · raster labels use ray-traced depth';
  scene.instances = scene.instances?.map((instance, index) =>
    instance['@@id'].startsWith('point-')
      ? {
          ...instance,
          animation: {'@@type': 'bob', amplitude: 0.45, speed: 1, phase: index * 0.7}
        }
      : instance
  );
  return scene;
}
