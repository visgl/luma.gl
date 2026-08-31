import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {ANARIDevice} from '@luma.gl/scene';
import {makeANARIAnimationScene} from '@luma.gl/scene/gltf';
import {ANARISceneSchema} from '@luma.gl/scene/schemas';
import {getTextureTransformSlotDefinitions, parseGLTFLights} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';
import {makeANARIJSONSceneFromGLTF} from '../../../examples/showcase/scene/gltf-to-anari';

it('glTF importer translates indexed meshes into retained ANARI scenes', async () => {
  const assetData = await readFile(new URL('../../../test/data/box.glb', import.meta.url));
  const asset = await parse(assetData, GLTFLoader, {gltf: {loadImages: false}});
  const scene = await makeANARIJSONSceneFromGLTF(postProcessGLTF(asset), 'TEST BOX');
  const sourceGeometries = Object.values(scene.geometries).filter(
    geometry => geometry['@@type'] === 'triangle'
  );

  expect(scene.name, 'the imported scene retains its selected title').toBe('TEST BOX');
  expect(
    Boolean(sourceGeometries.length > 0),
    'glTF mesh primitives become triangle geometries'
  ).toBe(true);
  expect(
    Boolean(sourceGeometries.some(geometry => (geometry['primitive.index']?.length || 0) > 0)),
    'indexed meshes preserve their source index buffers'
  ).toBe(true);
  expect(
    Boolean((scene.instances?.length || 0) > 1),
    'mesh placements and studio emitters coexist'
  ).toBe(true);
  expect(
    (scene.lights || []).filter(light => light.animation?.['@@type'] === 'follow').length,
    'studio point lights follow visible HDR emitter instances'
  ).toBe(2);
  expect(
    Boolean(ANARISceneSchema.safeParse(scene).success),
    'imported scenes satisfy the JSON schema'
  ).toBe(true);
  void 0;
});

it('glTF importer handles detailed bundled CC0 production assets', async () => {
  const assetData = await readFile(
    new URL('../../../examples/showcase/scene/public/gltf/Lantern.glb', import.meta.url)
  );
  const asset = await parse(assetData, GLTFLoader, {gltf: {loadImages: false}});
  const scene = await makeANARIJSONSceneFromGLTF(postProcessGLTF(asset), 'BRASS LANTERN');

  expect(
    Boolean(Object.keys(scene.geometries).length > 3),
    'multiple production meshes are retained'
  ).toBe(true);
  expect(
    Boolean(Object.keys(scene.materials).length > 2),
    'source and studio materials coexist'
  ).toBe(true);
  expect(Object.keys(scene.textures || {}).length, 'all Lantern PBR maps are retained').toBe(4);
  expect(
    Boolean(
      Object.values(scene.materials).some(
        material =>
          material.baseColorTexture &&
          material.normalTexture &&
          material.metallicRoughnessTexture &&
          material.emissiveTexture &&
          material.emissiveStrength === 1
      )
    ),
    'Lantern material retains PBR maps and its authored glTF emissive-strength default'
  ).toBe(true);
  expect(
    Boolean(
      Object.values(scene.geometries).some(
        geometry => (geometry['vertex.attribute1']?.length || 0) > 0
      )
    ),
    'glTF texture coordinates remain editable retained geometry data'
  ).toBe(true);
  expect(
    Boolean(
      Object.values(scene.geometries).some(
        geometry => (geometry['primitive.index']?.length || 0) > 1000
      )
    ),
    'detailed indexed production geometry remains intact'
  ).toBe(true);
  expect(
    Boolean(Math.hypot(...(scene.camera.position || [0, 0, 0])) < 30),
    'large or tiny source assets are normalized into the studio presentation'
  ).toBe(true);
  expect(
    Boolean(ANARISceneSchema.safeParse(scene).success),
    'production scenes remain editor-safe'
  ).toBe(true);
  void 0;
});

