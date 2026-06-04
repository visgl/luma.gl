// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray4} from '@math.gl/core';

const TEXT_3D_COLOR_SELECTOR_ID = 'arrow-text-3d-crawl-color';
const TEXT_3D_COLOR_STORAGE_KEY = 'text-3d-crawl-color';
const DEFAULT_CRAWL_COLOR: NumberArray4 = [1, 0.62, 0.32, 1];
const YELLOW_CRAWL_COLOR: NumberArray4 = [1, 0.9, 0.32, 1];

export type ArrowText3DCrawlColorKind = 'copper' | 'yellow';

export class ArrowText3DControlPanel {
  private crawlColorKind = getArrowText3DCrawlColorKind();
  private selector: HTMLSelectElement | null = null;

  initialize(): void {
    if (this.selector) {
      return;
    }

    this.selector = document.getElementById(TEXT_3D_COLOR_SELECTOR_ID) as HTMLSelectElement | null;
    if (!this.selector) {
      return;
    }

    this.syncControls(this.crawlColorKind);
    this.selector.addEventListener('change', this.handleCrawlColorChange);
  }

  destroy(): void {
    this.selector?.removeEventListener('change', this.handleCrawlColorChange);
    this.selector = null;
  }

  syncControls(crawlColorKind: ArrowText3DCrawlColorKind): void {
    this.crawlColorKind = crawlColorKind;
    if (this.selector) {
      this.selector.value = crawlColorKind;
    }
  }

  private readonly handleCrawlColorChange = (): void => {
    const crawlColorKind = this.selector?.value === 'yellow' ? 'yellow' : 'copper';
    setArrowText3DCrawlColorKind(crawlColorKind);
    this.syncControls(crawlColorKind);
  };
}

export function makeArrowText3DControlPanelHtml(): string {
  return `\
<p>Stores crawl rows in Apache Arrow Utf8, expands visible glyphs into grouped Arrow instance batches, and reuses one shared extruded glyph atlas.</p>
<p>Each used glyph draws once with a shared geometry range and its grouped Arrow instance offsets.</p>
<label for="${TEXT_3D_COLOR_SELECTOR_ID}" style="display: flex; align-items: center; gap: 8px; margin-top: 12px;">
  <span style="font-size: 14px; font-weight: 600;">Crawl color</span>
  <select id="${TEXT_3D_COLOR_SELECTOR_ID}">
    <option value="copper">Copper</option>
    <option value="yellow">Yellow</option>
  </select>
</label>
`;
}

export function getArrowText3DCrawlColor(): NumberArray4 {
  return getArrowText3DCrawlColorKind() === 'yellow' ? YELLOW_CRAWL_COLOR : DEFAULT_CRAWL_COLOR;
}

function getArrowText3DCrawlColorKind(): ArrowText3DCrawlColorKind {
  if (typeof window === 'undefined') {
    return 'copper';
  }

  const searchParams = new URLSearchParams(window.location.search);
  const crawlColor =
    searchParams.get('crawlColor') ?? window.localStorage.getItem(TEXT_3D_COLOR_STORAGE_KEY);
  return crawlColor === 'yellow' ? 'yellow' : 'copper';
}

function setArrowText3DCrawlColorKind(crawlColorKind: ArrowText3DCrawlColorKind): void {
  if (typeof window === 'undefined') {
    return;
  }

  const searchParams = new URLSearchParams(window.location.search);
  if (crawlColorKind === 'yellow') {
    searchParams.set('crawlColor', 'yellow');
  } else {
    searchParams.delete('crawlColor');
  }

  const search = searchParams.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', nextUrl);
  window.localStorage.setItem(TEXT_3D_COLOR_STORAGE_KEY, crawlColorKind);
}
