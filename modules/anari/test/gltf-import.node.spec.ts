import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {ANARIDevice} from '@luma.gl/anari';
import {makeANARIAnimationScene} from '@luma.gl/anari/gltf';
import {ANARISceneSchema} from '@luma.gl/anari/schemas';
import {getTextureTransformSlotDefinitions, parseGLTFLights} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';
import {makeANARIJSONSceneFromGLTF} from '../../../examples/showcase/anari/gltf-to-anari';

test('glTF importer translates indexed meshes into retained ANARI scenes', async testContext => {
  const assetData = await readFile(new URL('../../../test/data/box.glb', import.meta.url));
  const asset = await parse(assetData, GLTFLoader, {gltf: {loadImages: false}});
  const scene = await makeANARIJSONSceneFromGLTF(postProcessGLTF(asset), 'TEST BOX');
  const sourceGeometries = Object.values(scene.geometries).filter(
    geometry => geometry['@@type'] === 'triangle'
  );

  testContext.equal(scene.name, 'TEST BOX', 'the imported scene retains its selected title');
  testContext.ok(sourceGeometries.length > 0, 'glTF mesh primitives become triangle geometries');
  testContext.ok(
    sourceGeometries.some(geometry => (geometry['primitive.index']?.length || 0) > 0),
    'indexed meshes preserve their source index buffers'
  );
  testContext.ok((scene.instances?.length || 0) > 1, 'mesh placements and studio emitters coexist');
  testContext.equal(
    (scene.lights || []).filter(light => light.animation?.['@@type'] === 'follow').length,
    2,
    'studio point lights follow visible HDR emitter instances'
  );
  testContext.ok(
    ANARISceneSchema.safeParse(scene).success,
    'imported scenes satisfy the JSON schema'
  );
  testContext.end();
});

test('glTF importer handles detailed bundled CC0 production assets', async testContext => {
  const assetData = await readFile(
    new URL('../../../examples/showcase/anari/public/gltf/Lantern.glb', import.meta.url)
  );
  const asset = await parse(assetData, GLTFLoader, {gltf: {loadImages: false}});
  const scene = await makeANARIJSONSceneFromGLTF(postProcessGLTF(asset), 'BRASS LANTERN');

  testContext.ok(
    Object.keys(scene.geometries).length > 3,
    'multiple production meshes are retained'
  );
  testContext.ok(Object.keys(scene.materials).length > 2, 'source and studio materials coexist');
  testContext.equal(
    Object.keys(scene.textures || {}).length,
    4,
    'all Lantern PBR maps are retained'
  );
  testContext.ok(
    Object.values(scene.materials).some(
      material =>
        material.baseColorTexture &&
        material.normalTexture &&
        material.metallicRoughnessTexture &&
        material.emissiveTexture &&
        material.emissiveStrength === 1
    ),
    'Lantern material retains PBR maps and its authored glTF emissive-strength default'
  );
  testContext.ok(
    Object.values(scene.geometries).some(
      geometry => (geometry['vertex.attribute1']?.length || 0) > 0
    ),
    'glTF texture coordinates remain editable retained geometry data'
  );
  testContext.ok(
    Object.values(scene.geometries).some(
      geometry => (geometry['primitive.index']?.length || 0) > 1000
    ),
    'detailed indexed production geometry remains intact'
  );
  testContext.ok(
    Math.hypot(...(scene.camera.position || [0, 0, 0])) < 30,
    'large or tiny source assets are normalized into the studio presentation'
  );
  testContext.ok(ANARISceneSchema.safeParse(scene).success, 'production scenes remain editor-safe');
  testContext.end();
});

