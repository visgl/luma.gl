import {Matrix4} from '@math.gl/core';
import type {ANARIVector3} from '@luma.gl/anari';
import type {
  ANARIJSONScene,
  JSONGeometryDeclaration,
  JSONInstanceDeclaration,
  JSONLightDeclaration,
  JSONMaterialDeclaration
} from './playground-scene';
import type {USDPrim, USDScenePath, USDStage, USDValue} from './usd-loader/usd-types';

export type ImportedSceneBounds = {
  minimum: [number, number, number];
  maximum: [number, number, number];
};

type USDTranslationState = {
  scene: ANARIJSONScene;
  materials: Map<string, USDPrim>;
  materialIdentifiers: Map<string, string>;
  surfaceIdentifiers: Map<string, string>;
  textureIdentifiers: Map<string, string>;
  bounds: ImportedSceneBounds;
  nextIdentifier: number;
};

type USDFaceGroup = {
  name: string;
  faceIndices: number[];
  materialPath: string | undefined;
};

export function makeANARIJSONSceneFromUSD(stage: USDStage, name?: string): ANARIJSONScene {
  const scene: ANARIJSONScene = {
    version: 1,
    name: name || getStageName(stage),
    description: `Imported OpenUSD · ${stage.layers.length} composed ${stage.layers.length === 1 ? 'layer' : 'layers'}`,
    camera: {
      '@@type': 'perspective',
      position: [12, 8, 15],
      target: [0, 1, 0],
      fovy: Math.PI / 3.6,
      near: 0.03,
      far: 2000,
      orbit: {speed: 0.075}
    },
    renderer: {
      '@@type': 'default',
      background: [0.012, 0.017, 0.036, 1],
      ambientRadiance: 0.105,
      exposure: 1.55,
      bloomIntensity: 0.7,
      bloomThreshold: 0.76,
      bloomRadius: 7,
      fogColor: [0.024, 0.035, 0.072],
      fogDensity: 0.00004
    },
    geometries: {},
    textures: {},
    materials: {},
    surfaces: {},
    instances: [],
    lights: []
  };

  const state: USDTranslationState = {
    scene,
    materials: new Map(),
    materialIdentifiers: new Map(),
    surfaceIdentifiers: new Map(),
    textureIdentifiers: new Map(),
    bounds: {
      minimum: [Infinity, Infinity, Infinity],
      maximum: [-Infinity, -Infinity, -Infinity]
    },
    nextIdentifier: 0
  };

  for (const prim of stage.rootPrims) {
    indexMaterials(prim, state.materials);
  }

  const rootTransform = new Matrix4();
  if (stage.metadata['upAxis'] === 'Z') {
    rootTransform.rotateX(-Math.PI / 2);
  }
  for (const prim of stage.rootPrims) {
    translatePrim(prim, rootTransform, state);
  }

  configurePresentation(state);
  return scene;
}

export function addImportedScenePresentation(
  scene: ANARIJSONScene,
  bounds: ImportedSceneBounds
): void {
  configurePresentation({
    scene,
    materials: new Map(),
    materialIdentifiers: new Map(),
    surfaceIdentifiers: new Map(),
    textureIdentifiers: new Map(),
    bounds,
    nextIdentifier: Object.keys(scene.geometries).length
  });
}

function translatePrim(prim: USDPrim, parentTransform: Matrix4, state: USDTranslationState): void {
  if (getAttributeValue(prim, 'visibility') === 'invisible') {
    return;
  }

  const transform = new Matrix4(parentTransform).multiplyRight(createPrimTransform(prim));
  if (prim.type === 'Mesh') {
    translateMesh(prim, transform, state);
  } else if (
    prim.type === 'Sphere' ||
    prim.type === 'Cylinder' ||
    prim.type === 'Cone' ||
    prim.type === 'Cube' ||
    prim.type === 'Capsule'
  ) {
    translatePrimitive(prim, transform, state);
  } else if (
    prim.type === 'DistantLight' ||
    prim.type === 'SphereLight' ||
    prim.type === 'DiskLight'
  ) {
    translateLight(prim, transform, state);
  } else if (prim.type === 'PointInstancer') {
    translatePointInstancer(prim, transform, state);
    return;
  }

  if (prim.type !== 'Material' && prim.type !== 'Shader' && prim.type !== 'GeomSubset') {
    for (const child of prim.children) {
      translatePrim(child, transform, state);
    }
  }
}

