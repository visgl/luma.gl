import {
  ANARIDevice,
  type ANARIFrame,
  type ANARIGeometry,
  type ANARIInstance,
  type ANARILight,
  type ANARIMaterial,
  type ANARIRenderer,
  type ANARIRendererSubtype,
  type ANARISurface,
  type ANARIVector3,
  type ANARIWorld
} from '@luma.gl/anari-js';
import {AnimationLoopTemplate, type AnimationProps} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';

type SceneAnimation = (time: number) => void;

type ShowcaseScene = {
  label: string;
  title: string;
  description: string;
  world: ANARIWorld;
  animations: SceneAnimation[];
  target: ANARIVector3;
  distance: number;
  elevation: number;
  azimuth: number;
};

type SceneContents = {
  instances: ANARIInstance[];
  lights: ANARILight[];
  animations: SceneAnimation[];
};

type InstanceTransform = {
  position: ANARIVector3;
  scale?: ANARIVector3;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
};

const TAU = Math.PI * 2;

export default class ANARIShowcase extends AnimationLoopTemplate {
  static info = '';

  readonly anari: ANARIDevice;
  readonly frame: ANARIFrame;
  readonly scenes: ShowcaseScene[];
  readonly renderers: Record<ANARIRendererSubtype, ANARIRenderer>;

  private activeSceneIndex = 0;
  private orbitAzimuth = 0;
  private orbitElevation = 0;
  private orbitDistance = 24;
  private pointerPosition: [number, number] | null = null;
  private bloomEnabled = true;
  private lastStatisticsUpdate = 0;
  private canvas: HTMLCanvasElement | null = null;

  constructor({device}: AnimationProps) {
    super();

    this.anari = new ANARIDevice(device);
    this.renderers = {
      default: this.anari.newRenderer('default', {
        background: [0.016, 0.019, 0.044, 1],
        ambientRadiance: 0.1,
        exposure: 1.5,
        bloomIntensity: 0.82,
        bloomThreshold: 0.64,
        bloomRadius: 8,
        fogColor: [0.018, 0.025, 0.065],
        fogDensity: 0.00024
      }),
      debugNormals: this.anari.newRenderer('debugNormals', {
        background: [0.027, 0.033, 0.06, 1]
      }),
      debugDepth: this.anari.newRenderer('debugDepth', {
        background: [0.012, 0.014, 0.025, 1]
      })
    };
    this.scenes = [
      makeChromaticAtlas(this.anari),
      makeCrystalCathedral(this.anari),
      makeCelestialEngine(this.anari)
    ];
    const camera = this.anari.newCamera('perspective', {
      fovy: Math.PI / 3.8,
      near: 0.05,
      far: 220
    });
    this.frame = this.anari.newFrame({
      world: this.scenes[0].world,
      camera,
      renderer: this.renderers.default
    });

    const canvas = device.getDefaultCanvasContext().canvas;
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.addEventListener('pointerdown', this.handlePointerDown);
      canvas.addEventListener('pointermove', this.handlePointerMove);
      canvas.addEventListener('pointerup', this.handlePointerUp);
      canvas.addEventListener('pointercancel', this.handlePointerUp);
      canvas.addEventListener('wheel', this.handleWheel, {passive: false});
    }

