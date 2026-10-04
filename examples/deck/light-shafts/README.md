# Riverfront light shafts

Depth-occluded participating-media light shafts with temporal stabilization.

Run `yarn workspace luma.gl-examples-deck-light-shafts start`. The website route is `/examples/deck/light-shafts`.

Uses the shared `riverfront-lighting-scene.ts` fixture and one `SceneBufferEffect` for scene-linear `rgba16float` color, opaque depth, view normals/roughness and `rg16float` current-minus-previous UV motion. `SceneShaderPassEffect` binds these borrowed textures to existing luma.gl graphs and coordinates history invalidation. Camera motion is reconstructed from depth; firefly cores additionally write object motion. Resize and Center invalidate history, and pause settles a bounded number of frames before becoming idle.

The complete shared-buffer graphs require WebGPU; the Device selector and support metadata expose that requirement. `FireflyLayer` itself supports WebGL2 and WebGPU. Global illumination and shaft occlusion depend on visible screen-space geometry and cannot include hidden or off-screen emitters/occluders. These examples do not add geometric light shadows or water reflections.
