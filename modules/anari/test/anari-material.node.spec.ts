import {ANARIDevice} from '@luma.gl/anari';
import {NullDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {makeSceneMaterial} from '../src/anari-scene-adapter';

test('ANARI material parameters translate into canonical shared PBR uniforms', testContext => {
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

  testContext.deepEqual(uniforms.baseColorFactor, [0.2, 0.4, 0.6, 0.8], 'preserves RGBA color');
  testContext.deepEqual(uniforms.metallicRoughnessValues, [0.7, 0.25], 'maps metal/rough factors');
  testContext.deepEqual(uniforms.emissiveFactor, [0.1, 0.2, 0.3], 'maps emissive color');
  testContext.equal(uniforms.emissiveStrength, 4, 'preserves separate emissive strength');
  testContext.equal(sceneMaterial.alphaMode, 'MASK', 'normalizes masked alpha mode');
  testContext.equal(uniforms.alphaCutoffEnabled, true, 'enables masked alpha rejection');
  testContext.equal(uniforms.alphaCutoff, 0.35, 'preserves the alpha cutoff threshold');
  testContext.equal(sceneMaterial.doubleSided, false, 'preserves material face culling');
  testContext.equal(uniforms.unlit, true, 'preserves unlit shading');
  testContext.deepEqual(uniforms.specularColorFactor, [0.7, 0.8, 0.9], 'maps specular color');
  testContext.equal(uniforms.specularIntensityFactor, 0.65, 'maps specular intensity');
  testContext.equal(uniforms.clearcoatFactor, 0.8, 'maps clearcoat amount');
  testContext.equal(uniforms.clearcoatRoughnessFactor, 0.15, 'maps clearcoat roughness');
  testContext.equal(uniforms.transmissionFactor, 0.45, 'maps transmission amount');
  testContext.equal(uniforms.thicknessFactor, 1.2, 'maps volume thickness');
  testContext.equal(uniforms.attenuationDistance, 3, 'maps volume attenuation distance');
  testContext.deepEqual(uniforms.attenuationColor, [0.8, 0.6, 0.4], 'maps attenuation color');
  testContext.equal(uniforms.ior, 1.7, 'maps index of refraction');
  testContext.deepEqual(uniforms.sheenColorFactor, [0.3, 0.2, 0.1], 'maps sheen color');
  testContext.equal(uniforms.sheenRoughnessFactor, 0.35, 'maps sheen roughness');
  testContext.equal(uniforms.iridescenceFactor, 0.5, 'maps iridescence amount');
  testContext.equal(uniforms.iridescenceIor, 1.4, 'maps iridescence refraction index');
  testContext.deepEqual(uniforms.iridescenceThicknessRange, [120, 650], 'maps thickness range');
  testContext.equal(uniforms.anisotropyStrength, 0.6, 'maps anisotropic strength');
  testContext.equal(uniforms.anisotropyRotation, 0.75, 'maps anisotropic rotation');
  testContext.deepEqual(uniforms.anisotropyDirection, [0.6, 0.8], 'maps anisotropic direction');
  testContext.equal(uniforms.normalScale, 0.4, 'maps normal-map strength');
  testContext.equal(uniforms.occlusionStrength, 0.7, 'maps ambient-occlusion strength');
  testContext.deepEqual(sceneMaterial.bindings, {}, 'absent maps allocate no fallback textures');

  material.setParameter('roughness', 0.9);
  testContext.deepEqual(
    makeSceneMaterial(material).uniforms?.metallicRoughnessValues,
    [0.7, 0.25],
    'staged material changes remain invisible to the scene adapter'
  );
  material.commitParameters();
  testContext.deepEqual(
    makeSceneMaterial(material).uniforms?.metallicRoughnessValues,
    [0.7, 0.9],
    'committed material changes reach canonical uniforms'
  );
  device.destroy();
  testContext.end();
});

test('ANARI maps every advanced texture slot to canonical PBR sampler bindings', testContext => {
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
    anisotropyTexture: sampler
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
    'pbr_anisotropySampler'
  ];

  testContext.deepEqual(
    Object.keys(sceneMaterial.bindings || {}).sort(),
    expectedBindingNames.sort(),
    'all supported texture extensions use the canonical shared sampler names'
  );
  for (const binding of Object.values(sceneMaterial.bindings || {})) {
    testContext.equal(binding, image, 'the shared sampler retains the caller-owned GPU texture');
  }
  testContext.equal(sceneMaterial.uniforms?.baseColorMapEnabled, true, 'enables base color map');
  testContext.equal(sceneMaterial.uniforms?.anisotropyMapEnabled, true, 'enables anisotropy map');
  testContext.equal(sceneMaterial.uniforms?.clearcoatRoughnessUVSet, 1, 'preserves UV set choice');
  testContext.deepEqual(
    sceneMaterial.uniforms?.iridescenceThicknessUVTransform,
    transform,
    'preserves per-sampler UV transforms for every extension map'
  );

  device.destroy();
  testContext.end();
});

test('ANARI preserves matte defaults and resolves blend versus mask modes', testContext => {
  const device = new ANARIDevice(new NullDevice({}));
  const matte = device.newMaterial('matte', {metallic: 1, roughness: 0.1});
  const translucent = device.newMaterial('physicallyBased', {opacity: 0.4});
  const transmissive = device.newMaterial('physicallyBased', {transmission: 0.8});
  const opaque = device.newMaterial('physicallyBased', {opacity: 0.4, alphaMode: 'opaque'});

  testContext.deepEqual(
    makeSceneMaterial(matte).uniforms?.metallicRoughnessValues,
    [0, 0.92],
    'matte material handles remain diffuse and rough'
  );
  testContext.equal(makeSceneMaterial(translucent).alphaMode, 'BLEND', 'opacity enables blending');
  testContext.equal(
    makeSceneMaterial(transmissive).alphaMode,
    'BLEND',
    'transmission enables existing blend behavior'
  );
  testContext.equal(
    makeSceneMaterial(opaque).alphaMode,
    'OPAQUE',
    'an explicit opaque mode overrides automatic blend selection'
  );

  device.destroy();
  testContext.end();
});
