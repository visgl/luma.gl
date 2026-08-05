import {convertSamplerToGLTF, getTextureTransformSlotDefinitions} from '@luma.gl/gltf';
import {Matrix4} from '@math.gl/core';
import {
  type ANARIJSONScene,
  createGeneratedGeometry,
  createInstanceTransform,
  createStarfieldInstances,
  type JSONGeometryDeclaration,
  type JSONMaterialDeclaration,
  type JSONTextureDeclaration
} from './playground-scene';

type MeshData = {
  positions: number[];
  normals: number[];
  textureCoordinates?: number[];
  additionalTextureCoordinates?: number[];
  colors?: number[];
  indices: number[];
};

type SurfacePlacement = {
  surface: string;
  identifier: string;
  matrix: readonly number[];
};

type GLTFBufferView = {buffer: number; byteOffset: number; byteLength: number; target?: number};
type GLTFAccessor = {
  bufferView: number;
  componentType: number;
  count: number;
  type: 'SCALAR' | 'VEC2' | 'VEC3';
  min?: number[];
  max?: number[];
};

export async function exportANARIJSONSceneToGLTF(scene: ANARIJSONScene): Promise<string> {
  const bufferBuilder = new BinaryBufferBuilder();
  const bufferViews: GLTFBufferView[] = [];
  const accessors: GLTFAccessor[] = [];
  const materials = Object.entries(scene.materials).map(([identifier, material]) =>
    makeGLTFMaterial(identifier, material, scene)
  );
  const materialIndices = new Map(
    Object.keys(scene.materials).map((identifier, index) => [identifier, index])
  );
  const textureEntries = await Promise.all(
    Object.entries(scene.textures || {}).map(async ([identifier, texture]) => ({
      identifier,
      uri: await makeDataURI(texture.source)
    }))
  );
  const textureIndices = new Map(textureEntries.map((entry, index) => [entry.identifier, index]));
  for (const [materialIndex, sourceMaterial] of Object.values(scene.materials).entries()) {
    resolveGLTFMaterialTextures(materials[materialIndex], sourceMaterial, textureIndices, scene);
  }

  const meshes: object[] = [];
  const meshIndices = new Map<string, number>();
  for (const [surfaceIdentifier, surface] of Object.entries(scene.surfaces)) {
    const geometry = scene.geometries[surface.geometry];
    if (!geometry) {
      continue;
    }
    const meshData = bakeGeometry(geometry);
    const primitive: Record<string, unknown> = {
      attributes: {
        POSITION: addFloatAccessor(meshData.positions, 3, bufferBuilder, bufferViews, accessors)
      },
      indices: addIndexAccessor(meshData.indices, bufferBuilder, bufferViews, accessors),
      material: materialIndices.get(surface.material) || 0
    };
    const attributes = primitive.attributes as Record<string, number>;
    if (meshData.normals.length > 0) {
      attributes['NORMAL'] = addFloatAccessor(
        meshData.normals,
        3,
        bufferBuilder,
        bufferViews,
        accessors
      );
    }
    if (meshData.textureCoordinates) {
      attributes['TEXCOORD_0'] = addFloatAccessor(
        meshData.textureCoordinates,
        2,
        bufferBuilder,
        bufferViews,
        accessors
      );
    }
    if (meshData.additionalTextureCoordinates) {
      attributes['TEXCOORD_1'] = addFloatAccessor(
        meshData.additionalTextureCoordinates,
        2,
        bufferBuilder,
        bufferViews,
        accessors
      );
    }
    if (meshData.colors) {
      attributes['COLOR_0'] = addFloatAccessor(
        meshData.colors,
        3,
        bufferBuilder,
        bufferViews,
        accessors
      );
    }
    meshIndices.set(surfaceIdentifier, meshes.length);
    meshes.push({name: surfaceIdentifier, primitives: [primitive]});
  }

  const nodes: object[] = [];
  for (const placement of collectSurfacePlacements(scene)) {
    const mesh = meshIndices.get(placement.surface);
    if (mesh === undefined) {
      continue;
    }
    nodes.push({name: placement.identifier, mesh, matrix: Array.from(placement.matrix)});
  }
  const cameraNode = addGLTFCamera(scene, nodes);
  const lightExtension = addGLTFLights(scene, nodes);
  const sceneNodeIndices = nodes.map((_node, index) => index);
  const gltf: Record<string, unknown> = {
    asset: {version: '2.0', generator: '@luma.gl/anari experimental exporter'},
    scene: 0,
    scenes: [{name: scene.name, nodes: sceneNodeIndices}],
    nodes,
    meshes,
    materials,
    buffers: [{byteLength: bufferBuilder.length, uri: bufferBuilder.toDataURI()}],
    bufferViews,
    accessors
  };
  if (textureEntries.length > 0) {
    gltf['images'] = textureEntries.map(entry => ({name: entry.identifier, uri: entry.uri}));
    const samplerIndices = new Map<string, number>();
    const samplers: ReturnType<typeof convertSamplerToGLTF>[] = [];
    gltf['textures'] = textureEntries.map((entry, index) => {
      const sampler = convertSamplerToGLTF({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        minFilter: 'linear',
        magFilter: 'linear',
        ...scene.textures?.[entry.identifier]?.sampler
      });
      const samplerKey = JSON.stringify(sampler);
      let samplerIndex = samplerIndices.get(samplerKey);
      if (samplerIndex === undefined) {
        samplerIndex = samplers.length;
        samplers.push(sampler);
        samplerIndices.set(samplerKey, samplerIndex);
      }
      return {name: entry.identifier, source: index, sampler: samplerIndex};
    });
    gltf['samplers'] = samplers;
  }
  if (cameraNode) {
    gltf['cameras'] = [cameraNode.camera];
  }
  const extensionsUsed = [
    ...collectMaterialExtensions(materials),
    ...(Object.values(scene.textures || {}).some(texture => texture.transform)
      ? ['KHR_texture_transform']
      : []),
    ...(lightExtension ? ['KHR_lights_punctual'] : [])
  ];
  if (extensionsUsed.length > 0) {
    gltf['extensionsUsed'] = extensionsUsed;
  }
  if (lightExtension) {
    gltf['extensions'] = {KHR_lights_punctual: {lights: lightExtension}};
  }
  return JSON.stringify(gltf, null, 2);
}

