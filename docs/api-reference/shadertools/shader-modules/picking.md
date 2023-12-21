# picking

Provides support for color-based picking. 

The `picking` modules supports picking and highlighting for both instanced and non-instanced data:
- pick a specific *instance* in an instanced draw call
- highlight all fragments of an *instance* based on its picking color
- pick "group of primitives" with the same picking color in non-instanced draw-calls
- highlight "group of primitives" with the same picking color in non-instanced draw-calls

Color based picking lets the application draw a primitive with a color that can later be used to index this specific primitive.

Highlighting allows application to specify a picking color corresponding to an object that need to be highlighted and the highlight color to be used.


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

`getUniforms()` takes an object with key/value pairs, returns an object with key/value pairs representing the uniforms that the `picking` module shaders need.

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

