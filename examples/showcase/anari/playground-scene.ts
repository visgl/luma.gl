import {
  type ANARICameraParameters,
  type ANARICameraSubtype,
  type ANARIDevice,
  type ANARIFrame,
  type ANARIGeometry,
  type ANARIGeometryParameters,
  type ANARIGeometrySubtype,
  type ANARIGroup,
  type ANARIInstance,
  type ANARILight,
  type ANARILightParameters,
  type ANARILightSubtype,
  type ANARIMaterial,
  type ANARIMaterialParameters,
  type ANARIMaterialSubtype,
  type ANARIMatrix4,
  type ANARIRendererParameters,
  type ANARIRendererSubtype,
  type ANARISurface,
  type ANARIVector3
} from '@luma.gl/anari';
import {Matrix4} from '@math.gl/core';

type JSONTypedObject<Subtype extends string> = {'@@type': Subtype};

type JSONGeometryParameters = Omit<
  ANARIGeometryParameters,
  'vertex.position' | 'vertex.normal' | 'vertex.attribute0' | 'primitive.index'
> & {
  'vertex.position'?: readonly number[];
  'vertex.normal'?: readonly number[];
  'vertex.attribute0'?: readonly number[];
  'primitive.index'?: readonly number[];
};

export type JSONGeometryGenerator =
  | {
      '@@type': 'torus';
      majorRadius?: number;
      minorRadius?: number;
      majorSegments?: number;
      minorSegments?: number;
    }
  | {'@@type': 'crystal'; radius?: number; height?: number; sides?: number};

export type JSONGeometryDeclaration = JSONTypedObject<ANARIGeometrySubtype> &
  JSONGeometryParameters & {generator?: JSONGeometryGenerator};
export type JSONMaterialDeclaration = JSONTypedObject<ANARIMaterialSubtype> &
  ANARIMaterialParameters;

export type JSONSurfaceDeclaration = {
  geometry: string;
  material: string;
};

export type JSONGroupDeclaration = {
  surfaces: readonly string[];
  lights?: readonly string[];
};

export type JSONAnimationDeclaration =
  | {
      '@@type': 'orbit';
      center?: ANARIVector3;
      radius?: number;
      speed?: number;
      phase?: number;
      height?: number;
      inclination?: number;
      verticalFrequency?: number;
    }
  | {'@@type': 'bob'; amplitude?: number; speed?: number; phase?: number}
  | {'@@type': 'spin'; axis?: 'x' | 'y' | 'z'; speed?: number; phase?: number}
  | {'@@type': 'wobble'; axis?: 'x' | 'y' | 'z'; amplitude?: number; speed?: number; phase?: number}
  | {'@@type': 'pulse'; amplitude?: number; speed?: number; phase?: number}
  | {'@@type': 'follow'; target: string; offset?: ANARIVector3};

export type JSONInstanceDeclaration = {
  '@@id': string;
  group?: string;
  surface?: string;
  position?: ANARIVector3;
  rotation?: ANARIVector3;
  scale?: ANARIVector3;
  matrix?: ANARIMatrix4;
  animation?: JSONAnimationDeclaration;
  animations?: readonly JSONAnimationDeclaration[];
};

export type JSONLightDeclaration = JSONTypedObject<ANARILightSubtype> &
  ANARILightParameters & {
    '@@id': string;
    animation?: JSONAnimationDeclaration;
  };

export type JSONCameraDeclaration = JSONTypedObject<ANARICameraSubtype> &
  ANARICameraParameters & {
    target?: ANARIVector3;
    orbit?: {speed?: number};
  };

export type JSONRendererDeclaration = JSONTypedObject<ANARIRendererSubtype> &
  ANARIRendererParameters;

export type JSONStarfieldDeclaration = {
  '@@id': string;
  '@@type': 'starfield';
  surface: string;
  count: number;
  radius: number;
  seed?: number;
};