export function exportANARIJSONSceneToUSD(scene: ANARIJSONScene): string {
  const lines = [
    '#usda 1.0',
    '(',
    '    defaultPrim = "World"',
    '    upAxis = "Y"',
    ')',
    '',
    'def Xform "World"',
    '{',
    '    def Scope "Materials"',
    '    {'
  ];
  for (const [identifier, material] of Object.entries(scene.materials)) {
    appendUSDMaterial(lines, identifier, material, scene);
  }
  lines.push('    }', '', '    def Xform "Geometry"', '    {');
  for (const [surfaceIdentifier, surface] of Object.entries(scene.surfaces)) {
    const geometry = scene.geometries[surface.geometry];
    if (!geometry) {
      continue;
    }
    appendUSDMesh(lines, surfaceIdentifier, bakeGeometry(geometry), surface.material);
  }
  lines.push('    }', '');
  for (const placement of collectSurfacePlacements(scene)) {
    lines.push('    def Xform "' + sanitizeIdentifier(placement.identifier) + '"');
    lines.push('    {');
    lines.push('        matrix4d xformOp:transform = ' + formatUSDMatrix(placement.matrix));
    lines.push('        uniform token[] xformOpOrder = ["xformOp:transform"]');
    lines.push(
      '        rel material:binding = </World/Materials/' +
        sanitizeIdentifier(scene.surfaces[placement.surface]?.material || '') +
        '>'
    );
    lines.push(
      '        def "Mesh" (references = </World/Geometry/' +
        sanitizeIdentifier(placement.surface) +
        '>)'
    );
    lines.push('        {');
    lines.push('        }');
    lines.push('    }', '');
  }
  appendUSDCamera(lines, scene);
  appendUSDLights(lines, scene);
  lines.push('}');
  return lines.join('\n') + '\n';
}

