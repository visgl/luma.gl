// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getNullTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Texture, type TextureFormat} from '@luma.gl/core';
import {DynamicTexture} from '../../src/index';

const RENDER_MIPMAP_TEST_FORMAT = 'rgba8unorm';
const NON_COLOR_RENDER_TEST_FORMAT = 'rg16uint';
const COMPUTE_MIPMAP_TEST_FORMAT = 'rgba8unorm';

function createTestLabel(
  method: 'render' | 'compute',
  format: string,
  dimension: string,
  detail: string
): string {
  return `[${method}][${format}][${dimension}] ${detail}`;
}

test('DynamicTexture WebGPU [render][rgba8unorm] 2d mipmaps', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU device not available');
    t.end();
    return;
  }

  const texture = new DynamicTexture(device, {
    dimension: '2d',
    width: 4,
    height: 4,
    format: RENDER_MIPMAP_TEST_FORMAT,
    mipmaps: true,
    mipLevels: 'auto',
    data: makeQuadrantMipData(4, 4, [
      [0, 0, 0, 255],
      [4, 0, 0, 255],
      [8, 0, 0, 255],
      [12, 0, 0, 255]
    ])
  });
  await texture.ready;

  const manualTexture = new DynamicTexture(device, {
    dimension: '2d',
    width: 4,
    height: 4,
    format: RENDER_MIPMAP_TEST_FORMAT,
    mipmaps: false,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC,
    mipLevels: 3,
    data: makeQuadrantMipData(4, 4, [
      [0, 0, 0, 255],
      [4, 0, 0, 255],
      [8, 0, 0, 255],
      [12, 0, 0, 255]
    ])
  });
  await manualTexture.ready;

  manualTexture.generateMipmaps();

  const manualBytes = await readTextureBytes(manualTexture.texture, {
    mipLevel: 1,
    width: 2,
    height: 2
  });
  t.deepEqual(
    Array.from(manualBytes.slice(0, 4)),
    [0, 0, 0, 255],
    createTestLabel(
      'render',
      RENDER_MIPMAP_TEST_FORMAT,
      '2d',
      'manual generate mip level 1: quadrant 1'
    )
  );
  t.deepEqual(
    Array.from(manualBytes.slice(4, 8)),
    [4, 0, 0, 255],
    createTestLabel(
      'render',
      RENDER_MIPMAP_TEST_FORMAT,
      '2d',
      'manual generate mip level 1: quadrant 2'
    )
  );
  t.deepEqual(
    Array.from(manualBytes.slice(8, 12)),
    [8, 0, 0, 255],
    createTestLabel(
      'render',
      RENDER_MIPMAP_TEST_FORMAT,
      '2d',
      'manual generate mip level 1: quadrant 3'
    )
  );
  t.deepEqual(
    Array.from(manualBytes.slice(12, 16)),
    [12, 0, 0, 255],
    createTestLabel(
      'render',
      RENDER_MIPMAP_TEST_FORMAT,
      '2d',
      'manual generate mip level 1: quadrant 4'
    )
  );

  const manualBytesLevel2 = await readTextureBytes(manualTexture.texture, {
    mipLevel: 2,
    width: 1,
    height: 1
  });
  t.deepEqual(
    Array.from(manualBytesLevel2.slice(0, 4)),
    [6, 0, 0, 255],
    createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'manual generate mip level 2')
  );
  manualTexture.destroy();

  const bytes = await readTextureBytes(texture.texture, {
    mipLevel: 1,
    width: 2,
    height: 2
  });
  t.deepEqual(
    Array.from(bytes.slice(0, 4)),
    [0, 0, 0, 255],
    createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'mip level 1: quadrant 1')
  );
  t.deepEqual(
    Array.from(bytes.slice(4, 8)),
    [4, 0, 0, 255],
    createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'mip level 1: quadrant 2')
  );
  t.deepEqual(
    Array.from(bytes.slice(8, 12)),
    [8, 0, 0, 255],
    createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'mip level 1: quadrant 3')
  );
  t.deepEqual(
    Array.from(bytes.slice(12, 16)),
    [12, 0, 0, 255],
    createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'mip level 1: quadrant 4')
  );

  const bytesLevel2 = await readTextureBytes(texture.texture, {
    mipLevel: 2,
    width: 1,
    height: 1
  });
  t.deepEqual(
    Array.from(bytesLevel2.slice(0, 4)),
    [6, 0, 0, 255],
    createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'mip level 2')
  );

  texture.destroy();
  t.end();
});

