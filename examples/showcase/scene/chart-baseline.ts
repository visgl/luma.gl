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

/** Static emissive marks illuminate the matte floor through diffuse secondary rays. */
export function makeChartDiffuseScene(): ANARIJSONScene {
  const scene = makeChartBaseline('raytrace');
  scene.name = 'CHART DIFFUSE';
  scene.description = 'Emissive marks light the floor · set maxBounces to 0 to compare';
  scene.renderer = {...scene.renderer!, maxBounces: 2, samplesPerPixel: 4, samplingSeed: 17};
  scene.materials!.orange = {
    '@@type': 'physicallyBased',
    baseColor: [0.9, 0.3, 0.08],
    emissive: [4, 0.4, 0.05],
    roughness: 1
  };
  scene.materials!.blue = {
    '@@type': 'physicallyBased',
    baseColor: [0.12, 0.42, 0.8],
    emissive: [0.02, 0.15, 1],
    roughness: 1
  };
  scene.lights = [
    {'@@id': 'key', '@@type': 'directional', direction: [-0.5, -1, -0.5], irradiance: 0.25}
  ];
  return scene;
}

/** Fixed roughness sweep: matte bars, emissive points, metallic columns and floor. */
export function makeChartMaterialsScene(): ANARIJSONScene {
  const scene = makeChartBaseline('raytrace');
  scene.name = 'CHART MATERIALS';
  scene.description = 'Metal columns sweep roughness · emissive marks reflect in the glossy floor';
  scene.renderer = {
    ...scene.renderer!,
    transportMode: 'pbr',
    maxBounces: 3,
    samplesPerPixel: 4,
    samplingSeed: 17,
    denoiseRadius: 1,
    ambientRadiance: 0
  };
  scene.materials!.blue = {'@@type': 'physicallyBased', baseColor: [0.12, 0.42, 0.8], roughness: 1};
  scene.materials!.orange = {
    '@@type': 'physicallyBased',
    baseColor: [0.9, 0.3, 0.08],
    emissive: [3, 0.6, 0.08],
    roughness: 1
  };
  scene.materials!.floor = {
    '@@type': 'physicallyBased',
    baseColor: [0.7, 0.75, 0.8],
    metallic: 1,
    roughness: 0.12
  };
  const roughnessValues = [0.04, 0.12, 0.25, 0.45, 0.7, 1];
  for (const [datumIndex, datum] of CHART_BASELINE_DATA.entries()) {
    const identifier = `column-${datum.identifier}`;
    scene.materials![identifier] = {
      '@@type': 'physicallyBased',
      baseColor: [0.95, 0.65, 0.2],
      metallic: 1,
      roughness: roughnessValues[datumIndex]
    };
    scene.surfaces![identifier] = {geometry: 'column', material: identifier};
  }
  scene.instances = scene.instances?.map(instance =>
    instance['@@id'].startsWith('column-') ? {...instance, surface: instance['@@id']} : instance
  );
  scene.lights = [
    {'@@id': 'key', '@@type': 'directional', direction: [-0.5, -1, -0.5], irradiance: 0.5}
  ];
  return scene;
}

/** Three mesh-backed shape families sharing raster and ray placements and identities. */
export function makeChartShapesScene(
  rendererSubtype: ANARIRendererSubtype = 'raytrace'
): ANARIJSONScene {
  const scene = makeChartBaseline(rendererSubtype);
  scene.name = 'CHART SHAPES';
  scene.description = '18 identified marks · hexagonal prisms, tori, and open torus segments';
  scene.geometries = {
    ...scene.geometries,
    bar: {'@@type': 'hexPrism', radius: 0.5, height: 1},
    point: {
      '@@type': 'torus',
      majorRadius: 0.35,
      minorRadius: 0.12,
      majorSegments: 32,
      minorSegments: 12
    },
    column: {
      '@@type': 'torus',
      majorRadius: 0.45,
      minorRadius: 0.15,
      majorSegments: 32,
      minorSegments: 12,
      arc: Math.PI * 1.5
    }
  };
  return scene;
}

/** Emissive panel/points illuminate annular marks; a scalar mask fixture stays invisible. */
export function makeChartLightingScene(): ANARIJSONScene {
  const scene = makeChartBaseline('raytrace');
  scene.name = 'CHART LIGHTING';
  scene.description = 'Annular marks · sampled emissive lighting · alpha-mask visibility';
  const maskGeometry = scene.geometries.bar;
  scene.geometries.bar = {
    '@@type': 'ring',
    innerRadius: 0.5,
    outerRadius: 1,
    height: 1,
    segments: 32,
    angle: Math.PI * 1.5
  };
  scene.geometries.column = {'@@type': 'hexPrism', radius: 0.3, height: 1};
  scene.geometries.panel = {'@@type': 'quad', width: 4, height: 3};
  scene.geometries.mask = maskGeometry;
  scene.materials.orange = {
    '@@type': 'physicallyBased',
    baseColor: [0.9, 0.3, 0.08],
    emissive: [1, 0.15, 0.02],
    emissiveStrength: 3
  };
  scene.materials.panel = {
    '@@type': 'physicallyBased',
    baseColor: [0, 0, 0],
    emissive: [1, 0.9, 0.7],
    emissiveStrength: 2,
    doubleSided: true
  };
  scene.materials.mask = {
    '@@type': 'physicallyBased',
    baseColor: [0.1, 1, 0.1, 0],
    alphaMode: 'mask',
    alphaCutoff: 0.5
  };
  scene.surfaces.panel = {geometry: 'panel', material: 'panel'};
  scene.surfaces.mask = {geometry: 'mask', material: 'mask'};
  scene.instances!.push(
    {'@@id': 'emitter-panel', surface: 'panel', position: [0, 5, 0]},
    {'@@id': 'masked-card', surface: 'mask', position: [0, 1.5, 2], scale: [2, 2, 0.3]}
  );
  scene.renderer = {
    ...scene.renderer!,
    emitterSampling: true,
    transportMode: 'pbr',
    maxBounces: 1,
    samplesPerPixel: 4,
    samplingSeed: 17,
    denoiseRadius: 1,
    ambientRadiance: 0
  };
  scene.lights = [
    {'@@id': 'key', '@@type': 'directional', direction: [-0.5, -1, -0.5], irradiance: 0.5}
  ];
  return scene;
}
