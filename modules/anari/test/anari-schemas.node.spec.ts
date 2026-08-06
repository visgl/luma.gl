import {
  ANARI_SCENE_JSON_SCHEMA,
  ANARIGeometrySchema,
  ANARIMaterialSchema,
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
    dispersion: 1.75,
    thickness: 1.2,
    attenuationDistance: 4,
    attenuationColor: [0.8, 0.7, 0.6],
    iridescence: 0.4,
    iridescenceIndexOfRefraction: 1.45,
    iridescenceThicknessMinimum: 100,
    iridescenceThicknessMaximum: 450,
    anisotropyStrength: 0.75,
    anisotropyRotation: 1.2,
    anisotropyDirection: [0.6, 0.8],
    specularColorTexture: 'specular-color',
    specularIntensityTexture: 'specular-intensity',
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

  testContext.ok(ANARISceneSchema.safeParse(scene).success, 'advanced texture references resolve');
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
