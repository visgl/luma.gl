import type {
  GLTFAccessorPostprocessed,
  GLTFImagePostprocessed,
  GLTFMaterialPostprocessed,
  GLTFMeshPrimitivePostprocessed,
  GLTFNodePostprocessed,
  GLTFPostprocessed,
  GLTFTexturePostprocessed
} from '@loaders.gl/gltf';
import type {ANARIAnimationNodeDescription, ANARIVector3} from '@luma.gl/anari';
import {makeANARIAnimationClipsFromGLTF} from '@luma.gl/anari/gltf';
import {
  convertGLTFSampler,
  getTextureTransformMatrix,
  getTextureTransformSlotDefinitions,
  parseGLTFAnimations,
  parseGLTFLights,
  resolveGLTFSkinIndex,
  resolveTextureCoordinateSet,
  resolveTextureTransform
} from '@luma.gl/gltf';
import {Matrix4} from '@math.gl/core';
import type {
  ANARIJSONScene,
  JSONGeometryDeclaration,
  JSONLightDeclaration,
  JSONMaterialDeclaration,
  JSONTextureDeclaration
} from './playground-scene';
import {addImportedScenePresentation, type ImportedSceneBounds} from './usd-to-anari';

type GLTFTextureReference = {
  texture?: GLTFTexturePostprocessed;
  index?: number;
  texCoord?: number;
  extensions?: Record<string, any>;
};

type GLTFTranslationState = {
  gltf: GLTFPostprocessed;
  scene: ANARIJSONScene;
  bounds: ImportedSceneBounds;
  imageSources: Map<GLTFImagePostprocessed, string>;
  textureIdentifiers: Map<string, string>;
  materialIdentifiers: Map<GLTFMaterialPostprocessed, string>;
  surfaceIdentifiers: Map<string, string>;
  nodeIdentifiers: Record<string, string>;
  nextIdentifier: number;
};

