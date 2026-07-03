// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {isBrowser} from '@probe.gl/env';
import {
  _resolveMsdfFontPageUrl,
  buildMsdfFontAtlas,
  loadMsdfFontAtlas
} from '../../src/text-2d/build-msdf-font-atlas';
import {getTextKerningOffset} from '../../src/text-2d/atlas/text-utils';

test('buildMsdfFontAtlas preserves BMFont page, offset, and kerning metadata', t => {
  if (!isBrowser()) {
    t.end();
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

  t.equal(fontAtlas.renderSettings.mode, 'msdf', 'parsed font selects MSDF sampling');
  t.equal(fontAtlas.pages.length, 2, 'parsed font retains every atlas page');
  t.equal(fontAtlas.mapping.A?.x, 1, 'glyph mapping uses BMFont id instead of atlas index');
  t.equal(fontAtlas.mapping.B?.atlasPage, 1, 'glyph mapping retains BMFont page ids');
  t.deepEqual(
    [fontAtlas.mapping.A?.layoutOffsetX, fontAtlas.mapping.A?.layoutOffsetY],
    [-1, 3],
    'glyph mapping retains BMFont layout offsets'
  );
  t.equal(getTextKerningOffset(fontAtlas.kerning, 65, 66), -2, 'kerning is indexed');
  t.end();
});

test('loadMsdfFontAtlas loads descriptor pages into the common FontAtlas format', async t => {
  if (!isBrowser()) {
    t.end();
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

  t.equal(fontAtlas.renderSettings.mode, 'msdf', 'loaded descriptor returns an MSDF atlas');
  t.equal(fontAtlas.pages.length, 1, 'loaded descriptor retains image pages');
  t.equal(fontAtlas.mapping.A?.advance, 1, 'loaded descriptor retains glyph metrics');
  t.end();
});

test('MSDF font pages resolve relative to root-relative descriptor URLs', t => {
  const descriptorUrl = '/example-assets/arrow/arrow-text-space-crawl/fonts/oswald-msdf.json';
  const expectedPageUrl = new URL(
    '/example-assets/arrow/arrow-text-space-crawl/fonts/oswald-msdf.png',
    globalThis.location?.href ?? 'http://localhost/'
  ).toString();

  t.equal(
    _resolveMsdfFontPageUrl('oswald-msdf.png', descriptorUrl),
    expectedPageUrl,
    'root-relative descriptors retain their asset directory'
  );
  t.end();
});

test('root-relative MSDF font pages retain the descriptor origin', t => {
  t.equal(
    _resolveMsdfFontPageUrl('/fonts/atlas.png', 'https://cdn.example.com/fonts/font.json'),
    'https://cdn.example.com/fonts/atlas.png',
    'root-relative pages resolve against cross-origin descriptors'
  );
  t.equal(
    _resolveMsdfFontPageUrl('data:image/png;base64,AA==', 'https://cdn.example.com/font.json'),
    'data:image/png;base64,AA==',
    'absolute URL schemes remain unchanged'
  );
  t.end();
});
