// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const ADVANCED_EFFECTS_BACKGROUND_HTML = `
<p><b>Hybrid render stack:</b> the city first writes a shared G-buffer with scene color, depth, normals, and velocity. Shadow maps handle geometric visibility from directional, spot, and point lights; screen-space passes then reuse the same buffers for contact shadows, ambient occlusion, reflections, fog, outlines, temporal antialiasing, and motion blur.</p>
<p><b>Why this is composable:</b> each fullscreen effect declares the textures it reads and writes into an ordered <code>CompositeShaderPass</code>. Effects can be toggled or reordered without changing the scene draw, while depth/normal/velocity-aware passes avoid treating the image as a flat bitmap.</p>
<p><b>Visualization City vs. Illumination Lab:</b> this is the breadth-first showcase for cascaded, spot, point, and contact shadows plus SSAO, simple height fog, outlines, temporal AA, and motion blur. <b>Deferred Illumination Lab</b> goes deeper into deferred Cook-Torrance materials, hundreds of clustered lights, GTAO, colored diffuse bounce, and participating-media scattering. Both examples reuse the same screen-space reflection pipeline; they are not competing copies of SSR.</p>
<p><b>Where the GPU work goes:</b> shadow maps trade extra light-view geometry passes for stable long-range occlusion. Screen-space effects trade texture bandwidth and fullscreen pixels for details that would be expensive to model with more scene geometry or rays. TAA and motion blur additionally consume frame history and velocity.</p>
<p><b>What to watch:</b> debug views expose the intermediate contracts. The comparison split shows the cost/quality boundary between the base draw and the composed stack.</p>
`;
