---
layout: docs
title: Texture
categories: [Documentation]
---

Class: Texture {#Texture}
===========================



Program Method: setTexture {#Program:setTexture}
-------------------------------------------------

This method is used to either bind/unbind an existing texture or also
to create a new texture form an `Image` element or
to create an empty texture with specified dimensions.
Also, for all properties set to a texture, these properties are
remembered so they're optional for later calls.

### Syntax:

	program.setTexture(name[, options]);

### Arguments:

1. name - (*string*) The name (unique id) of the texture.
2. options - (*mixed*) Can be a boolean or enum used to bind/unbind the
   texture (or set the enum as active texture) or an object with options/data
   described below:

### Options:

* textureType - (*enum*, optional) The texture type used to call `gl.bindTexture` with. Default's `gl.TEXTURE_2D`.
* pixelStore - (*array*, optional) An array of objects with name, value options to be set with `gl.pixelStorei` calls. 
Default's `[{ name: gl.UNPACK_FLIP_Y_WEBGL, value: true }]`.
* parameters - (*array*, optional) An array of objects with nane, value options to be set with `gl.texParameteri`. 
Default's `[{ name: gl.TEXTURE_MAG_FILTER, value: gl.NEAREST }, { name: gl.TEXTURE_MIN_FILTER, value: gl.NEAREST }]`.
* data - (*object*, optional) An object with properties described below:
  * format - (*enum*, optional) The format used for `gl.texImage2D` calls. Default's `gl.RGBA`.
  * value - (*object*, optional) If set to an `Image` object then this image will be used to fill the texture. Default's false. If no image is set then we might want to set the width and height of the texture.
  * width - (*number*, optional) The width of the texture. Default's 0.
  * height - (*number*, optional) The height of the texture. Default's 0.
  * border - (*number*, optional) The border of the texture. Default's 0.

### Examples:

Setting a texture for a box. Adapted from
[lesson 6](http://uber/.github.com/luma.gl/examples/lessons/6/).

{% highlight js %}
var img = new Image();

img.onload = function() {
  program.setTexture('nearest', {
    data: {
      value: img
    }
  });
};

img.src = 'path/to/image.png';
{% endhighlight %}


Program Method: setTextures {#Program:setTextures}
----------------------------------------------------

For each `key, value` of the object passed in it executes `setTexture(key, value)`.

### Syntax:

	program.setTextures(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching a texture name and its value respectively.

### Examples:

Set multiple type of textures from the same image. Taken from
[lesson 6](http://uber/.github.com/luma.gl/examples/lessons/6/).

{% highlight js %}
//load textures from image
var img = new Image();
img.onload = function() {
  program.setTextures({
    'nearest': {
      data: {
        value: img
      }
    },

    'linear': {
      data: {
        value: img
      },
      parameters: [{
        name: gl.TEXTURE_MAG_FILTER,
        value: gl.LINEAR
      }, {
        name: gl.TEXTURE_MIN_FILTER,
        value: gl.LINEAR
      }]
    },

    'mipmap': {
      data: {
        value: img
      },
      parameters: [{
        name: gl.TEXTURE_MAG_FILTER,
        value: gl.LINEAR
      }, {
        name: gl.TEXTURE_MIN_FILTER,
        value: gl.LINEAR_MIPMAP_NEAREST,
        generateMipmap: true
      }]
    }
  });
};

img.src = 'path/to/image.png';
{% endhighlight %}