function translateMesh(prim: USDPrim, transform: Matrix4, state: USDTranslationState): void {
  const points = getVectorArray(getAttributeValue(prim, 'points'));
  const faceVertexCounts = getNumberArray(getAttributeValue(prim, 'faceVertexCounts'));
  const faceVertexIndices = getNumberArray(getAttributeValue(prim, 'faceVertexIndices'));
  if (points.length === 0 || faceVertexCounts.length === 0 || faceVertexIndices.length === 0) {
    return;
  }

  const faceOffsets: number[] = [];
  let faceOffset = 0;
  for (const faceVertexCount of faceVertexCounts) {
    faceOffsets.push(faceOffset);
    faceOffset += faceVertexCount;
  }

  const normalAttribute = prim.attributes['normals'] || prim.attributes['primvars:normals'];
  const normals = getVectorArray(normalAttribute?.value);
  const textureCoordinateAttribute =
    prim.attributes['primvars:st'] ||
    prim.attributes['primvars:map1'] ||
    prim.attributes['primvars:st0'] ||
    prim.attributes['primvars:uv'];
  const textureCoordinates = getVectorArray(textureCoordinateAttribute?.value);
  const textureCoordinateIndices = textureCoordinateAttribute
    ? getNumberArray(getAttributeValue(prim, `${textureCoordinateAttribute.name}:indices`))
    : [];
  const meshBinding = getBoundMaterialPath(prim);
  const subsets = prim.children.filter(child => child.type === 'GeomSubset');
  const coveredFaces = new Set<number>();
  const faceGroups: USDFaceGroup[] = subsets.map(subset => {
    const faceIndices = getNumberArray(getAttributeValue(subset, 'indices'));
    for (const faceIndex of faceIndices) {
      coveredFaces.add(faceIndex);
    }
    return {
      name: subset.name,
      faceIndices,
      materialPath: getBoundMaterialPath(subset) || meshBinding
    };
  });

  const remainingFaces = faceVertexCounts
    .map((_count, faceIndex) => faceIndex)
    .filter(faceIndex => !coveredFaces.has(faceIndex));
  if (remainingFaces.length > 0 || faceGroups.length === 0) {
    faceGroups.push({name: prim.name, faceIndices: remainingFaces, materialPath: meshBinding});
  }

  for (const faceGroup of faceGroups) {
    if (faceGroup.faceIndices.length === 0) {
      continue;
    }

    const materialIdentifier = getMaterialIdentifier(faceGroup.materialPath, faceGroup.name, state);
    const cacheKey = `${prim.sourceUrl || prim.path}:${prim.name}:${faceGroup.name}:${materialIdentifier}`;
    let surfaceIdentifier = state.surfaceIdentifiers.get(cacheKey);
    if (!surfaceIdentifier) {
      const positions: number[] = [];
      const vertexNormals: number[] = [];
      const vertexTextureCoordinates: number[] = [];
      for (const faceIndex of faceGroup.faceIndices) {
        const count = faceVertexCounts[faceIndex];
        const offset = faceOffsets[faceIndex];
        for (let cornerIndex = 1; cornerIndex < count - 1; cornerIndex++) {
          for (const faceCorner of [0, cornerIndex, cornerIndex + 1]) {
            const vertexIndex = faceVertexIndices[offset + faceCorner];
            const point = points[vertexIndex];
            if (!point) {
              continue;
            }
            positions.push(point[0], point[1], point[2]);
            const normal =
              normals.length === faceVertexIndices.length
                ? normals[offset + faceCorner]
                : normals.length === points.length
                  ? normals[vertexIndex]
                  : undefined;
            if (normal) {
              vertexNormals.push(normal[0], normal[1], normal[2]);
            }
            const textureCoordinateIndex =
              textureCoordinateIndices[offset + faceCorner] ??
              (textureCoordinates.length === faceVertexIndices.length
                ? offset + faceCorner
                : vertexIndex);
            const textureCoordinate = textureCoordinates[textureCoordinateIndex];
            if (textureCoordinate && textureCoordinate.length >= 2) {
              vertexTextureCoordinates.push(textureCoordinate[0], textureCoordinate[1]);
            }
          }
        }
      }

      if (positions.length === 0) {
        continue;
      }

      const identifier = makeIdentifier(prim.name, faceGroup.name, state);
      const geometry: JSONGeometryDeclaration = {
        '@@type': 'triangle',
        'vertex.position': positions
      };
      if (vertexNormals.length === positions.length) {
        geometry['vertex.normal'] = vertexNormals;
      }
      if (vertexTextureCoordinates.length === (positions.length / 3) * 2) {
        geometry['vertex.attribute1'] = vertexTextureCoordinates;
      }
      state.scene.geometries[identifier] = geometry;
      state.scene.surfaces[identifier] = {geometry: identifier, material: materialIdentifier};
      surfaceIdentifier = identifier;
      state.surfaceIdentifiers.set(cacheKey, identifier);
    }

    addInstance(state, surfaceIdentifier, transform, `${prim.name}-${faceGroup.name}`);
    for (const faceIndex of faceGroup.faceIndices) {
      const count = faceVertexCounts[faceIndex];
      const offset = faceOffsets[faceIndex];
      for (let cornerIndex = 0; cornerIndex < count; cornerIndex++) {
        const point = points[faceVertexIndices[offset + cornerIndex]];
        if (point) {
          extendBounds(state.bounds, transform.transformAsPoint(point));
        }
      }
    }
  }
}

