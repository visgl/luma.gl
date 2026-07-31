import type {ANARIVector3} from '@luma.gl/anari';
import type {ANARIJSONScene, JSONInstanceDeclaration} from './playground-scene';

export type PlaygroundPreset = {
  label: string;
  scene: ANARIJSONScene;
};

const TAU = Math.PI * 2;

export const PLAYGROUND_PRESETS: readonly PlaygroundPreset[] = [
  {label: 'Chromatic Atlas', scene: makeChromaticAtlas()},
  {label: 'Crystal Cathedral', scene: makeCrystalCathedral()},
  {label: 'Celestial Engine', scene: makeCelestialEngine()}
];

function makeChromaticAtlas(): ANARIJSONScene {
  const instances: JSONInstanceDeclaration[] = [];
  const scene: ANARIJSONScene = {
    version: 1,
    name: 'CHROMATIC ATLAS',
    description:
      '27 retained materials · 135 animated placements · generated halo meshes · 170 stars',
    camera: {
      '@@type': 'perspective',
      position: makeCameraPosition([0, 4.1, 0], 31, 0.23, 0.2),
      target: [0, 4.1, 0],
      fovy: Math.PI / 3.8,
      near: 0.05,
      far: 220,
      orbit: {speed: 0.035}
    },
    renderer: makeRenderer(),
    geometries: {
      sphere: {'@@type': 'sphere', radius: 0.8, segments: 24},
      halo: {
        '@@type': 'triangle',
        generator: {
          '@@type': 'torus',
          majorRadius: 1.1,
          minorRadius: 0.036,
          majorSegments: 56,
          minorSegments: 8
        }
      }
    },
    materials: {
      halo: {
        '@@type': 'physicallyBased',
        baseColor: [0.16, 0.23, 0.46],
        emissive: [0.4, 0.23, 0.94],
        emissiveStrength: 1.9,
        metallic: 0.55,
        roughness: 0.2
      }
    },
    surfaces: {halo: {geometry: 'halo', material: 'halo'}},
    instances,
    lights: [
      {
        '@@id': 'sunlight',
        '@@type': 'directional',
        direction: [-0.3, -0.85, -0.42],
        color: [1, 0.84, 0.7],
        irradiance: 2.1
      },
      {
        '@@id': 'violet-emitter',
        '@@type': 'point',
        position: [-8, 8, 4],
        color: [0.36, 0.42, 1],
        intensity: 12
      },
      {
        '@@id': 'rose-emitter',
        '@@type': 'point',
        position: [9, 7, -2],
        color: [1, 0.25, 0.54],
        intensity: 11
      }
    ]
  };

  for (let colorIndex = 0; colorIndex < 9; colorIndex++) {
    for (let finishIndex = 0; finishIndex < 3; finishIndex++) {
      const identifier = `spectrum-${colorIndex + 1}-finish-${finishIndex + 1}`;
      scene.materials[identifier] = {
        '@@type': 'physicallyBased',
        baseColor: makeSpectrumColor(colorIndex / 9, 0.74, 0.91),
        metallic: finishIndex / 2,
        roughness: roundNumber(0.09 + colorIndex * 0.074),
        clearcoat: 0.44,
        iridescence: finishIndex === 2 ? 0.42 : 0.08
      };
      scene.surfaces[identifier] = {geometry: 'sphere', material: identifier};

      for (let depthIndex = 0; depthIndex < 5; depthIndex++) {
        instances.push({
          '@@id': `orb-${colorIndex}-${finishIndex}-${depthIndex}`,
          surface: identifier,
          position: [
            roundNumber((colorIndex - 4) * 2.38),
            roundNumber(finishIndex * 2.65 + 1.8),
            roundNumber((depthIndex - 2) * 2.65)
          ],
          animations: [
            {
              '@@type': 'bob',
              amplitude: 0.24,
              speed: 0.9,
              phase: roundNumber(colorIndex * 0.48 + depthIndex * 0.7)
            },
            {'@@type': 'spin', speed: 0.12, phase: roundNumber(finishIndex * 0.6)}
          ]
        });
      }
    }
  }

  for (let haloIndex = 0; haloIndex < 6; haloIndex++) {
    instances.push({
      '@@id': `halo-${haloIndex}`,
      surface: 'halo',
      position: [
        roundNumber((haloIndex - 2.5) * 4),
        roundNumber(9.6 + Math.sin(haloIndex) * 1.2),
        -8
      ],
      rotation: [Math.PI / 2, 0, 0],
      scale: [1.4, 1.4, 1.4]
    });
  }

  addFloor(scene, instances, 46, [0.055, 0.065, 0.105]);
  addStarfield(scene, 170, 39);
  return scene;
}

