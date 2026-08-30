import {ANARIDevice} from '@luma.gl/scene';
import {NullDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {ANARISceneAdapter, makeSceneMaterial} from '../src/anari-scene-adapter';

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
  testContext.equal(uniforms.dispersion, 0.65, 'maps chromatic transmission dispersion');
  testContext.equal(uniforms.diffuseTransmissionFactor, 0.55, 'maps diffuse transmission');
  testContext.deepEqual(
    uniforms.diffuseTransmissionColorFactor,
    [0.9, 0.35, 0.2],
    'maps the diffuse transmission color'
  );
  testContext.deepEqual(
    uniforms.multiscatterColorFactor,
    [0.7, 0.4, 0.25],
    'maps the experimental volume-scatter color'
  );
  testContext.equal(uniforms.scatterAnisotropy, 0.3, 'maps the scattering phase anisotropy');
  testContext.equal(uniforms.bumpFactor, 0.75, 'maps the experimental bump-map strength');
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
  testContext.equal(sceneMaterial.uniforms?.bumpMapEnabled, true, 'enables the bump height map');
  testContext.equal(
    sceneMaterial.uniforms?.diffuseTransmissionMapEnabled,
    true,
    'enables the diffuse-transmission factor map'
  );
  testContext.equal(
    sceneMaterial.uniforms?.diffuseTransmissionColorMapEnabled,
    true,
    'enables the diffuse-transmission color map'
  );
  testContext.equal(
    sceneMaterial.uniforms?.multiscatterColorMapEnabled,
    true,
    'enables the experimental volume-scatter color map'
  );
  testContext.equal(sceneMaterial.uniforms?.clearcoatRoughnessUVSet, 1, 'preserves UV set choice');
  testContext.deepEqual(
    sceneMaterial.uniforms?.iridescenceThicknessUVTransform,
    transform,
    'preserves per-sampler UV transforms for every extension map'
  );
  testContext.deepEqual(
    sceneMaterial.uniforms?.multiscatterColorUVTransform,
    transform,
    'preserves UV transforms for draft extension textures'
  );

  device.destroy();
  testContext.end();
});

test('ANARI preserves optional secondary geometry texture coordinates', testContext => {
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

  testContext.equal(
    sceneSurface?.geometry.attributes['TEXCOORD_0']?.value,
    firstTextureCoordinates,
    'the primary texture-coordinate set preserves its canonical geometry semantic'
  );
  testContext.equal(
    sceneSurface?.geometry.attributes['TEXCOORD_1']?.value,
    secondTextureCoordinates,
    'retained array handles expose the secondary canonical texture-coordinate set'
  );
  testContext.equal(
    sceneSurface?.material.uniforms?.baseColorUVSet,
    1,
    'material samplers select the secondary geometry coordinates'
  );

  geometry.unsetParameter('vertex.attribute2').commitParameters();
  testContext.equal(
    adapter.makeRenderOptions(frame)?.surfaces[0]?.geometry.attributes['TEXCOORD_1'],
    undefined,
    'absent secondary coordinates do not allocate a placeholder or enable their shader feature'
  );

  adapter.destroy();
  device.destroy();
  testContext.end();
});

test('ANARI forwards committed image-based-lighting resources to shared renderers', testContext => {
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

  testContext.equal(
    adapter.makeRenderOptions(frame)?.environment,
    environment,
    'caller-owned cubemaps, lookup texture, intensity, and rotation reach the shared scene'
  );

  const updatedEnvironment = {...environment, intensity: 0.75, rotation: 1.25};
  renderer.setParameter('environment', updatedEnvironment);
  testContext.equal(
    adapter.makeRenderOptions(frame)?.environment,
    environment,
    'staged environment changes remain invisible until the renderer is committed'
  );
  renderer.commitParameters();
  testContext.equal(
    adapter.makeRenderOptions(frame)?.environment,
    updatedEnvironment,
    'committed environment changes reach shared forward and deferred renderers'
  );

  renderer.unsetParameter('environment').commitParameters();
  testContext.equal(
    adapter.makeRenderOptions(frame)?.environment,
    undefined,
    'removing environment resources restores ordinary direct-light rendering'
  );

  adapter.destroy();
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
    'OPAQUE',
    'physical transmission preserves the authored opaque pipeline'
  );
  testContext.equal(
    makeSceneMaterial(opaque).alphaMode,
    'OPAQUE',
    'an explicit opaque mode overrides automatic blend selection'
  );

  device.destroy();
  testContext.end();
});