function translatePrimitive(prim: USDPrim, transform: Matrix4, state: USDTranslationState): void {
  const radius = getNumber(getAttributeValue(prim, 'radius'), 0.5);
  const height = getNumber(getAttributeValue(prim, 'height'), 1);
  const size = getNumber(getAttributeValue(prim, 'size'), 1);
  const axis = getAttributeValue(prim, 'axis');
  const material = getMaterialIdentifier(getBoundMaterialPath(prim), prim.name, state, prim);
  const cacheKey = `${prim.sourceUrl || ''}:${prim.path}:${prim.type}:${material}:${radius}:${height}:${size}:${axis}`;
  let identifier = state.surfaceIdentifiers.get(cacheKey);
  if (!identifier) {
    identifier = makeIdentifier(prim.name, prim.type, state);
    let geometry: JSONGeometryDeclaration;

    if (prim.type === 'Sphere') {
      geometry = {'@@type': 'sphere', radius, segments: 24};
    } else if (prim.type === 'Cylinder') {
      geometry = {'@@type': 'cylinder', radius, height, segments: 32};
    } else if (prim.type === 'Cone') {
      geometry = {'@@type': 'cone', radius, height, segments: 32};
    } else if (prim.type === 'Capsule') {
      geometry = {'@@type': 'sphere', radius, segments: 24};
    } else {
      geometry = {'@@type': 'triangle', 'vertex.position': makeCubePositions(size)};
    }

    state.scene.geometries[identifier] = geometry;
    state.scene.surfaces[identifier] = {geometry: identifier, material};
    state.surfaceIdentifiers.set(cacheKey, identifier);
  }

  if (prim.type === 'Capsule') {
    transform.scale([1, Math.max(1, height / Math.max(radius * 2, 0.001)), 1]);
  }
  if ((prim.type === 'Cylinder' || prim.type === 'Cone') && axis === 'Z') {
    transform.rotateX(Math.PI / 2);
  }
  if ((prim.type === 'Cylinder' || prim.type === 'Cone') && axis === 'X') {
    transform.rotateZ(Math.PI / 2);
  }

  addInstance(state, identifier, transform, prim.name);
  const extent = prim.type === 'Cube' ? size / 2 : Math.max(radius, height / 2);
  extendBounds(state.bounds, transform.transformAsPoint([-extent, -extent, -extent]));
  extendBounds(state.bounds, transform.transformAsPoint([extent, extent, extent]));
}

function translatePointInstancer(
  prim: USDPrim,
  transform: Matrix4,
  state: USDTranslationState
): void {
  const positions = getVectorArray(getAttributeValue(prim, 'positions'));
  const prototypeIndices = getNumberArray(getAttributeValue(prim, 'protoIndices'));
  const prototypePaths = getScenePaths(getAttributeValue(prim, 'prototypes'));

  for (let instanceIndex = 0; instanceIndex < positions.length; instanceIndex++) {
    const prototypePath = prototypePaths[prototypeIndices[instanceIndex] || 0];
    const prototypeName = prototypePath?.split('/').pop();
    const prototype = prim.children.find(child => child.name === prototypeName);
    if (prototype) {
      const instanceTransform = new Matrix4(transform).translate(positions[instanceIndex]);
      translatePrim(prototype, instanceTransform, state);
    }
  }
}