function makeCrystalCathedral(): ANARIJSONScene {
  const instances: JSONInstanceDeclaration[] = [];
  const scene: ANARIJSONScene = {
    version: 1,
    name: 'CRYSTAL CATHEDRAL',
    description:
      'Faceted translucent crystal · 168 architectural pillars · luminous nave arches · 190 stars',
    camera: {
      '@@type': 'perspective',
      position: makeCameraPosition([0, 4.6, -1], 37, 0.23, 0.63),
      target: [0, 4.6, -1],
      fovy: Math.PI / 3.8,
      near: 0.05,
      far: 220,
      orbit: {speed: 0.028}
    },
    renderer: {
      ...makeRenderer(),
      exposure: 1.7,
      bloomIntensity: 0.88,
      bloomThreshold: 0.52,
      fogColor: [0.024, 0.035, 0.105],
      fogDensity: 0.00034
    },
    geometries: {
      column: {'@@type': 'cylinder', radius: 0.44, height: 1, segments: 7},
      spire: {'@@type': 'cone', radius: 0.56, height: 1.65, segments: 7},
      arch: {
        '@@type': 'triangle',
        generator: {'@@type': 'torus', minorRadius: 0.052, majorSegments: 66, minorSegments: 9}
      },
      shard: {
        '@@type': 'triangle',
        generator: {'@@type': 'crystal', radius: 0.47, height: 2.6, sides: 6}
      },
      beacon: {'@@type': 'sphere', radius: 0.18, segments: 14}
    },
    materials: {
      sapphire: {
        '@@type': 'physicallyBased',
        baseColor: [0.28, 0.57, 0.98],
        metallic: 0.48,
        roughness: 0.085,
        clearcoat: 0.88,
        iridescence: 0.38
      },
      amethyst: {
        '@@type': 'physicallyBased',
        baseColor: [0.66, 0.28, 0.84],
        metallic: 0.46,
        roughness: 0.11,
        clearcoat: 0.76,
        iridescence: 0.54
      },
      gold: {
        '@@type': 'physicallyBased',
        baseColor: [0.92, 0.68, 0.41],
        metallic: 0.82,
        roughness: 0.12,
        emissive: [0.31, 0.12, 0.035],
        emissiveStrength: 0.9
      },
      arch: {
        '@@type': 'physicallyBased',
        baseColor: [0.12, 0.23, 0.51],
        emissive: [0.38, 0.3, 1],
        emissiveStrength: 2.7,
        metallic: 0.68,
        roughness: 0.12
      },
      beacon: {
        '@@type': 'physicallyBased',
        baseColor: [1, 0.5, 0.2],
        emissive: [1, 0.38, 0.08],
        emissiveStrength: 4.4,
        roughness: 0.15
      },
      'ice-crystal': {
        '@@type': 'physicallyBased',
        baseColor: [0.28, 0.8, 1],
        emissive: [0.08, 0.38, 0.8],
        emissiveStrength: 0.72,
        opacity: 0.78,
        alphaMode: 'blend',
        metallic: 0.48,
        roughness: 0.055,
        clearcoat: 0.95,
        iridescence: 0.55
      },
      'rose-crystal': {
        '@@type': 'physicallyBased',
        baseColor: [0.93, 0.34, 0.78],
        emissive: [0.65, 0.12, 0.42],
        emissiveStrength: 0.7,
        opacity: 0.81,
        alphaMode: 'blend',
        metallic: 0.42,
        roughness: 0.06,
        clearcoat: 0.91,
        iridescence: 0.62
      }
    },
    surfaces: {
      'sapphire-column': {geometry: 'column', material: 'sapphire'},
      'amethyst-column': {geometry: 'column', material: 'amethyst'},
      'gold-spire': {geometry: 'spire', material: 'gold'},
      arch: {geometry: 'arch', material: 'arch'},
      beacon: {geometry: 'beacon', material: 'beacon'},
      'ice-crystal': {geometry: 'shard', material: 'ice-crystal'},
      'rose-crystal': {geometry: 'shard', material: 'rose-crystal'}
    },
    instances,
    lights: [
      {
        '@@id': 'moonlight',
        '@@type': 'directional',
        direction: [0.25, -1, -0.3],
        color: [0.75, 0.78, 1],
        irradiance: 1.9
      },
      {
        '@@id': 'sanctuary',
        '@@type': 'spot',
        position: [0, 18, 7],
        direction: [0, -1, -0.12],
        color: [0.46, 0.47, 1],
        intensity: 28,
        openingAngle: 0.7
      },
      {
        '@@id': 'processional',
        '@@type': 'point',
        position: [0, 5.5, 0],
        color: [1, 0.35, 0.1],
        intensity: 19,
        animation: {'@@type': 'orbit', center: [0, 5.5, 0], radius: 8, speed: 0.47}
      },
      {
        '@@id': 'crystal-refraction',
        '@@type': 'point',
        position: [0, 2.8, -6],
        color: [0.17, 0.7, 1],
        intensity: 16,
        animation: {'@@type': 'pulse', amplitude: 0.28, speed: 1.1}
      }
    ]
  };

  for (let depthIndex = 0; depthIndex < 14; depthIndex++) {
    const depthPosition = roundNumber((depthIndex - 6.5) * 2.6);
    for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
      for (let laneIndex = 0; laneIndex < 3; laneIndex++) {
        const horizontalPosition = (sideIndex === 0 ? -1 : 1) * (4.8 + laneIndex * 2.55);
        const towerHeight =
          4.2 + (2 - laneIndex) * 2.3 + Math.cos(depthIndex * 0.6 + laneIndex) * 1.35;
        instances.push(
          {
            '@@id': `column-${depthIndex}-${sideIndex}-${laneIndex}`,
            surface: (depthIndex + laneIndex) % 2 === 0 ? 'sapphire-column' : 'amethyst-column',
            position: [
              roundNumber(horizontalPosition),
              roundNumber(towerHeight / 2),
              depthPosition
            ],
            scale: [1, roundNumber(towerHeight), 1]
          },
          {
            '@@id': `spire-${depthIndex}-${sideIndex}-${laneIndex}`,
            surface: 'gold-spire',
            position: [
              roundNumber(horizontalPosition),
              roundNumber(towerHeight + 0.76),
              depthPosition
            ]
          }
        );

        if (laneIndex === 0) {
          instances.push({
            '@@id': `beacon-${depthIndex}-${sideIndex}`,
            surface: 'beacon',
            position: [
              roundNumber(horizontalPosition),
              roundNumber(towerHeight + 1.7),
              depthPosition
            ],
            animation: {
              '@@type': 'bob',
              amplitude: 0.38,
              speed: 1.35,
              phase: roundNumber(depthIndex * 0.43 + sideIndex)
            }
          });
        }
      }

      const crystalPosition = (sideIndex === 0 ? -1 : 1) * 2.45;
      instances.push({
        '@@id': `crystal-${depthIndex}-${sideIndex}`,
        surface: sideIndex === 0 ? 'ice-crystal' : 'rose-crystal',
        position: [crystalPosition, 1.4, depthPosition],
        rotation: [0, roundNumber(depthIndex * 0.38), sideIndex === 0 ? -0.13 : 0.13],
        scale: [0.78, roundNumber(1.05 + Math.sin(depthIndex * 0.8 + sideIndex) * 0.22), 0.78],
        animation: {'@@type': 'wobble', axis: 'z', amplitude: 0.035, speed: 0.6, phase: depthIndex}
      });
    }

    if (depthIndex % 2 === 0) {
      instances.push(
        {
          '@@id': `arch-${depthIndex}`,
          surface: 'arch',
          position: [0, 5.4, depthPosition],
          rotation: [Math.PI / 2, 0, 0],
          scale: [5.45, 5.45, 5.45]
        },
        {
          '@@id': `floating-crystal-${depthIndex}`,
          surface: 'ice-crystal',
          position: [0, 7.5, depthPosition],
          scale: [0.65, 1.1, 0.65],
          animations: [
            {'@@type': 'bob', amplitude: 0.38, speed: 0.7, phase: depthIndex},
            {'@@type': 'spin', speed: 0.18}
          ]
        }
      );
    }
  }

  addFloor(scene, instances, 90, [0.025, 0.034, 0.07]);
  addStarfield(scene, 190, 50);
  return scene;
}

