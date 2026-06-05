// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray4} from '@math.gl/core';

export const TEXT_3D_COLOR_STORAGE_KEY = 'text-3d-crawl-color';
export const DEFAULT_TEXT_3D_CRAWL_COLOR: NumberArray4 = [1, 0.62, 0.32, 1];
export const YELLOW_TEXT_3D_CRAWL_COLOR: NumberArray4 = [1, 0.9, 0.32, 1];

export type Text3DCrawlColorKind = 'copper' | 'yellow';

export function getText3DCrawlColor(): NumberArray4 {
  return getText3DCrawlColorKind() === 'yellow'
    ? YELLOW_TEXT_3D_CRAWL_COLOR
    : DEFAULT_TEXT_3D_CRAWL_COLOR;
}

export function getText3DCrawlColorKind(): Text3DCrawlColorKind {
  if (typeof window === 'undefined') {
    return 'copper';
  }

  const searchParams = new URLSearchParams(window.location.search);
  const crawlColor =
    searchParams.get('crawlColor') ?? window.localStorage.getItem(TEXT_3D_COLOR_STORAGE_KEY);
  return crawlColor === 'yellow' ? 'yellow' : 'copper';
}

export function setText3DCrawlColorKind(crawlColorKind: Text3DCrawlColorKind): void {
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
