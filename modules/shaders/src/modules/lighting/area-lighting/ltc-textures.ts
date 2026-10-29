// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {toHalfFloat} from '../../math/fp16/fp16-utils';
import type {Device} from '@luma.gl/core';
import {LTC_MATRIX_DATA, LTC_AMPLITUDE_DATA} from './ltc-data';

/** Creates caller-owned GGX LTC tables. Destroy once all models using the bindings are destroyed. */
export function createAreaLightLTCTextures(device: Device) {
  const createTable = (id: string, data: number[]) =>
    device.createTexture({
      id,
      width: 64,
      height: 64,
      format: 'rgba16float',
      data: Uint16Array.from(data, toHalfFloat),
      mipLevels: 1,
      sampler: {minFilter: 'nearest', magFilter: 'nearest'}
    });
  const matrix = createTable('ltc-matrix', LTC_MATRIX_DATA);
  const amplitude = createTable('ltc-amplitude', LTC_AMPLITUDE_DATA);
  return {
    bindings: {areaLTCMatrix: matrix, areaLTCAmplitude: amplitude},
    destroy() {
      matrix.destroy();
      amplitude.destroy();
    }
  };
}