function translateLight(prim: USDPrim, transform: Matrix4, state: USDTranslationState): void {
  const color: ANARIVector3 = getVector(getAttributeValue(prim, 'inputs:color')) || [1, 1, 1];
  const intensity = getNumber(getAttributeValue(prim, 'inputs:intensity'), 1);
  const identifier = makeIdentifier(prim.name, 'light', state);
  let light: JSONLightDeclaration;

  if (prim.type === 'DistantLight') {
    const direction = transform.transformAsVector([0, 0, -1]);
    light = {
      '@@id': identifier,
      '@@type': 'directional',
      direction: [direction[0], direction[1], direction[2]],
      color,
      irradiance: Math.min(4, Math.max(0.6, intensity * 0.003))
    };
  } else {
    light = {
      '@@id': identifier,
      '@@type': 'point',
      position: [transform[12], transform[13], transform[14]],
      color,
      intensity: Math.min(70, Math.max(8, intensity * 0.02))
    };
  }
  state.scene.lights = [...(state.scene.lights || []), light];
}

function configurePresentation(state: USDTranslationState): void {
  if (!Number.isFinite(state.bounds.minimum[0])) {
    throw new Error('The imported OpenUSD stage contains no supported renderable geometry.');
  }

  normalizeSceneScale(state);

  const minimum = state.bounds.minimum;
  const maximum = state.bounds.maximum;
  const target: ANARIVector3 = [
    (minimum[0] + maximum[0]) / 2,
    minimum[1] + (maximum[1] - minimum[1]) * 0.41,
    (minimum[2] + maximum[2]) / 2
  ];
  const extent = Math.max(
    maximum[0] - minimum[0],
    maximum[1] - minimum[1],
    maximum[2] - minimum[2],
    0.5
  );
  state.scene.camera.target = target;
  state.scene.camera.position = [
    target[0] + extent * 0.76,
    target[1] + extent * 0.43,
    target[2] + extent * 0.96
  ];
  state.scene.camera.near = Math.max(0.01, extent * 0.001);
  state.scene.camera.far = Math.max(200, extent * 18);
  state.scene.renderer ||= {'@@type': 'default'};
  state.scene.renderer.fogDensity = 0.003 / extent;

  const floorIdentifier = makeIdentifier('gallery', 'floor', state);
  state.scene.geometries[floorIdentifier] = {
    '@@type': 'quad',
    width: extent * 8,
    height: extent * 8
  };
  state.scene.materials[floorIdentifier] = {
    '@@type': 'physicallyBased',
    baseColor: [0.033, 0.046, 0.084],
    metallic: 0.48,
    roughness: 0.23,
    clearcoat: 0.78
  };
  state.scene.surfaces[floorIdentifier] = {geometry: floorIdentifier, material: floorIdentifier};
  state.scene.instances = [
    ...(state.scene.instances || []),
    {
      '@@id': `${floorIdentifier}-placement`,
      surface: floorIdentifier,
      position: [target[0], minimum[1] - extent * 0.035, target[2]]
    }
  ];

  const cyanEmitter = addLightEmitter(state, {
    identifier: 'cyan',
    color: [0.12, 0.65, 1],
    center: [target[0], target[1] + extent * 0.28, target[2]],
    radius: extent * 0.76,
    height: extent * 0.14,
    phase: 0.2,
    speed: 0.36,
    size: extent * 0.015
  });
  const amberEmitter = addLightEmitter(state, {
    identifier: 'amber',
    color: [1, 0.43, 0.14],
    center: [target[0], target[1] + extent * 0.43, target[2]],
    radius: extent * 0.68,
    height: extent * 0.1,
    phase: Math.PI * 0.75,
    speed: -0.28,
    size: extent * 0.013
  });

  const hasDirectionalLight = (state.scene.lights || []).some(
    light => light['@@type'] === 'directional'
  );
  state.scene.lights = [
    ...(state.scene.lights || []),
    {
      '@@id': 'gallery-key-light',
      '@@type': 'directional',
      direction: [-0.36, -1, -0.42],
      color: [1, 0.91, 0.8],
      irradiance: hasDirectionalLight ? 1.45 : 2.35
    },
    {
      '@@id': 'gallery-fill-light',
      '@@type': 'point',
      position: [target[0] + extent * 0.76, target[1] + extent * 0.28, target[2]],
      color: [0.12, 0.62, 1],
      intensity: 46,
      animation: {'@@type': 'follow', target: cyanEmitter}
    },
    {
      '@@id': 'gallery-rim-light',
      '@@type': 'point',
      position: [target[0] - extent * 0.58, target[1] + extent * 0.43, target[2]],
      color: [1, 0.41, 0.14],
      intensity: 39,
      animation: {'@@type': 'follow', target: amberEmitter}
    }
  ];

  const geometryCount = Object.keys(state.scene.geometries).length - 1;
  state.scene.description += ` · ${geometryCount} ${geometryCount === 1 ? 'mesh' : 'meshes'}`;
}

