import test from 'test/utils/vitest-tape';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {readFile} from 'node:fs/promises';
import {ANARISceneSchema} from '@luma.gl/anari/schemas';
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
        material.emissiveStrength === 4.8
    ),
    'Lantern material retains base color, normal, metallic-roughness, and HDR emissive maps'
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
