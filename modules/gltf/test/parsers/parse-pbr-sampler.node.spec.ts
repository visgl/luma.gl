import {parsePBRMaterial} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('glTF PBR parser preserves authored postprocessed sampler parameters', testContext => {
  const device = new NullDevice({});
  const parsedMaterial = parsePBRMaterial(
    device,
    {
      pbrMetallicRoughness: {
        baseColorTexture: {
          id: 'authored-sampler-texture',
          texture: {
            source: {
              image: {
                compressed: true,
                mipmaps: true,
                data: [
                  {
                    data: new Uint8Array(16),
                    width: 4,
                    height: 4,
                    textureFormat: 'bc7-rgba-unorm'
                  }
                ]
              }
            },
            sampler: {
              parameters: {
                10240: 9728,
                10241: 9986,
                10242: 33071,
                10243: 33648
              }
            }
          }
        }
      }
    },
    {NORMAL: {}, TEXCOORD_0: {}},
    {}
  );

  const sampler = parsedMaterial.bindings.pbr_baseColorSampler?.sampler.props;
  testContext.equal(sampler?.addressModeU, 'clamp-to-edge', 'horizontal wrapping remains authored');
  testContext.equal(sampler?.addressModeV, 'mirror-repeat', 'vertical wrapping remains authored');
  testContext.equal(sampler?.magFilter, 'nearest', 'magnification filtering remains authored');
  testContext.equal(sampler?.minFilter, 'nearest', 'minification filtering remains authored');
  testContext.equal(sampler?.mipmapFilter, 'linear', 'mipmap filtering remains authored');

  for (const texture of parsedMaterial.generatedTextures) {
    texture.destroy();
  }
  device.destroy();
  testContext.end();
});
