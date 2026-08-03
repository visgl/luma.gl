import test from 'test/utils/vitest-tape';
import {
  ANARI_SCENE_JSON_SCHEMA,
  ANARIGeometrySchema,
  ANARISceneSchema,
  ANARITextureSchema
} from '@luma.gl/anari/schemas';
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

  testContext.ok(texture.success, 'texture declarations accept color space and UV transforms');
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
