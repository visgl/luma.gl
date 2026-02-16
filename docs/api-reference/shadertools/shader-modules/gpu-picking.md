# gpuPicking

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.1-blue.svg?style=flat-square" alt="From v9.1" />
</p>

Provides support for GPU-based picking.

Picking is a key capability for most interactive applications. Consult the API guide learn more about [picking](/docs/api-guide/engine/interactivity). 

GPU picking is based on the conclusion that each pixel on the screen was generated while rendering some "object", which in luma.gl can often be thought of as one row in an a data table being rendered.

## Under the Hood

Depending on the structure of the shader, each object can either correspond to an `instance` or a group of vertexes.

An additional consideration 

li

The `gpuPicking` modules supports:
- picking of object indexes
- highlighting of objects
- pick a specific *instance* in an instanced draw call
- highlight all fragments of an *instance* based on its picking color
- pick "group of primitives" with the same picking color in non-instanced draw-calls
- highlight "group of primitives" with the same picking color in non-instanced draw-calls

Highlighting allows applications to specify a picking color corresponding to an object that need to be highlighted and the highlight color to be used.

## About GPU based picking

GPU based picking has a couple of significant advantage over CPU-based picking:
- GPU-based picking is a picking technique that can be performed entirely on the GPU, meaning that it is very performant, especially when picking is done every frame.

- can be added to any existing shaders 
- and is independent of the structure of the input geometry or rendering without requiring any additional picking logic to that shader, beyond calling one function in the vertex shader and one function in the fragment shader.

Note that GPU-based picking does comes with some limitations:
- Picking occluding objects require re-rendering and discarding the already picked objects.
- On WebGL-specific: the read back of the picking data from the picking texture can only be done synchronously, causing a GPU pipeline stall, which can defeat some of the performance advantages.

Traditional 3d frameworks often support CPU-based picking. While luma.gl does not include an CPU-based picking algorithms, CPU based picking techniques do have advantages: 
 - They can often provide precise intersection points on objects and they are better at handling picking of multiple objects, especially for objects that are occluded. 
 - However CPU based picking techniques are slower and can require more data on the CPU or they may need to be customized to the structure of the input data.


## Usage

In your vertex shader, your inform the picking module what object we are currently rendering by supplying a picking color, perhaps from an attribute.

```ts
attribute vec3 aPickingColor;
main() {
  picking_setPickingColor(aPickingColor);
  ...
}
```

In your fragment shader, you simply apply (call) the `picking_filterColor` filter function at the very end of the shader. This will return the normal color, or the highlight color, or the picking color, as appropriate.

```ts
main() {
  gl_FragColor = ...
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
```

In your fragment shader, you simply apply (call) the `picking_filterPickingColor` filter function at the very end of the shader. This will return the normal color, or the highlight color, or the picking color, as appropriate.

```glsl
main() {
  gl_FragColor = ...
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
```

If highlighting is not needed, you simply apply (call) the `picking_filterPickingColor` filter function at the very end of the shader. This will return the normal color or the picking color, as appropriate.

```ts
main() {
  gl_FragColor = ...
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
```

If you would like to apply the highlight color to the currently selected element call `picking_filterHighlightColor` before calling `picking_filterPickingColor`. You can also apply other filters on the non-picking color (vertex or highlight color) by placing those instruction between these two function calls.

```ts
main() {
  gl_FragColor = ...
  gl_FragColor = picking_filterHighlightColor(gl_FragColor);
   ... apply any filters on gl_FragColor ...
 gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
```

## JavaScript Functions

### getUniforms()

`getUniforms()` takes an object with key/value pairs, returns an object with key/value pairs representing the uniforms that the `gpuPicking` module shaders need.

Uniforms for the picking module, which renders picking colors and highlighted item. 
When active, renders picking colors, assumed to be rendered to off-screen "picking" buffer. 
When inactive, renders normal colors, with the exception of selected object which is rendered with highlight 

| Setting                                | Description                                                         |
| -------------------------------------- | ------------------------------------------------------------------- |
| `isActive`?: boolean                   | Whether in picking or normal rendering (+highlighting) mode         |
| `isAttribute`: boolean                 | Set to true when picking an attribute value instead of object index |
| `useFloatColors`?: boolean             | Color range 0-1 or 0-255                                            |
| `isHighlightActive`?: boolean          | Do we have a highlighted item?                                      |
| `highlightedObjectColor`?: NumberArray | Set to a picking color to visually highlight that item              |
| `highlightColor`?: NumberArray         | Color of visual highlight of "selected" item                        |

- `isActive` - When true, renders picking colors. Set when rendering to off-screen "picking" buffer. When false, renders normal colors, with the exception of selected object which is rendered with highlight 

<!---
- `pickingActive`=`false` (_boolean_) - Renders the picking colors instead of the normal colors. Normally only used with an off-screen framebuffer during picking.
- `pickingSelectedColor`=`null` (_array|null_) - The picking color of the selected (highlighted) object.
- `pickingHighlightColor`= `[0, 255, 255, 255]` (_array_) - Color used to highlight the currently selected object.
- `pickingAttribute`=`false` (_boolean_) - Renders a color that encodes an attribute value. Normally only used with an off-screen framebuffer during picking.

opts can contain following keys:

- `pickingSelectedColorValid` (_boolean_) - When true current instance picking color is ignored, hence no instance is highlighted.
- `pickingSelectedColor` (_array_) - Picking color of the currently selected instance.
- `pickingHighlightColor` (_array_)- Color used to highlight the currently selected instance.
- `pickingActive`=`false` (_boolean_) - When true, renders the picking colors instead of the normal colors. Normally only used with an off-screen framebuffer during picking. Default value is `false`.

Note that the selected item will be rendered using `pickingHighlightColor`, if blending is enabled for the draw, alpha channel can be used to control the blending result.
-->

## Vertex Shader Functions

### picking_setPickingColor()

```ts
void picking_setPickingColor(vec3 pickingColor)
```

Sets the color that will be returned by the fragment shader if color based picking is enabled. Typically set from a `pickingColor` uniform or a `pickingColors` attribute (e.g. when using instanced rendering, to identify the actual instance that was picked).

### picking_setPickingAttribute

Sets the attribute value that needs to be picked.

`void picking_setPickingAttribute(float value)`
`void picking_setPickingAttribute(vec2 value)`
`void picking_setPickingAttribute(vec3 value)`

## Fragment Shader Functions

### picking_filterColor

```ts
fn picking_filterColor(color: vec4<f32>) -> vec4<f32>
vec4 picking_filterColor(vec4 color)
```

| Picking Enabled | Item Highlighted | Returned color                                                        |
| --------------- | ---------------- | --------------------------------------------------------------------- |
| ✅               | –                | Returns picking color (representing index of this color)              |
| ❌               | ✅                | Returns the current highlight color (to show this item as "selected") |
| ❌               | ❌                | returns the original color (unmodified `color` argument)              |

### picking_filterPickingColor()

```ts
vec4 picking_filterPickingColor(vec4 color)
```

If picking active, returns the current vertex's picking color set by `picking_setPickingColor`, otherwise returns its argument unmodified.

Returns picking highlight color if the pixel belongs to currently selected model, otherwise returns its argument unmodified.


### picking_filterPickingColor()

`vec4 picking_filterPickingColor(vec4 color)`

If picking active, returns the current vertex's picking color set by `picking_setPickingColor`, otherwise returns its argument unmodified.

## Remarks

- It is recommended that `picking_filterPickingColor()` is called last in a fragment shader, as the picking color (returned when picking is enabled) must not be modified in any way (and alpha must remain 1) or picking results will not be correct.

