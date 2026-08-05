import {ANARIDevice} from '@luma.gl/anari';
import {NullDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {
  type ANARIJSONScene,
  createANARIJSONScene,
  preloadANARIJSONTextures
} from '../../../examples/showcase/anari/playground-scene';

test('ANARI JSON textures materialize authored samplers and decode color textures exactly once', async testContext => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  globalThis.createImageBitmap = async () => ({width: 8, height: 4}) as ImageBitmap;
  const device = new ANARIDevice(new NullDevice({}));
  const scene: ANARIJSONScene = {
    version: 1,
    name: 'AUTHORED SAMPLERS',
    camera: {'@@type': 'perspective'},
    geometries: {
      triangle: {
        '@@type': 'triangle',
        'vertex.position': [0, 0, 0, 1, 0, 0, 0, 1, 0],
        'vertex.attribute1': [0, 0, 1, 0, 0, 1]
      }
    },
    textures: {
      sourceColor: {
        source: 'data:image/png;base64,iVBORw0KGgo=',
        colorSpace: 'srgb',
        sampler: {
          addressModeU: 'clamp-to-edge',
          addressModeV: 'mirror-repeat',
          minFilter: 'nearest',
          magFilter: 'nearest',
          mipmapFilter: 'linear'
        }
      },
      sourceData: {
        source: 'data:image/png;base64,iVBORw0KGgo=',
        colorSpace: 'linear'
      }
    },
    materials: {
      physical: {
        '@@type': 'physicallyBased',
        baseColorTexture: 'sourceColor',
        normalTexture: 'sourceData'
      }
    },
    surfaces: {triangle: {geometry: 'triangle', material: 'physical'}},
    world: {surfaces: ['triangle']}
  };

  try {
    await preloadANARIJSONTextures(scene);
    const handle = createANARIJSONScene(device, scene);
    const surface = handle.frame.getParameter('world').getParameter('surface')?.[0];
    const material = surface?.getParameter('material');
    const colorTexture = material?.getParameter('baseColorTexture')?.getParameter('image');
    const dataTexture = material?.getParameter('normalTexture')?.getParameter('image');
    testContext.equal(
      colorTexture?.format,
      'rgba8unorm-srgb',
      'authored color maps use hardware sRGB decoding without manual duplicate conversion'
    );
    testContext.equal(dataTexture?.format, 'rgba8unorm', 'authored data maps remain linear');
    testContext.equal(
      colorTexture?.mipLevels,
      4,
      'authored mipmap filtering allocates the complete 8×4 source-image mip chain'
    );
    testContext.equal(
      dataTexture?.mipLevels,
      1,
      'ordinary data textures avoid unused mip allocation'
    );
    testContext.equal(
      colorTexture?.sampler.props.addressModeU,
      'clamp-to-edge',
      'horizontal clamp reaches the backend sampler'
    );
    testContext.equal(
      colorTexture?.sampler.props.addressModeV,
      'mirror-repeat',
      'vertical mirror wrapping reaches the backend sampler'
    );
    testContext.equal(
      colorTexture?.sampler.props.minFilter,
      'nearest',
      'authored nearest minification reaches the backend sampler'
    );
    testContext.equal(
      colorTexture?.sampler.props.magFilter,
      'nearest',
      'authored nearest magnification reaches the backend sampler'
    );
    testContext.equal(
      colorTexture?.sampler.props.mipmapFilter,
      'linear',
      'authored linear mipmap filtering reaches the backend sampler'
    );
    handle.destroy();
  } finally {
    device.destroy();
    globalThis.createImageBitmap = originalCreateImageBitmap;
  }

  testContext.end();
});
