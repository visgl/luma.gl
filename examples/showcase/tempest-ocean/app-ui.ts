// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const TEMPEST_OCEAN_INFO_HTML = `
<style>
  .tempest-ocean-info { font: 13px/1.45 system-ui, sans-serif; }
  .tempest-ocean-info p { margin: 0; color: inherit; opacity: .82; }
  .tempest-ocean-info strong { color: #fff2c8; }
  .tempest-ocean-controls { margin-top: 10px; color: #e2f4ff; font-size: 12px; }
  .tempest-ocean-badges { display: flex; gap: 7px; margin-top: 11px; flex-wrap: wrap; }
  .tempest-ocean-badge { padding: 4px 7px; border: 1px solid rgb(120 205 255 / 24%); border-radius: 99px; background: rgb(22 91 132 / 20%); color: #daf3ff; font-size: 10px; letter-spacing: .05em; text-transform: uppercase; }
</style>
<section class="tempest-ocean-info">
  <p>A reusable <strong>GPUFFT2D spectral field</strong> physically displaces this raster surface. Live normals and Jacobian whitecaps drive the HDR water material without CPU readback.</p>
  <div class="tempest-ocean-controls">Drag to orbit · wheel to zoom · <strong>C</strong> cinematic · <strong>P</strong> pause waves · <strong>R</strong> deterministic reset · <strong>M</strong> mute sound · <span data-tempest-state>cinematic · running</span> · <span data-tempest-audio-state>sound waiting for a gesture</span></div>
  <div class="tempest-ocean-badges"><span class="tempest-ocean-badge">WebGPU compute</span><span class="tempest-ocean-badge">Storage-buffer surface</span><span class="tempest-ocean-badge">HDR sunbreak</span></div>
</section>`;
