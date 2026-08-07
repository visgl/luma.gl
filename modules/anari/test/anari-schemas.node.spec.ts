import {
  ANARI_SCENE_JSON_SCHEMA,
  ANARIGeometrySchema,
  ANARIMaterialSchema,
  ANARIRendererSchema,
  ANARISceneSchema,
  ANARITextureSchema
} from '@luma.gl/anari/schemas';
import test from 'test/utils/vitest-tape';
import {PLAYGROUND_PRESETS} from '../../../examples/showcase/anari/playground-presets';

test('ANARI scene schemas validate all complete showcase presets', testContext => {
  for (const preset of PLAYGROUND_PRESETS) {
    const result = ANARISceneSchema.safeParse(preset.scene);
    testContext.ok(result.success, `${preset.label} satisfies the shared ANARI scene schema`);
  }

  testContext.equal(
    ANARI_SCENE_JSON_SCHEMA.$id,
    'https://luma.gl/schemas/anari-scene.json',
    'the generated JSON Schema exposes a stable editor identifier'
  );
  testContext.ok(
    'properties' in ANARI_SCENE_JSON_SCHEMA,
    'the generated JSON Schema describes the retained scene object'
  );
  testContext.end();
});

test('ANARI renderer schemas validate graph-based ray tracing settings', testContext => {
  const renderer = {
    '@@type': 'raytrace',
    samplesPerPixel: 4,
    maxBounces: 2,
    progressive: true,
    shadows: true,
    resolutionScale: 0.5,
    minimumResolutionScale: 0.25,
    adaptiveResolution: true,
    targetFrameTimeMilliseconds: 33.3,
    temporalReprojection: true,
    shadowSamplesPerFrame: 1,
    exposure: 1.4
  };

  testContext.ok(
    ANARIRendererSchema.safeParse(renderer).success,
    'raytrace renderers accept bounded sampling and lighting controls'
  );
  testContext.ok(
    ANARISceneSchema.safeParse({...PLAYGROUND_PRESETS[0].scene, renderer}).success,
    'complete retained scenes can declare the raytrace renderer'
  );
  testContext.notOk(
    ANARIRendererSchema.safeParse({...renderer, samplesPerPixel: 0}).success,
    'sample counts must be positive integers'
  );
  testContext.notOk(
    ANARIRendererSchema.safeParse({...renderer, maxBounces: -1}).success,
    'bounce limits cannot be negative'
  );
  testContext.notOk(
    ANARIRendererSchema.safeParse({...renderer, progressive: 1}).success,
    'progressive accumulation must be enabled with a boolean'
  );
  testContext.notOk(
    ANARIRendererSchema.safeParse({...renderer, resolutionScale: 0}).success,
    'the internal ray-tracing resolution must be greater than zero'
  );
  testContext.notOk(
    ANARIRendererSchema.safeParse({...renderer, resolutionScale: 1.1}).success,
    'the internal ray-tracing resolution cannot exceed the output resolution'
  );
  testContext.notOk(
    ANARIRendererSchema.safeParse({...renderer, minimumResolutionScale: -0.1}).success,
    'adaptive resolution requires a positive minimum scale'
  );
  testContext.notOk(
    ANARIRendererSchema.safeParse({...renderer, targetFrameTimeMilliseconds: 0}).success,
    'the target frame-time budget must be positive'
  );
  testContext.notOk(
    ANARIRendererSchema.safeParse({...renderer, shadowSamplesPerFrame: 1.5}).success,
    'per-frame shadow work must be a nonnegative integer'
  );
  testContext.ok(
    ANARIRendererSchema.safeParse({...renderer, shadowSamplesPerFrame: 0}).success,
    'zero keeps the backwards-compatible all-lights shadow path'
  );
  testContext.notOk(
    ANARIRendererSchema.safeParse({...renderer, temporalReprojection: 1}).success,
    'temporal reprojection must be enabled with a boolean'
  );
  testContext.ok(
    ANARIRendererSchema.safeParse({'@@type': 'default', temporalAntialiasing: true}).success,
    'forward renderers accept the raster temporal antialiasing control'
  );
  testContext.ok(
    ANARIRendererSchema.safeParse({'@@type': 'deferred', temporalAntialiasing: false}).success,
    'deferred renderers accept the raster temporal antialiasing control'
  );
  testContext.notOk(
    ANARIRendererSchema.safeParse({'@@type': 'default', temporalAntialiasing: 1}).success,
    'raster temporal antialiasing must be enabled with a boolean'
  );
  testContext.notOk(
    ANARIRendererSchema.safeParse({'@@type': 'default', samplesPerPixel: 4}).success,
    'ray tracing controls are not silently accepted by forward renderers'
  );
  testContext.notOk(
    ANARIRendererSchema.safeParse({'@@type': 'deferred', resolutionScale: 0.5}).success,
    'adaptive ray-tracing controls are not silently accepted by deferred renderers'
  );
  testContext.ok(
    JSON.stringify(ANARI_SCENE_JSON_SCHEMA).includes('raytrace'),
    'the generated JSON Schema advertises the raytrace renderer subtype'
  );
  testContext.end();
});

