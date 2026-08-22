// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const MAX_HIGH_DENSITY_MOBILE_PIXEL_RATIO = 2;
const MAX_HIGH_DENSITY_MOBILE_PIXEL_COUNT = 1_500_000;

type MobileExamplePixelRatioOptions = {
  devicePixelRatio: number;
  height: number;
  mobile: boolean;
  width: number;
};

/** Limits only oversized 3x mobile canvases; ordinary devices keep exact native resolution. */
export function getMobileExamplePixelRatio({
  devicePixelRatio,
  height,
  mobile,
  width
}: MobileExamplePixelRatioOptions): true | number {
  const canvasPixelCount = Math.max(width, 1) * Math.max(height, 1);
  if (
    !mobile ||
    devicePixelRatio <= MAX_HIGH_DENSITY_MOBILE_PIXEL_RATIO ||
    canvasPixelCount * devicePixelRatio ** 2 <= MAX_HIGH_DENSITY_MOBILE_PIXEL_COUNT
  ) {
    return true;
  }

  return Math.max(
    1,
    Math.min(
      MAX_HIGH_DENSITY_MOBILE_PIXEL_RATIO,
      Math.sqrt(MAX_HIGH_DENSITY_MOBILE_PIXEL_COUNT / canvasPixelCount)
    )
  );
}