export type ANARIJSONScene = {
  version: 1;
  name: string;
  description?: string;
  camera: JSONCameraDeclaration;
  renderer: JSONRendererDeclaration;
  geometries: Record<string, JSONGeometryDeclaration>;
  materials: Record<string, JSONMaterialDeclaration>;
  surfaces: Record<string, JSONSurfaceDeclaration>;
  groups?: Record<string, JSONGroupDeclaration>;
  instances?: readonly JSONInstanceDeclaration[];
  distributions?: readonly JSONStarfieldDeclaration[];
  lights?: readonly JSONLightDeclaration[];
  world?: {surfaces?: readonly string[]; instances?: readonly string[]; lights?: readonly string[]};
};

export type ANARIJSONSceneHandle = {
  frame: ANARIFrame;
  name: string;
  description: string;
  cameraTarget: ANARIVector3;
  cameraPosition: ANARIVector3;
  cameraOrbitSpeed: number;
  update: (time: number) => void;
  destroy: () => void;
};

type SceneAnimation = (time: number) => void;

const GEOMETRY_SUBTYPES: readonly ANARIGeometrySubtype[] = [
  'triangle',
  'sphere',
  'cylinder',
  'cone',
  'quad'
];
const MATERIAL_SUBTYPES: readonly ANARIMaterialSubtype[] = ['matte', 'physicallyBased'];
const LIGHT_SUBTYPES: readonly ANARILightSubtype[] = ['ambient', 'directional', 'point', 'spot'];
const CAMERA_SUBTYPES: readonly ANARICameraSubtype[] = ['perspective', 'orthographic'];
const RENDERER_SUBTYPES: readonly ANARIRendererSubtype[] = [
  'default',
  'debugNormals',
  'debugDepth'
];