test('DynamicTexture WebGPU [render][rgba8unorm] 2d-array mipmaps', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU device not available');
    t.end();
    return;
  }

  const texture = new DynamicTexture(device, {
    dimension: '2d-array',
    width: 2,
    height: 2,
    depth: 2,
    format: RENDER_MIPMAP_TEST_FORMAT,
    mipmaps: true,
    mipLevels: 'auto',
    data: [makeSolidMipData(2, 2, [255, 0, 0, 255]), makeSolidMipData(2, 2, [0, 255, 0, 255])]
  });
  await texture.ready;

  const bytes = await readTextureBytes(texture.texture, {
    mipLevel: 1,
    width: 1,
    height: 1,
    depthOrArrayLayers: 2
  });
  t.deepEqual(
    Array.from(bytes.slice(0, 4)),
    [255, 0, 0, 255],
    createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d-array', 'layer 0 mip level 1')
  );
  t.deepEqual(
    Array.from(bytes.slice(4, 8)),
    [0, 255, 0, 255],
    createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d-array', 'layer 1 mip level 1')
  );

  texture.destroy();
  t.end();
});

test('DynamicTexture WebGPU [render][rgba8unorm] cube mipmaps', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU device not available');
    t.end();
    return;
  }

  const texture = new DynamicTexture(device, {
    dimension: 'cube',
    width: 2,
    height: 2,
    format: RENDER_MIPMAP_TEST_FORMAT,
    mipmaps: true,
    mipLevels: 'auto',
    data: {
      '+X': makeSolidMipData(2, 2, [255, 0, 0, 255]),
      '-X': makeSolidMipData(2, 2, [0, 255, 0, 255]),
      '+Y': makeSolidMipData(2, 2, [0, 0, 255, 255]),
      '-Y': makeSolidMipData(2, 2, [255, 255, 0, 255]),
      '+Z': makeSolidMipData(2, 2, [255, 0, 255, 255]),
      '-Z': makeSolidMipData(2, 2, [0, 255, 255, 255])
    }
  });
  await texture.ready;

  const bytes = await readTextureBytes(texture.texture, {
    mipLevel: 1,
    width: 1,
    height: 1,
    depthOrArrayLayers: 6
  });

  const cubeExpected: number[][] = [
    [255, 0, 0, 255],
    [0, 255, 0, 255],
    [0, 0, 255, 255],
    [255, 255, 0, 255],
    [255, 0, 255, 255],
    [0, 255, 255, 255]
  ];
  cubeExpected.forEach((expectedValues, layer) => {
    t.deepEqual(
      Array.from(bytes.slice(layer * 4, layer * 4 + 4)),
      expectedValues,
      createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, 'cube', `layer ${layer} mip level 1`)
    );
  });

  texture.destroy();
  t.end();
});