export async function makeANARIJSONSceneFromGLTF(
  gltf: GLTFPostprocessed,
  name: string
): Promise<ANARIJSONScene> {
  const scene: ANARIJSONScene = {
    version: 1,
    name,
    description: 'Imported glTF · full PBR textures, mapped emission, and retained meshes',
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
      ambientRadiance: 0.16,
      exposure: 1.62,
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

  const state: GLTFTranslationState = {
    gltf,
    scene,
    bounds: {
      minimum: [Infinity, Infinity, Infinity],
      maximum: [-Infinity, -Infinity, -Infinity]
    },
    imageSources: new Map(),
    textureIdentifiers: new Map(),
    materialIdentifiers: new Map(),
    surfaceIdentifiers: new Map(),
    nodeIdentifiers: {},
    nextIdentifier: 0
  };

  const rootNodes = gltf.scene?.nodes || gltf.scenes[0]?.nodes || gltf.nodes;
  for (const node of rootNodes) {
    translateNode(node, new Matrix4(), state);
  }
  state.scene.lights = makeImportedLights(gltf, state);

  const materialIdentifiers = (gltf.materials || []).map(material =>
    state.materialIdentifiers.get(material)
  );
  const samplerIdentifiers: Record<string, string> = {};
  for (const [materialIndex, identifier] of materialIdentifiers.entries()) {
    if (!identifier) {
      continue;
    }
    const material = scene.materials[identifier];
    for (const {slot} of getTextureTransformSlotDefinitions()) {
      const textureIdentifier = material[`${slot}Texture`];
      if (textureIdentifier) {
        samplerIdentifiers[`${materialIndex}:${slot}`] = textureIdentifier;
      }
    }
  }
  const clips = makeANARIAnimationClipsFromGLTF(parseGLTFAnimations(gltf), {
    nodeIdentifiers: state.nodeIdentifiers,
    materialIdentifiers,
    materialAlphaModes: (gltf.materials || []).map(material =>
      material.alphaMode === 'BLEND' ? 'BLEND' : material.alphaMode === 'MASK' ? 'MASK' : 'OPAQUE'
    ),
    samplerIdentifiers
  });
  if (clips.length > 0) {
    scene.clips = clips;
    scene.playback = {clip: clips[0].name, playing: true, loop: 'repeat'};
    scene.description = `Imported glTF · ${clips.length} animation clip${clips.length === 1 ? '' : 's'} · retained PBR scene`;
  }

  const presentationTransform = makePresentationTransform(state.bounds);
  addImportedScenePresentation(scene, state.bounds);
  if (scene.nodes && Object.keys(scene.nodes).length > 0) {
    let presentationNodeIdentifier = 'anari-presentation-root';
    while (presentationNodeIdentifier in scene.nodes) {
      presentationNodeIdentifier += '-root';
    }
    for (const declaration of Object.values(scene.nodes)) {
      if (!declaration.parent) {
        declaration.parent = presentationNodeIdentifier;
      }
    }
    scene.nodes[presentationNodeIdentifier] = {matrix: Array.from(presentationTransform)};
  }
  return scene;
}

function makeImportedLights(
  gltf: GLTFPostprocessed,
  state: GLTFTranslationState
): JSONLightDeclaration[] {
  return parseGLTFLights(gltf, {useByteColors: false}).flatMap(light => {
    if (light.type === 'ambient') {
      return [];
    }

    const declaration: JSONLightDeclaration = {
      '@@id': createIdentifier(`source-${light.type}`, 'light', state),
      '@@type': light.type,
      color: toVector3(light.color, [1, 1, 1]),
      intensity: light.intensity ?? 1
    };
    if ('position' in light) {
      declaration.position = toVector3(light.position, [0, 0, 0]);
    }
    if ('direction' in light) {
      declaration.direction = toVector3(light.direction, [0, 0, -1]);
    }
    if (light.type === 'spot') {
      declaration.openingAngle = light.outerConeAngle ?? Math.PI / 4;
      declaration.falloffAngle = light.innerConeAngle ?? 0;
    }
    return [declaration];
  });
}

function makePresentationTransform(bounds: ImportedSceneBounds): Matrix4 {
  const extent = Math.max(
    bounds.maximum[0] - bounds.minimum[0],
    bounds.maximum[1] - bounds.minimum[1],
    bounds.maximum[2] - bounds.minimum[2],
    0.001
  );
  return new Matrix4()
    .scale(11.5 / extent)
    .translate([
      -(bounds.minimum[0] + bounds.maximum[0]) / 2,
      -bounds.minimum[1],
      -(bounds.minimum[2] + bounds.maximum[2]) / 2
    ]);
}

function translateNode(
  node: GLTFNodePostprocessed,
  parentTransform: Matrix4,
  state: GLTFTranslationState,
  parentIdentifier?: string
): void {
  const nodeIdentifier = node.id;
  const morphTargetCount =
    node.mesh?.primitives.find(primitive => primitive.targets?.length)?.targets?.length || 0;
  const morphWeights =
    node.weights ||
    node.mesh?.weights ||
    (morphTargetCount ? new Array<number>(morphTargetCount).fill(0) : undefined);
  state.nodeIdentifiers[node.id] = nodeIdentifier;
  state.scene.nodes ||= {};
  const declaration: ANARIAnimationNodeDescription = {
    ...(parentIdentifier ? {parent: parentIdentifier} : {}),
    ...(node.translation
      ? {translation: [node.translation[0], node.translation[1], node.translation[2]] as const}
      : {}),
    ...(node.rotation
      ? {
          rotation: [
            node.rotation[0],
            node.rotation[1],
            node.rotation[2],
            node.rotation[3]
          ] as const
        }
      : {}),
    ...(node.scale ? {scale: [node.scale[0], node.scale[1], node.scale[2]] as const} : {}),
    ...(node.matrix ? {matrix: Array.from(node.matrix)} : {}),
    ...(morphWeights ? {weights: [...morphWeights]} : {})
  };
  state.scene.nodes[nodeIdentifier] = declaration;
  const transform = new Matrix4(parentTransform);
  if (node.matrix) {
    transform.multiplyRight(node.matrix);
  } else {
    if (node.translation) {
      transform.translate(node.translation);
    }
    if (node.rotation) {
      transform.multiplyRight(new Matrix4().fromQuaternion(node.rotation));
    }
    if (node.scale) {
      transform.scale(node.scale);
    }
  }

  if (node.mesh) {
    for (const [primitiveIndex, primitive] of node.mesh.primitives.entries()) {
      if (primitive.mode !== undefined && primitive.mode !== 4) {
        continue;
      }
      const surface = getSurfaceIdentifier(node.mesh.id, primitiveIndex, primitive, state, node);
      if (!surface) {
        continue;
      }

      const positionAccessor = primitive.attributes['POSITION'];
      for (
        let positionIndex = 0;
        positionIndex < positionAccessor.value.length;
        positionIndex += 3
      ) {
        const position = transform.transformAsPoint([
          positionAccessor.value[positionIndex],
          positionAccessor.value[positionIndex + 1],
          positionAccessor.value[positionIndex + 2]
        ]);
        extendBounds(state.bounds, position);
      }

      const identifier = createIdentifier(node.name || node.id, 'instance', state);
      state.scene.instances = [
        ...(state.scene.instances || []),
        {'@@id': identifier, surface, matrix: Array.from(transform)}
      ];
      declaration.instances = [...(declaration.instances || []), identifier];
      if (primitive.targets?.length) {
        declaration.geometries = [...(declaration.geometries || []), surface];
      }
    }
  }

  for (const child of node.children || []) {
    translateNode(child, transform, state, nodeIdentifier);
  }
}

function getSurfaceIdentifier(
  meshIdentifier: string,
  primitiveIndex: number,
  primitive: GLTFMeshPrimitivePostprocessed,
  state: GLTFTranslationState,
  node: GLTFNodePostprocessed
): string | undefined {
  const positionAccessor = primitive.attributes['POSITION'];
  if (!positionAccessor) {
    return undefined;
  }

  const cacheKey = `${meshIdentifier}:${primitiveIndex}${primitive.targets?.length || node.skin !== undefined ? `:${node.id}` : ''}`;
  let surfaceIdentifier = state.surfaceIdentifiers.get(cacheKey);
  if (surfaceIdentifier) {
    return surfaceIdentifier;
  }

  surfaceIdentifier = createIdentifier(meshIdentifier, `primitive-${primitiveIndex}`, state);
  const geometry: JSONGeometryDeclaration = {
    '@@type': 'triangle',
    'vertex.position': Array.from(positionAccessor.value)
  };
  const normalAccessor = primitive.attributes['NORMAL'];
  if (normalAccessor) {
    geometry['vertex.normal'] = Array.from(normalAccessor.value);
  }
  const tangentAccessor = primitive.attributes['TANGENT'];
  if (tangentAccessor) {
    geometry['vertex.tangent'] = Array.from(tangentAccessor.value);
  }
  const jointAccessor = primitive.attributes['JOINTS_0'];
  if (jointAccessor) {
    geometry['vertex.joint'] = Array.from(jointAccessor.value);
  }
  const jointWeightAccessor = primitive.attributes['WEIGHTS_0'];
  if (jointWeightAccessor) {
    const maximumJointWeight = jointWeightAccessor.normalized
      ? jointWeightAccessor.value instanceof Uint8Array
        ? 255
        : jointWeightAccessor.value instanceof Uint16Array
          ? 65535
          : 1
      : 1;
    geometry['vertex.weight'] = Array.from(
      jointWeightAccessor.value,
      weight => weight / maximumJointWeight
    );
  }
  if (primitive.indices) {
    geometry['primitive.index'] = Array.from(primitive.indices.value);
  }

  const vertexColors = getVertexColors(primitive, positionAccessor.count);
  if (vertexColors) {
    geometry['vertex.attribute0'] = vertexColors;
  }
  const textureCoordinates = primitive.attributes['TEXCOORD_0'];
  if (textureCoordinates) {
    geometry['vertex.attribute1'] = Array.from(textureCoordinates.value);
  }
  const additionalTextureCoordinates = primitive.attributes['TEXCOORD_1'];
  if (additionalTextureCoordinates) {
    geometry['vertex.attribute2'] = Array.from(additionalTextureCoordinates.value);
  }
  if (primitive.targets?.length) {
    geometry.morphTargets = primitive.targets.map(target => {
      const attributes: NonNullable<JSONGeometryDeclaration['morphTargets']>[number] = {};
      for (const attributeName of ['POSITION', 'NORMAL', 'TANGENT'] as const) {
        const accessorReference = target[attributeName];
        const accessor =
          typeof accessorReference === 'number'
            ? state.gltf.accessors[accessorReference]
            : accessorReference;
        if (accessor) {
          attributes[attributeName] = Array.from(accessor.value);
        }
      }
      return attributes;
    });
    geometry.morphWeights = [
      ...(node.weights || node.mesh?.weights || new Array<number>(primitive.targets.length).fill(0))
    ];
  }

  const material = getMaterialIdentifier(primitive.material, state);
  const sourceSkin =
    node.skin === undefined
      ? undefined
      : state.gltf.skins?.[resolveGLTFSkinIndex(state.gltf, node.skin)];
  const skin = sourceSkin
    ? {
        node: node.id,
        joints: sourceSkin.joints.map(jointIndex => state.gltf.nodes[jointIndex].id),
        ...(sourceSkin.inverseBindMatrices?.value
          ? {inverseBindMatrices: Array.from(sourceSkin.inverseBindMatrices.value)}
          : {})
      }
    : undefined;
  state.scene.geometries[surfaceIdentifier] = geometry;
  state.scene.surfaces[surfaceIdentifier] = {
    geometry: surfaceIdentifier,
    material,
    ...(skin ? {skin} : {})
  };
  state.surfaceIdentifiers.set(cacheKey, surfaceIdentifier);
  return surfaceIdentifier;
}

function getMaterialIdentifier(
  sourceMaterial: GLTFMaterialPostprocessed | undefined,
  state: GLTFTranslationState
): string {
  if (!sourceMaterial) {
    const identifier = 'default-material';
    state.scene.materials[identifier] ||= {
      '@@type': 'physicallyBased',
      baseColor: [1, 1, 1],
      metallic: 1,
      roughness: 1,
      clearcoat: 0
    };
    return identifier;
  }

  const cachedIdentifier = state.materialIdentifiers.get(sourceMaterial);
  if (cachedIdentifier) {
    return cachedIdentifier;
  }

  const identifier = createIdentifier(sourceMaterial.name || sourceMaterial.id, 'material', state);
  const parameters = sourceMaterial.pbrMetallicRoughness;
  const baseColor = parameters?.baseColorFactor || [1, 1, 1, 1];
  const alphaMode =
    sourceMaterial.alphaMode === 'BLEND'
      ? 'blend'
      : sourceMaterial.alphaMode === 'MASK'
        ? 'mask'
        : 'opaque';
  const clearcoat = sourceMaterial.extensions?.['KHR_materials_clearcoat'];
  const iridescence = sourceMaterial.extensions?.['KHR_materials_iridescence'];
  const transmission = sourceMaterial.extensions?.['KHR_materials_transmission'];
  const sheen = sourceMaterial.extensions?.['KHR_materials_sheen'];
  const specular = sourceMaterial.extensions?.['KHR_materials_specular'];
  const volume = sourceMaterial.extensions?.['KHR_materials_volume'];
  const anisotropy = sourceMaterial.extensions?.['KHR_materials_anisotropy'];
  const indexOfRefraction = sourceMaterial.extensions?.['KHR_materials_ior'];
  const material: JSONMaterialDeclaration = {
    '@@type': 'physicallyBased',
    baseColor: [baseColor[0], baseColor[1], baseColor[2]],
    alphaMode,
    doubleSided: sourceMaterial.doubleSided ?? false,
    metallic: clamp(parameters?.metallicFactor ?? 1, 0, 1),
    roughness: clamp(parameters?.roughnessFactor ?? 1, 0, 1),
    unlit: Boolean(
      ('unlit' in sourceMaterial && sourceMaterial.unlit) ||
        sourceMaterial.extensions?.['KHR_materials_unlit']
    ),
    specularColor: toVector3(specular?.specularColorFactor, [1, 1, 1]),
    specularIntensity: clamp(specular?.specularFactor ?? 1, 0, 1),
    clearcoat: clamp(clearcoat?.clearcoatFactor ?? 0, 0, 1),
    clearcoatRoughness: clamp(clearcoat?.clearcoatRoughnessFactor ?? 0, 0, 1),
    iridescence: clamp(iridescence?.iridescenceFactor ?? 0, 0, 1),
    transmission: clamp(transmission?.transmissionFactor ?? 0, 0, 1),
    thickness: Math.max(volume?.thicknessFactor ?? 0, 0),
    attenuationColor: toVector3(volume?.attenuationColor, [1, 1, 1]),
    indexOfRefraction: clamp(indexOfRefraction?.ior ?? 1.5, 1, 2.5),
    sheenColor: toVector3(sheen?.sheenColorFactor, [0, 0, 0]),
    sheenRoughness: clamp(sheen?.sheenRoughnessFactor ?? 0, 0, 1),
    iridescenceIndexOfRefraction: Math.max(iridescence?.iridescenceIor ?? 1.3, 1),
    iridescenceThicknessMinimum: Math.max(iridescence?.iridescenceThicknessMinimum ?? 100, 0),
    iridescenceThicknessMaximum: Math.max(iridescence?.iridescenceThicknessMaximum ?? 400, 0),
    anisotropyStrength: clamp(anisotropy?.anisotropyStrength ?? 0, 0, 1),
    anisotropyRotation: anisotropy?.anisotropyRotation ?? 0,
    normalScale: clamp(sourceMaterial.normalTexture?.scale ?? 1, 0, 4),
    occlusionStrength: clamp(sourceMaterial.occlusionTexture?.strength ?? 1, 0, 1)
  };

  if (volume?.attenuationDistance !== undefined && volume.attenuationDistance > 0) {
    material.attenuationDistance = volume.attenuationDistance;
  }

  for (const {slot, pathSegments, colorSpace} of getTextureTransformSlotDefinitions()) {
    addMaterialTexture(
      material,
      `${slot}Texture`,
      getNestedTextureInfo(sourceMaterial, pathSegments),
      colorSpace,
      state
    );
  }

  const emissiveFactor = sourceMaterial.emissiveFactor || [0, 0, 0];
  if (sourceMaterial.emissiveTexture || emissiveFactor.some(value => value > 0)) {
    material.emissive = toVector3(emissiveFactor, [1, 1, 1]);
    material.emissiveStrength =
      sourceMaterial.extensions?.['KHR_materials_emissive_strength']?.emissiveStrength ?? 1;
  }

  if (alphaMode === 'mask') {
    material.alphaCutoff = clamp(sourceMaterial.alphaCutoff ?? 0.5, 0, 1);
  }

  if (alphaMode === 'blend' || alphaMode === 'mask') {
    material.opacity = clamp(baseColor[3], 0, 1);
  }

  state.scene.materials[identifier] = material;
  state.materialIdentifiers.set(sourceMaterial, identifier);
  return identifier;
}

function getVertexColors(
  primitive: GLTFMeshPrimitivePostprocessed,
  vertexCount: number
): number[] | undefined {
  const colorAccessor = primitive.attributes['COLOR_0'];
  if (!colorAccessor) {
    return undefined;
  }

  const colorSize = colorAccessor.components === 4 ? 4 : 3;
  const colors = new Array<number>(vertexCount * colorSize);
  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    const sourceColor = getAccessorColor(colorAccessor, vertexIndex);
    const offset = vertexIndex * colorSize;
    colors[offset] = sourceColor[0];
    colors[offset + 1] = sourceColor[1];
    colors[offset + 2] = sourceColor[2];
    if (colorSize === 4) {
      const sourceAlpha = colorAccessor.value[vertexIndex * colorAccessor.components + 3];
      const divisor = colorAccessor.normalized
        ? colorAccessor.componentType === 5121
          ? 255
          : colorAccessor.componentType === 5123
            ? 65535
            : 1
        : 1;
      colors[offset + 3] = sourceAlpha / divisor;
    }
  }
  return colors;
}

