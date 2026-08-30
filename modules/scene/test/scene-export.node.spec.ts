import {getTextureTransformSlotDefinitions} from '@luma.gl/gltf';
import test from 'test/utils/vitest-tape';
import {PLAYGROUND_PRESETS} from '../../../examples/showcase/scene/playground-presets';
import {
  exportANARIJSONSceneToGLTF,
  exportANARIJSONSceneToUSD
} from '../../../examples/showcase/scene/scene-export';

test('ANARI scene exporter writes static glTF scene assets', async testContext => {
  const scene = structuredClone(PLAYGROUND_PRESETS[1].scene);
  scene.textures = {
    crystal: {
      source: 'data:image/png;base64,iVBORw0KGgo=',
      colorSpace: 'srgb',
      transform: [2, 0, 0, 0, 2, 0, 0, 0, 1]
    }
  };
  const materialIdentifier = Object.keys(scene.materials)[0];
  scene.materials[materialIdentifier].baseColorTexture = 'crystal';

  const gltf = JSON.parse(await exportANARIJSONSceneToGLTF(scene));

  testContext.equal(gltf.asset.version, '2.0', 'export uses glTF 2.0');
  testContext.ok(gltf.meshes.length > 0, 'procedural ANARI geometry bakes into glTF meshes');
  testContext.ok(gltf.nodes.length > 0, 'retained ANARI instances become glTF nodes');
  testContext.equal(gltf.images.length, 1, 'retained image samplers become glTF images');
  testContext.ok(
    gltf.buffers[0].uri.startsWith('data:application/octet-stream;base64,'),
    'mesh buffers are embedded for standalone downloads'
  );
  testContext.end();
});

