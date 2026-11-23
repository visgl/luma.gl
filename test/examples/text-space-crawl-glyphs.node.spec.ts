// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  getTextSpaceCrawlRenderingKind,
  setTextSpaceCrawlRenderingKind,
  makeTextSpaceCrawlControlPanelHtml
} from '../../examples/experimental/text-space-crawl/control-panel';

test('server glyph mode can be opened directly and selected without losing other controls', () => {
  const replaceState = vi.fn();
  const currentWindow = {
    location: new URL('https://example.com/crawl?textRendering=glyphs&textFont=serif#view'),
    history: {replaceState}
  } as unknown as Pick<Window, 'location' | 'history'>;
  expect(getTextSpaceCrawlRenderingKind(currentWindow)).toBe('glyphs');
  expect(makeTextSpaceCrawlControlPanelHtml('glyphs')).toContain('OpenFreeMap');
  setTextSpaceCrawlRenderingKind('glyphs', currentWindow);
  expect(replaceState).toHaveBeenCalledWith(
    {},
    '',
    '/crawl?textRendering=glyphs&textFont=serif#view'
  );
});
