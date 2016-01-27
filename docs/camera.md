---
layout: docs
title: Camera
categories: [Documentation]
---

Class: Camera {#Camera}
===========================

Provides the Camera object with information about the camera position, target position and projection matrix information.

### Properties:

You can access most of the constructor properties from a camera
instance:

* fov  - (*number*) The angle (in degrees) for the field of view.
* aspect  - (*number*) The aspect ratio of the screen.
* near - (*number*) The closest distance that can be captured by the camera.
* far - (*number*) The longest distance that can be captured by the camera.


Camera Method: constructor {#Camera:constructor}
----------------------------------------------------

The Camera object, used as eye to project the scene into.

### Syntax:

	var camera = new LumaGL.Camera(fov, aspect, near, far [, options]);

### Arguments:

1. fov  - (*number*) The angle (in degrees) for the field of view.
2. aspect  - (*number*) The aspect ratio of the screen.
3. near - (*number*) The closest distance that can be captured by the camera.
4. far - (*number*) The longest distance that can be captured by the camera.
5. options - (*object*, optional) An object containing the following options:

### Options:

* position - (*object*) An x, y, z object with the camera position.
* target - (*object*) An x, y, z object with the target position.
* type - (*string*, optional) The type of projection. Either "perspective" or "orthographic". Default's "perspective".

### Examples:

Creates a camera with position (0, 0, 10) pointing to a target in (0, 0, 0).

{% highlight js %}
  var canvas = document.getElementById('canvas');
  var camera = new LumaGL.Camera(45, canvas.width / canvas.height, 0.1, 100, {
        position: {
          x: 0, y: 0, z: 10
        }
      });
{% endhighlight %}


Camera Method: update {#Camera:update}
------------------------------------

Updates the Camera *view* matrix with the information provided on *position* and *target* respectively.

### Syntax:

	camera.update();

### Examples:

{% highlight js %}
  var camera = new LumaGL.Camera(45, canvas.width / canvas.height, 0.1, 100, {
    position: {
      x: 0, y: 0, z: 10
    }
  });

  camera.position = {
    x: 10,
    y: 0,
    z: 10
  };
  camera.update(); //update matrices

{% endhighlight %}