function collectSurfacePlacements(scene: ANARIJSONScene): SurfacePlacement[] {
  const placements: SurfacePlacement[] = [];
  const instances = [
    ...(scene.instances || []),
    ...(scene.distributions || []).flatMap(distribution => createStarfieldInstances(distribution))
  ];
  for (const instance of instances) {
    const surfaces = instance.surface
      ? [instance.surface]
      : instance.group
        ? scene.groups?.[instance.group]?.surfaces || []
        : [];
    for (const surface of surfaces) {
      placements.push({
        surface,
        identifier: instance['@@id'] + '-' + surface,
        matrix: createInstanceTransform(instance)
      });
    }
  }
  for (const surface of scene.world?.surfaces || []) {
    placements.push({surface, identifier: 'world-' + surface, matrix: new Matrix4()});
  }
  if (placements.length === 0) {
    for (const surface of Object.keys(scene.surfaces)) {
      placements.push({surface, identifier: surface, matrix: new Matrix4()});
    }
  }
  return placements;
}

function bakeGeometry(geometry: JSONGeometryDeclaration): MeshData {
  if (geometry['@@type'] === 'triangle') {
    const generated = geometry.generator ? createGeneratedGeometry(geometry.generator) : {};
    const positions = toNumberArray(generated['vertex.position'] || geometry['vertex.position']);
    const normals = toNumberArray(generated['vertex.normal'] || geometry['vertex.normal']);
    const indices = toNumberArray(generated['primitive.index'] || geometry['primitive.index']);
    return {
      positions,
      normals,
      textureCoordinates: geometry['vertex.attribute1']
        ? Array.from(geometry['vertex.attribute1'])
        : undefined,
      additionalTextureCoordinates: geometry['vertex.attribute2']
        ? Array.from(geometry['vertex.attribute2'])
        : undefined,
      colors: geometry['vertex.attribute0'] ? Array.from(geometry['vertex.attribute0']) : undefined,
      indices: indices.length > 0 ? indices : makeSequentialIndices(positions.length / 3)
    };
  }
  if (geometry['@@type'] === 'sphere') {
    return makeSphere(geometry.radius || 1, geometry.segments || 16);
  }
  if (geometry['@@type'] === 'cylinder') {
    return makeCylinder(geometry.radius || 1, geometry.height || 1, geometry.segments || 16, false);
  }
  if (geometry['@@type'] === 'cone') {
    return makeCylinder(geometry.radius || 1, geometry.height || 1, geometry.segments || 16, true);
  }
  return makeQuad(geometry.width || 1, geometry.height || 1);
}

function makeSphere(radius: number, segments: number): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const textureCoordinates: number[] = [];
  const indices: number[] = [];
  const rings = Math.max(3, Math.floor(segments / 2));
  for (let ring = 0; ring <= rings; ring++) {
    const vertical = ring / rings;
    const latitude = vertical * Math.PI;
    for (let segment = 0; segment <= segments; segment++) {
      const horizontal = segment / segments;
      const longitude = horizontal * Math.PI * 2;
      const normal = [
        Math.sin(latitude) * Math.cos(longitude),
        Math.cos(latitude),
        Math.sin(latitude) * Math.sin(longitude)
      ];
      positions.push(normal[0] * radius, normal[1] * radius, normal[2] * radius);
      normals.push(...normal);
      textureCoordinates.push(horizontal, 1 - vertical);
    }
  }
  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const first = ring * (segments + 1) + segment;
      const second = first + segments + 1;
      indices.push(first, second, first + 1, first + 1, second, second + 1);
    }
  }
  return {positions, normals, textureCoordinates, indices};
}

function makeCylinder(radius: number, height: number, segments: number, cone: boolean): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const textureCoordinates: number[] = [];
  const indices: number[] = [];
  const topRadius = cone ? 0 : radius;
  for (let segment = 0; segment <= segments; segment++) {
    const horizontal = segment / segments;
    const angle = horizontal * Math.PI * 2;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    positions.push(
      cosine * radius,
      -height / 2,
      sine * radius,
      cosine * topRadius,
      height / 2,
      sine * topRadius
    );
    normals.push(
      cosine,
      cone ? radius / height : 0,
      sine,
      cosine,
      cone ? radius / height : 0,
      sine
    );
    textureCoordinates.push(horizontal, 0, horizontal, 1);
  }
  for (let segment = 0; segment < segments; segment++) {
    const first = segment * 2;
    indices.push(first, first + 1, first + 2, first + 2, first + 1, first + 3);
  }
  return {positions, normals, textureCoordinates, indices};
}