test('ANARI scene schemas identify invalid properties and retained references', testContext => {
  const scene = structuredClone(PLAYGROUND_PRESETS[0].scene);
  const materialIdentifier = Object.keys(scene.materials)[0];
  const surfaceIdentifier = Object.keys(scene.surfaces)[0];
  scene.materials[materialIdentifier].roughness = 2;
  scene.surfaces[surfaceIdentifier].geometry = 'missing-geometry';

  const result = ANARISceneSchema.safeParse(scene);
  testContext.notOk(result.success, 'invalid material values and scene references are rejected');
  if (!result.success) {
    testContext.ok(
      result.error.issues.some(
        issue => issue.path.join('.') === `materials.${materialIdentifier}.roughness`
      ),
      'the out-of-range material error identifies its exact JSON property'
    );
    testContext.ok(
      result.error.issues.some(
        issue => issue.path.join('.') === `surfaces.${surfaceIdentifier}.geometry`
      ),
      'the missing retained geometry identifies its exact reference'
    );
  }
  testContext.end();
});

test('ANARI scene schemas reject duplicate instances and broken animated lights', testContext => {
  const scene = structuredClone(PLAYGROUND_PRESETS[0].scene);
  const firstInstance = scene.instances?.[0];
  if (!firstInstance) {
    testContext.fail('the showcase preset should expose retained instances');
    testContext.end();
    return;
  }

  scene.instances = [...(scene.instances || []), structuredClone(firstInstance)];
  scene.lights = [
    ...(scene.lights || []),
    {
      '@@id': 'broken-follow-light',
      '@@type': 'point',
      animation: {'@@type': 'follow', target: 'missing-instance'}
    }
  ];

  const result = ANARISceneSchema.safeParse(scene);
  testContext.notOk(result.success, 'semantic validation rejects invalid retained identity');
  if (!result.success) {
    testContext.ok(
      result.error.issues.some(issue => issue.message.includes('Duplicate instance')),
      'duplicate retained instance identifiers are reported'
    );
    testContext.ok(
      result.error.issues.some(issue => issue.path.at(-1) === 'target'),
      'animated-light follow errors identify the target property'
    );
  }
  testContext.end();
});

test('ANARI geometry schemas retain RGB vertex attributes', testContext => {
  const result = ANARIGeometrySchema.safeParse({
    '@@type': 'triangle',
    'vertex.position': [0, 0, 0, 1, 0, 0, 0, 1, 0],
    'vertex.attribute0': [1, 0, 0, 0, 1, 0, 0, 0, 1]
  });

  testContext.ok(result.success, 'packed linear RGB vertex colors remain editable in JSON');
  testContext.end();
});

test('ANARI scene schemas validate retained texture references and UVs', testContext => {
  const texture = ANARITextureSchema.safeParse({
    source: '/textures/brass.png',
    colorSpace: 'srgb',
    sampler: {
      addressModeU: 'clamp-to-edge',
      addressModeV: 'mirror-repeat',
      minFilter: 'nearest',
      magFilter: 'linear',
      mipmapFilter: 'linear'
    },
    transform: [3, 0, 0, 0, 3, 0, 0, 0, 1]
  });
  const scene = structuredClone(PLAYGROUND_PRESETS[0].scene);
  const materialIdentifier = Object.keys(scene.materials)[0];
  scene.textures = {brass: texture.data!};
  scene.materials[materialIdentifier].baseColorTexture = 'brass';
  const geometryIdentifier = Object.keys(scene.geometries)[0];
  if (scene.geometries[geometryIdentifier]['@@type'] === 'triangle') {
    scene.geometries[geometryIdentifier]['vertex.attribute1'] = [0, 0, 1, 0, 0, 1];
  }

  testContext.ok(
    texture.success,
    'texture declarations accept authored color space, sampler filtering, and UV transforms'
  );
  testContext.ok(ANARISceneSchema.safeParse(scene).success, 'retained texture references validate');

  scene.materials[materialIdentifier].baseColorTexture = 'missing-texture';
  const invalidScene = ANARISceneSchema.safeParse(scene);
  testContext.notOk(invalidScene.success, 'missing retained textures are rejected');
  if (!invalidScene.success) {
    testContext.ok(
      invalidScene.error.issues.some(
        issue => issue.path.join('.') === `materials.${materialIdentifier}.baseColorTexture`
      ),
      'missing texture errors identify the exact material property'
    );
  }
  testContext.end();
});

test('ANARI texture schemas reject unsupported authored sampler settings', testContext => {
  for (const sampler of [
    {addressModeU: 'clamp-to-border'},
    {minFilter: 'cubic'},
    {mipmapFilter: 'bicubic'},
    {addressModeW: 'repeat'}
  ]) {
    testContext.notOk(
      ANARITextureSchema.safeParse({source: '/textures/invalid.png', sampler}).success,
      'only supported portable glTF sampler settings survive strict JSON validation'
    );
  }
  testContext.end();
});

