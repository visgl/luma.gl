---
layout: docs
title: Object3D - Scenegraph Base Class
categories: [Documentation]
---

Class: Object3D {Object3D}
----------------------------------

The Object3D class enables you to create 3D models which are compatible with the
[Scene](scene.html) class. All primitives (Sphere, etc) inherit from Object3D.

### Properties:

A Object3D instance has a number of public properties that can be accessed/modified:

* position - (*object*) A `Vec3` indicating the position of the Object3D.
* rotation - (*object*) A `Vec3` indicating the rotation of the Object3D.
* scale - (*object*) A `Vec3` indicating the scaling of the Object3D.
* matrix - (*object*) A `Mat4` containing information about position, rotation and scale.
This matrix gets updated each time the method `update` is called on a Object3D instance.


Object3D Method: constructor {Object3D:constructor}
-------------------------------------------------------

The main constructor function for the Object3D class. Use this to create a new Object3D.

### Syntax:

	var model = new Object3D(options);

### Arguments:

1. options - (*object*) An object containing the following options:

### Options:

* id - (*string*, optional) An id for the model. If not provided, a random unique identifier will be created.
* dynamic - (*boolean*, optional) If true then the vertices and normals will always be updated in the Buffer Objects before rendering. Default's false.
* display - (*boolean*, optional) If false the element won't be displayed in the scene. Default's true.
* vertices - (*array*, optional) An array of floats that describe the vertices of the model.
* normals - (*array*, optional) An array of floats that describe the normals of the model.
* textures - (*array*, optional) An array of strings of texture ids.
* texCoords - (*mixed*, optional) Can be an array of floats indicating the texture coordinates for the texture to be used or an object that has texture ids as keys and an array of floats as values.
* colors - (*array*, optional) An array of colors in RGBA. If just one color is specified that color will be used for all faces.
* indices - (*array*, optional) An array of numbers describing the vertex indices for each face.
* attributes - (*object*, optional) An object with buffer/attribute names and buffer/attribute descriptors to be set before rendering the model. If you want to know more
about attribute descriptors you can find a description of them in [program.setBuffer](program.html#Program:setBuffer).
* uniforms - (*object*, optional) An object with uniform names and values to be set before rendering the model.
* program - (*string*, optional) A string with the id of the program to be used when rendering this model.
* drawType - (*string*, optional) A string describing the drawType. Some options are `TRIANGLES`, `TRIANGLE_STRIP`, `POINTS`, `LINES`. Default's `TRIANGLES`.
* render - (*function*, optional) A function to be called for rendering the object instead of the default [Scene](scene.html) rendering method.
* pickable - (*boolean*, optional) If true the element can be selected with the mouse when using picking on the [Event](event.html) configuration. Default's false.
* pickingColors - (*array*, optional) A custom set of colors to render the object to texture when performing the color picking algorithm.
* pick - (*function*, optional) A custom pick function called with the retrieved pixel color from the picking texture.
array of floats as values (to handle multiple textures).
* onBeforeRender - (*function*, optional) Called before rendering an object. The first two formal parameters are the program and the camera respectively.
* onAfterRender - (*function*, optional) Called after rendering an object. The first two formal parameters are the program and the camera respectively.

### Notes:

 * Attribute arrays are implemented as getters and
   setters, and may not return the same information they've been set with.
   Internally, attribute arrays are transformed into
   [typed arrays](https://developer.mozilla.org/en/JavaScript_typed_arrays).
 * Attribute arrays only accept plain arrays.
 * If you set a `color` attribute as a single color, then the array will
   be cloned to match the number of components for the model and will be
   served as an attribute. The getter for this property will return the
   cloned typed array.
 * `shininess`, `reflection` and `refraction` properties are set in the `uniforms` object. Below is a description
of the attributes.
   * shininess - (*number*, optional) A number between [0.1, 200] describing how shiny an object is.
   * reflection - (*number*, optional) A number between [0, 1] describing the reflectivity of an object.
   * refraction - (*number*, optional) A number between [0, 1] describing the refraction index of an object.

### Examples:

Create a pyramid model (used in lesson 4 of learning WebGL examples).

{% highlight js %}
var pyramid = new Object3D({
    vertices: [ 0,  1,  0,
               -1, -1,  1,
                1, -1,  1,
                0,  1,  0,
                1, -1,  1,
                1, -1, -1,
                0,  1,  0,
                1, -1, -1,
               -1, -1, -1,
                0,  1,  0,
               -1, -1, -1,
               -1, -1,  1],

    colors: [1, 0, 0, 1,
             0, 1, 0, 1,
             0, 0, 1, 1,
             1, 0, 0, 1,
             0, 0, 1, 1,
             0, 1, 0, 1,
             1, 0, 0, 1,
             0, 1, 0, 1,
             0, 0, 1, 1,
             1, 0, 0, 1,
             0, 0, 1, 1,
             0, 1, 0, 1]
  });
{% endhighlight %}


Create a pyramid model and add some extra buffer information and uniform
color to be set before rendering the model.

{% highlight js %}

var fromVertices =  [ 0,  1,  0,
                     -1, -1,  1,
                      1, -1,  1,
                      0,  1,  0,
                      1, -1,  1,
                      1, -1, -1,
                      0,  1,  0,
                      1, -1, -1,
                     -1, -1, -1,
                      0,  1,  0,
                     -1, -1, -1,
                     -1, -1,  1];

var toVertices = fromVertices.map(function(value) { return value * 2; });

var pyramid = new Object3D({
    vertices: fromVertices,

    uniforms: {
        colorUfm: [0.3, 0.2, 0.7, 1]
    },

    attributes: {
        endPosition: {
          //default is type: gl.FLOAT
          attribute: 'endPosition',
          size: 3,
          value: new Float32Array(toVertices)
        }
    }
  });
{% endhighlight %}


Object3D Method: update {Object3D:update}
---------------------------------------------

Update the model matrix. Useful to update changes to the `position`, `rotation` or `scale` properties.

### Syntax:

	model.update();

### Examples:

Change the position of the pyramid model and update its matrix.

{% highlight js %}
  pyramid.position = new Vec3(10, 10, 20);

  pyramid.update();
{% endhighlight %}


