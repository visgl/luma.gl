# Matrix4

A class to handle four by four matrices.


Mat4 Static Method: fromQuat {#Mat4:fromQuat}
-----------------------------------------------

Create a new `Mat4` instance from a [Quat](#Quat) instance. The
Quaternion must be a unit quaternion.

### Syntax:

    Mat4.fromQuat(q);

### Arguments:

1. q - (*object*) A `Quat` instance.

### Examples:

Create a matrix from a Quaternion.

{% highlight js %}
  var q = new Quat(1, 2, 3, 4).$unit(),
      m = Mat4.fromQuat(q); //a new Mat4 instance
{% endhighlight %}


Mat4 Method: constructor {#Mat4:constructor}
----------------------------------------------

Creates a new `Mat4` instance. If no arguments are set then an Identity matrix is created.

### Syntax:

  var m = new Mat4();

    var m = new Mat4(n11, n12, n13, n14,
                     n21, n22, n23, n24,
                     n31, n32, n33, n34,
                     n41, n42, n43, n44);

### Arguments:

1. n - (*number*) The matrix component.

### Examples:

Create an identity matrix.

{% highlight js %}
  var m = new Mat4();
{% endhighlight %}

Create a null matrix.

{% highlight js %}
  var m = new Mat4( 0, 0, 0, 0,
                    0, 0, 0, 0,
                    0, 0, 0, 0,
                    0, 0, 0, 0 );
{% endhighlight %}


Mat4 Method: id {#Mat4:id}
---------------------------

Modifies the matrix to be an Identity matrix.

### Syntax:

  m.id();

    Mat4.id(m);

### Examples:

Create an identity matrix from some random matrix.

{% highlight js %}
  var m = new Mat4( 1, 2, 3, 4,
                    1, 2, 3, 4,
                    1, 2, 3, 4,
                    1, 2, 3, 4 );

  m.id(); //m is now the Identity matrix.
{% endhighlight %}

Create an identity matrix object.

{% highlight js %}
  var m = [];

  Mat4.id(m); //m object components are the Identity matrix ones.
{% endhighlight %}


Mat4 Method: set {#Mat4:set}
-------------------------------

Set all matrix coordinates.

### Syntax:

  m.set(n11, n12, n13, n14,
          n21, n22, n23, n24,
          n31, n32, n33, n34,
          n41, n42, n43, n44);

    Mat4.set(m, n11, n12, n13, n14,
                        n21, n22, n23, n24,
                        n31, n32, n33, n34,
                        n41, n42, n43, n44);

### Arguments:

1. n - (*number*) The n matrix coordinates.

### Examples:

Create a matrix and set some values to it.

{% highlight js %}
  var m = new Mat4();

  m.set(1, 2, 3, 4,
        1, 2, 3, 4,
        1, 2, 3, 4,
        1, 2, 3, 4);
{% endhighlight %}

Set an empty object matrix coordinates onto some values.

{% highlight js %}
  var m = [];

  Mat4.set(m, 1, 2, 3, 4,
                      1, 2, 3, 4,
                      1, 2, 3, 4,
                      1, 2, 3, 4);

{% endhighlight %}


Mat4 Method: mulVec3 {#Mat4:mulVec3}
-------------------------------------

Multiplies a `Mat4` by a `Vec3`. Returns a new `Vec3` without modifying the passed in object.

### Syntax:

  m.mulVec3(v);

    Mat4.mulVec3(m, v);

### Arguments:

1. v - (*object*) A `Vec3` instance.

### Examples:

Create a matrix and a vector and multiply them.

{% highlight js %}
  var m = new Mat4(),
      v = new Vec3(1, 1, 1);

  m.mulVec3(v);
{% endhighlight %}

Create a matrix object and a vector object and multiply them.

{% highlight js %}
  var m = [],
      v = [];

  Mat4.id(m);
  Vec3.set(v, 1, 1, 1);

  Mat4.mulVec3(m, v);
{% endhighlight %}


Mat4 Method: $mulVec3 {#Mat4:$mulVec3}
-------------------------------------

Multiplies a `Mat4` by a `Vec3`. Modifies the receiver.

### Syntax:

  m.$mulVec3(v);

    Mat4.$mulVec3(m, v);

### Arguments:

1. v - (*object*) A `Vec3` instance.

### Examples:

Create a matrix and a vector and multiply them.

{% highlight js %}
  var m = new Mat4(),
      v = new Vec3(1, 1, 1);

  m.$mulVec3(v);
{% endhighlight %}

Create a matrix object and a vector object and multiply them.

{% highlight js %}
  var m = [],
      v = [];

  Mat4.id(m);
  Vec3.set(v, 1, 1, 1);

  Mat4.$mulVec3(m, v);
{% endhighlight %}


Mat4 Method: mulMat4 {#Mat4:mulMat4}
-------------------------------------

Multiplies two `Mat4`. Creates a new `Mat4` with the result and does not modify the original instances.

### Syntax:

  m.mulMat4(m1);

    Mat4.mulMat4(m, m1);

### Arguments:

1. m1 - (*object*) A `Mat4` instance.

### Examples:

Create two matrices and multiply them.

{% highlight js %}
  var m = new Mat4(),
      m1 = new Mat4();

  m.mulMat4(m1); //the result is a new Identity matrix
{% endhighlight %}

Create a two matrices objects and multiply them.

{% highlight js %}
  var m = [],
      m1 = [];

  Mat4.id(m);
  Mat4.id(m1);
  Mat4.mulMat4(m, m1);
{% endhighlight %}


Mat4 Method: $mulMat4 {#Mat4:$mulMat4}
-------------------------------------

Multiplies two `Mat4`, storing the result in the receiver.

### Syntax:

  m.$mulMat4(m1);

    Mat4.$mulMat4(m, m1);

### Arguments:

1. m1 - (*object*) A `Mat4` instance.

### Examples:

Create two matrices and multiply them.

{% highlight js %}
  var m = new Mat4(),
      m1 = new Mat4();

  m.$mulMat4(m1); //the result is stored in m.
{% endhighlight %}

Create a two matrices objects and multiply them.

{% highlight js %}
  var m = [],
      m1 = [];

  Mat4.id(m);
  Mat4.id(m1);
  Mat4.$mulMat4(m, m1);
{% endhighlight %}


Mat4 Method: mulMat42 {#Mat4:mulMat42}
-------------------------------------

Multiplies two `Mat4`, storing the result in the receiver.

### Syntax:

  m.mulMat42(m1, m2);

    Mat4.mulMat42(m, m1, m2);

### Arguments:

1. m1 - (*object*) A `Mat4` instance.
2. m2 - (*object*) A `Mat4` instance.

### Examples:

Create two matrices and multiply them.

{% highlight js %}
  var m = new Mat4(),
      m1 = new Mat4(),
      m2 = new Mat4();

  m.mulMat42(m1, m2); //the result is stored in m.
{% endhighlight %}

Create a two matrices objects and multiply them.

{% highlight js %}
  var m = [],
      m1 = [],
      m2 = [];

  Mat4.id(m1);
  Mat4.id(m2);
  Mat4.mulMat42(m, m1, m2);
{% endhighlight %}


Mat4 Method: add {#Mat4:add}
-------------------------------------

Adds two `Mat4`. Creates a new `Mat4` with the result and does not modify the original instances.

### Syntax:

  m.add(m1);

    Mat4.add(m, m1);

### Arguments:

1. m1 - (*object*) A `Mat4` instance.

### Examples:

Create two matrices and add them.

{% highlight js %}
  var m = new Mat4(),
      m1 = new Mat4();

  m.add(m1); //the result is a new matrix
{% endhighlight %}

Create a two matrices objects and add them.

{% highlight js %}
  var m = [],
      m1 = [];

  Mat4.id(m);
  Mat4.id(m1);
  Mat4.add(m, m1);
{% endhighlight %}


Mat4 Method: $add {#Mat4:$add}
-------------------------------------

Adds two `Mat4`, storing the result in the receiver.

### Syntax:

  m.$add(m1);

    Mat4.$add(m, m1);

### Arguments:

1. m1 - (*object*) A `Mat4` instance.

### Examples:

Create two matrices and add them.

{% highlight js %}
  var m = new Mat4(),
      m1 = new Mat4();

  m.$add(m1); //the result is stored in m.
{% endhighlight %}

Create a two matrices objects and add them.

{% highlight js %}
  var m = [],
      m1 = [];

  Mat4.id(m);
  Mat4.id(m1);
  Mat4.$add(m, m1);
{% endhighlight %}


Mat4 Method: transpose {#Mat4:transpose}
-------------------------------------

Transposes a `Mat4` matrix. More info about this operation can be found [here](http://en.wikipedia.org/wiki/Matrix_transpose).
Creates a new `Mat4` with the result.

### Syntax:

  m.transpose();

    Mat4.transpose(m);

### Examples:

Create a `Mat4` matrix and transpose it.

{% highlight js %}
  var m = new Mat4();

  m.transpose(); //the result is a new Identity matrix
{% endhighlight %}


Mat4 Method: $transpose {#Mat4:$transpose}
-------------------------------------

Transposes a `Mat4` matrix. More info about this operation can be found [here](http://en.wikipedia.org/wiki/Matrix_transpose).
Modifies the current matrix.

### Syntax:

  m.$transpose();

    Mat4.$transpose(m);

### Examples:

Create a `Mat4` matrix and transpose it.

{% highlight js %}
  var m = new Mat4();

  m.$transpose(); //the result is stored in m
{% endhighlight %}


Mat4 Method: rotateAxis {#Mat4:rotateAxis}
-------------------------------------------

Applies a rotation of `theta` by `vec` to a `Mat4` matrix returning the result in a new matrix.

### Syntax:

  m.rotateAxis(theta, vec);

    Mat4.rotateAxis(m, theta, vec);

### Arguments:

1. theta - (*number*) An angle in radians.
2. vec - (*object*) A `Vec3` (or array).

### Examples:

Create a rotation by `theta` and `v`.

{% highlight js %}
  var m = new Mat4(),
      v = new Vec3(1, 1, 1);

  m.rotateAxis(Math.PI, v); //the result is a new matrix
{% endhighlight %}

Another way of doing the same thing without creating a `Vec3`.

{% highlight js %}
  var m = new Mat4(),
      v = [ 1, 1, 1 ];

  m.rotateAxis(Math.PI, v); //the result is a new matrix
{% endhighlight %}


Mat4 Method: $rotateAxis {#Mat4:$rotateAxis}
-------------------------------------------

Applies a rotation of angle `theta` by vector `vec` to a `Mat4` altering the current matrix.

### Syntax:

  m.$rotateAxis(theta, vec);

    Mat4.$rotateAxis(m, theta, vec);

### Arguments:

1. theta - (*number*) An angle in radians.
2. vec - (*object*) A `Vec3` (or array).

### Examples:

Create a rotation by `theta` and `v`.

{% highlight js %}
  var m = new Mat4(),
      v = new Vec3(1, 1, 1);

  m.$rotateAxis(Math.PI, v); //the result is in m
{% endhighlight %}

Another way of doing the same thing without creating a `Vec3`.

{% highlight js %}
  var m = new Mat4(),
      v = [ 1, 1, 1 ];

  m.$rotateAxis(Math.PI, v); //the result is in m
{% endhighlight %}


Mat4 Method: rotateXYZ {#Mat4:rotateXYZ}
-------------------------------------------

Applies a rotation of angle `rx` in the x-axis, `ry` in the y-axis and `rz` in the z-axis.
Creates a new `Mat4` with the result.

### Syntax:

  m.rotateXYZ(rx, ry, rz);

    Mat4.rotateXYZ(m, rx, ry, rz);

### Arguments:

1. rx - (*number*) An angle in radians.
2. ry - (*number*) An angle in radians.
3. rz - (*number*) An angle in radians.

### Examples:

Create a rotation on the x-axis.

{% highlight js %}
  var m = new Mat4();

  m.rotateXYZ(Math.PI, 0, 0); //the result is a new matrix
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = [];

  Mat4.id(m);
  Mat4.rotateXYZ(m, Math.PI, 0, 0); //creates a new Mat4 with the result.
{% endhighlight %}


Mat4 Method: $rotateXYZ {#Mat4:$rotateXYZ}
-------------------------------------------

Applies a rotation of angle `rx` in the x-axis, `ry` in the y-axis and `rz` in the z-axis.
Alters the matrix.

### Syntax:

  m.$rotateXYZ(rx, ry, rz);

    Mat4.$rotateXYZ(m, rx, ry, rz);

### Arguments:

1. rx - (*number*) An angle in radians.
2. ry - (*number*) An angle in radians.
3. rz - (*number*) An angle in radians.

### Examples:

Create a rotation on the x-axis.

{% highlight js %}
  var m = new Mat4();

  m.$rotateXYZ(Math.PI, 0, 0); //alters m
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = [];

  Mat4.id(m);
  Mat4.$rotateXYZ(m, Math.PI, 0, 0); //alters m
{% endhighlight %}


Mat4 Method: translate {#Mat4:translate}
-------------------------------------------

Applies a translation to `Mat4` in the directions `x`, `y` and `z`.
Stores the result in a new `Mat4` instance.

### Syntax:

  m.translate(x, y, z);

    Mat4.translate(m, x, y, z);

### Arguments:

1. x - (*number*) The amount to be translated in the x direction.
2. y - (*number*) The amount to be translated in the y direction.
3. z - (*number*) The amount to be translated in the z direction..

### Examples:

Create a translation on the x-axis.

{% highlight js %}
  var m = new Mat4();

  m.translate(10, 0, 0); //the result is a new matrix
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = [];

  Mat4.id(m);
  Mat4.translate(m, 10, 0, 0); //creates a new Mat4 with the result.
{% endhighlight %}


Mat4 Method: $translate {#Mat4:$translate}
-------------------------------------------

Applies a translation to `Mat4` in the directions `x`, `y` and `z`.
Alters the original matrix.

### Syntax:

  m.$translate(x, y, z);

    Mat4.$translate(m, x, y, z);

### Arguments:

1. x - (*number*) The amount to be translated in the x direction.
2. y - (*number*) The amount to be translated in the y direction.
3. z - (*number*) The amount to be translated in the z direction..

### Examples:

Create a translation on the x-axis.

{% highlight js %}
  var m = new Mat4();

  m.$translate(10, 0, 0); //the result is in m
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = [];

  Mat4.id(m);
  Mat4.$translate(m, 10, 0, 0); //the result is in m
{% endhighlight %}


Mat4 Method: scale {#Mat4:scale}
-------------------------------------------

Applies scaling to `Mat4` in the directions `x`, `y` and `z`.
Stores the result in a new `Mat4` instance.

### Syntax:

  m.scale(x, y, z);

    Mat4.scale(m, x, y, z);

### Arguments:

1. x - (*number*) The amount to be scaled in the x direction.
2. y - (*number*) The amount to be scaled in the y direction.
3. z - (*number*) The amount to be scaled in the z direction..

### Examples:

Create a scaling on the x-axis.

{% highlight js %}
  var m = new Mat4();

  m.scale(10, 0, 0); //the result is a new matrix
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = [];

  Mat4.id(m);
  Mat4.scale(m, 10, 0, 0); //creates a new Mat4 with the result.
{% endhighlight %}


Mat4 Method: $scale {#Mat4:$scale}
-------------------------------------------

Applies scaling to `Mat4` in the directions `x`, `y` and `z`.
Alters the original matrix.

### Syntax:

  m.$scale(x, y, z);

    Mat4.$scale(m, x, y, z);

### Arguments:

1. x - (*number*) The amount to be scaled in the x direction.
2. y - (*number*) The amount to be scaled in the y direction.
3. z - (*number*) The amount to be scaled in the z direction..

### Examples:

Create a scaling on the x-axis.

{% highlight js %}
  var m = new Mat4();

  m.$scale(10, 0, 0); //the result is in m
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = [];

  Mat4.id(m);
  Mat4.$scale(m, 10, 0, 0); //the result is in m
{% endhighlight %}


Mat4 Method: invert {#Mat4:invert}
-------------------------------------

Inverts a `Mat4` matrix. The matrix has to be invertible.
Creates a new `Mat4` with the result.

### Syntax:

  m.invert();

    Mat4.invert(m);

### Examples:

Create a `Mat4` matrix and invert it.

{% highlight js %}
  var m = new Mat4();

  m.invert(); //the result is a new matrix
{% endhighlight %}


Mat4 Method: $invert {#Mat4:$invert}
-------------------------------------

Inverts a `Mat4` matrix. The matrix has to be invertible.
Modifies the current matrix.

### Syntax:

  m.$invert();

    Mat4.$invert(m);

### Examples:

Create a `Mat4` matrix and invert it.

{% highlight js %}
  var m = new Mat4();

  m.$invert(); //the result is stored in m
{% endhighlight %}


Mat4 Method: lookAt {#Mat4:lookAt}
-----------------------------------

Performs a `lookAt` operation on a matrix. Modifies the current matrix.
Ths method is useful when setting a camera matrix class.
For more information about the `lookAt` operation look [here](http://www.euclideanspace.com/maths/algebra/vectors/lookat/index.htm).

### Syntax:

  m.lookAt(eye, center, up);

    Mat4.lookAt(m, eye, center, up);

### Arguments:

1. eye - (*object*) The eye position as a `Vec3` (or x,y,z object).
2. center - (*number*) The center position as a `Vec3` (or x,y,z object).
3. up - (*number*) The up vector of the "camera" as a `Vec3` (or x,y,z object).

### Examples:

Create a lookAt matrix. The eye is looking at the origin.

{% highlight js %}
  var m = new Mat4(),
      eye = [ 1, 0, 1 ],
      center = [ 0, 0, 0 ],
      up = [ 0, 1, 0 ];

  m.lookAt(eye, center, up); //the original matrix is modified.
{% endhighlight %}

Another way of doing it with generics:

{% highlight js %}
  var m = [],
      eye = [ 1, 0, 1 ],
      center = [ 0, 0, 0 ],
      up = [ 0, 1, 0 ];

  Mat4.lookAt(m, eye, center, up); //the original object is modified.
{% endhighlight %}


Mat4 Method: frustum {#Mat4:frustum}
-------------------------------------

Performs a `frustum` operation on a matrix. Modifies the current matrix.
This method is useful when setting a camera projection matrix class.
For more information about the `frustum` geometry look [here](http://en.wikipedia.org/wiki/Frustum).

### Syntax:

    m.frustum(left, right, bottom, top, near, far);

    Mat4.frustum(m, left, right, bottom, top, near, far);

### Arguments:

1. left - (*number*) The left part of the frustum.
2. right - (*number*) The right part of the frustum.
3. bottom - (*number*) The bottom part of the frustum.
4. top - (*number*) The top part of the frustum.
5. near - (*number*) The nearest part of the frustum.
6. far - (*number*) The furthest part of the frustum.


Mat4 Method: ortho {#Mat4:ortho}
-------------------------------------

Creates an orthographic projection. Modifies the current matrix.
For more information about the `orthographic projection` geometry look [here](http://en.wikipedia.org/wiki/Orthographic_projection).

### Syntax:

    m.ortho(left, right, bottom, top, near, far);

    Mat4.ortho(m, left, right, bottom, top, near, far);

### Arguments:

1. left - (*number*) The left part of the orthographic projection.
2. right - (*number*) The right part of the orthographic projection.
3. bottom - (*number*) The bottom part of the orthographic projection.
4. top - (*number*) The top part of the orthographic projection.
5. near - (*number*) The nearest part of the orthographic projection.
6. far - (*number*) The furthest part of the orthographic projection.


Mat4 Method: perspective {#Mat4:perspective}
---------------------------------------------

Creates a perspective matrix. This operation is based on creating a frustum matrix. Modifies the current matrix.
This method is useful when setting a camera projection matrix class.

### Syntax:

  m.perspective(fov, aspect, near, far);

    Mat4.perspective(m, fov, aspect, near, far);

### Arguments:

1. fov - (*number*) The field of view. An angle in degrees.
2. aspect - (*number*) The aspect ratio. Generally `canvas.width / canvas.height`.
3. near - (*number*) The nearest part to be captured by the camera.
4. far - (*number*) The furthest part to be captured by the camera.


Mat4 Method: toFloat32Array {#Mat4:toFloat32Array}
---------------------------------------------------

Converts the matrix in a [Float32Array](https://developer.mozilla.org/en/JavaScript_typed_arrays/Float32Array). Useful when setting matrix uniforms.

### Syntax:

  m.toFloat32Array();


Mat4 Method: clone {#Mat4:clone}
------------------------------------

Clones a matrix.

### Syntax:

  m.clone();

    Mat4.clone(m);
