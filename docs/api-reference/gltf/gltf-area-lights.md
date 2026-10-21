# EXT_lights_area draft

`GLTFAreaLightController` extracts visible rectangle and disk lights from the
[pinned draft](https://github.com/MiiBond/glTF/tree/e77b27a67d0ee19327f6104aca5d869433b3e367/extensions/2.0/Vendor/EXT_lights_area).
Pass its current results to the `areaLighting` shader module after updating the
scene's animations:

```ts
const controller = new GLTFAreaLightController({gltf, ...scenegraphs});
model.shaderInputs.setProps({areaLighting: {lights: controller.getLights()}});
```

The application owns the controller and destroys it with the scene. The controller
borrows the scenegraph and returns linear light colors. Rectangle `size` specifies
height; width also uses `rect.aspect`. Disk `size` specifies diameter. Both use the
largest absolute world scale component, while emitting orientation follows node
rotation independently of TRS scale. Invisible node hierarchies do not emit.

PBR rendering integrates 64 deterministic samples over each emitting surface by default.
Set `areaLighting.sampleCount` to 16, 64, or 256 to trade GPU cost for accuracy.
The gallery uses 256 to reduce visible quadrature highlights.
Each sample contributes luminance times area, emitter cosine and inverse squared
distance through the existing core or layered material BRDF. Lights emit toward
local -Z. Increasing area at constant luminance increases emitted flux.

This is a numerical direct-light approximation, with at most four active area
lights. Small glossy highlights and receivers very close to the surface may need
more samples than this profile provides. There are no area-light shadows, indirect
bounce transport, or area-light integration in the Phong/Gouraud materials. The
controller's matrix-authored orientation removes scale and shear; singular matrix
orientations are rejected. The support registry must not imply full draft
conformance from this profile.
