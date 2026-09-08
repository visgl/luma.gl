import {getTextureTransformSlotDefinitions} from '@luma.gl/gltf';
import {expect, it} from 'vitest';
import {PLAYGROUND_PRESETS} from '../../../examples/showcase/scene/playground-presets';
import {
  exportANARIJSONSceneToGLTF,
  exportANARIJSONSceneToUSD
} from '../../../examples/showcase/scene/scene-export';

it('ANARI scene exporter writes static glTF scene assets', async () => {
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

  expect(gltf.asset.version, 'export uses glTF 2.0').toBe('2.0');
  expect(Boolean(gltf.meshes.length > 0), 'procedural ANARI geometry bakes into glTF meshes').toBe(
    true
  );
  expect(Boolean(gltf.nodes.length > 0), 'retained ANARI instances become glTF nodes').toBe(true);
  expect(gltf.images.length, 'retained image samplers become glTF images').toBe(1);
  expect(
    Boolean(gltf.buffers[0].uri.startsWith('data:application/octet-stream;base64,')),
    'mesh buffers are embedded for standalone downloads'
  ).toBe(true);
  void 0;
});

it('ANARI scene exporter writes static USDA stages', () => {
  const usd = exportANARIJSONSceneToUSD(PLAYGROUND_PRESETS[2].scene);

  expect(usd, 'export uses ASCII USD').toMatch(/#usda 1.0/);
  expect(usd, 'export creates a USD world root').toMatch(/def Xform "World"/);
  expect(usd, 'procedural ANARI geometry bakes into USD meshes').toMatch(/def Mesh/);
  expect(usd, 'ANARI materials become preview-surface shaders').toMatch(/UsdPreviewSurface/);
  expect(usd, 'retained instances become USD transforms').toMatch(/xformOp:transform/);
  void 0;
});

it('ANARI glTF export preserves alpha masking, authored cutoff, and material sidedness', async () => {
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
  expect(maskedMaterial.alphaMode, 'masked materials preserve their alpha mode').toBe('MASK');
  expect(maskedMaterial.alphaCutoff, 'masked materials preserve their cutoff').toBe(0.35);
  expect(maskedMaterial.doubleSided, 'authored two-sided rendering round-trips').toBe(true);

  material.alphaMode = 'opaque';
  const opaqueDocument = JSON.parse(await exportANARIJSONSceneToGLTF(scene));
  const opaqueMaterial = opaqueDocument.materials.find(
    candidate => candidate.name === materialIdentifier
  );
  expect(
    opaqueMaterial.alphaMode,
    'explicit opaque materials do not become blended solely because their alpha changes'
  ).toBe(undefined);
  void 0;
});

it('ANARI glTF export preserves authored punctual-light cones, direction, and intensity', async () => {
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

  expect(authoredLight.type, 'authored punctual-light type round-trips').toBe('spot');
  expect(authoredLight.intensity, 'zero-valued authored light intensity survives').toBe(0);
  expect(authoredLight.color, 'linear authored light color survives').toEqual([0.2, 0.4, 0.6]);
  expect(authoredLight.spot, 'authored inner and outer spot cone angles round-trip').toEqual({
    innerConeAngle: 0.2,
    outerConeAngle: 0.6
  });
  expect(authoredLightNode.translation, 'authored punctual-light position survives').toEqual([
    1, 2, 3
  ]);
  expect(
    authoredLightNode.rotation.length,
    'non-default light direction becomes an authored glTF node rotation'
  ).toBe(4);
  expect(
    Boolean(gltf.extensionsUsed.includes('KHR_lights_punctual')),
    'the punctual-light extension is declared'
  ).toBe(true);
  void 0;
});

it('ANARI glTF export preserves canonical material extensions, authored samplers, and secondary UVs', async () => {
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
  expect(
    Boolean(haloPrimitive.attributes.TEXCOORD_1 !== undefined),
    'secondary UVs become TEXCOORD_1'
  ).toBe(true);

  for (const {slot, pathSegments, colorSpace} of getTextureTransformSlotDefinitions()) {
    let textureInfo = exportedMaterial;
    for (const pathSegment of pathSegments) {
      textureInfo = textureInfo?.[pathSegment];
    }
    expect(
      typeof textureInfo?.index,
      `${slot} is written at its canonical glTF material path`
    ).toBe('number');
    if (colorSpace === 'linear') {
      expect(textureInfo.texCoord, `${slot} preserves authored secondary UV selection`).toBe(1);
      expect(
        textureInfo.extensions?.KHR_texture_transform?.offset,
        `${slot} preserves authored texture offsets`
      ).toEqual([0.25, 0.5]);
      expect(
        textureInfo.extensions?.KHR_texture_transform?.scale,
        `${slot} preserves authored texture scale`
      ).toEqual([2, 3]);
    }
  }

  const authoredColorTexture = gltf.textures.find(texture => texture.name === 'authoredColor');
  const authoredDataTexture = gltf.textures.find(texture => texture.name === 'authoredData');
  expect(
    authoredColorTexture.sampler,
    'different authored samplers remain independently addressable'
  ).not.toBe(authoredDataTexture.sampler);
  expect(
    gltf.samplers[authoredDataTexture.sampler],
    'portable filter, wrap, and mipmap settings round-trip into glTF sampler enums'
  ).toEqual({wrapS: 33071, wrapT: 33648, magFilter: 9728, minFilter: 9986});
  expect(exportedMaterial.alphaMode, 'masked alpha mode round-trips').toBe('MASK');
  expect(exportedMaterial.alphaCutoff, 'authored alpha cutoff round-trips').toBe(0.37);
  expect(exportedMaterial.doubleSided, 'authored face culling round-trips').toBe(true);
  expect(exportedMaterial.normalTexture.scale, 'normal-map strength round-trips').toBe(0.35);
  expect(exportedMaterial.occlusionTexture.strength, 'occlusion-map strength round-trips').toBe(
    0.65
  );
  expect(
    exportedMaterial.extensions.KHR_materials_specular.specularColorFactor,
    'specular material factors round-trip'
  ).toEqual([0.3, 0.4, 0.5]);
  expect(
    exportedMaterial.extensions.KHR_materials_volume.attenuationDistance,
    'volume attenuation round-trips'
  ).toBe(2.5);
  expect(
    exportedMaterial.extensions.KHR_materials_iridescence.iridescenceThicknessMaximum,
    'thin-film material factors round-trip'
  ).toBe(375);
  expect(
    exportedMaterial.extensions.KHR_materials_anisotropy.anisotropyRotation,
    'anisotropy material factors round-trip'
  ).toBe(0.72);
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
    expect(
      Boolean(gltf.extensionsUsed.includes(extension)),
      `${extension} is declared on the asset`
    ).toBe(true);
  }
  void 0;
});
