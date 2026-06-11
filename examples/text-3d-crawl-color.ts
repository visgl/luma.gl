// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray4} from '@math.gl/types';

export const TEXT_3D_COLOR_STORAGE_KEY = 'text-3d-crawl-color';
export const DEFAULT_TEXT_3D_CRAWL_COLOR: NumberArray4 = [1, 0.62, 0.32, 1];
export const YELLOW_TEXT_3D_CRAWL_COLOR: NumberArray4 = [1, 0.9, 0.32, 1];

export type Text3DCrawlColorKind = 'copper' | 'yellow';

type Text3DWindow = Pick<Window, 'history' | 'localStorage' | 'location'>;

export function getText3DCrawlColor(currentWindow = getCurrentWindow()): NumberArray4 {
  return getText3DCrawlColorKind(currentWindow) === 'yellow'
    ? YELLOW_TEXT_3D_CRAWL_COLOR
    : DEFAULT_TEXT_3D_CRAWL_COLOR;
}

export function getText3DCrawlColorKind(currentWindow = getCurrentWindow()): Text3DCrawlColorKind {
  if (!currentWindow) {
    return 'copper';
  }

  const searchParams = new URLSearchParams(currentWindow.location.search);
  const crawlColor =
    searchParams.get('crawlColor') ?? currentWindow.localStorage.getItem(TEXT_3D_COLOR_STORAGE_KEY);
  return crawlColor === 'yellow' ? 'yellow' : 'copper';
}

export function setText3DCrawlColorKind(
  crawlColorKind: Text3DCrawlColorKind,
  currentWindow = getCurrentWindow()
): void {
  if (!currentWindow) {
    return;
  }

  const searchParams = new URLSearchParams(currentWindow.location.search);
  if (crawlColorKind === 'yellow') {
    searchParams.set('crawlColor', 'yellow');
  } else {
    searchParams.delete('crawlColor');
  }

  const search = searchParams.toString();
  const nextUrl = `${currentWindow.location.pathname}${search ? `?${search}` : ''}${currentWindow.location.hash}`;
  currentWindow.history.replaceState({}, '', nextUrl);
  currentWindow.localStorage.setItem(TEXT_3D_COLOR_STORAGE_KEY, crawlColorKind);
}

function getCurrentWindow(): Text3DWindow | null {
  return typeof window === 'undefined' ? null : window;
}