function makeQuad(width: number, height: number): MeshData {
  return {
    positions: [
      -width / 2,
      0,
      -height / 2,
      width / 2,
      0,
      -height / 2,
      width / 2,
      0,
      height / 2,
      -width / 2,
      0,
      height / 2
    ],
    normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    textureCoordinates: [0, 0, 1, 0, 1, 1, 0, 1],
    indices: [0, 1, 2, 0, 2, 3]
  };
}

function makeGLTFMaterial(
  identifier: string,
  material: JSONMaterialDeclaration,
  scene: ANARIJSONScene
): Record<string, unknown> {
  const baseColor = material.baseColor || material.color || [0.8, 0.8, 0.8];
  const alpha = baseColor.length > 3 ? (baseColor[3] ?? 1) : (material.opacity ?? 1);
  const result: Record<string, unknown> = {
    name: identifier,
    pbrMetallicRoughness: {
      baseColorFactor: [baseColor[0], baseColor[1], baseColor[2], alpha],
      metallicFactor: material.metallic ?? 0,
      roughnessFactor: material.roughness ?? 0.38
    }
  };
  if (material.alphaMode === 'mask') {
    result['alphaMode'] = 'MASK';
    result['alphaCutoff'] = material.alphaCutoff ?? 0.5;
  } else if (material.alphaMode === 'blend' || (alpha < 1 && material.alphaMode !== 'opaque')) {
    result['alphaMode'] = 'BLEND';
  }
  if (material.doubleSided) {
    result['doubleSided'] = true;
  }
  if (material.emissive) {
    result['emissiveFactor'] = Array.from(material.emissive);
  }
  if (material.emissiveStrength && material.emissiveStrength !== 1) {
    addGLTFMaterialExtension(result, 'KHR_materials_emissive_strength', {
      emissiveStrength: material.emissiveStrength
    });
  }
  if (
    (material.clearcoat ?? 0) > 0 ||
    (material.clearcoatRoughness ?? 0) > 0 ||
    material.clearcoatTexture ||
    material.clearcoatRoughnessTexture ||
    material.clearcoatNormalTexture
  ) {
    addGLTFMaterialExtension(result, 'KHR_materials_clearcoat', {
      clearcoatFactor: material.clearcoat ?? 0,
      clearcoatRoughnessFactor: material.clearcoatRoughness ?? 0
    });
  }
  if ((material.transmission ?? 0) > 0 || material.transmissionTexture) {
    addGLTFMaterialExtension(result, 'KHR_materials_transmission', {
      transmissionFactor: material.transmission ?? 0
    });
  }
  if (material.indexOfRefraction !== undefined && material.indexOfRefraction !== 1.5) {
    addGLTFMaterialExtension(result, 'KHR_materials_ior', {
      ior: material.indexOfRefraction
    });
  }
  if (
    material.sheenColor?.some(component => component !== 0) ||
    (material.sheenRoughness ?? 0) > 0 ||
    material.sheenColorTexture ||
    material.sheenRoughnessTexture
  ) {
    addGLTFMaterialExtension(result, 'KHR_materials_sheen', {
      sheenColorFactor: material.sheenColor || [0, 0, 0],
      sheenRoughnessFactor: material.sheenRoughness ?? 0
    });
  }
  if (
    material.specularColor?.some(component => component !== 1) ||
    (material.specularIntensity !== undefined && material.specularIntensity !== 1) ||
    material.specularColorTexture ||
    material.specularIntensityTexture
  ) {
    addGLTFMaterialExtension(result, 'KHR_materials_specular', {
      specularFactor: material.specularIntensity ?? 1,
      specularColorFactor: material.specularColor || [1, 1, 1]
    });
  }
  if (
    (material.thickness ?? 0) > 0 ||
    material.attenuationDistance !== undefined ||
    material.attenuationColor?.some(component => component !== 1) ||
    material.thicknessTexture
  ) {
    addGLTFMaterialExtension(result, 'KHR_materials_volume', {
      thicknessFactor: material.thickness ?? 0,
      attenuationDistance: material.attenuationDistance,
      attenuationColor: material.attenuationColor
    });
  }
  if (
    (material.iridescence ?? 0) > 0 ||
    material.iridescenceTexture ||
    material.iridescenceThicknessTexture
  ) {
    addGLTFMaterialExtension(result, 'KHR_materials_iridescence', {
      iridescenceFactor: material.iridescence ?? 0,
      iridescenceIor: material.iridescenceIndexOfRefraction,
      iridescenceThicknessMinimum: material.iridescenceThicknessMinimum,
      iridescenceThicknessMaximum: material.iridescenceThicknessMaximum
    });
  }
  if ((material.anisotropyStrength ?? 0) > 0 || material.anisotropyTexture) {
    addGLTFMaterialExtension(result, 'KHR_materials_anisotropy', {
      anisotropyStrength: material.anisotropyStrength ?? 0,
      anisotropyRotation: material.anisotropyRotation ?? 0
    });
  }
  if (material.unlit) {
    addGLTFMaterialExtension(result, 'KHR_materials_unlit', {});
  }

  for (const {slot, pathSegments} of getTextureTransformSlotDefinitions()) {
    const texture = material[`${slot}Texture`];
    if (texture && scene.textures?.[texture]) {
      setNestedGLTFProperty(result, pathSegments, texture);
    }
  }
  return result;
}

