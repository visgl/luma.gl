---
layout: docs
title: Media
categories: [Documentation]
---

Script: Media {#Media}
===========================

The goal of this module is to provide utility functions for media like audio, 
video, or image post-processing among others things (for example other devices, camera, etc.). 
The API in this module will be changing with time, and right now there's
only one utility method implemented under the `Image` object.


Object: Image {#Media:Image}
===============================

Povides utility functions for manipulating images.


Image Method: postProcess {#Media:Image:postProcess}
-----------------------------------------------------

Creates a temporary scene with a plane, used to post-process textures and render the
job to other texture(s) or to the main screen.

### Syntax:

	Media.Image.postProcess(options);

### Arguments:

1. options - (*object*) An object with the following properties:

### Options:

* program - (*string*) The program `id` to be used for rendering.
* fromTexture - (*mixed*) Can be an array of strings or just a string. The texture ids to send to the shaders when rendering.
* toFrameBuffer - (*string*, optional) The `id` of the framebuffer to render the scene to. The associated texture will have as `id` the framebuffer id plus `-texture` as suffix.
* toScreen - (*boolean*, optional) Set this to `true` to render the result to the screen. Default's false.
* aspectRatio - (*number*, optional) Sets the aspect ratio for the camera. If not specified it's automatically set.
* viewportX - (*number*, optional) The offset with of the frame. Default's `0`.
* viewportY - (*number*, optional) The offset height of the frame. Default's `0`.
* width - (*number*, optional) The with of the frame. Default's the with of the canvas.
* height - (*number*, optional) The height of the frame. Default's the height of the canvas.
* uniforms - (*object*, optional) An object descriptor with the name and value of the uniforms to be sent to the shaders. Default's an empty object.

### Examples:

In the
[World Flights](http://http://uber.github.io/luma.gl/LumaGL/examples/worldFlights/)
example we use image post-processing to create a pseudo bloom filter.

{% highlight js %}
  //create two framebuffers that will store an image to a texture.
  app.setFrameBuffer('world', {
    width: 1024,
    height: 1024,
    bindToTexture: {
      parameters: [{
        name: 'TEXTURE_MAG_FILTER',
        value: 'LINEAR'
      }, {
        name: 'TEXTURE_MIN_FILTER',
        value: 'LINEAR_MIPMAP_NEAREST',
        generateMipmap: false
      }]
    },
    bindToRenderBuffer: true
  }).setFrameBuffer('world2', {
    width: 1024,
    height: 1024,
    bindToTexture: {
      parameters: [{
        name: 'TEXTURE_MAG_FILTER',
        value: 'LINEAR'
      }, {
        name: 'TEXTURE_MIN_FILTER',
        value: 'LINEAR_MIPMAP_NEAREST',
        generateMipmap: false
      }]
    },
    bindToRenderBuffer: true
  });

  //...later, when rendering the scene...

   // render to a 'world-texture'
   app.setFrameBuffer('world', true);
   program.earth.use();
   gl.clear(clearOpt);
   gl.viewport(0, 0, 1024, 1024);
   program.earth.setUniform('renderType',  0);
   scene.renderToTexture('world');
   app.setFrameBuffer('world', false);

   // render to a 'world2-texture'
   app.setFrameBuffer('world2', true);
   program.earth.use();
   gl.clear(clearOpt);
   gl.viewport(0, 0, 1024, 1024);
   program.earth.setUniform('renderType',  -1);
   scene.renderToTexture('world2');
   app.setFrameBuffer('world2', false);
  
   // send the two textures to the shaders,
   // and combine them in the shaders and print the
   // result to the screen.
   Media.Image.postProcess({
     fromTexture: ['world-texture', 'world2-texture'],
     toScreen: true,
     program: 'glow',
     width: 1024,
     height: 1024
   });
{% endhighlight %}


### Notes:

You can find other examples in the `hoc` folder in the source code at [GitHub](http://github.com/senchalabs/philogl/).