it('glTF importer preserves animated node hierarchy and source-faithful materials', async () => {
  const assetData = await readFile(new URL('../../../test/data/BoxAnimated.glb', import.meta.url));
  const asset = await parse(assetData, GLTFLoader, {gltf: {loadImages: false}});
  const source = postProcessGLTF(asset);
  const scene = await makeANARIJSONSceneFromGLTF(source, 'ANIMATED BOX');

  expect(scene.clips?.length, 'the authored glTF animation becomes one retained clip').toBe(1);
  expect(scene.clips?.[0]?.tracks.length, 'both authored transform channels survive').toBe(2);
  expect(scene.playback?.clip, 'the imported clip is selected').toBe(scene.clips?.[0]?.name);
  expect(
    Boolean(scene.clips?.[0]?.tracks.every(track => track.target.type === 'node')),
    'transform channels retain stable source-node identity'
  ).toBe(true);
  expect(
    Boolean(Object.values(scene.nodes || {}).some(node => !node.instances?.length)),
    'meshless parent nodes remain in the retained hierarchy'
  ).toBe(true);
  expect(
    Boolean(Object.values(scene.nodes || {}).some(node => node.instances?.length)),
    'mesh nodes reference existing retained surface instances'
  ).toBe(true);
  expect(
    Boolean(Object.values(scene.nodes || {}).some(node => node.matrix && !node.parent)),
    'studio normalization remains an explicit animation-hierarchy root'
  ).toBe(true);
  expect(
    Boolean(ANARISceneSchema.safeParse(scene).success),
    'animated retained scenes round-trip through the existing JSON schema'
  ).toBe(true);
  void 0;
});

it('glTF importer retains real KHR_animation_pointer material channels', async () => {
  // Khronos glTF-Sample-Assets AnimatedColorsCube by Ed Mackey, dedicated CC0-1.0.
  const assetData = await readFile(
    new URL('../../../examples/showcase/scene/public/gltf/AnimatedColorsCube.glb', import.meta.url)
  );
  const asset = await parse(assetData, GLTFLoader, {gltf: {loadImages: false}});
  const source = postProcessGLTF(asset);
  const scene = await makeANARIJSONSceneFromGLTF(source, 'ANIMATED COLORS CUBE');
  const clip = scene.clips?.[0];
  const colorTrack = clip?.tracks.find(track => track.target.type === 'material');

  expect(clip?.name, 'the authored animated sample retains its name').toBe('Cube Animation');
  expect(clip?.tracks.length, 'translation, rotation, and material channels survive').toBe(3);
  expect(colorTrack?.target.path, 'the JSON pointer targets retained color').toBe('baseColor');
  expect(colorTrack?.times.length, 'all authored material keyframes are retained').toBe(151);
  expect(colorTrack?.values[0].length, 'animated color remains a linear RGBA value').toBe(4);
  expect(
    Boolean(clip?.tracks.every(track => track.target.path !== 'opacity')),
    'opaque source materials do not acquire animated blend opacity'
  ).toBe(true);
  if (colorTrack) {
    const materialDescription = scene.materials[colorTrack.target.identifier];
    expect(
      materialDescription.alphaMode,
      'the imported material preserves its authored opaque alpha mode'
    ).toBe('opaque');
    expect(
      materialDescription.doubleSided,
      'materials preserve the glTF default of one-sided rendering'
    ).toBe(false);
    const device = new ANARIDevice(new NullDevice({}));
    const material = device.newMaterial(materialDescription['@@type'], {
      baseColor: materialDescription.baseColor,
      alphaMode: materialDescription.alphaMode
    });
    const playback = makeANARIAnimationScene(scene, {
      instances: new Map(),
      materials: new Map([[colorTrack.target.identifier, material]])
    });
    playback.seek(2.75);
    expect(
      material.getParameter('baseColor'),
      'short material samplers clamp while the longer node animation continues'
    ).toEqual(colorTrack.values.at(-1));
    playback.seek(3);
    expect(
      material.getParameter('baseColor'),
      'the shared action loops once at the complete clip boundary'
    ).toEqual(colorTrack.values[0]);
    device.destroy();
  }
  expect(
    Boolean(ANARISceneSchema.safeParse(scene).success),
    'material-pointer scenes remain editable, serializable retained JSON'
  ).toBe(true);
  void 0;
});

