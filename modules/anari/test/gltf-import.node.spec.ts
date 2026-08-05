import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {ANARIDevice} from '@luma.gl/anari';
import {makeANARIAnimationScene} from '@luma.gl/anari/gltf';
import {ANARISceneSchema} from '@luma.gl/anari/schemas';
import {NullDevice} from '@luma.gl/test-utils';
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
