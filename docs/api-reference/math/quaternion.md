# Quaternion

A class to handle Quaternions. More information on quternions can be
found [here](http://en.wikipedia.org/wiki/Quaternion). The quaternion
will be represented by an instance with `x`, `y`, `z`, `w` components
that make a quaternion like: `xi + yj + zk + w`.


Quat Static Method: fromVec3 {#Quat:fromVec3}
-----------------------------------------------

Create a new `Quat` instance from the `x`, `y`, `z` coordinates of a [Vec3](#Vec3) and a real component.

### Syntax:

    Quat.fromVec3(v[, r]);

### Arguments:

1. v - (*object*) A `Vec3` instance.
2. r - (*number*, optional) The real component. Default's `0`.

### Examples:

Create a Quaternion from a Vec3.

{% highlight js %}
  var v = new Vec3(1, 2, 3),
      q = Quat.fromVec3(v, 7); //Quat(1, 2, 3, 7)
{% endhighlight %}


Quat Static Method: fromMat4 {#Quat:fromMat4}
-----------------------------------------------

Create a new `Quat` instance from a [Mat4](#Mat4). The `Mat4` instance
must be an orthogonal matrix.

### Syntax:

    Quat.fromMat4(m);

### Arguments:

1. m - (*object*) A `Mat4` instance.

### Examples:

Create a Quaternion from a `Mat4`.

{% highlight js %}
  var m = new Mat4(),
      q = Quat.fromMat4(m); //Quat
{% endhighlight %}


Quat Static Method: fromXRotation {#Quat:fromXRotation}
--------------------------------------------------------

Create a new `Quat` instance from a rotation around the x-axis in
radians.

### Syntax:

    Quat.fromXRotation(angle);

### Arguments:

1. angle - (*number*) The angle in radians.

### Examples:

Create a Quaternion from an x-axis rotation.

{% highlight js %}
  var q = Quat.fromXRotation(Math.PI); //Quat(1, 0, 0, 0)
{% endhighlight %}


Quat Static Method: fromYRotation {#Quat:fromYRotation}
--------------------------------------------------------

Create a new `Quat` instance from a rotation around the y-axis in
radians.

### Syntax:

    Quat.fromYRotation(angle);

### Arguments:

1. angle - (*number*) The angle in radians.

### Examples:

Create a Quaternion from an y-axis rotation.

{% highlight js %}
  var q = Quat.fromYRotation(Math.PI); //Quat(0, 1, 0, 0)
{% endhighlight %}


Quat Static Method: fromZRotation {#Quat:fromZRotation}
--------------------------------------------------------

Create a new `Quat` instance from a rotation around the z-axis in
radians.

### Syntax:

    Quat.fromZRotation(angle);

### Arguments:

1. angle - (*number*) The angle in radians.

### Examples:

Create a Quaternion from an z-axis rotation.

{% highlight js %}
  var q = Quat.fromZRotation(Math.PI); //Quat(0, 0, 1, 0)
{% endhighlight %}


Quat Static Method: fromAxisRotation {#Quat:fromAxisRotation}
--------------------------------------------------------------

Create a new `Quat` instance from a rotation around an axis.

### Syntax:

    Quat.fromAxisRotation(v, angle);

### Arguments:

1. v - (*object*) A `Vec3`-like object (i.e an array of three components).
2. angle - (*number*) The angle in radians.

### Examples:

Create a Quaternion from an z-axis rotation.

{% highlight js %}
  var v = new Vec3(0, 0, 1),
      q = Quat.fromAxisRotation(v, Math.PI); //Quat(0, 0, 1, 0)
{% endhighlight %}


Quat Method: constructor {#Quat:constructor}
----------------------------------------------------

Creates a new `Quat` instance.

### Syntax:

	var q = new Quat(x, y, z, w);

### Arguments:

1. x - (*number*, optional) The x component. If not provided is 0.
2. y - (*number*, optional) The y component. If not provided is 0.
3. z - (*number*, optional) The z component. If not provided is 0.
4. w - (*number*, optional) The non-imaginary component. If not provided
   is 0.

### Examples:

Create a (0, 0, 0, 0) quaternion.

{% highlight js %}
  var q = new Quat();
{% endhighlight %}

Create a (1, 2, 3, 4) quaternion.

{% highlight js %}
  var q = new Quat(1, 2, 3, 4);
{% endhighlight %}


Quat Method: setQuat {#Quat:setQuat}
------------------------------------

Set `x`, `y`, `z`, `w` coordinates of one `Quat` into another `Quat`.

### Syntax:

	  q1.setQuat(q2);

    Quat.setQuat(q1, q2);

### Arguments:

1. q2 - (*object*) A `Quat` instance.

### Examples:

Create two quaternions and assign one quaternions components to the other one.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4),
      q2 = new Quat(4, 5, 6, 7);

  q1.setQuat(q2); //v1 now contains [ 4, 5, 6, 7 ]
{% endhighlight %}

Set an object's `x`, `y`, `z`, `w` components to another object.

{% highlight js %}
  var q1 = [],
      q2 = [ 4, 5, 6, 7 ];

  Quat.setQuat(q1, q2); //q1 now has [ 4, 5, 6, 7 ]
{% endhighlight %}


Quat Method: set {#Quat:set}
-------------------------------

Set `x`, `y`, `z`, `w` coordinates.

### Syntax:

	  q1.set(x, y, z, w);

    Quat.set(q1, x, y, z, w);

### Arguments:

1. x - (*number*) The x coordinate.
2. y - (*number*) The y coordinate.
3. z - (*number*) The z coordinate.
4. w - (*number*) The w coordinate.

### Examples:

Create two quaternions and assign one quaternions components to the other one.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4),
      q2 = new Quat(4, 5, 6, 7);

  q1.set(q2.x, q2.y, q2.z, q2.w); //q1 now contains [ 4, 5, 6, 7 ]
{% endhighlight %}

Set an object's `x`, `y`, `z`, `w` components to another object.

{% highlight js %}
  var q1 = [],
      q2 = [ 4, 5, 6, 7 ];

  Quat.set(q1, q2.x, q2.y, q2.z, q2.w); //q1 now has [ 4, 5, 6, 7 ]
{% endhighlight %}


Quat Method: add {#Quat:add}
-----------------------------

Adds the `x`, `y`, `z` components of two `Quat` objects. Creates a new `Quat` instance and does not modify the original objects.

### Syntax:

	  q1.add(q2);

    Quat.add(q1, q2);

### Arguments:

1. q2 - (*object*) A `Quat` instance.

### Examples:

Create two quaternions and add them.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4),
      q2 = new Quat(4, 5, 6, 7);

  q1.add(q2); //q1 and q2 are still the same but a new Quat(5, 7, 9, 11) was created.
{% endhighlight %}

Create two `x`, `y`, `z`, `w` objects and add them.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ],
      q2 = [ 4, 5, 6, 7 ];

  Quat.add(q1, q2); //q1 and q2 are still the same but a new Quat(5, 7, 9, 11) was created.
{% endhighlight %}


Quat Method: $add {#Quat:$add}
------------------------------------

Adds the `x`, `y`, `z`, `w` components of two `Quat` objects. Modifies the original object.

### Syntax:

	  q1.$add(q2);

    Quat.$add(q1, q2);

### Arguments:

1. q2 - (*object*) A `Quat` instance.

### Examples:

Create two quaternions and add them.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4),
      q2 = new Quat(4, 5, 6, 7);

  q1.$add(q2); //q1 is now Quat(5, 7, 9, 11).
{% endhighlight %}

Create two `x`, `y`, `z`, `w` objects and add them.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ],
      q2 = [ 4, 5, 6, 7 ];

  Quat.$add(q1, q2); //q1 is now [ 5, 7, 9, 11 ].
{% endhighlight %}


Quat Method: sub {#Quat:sub}
------------------------------------

Substracts the `x`, `y`, `z`, `w` components of two `Quat` objects. Creates a new `Quat` instance and does not modify the original objects.

### Syntax:

	  q1.sub(q2);

    Quat.sub(q1, q2);

### Arguments:

1. q2 - (*object*) A `Quat` instance.

### Examples:

Create two quaternions and substract them.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4),
      q2 = new Quat(4, 5, 6, 7);

  q1.sub(q2); //q1 and q2 are still the same but a new Quat(-3, -3, -3, -3) was created.
{% endhighlight %}

Create two `x`, `y`, `z`, `w` objects and substract them.

{% highlight js %}
  var q1 = {
        x: 1,
        y: 2,
        z: 3,
        w: 4
      },
      q2 = [ 4, 5, 6, 7 ];

  Quat.sub(q1, q2); //q1 and q2 are still the same but a new Quat(-3, -3, -3, -3) was created.
{% endhighlight %}


Quat Method: $sub {#Quat:$sub}
------------------------------------

Substracts the `x`, `y`, `z`, `w` components of two `Quat` objects. Modifies the original object.

### Syntax:

	  q1.$sub(q2);

    Quat.$sub(q1, q2);

### Arguments:

1. q2 - (*object*) A `Quat` instance.

### Examples:

Create two quaternions and substract them.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4),
      q2 = new Quat(4, 5, 6, 7);

  q1.$sub(q2); //q1 is now Quat(-3, -3, -3, -3).
{% endhighlight %}

Create two `x`, `y`, `z`, `w` objects and add them.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ],
      q2 = [ 4, 5, 6, 7 ];

  Quat.$sub(q1, q2); //q1 is now [ -3, -3, -3, -3 ].
{% endhighlight %}


Quat Method: mulQuat {#Quat:mulQuat}
-------------------------------------

Multiplies two quaternions returning a new `Quat` instance with the result.
The original object is not modified.

### Syntax:

	  q1.mulQuat(q2);

    Quat.mulQuat(q1, q2);

### Arguments:

1. q2 - (*object*) A `Quat` instance.

### Examples:

Create two Quaternions and multiply them.

{% highlight js %}
  var q1 = new Quat(1, 0, 0, 0),
      q2 = new Quat(1, 0, 0, 0);

  q1.mulQuat(q2); //q1 is unchanged but a new Quat(-1, 0, 0, 0) is created.
{% endhighlight %}


Quat Method: $mulQuat {#Quat:$mulQuat}
---------------------------------------

Multiplies two quaternions returning and modifies the receiver with the result.

### Syntax:

	  q1.$mulQuat(q2);

    Quat.$mulQuat(q1, q2);

### Arguments:

1. q2 - (*object*) A `Quat` instance.

### Examples:

Create two Quaternions and multiply them.

{% highlight js %}
  var q1 = new Quat(1, 0, 0, 0),
      q2 = new Quat(1, 0, 0, 0);

  q1.$mulQuat(q2); //q1 is now Quat(-1, 0, 0, 0).
{% endhighlight %}


Quat Method: divQuat {#Quat:divQuat}
-------------------------------------

Divides two quaternions returning a new `Quat` instance with the result.
The original object is not modified.

### Syntax:

	  q1.divQuat(q2);

    Quat.divQuat(q1, q2);

### Arguments:

1. q2 - (*object*) A `Quat` instance.

### Examples:

Create two Quaternions and divide them.

{% highlight js %}
  var q1 = new Quat(1, 0, 0, 0),
      q2 = new Quat(1, 0, 0, 0);

  q1.divQuat(q2); //q1 is unchanged but a new Quat(1, 0, 0, 0) is created.
{% endhighlight %}


Quat Method: $divQuat {#Quat:$divQuat}
---------------------------------------

Divides two quaternions returning and modifies the receiver with the result.

### Syntax:

	  q1.$divQuat(q2);

    Quat.$divQuat(q1, q2);

### Arguments:

1. q2 - (*object*) A `Quat` instance.

### Examples:

Create two Quaternions and divide them.

{% highlight js %}
  var q1 = new Quat(1, 0, 0, 0),
      q2 = new Quat(1, 0, 0, 0);

  q1.$divQuat(q2); //q1 is now Quat(1, 0, 0, 0).
{% endhighlight %}


Quat Method: scale {#Quat:scale}
------------------------------------

Scales the Quat quaternion by a real number. Creates a new Quat with the scaled components.

### Syntax:

	  q1.scale(s);

    Quat.scale(q1, s);

### Arguments:

1. s - (*number*) A real number to scale the Quat.

### Examples:

Create a quaternion and scale it by 2.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4);

  q1.scale(2); //q1 is unchanged but a new Quat(2, 4, 6, 8) is created.
{% endhighlight %}

Create an `x`, `y`, `z`, `w` object and scale it by 2.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ];

  Quat.scale(q1, 2); //q1 is still the same but a new Quat(2, 4, 6, 8) was created.
{% endhighlight %}


Quat Method: $scale {#Quat:$scale}
------------------------------------

Scales the Quat quaternion by a real number. Changes the original object.

### Syntax:

	  q1.$scale(s);

    Quat.$scale(q1, s);

### Arguments:

1. s - (*number*) A real number to scale the Quat.

### Examples:

Create a quaternion and scale it by 2.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4);

  q1.$scale(2); //q1 is now Quat(2, 4, 6, 8).
{% endhighlight %}

Create an `x`, `y`, `z`, `w` object and scale it by 2.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ];

  Quat.$scale(q1, 2); //q1 is now [ 2, 4, 6, 8 ].
{% endhighlight %}


Quat Method: conjugate {#Quat:conjugate}
-----------------------------------------

Conjugates a `Quat`. Returns a new instance.

### Syntax:

	  q1.conjugate();

    Quat.conjugate(q1);

### Examples:

Create a quaternion and conjugate it.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4);

  q1.conjugate(); //q1 is unchanged but a new Quat(-1, -2, -3, 4) is created.
{% endhighlight %}

Create an `x`, `y`, `z`, `w` object and conjugate it.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ];

  Quat.conjugate(q1); //q1 is still the same but a new Quat(-1, -2, -3, 4).
{% endhighlight %}


Quat Method: $conjugate {#Quat:$conjugate}
-------------------------------------------

conjugates a `Quat`. Changes the original object.

### Syntax:

	  q1.$conjugate();

    Quat.$conjugate(q1);

### Examples:

Create a quaternion and conjugate it.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4);

  q1.$conjugate(); //q1 is now Quat(-1, -2, -3, 4).
{% endhighlight %}

Create an `x`, `y`, `z`, `w` object and conjugate it.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ];

  Quat.conjugate(q1); //q1 is now [ -1, -2, -3, 4 ].
{% endhighlight %}


Quat Method: neg {#Quat:neg}
------------------------------------

Negates a `Quat`. Returns a new instance.

### Syntax:

	  q1.neg();

    Quat.neg(q1);

### Examples:

Create a quaternion and negate it.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4);

  q1.neg(); //q1 is unchanged but a new Quat(-1, -2, -3, -4) is created.
{% endhighlight %}

Create an `x`, `y`, `z`, `w` object and negate it.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ];

  Quat.neg(q1); //q1 is still the same but a new Quat(-1, -2, -3, -4).
{% endhighlight %}


Quat Method: $neg {#Quat:$neg}
------------------------------------

Negates a `Quat`. Changes the original object.

### Syntax:

	  q1.$neg();

    Quat.$neg(q1);

### Examples:

Create a quaternion and negate it.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4);

  q1.$neg(); //q1 is now Quat(-1, -2, -3, -4).
{% endhighlight %}

Create an `x`, `y`, `z`, `w` object and negate it.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ];

  Quat.neg(q1); //q1 is now [ -1, -2, -3, -4 ].
{% endhighlight %}


Quat Method: unit {#Quat:unit}
------------------------------------

Creates a unit quaternion from the coordinates of `Quat`. The original
object is not modified.

### Syntax:

	  q1.unit();

    Quat.unit(q1);

### Examples:

Create a quaternion and make a unit quaternion from it.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4);

  q1.unit(); //q1 is unchanged but a new unit quaternion Quat is created.
{% endhighlight %}

Create an `x`, `y`, `z`, `w` object and make a unit quaternion from it.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ];

  Quat.unit(q1); //q1 is still the same but a new Quat that is a unit quaternion is created.
{% endhighlight %}


Quat Method: $unit {#Quat:$unit}
------------------------------------

Creates a unit quaternion from the `Quat` coordinates. Changes the original object.

### Syntax:

	  q1.$unit();

    Quat.$unit(q1);

### Examples:

Create a quaternion and make a unit quaternion from it.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4);

  q1.$unit(); //q1 is now a unit quaternion.
{% endhighlight %}

Create an `x`, `y`, `z`, `w` object and make a unit quaternion from it.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ];

  Quat.$unit(q1); //q1 is now a unit quaternion vector.
{% endhighlight %}


Quat Method: norm {#Quat:norm}
------------------------------------

Calculates the norm of `Quat`.

### Syntax:

	  q1.norm();

    Quat.norm(q1);

### Examples:

Create a quaternion and calculate its norm.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4);

  vi.norm(); //returns the real valued norm.
{% endhighlight %}

Create an `x`, `y`, `z`, `w` object and calculate its norm.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ];

  //A real number with the norm is returned.
  var ans = Quat.norm(q1);
{% endhighlight %}


Quat Method: normSq {#Quat:normSq}
------------------------------------

Calculates the squared norm of `Quat`.

### Syntax:

	  q1.normSq();

    Quat.normSq(q1);

### Examples:

Create a quaternion and calculate its squared norm.

{% highlight js %}
  var q1 = new Quat(1, 2, 3, 4);

  vi.normSq(); //returns the real valued norm.
{% endhighlight %}

Create an `x`, `y`, `z`, `w` object and calculate its squared norm.

{% highlight js %}
  var q1 = [ 1, 2, 3, 4 ];

  //A real number with the squared norm is returned.
  var ans = Quat.normSq(q1);
{% endhighlight %}


Quat Method: clone {#Quat:clone}
------------------------------------

Clones a quaternion.

### Syntax:

	  q1.clone();

    Quat.clone(q1);
