// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export function makeGPUVectorStorageParticlesControlPanelHtml(): string {
  return `
<p>Runs an example-level <code>ArrowParticleLayer</code> over <code>positions</code> and <code>velocities</code> Arrow columns, then updates the uploaded <code>GPUVector</code>s with storage compute on WebGPU or transform feedback on WebGL.</p>
`;
}