function makeCelestialEngine(): ANARIJSONScene {
  const instances: JSONInstanceDeclaration[] = [
    {
      '@@id': 'nucleus',
      surface: 'nucleus',
      position: [0, 7, 0],
      animation: {'@@type': 'spin', speed: 0.19}
    }
  ];
  const scene: ANARIJSONScene = {
    version: 1,
    name: 'CELESTIAL ENGINE',
    description:
      'Eight inclined torus orbits · 48 satellites · four real orbiting lights · 260 stars',
    camera: {
      '@@type': 'perspective',
      position: makeCameraPosition([0, 7, 0], 28, 0.32, 0.44),
      target: [0, 7, 0],
      fovy: Math.PI / 3.8,
      near: 0.05,
      far: 220,
      orbit: {speed: 0.035}
    },
    renderer: makeRenderer(),
    geometries: {
      nucleus: {'@@type': 'sphere', radius: 2.45, segments: 40},
      satellite: {'@@type': 'sphere', radius: 0.16, segments: 14},
      ring: {
        '@@type': 'triangle',
        generator: {
          '@@type': 'torus',
          minorRadius: 0.025,
          majorSegments: 110,
          minorSegments: 10
        }
      }
    },
    materials: {
      nucleus: {
        '@@type': 'physicallyBased',
        baseColor: [0.11, 0.16, 0.35],
        metallic: 0.91,
        roughness: 0.075,
        clearcoat: 0.9,
        iridescence: 0.58,
        emissive: [0.12, 0.06, 0.27],
        emissiveStrength: 0.32
      }
    },
    surfaces: {nucleus: {geometry: 'nucleus', material: 'nucleus'}},
    instances,
    lights: [
      {
        '@@id': 'starlight',
        '@@type': 'directional',
        direction: [-0.4, -0.9, -0.3],
        color: [0.79, 0.83, 1],
        irradiance: 1.05
      }
    ]
  };

  for (let orbitIndex = 0; orbitIndex < 8; orbitIndex++) {
    const color = makeSpectrumColor(0.57 + orbitIndex * 0.071, 0.66, 0.94);
    const radius = roundNumber(3.4 + orbitIndex * 0.85);
    const inclination = roundNumber((orbitIndex - 3.5) * 0.18);
    const ringIdentifier = `ring-${orbitIndex}`;
    const satelliteIdentifier = `satellite-${orbitIndex}`;

    scene.materials[ringIdentifier] = {
      '@@type': 'physicallyBased',
      baseColor: color,
      emissive: color,
      emissiveStrength: roundNumber(1.2 + orbitIndex * 0.14),
      metallic: 0.65,
      roughness: 0.14
    };
    scene.materials[satelliteIdentifier] = {
      '@@type': 'physicallyBased',
      baseColor: color,
      emissive: color,
      emissiveStrength: 2.8,
      roughness: 0.16
    };
    scene.surfaces[ringIdentifier] = {geometry: 'ring', material: ringIdentifier};
    scene.surfaces[satelliteIdentifier] = {geometry: 'satellite', material: satelliteIdentifier};

    instances.push({
      '@@id': ringIdentifier,
      surface: ringIdentifier,
      position: [0, 7, 0],
      rotation: [inclination, 0, roundNumber(orbitIndex * 0.28)],
      scale: [radius, radius, radius],
      animations: [
        {'@@type': 'wobble', axis: 'x', amplitude: 0.07, speed: 0.28, phase: orbitIndex},
        {'@@type': 'spin', axis: 'z', speed: orbitIndex % 2 === 0 ? 0.07 : -0.055}
      ]
    });

    for (let satelliteIndex = 0; satelliteIndex < 6; satelliteIndex++) {
      const identifier = `satellite-${orbitIndex}-${satelliteIndex}`;
      const illuminated = satelliteIndex === 0 && orbitIndex < 4;
      const scale = illuminated ? 2.25 : 1.1;
      instances.push({
        '@@id': identifier,
        surface: satelliteIdentifier,
        position: [radius, 7, 0],
        scale: [scale, scale, scale],
        animation: {
          '@@type': 'orbit',
          center: [0, 7, 0],
          radius,
          speed: roundNumber((0.24 + orbitIndex * 0.028) * (orbitIndex % 2 === 0 ? 1 : -1)),
          phase: roundNumber((satelliteIndex / 6) * TAU),
          inclination
        }
      });

      if (illuminated) {
        scene.lights = [
          ...(scene.lights || []),
          {
            '@@id': `orbiting-light-${orbitIndex}`,
            '@@type': 'point',
            position: [radius, 7, 0],
            color,
            intensity: 34 + (3 - orbitIndex) * 7,
            animation: {'@@type': 'follow', target: identifier}
          }
        ];
      }
    }
  }

  addFloor(scene, instances, 80, [0.025, 0.035, 0.06]);
  addStarfield(scene, 260, 45);
  return scene;
}