it('glTF importer retains secondary texture coordinates and transform UV overrides', async () => {
  const assetData = await readFile(
    new URL('../../../examples/showcase/scene/public/gltf/Lantern.glb', import.meta.url)
  );
  const asset = await parse(assetData, GLTFLoader, {gltf: {loadImages: false}});
  const source = postProcessGLTF(asset);
  const primitive = source.meshes
    .flatMap(mesh => mesh.primitives)
    .find(candidate => candidate.attributes['TEXCOORD_0'] && candidate.material);
  const textureInfo = primitive?.material?.pbrMetallicRoughness?.baseColorTexture;
  if (!primitive || !textureInfo) {
    expect(false, 'the bundled Lantern should provide editable textured mesh primitives').toBe(
      true
    );
    return;
  }
  primitive.attributes['TEXCOORD_1'] = primitive.attributes['TEXCOORD_0'];
  primitive.material!.alphaMode = 'MASK';
  primitive.material!.alphaCutoff = 0.35;
  primitive.material!.doubleSided = true;
  textureInfo.texCoord = 0;
  textureInfo.extensions = {
    ...textureInfo.extensions,
    KHR_texture_transform: {offset: [0.25, 0.5], texCoord: 1}
  };

  const scene = await makeANARIJSONSceneFromGLTF(source, 'SECONDARY UV LANTERN');
  const secondaryUVMaterial = Object.values(scene.materials).find(material => {
    const textureIdentifier = material.baseColorTexture;
    return textureIdentifier && scene.textures?.[textureIdentifier]?.textureCoordinateSet === 1;
  });

  expect(
    Boolean(
      Object.values(scene.geometries).some(
        geometry => (geometry['vertex.attribute2']?.length || 0) > 0
      )
    ),
    'TEXCOORD_1 accessors survive as editable retained geometry'
  ).toBe(true);
  expect(
    Boolean(secondaryUVMaterial),
    'KHR_texture_transform texCoord overrides the original textureInfo UV set'
  ).toBe(true);
  if (secondaryUVMaterial?.baseColorTexture) {
    const texture = scene.textures?.[secondaryUVMaterial.baseColorTexture];
    expect(texture?.textureCoordinateSet, 'the sampler retains its selected UV set').toBe(1);
    expect(Boolean(texture?.transform), 'the authored texture transform remains attached').toBe(
      true
    );
    expect(secondaryUVMaterial.alphaMode, 'the authored alpha mode is retained').toBe('mask');
    expect(secondaryUVMaterial.alphaCutoff, 'the authored alpha cutoff is retained').toBe(0.35);
    expect(
      Boolean(secondaryUVMaterial.doubleSided),
      'authored double-sided rendering is retained'
    ).toBe(true);
  }
  expect(
    Boolean(ANARISceneSchema.safeParse(scene).success),
    'secondary-UV glTF scenes remain valid retained JSON'
  ).toBe(true);
  void 0;
});