test('DynamicTexture WebGPU [render][rgba8unorm] cube-array mipmaps', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU device not available');
    t.end();
    return;
  }

  const redCube = {
    '+X': makeSolidMipData(2, 2, [255, 0, 0, 255]),
    '-X': makeSolidMipData(2, 2, [255, 0, 0, 255]),
    '+Y': makeSolidMipData(2, 2, [255, 0, 0, 255]),
    '-Y': makeSolidMipData(2, 2, [255, 0, 0, 255]),
    '+Z': makeSolidMipData(2, 2, [255, 0, 0, 255]),
    '-Z': makeSolidMipData(2, 2, [255, 0, 0, 255])
  };

  const greenCube = {
    '+X': makeSolidMipData(2, 2, [0, 255, 0, 255]),
    '-X': makeSolidMipData(2, 2, [0, 255, 0, 255]),
    '+Y': makeSolidMipData(2, 2, [0, 255, 0, 255]),
    '-Y': makeSolidMipData(2, 2, [0, 255, 0, 255]),
    '+Z': makeSolidMipData(2, 2, [0, 255, 0, 255]),
    '-Z': makeSolidMipData(2, 2, [0, 255, 0, 255])
  };

  const texture = new DynamicTexture(device, {
    dimension: 'cube-array',
    width: 2,
    height: 2,
    depth: 12,
    format: RENDER_MIPMAP_TEST_FORMAT,
    mipmaps: true,
    mipLevels: 'auto',
    data: [redCube, greenCube]
  });
  await texture.ready;

  const bytes = await readTextureBytes(texture.texture, {
    mipLevel: 1,
    width: 1,
    height: 1,
    depthOrArrayLayers: 12
  });

  for (let layer = 0; layer < 6; ++layer) {
    t.deepEqual(
      Array.from(bytes.slice(layer * 4, layer * 4 + 4)),
      [255, 0, 0, 255],
      createTestLabel(
        'render',
        RENDER_MIPMAP_TEST_FORMAT,
        'cube-array',
        `cube[0] layer ${layer} mip level 1`
      )
    );
  }
  for (let layer = 6; layer < 12; ++layer) {
    t.deepEqual(
      Array.from(bytes.slice(layer * 4, layer * 4 + 4)),
      [0, 255, 0, 255],
      createTestLabel(
        'render',
        RENDER_MIPMAP_TEST_FORMAT,
        'cube-array',
        `cube[1] layer ${layer} mip level 1`
      )
    );
  }

  texture.destroy();
  t.end();
});

test('DynamicTexture WebGPU [compute][rgba8unorm] 3d mipmaps', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU device not available');
    t.end();
    return;
  }

  const width = 4;
  const height = 4;
  const depth = 4;
  const data = new Array(depth).fill(0).map(() => ({
    data: new Uint8Array(width * height * 4),
    width,
    height
  }));

  for (let z = 0; z < depth; ++z) {
    const layer = data[z].data;
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const red = (x & 1) === 1 ? 254 : 0;
        const index = (y * width + x) * 4;
        layer[index] = red;
        layer[index + 1] = 0;
        layer[index + 2] = 0;
        layer[index + 3] = 255;
      }
    }
  }

  const texture = new DynamicTexture(device, {
    dimension: '3d',
    width,
    height,
    depth,
    format: COMPUTE_MIPMAP_TEST_FORMAT,
    mipmaps: true,
    mipLevels: 'auto',
    data
  });
  await texture.ready;

  const bytes = await readTextureBytes(texture.texture, {
    mipLevel: 1,
    width: 2,
    height: 2,
    depthOrArrayLayers: 2
  });
  t.deepEqual(
    Array.from(bytes.slice(0, 4)),
    [127, 0, 0, 255],
    createTestLabel('compute', COMPUTE_MIPMAP_TEST_FORMAT, '3d', 'mip level 1: first voxel')
  );
  t.deepEqual(
    Array.from(bytes.slice(16, 20)),
    [127, 0, 0, 255],
    createTestLabel('compute', COMPUTE_MIPMAP_TEST_FORMAT, '3d', 'mip level 1: cross-layer voxel')
  );

  const bytesLevel2 = await readTextureBytes(texture.texture, {
    mipLevel: 2,
    width: 1,
    height: 1,
    depthOrArrayLayers: 1
  });
  t.deepEqual(
    Array.from(bytesLevel2.slice(0, 4)),
    [127, 0, 0, 255],
    createTestLabel('compute', COMPUTE_MIPMAP_TEST_FORMAT, '3d', 'mip level 2')
  );

  texture.destroy();
  t.end();
});

