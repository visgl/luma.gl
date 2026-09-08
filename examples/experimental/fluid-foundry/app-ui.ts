// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const FLUID_FOUNDRY_INFO_HTML = `
<style>
  .fluid-foundry-info { font: 13px/1.45 system-ui, sans-serif; }
  .fluid-foundry-info p { margin: 0; color: inherit; opacity: .82; }
  .fluid-foundry-info strong { color: #a9ecff; }
  .fluid-foundry-badges { display: flex; gap: 7px; margin-top: 12px; flex-wrap: wrap; }
  .fluid-foundry-badge { padding: 4px 7px; border: 1px solid rgb(98 211 255 / 25%); border-radius: 99px; color: #dff8ff; background: rgb(17 97 126 / 18%); font-size: 11px; letter-spacing: .04em; text-transform: uppercase; }
</style>
<section class="fluid-foundry-info">
  <p><strong>12,288 particles</strong> exchange mass and momentum through a WebGPU MLS-MPM grid, then become a shaded HDR liquid surface without CPU readback. Watch the pressure-charged recirculation spouts, click repeatedly to build a surge, drag to steer, or press <strong>R</strong> to reset.</p>
  <div class="fluid-foundry-badges"><span class="fluid-foundry-badge">WebGPU compute</span><span class="fluid-foundry-badge">Cyclic spouts</span><span class="fluid-foundry-badge">HDR liquid metal</span></div>
</section>`;
