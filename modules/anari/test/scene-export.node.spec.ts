import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {PLAYGROUND_PRESETS} from '../../../examples/showcase/anari/playground-presets';
import {
  exportANARIJSONSceneToGLTF,
  exportANARIJSONSceneToUSD
} from '../../../examples/showcase/anari/scene-export';

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
