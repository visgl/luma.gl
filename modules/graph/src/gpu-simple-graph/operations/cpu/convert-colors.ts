// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {CPUData} from '../../../gpu-data/cpu-data';
import {convertCPUColorData} from '../../../gpu-data/color-conversion';
import type {OperationHandler} from '../../operation/operation';
import type {ConvertColorsInputs} from '../convert-colors';

export const convertColors: OperationHandler<ConvertColorsInputs> = async ({inputs, target}) => {
  const {source, inputFormat, outputFormat} = inputs;
  const values = await source.ensureCPUValue();
  const converted = convertCPUColorData(
    new CPUData({
      buffer: values,
      format: source.format!,
      length: source.length,
      byteOffset: source.offset,
      byteStride: source.stride
    }),
    outputFormat,
    inputFormat
  );
  const bytes = new Uint8Array(
    converted.buffer,
    converted.byteOffset,
    converted.length * converted.byteStride
  );
  target.write(bytes);
  // Let the evaluator decode the target in its own Float16Array/Uint16Array representation.
  return {success: true};
};
