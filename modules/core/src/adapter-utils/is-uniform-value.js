// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { isNumberArray } from '../utils/is-array';
export function isUniformValue(value) {
    return isNumberArray(value) || typeof value === 'number' || typeof value === 'boolean';
}
