# Attribute (Experimental)

Helper class used with the `Model` class' `render` and `setAttributes` methods.

Manages one attribute, allowing it to be set to one of:
* An externally created `Buffer`.
* A JavaScript array, automatically creating/managing a `Buffer`.
* A constant value

Also holds an accessor object.

## Usage

Create model object by passing shaders, uniforms, geometry and render it by passing updated uniforms.

```js
import {_Attribute as Attribute} from '@luma.gl/core';
```

```js
// construct the model.
const positions = new Attribute({
  id: 'vertexPositions',
  accessor: {size: 3},
  value: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0])
});

// and on each frame update any uniforms (typically matrices) and call render.
model.setAttributes({positions});
model.draw();
```

## Methods

### constructor

The constructor for the Attribute class. Use this to create a new Attribute.

`new Attribute(gl : WebGLRenderingContext, props : Object)`

* `gl` - WebGL context.
* `id` (*string*, optional) - Identifier of the attribute. Cannot be updated.
* `constant` (*bool*, optional) - If the attribute is a constant. Default `false`.
* `value` (*TypedArray*) - value of the attribute.
    - If `constant` is `true`, the length of `value` should match `size`
    - If `constant` is `false`, the length of `value` should be `size` multiplies the number of vertices.
* `buffer` (*Buffer*) - an external buffer for the attribute.
* `accessor` (`Object` | `Accessor`) - accessor object to be used when setting the attribute.

Deprecated props (these are now stored on the accessor):
* `size` (*number*) - The number of components in each element the buffer (1-4).
* `type` (*GLenum*, optional) - Type of the attribute. If not supplied will be inferred from `value`. Cannot be updated.
* `isIndexed` (*bool*, optional) - If the attribute is element index. Default `false`. Cannot be updated.
* `isInstanced` (*bool*, optional) - Whether buffer contains instance data. Default `false`.
* `normalized` (*boolean*, optional) - Default `false`.
* `integer` (*boolean*, optional) - Default `false`.
* `offset` (*number*, optional) - where the data starts in the buffer. Default `0`.
* `stride` (*number*, optional) - an additional offset between each element in the buffer. Default `0`.


### delete() : Attribute

Free WebGL resources associated with this attribute.


### update(props : Object) : Attribute

```js
attribute.update({value: newValue});
```

Update attribute options. See `constructor` for possible options.


### getBuffer() : Buffer

Returns a `Buffer` object associated with this attribute, if any.
