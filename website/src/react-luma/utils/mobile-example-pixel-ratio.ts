// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  getMobileExamplePixelRatio as getSharedMobileExamplePixelRatio,
  MOBILE_EXAMPLE_MEDIA_QUERY
} from '../../../../examples/example-support';

type MobileExamplePixelRatioOptions = {
  devicePixelRatio: number;
  height: number;
  mobile: boolean;
  width: number;
};

/** Uses the same responsive breakpoint for example controls and drawing-buffer selection. */
export function isMobileExampleViewport(viewport: Pick<Window, 'matchMedia'>): boolean {
  return (
    typeof viewport.matchMedia === 'function' && viewport.matchMedia(MOBILE_EXAMPLE_MEDIA_QUERY).matches
  );
}

/** Limits only oversized 3x mobile canvases; ordinary devices keep exact native resolution. */
export function getMobileExamplePixelRatio({
  devicePixelRatio,
  height,
  mobile,
  width
}: MobileExamplePixelRatioOptions): true | number {
  return getSharedMobileExamplePixelRatio({
    devicePixelRatio,
    handheld: mobile,
    viewportHeight: height,
    viewportWidth: width
  });
}
