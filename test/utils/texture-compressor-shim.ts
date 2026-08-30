// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Test-only stand-in for the optional loaders.gl DDS writer peer. */
export async function pack(): Promise<never> {
  throw new Error('texture-compressor is not installed in the luma.gl test workspace');
}
