// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {isBrowser} from 'probe.gl/env';
import {ClipSpace} from '@luma.gl/engine';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {GPUTextResources} from '../../src/text-2d/gpu-text-resources';
import {
  GlyphRangeLoader,
  buildGlyphFontAtlas,
  createGlyphFontRenderer,
  parseGlyphRange,
  measureFontAtlasText
} from '../../src/fonts';
import {makeGlyphRange, makeGlyphResponse} from './glyph-range-fixture';

test('GPU glyph atlas interpolates coverage between adjacent texels', async () => {
  if (!isBrowser()) return;
  const device = await getWebGLTestDevice();
  const loader = new GlyphRangeLoader({
    url: 'https://example.com/{fontstack}/{range}',
    fetch: async () => makeGlyphResponse([65])
  });
  const atlas = await buildGlyphFontAtlas(loader, 'Regular', 'A');
  const page = document.createElement('canvas');
  page.width = 2;
  page.height = 1;
  page
    .getContext('2d')!
    .putImageData(new ImageData(new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 255]), 2, 1), 0, 0);
  const resources = new GPUTextResources(device, {
    fontAtlas: {...atlas, pages: [page], width: 2, height: 1}
  });
  await resources.atlasTexture.ready;
  const framebuffer = device.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: ['rgba8unorm']
  });
  const model = new ClipSpace(device, {
    fs: `#version 300 es
precision highp float;
uniform highp sampler2DArray fontAtlasTexture;
out vec4 fragmentColor;
void main() {
  float alpha = texture(fontAtlasTexture, vec3(0.5, 0.5, 0.0)).a;
  fragmentColor = vec4(alpha, alpha, alpha, 1.0);
}`,
    bindings: {fontAtlasTexture: resources.atlasTexture},
    parameters: {depthWriteEnabled: false}
  });
  try {
    expect(resources.atlasTexture.sampler.props.minFilter).toBe('linear');
    expect(resources.atlasTexture.sampler.props.magFilter).toBe('linear');
    const commandEncoder = device.createCommandEncoder();
    model.predraw(commandEncoder);
    const renderPass = commandEncoder.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
    expect(model.draw(renderPass)).toBe(true);
    renderPass.end();
    device.submit(commandEncoder.finish());
    const pixels = device.readPixelsToArrayWebGL(framebuffer);
    // Nearest sampling returns 0 or 255. Linear sampling reconstructs the halfway coverage.
    expect(Math.abs(pixels[0] - 128)).toBeLessThanOrEqual(1);
  } finally {
    model.destroy();
    framebuffer.destroy();
    resources.destroy();
  }
});

test('packs server glyph pixels and metrics into independent atlas pages', async () => {
  if (!isBrowser()) return;
  const fetch = vi.fn(async () => makeGlyphResponse([65]));
  const loader = new GlyphRangeLoader({url: 'https://example.com/{fontstack}/{range}', fetch});
  const [first, second] = await Promise.all([
    buildGlyphFontAtlas(loader, 'Regular', 'A'),
    buildGlyphFontAtlas(loader, 'Regular', ['A'])
  ]);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(first.pages[0]).not.toBe(second.pages[0]);
  expect(first.mapping.A.advance).toBe(5);
  expect(first.mapping.A.width).toBe(7);
  expect(first.baselineOffset).toBe(-17);
  expect(first.lineHeight).toBe(24);
  expect(first.renderSettings).toEqual({mode: 'sdf', threshold: 0.75, smoothing: 0.1});
  expect(measureFontAtlasText('A', first).advance).toBe(5);
  const canvas = first.pages[0] as HTMLCanvasElement;
  const mapping = first.mapping.A;
  const pixels = canvas.getContext('2d')!.getImageData(mapping.x, mapping.y, 7, 7).data;
  expect([...pixels].filter((_, index) => index % 4 === 3)).toEqual(Array(49).fill(255));
  const renderer = createGlyphFontRenderer(
    new Map(parseGlyphRange(makeGlyphRange([65])).map(glyph => [glyph.id, glyph]))
  );
  expect(renderer.draw('A').layoutOffsetX).toBe(-5);
  expect(renderer.draw('B').data.width).toBe(1);
});

test('different bearings retain separate bitmap cells and horizontal layout offsets', async () => {
  if (!isBrowser()) return;
  const [glyph] = parseGlyphRange(makeGlyphRange([65]));
  const loader = new GlyphRangeLoader({url: 'https://example.com/{fontstack}/{range}'});
  vi.spyOn(loader, 'loadGlyphs').mockResolvedValue(
    new Map([
      [65, {...glyph, left: 4}],
      [66, {...glyph, id: 66, left: -2, bitmap: new Uint8Array(49).fill(127)}]
    ])
  );
  const atlas = await buildGlyphFontAtlas(loader, 'Regular', 'AB');
  const context = (atlas.pages[0] as HTMLCanvasElement).getContext('2d')!;
  for (const [character, alpha, offset] of [
    ['A', 255, 1],
    ['B', 127, -5]
  ] as const) {
    const frame = atlas.mapping[character];
    const pixels = context.getImageData(frame.x, frame.y, frame.width, frame.height).data;
    expect([...pixels].filter((_, index) => index % 4 === 3)).toEqual(Array(49).fill(alpha));
    expect(frame.layoutOffsetX).toBe(offset);
    expect(frame.advance).toBe(5);
  }
});

test('border-only spaces retain their advance in the packed atlas', async () => {
  if (!isBrowser()) return;
  const loader = new GlyphRangeLoader({
    url: 'https://example.com/{fontstack}/{range}',
    fetch: async () =>
      new Response(makeGlyphRange([32], {width: 0, height: 0, bitmap: Array(36).fill(0)}))
  });
  const atlas = await buildGlyphFontAtlas(loader, 'Regular', ' ');
  expect(atlas.mapping[' '].advance).toBe(5);
  expect(measureFontAtlasText('  ', atlas).advance).toBe(10);
});