test('DynamicTexture WebGPU [render][rgba8unorm] throws for unsupported 3d render format on cube', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU device not available');
    t.end();
    return;
  }

  const texture = new DynamicTexture(device, {
    dimension: 'cube',
    width: 2,
    height: 2,
    format: RENDER_MIPMAP_TEST_FORMAT,
    mipmaps: false,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC,
    mipLevels: 2,
    data: {
      '+X': makeSolidMipData(2, 2, [255, 0, 0, 255]),
      '-X': makeSolidMipData(2, 2, [0, 255, 0, 255]),
      '+Y': makeSolidMipData(2, 2, [0, 0, 255, 255]),
      '-Y': makeSolidMipData(2, 2, [255, 255, 0, 255]),
      '+Z': makeSolidMipData(2, 2, [255, 0, 255, 255]),
      '-Z': makeSolidMipData(2, 2, [0, 255, 255, 255])
    }
  });
  await texture.ready;

  const originalGetTextureFormatCapabilities = device.getTextureFormatCapabilities.bind(device);
  (device as any).getTextureFormatCapabilities = (format: string) => {
    const capabilities = originalGetTextureFormatCapabilities(format);
    if (format === RENDER_MIPMAP_TEST_FORMAT) {
      return {...capabilities, render: false, filter: false};
    }
    return capabilities;
  };

  try {
    const error = captureError(() => texture.generateMipmaps());
    t.ok(error && /Cannot run render mipmap generation/.test(error.message), 'should throw');
    t.equal(
      String(error?.message || '').includes(`format "${RENDER_MIPMAP_TEST_FORMAT}"`),
      true,
      createTestLabel(
        'render',
        RENDER_MIPMAP_TEST_FORMAT,
        'cube',
        'throws for render path capability mismatch'
      )
    );
  } finally {
    (device as any).getTextureFormatCapabilities = originalGetTextureFormatCapabilities;
    texture.destroy();
  }

  t.end();
});

test('DynamicTexture WebGPU [render][rg16uint] throws for unsupported render format capabilities', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU device not available');
    t.end();
    return;
  }

  const texture = new DynamicTexture(device, {
    dimension: '2d',
    width: 2,
    height: 2,
    format: NON_COLOR_RENDER_TEST_FORMAT,
    mipmaps: false,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC,
    mipLevels: 2,
    data: makeSolidMipData(2, 2, [3, 0, 0, 0])
  });
  await texture.ready;

  try {
    const error = captureError(() => texture.generateMipmaps());
    t.ok(error && /Cannot run render mipmap generation/.test(error.message), 'should throw');
    t.equal(
      String(error?.message || '').includes(`format "${NON_COLOR_RENDER_TEST_FORMAT}"`),
      true,
      createTestLabel(
        'render',
        NON_COLOR_RENDER_TEST_FORMAT,
        '2d',
        'throws for non-color format check'
      )
    );
    t.equal(
      String(error?.message || '').includes('Required capabilities'),
      true,
      createTestLabel(
        'render',
        NON_COLOR_RENDER_TEST_FORMAT,
        '2d',
        'throws with required capability list'
      )
    );
  } finally {
    texture.destroy();
  }

  t.end();
});