function normalizeSceneScale(state: USDTranslationState): void {
  const sourceMinimum = state.bounds.minimum;
  const sourceMaximum = state.bounds.maximum;
  const sourceExtent = Math.max(
    sourceMaximum[0] - sourceMinimum[0],
    sourceMaximum[1] - sourceMinimum[1],
    sourceMaximum[2] - sourceMinimum[2],
    0.001
  );
  const sourceCenter: ANARIVector3 = [
    (sourceMinimum[0] + sourceMaximum[0]) / 2,
    sourceMinimum[1],
    (sourceMinimum[2] + sourceMaximum[2]) / 2
  ];
  const normalization = new Matrix4()
    .scale(11.5 / sourceExtent)
    .translate([-sourceCenter[0], -sourceCenter[1], -sourceCenter[2]]);

  state.scene.instances = (state.scene.instances || []).map(instance => ({
    ...instance,
    matrix: instance.matrix
      ? Array.from(new Matrix4(normalization).multiplyRight(instance.matrix))
      : Array.from(normalization)
  }));
  state.scene.lights = (state.scene.lights || []).map(light => {
    if (!light.position) {
      return light;
    }
    const position = normalization.transformAsPoint(light.position);
    return {...light, position: [position[0], position[1], position[2]]};
  });

  const normalizedMinimum = normalization.transformAsPoint(sourceMinimum);
  const normalizedMaximum = normalization.transformAsPoint(sourceMaximum);
  state.bounds = {
    minimum: [normalizedMinimum[0], normalizedMinimum[1], normalizedMinimum[2]],
    maximum: [normalizedMaximum[0], normalizedMaximum[1], normalizedMaximum[2]]
  };
}

function addLightEmitter(
  state: USDTranslationState,
  parameters: {
    identifier: string;
    color: ANARIVector3;
    center: ANARIVector3;
    radius: number;
    height: number;
    phase: number;
    speed: number;
    size: number;
  }
): string {
  const identifier = `studio-${parameters.identifier}-emitter`;
  state.scene.geometries[identifier] = {
    '@@type': 'sphere',
    radius: parameters.size,
    segments: 18
  };
  state.scene.materials[identifier] = {
    '@@type': 'physicallyBased',
    baseColor: parameters.color,
    emissive: parameters.color,
    emissiveStrength: 11,
    roughness: 0.09,
    clearcoat: 0.82
  };
  state.scene.surfaces[identifier] = {geometry: identifier, material: identifier};
  const instanceIdentifier = `${identifier}-placement`;
  state.scene.instances = [
    ...(state.scene.instances || []),
    {
      '@@id': instanceIdentifier,
      surface: identifier,
      position: [
        parameters.center[0] + Math.cos(parameters.phase) * parameters.radius,
        parameters.center[1],
        parameters.center[2] + Math.sin(parameters.phase) * parameters.radius
      ],
      animation: {
        '@@type': 'orbit',
        center: parameters.center,
        radius: parameters.radius,
        height: parameters.height,
        phase: parameters.phase,
        speed: parameters.speed
      }
    }
  ];
  return instanceIdentifier;
}