export function createANARIJSONScene(
  device: ANARIDevice,
  scene: ANARIJSONScene
): ANARIJSONSceneHandle {
  if (scene.version !== 1) {
    throw new Error('Scene "version" must be 1.');
  }

  const geometries = new Map<string, ANARIGeometry>();
  const materials = new Map<string, ANARIMaterial>();
  const surfaces = new Map<string, ANARISurface>();
  const lights = new Map<string, ANARILight>();
  const groups = new Map<string, ANARIGroup>();
  const instances = new Map<string, ANARIInstance>();
  const surfaceGroups = new Map<string, ANARIGroup>();
  const instanceAnimations: SceneAnimation[] = [];
  const lightAnimations: SceneAnimation[] = [];
  const pendingLightAnimations: {
    light: ANARILight;
    parameters: ANARILightParameters;
    animation: JSONAnimationDeclaration;
  }[] = [];

  for (const [identifier, declaration] of Object.entries(scene.geometries)) {
    const {
      '@@type': subtype,
      'vertex.position': positions,
      'vertex.normal': normals,
      'vertex.attribute0': attributes,
      'primitive.index': indices,
      generator,
      ...parameters
    } = declaration;
    assertSubtype('geometry', subtype, GEOMETRY_SUBTYPES);
    const geometryParameters: ANARIGeometryParameters = {...parameters};
    if (positions) {
      geometryParameters['vertex.position'] = new Float32Array(positions);
    }
    if (normals) {
      geometryParameters['vertex.normal'] = new Float32Array(normals);
    }
    if (attributes) {
      geometryParameters['vertex.attribute0'] = new Float32Array(attributes);
    }
    if (indices) {
      geometryParameters['primitive.index'] = new Uint32Array(indices);
    }
    if (generator) {
      if (subtype !== 'triangle') {
        throw new Error(`Geometry "${identifier}" generators require the "triangle" subtype.`);
      }
      Object.assign(geometryParameters, createGeneratedGeometry(generator));
    }
    geometries.set(identifier, device.newGeometry(subtype, geometryParameters));
  }

  for (const [identifier, declaration] of Object.entries(scene.materials)) {
    const {'@@type': subtype, ...parameters} = declaration;
    assertSubtype('material', subtype, MATERIAL_SUBTYPES);
    materials.set(identifier, device.newMaterial(subtype, parameters));
  }

  for (const [identifier, declaration] of Object.entries(scene.surfaces)) {
    const geometry = resolveReference(geometries, declaration.geometry, 'geometry');
    const material = resolveReference(materials, declaration.material, 'material');
    surfaces.set(identifier, device.newSurface({geometry, material}));
  }

  for (const declaration of scene.lights || []) {
    const {'@@id': identifier, '@@type': subtype, animation, ...parameters} = declaration;
    assertSubtype('light', subtype, LIGHT_SUBTYPES);
    assertUniqueIdentifier(lights, identifier, 'light');
    const light = device.newLight(subtype, parameters);
    lights.set(identifier, light);
    if (animation) {
      pendingLightAnimations.push({light, parameters, animation});
    }
  }

  for (const [identifier, declaration] of Object.entries(scene.groups || {})) {
    groups.set(
      identifier,
      device.newGroup({
        surface: declaration.surfaces.map(surface =>
          resolveReference(surfaces, surface, 'surface')
        ),
        light: declaration.lights?.map(light => resolveReference(lights, light, 'light'))
      })
    );
  }

  const addInstance = (declaration: JSONInstanceDeclaration): void => {
    const identifier = declaration['@@id'];
    assertUniqueIdentifier(instances, identifier, 'instance');
    let group: ANARIGroup;
    if (declaration.group) {
      group = resolveReference(groups, declaration.group, 'group');
    } else if (declaration.surface) {
      const cachedGroup = surfaceGroups.get(declaration.surface);
      group =
        cachedGroup ||
        device.newGroup({surface: [resolveReference(surfaces, declaration.surface, 'surface')]});
      if (!cachedGroup) {
        surfaceGroups.set(declaration.surface, group);
      }
    } else {
      throw new Error(`Instance "${identifier}" must declare a "group" or "surface".`);
    }

    const instance = device.newInstance({group, transform: createInstanceTransform(declaration)});
    instances.set(identifier, instance);
    const animations =
      declaration.animations || (declaration.animation ? [declaration.animation] : []);
    if (animations.length > 0) {
      instanceAnimations.push(createInstanceAnimation(instance, declaration, animations));
    }
  };

  for (const declaration of scene.instances || []) {
    addInstance(declaration);
  }

  for (const distribution of scene.distributions || []) {
    if (distribution['@@type'] !== 'starfield') {
      throw new Error(`Unsupported distribution "${distribution['@@type']}".`);
    }
    for (const declaration of createStarfieldInstances(distribution)) {
      addInstance(declaration);
    }
  }

  for (const {light, parameters, animation} of pendingLightAnimations) {
    lightAnimations.push(createLightAnimation(light, parameters, animation, instances));
  }

  const world = device.newWorld({
    surface: (scene.world?.surfaces || []).map(identifier =>
      resolveReference(surfaces, identifier, 'surface')
    ),
    instance: scene.world?.instances
      ? scene.world.instances.map(identifier => resolveReference(instances, identifier, 'instance'))
      : Array.from(instances.values()),
    light: scene.world?.lights
      ? scene.world.lights.map(identifier => resolveReference(lights, identifier, 'light'))
      : Array.from(lights.values())
  });

  const {'@@type': cameraSubtype, target = [0, 0, 0], orbit, ...cameraParameters} = scene.camera;
  assertSubtype('camera', cameraSubtype, CAMERA_SUBTYPES);
  const position = cameraParameters.position || [0, 4, 12];
  const camera = device.newCamera(cameraSubtype, {
    ...cameraParameters,
    position,
    direction: cameraParameters.direction || subtractVectors(target, position)
  });

  const {'@@type': rendererSubtype, ...rendererParameters} = scene.renderer;
  assertSubtype('renderer', rendererSubtype, RENDERER_SUBTYPES);
  const renderer = device.newRenderer(rendererSubtype, rendererParameters);
  const frame = device.newFrame({world, camera, renderer});

  return {
    frame,
    name: scene.name,
    description: scene.description || '',
    cameraTarget: target,
    cameraPosition: position,
    cameraOrbitSpeed: orbit?.speed || 0,
    update(time: number): void {
      for (const animation of instanceAnimations) {
        animation(time);
      }
      for (const animation of lightAnimations) {
        animation(time);
      }
    },
    destroy(): void {
      frame.destroy();
    }
  };
}

