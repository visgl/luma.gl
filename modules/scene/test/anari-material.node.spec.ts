import {ANARIDevice} from '@luma.gl/scene';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {ANARISceneAdapter, makeSceneMaterial} from '../src/anari-scene-adapter';

it('ANARI material parameters translate into canonical shared PBR uniforms', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const material = device.newMaterial('physicallyBased', {
    baseColor: [0.2, 0.4, 0.6, 0.8],
    metallic: 0.7,
    roughness: 0.25,
    emissive: [0.1, 0.2, 0.3],
    emissiveStrength: 4,
    alphaMode: 'mask',
    alphaCutoff: 0.35,
    doubleSided: false,
    unlit: true,
    specularColor: [0.7, 0.8, 0.9],
    specularIntensity: 0.65,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
    transmission: 0.45,
    dispersion: 0.65,
    diffuseTransmission: 0.55,
    diffuseTransmissionColor: [0.9, 0.35, 0.2],
    multiscatterColor: [0.7, 0.4, 0.25],
    scatterAnisotropy: 0.3,
    bumpFactor: 0.75,
    thickness: 1.2,
    attenuationDistance: 3,
    attenuationColor: [0.8, 0.6, 0.4],
    indexOfRefraction: 1.7,
    sheenColor: [0.3, 0.2, 0.1],
    sheenRoughness: 0.35,
    iridescence: 0.5,
    iridescenceIndexOfRefraction: 1.4,
    iridescenceThicknessMinimum: 120,
    iridescenceThicknessMaximum: 650,
    anisotropyStrength: 0.6,
    anisotropyRotation: 0.75,
    anisotropyDirection: [0.6, 0.8],
    normalScale: 0.4,
    occlusionStrength: 0.7
  });
  const sceneMaterial = makeSceneMaterial(material);
  const uniforms = sceneMaterial.uniforms!;

  expect(uniforms.baseColorFactor, 'preserves RGBA color').toEqual([0.2, 0.4, 0.6, 0.8]);
  expect(uniforms.metallicRoughnessValues, 'maps metal/rough factors').toEqual([0.7, 0.25]);
  expect(uniforms.emissiveFactor, 'maps emissive color').toEqual([0.1, 0.2, 0.3]);
  expect(uniforms.emissiveStrength, 'preserves separate emissive strength').toBe(4);
  expect(sceneMaterial.alphaMode, 'normalizes masked alpha mode').toBe('MASK');
  expect(uniforms.alphaCutoffEnabled, 'enables masked alpha rejection').toBe(true);
  expect(uniforms.alphaCutoff, 'preserves the alpha cutoff threshold').toBe(0.35);
  expect(sceneMaterial.doubleSided, 'preserves material face culling').toBe(false);
  expect(uniforms.unlit, 'preserves unlit shading').toBe(true);
  expect(uniforms.specularColorFactor, 'maps specular color').toEqual([0.7, 0.8, 0.9]);
  expect(uniforms.specularIntensityFactor, 'maps specular intensity').toBe(0.65);
  expect(uniforms.clearcoatFactor, 'maps clearcoat amount').toBe(0.8);
  expect(uniforms.clearcoatRoughnessFactor, 'maps clearcoat roughness').toBe(0.15);
  expect(uniforms.transmissionFactor, 'maps transmission amount').toBe(0.45);
  expect(uniforms.dispersion, 'maps chromatic transmission dispersion').toBe(0.65);
  expect(uniforms.diffuseTransmissionFactor, 'maps diffuse transmission').toBe(0.55);
  expect(uniforms.diffuseTransmissionColorFactor, 'maps the diffuse transmission color').toEqual([
    0.9, 0.35, 0.2
  ]);
  expect(uniforms.multiscatterColorFactor, 'maps the experimental volume-scatter color').toEqual([
    0.7, 0.4, 0.25
  ]);
  expect(uniforms.scatterAnisotropy, 'maps the scattering phase anisotropy').toBe(0.3);
  expect(uniforms.bumpFactor, 'maps the experimental bump-map strength').toBe(0.75);
  expect(uniforms.thicknessFactor, 'maps volume thickness').toBe(1.2);
  expect(uniforms.attenuationDistance, 'maps volume attenuation distance').toBe(3);
  expect(uniforms.attenuationColor, 'maps attenuation color').toEqual([0.8, 0.6, 0.4]);
  expect(uniforms.ior, 'maps index of refraction').toBe(1.7);
  expect(uniforms.sheenColorFactor, 'maps sheen color').toEqual([0.3, 0.2, 0.1]);
  expect(uniforms.sheenRoughnessFactor, 'maps sheen roughness').toBe(0.35);
  expect(uniforms.iridescenceFactor, 'maps iridescence amount').toBe(0.5);
  expect(uniforms.iridescenceIor, 'maps iridescence refraction index').toBe(1.4);
  expect(uniforms.iridescenceThicknessRange, 'maps thickness range').toEqual([120, 650]);
  expect(uniforms.anisotropyStrength, 'maps anisotropic strength').toBe(0.6);
  expect(uniforms.anisotropyRotation, 'maps anisotropic rotation').toBe(0.75);
  expect(uniforms.anisotropyDirection, 'maps anisotropic direction').toEqual([0.6, 0.8]);
  expect(uniforms.normalScale, 'maps normal-map strength').toBe(0.4);
  expect(uniforms.occlusionStrength, 'maps ambient-occlusion strength').toBe(0.7);
  expect(sceneMaterial.bindings, 'absent maps allocate no fallback textures').toEqual({});

  material.setParameter('roughness', 0.9);
  expect(
    makeSceneMaterial(material).uniforms?.metallicRoughnessValues,
    'staged material changes remain invisible to the scene adapter'
  ).toEqual([0.7, 0.25]);
  material.commitParameters();
  expect(
    makeSceneMaterial(material).uniforms?.metallicRoughnessValues,
    'committed material changes reach canonical uniforms'
  ).toEqual([0.7, 0.9]);
  device.destroy();
  void 0;
});