function getMaterialIdentifier(
  materialPath: string | undefined,
  fallbackName: string,
  state: USDTranslationState,
  geometryPrim?: USDPrim
): string {
  const materialKey = materialPath || fallbackName;
  let identifier = state.materialIdentifiers.get(materialKey);
  if (identifier) {
    return identifier;
  }

  identifier = makeIdentifier(materialKey.split('/').pop() || fallbackName, 'material', state);
  const materialPrim = materialPath ? findMaterialPrim(materialPath, state) : undefined;
  const shader = materialPrim ? findSurfaceShader(materialPrim) : undefined;
  const baseColorTexture =
    materialPrim && shader
      ? getTextureIdentifier(materialPrim, shader, 'inputs:diffuseColor', 'srgb', state)
      : undefined;
  const displayColors = getVectorArray(
    geometryPrim ? getAttributeValue(geometryPrim, 'primvars:displayColor') : undefined
  );
  const displayColor: ANARIVector3 | undefined = displayColors[0]
    ? [displayColors[0][0], displayColors[0][1], displayColors[0][2]]
    : undefined;
  const diffuseColor: ANARIVector3 =
    getVector(shader ? getAttributeValue(shader, 'inputs:diffuseColor') : undefined) ||
    getVector(shader ? getAttributeValue(shader, 'inputs:base_color') : undefined) ||
    displayColor ||
    (baseColorTexture ? [1, 1, 1] : getMaterialFallbackColor(materialKey));
  const materialName = materialKey.toLowerCase();
  const isGlass = materialName.includes('window') || materialName.includes('glass');
  const isLight =
    materialName.includes('frontlight') ||
    materialName.includes('backlight') ||
    materialName.includes('headlight') ||
    materialName.includes('taillight') ||
    materialName.includes('emissive');
  const emissive =
    getVector(shader ? getAttributeValue(shader, 'inputs:emissiveColor') : undefined) ||
    (isLight ? diffuseColor : undefined);
  const declaration: JSONMaterialDeclaration = {
    '@@type': 'physicallyBased',
    baseColor: diffuseColor,
    metallic: getNumber(
      shader ? getAttributeValue(shader, 'inputs:metallic') : undefined,
      isGlass ? 0.22 : materialName.includes('grey') ? 0.82 : 0.48
    ),
    roughness: getNumber(
      shader ? getAttributeValue(shader, 'inputs:roughness') : undefined,
      isGlass ? 0.07 : materialName.includes('grey') ? 0.16 : 0.13
    ),
    clearcoat: isGlass ? 0.96 : 0.89,
    iridescence: isGlass ? 0.25 : 0.045
  };

  if (baseColorTexture) {
    declaration.baseColorTexture = baseColorTexture;
  }
  if (materialPrim && shader) {
    const normalTexture = getTextureIdentifier(
      materialPrim,
      shader,
      'inputs:normal',
      'linear',
      state
    );
    if (normalTexture) {
      declaration.normalTexture = normalTexture;
    }
  }

  if (isGlass) {
    declaration.opacity = getNumber(
      shader ? getAttributeValue(shader, 'inputs:opacity') : undefined,
      0.52
    );
  }
  if (emissive) {
    declaration.emissive = emissive;
    declaration.emissiveStrength = isLight ? 3.6 : 1.2;
    if (baseColorTexture && isLight) {
      declaration.emissiveTexture = baseColorTexture;
    }
  }

  state.scene.materials[identifier] = declaration;
  state.materialIdentifiers.set(materialKey, identifier);
  return identifier;
}

function getTextureIdentifier(
  material: USDPrim,
  surfaceShader: USDPrim,
  inputName: string,
  colorSpace: 'srgb' | 'linear',
  state: USDTranslationState
): string | undefined {
  const connection =
    getAttributeValue(surfaceShader, `${inputName}.connect`) ||
    getAttributeValue(surfaceShader, inputName);
  if (!isScenePath(connection)) {
    return undefined;
  }
  const shaderPath = connection.path.split('.outputs:')[0];
  const textureShader = findShaderAtPath(material, shaderPath);
  if (!textureShader || getAttributeValue(textureShader, 'info:id') !== 'UsdUVTexture') {
    return undefined;
  }
  const file = getAttributeValue(textureShader, 'inputs:file');
  if (!file || typeof file !== 'object' || Array.isArray(file) || !('assetPath' in file)) {
    return undefined;
  }
  const sourceUrl = textureShader.sourceUrl || material.sourceUrl;
  if (!sourceUrl) {
    return undefined;
  }
  const source = new URL(String(file.assetPath), sourceUrl).href;
  const cacheKey = `${source}:${colorSpace}`;
  let identifier = state.textureIdentifiers.get(cacheKey);
  if (!identifier) {
    identifier = makeIdentifier(textureShader.name, 'texture', state);
    state.scene.textures ||= {};
    state.scene.textures[identifier] = {source, colorSpace};
    state.textureIdentifiers.set(cacheKey, identifier);
  }
  return identifier;
}