function getAccessorColor(
  accessor: GLTFAccessorPostprocessed | undefined,
  vertexIndex: number
): ANARIVector3 {
  if (!accessor) {
    return [1, 1, 1];
  }
  const offset = vertexIndex * accessor.components;
  const divisor = accessor.normalized
    ? accessor.componentType === 5121
      ? 255
      : accessor.componentType === 5123
        ? 65535
        : 1
    : 1;
  return [
    accessor.value[offset] / divisor,
    accessor.value[offset + 1] / divisor,
    accessor.value[offset + 2] / divisor
  ];
}

function addMaterialTexture(
  material: JSONMaterialDeclaration,
  parameterName: `${ReturnType<typeof getTextureTransformSlotDefinitions>[number]['slot']}Texture`,
  textureInfo: GLTFTextureReference | undefined,
  colorSpace: 'srgb' | 'linear',
  state: GLTFTranslationState
): void {
  if (!textureInfo) {
    return;
  }
  const texture =
    textureInfo.texture ||
    (typeof textureInfo.index === 'number' ? state.gltf.textures[textureInfo.index] : undefined);
  const image = texture?.source;
  if (!image) {
    return;
  }

  const transform = getTextureTransform(textureInfo);
  const requestedTextureCoordinateSet = resolveTextureCoordinateSet(textureInfo);
  const textureCoordinateSet = requestedTextureCoordinateSet === 1 ? 1 : 0;
  const sampler = convertGLTFSampler(texture.sampler);
  const samplerKey = Object.entries(sampler)
    .map(([name, value]) => `${name}:${value}`)
    .join(',');
  const cacheKey = `${image.id}:${colorSpace}:${textureCoordinateSet}:${transform?.join(',') || 'identity'}:${samplerKey}`;
  let identifier = state.textureIdentifiers.get(cacheKey);
  if (!identifier) {
    const source = getImageSource(image, state);
    if (!source) {
      return;
    }
    identifier = createIdentifier(image.name || image.id, 'texture', state);
    const declaration: JSONTextureDeclaration = {source, colorSpace};
    if (textureCoordinateSet === 1) {
      declaration.textureCoordinateSet = textureCoordinateSet;
    }
    if (transform) {
      declaration.transform = transform;
    }
    if (Object.keys(sampler).length > 0) {
      declaration.sampler = sampler;
    }
    state.scene.textures ||= {};
    state.scene.textures[identifier] = declaration;
    state.textureIdentifiers.set(cacheKey, identifier);
  }
  material[parameterName] = identifier;
}