    window.addEventListener('keydown', this.handleKeyDown);
    this.initializeControls();
    this.selectScene(0);
    const displayMode = device.preferredColorFormat === 'rgba16float' ? ' · HDR' : '';
    setElementText('device-type', `${device.type.toUpperCase()}${displayMode}`);
  }

  override onRender({width, height, time}: AnimationProps): void {
    const elapsedSeconds = time * 0.001;
    const activeScene = this.scenes[this.activeSceneIndex];
    for (const animation of activeScene.animations) {
      animation(elapsedSeconds);
    }

    const currentSize = this.frame.getParameter('size');
    if (!currentSize || currentSize[0] !== width || currentSize[1] !== height) {
      this.frame.setParameter('size', [width, height]).commitParameters();
    }

    const azimuth = this.orbitAzimuth + elapsedSeconds * 0.035;
    const horizontalDistance = this.orbitDistance * Math.cos(this.orbitElevation);
    const target = activeScene.target;
    const position: ANARIVector3 = [
      target[0] + Math.sin(azimuth) * horizontalDistance,
      target[1] + Math.sin(this.orbitElevation) * this.orbitDistance,
      target[2] + Math.cos(azimuth) * horizontalDistance
    ];
    const direction: ANARIVector3 = [
      target[0] - position[0],
      target[1] - position[1],
      target[2] - position[2]
    ];
    this.frame.getParameter('camera')?.setParameters({position, direction}).commitParameters();

    const statistics = this.frame.render();
    if (elapsedSeconds - this.lastStatisticsUpdate > 0.3) {
      setElementText('instance-count', statistics.instanceCount.toLocaleString());
      setElementText('draw-count', statistics.drawCount.toLocaleString());
      this.lastStatisticsUpdate = elapsedSeconds;
    }
  }

  override onFinalize(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerup', this.handlePointerUp);
      this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
      this.canvas.removeEventListener('wheel', this.handleWheel);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    this.frame.destroy();
    this.anari.destroy();
  }

  private initializeControls(): void {
    const sceneList = document.getElementById('scene-list');
    for (const [sceneIndex, scene] of this.scenes.entries()) {
      const button = document.createElement('button');
      button.className = 'scene-button';
      button.textContent = scene.label;
      button.dataset['scene'] = String(sceneIndex);
      button.addEventListener('click', () => this.selectScene(sceneIndex));
      sceneList?.appendChild(button);
    }

    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-renderer]')) {
      button.addEventListener('click', () => {
        const rendererName = button.dataset['renderer'];
        if (
          rendererName === 'default' ||
          rendererName === 'debugNormals' ||
          rendererName === 'debugDepth'
        ) {
          this.frame.setParameter('renderer', this.renderers[rendererName]).commitParameters();
          for (const control of document.querySelectorAll('[data-renderer]')) {
            control.classList.toggle('active', control === button);
          }
        }
      });
    }

    document.getElementById('bloom-toggle')?.addEventListener('click', () => {
      this.bloomEnabled = !this.bloomEnabled;
      this.renderers.default
        .setParameter('bloomIntensity', this.bloomEnabled ? 0.82 : 0)
        .commitParameters();
      document.getElementById('bloom-toggle')?.classList.toggle('active', this.bloomEnabled);
    });
  }

  private selectScene(sceneIndex: number): void {
    const scene = this.scenes[sceneIndex];
    this.activeSceneIndex = sceneIndex;
    this.orbitAzimuth = scene.azimuth;
    this.orbitElevation = scene.elevation;
    this.orbitDistance = scene.distance;
    this.frame.setParameter('world', scene.world).commitParameters();
    setElementText('scene-number', `${String(sceneIndex + 1).padStart(2, '0')} / 03`);
    setElementText('scene-title', scene.title);
    setElementText('scene-description', scene.description);
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-scene]')) {
      button.classList.toggle('active', button.dataset['scene'] === String(sceneIndex));
    }
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerPosition = [event.clientX, event.clientY];
    this.canvas?.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.pointerPosition) {
      return;
    }
    const horizontalChange = event.clientX - this.pointerPosition[0];
    const verticalChange = event.clientY - this.pointerPosition[1];
    this.orbitAzimuth -= horizontalChange * 0.005;
    this.orbitElevation = clamp(this.orbitElevation + verticalChange * 0.004, -0.08, 1.05);
    this.pointerPosition = [event.clientX, event.clientY];
  };

  private readonly handlePointerUp = (): void => {
    this.pointerPosition = null;
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.orbitDistance = clamp(this.orbitDistance * Math.exp(event.deltaY * 0.001), 8, 75);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === '1' || event.key === '2' || event.key === '3') {
      this.selectScene(Number(event.key) - 1);
    }
  };
}