test('ANARI material schemas expose canonical PBR extension factors and alpha modes', testContext => {
  const material = ANARIMaterialSchema.safeParse({
    '@@type': 'physicallyBased',
    alphaMode: 'mask',
    alphaCutoff: 0.3,
    doubleSided: true,
    unlit: false,
    specularColor: [0.7, 0.8, 0.9],
    specularIntensity: 0.6,
    transmission: 0.5,
    diffuseTransmission: 0.7,
    diffuseTransmissionColor: [0.9, 0.4, 0.2],
    dispersion: 1.75,
    thickness: 1.2,
    attenuationDistance: 4,
    attenuationColor: [0.8, 0.7, 0.6],
    multiscatterColor: [0.7, 0.35, 0.2],
    scatterAnisotropy: -0.4,
    bumpFactor: 0.8,
    iridescence: 0.4,
    iridescenceIndexOfRefraction: 1.45,
    iridescenceThicknessMinimum: 100,
    iridescenceThicknessMaximum: 450,
    anisotropyStrength: 0.75,
    anisotropyRotation: 1.2,
    anisotropyDirection: [0.6, 0.8],
    specularColorTexture: 'specular-color',
    specularIntensityTexture: 'specular-intensity',
    bumpTexture: 'bump',
    diffuseTransmissionTexture: 'diffuse-transmission',
    diffuseTransmissionColorTexture: 'diffuse-transmission-color',
    multiscatterColorTexture: 'multiscatter-color',
    thicknessTexture: 'thickness',
    clearcoatRoughnessTexture: 'clearcoat-roughness',
    clearcoatNormalTexture: 'clearcoat-normal',
    sheenRoughnessTexture: 'sheen-roughness',
    iridescenceTexture: 'iridescence',
    iridescenceThicknessTexture: 'iridescence-thickness',
    anisotropyTexture: 'anisotropy'
  });

  testContext.ok(material.success, 'advanced PBR factors, image maps, and masked alpha validate');
  testContext.notOk(
    ANARIMaterialSchema.safeParse({
      '@@type': 'physicallyBased',
      alphaMode: 'mask',
      alphaCutoff: 1.5
    }).success,
    'masked alpha cutoffs remain constrained to the normalized range'
  );
  testContext.notOk(
    ANARIMaterialSchema.safeParse({
      '@@type': 'physicallyBased',
      dispersion: -0.1
    }).success,
    'chromatic dispersion remains nonnegative without limiting artistic values above one'
  );
  testContext.notOk(
    ANARIMaterialSchema.safeParse({
      '@@type': 'physicallyBased',
      scatterAnisotropy: 1.1
    }).success,
    'draft scattering anisotropy remains within the physical normalized range'
  );
  testContext.ok(
    ANARITextureSchema.safeParse({source: '/texture.png', textureCoordinateSet: 1}).success,
    'texture schemas preserve the selected canonical UV coordinate set'
  );
  testContext.end();
});

test('ANARI scene schemas validate advanced retained texture references', testContext => {
  const scene = structuredClone(PLAYGROUND_PRESETS[0].scene);
  const materialIdentifier = Object.keys(scene.materials)[0];
  scene.textures = {advanced: {source: '/textures/advanced.png'}};
  scene.materials[materialIdentifier].iridescenceThicknessTexture = 'advanced';
  scene.materials[materialIdentifier].anisotropyTexture = 'advanced';
  scene.materials[materialIdentifier].bumpTexture = 'advanced';
  scene.materials[materialIdentifier].diffuseTransmissionTexture = 'advanced';
  scene.materials[materialIdentifier].diffuseTransmissionColorTexture = 'advanced';
  scene.materials[materialIdentifier].multiscatterColorTexture = 'advanced';

  testContext.ok(ANARISceneSchema.safeParse(scene).success, 'advanced texture references resolve');
  scene.materials[materialIdentifier].multiscatterColorTexture = 'missing-scatter';
  const invalidScatteringScene = ANARISceneSchema.safeParse(scene);
  testContext.notOk(
    invalidScatteringScene.success,
    'missing draft-scattering textures are rejected'
  );
  if (!invalidScatteringScene.success) {
    testContext.ok(
      invalidScatteringScene.error.issues.some(
        issue => issue.path.join('.') === `materials.${materialIdentifier}.multiscatterColorTexture`
      ),
      'draft material texture errors identify the exact missing retained sampler'
    );
  }
  scene.materials[materialIdentifier].multiscatterColorTexture = 'advanced';
  scene.materials[materialIdentifier].iridescenceThicknessTexture = 'missing-advanced';
  const invalidScene = ANARISceneSchema.safeParse(scene);
  testContext.notOk(invalidScene.success, 'missing advanced extension textures are rejected');
  if (!invalidScene.success) {
    testContext.ok(
      invalidScene.error.issues.some(
        issue =>
          issue.path.join('.') === `materials.${materialIdentifier}.iridescenceThicknessTexture`
      ),
      'advanced texture errors identify the exact missing material map'
    );
  }
  testContext.end();
});
