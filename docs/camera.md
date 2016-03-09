---
layout: docs
title: Camera
categories: [Documentation]
---

LumaGL provides two camera classes - `PerspectiveCamera` and `OrthoCamera`. They
are used to prepare perspective and orthographic projection matrices when rendering
your scene, respectively.


Class: PerspectiveCamera {#PerspectiveCamera}
===========================

Used to calculate view and perspective projection matrices when rendering your scene.

### Properties:

* fov  - (*number*) The angle (in degrees) for the field of view.
* aspect  - (*number*) The aspect ratio of the screen.
* near - (*number*) The closest distance that can be captured by the camera.
* far - (*number*) The longest distance that can be captured by the camera.
* position - (*object*) Vec3 representing the position of the camera.
* target - (*object*) Vec3 representing the point the camera is looking at.
* up - (*object*) Vec3 representing the up direction.

PerspectiveCamera Method: constructor {#PerspectiveCamera:constructor}
----------------------------------------------------

### Syntax:

	var camera = new PerspectiveCamera([options]);

### Options:

* fov  - (*number*) The angle (in degrees) for the field of view.
* aspect  - (*number*) The aspect ratio of the screen.
* near - (*number*) The closest distance that can be captured by the camera.
* far - (*number*) The longest distance that can be captured by the camera.
* position - (*object*) Vec3 representing the position of the camera.
* target - (*object*) Vec3 representing the point the camera is looking at.
* up - (*object*) Vec3 representing the up direction.

### Examples:

Creates a camera with position (0, 0, 10) pointing to a target in (0, 0, 0).

{% highlight js %}
  var canvas = document.getElementById('canvas');
  var camera = new PerspectiveCamera({
        fov: 45,
        aspect: canvas.width / canvas.height,
        near: 0.1,
        far: 100,
        position: new Vec3(0, 0, 10)
      });
{% endhighlight %}


PerspectiveCamera Method: update {#PerspectiveCamera:update}
------------------------------------

Updates the PerspectiveCamera *view* matrix with the information provided on *position* and *target*.

### Syntax:

	camera.update();

### Examples:

{% highlight js %}
  var camera = new PerspectiveCamera({
    fov: 45,
    aspect: canvas.width / canvas.height,
    near: 0.1,
    far: 100,
    position: new Vec3(0, 0, 10)
  });

  camera.position = new Vec3(10, 0, 10);
  camera.update(); //update matrices

{% endhighlight %}


Class: OrthoCamera {#OrthoCamera}
===========================

Used to calculate view and orthographic projection matrices when rendering your scene.

### Properties:

* fov  - (*number*) The angle (in degrees) for the field of view.
* aspect  - (*number*) The aspect ratio of the screen.
* near - (*number*) The closest distance that can be captured by the camera.
* far - (*number*) The longest distance that can be captured by the camera.
* position - (*object*) Vec3 representing the position of the camera.
* target - (*object*) Vec3 representing the point the camera is looking at.
* up - (*object*) Vec3 representing the up direction.

OrthoCamera Method: constructor {#OrthoCamera:constructor}
----------------------------------------------------

### Syntax:

	var camera = new OrthoCamera([options]);

### Options:

* fov  - (*number*) The angle (in degrees) for the field of view.
* aspect  - (*number*) The aspect ratio of the screen.
* near - (*number*) The closest distance that can be captured by the camera.
* far - (*number*) The longest distance that can be captured by the camera.
* position - (*object*) Vec3 representing the position of the camera.
* target - (*object*) Vec3 representing the point the camera is looking at.
* up - (*object*) Vec3 representing the up direction.

### Examples:

Creates a camera with position (0, 0, 10) pointing to a target in (0, 0, 0).

{% highlight js %}
  var canvas = document.getElementById('canvas');
  var camera = new OrthoCamera({
        fov: 45,
        aspect: canvas.width / canvas.height,
        near: 0.1,
        far: 100,
        position: new Vec3(0, 0, 10)
      });
{% endhighlight %}


OrthoCamera Method: update {#OrthoCamera:update}
------------------------------------

Updates the OrthoCamera *view* matrix with the information provided on *position* and *target*.

### Syntax:

	camera.update();

### Examples:

{% highlight js %}
  var camera = new OrthoCamera({
    fov: 45,
    aspect: canvas.width / canvas.height,
    near: 0.1,
    far: 100,
    position: new Vec3(0, 0, 10)
  });

  camera.position = new Vec3(10, 0, 10);
  camera.update(); //update matrices

{% endhighlight %}
