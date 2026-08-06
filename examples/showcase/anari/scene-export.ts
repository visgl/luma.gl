import {
  convertSamplerToGLTF,
  exportGLTF,
  type GLTFExportAccessor,
  type GLTFExportAnimation,
  type GLTFExportAnimationChannel,
  type GLTFExportAnimationSampler,
  type GLTFExportMesh,
  type GLTFExportNode,
  type GLTFExportPrimitive,
  type GLTFExportScene,
  type GLTFExportSkin,
  getTextureTransformSlotDefinitions
} from '@luma.gl/gltf';
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

export function exportANARIJSONSceneToGLTF(
  scene: ANARIJSONScene,
  options?: {binary?: false}
): Promise<string>;
export function exportANARIJSONSceneToGLTF(
  scene: ANARIJSONScene,
  options: {binary: true}
): Promise<ArrayBuffer>;
export async function exportANARIJSONSceneToGLTF(
  scene: ANARIJSONScene,
  options: {binary?: boolean} = {}
): Promise<string | ArrayBuffer> {
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

  const meshes: GLTFExportMesh[] = [];
  const meshIndices = new Map<string, number>();
  for (const [surfaceIdentifier, surface] of Object.entries(scene.surfaces)) {
    const geometry = scene.geometries[surface.geometry];
    if (!geometry) {
      continue;
    }
    const meshData = bakeGeometry(geometry);
    const primitive = makeExportPrimitive(
      meshData,
      geometry,
      materialIndices.get(surface.material) || 0
    );
    meshIndices.set(surfaceIdentifier, meshes.length);
    meshes.push({
      name: surfaceIdentifier,
      primitives: [primitive],
      ...(geometry.morphWeights ? {weights: [...geometry.morphWeights]} : {})
    });
  }

  const {nodes, nodeIndices} = makeExportNodes(scene, meshIndices);
  const skins = makeExportSkins(scene, nodes, nodeIndices);
  const cameraNode = addGLTFCamera(scene, nodes);
  const lightExtension = addGLTFLights(scene, nodes);
  const gltf: GLTFExportScene = {
    name: scene.name,
    generator: '@luma.gl/anari via @luma.gl/gltf',
    nodes,
    meshes,
    materials,
    ...(skins.length > 0 ? {skins} : {}),
    ...(cameraNode ? {cameras: [cameraNode.camera]} : {}),
    ...(lightExtension ? {extensions: {KHR_lights_punctual: {lights: lightExtension}}} : {})
  };
  if (textureEntries.length > 0) {
    gltf.images = textureEntries.map(entry => ({name: entry.identifier, uri: entry.uri}));
    const samplerIndices = new Map<string, number>();
    const samplers: ReturnType<typeof convertSamplerToGLTF>[] = [];
    gltf.textures = textureEntries.map((entry, index) => {
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
    gltf.samplers = samplers;
  }
  const animations = makeExportAnimations(scene, nodeIndices, materialIndices);
  if (animations.length > 0) {
    gltf.animations = animations;
  }
  return options.binary ? exportGLTF(gltf, {binary: true}) : exportGLTF(gltf);
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

function makeExportPrimitive(
  mesh: MeshData,
  geometry: JSONGeometryDeclaration,
  material: number
): GLTFExportPrimitive {
  const vertexCount = mesh.positions.length / 3;
  const attributes: Record<string, GLTFExportAccessor> = {
    POSITION: {data: new Float32Array(mesh.positions), size: 3}
  };
  if (mesh.normals.length > 0) {
    attributes['NORMAL'] = {data: new Float32Array(mesh.normals), size: 3};
  }
  if (mesh.textureCoordinates) {
    attributes['TEXCOORD_0'] = {data: new Float32Array(mesh.textureCoordinates), size: 2};
  }
  if (mesh.additionalTextureCoordinates) {
    attributes['TEXCOORD_1'] = {
      data: new Float32Array(mesh.additionalTextureCoordinates),
      size: 2
    };
  }
  if (mesh.colors) {
    const componentCount = mesh.colors.length === vertexCount * 4 ? 4 : 3;
    attributes['COLOR_0'] = {data: new Float32Array(mesh.colors), size: componentCount};
  }
  if (geometry['vertex.tangent']) {
    attributes['TANGENT'] = {data: new Float32Array(geometry['vertex.tangent']), size: 4};
  }
  if (geometry['vertex.joint']) {
    const jointValues = geometry['vertex.joint'];
    const joints = jointValues.some(value => value > 255)
      ? new Uint16Array(jointValues)
      : new Uint8Array(jointValues);
    attributes['JOINTS_0'] = {data: joints, size: 4};
  }
  if (geometry['vertex.weight']) {
    attributes['WEIGHTS_0'] = {data: new Float32Array(geometry['vertex.weight']), size: 4};
  }

  const indices = mesh.indices.some(index => index > 65535)
    ? new Uint32Array(mesh.indices)
    : new Uint16Array(mesh.indices);
  const targets = geometry.morphTargets?.map(target => {
    const attributes: Record<string, GLTFExportAccessor> = {};
    for (const name of ['POSITION', 'NORMAL', 'TANGENT'] as const) {
      if (target[name]) {
        attributes[name] = {data: new Float32Array(target[name]), size: 3};
      }
    }
    return attributes;
  });

  return {
    attributes,
    indices: {data: indices, size: 1},
    material,
    ...(targets?.length ? {targets} : {})
  };
}

function makeExportNodes(
  scene: ANARIJSONScene,
  meshIndices: ReadonlyMap<string, number>
): {nodes: GLTFExportNode[]; nodeIndices: Map<string, number>} {
  const nodes: GLTFExportNode[] = [];
  const nodeIndices = new Map<string, number>();
  const nodeDeclarations = scene.nodes || {};

  for (const [identifier, declaration] of Object.entries(nodeDeclarations)) {
    const node: GLTFExportNode = {
      name: identifier,
      ...(declaration.translation ? {translation: [...declaration.translation]} : {}),
      ...(declaration.rotation ? {rotation: [...declaration.rotation]} : {}),
      ...(declaration.scale ? {scale: [...declaration.scale]} : {}),
      ...(declaration.matrix ? {matrix: [...declaration.matrix]} : {}),
      ...(declaration.weights ? {weights: [...declaration.weights]} : {})
    };
    nodeIndices.set(identifier, nodes.length);
    nodes.push(node);
  }

  const boundInstances = new Set<string>();
  for (const [identifier, declaration] of Object.entries(nodeDeclarations)) {
    const nodeIndex = nodeIndices.get(identifier)!;
    const node = nodes[nodeIndex];
    if (declaration.parent) {
      const parent = nodeIndices.get(declaration.parent);
      if (parent !== undefined) {
        nodes[parent].children = [...(nodes[parent].children || []), nodeIndex];
      }
    }

    for (const instanceIdentifier of declaration.instances || []) {
      boundInstances.add(instanceIdentifier);
      const instance = scene.instances?.find(candidate => candidate['@@id'] === instanceIdentifier);
      const surfaces = instance?.surface
        ? [instance.surface]
        : instance?.group
          ? scene.groups?.[instance.group]?.surfaces || []
          : [];
      for (const surface of surfaces) {
        const mesh = meshIndices.get(surface);
        if (mesh === undefined) {
          continue;
        }
        if (node.mesh === undefined) {
          node.mesh = mesh;
        } else {
          nodes.push({name: `${instanceIdentifier}-${surface}`, mesh});
          node.children = [...(node.children || []), nodes.length - 1];
        }
      }
    }
  }

  for (const placement of collectSurfacePlacements(scene)) {
    const instanceIdentifier = scene.instances?.find(instance =>
      placement.identifier.startsWith(`${instance['@@id']}-`)
    )?.['@@id'];
    if (instanceIdentifier && boundInstances.has(instanceIdentifier)) {
      continue;
    }
    const mesh = meshIndices.get(placement.surface);
    if (mesh === undefined) {
      continue;
    }
    const node = {name: placement.identifier, mesh, matrix: Array.from(placement.matrix)};
    nodeIndices.set(placement.identifier, nodes.length);
    nodes.push(node);
  }

  return {nodes, nodeIndices};
}

function makeExportAnimations(
  scene: ANARIJSONScene,
  nodeIndices: ReadonlyMap<string, number>,
  materialIndices: ReadonlyMap<string, number>
): GLTFExportAnimation[] {
  return (scene.clips || []).flatMap(clip => {
    const samplers: GLTFExportAnimationSampler[] = [];
    const channels: GLTFExportAnimationChannel[] = [];
    for (const track of clip.tracks) {
      const target = makeExportAnimationTarget(track.target, scene, nodeIndices, materialIndices);
      if (!target || track.times.length === 0 || track.values.length === 0) {
        continue;
      }

      const componentCount = target.path === 'weights' ? 1 : track.values[0]?.length || 1;
      if (componentCount < 1 || componentCount > 4) {
        continue;
      }
      samplers.push({
        input: {data: new Float32Array(track.times), size: 1},
        output: {
          data: new Float32Array(track.values.flat()),
          size: componentCount as 1 | 2 | 3 | 4
        },
        ...(track.interpolation ? {interpolation: track.interpolation} : {})
      });
      channels.push({sampler: samplers.length - 1, target});
    }
    return channels.length > 0 ? [{name: clip.name, samplers, channels}] : [];
  });
}

function makeExportSkins(
  scene: ANARIJSONScene,
  nodes: GLTFExportNode[],
  nodeIndices: ReadonlyMap<string, number>
): GLTFExportSkin[] {
  const skins: GLTFExportSkin[] = [];
  const skinIndices = new Map<string, number>();

  for (const [identifier, surface] of Object.entries(scene.surfaces)) {
    const skin = (
      surface as typeof surface & {
        skin?: {
          node: string;
          joints: readonly string[];
          inverseBindMatrices?: readonly number[];
        };
      }
    ).skin;
    if (!skin) {
      continue;
    }
    const node = nodeIndices.get(skin.node);
    if (node === undefined) {
      continue;
    }
    const joints = skin.joints.map(joint => nodeIndices.get(joint));
    if (joints.some(joint => joint === undefined)) {
      continue;
    }
    const key = JSON.stringify({
      joints,
      inverseBindMatrices: skin.inverseBindMatrices
    });
    let index = skinIndices.get(key);
    if (index === undefined) {
      index = skins.length;
      skins.push({
        name: `${identifier}-skin`,
        joints: joints as number[],
        ...(skin.inverseBindMatrices
          ? {
              inverseBindMatrices: {
                data: new Float32Array(skin.inverseBindMatrices),
                size: 16
              }
            }
          : {})
      });
      skinIndices.set(key, index);
    }
    nodes[node].skin = index;
  }

  return skins;
}

function makeExportAnimationTarget(
  target: NonNullable<ANARIJSONScene['clips']>[number]['tracks'][number]['target'],
  scene: ANARIJSONScene,
  nodeIndices: ReadonlyMap<string, number>,
  materialIndices: ReadonlyMap<string, number>
): GLTFExportAnimationChannel['target'] | undefined {
  if (target.type === 'node') {
    const node = nodeIndices.get(target.identifier);
    const path = target.path;
    if (
      node !== undefined &&
      (path === 'translation' || path === 'rotation' || path === 'scale' || path === 'weights')
    ) {
      return {node, path};
    }
  }

  if (target.type === 'material') {
    const material = materialIndices.get(target.identifier);
    const property = getMaterialAnimationPointer(target.path);
    if (material !== undefined && property) {
      const component =
        target.path === 'opacity'
          ? '/3'
          : target.component !== undefined
            ? `/${target.component}`
            : '';
      return {path: 'pointer', pointer: `/materials/${material}/${property}${component}`};
    }
  }

  if (target.type === 'sampler') {
    for (const [identifier, material] of Object.entries(scene.materials)) {
      const materialIndex = materialIndices.get(identifier);
      if (materialIndex === undefined) {
        continue;
      }
      for (const {slot, pathSegments} of getTextureTransformSlotDefinitions()) {
        if (material[`${slot}Texture`] === target.identifier) {
          const component = target.component !== undefined ? `/${target.component}` : '';
          return {
            path: 'pointer',
            pointer:
              `/materials/${materialIndex}/${pathSegments.join('/')}` +
              `/extensions/KHR_texture_transform/${target.path}${component}`
          };
        }
      }
    }
  }

  if (target.type === 'light') {
    const index = (scene.lights || [])
      .filter(light => light['@@type'] !== 'ambient')
      .findIndex(light => light['@@id'] === target.identifier);
    if (index >= 0) {
      return {
        path: 'pointer',
        pointer: `/extensions/KHR_lights_punctual/lights/${index}/${target.path}`
      };
    }
  }

  if (target.type === 'camera' && scene.camera) {
    const cameraPath =
      target.path === 'fovy'
        ? 'perspective/yfov'
        : target.path === 'near'
          ? `${scene.camera['@@type']}/znear`
          : target.path === 'far'
            ? `${scene.camera['@@type']}/zfar`
            : undefined;
    return cameraPath ? {path: 'pointer', pointer: `/cameras/0/${cameraPath}`} : undefined;
  }

  return undefined;
}

function getMaterialAnimationPointer(path: string): string | undefined {
  const properties: Record<string, string> = {
    baseColor: 'pbrMetallicRoughness/baseColorFactor',
    opacity: 'pbrMetallicRoughness/baseColorFactor',
    metallic: 'pbrMetallicRoughness/metallicFactor',
    roughness: 'pbrMetallicRoughness/roughnessFactor',
    emissive: 'emissiveFactor',
    alphaCutoff: 'alphaCutoff',
    specularColor: 'extensions/KHR_materials_specular/specularColorFactor',
    specularIntensity: 'extensions/KHR_materials_specular/specularFactor',
    indexOfRefraction: 'extensions/KHR_materials_ior/ior',
    transmission: 'extensions/KHR_materials_transmission/transmissionFactor',
    thickness: 'extensions/KHR_materials_volume/thicknessFactor',
    attenuationDistance: 'extensions/KHR_materials_volume/attenuationDistance',
    attenuationColor: 'extensions/KHR_materials_volume/attenuationColor',
    clearcoat: 'extensions/KHR_materials_clearcoat/clearcoatFactor',
    clearcoatRoughness: 'extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor',
    sheenColor: 'extensions/KHR_materials_sheen/sheenColorFactor',
    sheenRoughness: 'extensions/KHR_materials_sheen/sheenRoughnessFactor',
    iridescence: 'extensions/KHR_materials_iridescence/iridescenceFactor',
    iridescenceIndexOfRefraction: 'extensions/KHR_materials_iridescence/iridescenceIor',
    iridescenceThicknessMinimum: 'extensions/KHR_materials_iridescence/iridescenceThicknessMinimum',
    iridescenceThicknessMaximum: 'extensions/KHR_materials_iridescence/iridescenceThicknessMaximum',
    anisotropyStrength: 'extensions/KHR_materials_anisotropy/anisotropyStrength',
    anisotropyRotation: 'extensions/KHR_materials_anisotropy/anisotropyRotation',
    emissiveStrength: 'extensions/KHR_materials_emissive_strength/emissiveStrength'
  };
  return properties[path];
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
  const alpha = material.opacity ?? (baseColor.length > 3 ? (baseColor[3] ?? 1) : 1);
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
  const dispersion = (material as typeof material & {dispersion?: number}).dispersion;
  if ((dispersion ?? 0) > 0) {
    addGLTFMaterialExtension(result, 'KHR_materials_dispersion', {dispersion});
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

function addGLTFCamera(
  scene: ANARIJSONScene,
  nodes: GLTFExportNode[]
): {camera: Record<string, unknown>} | undefined {
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

function addGLTFLights(scene: ANARIJSONScene, nodes: GLTFExportNode[]): object[] | undefined {
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
