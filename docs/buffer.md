@wwwtyro Looks great, and I think it could make sense to organize all our examples like this, with separate package.json files. It allows us to show Luma.GL's intended ES6 programming style in the example code, and makes the examples more free standing and easy to copy and build from.

The only concern I have at this point is the size of the built bundles (currently 13K lines, 420K bytes), especially if we will be doing this for every example and every time we update we'll store a new version in the repo.

So it might be worth a quick investigation into ways to use multiple browserify bundles, essentially bundling only the example's code, and requiring Luma.GL from the standard pre-built bundle (see for example: https://lincolnloop.com/blog/speedy-browserifying-multiple-bundles/)

Not sure if budo will work with multiple bundles though, if it doesn't that would be a concern.

---
layout: docs
title: Program
categories: [Documentation]
---

Class: Program {#Program}
===========================


Program Method: setBuffer {#Program:setBuffer}
--------------------------------------------------

This method is useful to set properties (and data) to a buffer and/or
attributes. If the buffer does not exist it will be created.
Also, for all properties set to a buffer, these properties are
remembered so they're optional for later calls.

### Syntax:

	program.setBuffer(name, options);

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
The context of this example can be seen [here](http://uber-common.github.com/luma.gl/examples/lessons/1/).

{% highlight js %}
program.setBuffer('triangle', {
  attribute: 'aVertexPosition',
  value: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
  size: 3
});
{% endhighlight %}


Program Method: setBuffers {#Program:setBuffers}
--------------------------------------------------

For each `key, value` of the object passed in it executes `setBuffer(key, value)`.

### Syntax:

	program.setBuffers(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching a buffer name and its value respectively.

### Examples:

Set buffer values for the vertices of a triangle and a square. 
The context of this example can be seen [here](http://uber-common.github.com/luma.gl/examples/lessons/1/).

{% highlight js %}
program.setBuffers({
  'triangle': {
    attribute: 'aVertexPosition',
    value: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
    size: 3
  },
  
  'square': {
    attribute: 'aVertexPosition',
    value: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0]),
    size: 3
  }
});
{% endhighlight %}