function makeChromaticAtlas(device: ANARIDevice): ShowcaseScene {
  const contents = makeSceneContents();
  const sphere = device.newGeometry('sphere', {radius: 0.8, segments: 24});
  const ring = makeTorusGeometry(device, 1.1, 0.036, 56, 8);

  for (let colorIndex = 0; colorIndex < 9; colorIndex++) {
    for (let finishIndex = 0; finishIndex < 3; finishIndex++) {
      const color = makeSpectrumColor(colorIndex / 9, 0.74, 0.91);
      const material = device.newMaterial('physicallyBased', {
        baseColor: color,
        metallic: finishIndex / 2,
        roughness: 0.09 + colorIndex * 0.074,
        clearcoat: 0.44,
        iridescence: finishIndex === 2 ? 0.42 : 0.08
      });
      const group = makeSurfaceGroup(device, sphere, material);

      for (let depthIndex = 0; depthIndex < 5; depthIndex++) {
        const position: ANARIVector3 = [
          (colorIndex - 4) * 2.38,
          finishIndex * 2.65 + 1.8,
          (depthIndex - 2) * 2.65
        ];
        const instance = addInstance(device, contents, group, {position});
        contents.animations.push(time => {
          const verticalOffset = Math.sin(time * 0.9 + colorIndex * 0.48 + depthIndex * 0.7) * 0.24;
          instance
            .setParameter(
              'transform',
              makeTransform({
                position: [position[0], position[1] + verticalOffset, position[2]],
                rotationY: time * 0.12 + finishIndex * 0.6
              })
            )
            .commitParameters();
        });
      }
    }
  }

  const haloMaterial = device.newMaterial('physicallyBased', {
    baseColor: [0.16, 0.23, 0.46],
    emissive: [0.4, 0.23, 0.94],
    emissiveStrength: 1.9,
    metallic: 0.55,
    roughness: 0.2
  });
  const haloGroup = makeSurfaceGroup(device, ring, haloMaterial);
  for (let haloIndex = 0; haloIndex < 6; haloIndex++) {
    addInstance(device, contents, haloGroup, {
      position: [(haloIndex - 2.5) * 4, 9.6 + Math.sin(haloIndex) * 1.2, -8],
      scale: [1.4, 1.4, 1.4],
      rotationX: Math.PI / 2
    });
  }

  addFloor(device, contents, 46, [0.055, 0.065, 0.105]);
  addStarfield(device, contents, 170, 39);
  contents.lights.push(
    device.newLight('directional', {
      direction: [-0.3, -0.85, -0.42],
      color: [1, 0.84, 0.7],
      irradiance: 2.1
    }),
    device.newLight('point', {
      position: [-8, 8, 4],
      color: [0.36, 0.42, 1],
      intensity: 12
    }),
    device.newLight('point', {
      position: [9, 7, -2],
      color: [1, 0.25, 0.54],
      intensity: 11
    })
  );

  return {
    label: 'Chromatic Atlas',
    title: 'Chromatic\nAtlas',
    description:
      'One declarative world. Twenty-seven material definitions. Hundreds of animated placements compiled into instanced GPU draws.',
    world: makeWorld(device, contents),
    animations: contents.animations,
    target: [0, 4.1, 0],
    distance: 31,
    elevation: 0.23,
    azimuth: 0.2
  };
}