function createInstanceAnimation(
  instance: ANARIInstance,
  declaration: JSONInstanceDeclaration,
  animations: readonly JSONAnimationDeclaration[]
): SceneAnimation {
  const initialPosition = declaration.position || [0, 0, 0];
  const initialRotation = declaration.rotation || [0, 0, 0];

  for (const animation of animations) {
    if (
      animation['@@type'] !== 'orbit' &&
      animation['@@type'] !== 'bob' &&
      animation['@@type'] !== 'spin' &&
      animation['@@type'] !== 'wobble'
    ) {
      throw new Error(
        `Instance "${declaration['@@id']}" does not support "${animation['@@type']}" animation.`
      );
    }
  }

  return time => {
    let position: ANARIVector3 = initialPosition;
    const rotation: [number, number, number] = [...initialRotation];

    for (const animation of animations) {
      if (animation['@@type'] === 'orbit') {
        position = getOrbitPosition(animation, initialPosition, time);
      } else if (animation['@@type'] === 'bob') {
        position = [
          position[0],
          position[1] +
            Math.sin(time * (animation.speed ?? 1) + (animation.phase || 0)) *
              (animation.amplitude ?? 0.4),
          position[2]
        ];
      } else if (animation['@@type'] === 'spin') {
        const axis = animation.axis === 'x' ? 0 : animation.axis === 'z' ? 2 : 1;
        rotation[axis] += time * (animation.speed ?? 1) + (animation.phase || 0);
      } else if (animation['@@type'] === 'wobble') {
        const axis = animation.axis === 'x' ? 0 : animation.axis === 'z' ? 2 : 1;
        rotation[axis] +=
          Math.sin(time * (animation.speed ?? 1) + (animation.phase || 0)) *
          (animation.amplitude ?? 0.08);
      }
    }

    instance
      .setParameter('transform', createInstanceTransform({...declaration, position, rotation}))
      .commitParameters();
  };
}

function createLightAnimation(
  light: ANARILight,
  parameters: ANARILightParameters,
  animation: JSONAnimationDeclaration,
  instances: Map<string, ANARIInstance>
): SceneAnimation {
  if (animation['@@type'] === 'orbit') {
    const initialPosition = parameters.position || [3, 2, 0];
    return time => {
      light
        .setParameter('position', getOrbitPosition(animation, initialPosition, time))
        .commitParameters();
    };
  }

  if (animation['@@type'] === 'pulse') {
    const initialIntensity = parameters.intensity ?? 1;
    const amplitude = animation.amplitude ?? 0.5;
    const speed = animation.speed ?? 1;
    const phase = animation.phase || 0;
    return time => {
      light
        .setParameter(
          'intensity',
          initialIntensity * (1 + Math.sin(time * speed + phase) * amplitude)
        )
        .commitParameters();
    };
  }

  if (animation['@@type'] === 'follow') {
    const instance = resolveReference(instances, animation.target, 'instance');
    const offset = animation.offset || [0, 0, 0];
    return () => {
      const transform = instance.getParameter('transform');
      if (transform) {
        light
          .setParameter('position', [
            transform[12] + offset[0],
            transform[13] + offset[1],
            transform[14] + offset[2]
          ])
          .commitParameters();
      }
    };
  }

  throw new Error(`Lights do not support "${animation['@@type']}" animation.`);
}

