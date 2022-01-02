# Core Shader Modules

## picking

Provides support for color-coding-based picking. In particular, supports picking a specific instance in an instanced draw call.

Color based picking lets the application draw a primitive with a color that can later be used to index this specific primitive.

### Usage

In your vertex shader, your inform the picking module what object we are currently rendering by supplying a picking color, perhaps from an attribute.

```glsl
attribute vec3 aPickingColor;
main() {
  picking_setPickingColor(aPickingColor);
  ...
}
```

In your fragment shader, you simply apply (call) the `picking_filterPickingColor` filter function at the very end of the shader. This will return the normal color, or the highlight color, or the picking color, as appropriate.

```glsl
main() {
  gl_FragColor = ...
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
```

If you would like to apply the highlight color to the currently selected element call `picking_filterHighlightColor` before calling `picking_filterPickingColor`. You can also apply other filters on the non-picking color (vertex or highlight color) by placing those instruction between these two function calls.

```glsl
main() {
  gl_FragColor = picking_filterHighlightColor(color);
  //  ... apply any filters on gl_FragColor ...
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
```

### JavaScript Functions

#### getUniforms

`getUniforms` returns an object with key/value pairs representing the uniforms that the `picking` module shaders need.

`getUniforms({pickingActive, ...})`

- `pickingActive`=`false` (_boolean_) - Renders the picking colors instead of the normal colors. Normally only used with an off-screen framebuffer during picking.
- `pickingSelectedColor`=`null` (_array|null_) - The picking color of the selected (highlighted) object.
- `pickingHighlightColor`= `[0, 255, 255, 255]` (_array_) - Color used to highlight the currently selected object.
- `pickingAttribute`=`false` (_boolean_) - Renders a color that encodes an attribute value. Normally only used with an off-screen framebuffer during picking.

### Vertex Shader Functions

#### picking_setPickingColor

Sets the color that will be returned by the fragment shader if color based picking is enabled. Typically set from a `pickingColor` uniform or a `pickingColors` attribute (e.g. when using instanced rendering, to identify the actual instance that was picked).

`void picking_setPickingColor(vec3 pickingColor)`

#### picking_setPickingAttribute

Sets the attribute value that needs to be picked.

`void picking_setPickingAttribute(float value)`
`void picking_setPickingAttribute(vec2 value)`
`void picking_setPickingAttribute(vec3 value)`

### Fragment Shader Functions

#### picking_filterPickingColor

If picking active, returns the current vertex's picking color set by `picking_setPickingColor`, otherwise returns its argument unmodified.

`vec4 picking_filterPickingColor(vec4 color)`

#### picking_filterHighlightColor

Returns picking highlight color if the pixel belongs to currently selected model, otherwise returns its argument unmodified.

`vec4 picking_filterHighlightColor(vec4 color)`

### Remarks

- It is strongly recommended that `picking_filterPickingColor` is called last in a fragment shader, as the picking color (returned when picking is enabled) must not be modified in any way (and alpha must remain 1) or picking results will not be correct.
