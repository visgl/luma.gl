// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const PCSS_BACKGROUND_HTML = `
<p><b>PCSS (Percentage-Closer Soft Shadows)</b> is a real-time shadow-map filtering technique that models a light source with area instead of treating it as a perfect point.</p>
<p><b>Why it looks natural:</b> a caster close to its receiver makes a crisp shadow. As the separation grows, the penumbra widens and softens. PCSS estimates that relationship per shaded point instead of applying one uniform blur everywhere.</p>
<p><b>How it works:</b></p>
<ol>
  <li><b>Blocker search:</b> sample the shadow map around the receiver to find occluders between the light and the surface, then estimate their average depth.</li>
  <li><b>Variable filtering:</b> use the blocker-to-receiver separation and apparent light size to choose a filtering radius. Nearby blockers get a tight kernel; distant blockers get a wider one.</li>
</ol>
<p><b>Compared with PCF (Percentage-Closer Filtering):</b> ordinary PCF usually filters with a fixed-size kernel. PCSS adds the blocker search so softness changes across the shadow, producing widening penumbrae while still smoothing aliasing.</p>
`;