test('DynamicTexture WebGPU [compute][rgba8unorm] throws for unsupported compute format capabilities', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU device not available');
    t.end();
    return;
  }

  const texture = new DynamicTexture(device, {
    dimension: '3d',
    width: 2,
    height: 2,
    depth: 2,
    format: COMPUTE_MIPMAP_TEST_FORMAT,
    mipmaps: false,
    usage: Texture.SAMPLE | Texture.STORAGE | Texture.COPY_DST | Texture.COPY_SRC,
    mipLevels: 2,
    data: [makeSolidMipData(2, 2, [255, 0, 0, 255]), makeSolidMipData(2, 2, [255, 0, 0, 255])]
  });
  await texture.ready;

  const originalGetTextureFormatCapabilities = device.getTextureFormatCapabilities.bind(device);
  (device as any).getTextureFormatCapabilities = (format: string) => {
    const capabilities = originalGetTextureFormatCapabilities(format);
    if (format === COMPUTE_MIPMAP_TEST_FORMAT) {
      return {...capabilities, filter: false, store: false};
    }
    return capabilities;
  };

  try {
    const error = captureError(() => texture.generateMipmaps());
    t.ok(error && /Cannot run compute mipmap generation/.test(error.message), 'should throw');
    t.equal(
      String(error?.message || '').includes(`format "${COMPUTE_MIPMAP_TEST_FORMAT}"`),
      true,
      createTestLabel(
        'compute',
        COMPUTE_MIPMAP_TEST_FORMAT,
        '3d',
        'throws for compute capability mismatch'
      )
    );
  } finally {
    (device as any).getTextureFormatCapabilities = originalGetTextureFormatCapabilities;
    texture.destroy();
  }

  t.end();
});

test('DynamicTexture WebGPU [compute][rg16uint] throws for unsupported compute format capabilities', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU device not available');
    t.end();
    return;
  }

  const texture = new DynamicTexture(device, {
    dimension: '3d',
    width: 2,
    height: 2,
    depth: 2,
    format: NON_COLOR_RENDER_TEST_FORMAT,
    mipmaps: false,
    usage: Texture.SAMPLE | Texture.COPY_DST | Texture.COPY_SRC,
    mipLevels: 2,
    data: [makeSolidMipData(2, 2, [3, 0, 0, 0]), makeSolidMipData(2, 2, [3, 0, 0, 0])]
  });
  await texture.ready;

  try {
    const error = captureError(() => texture.generateMipmaps());
    t.ok(error && /Cannot run compute mipmap generation/.test(error.message), 'should throw');
    t.equal(
      String(error?.message || '').includes(`format "${NON_COLOR_RENDER_TEST_FORMAT}"`),
      true,
      createTestLabel(
        'compute',
        NON_COLOR_RENDER_TEST_FORMAT,
        '3d',
        'throws for non-color format check'
      )
    );
    t.equal(
      String(error?.message || '').includes('Required capabilities'),
      true,
      createTestLabel(
        'compute',
        NON_COLOR_RENDER_TEST_FORMAT,
        '3d',
        'throws with required capability list'
      )
    );
  } finally {
    texture.destroy();
  }

  t.end();
});

test('DynamicTexture WebGPU [render][rgba8unorm] throws when render capabilities unsupported', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU device not available');
    t.end();
    return;
  }

  const texture = new DynamicTexture(device, {
    dimension: '2d',
    width: 2,
    height: 2,
    format: RENDER_MIPMAP_TEST_FORMAT,
    mipmaps: false,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC,
    mipLevels: 2,
    data: {
      data: new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255]),
      width: 2,
      height: 2
    }
  });
  await texture.ready;

  const originalGetTextureFormatCapabilities = device.getTextureFormatCapabilities.bind(device);
  (device as any).getTextureFormatCapabilities = (format: string) => {
    const capabilities = originalGetTextureFormatCapabilities(format);
    if (format === RENDER_MIPMAP_TEST_FORMAT) {
      return {...capabilities, render: false, filter: false};
    }
    return capabilities;
  };

  try {
    const error = captureError(() => texture.generateMipmaps());
    t.ok(error && /Cannot run render mipmap generation/.test(error.message), 'should throw');
    t.equal(
      String(error?.message || '').includes(`format "${RENDER_MIPMAP_TEST_FORMAT}"`),
      true,
      createTestLabel(
        'render',
        RENDER_MIPMAP_TEST_FORMAT,
        '2d',
        'throws for unsupported render capabilities'
      )
    );
  } finally {
    (device as any).getTextureFormatCapabilities = originalGetTextureFormatCapabilities;
    texture.destroy();
  }

  t.end();
});

