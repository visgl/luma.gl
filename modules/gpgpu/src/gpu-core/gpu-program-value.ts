// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Scalar formats portable across current Jarnevon execution backends. */
export type GPUProgramScalarFormat = 'float32' | 'uint32' | 'sint32';

/**
 * Backend-independent scalar state owned by a GPUProgram.
 *
 * This is a logical value, not a WebGPU buffer allocation. A backend compiler materializes it in
 * its preferred scalar storage (the WebGPU compiler currently uses the packed GPUValueArena).
 */
export class GPUProgramScalar<T extends GPUProgramScalarFormat = GPUProgramScalarFormat> {
  readonly id: string;
  readonly format: T;
  constructor(id: string, format: T) {
    if (!id) throw new Error('GPUProgramScalar id is required');
    this.id = id;
    this.format = format;
  }
}