test('glTF importer preserves animated node hierarchy and source-faithful materials', async testContext => {
  const assetData = await readFile(new URL('../../../test/data/BoxAnimated.glb', import.meta.url));
  const asset = await parse(assetData, GLTFLoader, {gltf: {loadImages: false}});
  const source = postProcessGLTF(asset);
  const scene = await makeANARIJSONSceneFromGLTF(source, 'ANIMATED BOX');

  testContext.equal(
    scene.clips?.length,
    1,
    'the authored glTF animation becomes one retained clip'
  );
  testContext.equal(scene.clips?.[0]?.tracks.length, 2, 'both authored transform channels survive');
  testContext.equal(scene.playback?.clip, scene.clips?.[0]?.name, 'the imported clip is selected');
  testContext.ok(
    scene.clips?.[0]?.tracks.every(track => track.target.type === 'node'),
    'transform channels retain stable source-node identity'
  );
  testContext.ok(
    Object.values(scene.nodes || {}).some(node => !node.instances?.length),
    'meshless parent nodes remain in the retained hierarchy'
  );
  testContext.ok(
    Object.values(scene.nodes || {}).some(node => node.instances?.length),
    'mesh nodes reference existing retained surface instances'
  );
  testContext.ok(
    Object.values(scene.nodes || {}).some(node => node.matrix && !node.parent),
    'studio normalization remains an explicit animation-hierarchy root'
  );
  testContext.ok(
    ANARISceneSchema.safeParse(scene).success,
    'animated retained scenes round-trip through the existing JSON schema'
  );
  testContext.end();
});

test('glTF importer retains real KHR_animation_pointer material channels', async testContext => {
  // Khronos glTF-Sample-Assets AnimatedColorsCube by Ed Mackey, dedicated CC0-1.0.
  const assetData = await readFile(
    new URL('../../../examples/showcase/anari/public/gltf/AnimatedColorsCube.glb', import.meta.url)
  );
  const asset = await parse(assetData, GLTFLoader, {gltf: {loadImages: false}});
  const source = postProcessGLTF(asset);
  const scene = await makeANARIJSONSceneFromGLTF(source, 'ANIMATED COLORS CUBE');
  const clip = scene.clips?.[0];
  const colorTrack = clip?.tracks.find(track => track.target.type === 'material');

  testContext.equal(clip?.name, 'Cube Animation', 'the authored animated sample retains its name');
  testContext.equal(clip?.tracks.length, 3, 'translation, rotation, and material channels survive');
  testContext.equal(
    colorTrack?.target.path,
    'baseColor',
    'the JSON pointer targets retained color'
  );
  testContext.equal(colorTrack?.times.length, 151, 'all authored material keyframes are retained');
  testContext.equal(colorTrack?.values[0].length, 4, 'animated color remains a linear RGBA value');
  testContext.ok(
    clip?.tracks.every(track => track.target.path !== 'opacity'),
    'opaque source materials do not acquire animated blend opacity'
  );
  if (colorTrack) {
    const materialDescription = scene.materials[colorTrack.target.identifier];
    testContext.equal(
      materialDescription.alphaMode,
      'opaque',
      'the imported material preserves its authored opaque alpha mode'
    );
    testContext.equal(
      materialDescription.doubleSided,
      false,
      'materials preserve the glTF default of one-sided rendering'
    );
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
    testContext.deepEqual(
      material.getParameter('baseColor'),
      colorTrack.values.at(-1),
      'short material samplers clamp while the longer node animation continues'
    );
    playback.seek(3);
    testContext.deepEqual(
      material.getParameter('baseColor'),
      colorTrack.values[0],
      'the shared action loops once at the complete clip boundary'
    );
    device.destroy();
  }
  testContext.ok(
    ANARISceneSchema.safeParse(scene).success,
    'material-pointer scenes remain editable, serializable retained JSON'
  );
  testContext.end();
});

