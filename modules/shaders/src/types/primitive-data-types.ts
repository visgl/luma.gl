// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/**
 * Primitive data types that shaders can perform calculations in and declare variables with.
 * @note attribute inputs and texture samples can be populated from a different in-memory types, see below.
 * @note `f16` requires the `f16` extension
 */
export type PrimitiveDataType = 'u32' | 'i32' | 'f32' | 'f16';