test('ANARI scene exporter writes static USDA stages', testContext => {
  const usd = exportANARIJSONSceneToUSD(PLAYGROUND_PRESETS[2].scene);

  testContext.match(usd, /#usda 1.0/, 'export uses ASCII USD');
  testContext.match(usd, /def Xform "World"/, 'export creates a USD world root');
  testContext.match(usd, /def Mesh/, 'procedural ANARI geometry bakes into USD meshes');
  testContext.match(usd, /UsdPreviewSurface/, 'ANARI materials become preview-surface shaders');
  testContext.match(usd, /xformOp:transform/, 'retained instances become USD transforms');
  testContext.end();
});

test('ANARI glTF export preserves alpha masking, authored cutoff, and material sidedness', async testContext => {
  const scene = structuredClone(PLAYGROUND_PRESETS[0].scene);
  const materialIdentifier = Object.keys(scene.materials)[0];
  const material = scene.materials[materialIdentifier];
  material.alphaMode = 'mask';
  material.alphaCutoff = 0.35;
  material.doubleSided = true;
  material.opacity = 0.4;

  const maskedDocument = JSON.parse(await exportANARIJSONSceneToGLTF(scene));
  const maskedMaterial = maskedDocument.materials.find(
    candidate => candidate.name === materialIdentifier
  );
  testContext.equal(maskedMaterial.alphaMode, 'MASK', 'masked materials preserve their alpha mode');
  testContext.equal(maskedMaterial.alphaCutoff, 0.35, 'masked materials preserve their cutoff');
  testContext.equal(maskedMaterial.doubleSided, true, 'authored two-sided rendering round-trips');

  material.alphaMode = 'opaque';
  const opaqueDocument = JSON.parse(await exportANARIJSONSceneToGLTF(scene));
  const opaqueMaterial = opaqueDocument.materials.find(
    candidate => candidate.name === materialIdentifier
  );
  testContext.equal(
    opaqueMaterial.alphaMode,
    undefined,
    'explicit opaque materials do not become blended solely because their alpha changes'
  );
  testContext.end();
});

test('ANARI glTF export preserves authored punctual-light cones, direction, and intensity', async testContext => {
  const scene = structuredClone(PLAYGROUND_PRESETS[0].scene);
  scene.lights = [
    {
      '@@id': 'authored-spot',
      '@@type': 'spot',
      position: [1, 2, 3],
      direction: [1, 0, 0],
      color: [0.2, 0.4, 0.6],
      intensity: 0,
      openingAngle: 0.6,
      falloffAngle: 0.2
    }
  ];

  const gltf = JSON.parse(await exportANARIJSONSceneToGLTF(scene));
  const authoredLight = gltf.extensions.KHR_lights_punctual.lights[0];
  const authoredLightNode = gltf.nodes.find(node => node.name === 'authored-spot');

  testContext.equal(authoredLight.type, 'spot', 'authored punctual-light type round-trips');
  testContext.equal(authoredLight.intensity, 0, 'zero-valued authored light intensity survives');
  testContext.deepEqual(
    authoredLight.color,
    [0.2, 0.4, 0.6],
    'linear authored light color survives'
  );
  testContext.deepEqual(
    authoredLight.spot,
    {innerConeAngle: 0.2, outerConeAngle: 0.6},
    'authored inner and outer spot cone angles round-trip'
  );
  testContext.deepEqual(
    authoredLightNode.translation,
    [1, 2, 3],
    'authored punctual-light position survives'
  );
  testContext.equal(
    authoredLightNode.rotation.length,
    4,
    'non-default light direction becomes an authored glTF node rotation'
  );
  testContext.ok(
    gltf.extensionsUsed.includes('KHR_lights_punctual'),
    'the punctual-light extension is declared'
  );
  testContext.end();
});

test('ANARI glTF export preserves canonical material extensions, authored samplers, and secondary UVs', async testContext => {
  const scene = structuredClone(PLAYGROUND_PRESETS[0].scene);
  scene.geometries.halo = {
    '@@type': 'triangle',
    'vertex.position': [0, 0, 0, 1, 0, 0, 0, 1, 0],
    'vertex.normal': [0, 0, 1, 0, 0, 1, 0, 0, 1],
    'vertex.attribute1': [0, 0, 1, 0, 0, 1],
    'vertex.attribute2': [0.25, 0.5, 0.75, 0.5, 0.5, 1],
    'primitive.index': [0, 1, 2]
  };
  scene.textures = {
    authoredColor: {
      source: 'data:image/png;base64,iVBORw0KGgo=',
      colorSpace: 'srgb',
      sampler: {
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        minFilter: 'linear',
        magFilter: 'linear'
      }
    },
    authoredData: {
      source: 'data:image/png;base64,iVBORw0KGgo=',
      colorSpace: 'linear',
      textureCoordinateSet: 1,
      transform: [2, 0, 0, 0, 3, 0, 0.25, 0.5, 1],
      sampler: {
        addressModeU: 'clamp-to-edge',
        addressModeV: 'mirror-repeat',
        minFilter: 'nearest',
        magFilter: 'nearest',
        mipmapFilter: 'linear'
      }
    }
  };
  const material = scene.materials.halo;
  Object.assign(material, {
    alphaMode: 'mask',
    alphaCutoff: 0.37,
    doubleSided: true,
    unlit: true,
    specularColor: [0.3, 0.4, 0.5],
    specularIntensity: 0.42,
    indexOfRefraction: 1.7,
    transmission: 0.56,
    thickness: 0.6,
    attenuationDistance: 2.5,
    attenuationColor: [0.7, 0.8, 0.9],
    clearcoat: 0.7,
    clearcoatRoughness: 0.23,
    sheenColor: [0.11, 0.22, 0.33],
    sheenRoughness: 0.44,
    iridescence: 0.55,
    iridescenceIndexOfRefraction: 1.45,
    iridescenceThicknessMinimum: 65,
    iridescenceThicknessMaximum: 375,
    anisotropyStrength: 0.63,
    anisotropyRotation: 0.72,
    normalScale: 0.35,
    occlusionStrength: 0.65
  });
  for (const {slot, colorSpace} of getTextureTransformSlotDefinitions()) {
    material[`${slot}Texture`] = colorSpace === 'srgb' ? 'authoredColor' : 'authoredData';
  }

  const gltf = JSON.parse(await exportANARIJSONSceneToGLTF(scene));
  const exportedMaterial = gltf.materials.find(candidate => candidate.name === 'halo');
  const haloPrimitive = gltf.meshes.find(mesh => mesh.name === 'halo').primitives[0];
  testContext.ok(
    haloPrimitive.attributes.TEXCOORD_1 !== undefined,
    'secondary UVs become TEXCOORD_1'
  );

  for (const {slot, pathSegments, colorSpace} of getTextureTransformSlotDefinitions()) {
    let textureInfo = exportedMaterial;
    for (const pathSegment of pathSegments) {
      textureInfo = textureInfo?.[pathSegment];
    }
    testContext.equal(
      typeof textureInfo?.index,
      'number',
      `${slot} is written at its canonical glTF material path`
    );
    if (colorSpace === 'linear') {
      testContext.equal(
        textureInfo.texCoord,
        1,
        `${slot} preserves authored secondary UV selection`
      );
      testContext.deepEqual(
        textureInfo.extensions?.KHR_texture_transform?.offset,
        [0.25, 0.5],
        `${slot} preserves authored texture offsets`
      );
      testContext.deepEqual(
        textureInfo.extensions?.KHR_texture_transform?.scale,
        [2, 3],
        `${slot} preserves authored texture scale`
      );
    }
  }

  const authoredColorTexture = gltf.textures.find(texture => texture.name === 'authoredColor');
  const authoredDataTexture = gltf.textures.find(texture => texture.name === 'authoredData');
  testContext.notEqual(
    authoredColorTexture.sampler,
    authoredDataTexture.sampler,
    'different authored samplers remain independently addressable'
  );
  testContext.deepEqual(
    gltf.samplers[authoredDataTexture.sampler],
    {wrapS: 33071, wrapT: 33648, magFilter: 9728, minFilter: 9986},
    'portable filter, wrap, and mipmap settings round-trip into glTF sampler enums'
  );
  testContext.equal(exportedMaterial.alphaMode, 'MASK', 'masked alpha mode round-trips');
  testContext.equal(exportedMaterial.alphaCutoff, 0.37, 'authored alpha cutoff round-trips');
  testContext.equal(exportedMaterial.doubleSided, true, 'authored face culling round-trips');
  testContext.equal(exportedMaterial.normalTexture.scale, 0.35, 'normal-map strength round-trips');
  testContext.equal(
    exportedMaterial.occlusionTexture.strength,
    0.65,
    'occlusion-map strength round-trips'
  );
  testContext.deepEqual(
    exportedMaterial.extensions.KHR_materials_specular.specularColorFactor,
    [0.3, 0.4, 0.5],
    'specular material factors round-trip'
  );
  testContext.equal(
    exportedMaterial.extensions.KHR_materials_volume.attenuationDistance,
    2.5,
    'volume attenuation round-trips'
  );
  testContext.equal(
    exportedMaterial.extensions.KHR_materials_iridescence.iridescenceThicknessMaximum,
    375,
    'thin-film material factors round-trip'
  );
  testContext.equal(
    exportedMaterial.extensions.KHR_materials_anisotropy.anisotropyRotation,
    0.72,
    'anisotropy material factors round-trip'
  );
  for (const extension of [
    'KHR_materials_specular',
    'KHR_materials_ior',
    'KHR_materials_transmission',
    'KHR_materials_volume',
    'KHR_materials_clearcoat',
    'KHR_materials_sheen',
    'KHR_materials_iridescence',
    'KHR_materials_anisotropy',
    'KHR_materials_unlit',
    'KHR_texture_transform'
  ]) {
    testContext.ok(
      gltf.extensionsUsed.includes(extension),
      `${extension} is declared on the asset`
    );
  }
  testContext.end();
});
