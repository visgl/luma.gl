---
layout: docs
title: Buffer
categories: [Documentation]
---

Class: Buffer {#Buffer}
===========================

Wraps a WebGLBuffer. A WebGLBuffer is essentially a mechanism to upload
memory buffers (attributes) to the GPU (the cost of which can vary
depending on whether the system uses a unified memory architecture or not).

Buffer constructor: {#Buffer:constructor}
--------------------------------------------------

Creates a new WebGLBuffers. Also, for all properties set to a buffer,
these properties are remembered so they're optional for later calls.

### Syntax:

{% highlight js %}
  import {Buffer} from 'luma.gl';
	const buffer = new Buffer(gl, options);
{% endhighlight %}

### Arguments:

1. name - (*string*) The name (unique id) of the buffer. If no `attribute`
value is set in `options` then the buffer name will be used as attribute name.
2. options - (*object*) An object with options/data described below:

### Options:

* attribute - (*string*, optional) The name of the attribute to generate
  attribute calls to. If this parameter is not specified then the attribute
  name will be the buffer name.
* bufferType - (*enum*, optional) The type of the buffer. Possible
  options are `gl.ELEMENT_ARRAY_BUFFER`, `gl.ARRAY_BUFFER`. Default is
  `gl.ARRAY_BUFFER`.
* size - (*numer*, optional) The size of the components in the buffer. Default is 1.
* dataType - (*enum*, optional) The type of the data being stored in the buffer. Default's `gl.FLOAT`.
* stride - (*number*, optional) The `stride` parameter when calling `gl.vertexAttribPointer`. Default's 0.
* offset - (*number*, optional) The `offset` parameter when calling `gl.vertexAttribPointer`. Default's 0.
* drawType - (*enum*, optional) The type of draw used when setting the `gl.bufferData`. Default's `gl.STATIC_DRAW`.

### Examples:

Set buffer values for the vertices of a triangle. 
The context of this example can be seen [here]http://uber.github.io/luma.gl/examples/lessons/1/).

{% highlight js %}
program.setBuffer('triangle', {
  attribute: 'aVertexPosition',
  value: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
  size: 3
});
{% endhighlight %}
