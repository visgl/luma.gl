import {parsePBRMaterial} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

it('glTF PBR parser preserves authored postprocessed sampler parameters', () => {
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
  expect(sampler?.addressModeU, 'horizontal wrapping remains authored').toBe('clamp-to-edge');
  expect(sampler?.addressModeV, 'vertical wrapping remains authored').toBe('mirror-repeat');
  expect(sampler?.magFilter, 'magnification filtering remains authored').toBe('nearest');
  expect(sampler?.minFilter, 'minification filtering remains authored').toBe('nearest');
  expect(sampler?.mipmapFilter, 'mipmap filtering remains authored').toBe('linear');

  for (const texture of parsedMaterial.generatedTextures) {
    texture.destroy();
  }
  device.destroy();
});