function getOrbitPosition(
  animation: Extract<JSONAnimationDeclaration, {'@@type': 'orbit'}>,
  initialPosition: ANARIVector3,
  time: number
): ANARIVector3 {
  const center = animation.center || [0, initialPosition[1], 0];
  const radius =
    animation.radius ||
    Math.hypot(initialPosition[0] - center[0], initialPosition[2] - center[2]) ||
    3;
  const angle = time * (animation.speed ?? 1) + (animation.phase || 0);
  const inclinationHeight = Math.sin(angle) * Math.sin(animation.inclination || 0) * radius;
  const oscillationHeight =
    (animation.height || 0) * Math.sin(angle * (animation.verticalFrequency ?? 2));
  return [
    center[0] + Math.cos(angle) * radius,
    center[1] + inclinationHeight + oscillationHeight,
    center[2] + Math.sin(angle) * radius
  ];
}

function createStarfieldInstances(
  distribution: JSONStarfieldDeclaration
): JSONInstanceDeclaration[] {
  const instances: JSONInstanceDeclaration[] = [];
  const seed = distribution.seed || 0;
  for (let starIndex = 0; starIndex < distribution.count; starIndex++) {
    const azimuth = hash(starIndex * 7 + 1 + seed) * Math.PI * 2;
    const elevation = hash(starIndex * 11 + 3 + seed) * 0.82 + 0.08;
    const distance = distribution.radius * (0.72 + hash(starIndex * 13 + 5 + seed) * 0.32);
    const scale = 0.7 + hash(starIndex * 19 + seed) * 2;
    instances.push({
      '@@id': `${distribution['@@id']}-${starIndex}`,
      surface: distribution.surface,
      position: [
        Math.cos(azimuth) * Math.cos(elevation) * distance,
        Math.sin(elevation) * distance,
        Math.sin(azimuth) * Math.cos(elevation) * distance
      ],
      scale: [scale, scale, scale]
    });
  }
  return instances;
}

function createGeneratedGeometry(generator: JSONGeometryGenerator): ANARIGeometryParameters {
  if (generator['@@type'] === 'torus') {
    return createTorusGeometry(generator);
  }
  return createCrystalGeometry(generator);
}

