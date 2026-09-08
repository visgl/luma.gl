// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const A_BUFFER_DESCRIPTION_HTML = `\
<p>Compare exact per-pixel linked-list OIT, approximate weighted blended OIT, and unsorted alpha blending on the same interleaved scene.</p>
<p>The dropdown renders the same unsorted translucent spheres with three different blending strategies.</p>
<div style="display: grid; gap: 8px;">
  <div><strong>A-buffer OIT</strong><br>Captures every translucent fragment into GPU storage, sorts fragments per pixel, then composites them back-to-front. It is the most accurate option here and is available on WebGPU.</div>
  <div><strong>Weighted blended OIT</strong><br>Accumulates weighted color and revealage into floating-point offscreen targets, then composites once. It avoids sorting and works on WebGPU or WebGL2 when float render-target blending is available, but it is approximate.</div>
  <div><strong>Standard alpha blending</strong><br>Blends translucent draws directly into the framebuffer in submission order. It is the cheapest fallback, but unsorted overlaps produce visibly incorrect results.</div>
</div>`;

export const A_BUFFER_BACKGROUND_HTML = `\
<p><b>Why transparency is hard:</b> ordinary alpha blending is order dependent. Correct color requires fragments for the same pixel to be composited back-to-front, but draw submission order rarely matches depth order for intersecting translucent geometry.</p>
<p><b>A-buffer OIT:</b> the capture pass stores each translucent fragment's color and depth in GPU storage. A resolve pass gathers the fragments for one pixel, sorts them by depth, and composites them back-to-front. The result is exact up to the configured per-pixel storage budget.</p>
<p><b>Weighted blended OIT:</b> instead of sorting, two blended render targets accumulate weighted color and revealage. The final resolve estimates the transparent stack in one pass. It is usually faster and more portable, but dense overlaps can reveal the approximation.</p>
<p><b>Performance trade-off:</b> A-buffer quality costs storage, atomics, and per-pixel sorting; weighted blending costs extra attachments and bandwidth; ordinary alpha blending is cheapest but makes correctness the caller's draw-order problem.</p>`;