function makeCrystalCathedral(device: ANARIDevice): ShowcaseScene {
  const contents = makeSceneContents();
  const towerGeometry = device.newGeometry('cylinder', {radius: 0.44, height: 1, segments: 7});
  const spireGeometry = device.newGeometry('cone', {radius: 0.56, height: 1.65, segments: 7});
  const archGeometry = makeTorusGeometry(device, 1, 0.052, 66, 9);
  const beaconGeometry = device.newGeometry('sphere', {radius: 0.18, segments: 14});
  const towerGroups = [
    makeSurfaceGroup(
      device,
      towerGeometry,
      device.newMaterial('physicallyBased', {
        baseColor: [0.39, 0.58, 0.98],
        metallic: 0.7,
        roughness: 0.15,
        clearcoat: 0.7,
        iridescence: 0.31
      })
    ),
    makeSurfaceGroup(
      device,
      towerGeometry,
      device.newMaterial('physicallyBased', {
        baseColor: [0.67, 0.26, 0.69],
        metallic: 0.56,
        roughness: 0.18,
        clearcoat: 0.54,
        iridescence: 0.46
      })
    )
  ];
  const spireGroup = makeSurfaceGroup(
    device,
    spireGeometry,
    device.newMaterial('physicallyBased', {
      baseColor: [0.91, 0.66, 0.39],
      metallic: 0.82,
      roughness: 0.16,
      emissive: [0.31, 0.12, 0.035],
      emissiveStrength: 0.9
    })
  );
  const archGroup = makeSurfaceGroup(
    device,
    archGeometry,
    device.newMaterial('physicallyBased', {
      baseColor: [0.13, 0.2, 0.49],
      emissive: [0.4, 0.23, 1],
      emissiveStrength: 2.2,
      metallic: 0.7,
      roughness: 0.17
    })
  );
  const beaconGroup = makeSurfaceGroup(
    device,
    beaconGeometry,
    device.newMaterial('physicallyBased', {
      baseColor: [1, 0.5, 0.2],
      emissive: [1, 0.38, 0.08],
      emissiveStrength: 4,
      roughness: 0.19
    })
  );

  for (let depthIndex = 0; depthIndex < 14; depthIndex++) {
    const depthPosition = (depthIndex - 6.5) * 2.6;
    for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
      for (let laneIndex = 0; laneIndex < 3; laneIndex++) {
        const horizontalPosition = (sideIndex === 0 ? -1 : 1) * (4.8 + laneIndex * 2.55);
        const towerHeight =
          4.2 + (2 - laneIndex) * 2.3 + Math.cos(depthIndex * 0.6 + laneIndex) * 1.35;
        addInstance(device, contents, towerGroups[(depthIndex + laneIndex) % towerGroups.length], {
          position: [horizontalPosition, towerHeight * 0.5, depthPosition],
          scale: [1, towerHeight, 1]
        });
        addInstance(device, contents, spireGroup, {
          position: [horizontalPosition, towerHeight + 0.76, depthPosition]
        });
        if (laneIndex === 0) {
          const beacon = addInstance(device, contents, beaconGroup, {
            position: [horizontalPosition, towerHeight + 1.7, depthPosition]
          });
          contents.animations.push(time => {
            const lift = Math.sin(time * 1.35 + depthIndex * 0.43 + sideIndex) * 0.38;
            beacon
              .setParameter(
                'transform',
                makeTransform({
                  position: [horizontalPosition, towerHeight + 1.7 + lift, depthPosition]
                })
              )
              .commitParameters();
          });
        }
      }
    }
    if (depthIndex % 2 === 0) {
      addInstance(device, contents, archGroup, {
        position: [0, 5.4, depthPosition],
        scale: [5.45, 5.45, 5.45],
        rotationX: Math.PI / 2
      });
    }
  }

  addFloor(device, contents, 90, [0.025, 0.034, 0.07]);
  addStarfield(device, contents, 190, 50);
  const warmLight = device.newLight('point', {
    position: [0, 5, 0],
    color: [1, 0.35, 0.1],
    intensity: 16
  });
  contents.lights.push(
    device.newLight('directional', {
      direction: [0.25, -1, -0.3],
      color: [0.75, 0.78, 1],
      irradiance: 1.7
    }),
    device.newLight('spot', {
      position: [0, 18, 7],
      direction: [0, -1, -0.12],
      color: [0.46, 0.47, 1],
      intensity: 21,
      openingAngle: 0.7
    }),
    warmLight
  );
  contents.animations.push(time => {
    warmLight
      .setParameter('position', [Math.sin(time * 0.65) * 3, 5.5, Math.cos(time * 0.47) * 11])
      .commitParameters();
  });

  return {
    label: 'Crystal Cathedral',
    title: 'Crystal\nCathedral',
    description:
      'Procedural cylinder, cone, sphere, and triangle geometry share reusable groups, spectral materials, and moving light sources.',
    world: makeWorld(device, contents),
    animations: contents.animations,
    target: [0, 4.6, -1],
    distance: 37,
    elevation: 0.23,
    azimuth: 0.63
  };
}