function resolveGLTFMaterialTextures(
  material: Record<string, unknown>,
  sourceMaterial: JSONMaterialDeclaration,
  textureIndices: Map<string, number>,
  scene: ANARIJSONScene
): void {
  for (const {slot, pathSegments} of getTextureTransformSlotDefinitions()) {
    const identifier = sourceMaterial[`${slot}Texture`];
    if (!identifier || !scene.textures?.[identifier]) {
      continue;
    }
    const textureIndex = textureIndices.get(identifier);
    if (textureIndex === undefined) {
      continue;
    }
    const textureInfo = makeGLTFTextureInfo(textureIndex, scene.textures[identifier]);
    if (slot === 'normal' && sourceMaterial.normalScale !== undefined) {
      textureInfo.scale = sourceMaterial.normalScale;
    }
    if (slot === 'occlusion' && sourceMaterial.occlusionStrength !== undefined) {
      textureInfo.strength = sourceMaterial.occlusionStrength;
    }
    setNestedGLTFProperty(material, pathSegments, textureInfo);
  }
}

function makeGLTFTextureInfo(
  textureIndex: number,
  texture: JSONTextureDeclaration
): Record<string, unknown> {
  const textureInfo: Record<string, unknown> = {index: textureIndex};
  if (texture.textureCoordinateSet !== undefined) {
    textureInfo.texCoord = texture.textureCoordinateSet;
  }
  if (texture.transform) {
    const [firstColumnX, firstColumnY, , secondColumnX, secondColumnY, , offsetX, offsetY] =
      texture.transform;
    const scaleX = Math.hypot(firstColumnX, firstColumnY);
    const determinant = firstColumnX * secondColumnY - firstColumnY * secondColumnX;
    const scaleY = Math.sign(determinant || 1) * Math.hypot(secondColumnX, secondColumnY);
    const transform: Record<string, unknown> = {
      offset: [offsetX, offsetY],
      rotation: Math.atan2(firstColumnY, firstColumnX),
      scale: [scaleX, scaleY]
    };
    if (texture.textureCoordinateSet !== undefined) {
      transform.texCoord = texture.textureCoordinateSet;
    }
    textureInfo.extensions = {KHR_texture_transform: transform};
  }
  return textureInfo;
}