test('DynamicTexture NullDevice accepts compressed mip arrays via textureFormat', async t => {
  const device = await getNullTestDevice();

  const texture = new DynamicTexture(device, {
    dimension: '2d',
    mipmaps: true,
    data: [
      makeMipLevel(16, 16, 'bc7-rgba-unorm'),
      makeMipLevel(8, 8, 'bc7-rgba-unorm'),
      makeMipLevel(4, 4, 'bc7-rgba-unorm')
    ]
  });
  await texture.ready;

  t.equal(texture.texture.format, 'bc7-rgba-unorm', 'texture format resolved from textureFormat');
  t.equal(texture.texture.mipLevels, 3, 'all provided mip levels are allocated');
  t.equal(
    texture.texture.props.usage,
    Texture.SAMPLE | Texture.COPY_DST,
    'compressed textures do not inherit render attachment usage by default'
  );

  texture.destroy();
  t.end();
});

test('DynamicTexture NullDevice accepts compressed mip arrays via format alias', async t => {
  const device = await getNullTestDevice();

  const texture = new DynamicTexture(device, {
    dimension: '2d',
    data: [
      makeMipLevel(16, 16, undefined, 'bc7-rgba-unorm'),
      makeMipLevel(8, 8, undefined, 'bc7-rgba-unorm')
    ]
  });
  await texture.ready;

  t.equal(texture.texture.format, 'bc7-rgba-unorm', 'texture format resolved from format alias');
  t.equal(texture.texture.mipLevels, 2, 'format alias mip chain is preserved');

  texture.destroy();
  t.end();
});

test('DynamicTexture NullDevice accepts equal format and textureFormat fields', async t => {
  const device = await getNullTestDevice();

  const texture = new DynamicTexture(device, {
    dimension: '2d',
    data: [
      {
        data: new Uint8Array(16 * 16),
        width: 16,
        height: 16,
        textureFormat: 'bc4-r-unorm',
        format: 'bc4-r-unorm'
      }
    ]
  });
  await texture.ready;

  t.equal(texture.texture.format, 'bc4-r-unorm', 'matching fields are accepted');

  texture.destroy();
  t.end();
});

test('DynamicTexture NullDevice rejects conflicting format and textureFormat fields', async t => {
  const device = await getNullTestDevice();

  const texture = new DynamicTexture(device, {
    dimension: '2d',
    data: [
      {
        data: new Uint8Array(16 * 16 * 4),
        width: 16,
        height: 16,
        textureFormat: 'rgba8unorm',
        format: 'rgba8unorm-srgb'
      }
    ]
  });

  try {
    await texture.ready;
    t.fail('expected texture.ready to reject');
  } catch (error) {
    t.match(String(error), /Conflicting texture formats/, 'rejects conflicting mip-level fields');
  }

  texture.destroy();
  t.end();
});

test('DynamicTexture NullDevice truncates mismatched per-level formats', async t => {
  const device = await getNullTestDevice();

  const texture = new DynamicTexture(device, {
    dimension: '2d',
    data: [makeMipLevel(16, 16, 'bc7-rgba-unorm'), makeMipLevel(8, 8, 'etc2-rgb8unorm')]
  });
  await texture.ready;

  t.equal(texture.texture.format, 'bc7-rgba-unorm', 'base level format wins');
  t.equal(texture.texture.mipLevels, 1, 'chain truncates at mismatched level format');

  texture.destroy();
  t.end();
});

test('DynamicTexture NullDevice truncates invalid mip dimensions', async t => {
  const device = await getNullTestDevice();

  const texture = new DynamicTexture(device, {
    dimension: '2d',
    data: [makeMipLevel(16, 16, 'bc7-rgba-unorm'), makeMipLevel(9, 9, 'bc7-rgba-unorm')]
  });
  await texture.ready;

  t.equal(
    texture.texture.mipLevels,
    1,
    'chain truncates when mip dimensions do not halve correctly'
  );

  texture.destroy();
  t.end();
});