function makeCelestialEngine(device: ANARIDevice): ShowcaseScene {
  const contents = makeSceneContents();
  const ringGeometry = makeTorusGeometry(device, 1, 0.025, 110, 10);
  const satelliteGeometry = device.newGeometry('sphere', {radius: 0.16, segments: 14});
  const nucleusGeometry = device.newGeometry('sphere', {radius: 2.45, segments: 40});
  const nucleusGroup = makeSurfaceGroup(
    device,
    nucleusGeometry,
    device.newMaterial('physicallyBased', {
      baseColor: [0.11, 0.16, 0.35],
      metallic: 0.91,
      roughness: 0.075,
      clearcoat: 0.9,
      iridescence: 0.58,
      emissive: [0.12, 0.06, 0.27],
      emissiveStrength: 0.32
    })
  );
  const nucleus = addInstance(device, contents, nucleusGroup, {position: [0, 7, 0]});
  contents.animations.push(time => {
    nucleus
      .setParameter('transform', makeTransform({position: [0, 7, 0], rotationY: time * 0.19}))
      .commitParameters();
  });

  for (let orbitIndex = 0; orbitIndex < 8; orbitIndex++) {
    const color = makeSpectrumColor(0.57 + orbitIndex * 0.071, 0.66, 0.94);
    const ringGroup = makeSurfaceGroup(
      device,
      ringGeometry,
      device.newMaterial('physicallyBased', {
        baseColor: color,
        emissive: color,
        emissiveStrength: 1.2 + orbitIndex * 0.14,
        metallic: 0.65,
        roughness: 0.14
      })
    );
    const satelliteGroup = makeSurfaceGroup(
      device,
      satelliteGeometry,
      device.newMaterial('physicallyBased', {
        baseColor: color,
        emissive: color,
        emissiveStrength: 2.8,
        roughness: 0.16
      })
    );
    const orbitRadius = 3.4 + orbitIndex * 0.85;
    const inclination = (orbitIndex - 3.5) * 0.18;
    const ring = addInstance(device, contents, ringGroup, {
      position: [0, 7, 0],
      scale: [orbitRadius, orbitRadius, orbitRadius],
      rotationX: inclination,
      rotationZ: orbitIndex * 0.28
    });
    contents.animations.push(time => {
      ring
        .setParameter(
          'transform',
          makeTransform({
            position: [0, 7, 0],
            scale: [orbitRadius, orbitRadius, orbitRadius],
            rotationX: inclination + Math.sin(time * 0.28 + orbitIndex) * 0.07,
            rotationZ: orbitIndex * 0.28 + time * (orbitIndex % 2 === 0 ? 0.07 : -0.055)
          })
        )
        .commitParameters();
    });

    for (let satelliteIndex = 0; satelliteIndex < 6; satelliteIndex++) {
      const satellite = addInstance(device, contents, satelliteGroup, {position: [0, 7, 0]});
      const illuminatedSatellite = satelliteIndex === 0 && orbitIndex < 4;
      const satelliteLight = illuminatedSatellite
        ? device.newLight('point', {
            position: [orbitRadius, 7, 0],
            color,
            intensity: 34 + (3 - orbitIndex) * 7
          })
        : null;
      if (satelliteLight) {
        contents.lights.push(satelliteLight);
      }
      contents.animations.push(time => {
        const orbitAngle =
          time * (0.24 + orbitIndex * 0.028) * (orbitIndex % 2 === 0 ? 1 : -1) +
          (satelliteIndex / 6) * TAU;
        const horizontal = Math.cos(orbitAngle) * orbitRadius;
        const depth = Math.sin(orbitAngle) * orbitRadius;
        const vertical = Math.sin(orbitAngle) * Math.sin(inclination) * orbitRadius;
        const position: ANARIVector3 = [horizontal, 7 + vertical, depth];
        const satelliteScale = illuminatedSatellite ? 2.25 : 1.1;
        satellite
          .setParameter(
            'transform',
            makeTransform({
              position,
              scale: [satelliteScale, satelliteScale, satelliteScale]
            })
          )
          .commitParameters();
        satelliteLight?.setParameter('position', position).commitParameters();
      });
    }
  }

  addFloor(device, contents, 80, [0.025, 0.035, 0.06]);
  addStarfield(device, contents, 260, 45);
  contents.lights.push(
    device.newLight('directional', {
      direction: [-0.4, -0.9, -0.3],
      color: [0.79, 0.83, 1],
      irradiance: 1.05
    })
  );

  return {
    label: 'Celestial Engine',
    title: 'Celestial\nEngine',
    description:
      'Four visible orbiting stars are actual animated lights, producing moving metallic highlights and HDR bloom on supported displays.',
    world: makeWorld(device, contents),
    animations: contents.animations,
    target: [0, 7, 0],
    distance: 28,
    elevation: 0.32,
    azimuth: 0.44
  };
}