function setNestedGLTFProperty(
  target: Record<string, unknown>,
  pathSegments: readonly string[],
  value: unknown
): void {
  let object = target;
  for (const segment of pathSegments.slice(0, -1)) {
    object[segment] ||= {};
    object = object[segment] as Record<string, unknown>;
  }
  object[pathSegments[pathSegments.length - 1]] = value;
}

function addGLTFMaterialExtension(
  material: Record<string, unknown>,
  name: string,
  value: Record<string, unknown>
): void {
  material['extensions'] ||= {};
  const extensions = material['extensions'] as Record<string, unknown>;
  extensions[name] = Object.fromEntries(
    Object.entries(value).filter(([_key, entry]) => entry !== undefined)
  );
}

function collectMaterialExtensions(materials: object[]): string[] {
  const extensions = new Set<string>();
  for (const material of materials) {
    const materialExtensions = (material as Record<string, unknown>)['extensions'];
    if (materialExtensions && typeof materialExtensions === 'object') {
      for (const name of Object.keys(materialExtensions)) {
        extensions.add(name);
      }
    }
  }
  return Array.from(extensions);
}

function addGLTFCamera(scene: ANARIJSONScene, nodes: object[]): {camera: object} | undefined {
  if (!scene.camera) {
    return undefined;
  }
  const camera =
    scene.camera['@@type'] === 'orthographic'
      ? {
          name: 'Camera',
          type: 'orthographic',
          orthographic: {
            xmag: scene.camera.height || 10,
            ymag: scene.camera.height || 10,
            znear: scene.camera.near || 0.1,
            zfar: scene.camera.far || 1000
          }
        }
      : {
          name: 'Camera',
          type: 'perspective',
          perspective: {
            yfov: scene.camera.fovy || Math.PI / 3,
            znear: scene.camera.near || 0.1,
            zfar: scene.camera.far || 1000
          }
        };
  nodes.push({name: 'Camera', camera: 0, translation: scene.camera.position || [0, 0, 10]});
  return {camera};
}

function addGLTFLights(scene: ANARIJSONScene, nodes: object[]): object[] | undefined {
  const lights = (scene.lights || []).filter(light => light['@@type'] !== 'ambient');
  if (lights.length === 0) {
    return undefined;
  }
  const result: object[] = [];
  for (const light of lights) {
    const type = light['@@type'] === 'directional' ? 'directional' : light['@@type'];
    result.push({
      name: light['@@id'],
      type,
      color: light.color || [1, 1, 1],
      intensity: light.intensity ?? light.irradiance ?? 1,
      ...(type === 'spot'
        ? {
            spot: {
              innerConeAngle: light.falloffAngle ?? 0,
              outerConeAngle: light.openingAngle ?? Math.PI / 4
            }
          }
        : {})
    });
    nodes.push({
      name: light['@@id'],
      translation: light.position || [0, 0, 0],
      ...(light.direction ? {rotation: makeGLTFLightRotation(light.direction)} : {}),
      extensions: {KHR_lights_punctual: {light: result.length - 1}}
    });
  }
  return result;
}

function makeGLTFLightRotation(direction: readonly number[]): [number, number, number, number] {
  const length = Math.hypot(direction[0], direction[1], direction[2]);
  if (length === 0) {
    return [0, 0, 0, 1];
  }
  const normalizedX = direction[0] / length;
  const normalizedY = direction[1] / length;
  const normalizedZ = direction[2] / length;
  const cosine = -normalizedZ;
  if (cosine <= -0.999999) {
    return [0, 1, 0, 0];
  }
  if (cosine >= 0.999999) {
    return [0, 0, 0, 1];
  }

  const scale = Math.sqrt((1 + cosine) * 2);
  return [normalizedY / scale, -normalizedX / scale, 0, scale * 0.5];
}

