# Riverfront soft shadows

A deck.gl riverfront with animated, geographically calculated summer sunlight. The sun-path indicator, surface lighting, and shadows use the same `@math.gl/sun` direction at the district origin in New York on June 21, 2026. Times are EDT; a complete daylight loop takes about 163 seconds by default. Scrubbing time pauses animation.

The example reuses `ShadowMapRenderer` and the `shadow` shader module from `@luma.gl/experimental`, including cascade fitting, blocker search, PCSS penumbrae, and cascade blending. It reuses the Lambert material and shared riverfront mesh fixture. Example code bridges Deck projection/picking and light-space drawing; it contains no independent shadow-filter implementation.

Shadow receivers and casters share local east/north/up meters. The camera adapter converts Deck viewport units and OpenGL clip depth to the renderer's meter distances and WebGPU clip depth. Each cascade has its own caster model/uniform storage. Only direct sunlight is shadowed; ambient lighting is preserved.

WebGPU is required. Quality selects the renderer's existing presets. Softness controls the sun's angular radius; the enlarged default makes penumbrae easier to inspect than the physical sun's approximately 0.0047-radian radius. Shadows are geometric, so offscreen buildings can cast onto visible surfaces. The sun-path indicator is a sky diagram rather than a projected world-space object.

Run `yarn start`, `yarn build`, or `yarn test:visual` in this folder. The website entry is `/examples/deck/soft-shadows`.