it('glTF importer retains all canonical PBR textures, factors, color spaces, and authored samplers', async () => {
  const assetData = await readFile(
    new URL('../../../examples/showcase/scene/public/gltf/Lantern.glb', import.meta.url)
  );
  const source = postProcessGLTF(await parse(assetData, GLTFLoader, {gltf: {loadImages: false}}));
  const primitive = source.meshes
    .flatMap(mesh => mesh.primitives)
    .find(candidate => candidate.attributes['TEXCOORD_0'] && candidate.material);
  if (!primitive?.material) {
    expect(false, 'the bundled Lantern should expose an editable physically based material').toBe(
      true
    );
    return;
  }

  primitive.attributes['TEXCOORD_1'] = primitive.attributes['TEXCOORD_0'];
  const material = primitive.material;
  material.alphaMode = 'MASK';
  material.alphaCutoff = 0.35;
  material.doubleSided = true;
  material.emissiveFactor = [0.2, 0.3, 0.4];
  material.extensions = {
    EXT_materials_bump: {bumpFactor: 0.68},
    KHR_materials_specular: {specularFactor: 0.42, specularColorFactor: [0.3, 0.4, 0.5]},
    KHR_materials_ior: {ior: 1.7},
    KHR_materials_transmission: {transmissionFactor: 0.56},
    KHR_materials_diffuse_transmission: {
      diffuseTransmissionFactor: 0.77,
      diffuseTransmissionColorFactor: [0.9, 0.45, 0.2]
    },
    KHR_materials_dispersion: {dispersion: 2.4},
    KHR_materials_volume: {
      thicknessFactor: 0.6,
      attenuationDistance: 2.5,
      attenuationColor: [0.7, 0.8, 0.9]
    },
    KHR_materials_volume_scatter: {
      multiscatterColorFactor: [0.8, 0.35, 0.15],
      scatterAnisotropy: 0.42
    },
    KHR_materials_clearcoat: {clearcoatFactor: 0.7, clearcoatRoughnessFactor: 0.23},
    KHR_materials_sheen: {sheenColorFactor: [0.11, 0.22, 0.33], sheenRoughnessFactor: 0.44},
    KHR_materials_iridescence: {
      iridescenceFactor: 0.55,
      iridescenceIor: 1.45,
      iridescenceThicknessMinimum: 65,
      iridescenceThicknessMaximum: 375
    },
    KHR_materials_anisotropy: {anisotropyStrength: 0.63, anisotropyRotation: 0.72},
    KHR_materials_emissive_strength: {emissiveStrength: 3.5},
    KHR_materials_unlit: {}
  };

  const sourceTexture = source.textures[0];
  const clampedTexture = {
    ...sourceTexture,
    id: 'authored-clamped-image',
    sampler: {
      id: 'authored-clamped-sampler',
      parameters: {10240: 9728, 10241: 9986, 10242: 33071, 10243: 33648}
    }
  };
  const repeatedTexture = {
    ...sourceTexture,
    id: 'authored-repeated-image',
    sampler: {
      id: 'authored-repeated-sampler',
      parameters: {10240: 9729, 10241: 9729, 10242: 10497, 10243: 10497}
    }
  };

  for (const {slot, pathSegments} of getTextureTransformSlotDefinitions()) {
    let property = material as unknown as Record<string, any>;
    for (const pathSegment of pathSegments.slice(0, -1)) {
      property[pathSegment] ||= {};
      property = property[pathSegment];
    }
    property[pathSegments[pathSegments.length - 1]] = {
      texture: slot === 'metallicRoughness' ? repeatedTexture : clampedTexture,
      ...(slot === 'iridescenceThickness'
        ? {extensions: {KHR_texture_transform: {offset: [0.25, 0.5], texCoord: 1}}}
        : {})
    };
  }
  material.normalTexture!.scale = 0.35;
  material.occlusionTexture!.strength = 0.65;
  const animationTimes = new Float32Array([0, 1]);
  const animationValues = new Float32Array([0.15, 0.8]);
  const animationInputIndex = source.accessors.length;
  source.accessors.push({
    id: 'advanced-texture-animation-times',
    componentType: 5126,
    type: 'SCALAR',
    count: animationTimes.length,
    bufferView: {data: new Uint8Array(animationTimes.buffer)}
  } as (typeof source.accessors)[number]);
  const animationOutputIndex = source.accessors.length;
  source.accessors.push({
    id: 'advanced-texture-animation-values',
    componentType: 5126,
    type: 'SCALAR',
    count: animationValues.length,
    bufferView: {data: new Uint8Array(animationValues.buffer)}
  } as (typeof source.accessors)[number]);
  source.animations = [
    {
      name: 'Advanced texture transform',
      channels: [
        {
          sampler: 0,
          target: {
            path: 'pointer',
            extensions: {
              KHR_animation_pointer: {
                pointer: `/materials/${source.materials.indexOf(material)}/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation`
              }
            }
          }
        }
      ],
      samplers: [
        {input: animationInputIndex, output: animationOutputIndex, interpolation: 'LINEAR'}
      ]
    }
  ] as typeof source.animations;

  const scene = await makeANARIJSONSceneFromGLTF(source, 'AUTHORED PHYSICAL LANTERN');
  const importedMaterial = Object.values(scene.materials).find(
    candidate => candidate.anisotropyStrength === 0.63
  );
  if (!importedMaterial) {
    expect(false, 'the authored advanced material should survive glTF translation').toBe(true);
    return;
  }

  for (const {slot, colorSpace} of getTextureTransformSlotDefinitions()) {
    const textureIdentifier = importedMaterial[`${slot}Texture`];
    expect(Boolean(textureIdentifier), `${slot} preserves its canonical material texture`).toBe(
      true
    );
    if (textureIdentifier) {
      expect(
        scene.textures?.[textureIdentifier]?.colorSpace,
        `${slot} uses the canonical glTF color-space contract`
      ).toBe(colorSpace);
    }
  }

  const clampedSampler = scene.textures?.[importedMaterial.normalTexture!]?.sampler;
  expect(
    clampedSampler,
    'postprocessed numeric sampler enums preserve wrap, minification, magnification, and mipmaps'
  ).toEqual({
    addressModeU: 'clamp-to-edge',
    addressModeV: 'mirror-repeat',
    magFilter: 'nearest',
    minFilter: 'nearest',
    mipmapFilter: 'linear'
  });
  expect(
    importedMaterial.normalTexture,
    'the same image with different authored samplers is not incorrectly deduplicated'
  ).not.toBe(importedMaterial.metallicRoughnessTexture);
  expect(
    scene.textures?.[importedMaterial.iridescenceThicknessTexture!]?.textureCoordinateSet,
    'advanced extension maps preserve KHR_texture_transform UV overrides'
  ).toBe(1);
  expect(
    scene.clips?.[0]?.tracks[0]?.target.identifier,
    'KHR_animation_pointer resolves the imported sampler for every advanced texture slot'
  ).toBe(importedMaterial.iridescenceThicknessTexture);
  expect(
    scene.clips?.[0]?.tracks[0]?.target.path,
    'advanced extension texture transforms remain animated through the shared mixer'
  ).toBe('rotation');
  expect(importedMaterial.specularColor, 'specular RGB survives').toEqual([0.3, 0.4, 0.5]);
  expect(importedMaterial.specularIntensity, 'specular intensity survives').toBe(0.42);
  expect(importedMaterial.indexOfRefraction, 'index of refraction survives').toBe(1.7);
  expect(importedMaterial.transmission, 'transmission factor survives').toBe(0.56);
  expect(
    importedMaterial.diffuseTransmission,
    'release-candidate diffuse-transmission factor survives'
  ).toBe(0.77);
  expect(
    importedMaterial.diffuseTransmissionColor,
    'authored diffuse-transmission color survives'
  ).toEqual([0.9, 0.45, 0.2]);
  expect(importedMaterial.dispersion, 'ratified chromatic dispersion survives').toBe(2.4);
  expect(importedMaterial.thickness, 'volume thickness survives').toBe(0.6);
  expect(importedMaterial.attenuationDistance, 'volume attenuation distance survives').toBe(2.5);
  expect(importedMaterial.attenuationColor, 'volume color survives').toEqual([0.7, 0.8, 0.9]);
  expect(
    importedMaterial.multiscatterColor,
    'active-draft scattering color survives alongside its required volume'
  ).toEqual([0.8, 0.35, 0.15]);
  expect(
    importedMaterial.scatterAnisotropy,
    'authored volume-scattering phase anisotropy survives'
  ).toBe(0.42);
  expect(importedMaterial.clearcoat, 'clearcoat factor survives').toBe(0.7);
  expect(importedMaterial.clearcoatRoughness, 'clearcoat roughness survives').toBe(0.23);
  expect(importedMaterial.sheenColor, 'sheen color survives').toEqual([0.11, 0.22, 0.33]);
  expect(importedMaterial.sheenRoughness, 'sheen roughness survives').toBe(0.44);
  expect(importedMaterial.iridescence, 'iridescence factor survives').toBe(0.55);
  expect(importedMaterial.iridescenceIndexOfRefraction, 'thin-film IOR survives').toBe(1.45);
  expect(importedMaterial.iridescenceThicknessMinimum, 'minimum film thickness survives').toBe(65);
  expect(importedMaterial.iridescenceThicknessMaximum, 'maximum film thickness survives').toBe(375);
  expect(importedMaterial.anisotropyRotation, 'anisotropy direction survives').toBe(0.72);
  expect(importedMaterial.emissiveStrength, 'emissive strength survives').toBe(3.5);
  expect(importedMaterial.bumpFactor, 'experimental bump strength survives').toBe(0.68);
  expect(importedMaterial.normalScale, 'normal-map scale survives').toBe(0.35);
  expect(importedMaterial.occlusionStrength, 'occlusion strength survives').toBe(0.65);
  expect(importedMaterial.unlit, 'unlit material semantics survive').toBe(true);
  expect(importedMaterial.alphaMode, 'masked material semantics survive').toBe('mask');
  expect(importedMaterial.alphaCutoff, 'authored alpha cutoff survives').toBe(0.35);
  expect(importedMaterial.doubleSided, 'authored material sidedness survives').toBe(true);
  expect(
    Boolean(ANARISceneSchema.safeParse(scene).success),
    'all advanced declarations remain valid JSON'
  ).toBe(true);
  void 0;
});