function appendUSDMaterial(
  lines: string[],
  identifier: string,
  material: JSONMaterialDeclaration,
  scene: ANARIJSONScene
): void {
  const name = sanitizeIdentifier(identifier);
  const color = material.baseColor || material.color || [0.8, 0.8, 0.8];
  const textureName = material.baseColorTexture;
  const source = textureName ? scene.textures?.[textureName]?.source : undefined;
  lines.push('        def Material "' + name + '"');
  lines.push('        {');
  lines.push(
    '            token outputs:surface.connect = </World/Materials/' +
      name +
      '/Preview.outputs:surface>'
  );
  lines.push('            def Shader "Preview"');
  lines.push('            {');
  lines.push('                uniform token info:id = "UsdPreviewSurface"');
  if (source && !source.startsWith('blob:')) {
    lines.push(
      '                color3f inputs:diffuseColor.connect = </World/Materials/' +
        name +
        '/BaseColorTexture.outputs:rgb>'
    );
  } else {
    lines.push('                color3f inputs:diffuseColor = ' + formatUSDVector(color));
  }
  lines.push('                float inputs:metallic = ' + (material.metallic ?? 0));
  lines.push('                float inputs:roughness = ' + (material.roughness ?? 0.38));
  if (material.emissive) {
    lines.push(
      '                color3f inputs:emissiveColor = ' + formatUSDVector(material.emissive)
    );
  }
  lines.push('                token outputs:surface');
  lines.push('            }');
  if (source && !source.startsWith('blob:')) {
    lines.push('            def Shader "BaseColorTexture"');
    lines.push('            {');
    lines.push('                uniform token info:id = "UsdUVTexture"');
    lines.push('                asset inputs:file = @' + source + '@');
    lines.push('                vector3f outputs:rgb');
    lines.push('            }');
  }
  lines.push('        }');
}

function appendUSDMesh(
  lines: string[],
  identifier: string,
  mesh: MeshData,
  material: string
): void {
  const name = sanitizeIdentifier(identifier);
  lines.push('        def Mesh "' + name + '"');
  lines.push('        {');
  lines.push('            point3f[] points = ' + formatUSDVectors(mesh.positions, 3));
  lines.push(
    '            int[] faceVertexCounts = ' +
      formatUSDArray(new Array(mesh.indices.length / 3).fill(3))
  );
  lines.push('            int[] faceVertexIndices = ' + formatUSDArray(mesh.indices));
  if (mesh.normals.length > 0) {
    lines.push('            normal3f[] normals = ' + formatUSDVectors(mesh.normals, 3));
    lines.push('            uniform token normalsInterpolation = "vertex"');
  }
  if (mesh.textureCoordinates) {
    lines.push(
      '            texCoord2f[] primvars:st = ' + formatUSDVectors(mesh.textureCoordinates, 2)
    );
    lines.push('            uniform token primvars:st:interpolation = "vertex"');
  }
  lines.push(
    '            rel material:binding = </World/Materials/' + sanitizeIdentifier(material) + '>'
  );
  lines.push('        }');
}

function appendUSDCamera(lines: string[], scene: ANARIJSONScene): void {
  lines.push('    def Camera "Camera"');
  lines.push('    {');
  lines.push('        float focalLength = 50');
  lines.push(
    '        float clippingRange = (' +
      (scene.camera.near || 0.1) +
      ', ' +
      (scene.camera.far || 1000) +
      ')'
  );
  lines.push('    }');
}

function appendUSDLights(lines: string[], scene: ANARIJSONScene): void {
  for (const light of scene.lights || []) {
    if (light['@@type'] === 'ambient') {
      continue;
    }
    const type = light['@@type'] === 'directional' ? 'DistantLight' : 'SphereLight';
    lines.push('    def ' + type + ' "' + sanitizeIdentifier(light['@@id']) + '"');
    lines.push('    {');
    lines.push('        color3f inputs:color = ' + formatUSDVector(light.color || [1, 1, 1]));
    lines.push('        float inputs:intensity = ' + (light.intensity || light.irradiance || 1));
    lines.push('    }');
  }
}

function addFloatAccessor(
  values: number[],
  components: 2 | 3,
  builder: BinaryBufferBuilder,
  bufferViews: GLTFBufferView[],
  accessors: GLTFAccessor[]
): number {
  const bytes = new Uint8Array(new Float32Array(values).buffer);
  const bufferView = addBufferView(bytes, 34962, builder, bufferViews);
  const accessor: GLTFAccessor = {
    bufferView,
    componentType: 5126,
    count: values.length / components,
    type: components === 2 ? 'VEC2' : 'VEC3'
  };
  if (components === 3) {
    accessor.min = getComponentExtrema(values, components, Math.min);
    accessor.max = getComponentExtrema(values, components, Math.max);
  }
  accessors.push(accessor);
  return accessors.length - 1;
}

