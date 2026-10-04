# Riverfront lights

The riverfront scene demonstrates `GlowPointLayer` and the reusable `pointGlow` shader on WebGPU
and WebGL2. Run `yarn start` in this directory or open the website example.

Adjust the CSS-pixel sprite radius, white core size and intensity, colored halo intensity, and
radial falloff. Halos add radiance to the scene, do not write depth, and are occluded by opaque
building geometry. The point center determines the sprite's depth. There is no lighting of
nearby geometry, shadow casting, or screen-space bloom pass.

Each point carries a position, linear RGB tint, opacity, and a feature index. The application
owns the interleaved point buffer; the layer borrows it and owns its model and a small sprite-corner buffer. Layer replacement
and uniform updates retain the uploaded point data. Picking uses a smaller disk around the
center so faint halos do not intercept clicks.

The shader emits linear radiance. This example adds it directly into Deck's normal color target,
where values can saturate. An HDR application can preserve that radiance for later tone mapping.
Use opaque canvas content: the additive layer intentionally preserves destination alpha.

`yarn test:visual` exercises visible additive contributions, intensity changes, high-DPI picking,
resize, model reuse, borrowed buffers, and cleanup on both backends.

Opaque buildings are pickable in this scene so their depth also occludes hidden lights in Deck's
picking pass. Applications that omit opaque occluders from that pass can pick points through them.