it('glTF importer preserves authored punctual-light colors, transforms, and cone angles', async () => {
  const assetData = await readFile(new URL('../../../test/data/box.glb', import.meta.url));
  const source = postProcessGLTF(await parse(assetData, GLTFLoader, {gltf: {loadImages: false}}));
  const sourceWithLights = source as typeof source & {lights?: Array<Record<string, unknown>>};
  sourceWithLights.lights = [
    {type: 'directional', color: [0.2, 0.3, 0.4], intensity: 3},
    {
      type: 'spot',
      color: [0.5, 0.6, 0.7],
      intensity: 5,
      spot: {innerConeAngle: 0.2, outerConeAngle: 0.6}
    },
    {type: 'point', color: [0.8, 0.7, 0.6], intensity: 7}
  ];
  source.nodes[0].extensions = {KHR_lights_punctual: {light: 0}};
  source.nodes[1].extensions = {KHR_lights_punctual: {light: 1}};
  const pointNode = {
    id: 'authored-point-node',
    translation: [2, 3, 4],
    extensions: {KHR_lights_punctual: {light: 2}}
  } as (typeof source.nodes)[number];
  source.nodes.push(pointNode);
  source.nodes[0].children = [...(source.nodes[0].children || []), pointNode];
  const authoredLights = parseGLTFLights(source, {useByteColors: false});

  const scene = await makeANARIJSONSceneFromGLTF(source, 'AUTHOR-LIT BOX');
  const importedLights = (scene.lights || []).filter(light => light['@@id'].startsWith('source-'));
  expect(importedLights.length, 'every source punctual-light type is imported').toBe(3);

  const directional = importedLights.find(light => light['@@type'] === 'directional');
  expect(directional?.color, 'linear light colors stay normalized').toEqual([0.2, 0.3, 0.4]);
  expect(directional?.intensity, 'directional-light intensity survives').toBe(3);

  const spot = importedLights.find(light => light['@@type'] === 'spot');
  expect(spot?.color, 'spotlight color remains source-faithful').toEqual([0.5, 0.6, 0.7]);
  expect(spot?.intensity, 'spotlight intensity survives').toBe(5);
  expect(spot?.openingAngle, 'outer cone angle survives').toBe(0.6);
  expect(spot?.falloffAngle, 'inner cone angle survives').toBe(0.2);

  const point = importedLights.find(light => light['@@type'] === 'point');
  const sourcePoint = authoredLights.find(light => light.type === 'point');
  const presentationRoot = Object.values(scene.nodes || {}).find(
    node => !node.parent && node.matrix
  );
  if (point?.position && sourcePoint && 'position' in sourcePoint && presentationRoot?.matrix) {
    const normalizedPosition = new Matrix4(presentationRoot.matrix).transformAsPoint(
      sourcePoint.position
    );
    expect(
      point.position,
      'source light transforms follow the same imported-scene normalization as meshes'
    ).toEqual([normalizedPosition[0], normalizedPosition[1], normalizedPosition[2]]);
  } else {
    expect(false, 'authored point light and normalization root should both survive import').toBe(
      true
    );
  }
  expect(
    Boolean(ANARISceneSchema.safeParse(scene).success),
    'authored punctual lights remain editable'
  ).toBe(true);
  void 0;
});