it('ANARI maps every advanced texture slot to canonical PBR sampler bindings', () => {
  const graphicsDevice = new NullDevice({});
  const device = new ANARIDevice(graphicsDevice);
  const image = graphicsDevice.createTexture({width: 1, height: 1, format: 'rgba8unorm'});
  const transform = [2, 0, 0, 0, 3, 0, 0.25, 0.5, 1] as const;
  const sampler = device.newSampler('image2D', {image, transform, textureCoordinateSet: 1});
  const material = device.newMaterial('physicallyBased', {
    baseColorTexture: sampler,
    normalTexture: sampler,
    metallicRoughnessTexture: sampler,
    emissiveTexture: sampler,
    occlusionTexture: sampler,
    specularColorTexture: sampler,
    specularIntensityTexture: sampler,
    transmissionTexture: sampler,
    thicknessTexture: sampler,
    clearcoatTexture: sampler,
    clearcoatRoughnessTexture: sampler,
    clearcoatNormalTexture: sampler,
    sheenColorTexture: sampler,
    sheenRoughnessTexture: sampler,
    iridescenceTexture: sampler,
    iridescenceThicknessTexture: sampler,
    anisotropyTexture: sampler,
    bumpTexture: sampler,
    diffuseTransmissionTexture: sampler,
    diffuseTransmissionColorTexture: sampler,
    multiscatterColorTexture: sampler
  });
  const sceneMaterial = makeSceneMaterial(material);
  const expectedBindingNames = [
    'pbr_baseColorSampler',
    'pbr_normalSampler',
    'pbr_metallicRoughnessSampler',
    'pbr_emissiveSampler',
    'pbr_occlusionSampler',
    'pbr_specularColorSampler',
    'pbr_specularIntensitySampler',
    'pbr_transmissionSampler',
    'pbr_thicknessSampler',
    'pbr_clearcoatSampler',
    'pbr_clearcoatRoughnessSampler',
    'pbr_clearcoatNormalSampler',
    'pbr_sheenColorSampler',
    'pbr_sheenRoughnessSampler',
    'pbr_iridescenceSampler',
    'pbr_iridescenceThicknessSampler',
    'pbr_anisotropySampler',
    'pbr_bumpSampler',
    'pbr_diffuseTransmissionSampler',
    'pbr_diffuseTransmissionColorSampler',
    'pbr_multiscatterColorSampler'
  ];

  expect(
    Object.keys(sceneMaterial.bindings || {}).sort(),
    'all supported texture extensions use the canonical shared sampler names'
  ).toEqual(expectedBindingNames.sort());
  for (const binding of Object.values(sceneMaterial.bindings || {})) {
    expect(binding, 'the shared sampler retains the caller-owned GPU texture').toBe(image);
  }
  expect(sceneMaterial.uniforms?.baseColorMapEnabled, 'enables base color map').toBe(true);
  expect(sceneMaterial.uniforms?.anisotropyMapEnabled, 'enables anisotropy map').toBe(true);
  expect(sceneMaterial.uniforms?.bumpMapEnabled, 'enables the bump height map').toBe(true);
  expect(
    sceneMaterial.uniforms?.diffuseTransmissionMapEnabled,
    'enables the diffuse-transmission factor map'
  ).toBe(true);
  expect(
    sceneMaterial.uniforms?.diffuseTransmissionColorMapEnabled,
    'enables the diffuse-transmission color map'
  ).toBe(true);
  expect(
    sceneMaterial.uniforms?.multiscatterColorMapEnabled,
    'enables the experimental volume-scatter color map'
  ).toBe(true);
  expect(sceneMaterial.uniforms?.clearcoatRoughnessUVSet, 'preserves UV set choice').toBe(1);
  expect(
    sceneMaterial.uniforms?.iridescenceThicknessUVTransform,
    'preserves per-sampler UV transforms for every extension map'
  ).toEqual(transform);
  expect(
    sceneMaterial.uniforms?.multiscatterColorUVTransform,
    'preserves UV transforms for draft extension textures'
  ).toEqual(transform);

  device.destroy();
  void 0;
});

