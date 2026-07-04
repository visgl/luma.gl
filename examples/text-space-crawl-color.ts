// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray4} from '@math.gl/types';

export const TEXT_SPACE_COLOR_STORAGE_KEY = 'text-space-crawl-color';
export const DEFAULT_TEXT_SPACE_CRAWL_COLOR: NumberArray4 = [1, 0.62, 0.32, 1];
export const YELLOW_TEXT_SPACE_CRAWL_COLOR: NumberArray4 = [1, 0.9, 0.32, 1];

export type TextSpaceCrawlColorKind = 'copper' | 'yellow';

type TextSpaceWindow = Pick<Window, 'history' | 'localStorage' | 'location'>;

export function getTextSpaceCrawlColor(currentWindow = getCurrentWindow()): NumberArray4 {
  return getTextSpaceCrawlColorKind(currentWindow) === 'yellow'
    ? YELLOW_TEXT_SPACE_CRAWL_COLOR
    : DEFAULT_TEXT_SPACE_CRAWL_COLOR;
}

export function getTextSpaceCrawlColorKind(
  currentWindow = getCurrentWindow()
): TextSpaceCrawlColorKind {
  if (!currentWindow) {
    return 'copper';
  }

  const searchParams = new URLSearchParams(currentWindow.location.search);
  const crawlColor =
    searchParams.get('crawlColor') ??
    currentWindow.localStorage.getItem(TEXT_SPACE_COLOR_STORAGE_KEY);
  return crawlColor === 'yellow' ? 'yellow' : 'copper';
}

export function setTextSpaceCrawlColorKind(
  crawlColorKind: TextSpaceCrawlColorKind,
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
  currentWindow.localStorage.setItem(TEXT_SPACE_COLOR_STORAGE_KEY, crawlColorKind);
}

function getCurrentWindow(): TextSpaceWindow | null {
  return typeof window === 'undefined' ? null : window;
}
