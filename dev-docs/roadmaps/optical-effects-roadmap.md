# Optical effects implementation roadmap

This maintainer roadmap tracks planned work for glass, reflection, transmission, and related
effects. The [user-facing glass effects guide](../../docs/api-guide/shaders/glass-effects.md)
documents the available techniques and current quality boundary.

## Optical Roadmap

### Available Now: Portable Raster Optics

- Camera-responsive Fresnel, GGX microfacet highlights, clearcoat, chromatic dispersion, and
  analytic entry/exit refraction work across WebGL and WebGPU.
- Backface-derived thickness, foreground rejection, wavelength-dependent volume absorption,
  thickness-aware rough transmission, and nanometer-scale thin-film interference give glass
  measurable optical depth without per-pixel ray tracing.
- Initialized prefiltered studio-probe mip chains support roughness-selected environment reflections
  and broadened internal bounces; opaque-depth contact shadows anchor hardware to transparent shells.
- Bounded colored point lights, in-volume scattering, screen-space scene reflections, secondary
  environment bounces, and focused raster caustics connect moving emitters to nearby glass.
- Linked switch-plane telemetry gradually emphasizes all eight switches across both tiers of each
  physical plane, while four independently inspectable backbone paths reveal both conversations'
  complete server-to-server routes with smoothly isolated switches, links, and packet wakes.
- A single guided-story visual-style control progressively introduces surface highlights,
  refraction, packet lighting, motion accents, spectral glass, caustics, and bloom while keeping
  advanced material settings independently adjustable.
- A duration-weighted, directly navigable chapter timeline ties cinematic camera transitions to
  congestion, packet loss, rerouting, and probe-confirmed path recovery. Colored event markers
  choreograph path isolation, compact upstream packet queues, loss scattering, and the complete
  outbound-probe / returning-confirmation handshake without enlarging the storytelling panel.
- Exact A-buffer transparency, weighted-blended transparency, and depth-sorted alpha blending
  preserve the strongest supported compositing strategy on each backend.

### Next: Richer Raster Light Transport

- Add temporally accumulated rough transmission and history rejection to reduce multisample cost
  while preserving animated packet detail.
- Extend prefiltered environment probes with authored HDR assets, importance-sampled convolution,
  and explicit capability-aware fallback levels.
- Improve geometry-aware screen-space reflections and thickness-guided indirect packet lighting
  without reading from active render attachments.
- Add adaptive local scattering and neighborhood-aware translucent contact shadows while keeping
  light counts bounded and diagrams legible.

### Future: Opt-In Physically Traced Effects

- Investigate energy-conserving microfacet transmission, multiple internal scattering events, and
  ray-traced refraction only behind explicit backend and performance capability checks.
- Treat physically traced caustics, off-screen background recovery, and hardware-ray-tracing
  integration as separately composable render passes rather than hidden showcase requirements.
