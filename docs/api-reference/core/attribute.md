# Attribute (experimental)

Wrapper class to be used with the `Model` class' `render` and `setAttributes` methods.


## Usage

Create model object by passing shaders, uniforms, geometry and render it by passing updated uniforms.

```js
// construct the model.
const positions = new Attribute({
  id: 'vertexPositions',
  size: 3,
  value: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0])
});

// and on each frame update any uniforms (typically matrices) and call render.
model.setAttributes({positions});
model.render();
```

## Methods

### constructor

The constructor for the Attribute class. Use this to create a new Attribute.

`new Attribute(gl, options);`

* `gl` - WebGL context.
* `size` (*number*) - The number of components in each element the buffer (1-4).
* `id` (*string*, optional) - Identifier of the attribute. Cannot be updated.
* `type` (*GLenum*, optional) - Type of the attribute. If not supplied will be inferred from `value`. Cannot be updated.
* `isIndexed` (*bool*, optional) - If the attribute is element index. Default `false`. Cannot be updated.
* `isGeneric` (*bool*, optional) - If the attribute is generic. Default `false`.
* `isInstanced` (*bool*, optional) - Whether buffer contains instance data. Default `false`.
* `normalized` (*boolean*, optional) - Default `false`
* `integer` (*boolean*, optional) - Default `false`
* `offset` (*number*, optional) - where the data starts in the buffer. Default `0`.
* `stride` (*number*, optional) - an additional offset between each element in the buffer. Default `0`.
* `value` (*TypedArray*) - value of the attribute.
* `buffer` (*Buffer*) - an external buffer for the attribute.


### delete

Free WebGL resources associated with this attribute.


### update

```js
attribute.update({value: newValue});
```

Update attribute options. See `constructor` for possible options.


### getBuffer

Returns a `Buffer` object associated with this attribute, if any.
