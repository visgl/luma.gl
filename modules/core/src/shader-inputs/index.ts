// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, CompositeUniformValue} from '../index';
import type {TextureBindingSource} from '../dynamic/index';

/** Concrete or deferred shader resource binding. */
export type ShaderInputBinding = Binding | TextureBindingSource;

/**
 * Read-only view of current shader values, independent of shader-module management.
 * Uniform values are grouped by uniform block name; bindings use shader binding names.
 * Returned maps are borrowed: consumers must not mutate them or destroy their resources.
 * Providers may return live maps or snapshots. Consumers read them at each update.
 */
export interface ShaderValues {
  getUniformValues(): Readonly<
    Partial<Record<string, Readonly<Record<string, CompositeUniformValue>>>>
  >;
  getBindingValues(): Readonly<Record<string, ShaderInputBinding>>;
}
