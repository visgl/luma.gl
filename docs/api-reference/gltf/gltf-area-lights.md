# glTF area-light mapping

`parseGLTFAreaLights()` from `@luma.gl/engine/gltf` converts source size/aspect values into width/height bindings for the engine `AreaLightController`. See [Scenegraph lights](/docs/api-guide/engine/scenegraph-lights) for the engine APIs.

`AreaLightController` extracts visible rectangle and disk lights from the
[pinned draft](https://github.com/MiiBond/glTF/tree/e77b27a67d0ee19327f6104aca5d869433b3e367/extensions/2.0/Vendor/EXT_lights_area).
Pass its current results to the `areaLighting` shader module after updating the
scene's animations:

```ts
import {AreaLightController} from '@luma.gl/engine';
import {parseGLTFAreaLights} from '@luma.gl/engine/gltf';
const controller = new AreaLightController(parseGLTFAreaLights({gltf, ...scenegraphs}));
model.shaderInputs.setProps({areaLighting: {lights: controller.getLights()}});
```

The application owns the controller and destroys it with the scene. The controller
borrows the scenegraph and returns linear light colors. Rectangle `size` specifies
height; width also uses `rect.aspect`. Disk `size` specifies diameter. Both use the
largest absolute world scale component, while emitting orientation follows node
rotation independently of TRS scale. Invisible node hierarchies do not emit.

PBR rendering integrates 64 deterministic samples over each emitting surface by default.
Set `areaLighting.sampleCount` to 16, 64, or 256 to trade GPU cost for accuracy.
The gallery enables LTC for supported material lobes. The sample setting applies only to the numerical fallback.
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

## LTC integration and official light API

Area lights are accepted in the shared `LightingProps.lights` collection as `AreaLight` entries (`type: 'rect' | 'disk'`). Existing punctual members retain their uniform offsets; appended area members increase the lighting buffer size. Use `useByteColors: false` for normalized glTF light colors. Intensity is luminance in nits.

Create caller-owned lookup textures with `createAreaLightLTCTextures(device)`, compile PBR models with `USE_AREA_LIGHT_LTC: true`, and supply the returned `bindings` to `model.shaderInputs.setProps`. Destroy the textures after the consuming models. Lookup resources are only needed when this define is enabled.

The gallery now uses continuous LTC integration for diffuse, isotropic GGX and clearcoat, including the original living room. Rectangles use exact horizon clipping of the transformed polygon. Disks use an inscribed 32-gon (geometric area deficit below 0.65%; this does not bound BRDF fitting error). Anisotropy, sheen and diffuse transmission retain the numerical reference path and its documented artifacts. Shadows and indirect illumination remain unsupported.

The GGX fit tables are from Heitz, Dupuy, Hill and Neubelt's *Real-Time Polygonal-Light Shading with Linearly Transformed Cosines* (SIGGRAPH 2016). Their complete upstream license is retained in `area-lighting/LTC-LICENSE.txt`. LTC approximates the BRDF; it is not a path-traced reference.