function addIndexAccessor(
  values: number[],
  builder: BinaryBufferBuilder,
  bufferViews: GLTFBufferView[],
  accessors: GLTFAccessor[]
): number {
  const useUint32 = values.some(value => value > 65535);
  const bytes = useUint32
    ? new Uint8Array(new Uint32Array(values).buffer)
    : new Uint8Array(new Uint16Array(values).buffer);
  const bufferView = addBufferView(bytes, 34963, builder, bufferViews);
  accessors.push({
    bufferView,
    componentType: useUint32 ? 5125 : 5123,
    count: values.length,
    type: 'SCALAR'
  });
  return accessors.length - 1;
}

function addBufferView(
  bytes: Uint8Array,
  target: number,
  builder: BinaryBufferBuilder,
  bufferViews: GLTFBufferView[]
): number {
  const byteOffset = builder.append(bytes);
  bufferViews.push({buffer: 0, byteOffset, byteLength: bytes.byteLength, target});
  return bufferViews.length - 1;
}

class BinaryBufferBuilder {
  private bytes: number[] = [];

  get length(): number {
    return this.bytes.length;
  }

  append(values: Uint8Array): number {
    while (this.bytes.length % 4 !== 0) {
      this.bytes.push(0);
    }
    const offset = this.bytes.length;
    this.bytes.push(...values);
    return offset;
  }

  toDataURI(): string {
    return 'data:application/octet-stream;base64,' + encodeBase64(new Uint8Array(this.bytes));
  }
}

async function makeDataURI(source: string): Promise<string> {
  if (source.startsWith('data:')) {
    return source;
  }
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error('Unable to export texture "' + source + '": ' + response.status + '.');
  }
  const mimeType = response.headers.get('content-type') || 'image/png';
  return (
    'data:' + mimeType + ';base64,' + encodeBase64(new Uint8Array(await response.arrayBuffer()))
  );
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function toNumberArray(values: unknown): number[] {
  if (!values || typeof values !== 'object') {
    return [];
  }
  if (Array.isArray(values) || ArrayBuffer.isView(values)) {
    return Array.from(values as ArrayLike<number>);
  }
  if ('data' in values && (Array.isArray(values.data) || ArrayBuffer.isView(values.data))) {
    return Array.from(values.data as ArrayLike<number>);
  }
  return [];
}

function makeSequentialIndices(count: number): number[] {
  return Array.from({length: count}, (_value, index) => index);
}

function getComponentExtrema(
  values: number[],
  components: number,
  operation: (first: number, second: number) => number
): number[] {
  const extrema = values.slice(0, components);
  for (let offset = components; offset < values.length; offset += components) {
    for (let component = 0; component < components; component++) {
      extrema[component] = operation(extrema[component], values[offset + component]);
    }
  }
  return extrema;
}

function formatUSDVector(values: ArrayLike<number>): string {
  return '(' + Array.from(values).slice(0, 3).join(', ') + ')';
}

function formatUSDVectors(values: number[], components: number): string {
  const vectors: string[] = [];
  for (let offset = 0; offset < values.length; offset += components) {
    vectors.push('(' + values.slice(offset, offset + components).join(', ') + ')');
  }
  return '[' + vectors.join(', ') + ']';
}

function formatUSDArray(values: number[]): string {
  return '[' + values.join(', ') + ']';
}

function formatUSDMatrix(values: readonly number[]): string {
  const rows: string[] = [];
  for (let row = 0; row < 4; row++) {
    rows.push(
      '(' + [values[row], values[row + 4], values[row + 8], values[row + 12]].join(', ') + ')'
    );
  }
  return '(' + rows.join(', ') + ')';
}

function sanitizeIdentifier(identifier: string): string {
  return identifier.replace(/[^A-Za-z0-9_]/g, '_') || 'Object';
}