test('glTF importer retains secondary texture coordinates and transform UV overrides', async testContext => {
  const assetData = await readFile(
    new URL('../../../examples/showcase/anari/public/gltf/Lantern.glb', import.meta.url)
  );
  const asset = await parse(assetData, GLTFLoader, {gltf: {loadImages: false}});
  const source = postProcessGLTF(asset);
  const primitive = source.meshes
    .flatMap(mesh => mesh.primitives)
    .find(candidate => candidate.attributes['TEXCOORD_0'] && candidate.material);
  const textureInfo = primitive?.material?.pbrMetallicRoughness?.baseColorTexture;
  if (!primitive || !textureInfo) {
    testContext.fail('the bundled Lantern should provide editable textured mesh primitives');
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

  testContext.ok(
    Object.values(scene.geometries).some(
      geometry => (geometry['vertex.attribute2']?.length || 0) > 0
    ),
    'TEXCOORD_1 accessors survive as editable retained geometry'
  );
  testContext.ok(
    secondaryUVMaterial,
    'KHR_texture_transform texCoord overrides the original textureInfo UV set'
  );
  if (secondaryUVMaterial?.baseColorTexture) {
    const texture = scene.textures?.[secondaryUVMaterial.baseColorTexture];
    testContext.equal(texture?.textureCoordinateSet, 1, 'the sampler retains its selected UV set');
    testContext.ok(texture?.transform, 'the authored texture transform remains attached');
    testContext.equal(secondaryUVMaterial.alphaMode, 'mask', 'the authored alpha mode is retained');
    testContext.equal(
      secondaryUVMaterial.alphaCutoff,
      0.35,
      'the authored alpha cutoff is retained'
    );
    testContext.ok(secondaryUVMaterial.doubleSided, 'authored double-sided rendering is retained');
  }
  testContext.ok(
    ANARISceneSchema.safeParse(scene).success,
    'secondary-UV glTF scenes remain valid retained JSON'
  );
  testContext.end();
});

test('glTF importer retains all canonical PBR textures, factors, color spaces, and authored samplers', async testContext => {
  const assetData = await readFile(
    new URL('../../../examples/showcase/anari/public/gltf/Lantern.glb', import.meta.url)
  );
  const source = postProcessGLTF(await parse(assetData, GLTFLoader, {gltf: {loadImages: false}}));
  const primitive = source.meshes
    .flatMap(mesh => mesh.primitives)
    .find(candidate => candidate.attributes['TEXCOORD_0'] && candidate.material);
  if (!primitive?.material) {
    testContext.fail('the bundled Lantern should expose an editable physically based material');
    return;
  }

  primitive.attributes['TEXCOORD_1'] = primitive.attributes['TEXCOORD_0'];
  const material = primitive.material;
  material.alphaMode = 'MASK';
  material.alphaCutoff = 0.35;
  material.doubleSided = true;
  material.emissiveFactor = [0.2, 0.3, 0.4];
  material.extensions = {
    KHR_materials_specular: {specularFactor: 0.42, specularColorFactor: [0.3, 0.4, 0.5]},
    KHR_materials_ior: {ior: 1.7},
    KHR_materials_transmission: {transmissionFactor: 0.56},
    KHR_materials_dispersion: {dispersion: 2.4},
    KHR_materials_volume: {
      thicknessFactor: 0.6,
      attenuationDistance: 2.5,
      attenuationColor: [0.7, 0.8, 0.9]
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
    testContext.fail('the authored advanced material should survive glTF translation');
    return;
  }

  for (const {slot, colorSpace} of getTextureTransformSlotDefinitions()) {
    const textureIdentifier = importedMaterial[`${slot}Texture`];
    testContext.ok(textureIdentifier, `${slot} preserves its canonical material texture`);
    if (textureIdentifier) {
      testContext.equal(
        scene.textures?.[textureIdentifier]?.colorSpace,
        colorSpace,
        `${slot} uses the canonical glTF color-space contract`
      );
    }
  }

  const clampedSampler = scene.textures?.[importedMaterial.normalTexture!]?.sampler;
  testContext.deepEqual(
    clampedSampler,
    {
      addressModeU: 'clamp-to-edge',
      addressModeV: 'mirror-repeat',
      magFilter: 'nearest',
      minFilter: 'nearest',
      mipmapFilter: 'linear'
    },
    'postprocessed numeric sampler enums preserve wrap, minification, magnification, and mipmaps'
  );
  testContext.notEqual(
    importedMaterial.normalTexture,
    importedMaterial.metallicRoughnessTexture,
    'the same image with different authored samplers is not incorrectly deduplicated'
  );
  testContext.equal(
    scene.textures?.[importedMaterial.iridescenceThicknessTexture!]?.textureCoordinateSet,
    1,
    'advanced extension maps preserve KHR_texture_transform UV overrides'
  );
  testContext.equal(
    scene.clips?.[0]?.tracks[0]?.target.identifier,
    importedMaterial.iridescenceThicknessTexture,
    'KHR_animation_pointer resolves the imported sampler for every advanced texture slot'
  );
  testContext.equal(
    scene.clips?.[0]?.tracks[0]?.target.path,
    'rotation',
    'advanced extension texture transforms remain animated through the shared mixer'
  );
  testContext.deepEqual(importedMaterial.specularColor, [0.3, 0.4, 0.5], 'specular RGB survives');
  testContext.equal(importedMaterial.specularIntensity, 0.42, 'specular intensity survives');
  testContext.equal(importedMaterial.indexOfRefraction, 1.7, 'index of refraction survives');
  testContext.equal(importedMaterial.transmission, 0.56, 'transmission factor survives');
  testContext.equal(importedMaterial.dispersion, 2.4, 'ratified chromatic dispersion survives');
  testContext.equal(importedMaterial.thickness, 0.6, 'volume thickness survives');
  testContext.equal(
    importedMaterial.attenuationDistance,
    2.5,
    'volume attenuation distance survives'
  );
  testContext.deepEqual(
    importedMaterial.attenuationColor,
    [0.7, 0.8, 0.9],
    'volume color survives'
  );
  testContext.equal(importedMaterial.clearcoat, 0.7, 'clearcoat factor survives');
  testContext.equal(importedMaterial.clearcoatRoughness, 0.23, 'clearcoat roughness survives');
  testContext.deepEqual(importedMaterial.sheenColor, [0.11, 0.22, 0.33], 'sheen color survives');
  testContext.equal(importedMaterial.sheenRoughness, 0.44, 'sheen roughness survives');
  testContext.equal(importedMaterial.iridescence, 0.55, 'iridescence factor survives');
  testContext.equal(importedMaterial.iridescenceIndexOfRefraction, 1.45, 'thin-film IOR survives');
  testContext.equal(
    importedMaterial.iridescenceThicknessMinimum,
    65,
    'minimum film thickness survives'
  );
  testContext.equal(
    importedMaterial.iridescenceThicknessMaximum,
    375,
    'maximum film thickness survives'
  );
  testContext.equal(importedMaterial.anisotropyRotation, 0.72, 'anisotropy direction survives');
  testContext.equal(importedMaterial.emissiveStrength, 3.5, 'emissive strength survives');
  testContext.equal(importedMaterial.normalScale, 0.35, 'normal-map scale survives');
  testContext.equal(importedMaterial.occlusionStrength, 0.65, 'occlusion strength survives');
  testContext.equal(importedMaterial.unlit, true, 'unlit material semantics survive');
  testContext.equal(importedMaterial.alphaMode, 'mask', 'masked material semantics survive');
  testContext.equal(importedMaterial.alphaCutoff, 0.35, 'authored alpha cutoff survives');
  testContext.equal(importedMaterial.doubleSided, true, 'authored material sidedness survives');
  testContext.ok(
    ANARISceneSchema.safeParse(scene).success,
    'all advanced declarations remain valid JSON'
  );
  testContext.end();
});

test('glTF importer preserves authored punctual-light colors, transforms, and cone angles', async testContext => {
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
  testContext.equal(importedLights.length, 3, 'every source punctual-light type is imported');

  const directional = importedLights.find(light => light['@@type'] === 'directional');
  testContext.deepEqual(directional?.color, [0.2, 0.3, 0.4], 'linear light colors stay normalized');
  testContext.equal(directional?.intensity, 3, 'directional-light intensity survives');

  const spot = importedLights.find(light => light['@@type'] === 'spot');
  testContext.deepEqual(spot?.color, [0.5, 0.6, 0.7], 'spotlight color remains source-faithful');
  testContext.equal(spot?.intensity, 5, 'spotlight intensity survives');
  testContext.equal(spot?.openingAngle, 0.6, 'outer cone angle survives');
  testContext.equal(spot?.falloffAngle, 0.2, 'inner cone angle survives');

  const point = importedLights.find(light => light['@@type'] === 'point');
  const sourcePoint = authoredLights.find(light => light.type === 'point');
  const presentationRoot = Object.values(scene.nodes || {}).find(
    node => !node.parent && node.matrix
  );
  if (point?.position && sourcePoint && 'position' in sourcePoint && presentationRoot?.matrix) {
    const normalizedPosition = new Matrix4(presentationRoot.matrix).transformAsPoint(
      sourcePoint.position
    );
    testContext.deepEqual(
      point.position,
      [normalizedPosition[0], normalizedPosition[1], normalizedPosition[2]],
      'source light transforms follow the same imported-scene normalization as meshes'
    );
  } else {
    testContext.fail('authored point light and normalization root should both survive import');
  }
  testContext.ok(
    ANARISceneSchema.safeParse(scene).success,
    'authored punctual lights remain editable'
  );
  testContext.end();
});