function getNestedTextureInfo(
  material: GLTFMaterialPostprocessed,
  pathSegments: readonly string[]
): GLTFTextureReference | undefined {
  let value: unknown = material;
  for (const pathSegment of pathSegments) {
    if (!value || typeof value !== 'object') {
      return undefined;
    }
    value = Reflect.get(value, pathSegment);
  }
  return value && typeof value === 'object' ? (value as GLTFTextureReference) : undefined;
}

function getImageSource(
  image: GLTFImagePostprocessed,
  state: GLTFTranslationState
): string | undefined {
  const cached = state.imageSources.get(image);
  if (cached) {
    return cached;
  }
  const data = image.bufferView?.data || image.image?.data;
  const source = data
    ? URL.createObjectURL(new Blob([new Uint8Array(data)], {type: image.mimeType || 'image/png'}))
    : image.uri;
  if (source) {
    state.imageSources.set(image, source);
  }
  return source;
}

function getTextureTransform(
  texture: GLTFTextureReference
): JSONTextureDeclaration['transform'] | undefined {
  if (!texture.extensions?.['KHR_texture_transform']) {
    return undefined;
  }
  const matrix = getTextureTransformMatrix(resolveTextureTransform(texture as Record<string, any>));
  return [
    matrix[0],
    matrix[1],
    matrix[2],
    matrix[3],
    matrix[4],
    matrix[5],
    matrix[6],
    matrix[7],
    matrix[8]
  ];
}

function toVector3(value: ArrayLike<number> | undefined, fallback: ANARIVector3): ANARIVector3 {
  return value && value.length >= 3 ? [value[0], value[1], value[2]] : fallback;
}

function extendBounds(bounds: ImportedSceneBounds, position: ArrayLike<number>): void {
  for (let dimension = 0; dimension < 3; dimension++) {
    bounds.minimum[dimension] = Math.min(bounds.minimum[dimension], position[dimension]);
    bounds.maximum[dimension] = Math.max(bounds.maximum[dimension], position[dimension]);
  }
}

function createIdentifier(name: string, suffix: string, state: GLTFTranslationState): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${normalized || 'gltf'}-${suffix}-${state.nextIdentifier++}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