function makeSceneContents(): SceneContents {
  return {instances: [], lights: [], animations: []};
}

function makeWorld(device: ANARIDevice, contents: SceneContents): ANARIWorld {
  return device.newWorld({instance: contents.instances, light: contents.lights});
}

function makeSurfaceGroup(
  device: ANARIDevice,
  geometry: ANARIGeometry,
  material: ANARIMaterial
): ReturnType<ANARIDevice['newGroup']> {
  const surface: ANARISurface = device.newSurface({geometry, material});
  return device.newGroup({surface: [surface]});
}

function addInstance(
  device: ANARIDevice,
  contents: SceneContents,
  group: ReturnType<ANARIDevice['newGroup']>,
  transform: InstanceTransform
): ANARIInstance {
  const instance = device.newInstance({group, transform: makeTransform(transform)});
  contents.instances.push(instance);
  return instance;
}

function addFloor(
  device: ANARIDevice,
  contents: SceneContents,
  size: number,
  color: ANARIVector3
): void {
  const floor = device.newGeometry('quad', {width: size, height: size});
  const material = device.newMaterial('physicallyBased', {
    baseColor: color,
    metallic: 0.68,
    roughness: 0.24,
    clearcoat: 0.4
  });
  const group = makeSurfaceGroup(device, floor, material);
  addInstance(device, contents, group, {position: [0, 0, 0]});
}

function addStarfield(
  device: ANARIDevice,
  contents: SceneContents,
  starCount: number,
  radius: number
): void {
  const geometry = device.newGeometry('sphere', {radius: 0.035, segments: 7});
  const material = device.newMaterial('physicallyBased', {
    baseColor: [0.58, 0.66, 1],
    emissive: [0.52, 0.62, 1],
    emissiveStrength: 3.5,
    roughness: 0.2
  });
  const group = makeSurfaceGroup(device, geometry, material);
  for (let starIndex = 0; starIndex < starCount; starIndex++) {
    const azimuth = hash(starIndex * 7 + 1) * TAU;
    const elevation = hash(starIndex * 11 + 3) * 0.82 + 0.08;
    const distance = radius * (0.72 + hash(starIndex * 13 + 5) * 0.32);
    addInstance(device, contents, group, {
      position: [
        Math.cos(azimuth) * Math.cos(elevation) * distance,
        Math.sin(elevation) * distance,
        Math.sin(azimuth) * Math.cos(elevation) * distance
      ],
      scale: [
        0.7 + hash(starIndex * 19) * 2,
        0.7 + hash(starIndex * 19) * 2,
        0.7 + hash(starIndex * 19) * 2
      ]
    });
  }
}