function findShaderAtPath(prim: USDPrim, path: string): USDPrim | undefined {
  if (prim.path === path || path.endsWith(`/${prim.name}`)) {
    return prim;
  }
  for (const child of prim.children) {
    const shader = findShaderAtPath(child, path);
    if (shader) {
      return shader;
    }
  }
  return undefined;
}

function findMaterialPrim(materialPath: string, state: USDTranslationState): USDPrim | undefined {
  const exactMaterial = state.materials.get(materialPath);
  if (exactMaterial) {
    return exactMaterial;
  }
  const materialName = materialPath.split('/').pop();
  if (!materialName) {
    return undefined;
  }
  return Array.from(state.materials.values()).find(material => material.name === materialName);
}

function findSurfaceShader(prim: USDPrim): USDPrim | undefined {
  for (const child of prim.children) {
    const shaderIdentifier = getAttributeValue(child, 'info:id');
    if (
      child.type === 'Shader' &&
      (shaderIdentifier === 'UsdPreviewSurface' ||
        shaderIdentifier === 'ND_standard_surface_surfaceshader' ||
        shaderIdentifier === 'ND_UsdPreviewSurface_surfaceshader')
    ) {
      return child;
    }
    const nestedShader = findSurfaceShader(child);
    if (nestedShader) {
      return nestedShader;
    }
  }
  return undefined;
}

function indexMaterials(prim: USDPrim, materials: Map<string, USDPrim>): void {
  if (prim.type === 'Material') {
    materials.set(prim.path, prim);
  }
  for (const child of prim.children) {
    indexMaterials(child, materials);
  }
}

function createPrimTransform(prim: USDPrim): Matrix4 {
  const matrix = new Matrix4();
  const transformOrder = getStringArray(getAttributeValue(prim, 'xformOpOrder'));
  const operations = transformOrder.length
    ? transformOrder
    : Object.keys(prim.attributes).filter(name => name.startsWith('xformOp:'));

  for (const operation of operations) {
    const value = getAttributeValue(prim, operation);
    if (operation.startsWith('xformOp:translate')) {
      const translation = getVector(value);
      if (translation) {
        matrix.translate(translation);
      }
    } else if (operation.startsWith('xformOp:scale')) {
      const scale = getVector(value);
      if (scale) {
        matrix.scale(scale);
      }
    } else if (operation.startsWith('xformOp:transform')) {
      const rows = getVectorArray(value);
      if (rows.length === 4 && rows.every(row => row.length === 4)) {
        matrix.multiplyRight(new Matrix4(rows.flat()));
      }
    } else if (operation.startsWith('xformOp:rotate')) {
      const axes = operation.slice('xformOp:rotate'.length).split(':')[0];
      const angles = Array.isArray(value) ? value : [value];
      for (let axisIndex = 0; axisIndex < axes.length; axisIndex++) {
        const angle = getNumber(angles[axisIndex], 0) * (Math.PI / 180);
        if (axes[axisIndex] === 'X') {
          matrix.rotateX(angle);
        } else if (axes[axisIndex] === 'Y') {
          matrix.rotateY(angle);
        } else if (axes[axisIndex] === 'Z') {
          matrix.rotateZ(angle);
        }
      }
    } else if (operation.startsWith('xformOp:orient') && Array.isArray(value)) {
      const quaternion = value.map(component => getNumber(component, 0));
      if (quaternion.length === 4) {
        matrix.multiplyRight(
          new Matrix4().fromQuaternion([quaternion[1], quaternion[2], quaternion[3], quaternion[0]])
        );
      }
    }
  }
  return matrix;
}

