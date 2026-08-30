// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type NetworkRenderEnvironment = {
  coarsePointer: boolean;
  maxTouchPoints: number;
  viewportHeight: number;
  viewportWidth: number;
};

export type NetworkRenderProfile = {
  bloomQuality: 'low' | 'high';
  bloomResolutionScale: number;
  handheld: boolean;
  orderIndependentTransparency: boolean;
  preferFloatingPointColor: boolean;
};

/** Preserves desktop optics while keeping handheld render targets within mobile GPU budgets. */
export function makeNetworkRenderProfile({
  coarsePointer,
  maxTouchPoints,
  viewportHeight,
  viewportWidth
}: NetworkRenderEnvironment): NetworkRenderProfile {
  const shortestViewportEdge = Math.min(viewportWidth, viewportHeight);
  const handheld =
    coarsePointer && maxTouchPoints > 0 && shortestViewportEdge > 0 && shortestViewportEdge <= 700;

  return handheld
    ? {
        bloomQuality: 'low',
        bloomResolutionScale: 0.75,
        handheld: true,
        orderIndependentTransparency: false,
        preferFloatingPointColor: false
      }
    : {
        bloomQuality: 'high',
        bloomResolutionScale: 1,
        handheld: false,
        orderIndependentTransparency: true,
        preferFloatingPointColor: true
      };
}
