---
layout: docs
title: Scene
categories: [Documentation]
---

Class: Scene {#Scene}
===============================

The Scene class abstracts the use of low level code for lighting and other effects and creates a high level structure that
plays well with objects created with [O3D](o3d.html) and the default shaders in [Shaders](shaders.html) to enable rendering of multiple
models in the scene with different options. The Scene role is to connect the properties set in the [O3D](o3d.html) models to the
attributes defined in the shaders so that the buffer creation and updating is transparent to the user.
The good thing about the design though is that the Scene provides many callback functions that can be executed at different
stages of the rendering process for the user to update or bypass setting of the attributes and uniforms. This also enables you
to create your own shader files that are compatible with the [Scene](scene.html) class. Some examples of [Scene](scene.html) compatible shader
files can be found [here](https://github.com/philogb/philogl/tree/master/shaders). Also, for more information about the
default shaders take a look at the [Shaders](shaders.html) class. The [O3D](o3d.html) options describe how to override or set callbacks when rendering
objects with a default scene.



### Scene Static Properties

* PICKING\_RES - Used to set the default resolution for the texture / image used for color picking. Default value is `4`. For best picking precision use `1`.

### Syntax:

    PhiloGL.Scene.PICKING_RES = 1;


Scene Method: constructor {#Scene:constructor}
------------------------------------------------

Creates a new [Scene](scene.html) instance.

### Syntax:

	var scene = new PhiloGL.Scene(program, camera, options);

### Arguments:

1. program - (*object*) A Program instance. For more information check the [Program](program.html) class.
2. camera - (*object*) A Camera instance. For more information check the [Camera](camera.html) class.
3. options - (*object*) An object with the following properties:

### Options:

* lights - (*object*, optional) An object for managing lights. The options for lighting are:
  * enable - (*boolean*) Set this to `true` to enable lighting.
  * ambient - (*object*, optional) A r, g, b object with values in [0, 1] to select ambient lighting.
  * directional - (*object*, optional) An object with properties:
    * direction - (*object*) An object with x, y, z coordinates to display the light direction.
    * color - (*object*) A r, g, b object with values in [0, 1] to select the color.
  * points - (*mixed*, optional) An array of point lights configuration objects containing as properties:
    * position - (*object*) A x, y, z object with the point light position.
    * color|diffuse - (*object*) A r, g, b object with values in [0, 1] that sets the (diffuse) color for the point light.
    * specular - (*object*, optional) A r, g, b object with values in [0, 1] that sets the specular light color.
  * effects - (*object*, optional) An object with scene effect options.

    * fog - (*object*, optional) An object with linear fog options explained below.
      * near - (*number*, optional) The near fog factor. Default's the [Camera](camera.html) near factor.
      * far - (*number*) The far fog factor. Default's the [Camera](camera.html) far factor.
      * color - (*object*) An `{ r, g, b }` object with the fog color.

### Examples:

Create a new Scene instance. Taken from [lesson 16](http://philogb.github.com/philogl/PhiloGL/examples/lessons/16/).

{% highlight js %}
var innerScene = new PhiloGL.Scene(program, innerCamera, {
  lights: {
    enable: true,
    points: {
      position: {
        x: -1, y: 2, z: -1
      },
      diffuse: {
        r: 0.8, g: 0.8, b: 0.8
      },
      specular: {
        r: 0.8, g: 0.8, b: 0.8
      }
    }
  }
});
{% endhighlight %}

Create a new Scene instance and add some fog to it.

{% highlight js %}
var scene = new PhiloGL.Scene(program, camera, {
  //Setup lighting.
  lights: {
    enable: true,
    points: {
      position: {
        x: -1, y: 2, z: -1
      },
      diffuse: {
        r: 0.8, g: 0.8, b: 0.8
      },
      specular: {
        r: 0.8, g: 0.8, b: 0.8
      }
    }
  },
  //Add fog effect.
  effects: {
    fog: {
      near: 0.5,
      far: 500,
      color: {
        r: 0.3, g: 0.4, b: 0.7
      }
    }
  }
});
{% endhighlight %}




Scene Method: add {#Scene:add}
--------------------------------

Add an [O3D](o3d.html) object to the Scene.

### Syntax:

    scene.add(o[, ...]);

### Arguments:

A variable argument list of [O3D](o3d.html) instances.

### Examples:

Add a moon and a box models to the scene. Taken from [lesson 12](http://philogb.github.com/philogl/PhiloGL/examples/lessons/12/).

{% highlight js %}
//Add objects to the scene
scene.add(moon, box);
{% endhighlight %}


Scene Method: remove {#Scene:remove}
-------------------------------------

Removes an [O3D](o3d.html) object from the Scene.

### Syntax:

    scene.remove(model);

### Arguments:

model - (*object*) The model to be removed.

### Examples:

Add a moon and a box models to the scene. Then remove them.

{% highlight js %}
//Add objects to the scene
scene.add(moon, box);

//Remove the moon
scene.remove(moon);
{% endhighlight %}


Scene Method: render {#Scene:render}
--------------------------------------

Renders all the objects added to the scene.

### Syntax:

    scene.render(callback);

### Arguments:

1. callback - (*object*, optional) An object with
   `onBeforeRender(object, index)` and
   `onAfterRender(object, index)` methods to be called right before and
right after rendering each element.


Scene Method: renderToTexture {#Scene:renderToTexture}
-------------------------------------------------------

Performs `scene.render()` but binds a texture afterwards to store the rendered image in the texture itself and not the main
buffer.

### Syntax:

    scene.renderToTexture(name);

### Arguments:

1. name - (*string*) The name/id of the texture to bind the rendering to.

### Examples:

Bind a framebuffer, render the scene to a texture, and unbind the framebuffer. This is the procedure done
to render the inner scene in the laptop example on [lesson 16](http://philogb.github.com/philogl/PhiloGL/examples/lessons/16/).

{% highlight js %}
function drawInnerScene() {
  program.setFrameBuffer('monitor', true);

  gl.viewport(0, 0, screenWidth, screenHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  theta += 0.01;

  moon.position = {
    x: rho * Math.cos(theta),
    y: 0,
    z: rho * Math.sin(theta)
  };
  moon.update();

  box.position = {
    x: rho * Math.cos(Math.PI + theta),
    y: 0,
    z: rho * Math.sin(Math.PI + theta)
  };
  box.update();

  innerScene.renderToTexture('monitor');

  program.setFrameBuffer('monitor', false);
}
{% endhighlight %}


Scene Method: pick {#Scene:pick}
--------------------------------

Returns an [O3D](o3d.html) object under the given `x` and `y`
coordinates. The object must have `pickable` set to `true`.

### About the picking algorithm

The picking algorithm used in PhiloGL is a color picking
algorithm. Each model is assigned a different color and the scene is
rendered to a texture. Then, the pixel pointed by the mouse
position is retrieved from the texture and the color of that pixel is
used to identify the model.

### Customizing the picking algorithm

Sometimes we want to know more than just which object has been picked. For
example, we would want to know which face of that object has been
picked. In that case the [O3D](o3d.html) constructor options
`pickingColors` and `pick` are useful. By defining your own set of per
vertex colors and a method that given a pixel returns special
information on what part of the object has been retrieved, then it is
possible to have finer grain picking. For more information about how to
use this you can take a look at the Air Flights example or go to the
[Google group of the framework](http://groups.google.com/group/philogl)
and ask for more info.

### Syntax:

    scene.pick(x, y, options);

### Arguments:

* x - (*number*) The `x` position. The upper left corner of the viewport
is considered to be `(0, 0)`.
* y - (*number*) The `y` position. The upper left corner of the viewport
is considered to be `(0, 0)`.
* options - (*object*, optional) An object containing the following properties:
  * viewport - (*object*, optional) An object containing viewport
    information:
    * x - (*number*, optional) Viewport start `x` position. Default's `0`.
    * y - (*number*, optional) Viewport start `y` position. Default's `0`.
    * width - (*number*, optional) Viewport `width` dimension. Default's `canvas.offsetWidth`.
    * height - (*number*, optional) Viewport `height` dimension. Default's `canvas.offsetHeight`.

### Notes:

 * You might want to check how picking is used in the [Event](event.html) options. There you can grab
the target of the event in a simple way.
 * Also, the picking method will disable blending. If you are using
   blending in your application (along with picking), you might want to
   turn blending `on` in the rendering loop to ensure it is always on.

### Examples:

Get an object at `(100, 100)` and change its color by altering a
uniform value.

{% highlight js %}
var model = scene.pick(100, 100);

if (model) {
  model.uniforms.colorUfm = [1, 1, 1, 1];
}
{% endhighlight %}


Scene Method: resetPicking {#Scene:resetPicking}
------------------------------------------------

Clear framebuffers and previous scene captures and restart the picking
routine without any cached values. Generally used when `lazyPicking` is set to
`true` in [Events.create](event.html#Events:create).

### Syntax:

    scene.resetPicking();