function createTorusGeometry(
  generator: Extract<JSONGeometryGenerator, {'@@type': 'torus'}>
): ANARIGeometryParameters {
  const majorRadius = generator.majorRadius ?? 1;
  const minorRadius = generator.minorRadius ?? 0.035;
  const majorSegments = generator.majorSegments ?? 64;
  const minorSegments = generator.minorSegments ?? 8;
  const vertexCount = (majorSegments + 1) * (minorSegments + 1);
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(majorSegments * minorSegments * 6);

  for (let majorIndex = 0; majorIndex <= majorSegments; majorIndex++) {
    const majorAngle = (majorIndex / majorSegments) * Math.PI * 2;
    const majorCosine = Math.cos(majorAngle);
    const majorSine = Math.sin(majorAngle);
    for (let minorIndex = 0; minorIndex <= minorSegments; minorIndex++) {
      const minorAngle = (minorIndex / minorSegments) * Math.PI * 2;
      const minorCosine = Math.cos(minorAngle);
      const minorSine = Math.sin(minorAngle);
      const vertexIndex = (majorIndex * (minorSegments + 1) + minorIndex) * 3;
      const radius = majorRadius + minorRadius * minorCosine;
      positions[vertexIndex] = radius * majorCosine;
      positions[vertexIndex + 1] = minorRadius * minorSine;
      positions[vertexIndex + 2] = radius * majorSine;
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

  return {'vertex.position': positions, 'vertex.normal': normals, 'primitive.index': indices};
}

function createCrystalGeometry(
  generator: Extract<JSONGeometryGenerator, {'@@type': 'crystal'}>
): ANARIGeometryParameters {
  const radius = generator.radius ?? 0.5;
  const height = generator.height ?? 1.8;
  const sides = generator.sides ?? 6;
  const positions: number[] = [];
  const normals: number[] = [];

  for (let sideIndex = 0; sideIndex < sides; sideIndex++) {
    const startAngle = (sideIndex / sides) * Math.PI * 2;
    const endAngle = ((sideIndex + 1) / sides) * Math.PI * 2;
    const start: ANARIVector3 = [Math.cos(startAngle) * radius, 0, Math.sin(startAngle) * radius];
    const end: ANARIVector3 = [Math.cos(endAngle) * radius, 0, Math.sin(endAngle) * radius];
    appendTriangle(positions, normals, [0, height * 0.66, 0], end, start);
    appendTriangle(positions, normals, [0, -height * 0.34, 0], start, end);
  }

  return {
    'vertex.position': new Float32Array(positions),
    'vertex.normal': new Float32Array(normals)
  };
}

function appendTriangle(
  positions: number[],
  normals: number[],
  first: ANARIVector3,
  second: ANARIVector3,
  third: ANARIVector3
): void {
  const firstEdge = subtractVectors(second, first);
  const secondEdge = subtractVectors(third, first);
  const normal: ANARIVector3 = [
    firstEdge[1] * secondEdge[2] - firstEdge[2] * secondEdge[1],
    firstEdge[2] * secondEdge[0] - firstEdge[0] * secondEdge[2],
    firstEdge[0] * secondEdge[1] - firstEdge[1] * secondEdge[0]
  ];
  const normalLength = Math.hypot(...normal) || 1;
  const normalized: ANARIVector3 = [
    normal[0] / normalLength,
    normal[1] / normalLength,
    normal[2] / normalLength
  ];
  positions.push(...first, ...second, ...third);
  normals.push(...normalized, ...normalized, ...normalized);
}

function hash(value: number): number {
  const result = Math.sin(value * 91.7341 + 19.19) * 43758.5453;
  return result - Math.floor(result);
}

function createInstanceTransform(declaration: JSONInstanceDeclaration): ANARIMatrix4 {
  if (declaration.matrix) {
    return declaration.matrix;
  }
  const transform = new Matrix4().translate(declaration.position || [0, 0, 0]);
  if (declaration.rotation) {
    transform.rotateX(declaration.rotation[0]);
    transform.rotateY(declaration.rotation[1]);
    transform.rotateZ(declaration.rotation[2]);
  }
  if (declaration.scale) {
    transform.scale(declaration.scale);
  }
  return transform;
}

function subtractVectors(first: ANARIVector3, second: ANARIVector3): ANARIVector3 {
  return [first[0] - second[0], first[1] - second[1], first[2] - second[2]];
}

function resolveReference<Value>(
  registry: Map<string, Value>,
  identifier: string,
  objectType: string
): Value {
  const object = registry.get(identifier);
  if (!object) {
    throw new Error(`Unknown ${objectType} reference "${identifier}".`);
  }
  return object;
}

function assertUniqueIdentifier<Value>(
  registry: Map<string, Value>,
  identifier: string,
  objectType: string
): void {
  if (!identifier) {
    throw new Error(`Every ${objectType} requires an "@@id".`);
  }
  if (registry.has(identifier)) {
    throw new Error(`Duplicate ${objectType} identifier "${identifier}".`);
  }
}

function assertSubtype<Subtype extends string>(
  objectType: string,
  subtype: string,
  supportedSubtypes: readonly Subtype[]
): asserts subtype is Subtype {
  if (!supportedSubtypes.some(supportedSubtype => supportedSubtype === subtype)) {
    throw new Error(
      `Unsupported ${objectType} subtype "${subtype}". Expected ${supportedSubtypes.join(', ')}.`
    );
  }
}