it('ANARI preserves optional secondary geometry texture coordinates', () => {
  const graphicsDevice = new NullDevice({});
  const device = new ANARIDevice(graphicsDevice);
  const image = graphicsDevice.createTexture({width: 1, height: 1, format: 'rgba8unorm'});
  const firstTextureCoordinates = new Float32Array([0, 0, 1, 0, 0, 1]);
  const secondTextureCoordinates = new Float32Array([0.25, 0.5, 0.75, 0.5, 0.5, 1]);
  const geometry = device.newGeometry('triangle', {
    'vertex.position': new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    'vertex.attribute1': firstTextureCoordinates,
    'vertex.attribute2': device.newArray({data: secondTextureCoordinates})
  });
  const material = device.newMaterial('physicallyBased', {
    baseColorTexture: device.newSampler('image2D', {image, textureCoordinateSet: 1})
  });
  const surface = device.newSurface({geometry, material});
  const world = device.newWorld({surface: [surface]});
  const camera = device.newCamera('perspective', {position: [0, 0, 4]});
  const renderer = device.newRenderer('default');
  const frame = device.newFrame({world, camera, renderer, size: [16, 16]});
  const adapter = new ANARISceneAdapter();
  const sceneSurface = adapter.makeRenderOptions(frame)?.surfaces[0];

  expect(
    sceneSurface?.geometry.attributes['TEXCOORD_0']?.value,
    'the primary texture-coordinate set preserves its canonical geometry semantic'
  ).toBe(firstTextureCoordinates);
  expect(
    sceneSurface?.geometry.attributes['TEXCOORD_1']?.value,
    'retained array handles expose the secondary canonical texture-coordinate set'
  ).toBe(secondTextureCoordinates);
  expect(
    sceneSurface?.material.uniforms?.baseColorUVSet,
    'material samplers select the secondary geometry coordinates'
  ).toBe(1);

  geometry.unsetParameter('vertex.attribute2').commitParameters();
  expect(
    adapter.makeRenderOptions(frame)?.surfaces[0]?.geometry.attributes['TEXCOORD_1'],
    'absent secondary coordinates do not allocate a placeholder or enable their shader feature'
  ).toBe(undefined);

  adapter.destroy();
  device.destroy();
  void 0;
});

it('ANARI forwards committed image-based-lighting resources to shared renderers', () => {
  const graphicsDevice = new NullDevice({});
  const device = new ANARIDevice(graphicsDevice);
  const environment = {
    diffuseTexture: graphicsDevice.createTexture({width: 1, height: 1, format: 'rgba8unorm'}),
    specularTexture: graphicsDevice.createTexture({width: 1, height: 1, format: 'rgba8unorm'}),
    brdfLUTTexture: graphicsDevice.createTexture({width: 1, height: 1, format: 'rgba8unorm'}),
    intensity: 1.75,
    rotation: 0.5
  };
  const world = device.newWorld();
  const camera = device.newCamera('perspective', {position: [0, 0, 4]});
  const renderer = device.newRenderer('default', {environment});
  const frame = device.newFrame({world, camera, renderer, size: [16, 16]});
  const adapter = new ANARISceneAdapter();

  expect(
    adapter.makeRenderOptions(frame)?.environment,
    'caller-owned cubemaps, lookup texture, intensity, and rotation reach the shared scene'
  ).toBe(environment);

  const updatedEnvironment = {...environment, intensity: 0.75, rotation: 1.25};
  renderer.setParameter('environment', updatedEnvironment);
  expect(
    adapter.makeRenderOptions(frame)?.environment,
    'staged environment changes remain invisible until the renderer is committed'
  ).toBe(environment);
  renderer.commitParameters();
  expect(
    adapter.makeRenderOptions(frame)?.environment,
    'committed environment changes reach shared forward and deferred renderers'
  ).toBe(updatedEnvironment);

  renderer.unsetParameter('environment').commitParameters();
  expect(
    adapter.makeRenderOptions(frame)?.environment,
    'removing environment resources restores ordinary direct-light rendering'
  ).toBe(undefined);

  adapter.destroy();
  device.destroy();
  void 0;
});

it('ANARI preserves matte defaults and resolves blend versus mask modes', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const matte = device.newMaterial('matte', {metallic: 1, roughness: 0.1});
  const translucent = device.newMaterial('physicallyBased', {opacity: 0.4});
  const transmissive = device.newMaterial('physicallyBased', {transmission: 0.8});
  const opaque = device.newMaterial('physicallyBased', {opacity: 0.4, alphaMode: 'opaque'});

  expect(
    makeSceneMaterial(matte).uniforms?.metallicRoughnessValues,
    'matte material handles remain diffuse and rough'
  ).toEqual([0, 0.92]);
  expect(makeSceneMaterial(translucent).alphaMode, 'opacity enables blending').toBe('BLEND');
  expect(
    makeSceneMaterial(transmissive).alphaMode,
    'physical transmission preserves the authored opaque pipeline'
  ).toBe('OPAQUE');
  expect(
    makeSceneMaterial(opaque).alphaMode,
    'an explicit opaque mode overrides automatic blend selection'
  ).toBe('OPAQUE');

  device.destroy();
  void 0;
});