function addInstance(
  state: USDTranslationState,
  surface: string,
  transform: Matrix4,
  name: string
): void {
  const instance: JSONInstanceDeclaration = {
    '@@id': makeIdentifier(name, 'instance', state),
    surface,
    matrix: Array.from(transform)
  };
  state.scene.instances = [...(state.scene.instances || []), instance];
}

function getStageName(stage: USDStage): string {
  const defaultPrim = stage.metadata['defaultPrim'];
  if (typeof defaultPrim === 'string') {
    return defaultPrim.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
  }
  return 'IMPORTED OPENUSD STAGE';
}

function getAttributeValue(prim: USDPrim, name: string): USDValue | undefined {
  return prim.attributes[name]?.value;
}

function getBoundMaterialPath(prim: USDPrim): string | undefined {
  const binding = getAttributeValue(prim, 'material:binding');
  return isScenePath(binding) ? binding.path : undefined;
}

function isScenePath(value: USDValue | undefined): value is USDScenePath {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && 'path' in value);
}

function getScenePaths(value: USDValue | undefined): string[] {
  if (isScenePath(value)) {
    return [value.path];
  }
  if (Array.isArray(value)) {
    return value.filter(isScenePath).map(path => path.path);
  }
  return [];
}

function getStringArray(value: USDValue | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function getNumberArray(value: USDValue | undefined): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number')
    : [];
}

function getVectorArray(value: USDValue | undefined): number[][] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is USDValue[] => Array.isArray(item))
    .map(item => item.filter((component): component is number => typeof component === 'number'));
}

function getVector(value: USDValue | undefined): ANARIVector3 | undefined {
  if (!Array.isArray(value) || value.length < 3) {
    return undefined;
  }
  if (
    typeof value[0] !== 'number' ||
    typeof value[1] !== 'number' ||
    typeof value[2] !== 'number'
  ) {
    return undefined;
  }
  return [value[0], value[1], value[2]];
}

function getNumber(value: USDValue | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getMaterialFallbackColor(name: string): ANARIVector3 {
  const identifier = name.toLowerCase();
  if (identifier.includes('frontlight')) {
    return [1, 0.87, 0.58];
  }
  if (identifier.includes('backlight')) {
    return [1, 0.12, 0.055];
  }
  if (identifier.includes('red')) {
    return [0.92, 0.065, 0.085];
  }
  if (identifier.includes('blue')) {
    return [0.075, 0.36, 0.96];
  }
  if (identifier.includes('green')) {
    return [0.09, 0.66, 0.31];
  }
  if (identifier.includes('gold')) {
    return [1, 0.69, 0.2];
  }
  if (identifier.includes('window') || identifier.includes('glass')) {
    return [0.31, 0.67, 0.96];
  }
  if (identifier.includes('lightgrey') || identifier.includes('greylight')) {
    return [0.78, 0.84, 0.93];
  }
  if (identifier.includes('mediumgrey') || identifier.includes('greymedium')) {
    return [0.22, 0.27, 0.35];
  }
  return [0.52, 0.65, 0.83];
}

function makeIdentifier(name: string, suffix: string, state: USDTranslationState): string {
  const normalizedName = name
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${normalizedName || 'usd'}-${suffix}-${++state.nextIdentifier}`;
}

function extendBounds(bounds: ImportedSceneBounds, position: ArrayLike<number>): void {
  for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
    bounds.minimum[componentIndex] = Math.min(
      bounds.minimum[componentIndex],
      position[componentIndex]
    );
    bounds.maximum[componentIndex] = Math.max(
      bounds.maximum[componentIndex],
      position[componentIndex]
    );
  }
}

function makeCubePositions(size: number): number[] {
  const halfSize = size / 2;
  const corners = [
    [-halfSize, -halfSize, -halfSize],
    [halfSize, -halfSize, -halfSize],
    [halfSize, halfSize, -halfSize],
    [-halfSize, halfSize, -halfSize],
    [-halfSize, -halfSize, halfSize],
    [halfSize, -halfSize, halfSize],
    [halfSize, halfSize, halfSize],
    [-halfSize, halfSize, halfSize]
  ];
  const indices = [
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 2, 3, 7, 2, 7, 6, 1, 2, 6, 1, 6, 5, 3, 0,
    4, 3, 4, 7
  ];
  return indices.flatMap(index => corners[index]);
}
