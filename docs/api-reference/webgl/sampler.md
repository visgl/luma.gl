# Sampler

Samplers allow texture sampling and filtering parameters to be specified independently from a texture. By using samplers an application can render the same texture with different parameters without duplicating the texture. The parameters available are the same as on the [`Texture`](./texture.md) classes.

To use a sampler, bind it to the same texture unit as a texture to control sampling for that texture.

Note: When using the higher level [`Model`]('./model.md') class, samplers can be specified using uniform names instead of texture indices.

## Usage

Sampler inherits from [Resource](./resource) and supports the same use cases.

Create a new Sampler
```js
import {Sampler} from 'luma.gl';
const sampler = new Sampler(gl, {
  parameters: {
  	[GL.TEXTURE_WRAP_S]: GL.CLAMP
  }
});
```

Configuring a Sampler
```js
const sampler = new Sampler(gl);
sampler.setParameters({
  [GL.TEXTURE_WRAP_S]: GL.CLAMP
});
```

Using Samplers
```js
// Create two samplers to sample the same texture in different ways
const texture = new Texture2D(gl, ...);
const sampler1 = new Sampler(gl, ...);
const sampler2 = new Sampler(gl, ...);

// For ease of use, the `Model` class can bind samplers for a draw call
model.draw({
  uniforms({texture1: texture, texture2: texture}),
  samplers({texture1: sampler1, texture2: sampler2})
});

// Alternatively, bind the samplers using the `Sampler` API directly
texture.bind(0);
sampler1.bind(0);
texture.bind(1);
sampler2.bind(1);
```

## Methods

Sampler inherits from [Resource](./resource) and supports the same use cases.

### Sampler Constructor

### Sampler.bind

* param {GLuint} unit - texture unit index
return {Sampler} - returns self to enable chaining

### Sampler.unbind

Bind to the same texture unit as a texture to control sampling for that texture
* param {GLuint} unit - texture unit index
return {Sampler} - returns self to enable chaining