function addFloor(
  scene: ANARIJSONScene,
  instances: JSONInstanceDeclaration[],
  size: number,
  color: ANARIVector3
): void {
  scene.geometries.floor = {'@@type': 'quad', width: size, height: size};
  scene.materials.floor = {
    '@@type': 'physicallyBased',
    baseColor: color,
    metallic: 0.68,
    roughness: 0.24,
    clearcoat: 0.4
  };
  scene.surfaces.floor = {geometry: 'floor', material: 'floor'};
  instances.push({'@@id': 'floor', surface: 'floor', position: [0, 0, 0]});
}

function addStarfield(scene: ANARIJSONScene, count: number, radius: number): void {
  scene.geometries.star = {'@@type': 'sphere', radius: 0.035, segments: 7};
  scene.materials.star = {
    '@@type': 'physicallyBased',
    baseColor: [0.58, 0.66, 1],
    emissive: [0.52, 0.62, 1],
    emissiveStrength: 3.5,
    roughness: 0.2
  };
  scene.surfaces.star = {geometry: 'star', material: 'star'};
  scene.distributions = [
    ...(scene.distributions || []),
    {'@@id': 'starfield', '@@type': 'starfield', surface: 'star', count, radius}
  ];
}

function makeRenderer(): ANARIJSONScene['renderer'] {
  return {
    '@@type': 'default',
    background: [0.016, 0.019, 0.044, 1],
    ambientRadiance: 0.1,
    exposure: 1.5,
    bloomIntensity: 0.82,
    bloomThreshold: 0.64,
    bloomRadius: 8,
    fogColor: [0.018, 0.025, 0.065],
    fogDensity: 0.00024
  };
}

function makeCameraPosition(
  target: ANARIVector3,
  distance: number,
  elevation: number,
  azimuth: number
): ANARIVector3 {
  const horizontalDistance = distance * Math.cos(elevation);
  return [
    roundNumber(target[0] + Math.sin(azimuth) * horizontalDistance),
    roundNumber(target[1] + Math.sin(elevation) * distance),
    roundNumber(target[2] + Math.cos(azimuth) * horizontalDistance)
  ];
}

function makeSpectrumColor(hue: number, saturation: number, value: number): ANARIVector3 {
  const wrappedHue = ((hue % 1) + 1) % 1;
  const getChannel = (offset: number): number => {
    const phase = (wrappedHue * 6 + offset) % 6;
    return roundNumber(value * (1 - saturation * Math.max(0, Math.min(phase, 4 - phase, 1))));
  };
  return [getChannel(5), getChannel(3), getChannel(1)];
}

function roundNumber(value: number): number {
  return Number(value.toFixed(4));
}