function makeTorusGeometry(
  device: ANARIDevice,
  majorRadius: number,
  minorRadius: number,
  majorSegments: number,
  minorSegments: number
): ANARIGeometry {
  const vertexCount = (majorSegments + 1) * (minorSegments + 1);
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(majorSegments * minorSegments * 6);

  for (let majorIndex = 0; majorIndex <= majorSegments; majorIndex++) {
    const majorAngle = (majorIndex / majorSegments) * TAU;
    const majorCosine = Math.cos(majorAngle);
    const majorSine = Math.sin(majorAngle);
    for (let minorIndex = 0; minorIndex <= minorSegments; minorIndex++) {
      const minorAngle = (minorIndex / minorSegments) * TAU;
      const minorCosine = Math.cos(minorAngle);
      const minorSine = Math.sin(minorAngle);
      const vertexIndex = (majorIndex * (minorSegments + 1) + minorIndex) * 3;
      const ringRadius = majorRadius + minorRadius * minorCosine;
      positions[vertexIndex] = ringRadius * majorCosine;
      positions[vertexIndex + 1] = minorRadius * minorSine;
      positions[vertexIndex + 2] = ringRadius * majorSine;
      normals[vertexIndex] = minorCosine * majorCosine;
      normals[vertexIndex + 1] = minorSine;
      normals[vertexIndex + 2] = minorCosine * majorSine;
    }
  }

  let indexOffset = 0;
  for (let majorIndex = 0; majorIndex < majorSegments; majorIndex++) {
    for (let minorIndex = 0; minorIndex < minorSegments; minorIndex++) {
      const currentVertex = majorIndex * (minorSegments + 1) + minorIndex;
      const nextVertex = (majorIndex + 1) * (minorSegments + 1) + minorIndex;
      indices[indexOffset++] = currentVertex;
      indices[indexOffset++] = nextVertex;
      indices[indexOffset++] = currentVertex + 1;
      indices[indexOffset++] = currentVertex + 1;
      indices[indexOffset++] = nextVertex;
      indices[indexOffset++] = nextVertex + 1;
    }
  }

  return device.newGeometry('triangle', {
    'vertex.position': positions,
    'vertex.normal': normals,
    'primitive.index': indices
  });
}

function makeTransform(transform: InstanceTransform): Matrix4 {
  const matrix = new Matrix4().translate(transform.position);
  if (transform.rotationX) {
    matrix.rotateX(transform.rotationX);
  }
  if (transform.rotationY) {
    matrix.rotateY(transform.rotationY);
  }
  if (transform.rotationZ) {
    matrix.rotateZ(transform.rotationZ);
  }
  if (transform.scale) {
    matrix.scale(transform.scale);
  }
  return matrix;
}

function makeSpectrumColor(hue: number, saturation: number, value: number): ANARIVector3 {
  const wrappedHue = ((hue % 1) + 1) % 1;
  const channel = (offset: number): number => {
    const phase = (wrappedHue * 6 + offset) % 6;
    return value * (1 - saturation * Math.max(0, Math.min(phase, 4 - phase, 1)));
  };
  return [channel(5), channel(3), channel(1)];
}

function hash(value: number): number {
  const result = Math.sin(value * 91.7341 + 19.19) * 43758.5453;
  return result - Math.floor(result);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function setElementText(identifier: string, value: string): void {
  const element = document.getElementById(identifier);
  if (element) {
    element.textContent = value;
  }
}
