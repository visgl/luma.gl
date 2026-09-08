// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {isBrowser} from '@probe.gl/env';
import {
  _resolveMsdfFontPageUrl,
  buildMsdfFontAtlas,
  loadMsdfFontAtlas
} from '../../src/text-2d/build-msdf-font-atlas';
import {getTextKerningOffset} from '../../src/text-2d/atlas/text-utils';

it('buildMsdfFontAtlas preserves BMFont page, offset, and kerning metadata', () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const fontAtlas = buildMsdfFontAtlas({
    data: {
      common: {lineHeight: 32, base: 24, scaleW: 32, scaleH: 32, pages: 2},
      pages: ['font-0.png', 'font-1.png'],
      chars: [
        {
          id: 65,
          index: 17,
          char: 'A',
          x: 1,
          y: 2,
          width: 8,
          height: 10,
          xoffset: -1,
          yoffset: 3,
          xadvance: 9,
          chnl: 15
        },
        {
          id: 66,
          index: 3,
          char: 'B',
          x: 4,
          y: 5,
          width: 7,
          height: 11,
          xoffset: 2,
          yoffset: 4,
          xadvance: 8,
          chnl: 15,
          page: 1
        }
      ],
      kernings: [{first: 65, second: 66, amount: -2}],
      distanceField: {fieldType: 'msdf', distanceRange: 4}
    },
    pages: [new ImageData(32, 32), new ImageData(32, 32)]
  });

  expect(fontAtlas.renderSettings.mode, 'parsed font selects MSDF sampling').toBe('msdf');
  expect(fontAtlas.pages.length, 'parsed font retains every atlas page').toBe(2);
  expect(fontAtlas.mapping.A?.x, 'glyph mapping uses BMFont id instead of atlas index').toBe(1);
  expect(fontAtlas.mapping.B?.atlasPage, 'glyph mapping retains BMFont page ids').toBe(1);
  expect(
    [fontAtlas.mapping.A?.layoutOffsetX, fontAtlas.mapping.A?.layoutOffsetY],
    'glyph mapping retains BMFont layout offsets'
  ).toEqual([-1, 3]);
  expect(getTextKerningOffset(fontAtlas.kerning, 65, 66), 'kerning is indexed').toBe(-2);
  void 0;
});

it('loadMsdfFontAtlas loads descriptor pages into the common FontAtlas format', async () => {
  if (!isBrowser()) {
    void 0;
    return;
  }

  const pageUrl = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>'
  )}`;
  const descriptorUrl = `data:application/json,${encodeURIComponent(
    JSON.stringify({
      common: {lineHeight: 1, base: 1, scaleW: 1, scaleH: 1, pages: 1},
      pages: [pageUrl],
      chars: [
        {
          id: 65,
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          xoffset: 0,
          yoffset: 0,
          xadvance: 1
        }
      ],
      distanceField: {fieldType: 'msdf', distanceRange: 1}
    })
  )}`;
  const fontAtlas = await loadMsdfFontAtlas(descriptorUrl);

  expect(fontAtlas.renderSettings.mode, 'loaded descriptor returns an MSDF atlas').toBe('msdf');
  expect(fontAtlas.pages.length, 'loaded descriptor retains image pages').toBe(1);
  expect(fontAtlas.mapping.A?.advance, 'loaded descriptor retains glyph metrics').toBe(1);
  void 0;
});

it('MSDF font pages resolve relative to root-relative descriptor URLs', () => {
  const descriptorUrl = '/example-assets/experimental/text-space-crawl/fonts/oswald-msdf.json';
  const expectedPageUrl = new URL(
    '/example-assets/experimental/text-space-crawl/fonts/oswald-msdf.png',
    globalThis.location?.href ?? 'http://localhost/'
  ).toString();

  expect(
    _resolveMsdfFontPageUrl('oswald-msdf.png', descriptorUrl),
    'root-relative descriptors retain their asset directory'
  ).toBe(expectedPageUrl);
  void 0;
});

it('root-relative MSDF font pages retain the descriptor origin', () => {
  expect(
    _resolveMsdfFontPageUrl('/fonts/atlas.png', 'https://cdn.example.com/fonts/font.json'),
    'root-relative pages resolve against cross-origin descriptors'
  ).toBe('https://cdn.example.com/fonts/atlas.png');
  expect(
    _resolveMsdfFontPageUrl('data:image/png;base64,AA==', 'https://cdn.example.com/font.json'),
    'absolute URL schemes remain unchanged'
  ).toBe('data:image/png;base64,AA==');
  void 0;
});
