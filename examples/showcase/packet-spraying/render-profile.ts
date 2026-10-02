// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ExampleRuntimeEnvironment} from '../../example-support';

export type NetworkRenderEnvironment = Pick<ExampleRuntimeEnvironment, 'handheld'>;

export type NetworkRenderProfile = {
  bloomQuality: 'low' | 'high';
  bloomResolutionScale: number;
  handheld: boolean;
  orderIndependentTransparency: boolean;
  preferFloatingPointColor: boolean;
};

/** Preserves desktop optics while keeping handheld render targets within mobile GPU budgets. */
export function makeNetworkRenderProfile({
  handheld
}: NetworkRenderEnvironment): NetworkRenderProfile {
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
