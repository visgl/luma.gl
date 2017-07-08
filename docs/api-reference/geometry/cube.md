

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

  var model = new Sphere(gl, options);

### Arguments:

1. options - (*object*) An object containing as properties:

### Options:

* nlat - (*number*, optional) The number of vertices for latitude. Default's 10.
* nlong - (*number*, optional) The number of vertices for longitude. Default's 10.
* radius - (*number*, optional) The radius of the sphere. Default's 1.

### Examples:

Create a white Sphere of radius 2.

{% highlight js %}
var whiteSphere = new Sphere(gl, {
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

  var model = new IcoSphere(gl, options);

### Arguments:

1. options - (*object*) An object containing as properties:

### Options:

* iterations - (*number*, optional) The number of iterations used to subdivide the Icosahedron. Default's 0.

### Examples:

Create a white IcoSphere of radius 1.

{% highlight js %}
var whiteSphere = new IcoSphere(gl, {
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

  var model = new Plane(gl, options);

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
var whitePlane = new Plane(gl, {
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

  var model = new Cylinder(gl, options);

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
var whiteCylinder = new Cylinder(gl, {
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

  var model = new Cone(gl, options);

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
var whiteCone = new Cone(gl, {
  radius: 2,
  height: 3,
  cap: true,
  colors: [1, 1, 1, 1]
});
{% endhighlight %}
