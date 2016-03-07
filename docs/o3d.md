---
layout: docs
title: Models & Primitives
categories: [Documentation]
---

Class: Model {Model}
----------------------------------

The Model class enables you to create 3D models which are compatible with the
[Scene](scene.html) class. All primitives (Sphere, etc) inherit from Model.


### Properties:

A Model instance has a number of public properties that can be accessed/modified:

* position - (*object*) A `Vec3` indicating the position of the Model.
* rotation - (*object*) A `Vec3` indicating the rotation of the Model.
* scale - (*object*) A `Vec3` indicating the scaling of the Model.
* matrix - (*object*) A `Mat4` containing information about position, rotation and scale.
This matrix gets updated each time the method `update` is called on a Model instance.


Model Method: constructor {Model:constructor}
-------------------------------------------------------

The main constructor function for the Model class. Use this to create a new Model.

### Syntax:

	var model = new Model(options);

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
var pyramid = new Model({
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

var pyramid = new Model({
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


Model Method: update {Model:update}
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


Class: Cube {Cube}
------------------

Creates a Cube model. Inherits methods from [Model](Model).

### Extends

Model


Cube Method: constructor {Cube:constructor}
-------------------------------------------

The main constructor function for the Cube class. Use this to create a new Cube. Accepts the same properties and
options as Model constructor but has preset for `vertices`, `normals` and `indices`.

### Syntax:

	var model = new Cube(options);

### Arguments:

1. options - (*object*) The same options as in Model constructor but has preset for `vertices`, `normals` and `indices`.

### Examples:

Create a white cube.

{% highlight js %}
var whiteCube = new Cube({
      colors: [1, 1, 1, 1]
    });
{% endhighlight %}


Class: Sphere {Sphere}
------------------------------------

Creates a Sphere model. Inherits methods from [Model](Model).

### Extends

Model


Sphere Method: constructor {Sphere:constructor}
---------------------------------------------------------

The main constructor function for the Sphere class. Use this to create a new Sphere.

### Syntax:

	var model = new Sphere(options);

### Arguments:

1. options - (*object*) An object containing as properties:

### Options:

* nlat - (*number*, optional) The number of vertices for latitude. Default's 10.
* nlong - (*number*, optional) The number of vertices for longitude. Default's 10.
* radius - (*number*, optional) The radius of the sphere. Default's 1.

### Examples:

Create a white Sphere of radius 2.

{% highlight js %}
var whiteSphere = new Sphere({
  radius: 2,
  colors: [1, 1, 1, 1]
});
{% endhighlight %}


Class: IcoSphere {IcoSphere}
-----------------------------------------

Creates a Sphere model by subdividing an Icosahedron. Inherits methods from [Model](Model).

### Extends

Model


IcoSphere Method: constructor {IcoSphere:constructor}
---------------------------------------------------------------

The main constructor function for the IcoSphere class. Use this to create a new IcoSphere.

### Syntax:

	var model = new IcoSphere(options);

### Arguments:

1. options - (*object*) An object containing as properties:

### Options:

* iterations - (*number*, optional) The number of iterations used to subdivide the Icosahedron. Default's 0.

### Examples:

Create a white IcoSphere of radius 1.

{% highlight js %}
var whiteSphere = new IcoSphere({
  iterations: 1,
  colors: [1, 1, 1, 1]
});
{% endhighlight %}


Class: Plane {Plane}
----------------------------------

Creates a plane. Inherits methods from [Model](Model).

### Extends

Model


Plane Method: constructor {Plane:constructor}
---------------------------------------------------------

The main constructor function for the Plane class. Use this to create a new Plane.

### Syntax:

	var model = new Plane(options);

### Arguments:

1. options - (*object*) An object containing as properties:

### Options:

* type - (*string*) Whether is a XY, YZ or XZ plane. Possible values are `x,y`, `x,z`, `y,z`.
* xlen - (*number*) The length along the x-axis. Only used in `x,z` or `x,y` planes.
* ylen - (*number*) The length along the y-axis. Only used in `y,z` or `x,y` planes.
* zlen - (*number*) The length along the z-axis. Only used in `x,z` or `y,z` planes.
* nx - (*number*) The number of subdivisions along the x-axis. Only used in `x,z` or `x,y` planes.
* ny - (*number*) The number of subdivisions along the y-axis. Only used in `y,z` or `x,y` planes.
* nz - (*number*) The number of subdivisions along the z-axis. Only used in `x,z` or `y,z` planes.
* offset - (*number*) For XZ planes, the offset along the y-axis. For XY planes, the offset along the z-axis. For YZ planes, the offset along the x-axis.

### Examples:

Create a white XZ plane.

{% highlight js %}
var whitePlane = new Plane({
  type: 'x,z',
  xlen: 10,
  zlen: 20,
  nx: 5,
  nz: 5,
  offset: 0,
  colors: [1, 1, 1, 1]
});
{% endhighlight %}



Class: Cylinder {Cylinder}
----------------------------------------

Creates a Cylinder model. Inherits methods from [Model](Model).

### Extends

Model


Cylinder Method: constructor {Cylinder:constructor}
-------------------------------------------------------------

The main constructor function for the Cylinder class. Use this to create a new Cylinder.

### Syntax:

	var model = new Cylinder(options);

### Arguments:

1. options - (*object*) An object containing as properties:

### Options:

* nradial - (*number*, optional) The number of vertices for the disk. Default's 10.
* nvertical - (*number*, optional) The number of vertices for the height. Default's 10.
* radius - (*number*) The radius of the cylinder.
* topCap - (*boolean*, optional) Whether to put the cap on the top of the cylinder. Default's false.
* bottomCap - (*boolean*, optional) Whether to put the cap on the bottom
  part of the cylinder. Default's false.

### Examples:

Create a white Cylinder of radius 2 and height 3.

{% highlight js %}
var whiteCylinder = new Cylinder({
  radius: 2,
  height: 3,
  colors: [1, 1, 1, 1]
});
{% endhighlight %}


Class: Cone {Cone}
---------------------------------

Creates a Cone model. Inherits methods from [Model](Model).

### Extends

Model


Cone Method: constructor {Cone:constructor}
-----------------------------------------------------

The main constructor function for the Cone class. Use this to create a new Cone.

### Syntax:

	var model = new Cone(options);

### Arguments:

1. options - (*object*) An object containing as properties:

### Options:

* nradial - (*number*, optional) The number of vertices used to create the disk for a given height. Default's 10.
* nvertical - (*number*, optional) The number of vertices for the height. Default's 10.
* radius - (*number*) The radius of the base of the cone.
* cap - (*boolean*, optional) Whether to put the cap on the base of the cone. Default's false.

### Examples:

Create a white Cone of base radius 2 and height 3.

{% highlight js %}
var whiteCone = new Cone({
  radius: 2,
  height: 3,
  cap: true,
  colors: [1, 1, 1, 1]
});
{% endhighlight %}
