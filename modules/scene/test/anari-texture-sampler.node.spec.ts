import {ANARIDevice} from '@luma.gl/scene';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {
  type ANARIJSONScene,
  createANARIJSONScene,
  preloadANARIJSONTextures
} from '../../../examples/showcase/scene/playground-scene';

it('ANARI JSON textures materialize authored samplers and decode color textures exactly once', async () => {
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
    expect(
      colorTexture?.format,
      'authored color maps use hardware sRGB decoding without manual duplicate conversion'
    ).toBe('rgba8unorm-srgb');
    expect(dataTexture?.format, 'authored data maps remain linear').toBe('rgba8unorm');
    expect(
      colorTexture?.mipLevels,
      'authored mipmap filtering allocates the complete 8×4 source-image mip chain'
    ).toBe(4);
    expect(dataTexture?.mipLevels, 'ordinary data textures avoid unused mip allocation').toBe(1);
    expect(
      colorTexture?.sampler.props.addressModeU,
      'horizontal clamp reaches the backend sampler'
    ).toBe('clamp-to-edge');
    expect(
      colorTexture?.sampler.props.addressModeV,
      'vertical mirror wrapping reaches the backend sampler'
    ).toBe('mirror-repeat');
    expect(
      colorTexture?.sampler.props.minFilter,
      'authored nearest minification reaches the backend sampler'
    ).toBe('nearest');
    expect(
      colorTexture?.sampler.props.magFilter,
      'authored nearest magnification reaches the backend sampler'
    ).toBe('nearest');
    expect(
      colorTexture?.sampler.props.mipmapFilter,
      'authored linear mipmap filtering reaches the backend sampler'
    ).toBe('linear');
    handle.destroy();
  } finally {
    device.destroy();
    globalThis.createImageBitmap = originalCreateImageBitmap;
  }

  void 0;
});
