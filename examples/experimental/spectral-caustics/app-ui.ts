// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const INFO_HTML = `
<style>
  .prism-cathedral-info { font: 13px/1.45 system-ui, sans-serif; }
  .prism-cathedral-info p { margin: 0; color: inherit; opacity: .82; }
  .prism-cathedral-info .prism-cathedral-controls { margin-top: 9px; color: #d8e8ff; }
  .prism-cathedral-info strong { color: #fff3c4; font-weight: 600; }
  .prism-cathedral-badges { display: flex; gap: 7px; margin-top: 12px; flex-wrap: wrap; }
  .prism-cathedral-badge { padding: 4px 7px; border: 1px solid rgb(120 186 255 / 24%); border-radius: 99px; color: #dcecff; background: rgb(30 72 120 / 18%); font-size: 11px; letter-spacing: .04em; text-transform: uppercase; }
</style>
<section class="prism-cathedral-info">
  <p>A rotating convex crystal is captured from the light, then <strong>six CIE/D65 wavelength bands</strong> refract through its real front and back surfaces into an HDR XYZ caustic map.</p>
  <p class="prism-cathedral-controls"><strong>Drag</strong> to orbit · <strong>Wheel</strong> to zoom · <strong>Space</strong> for cinematic orbit · <strong>R</strong> to reset</p>
  <div class="prism-cathedral-badges"><span class="prism-cathedral-badge">WebGPU compute</span><span class="prism-cathedral-badge">Geometry traced</span><span class="prism-cathedral-badge">HDR bloom</span></div>
</section>`;