test('DynamicTexture NullDevice caps compressed mip arrays at one block', async t => {
  const device = await getNullTestDevice();

  const texture = new DynamicTexture(device, {
    dimension: '2d',
    data: [makeMipLevel(16, 16, 'astc-10x10-unorm'), makeMipLevel(8, 8, 'astc-10x10-unorm')]
  });
  await texture.ready;

  t.equal(texture.texture.format, 'astc-10x10-unorm', 'compressed format is preserved');
  t.equal(texture.texture.mipLevels, 1, 'mip levels below one block are ignored');

  texture.destroy();
  t.end();
});

function makeSolidMipData(
  width: number,
  height: number,
  color: [number, number, number, number]
): {data: Uint8Array; width: number; height: number} {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const pixelIndex = (y * width + x) * 4;
      data[pixelIndex] = color[0];
      data[pixelIndex + 1] = color[1];
      data[pixelIndex + 2] = color[2];
      data[pixelIndex + 3] = color[3];
    }
  }

  return {data, width, height};
}

function makeQuadrantMipData(
  width: number,
  height: number,
  quadrants: [number, number, number, number][]
): {data: Uint8Array; width: number; height: number} {
  const data = new Uint8Array(width * height * 4);
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const index = (y * width + x) * 4;
      const quadrant = (y < halfHeight ? 0 : 2) + (x < halfWidth ? 0 : 1);
      const color = quadrants[quadrant];
      data[index] = color[0];
      data[index + 1] = color[1];
      data[index + 2] = color[2];
      data[index + 3] = color[3];
    }
  }

  return {data, width, height};
}

function makeMipLevel(
  width: number,
  height: number,
  textureFormat?: TextureFormat,
  format?: TextureFormat
): {
  data: Uint8Array;
  width: number;
  height: number;
  textureFormat?: TextureFormat;
  format?: TextureFormat;
} {
  const bytesPerElement = textureFormat?.startsWith('bc4') || format?.startsWith('bc4') ? 1 : 4;
  return {
    data: new Uint8Array(Math.max(1, width * height * bytesPerElement)),
    width,
    height,
    textureFormat,
    format
  };
}

function captureError(callback: () => void): Error | null {
  try {
    callback();
    return null;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

async function readTextureBytes(
  texture: Texture,
  options: {mipLevel?: number; width?: number; height?: number; depthOrArrayLayers?: number}
): Promise<Uint8Array> {
  const arrayBuffer = await texture.readDataAsync(options);
  return compactTextureBytes(texture, arrayBuffer, options);
}

function compactTextureBytes(
  texture: Texture,
  arrayBuffer: ArrayBuffer | ArrayBufferView,
  options: {mipLevel?: number; width?: number; height?: number; depthOrArrayLayers?: number}
): Uint8Array {
  const layout = texture.computeMemoryLayout(options);
  const mipLevel = options.mipLevel ?? 0;
  const width = options.width ?? Math.max(1, texture.width >> mipLevel);
  const height = options.height ?? Math.max(1, texture.height >> mipLevel);
  const depthOrArrayLayers =
    options.depthOrArrayLayers ??
    (texture.dimension === '3d' ? Math.max(1, texture.depth >> mipLevel) : texture.depth);
  const rowByteLength = width * layout.bytesPerPixel;
  const compact = new Uint8Array(rowByteLength * height * depthOrArrayLayers);
  const source = arrayBuffer instanceof ArrayBuffer ? new Uint8Array(arrayBuffer) : new Uint8Array(arrayBuffer.buffer, arrayBuffer.byteOffset, arrayBuffer.byteLength);

  for (let layer = 0; layer < depthOrArrayLayers; layer++) {
    for (let row = 0; row < height; row++) {
      const sourceOffset =
        layer * layout.rowsPerImage * layout.bytesPerRow + row * layout.bytesPerRow;
      const destinationOffset = layer * height * rowByteLength + row * rowByteLength;
      compact.set(source.slice(sourceOffset, sourceOffset + rowByteLength), destinationOffset);
    }
  }

  return compact;
}
