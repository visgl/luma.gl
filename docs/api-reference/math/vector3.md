# Vector3

A class to handle three dimensional vectors.


Vec3 Static Method: fromQuat {#Vec3:fromQuat}
-----------------------------------------------

Create a new `Vec3` instance from the `x`, `y`, `z` coordinates of a [Quat](#Quat).

### Syntax:

    Vec3.fromQuat(q);

### Arguments:

1. q - (*object*) A `Quat` instance.

### Examples:

Create a vector from a Quaternion.

{% highlight js %}
  var q = new Quat(1, 2, 3, 4),
      v = Vec3.fromQuat(q); //Vec3(1, 2, 3)
{% endhighlight %}


Vec3 Method: constructor {#Vec3:constructor}
----------------------------------------------------

Creates a new `Vec3` instance.

### Syntax:

	var v = new Vec3(x, y, z);

### Arguments:

1. x - (*number*, optional) The x component. If not provided is 0.
2. y - (*number*, optional) The y component. If not provided is 0.
3. z - (*number*, optional) The z component. If not provided is 0.

### Examples:

Create a (0, 0, 0) vector.

{% highlight js %}
  var v = new Vec3();
{% endhighlight %}

Create a (1, 2, 3) vector.

{% highlight js %}
  var v = new Vec3(1, 2, 3);
{% endhighlight %}


Vec3 Method: setVec3 {#Vec3:setVec3}
------------------------------------

Set `x`, `y`, `z` coordinates of one `Vec3` into another `Vec3`.

### Syntax:

	v1.setVec3(v2);

    Vec3.setVec3(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and assign one vectors components to the other one.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3),
      v2 = new Vec3(4, 5, 6);

  v1.setVec3(v2); //v1 now contains (x=4, y=5, z=6)
{% endhighlight %}

Set an object's `x`, `y`, `z` components to another object.

{% highlight js %}
  var v1 = [],
      v2 = [ 4, 5, 6 ];

  Vec3.setVec3(v1, v2); //v1 now has [4, 5, 6]
{% endhighlight %}


Vec3 Method: set {#Vec3:set}
-------------------------------

Set `x`, `y`, `z` coordinates.

### Syntax:

	v1.set(x, y, z);

    Vec3.set(v1, x, y, z);

### Arguments:

1. x - (*number*) The x coordinate.
2. y - (*number*) The y coordinate.
3. z - (*number*) The z coordinate.

### Examples:

Create two vectors and assign one vectors components to the other one.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3),
      v2 = new Vec3(4, 5, 6);

  v1.set(v2.x, v2.y, v2.z); //v1 now contains (x=4, y=5, z=6)
{% endhighlight %}

Set an object's `x`, `y`, `z` components to another object.

{% highlight js %}
  var v1 = [],
      v2 = [ 4, 5, 6 ];

  Vec3.set(v1, v2.x, v2.y, v2.z); //v1 now has [4, 5, 6]
{% endhighlight %}

Vec3 Method: add {#Vec3:add}
-----------------------------

Adds the `x`, `y`, `z` components of two `Vec3` objects. Creates a new `Vec3` instance and does not modify the original objects.

### Syntax:

	v1.add(v2);

    Vec3.add(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and add them.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3),
      v2 = new Vec3(4, 5, 6);

  v1.add(v2); //v1 and v2 are still the same but a new Vec3(5, 7, 9) was created.
{% endhighlight %}

Create two `x`, `y`, `z` objects and add them.

{% highlight js %}
  var v1 = [ 1, 2, 3 ],
      v2 = [ 4, 5, 6 ];

  Vec3.add(v1, v2); //v1 and v2 are still the same but a new Vec3(5, 7, 9) was created.
{% endhighlight %}


Vec3 Method: $add {#Vec3:$add}
------------------------------------

Adds the `x`, `y`, `z` components of two `Vec3` objects. Modifies the original object.

### Syntax:

	v1.$add(v2);

    Vec3.$add(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and add them.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3),
      v2 = new Vec3(4, 5, 6);

  v1.$add(v2); //v1 is now Vec3(5, 7, 9).
{% endhighlight %}

Create two `x`, `y`, `z` objects and add them.

{% highlight js %}
  var v1 = [ 1, 2, 3 ],
      v2 = [ 4, 5, 6 ];

  Vec3.$add(v1, v2); //v1 is now [ 5, 7, 9 ].
{% endhighlight %}


Vec3 Method: add2 {#Vec3:add2}
------------------------------------

Adds the `x`, `y`, `z` components of two `Vec3` objects and stores the result in the receiver.

### Syntax:

	v1.add2(v2, v3);

    Vec3.add2(v1, v2, v3);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.
2. v3 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and add them.

{% highlight js %}
  var v1 = new Vec3(),
      v2 = new Vec3(1, 2, 3),
      v3 = new Vec3(4, 5, 6);

  v1.add2(v2, v3); //v1 is now Vec3(5, 7, 9), v2 and v3 are unchanged.
{% endhighlight %}

Create two `x`, `y`, `z` objects and add them.

{% highlight js %}
  var v1 = [],
      v2 = [ 1, 2, 3 ],
      v3 = [ 4, 5, 6 ];

  Vec3.add2(v1, v2, v3); //v2 and v3 are still the same but v1 is [ 5, 7, 9 ].
{% endhighlight %}


Vec3 Method: sub {#Vec3:sub}
------------------------------------

Substracts the `x`, `y`, `z` components of two `Vec3` objects. Creates a new `Vec3` instance and does not modify the original objects.

### Syntax:

	v1.sub(v2);

    Vec3.sub(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and substract them.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3),
      v2 = new Vec3(4, 5, 6);

  v1.sub(v2); //v1 and v2 are still the same but a new Vec3(-3, -3, -3) was created.
{% endhighlight %}

Create two `x`, `y`, `z` objects and substract them.

{% highlight js %}
  var v1 = [ 1, 2, 3 ],
      v2 = [ 4, 5, 6 ];

  Vec3.sub(v1, v2); //v1 and v2 are still the same but a new Vec3(-3, -3, -3) was created.
{% endhighlight %}


Vec3 Method: $sub {#Vec3:$sub}
------------------------------------

Substracts the `x`, `y`, `z` components of two `Vec3` objects. Modifies the original object.

### Syntax:

	v1.$sub(v2);

    Vec3.$sub(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and substract them.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3),
      v2 = new Vec3(4, 5, 6);

  v1.$sub(v2); //v1 is now Vec3(-3, -3, -3).
{% endhighlight %}

Create two `x`, `y`, `z` objects and add them.

{% highlight js %}
  var v1 = [ 1, 2, 3 ],
      v2 = [ 4, 5, 6 ];

  Vec3.$sub(v1, v2); //v1 is now [ -3, -3, -3 ].
{% endhighlight %}


Vec3 Method: sub2 {#Vec3:sub2}
------------------------------------

Substracts the `x`, `y`, `z` components of two `Vec3` objects and stores the result in the receiver.

### Syntax:

	v1.sub2(v2, v3);

    Vec3.sub2(v1, v2, v3);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.
2. v3 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and substract them.

{% highlight js %}
  var v1 = new Vec3(),
      v2 = new Vec3(1, 2, 3),
      v3 = new Vec3(4, 5, 6);

  v1.sub2(v2, v3); //v1 is now Vec3(-3, -3, -3), v2 and v3 are unchanged.
{% endhighlight %}

Create two `x`, `y`, `z` objects and substract them.

{% highlight js %}
  var v1 = [],
      v2 = [ 1, 2, 3 ],
      v3 = [ 4, 5, 6 ];

  Vec3.sub2(v1, v2, v3); //v2 and v3 are still the same but v1 is { x: -3, y: -3, z: -3 }.
{% endhighlight %}


Vec3 Method: scale {#Vec3:scale}
------------------------------------

Scales the Vec3 vector by a real number. Creates a new Vec3 with the scaled components.

### Syntax:

	v1.scale(s);

    Vec3.scale(v1, s);

### Arguments:

1. s - (*number*) A real number to scale the Vec3.

### Examples:

Create a vector and scale it by 2.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3);

  v1.scale(2); //v1 is unchanged but a new Vec3(2, 4, 6) is created.
{% endhighlight %}

Create an `x`, `y`, `z` object and scale it by 2.

{% highlight js %}
  var v1 = [ 1, 2, 3 ];

  Vec3.scale(v1, 2); //v1 is still the same but a new Vec3(2, 4, 6) was created.
{% endhighlight %}


Vec3 Method: $scale {#Vec3:$scale}
------------------------------------

Scales the Vec3 vector by a real number. Changes the original object.

### Syntax:

	v1.$scale(s);

    Vec3.$scale(v1, s);

### Arguments:

1. s - (*number*) A real number to scale the Vec3.

### Examples:

Create a vector and scale it by 2.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3);

  v1.$scale(2); //v1 is now Vec3(2, 4, 6).
{% endhighlight %}

Create an `x`, `y`, `z` object and scale it by 2.

{% highlight js %}
  var v1 = [ 1, 2, 3 ];

  Vec3.$scale(v1, 2); //v1 is now [ 2, 4, 6 ].
{% endhighlight %}


Vec3 Method: neg {#Vec3:neg}
------------------------------------

Negates a `Vec3`. Returns a new instance.

### Syntax:

	v1.neg();

    Vec3.neg(v1);

### Examples:

Create a vector and negate it.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3);

  v1.neg(); //v1 is unchanged but a new Vec3(-1, -2, -3) is created.
{% endhighlight %}

Create an `x`, `y`, `z` object and negate it.

{% highlight js %}
  var v1 = [ 1, 2, 3 ];

  Vec3.neg(v1); //v1 is still the same but a new Vec3(-1, -2, -3).
{% endhighlight %}


Vec3 Method: $neg {#Vec3:$neg}
------------------------------------

Negates a `Vec3`. Changes the original object.

### Syntax:

	v1.$neg();

    Vec3.$neg(v1);

### Examples:

Create a vector and negate it.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3);

  v1.$neg(); //v1 is now Vec3(-1, -2, -3).
{% endhighlight %}

Create an `x`, `y`, `z` object and negate it.

{% highlight js %}
  var v1 = [ 1, 2, 3 ];

  Vec3.neg(v1); //v1 is now [ -1, -2, -3 ].
{% endhighlight %}


Vec3 Method: unit {#Vec3:unit}
------------------------------------

Creates a unit vector from the coordinates of `Vec3`.

### Syntax:

	v1.unit();

    Vec3.unit(v1);

### Examples:

Create a vector and make a unit vector from it.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3);

  v1.unit(); //v1 is unchanged but a new unit vector Vec3 is created.
{% endhighlight %}

Create an `x`, `y`, `z` object and make a unit vector from it.

{% highlight js %}
  var v1 = [ 1, 2, 3 ];

  Vec3.unit(v1); //v1 is still the same but a new Vec3 that is a unit vector is created.
{% endhighlight %}


Vec3 Method: $unit {#Vec3:$unit}
------------------------------------

Creates a unit vector from the `Vec3` coordinates. Changes the original object.

### Syntax:

	v1.$unit();

    Vec3.$unit(v1);

### Examples:

Create a vector and make a unit vector from it.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3);

  v1.$unit(); //v1 is now a unit vector.
{% endhighlight %}

Create an `x`, `y`, `z` object make a unit vector from it.

{% highlight js %}
  var v1 = [ 1, 2, 3 ];

  Vec3.$unit(v1); //v1 is now a unit vector object.
{% endhighlight %}


Vec3 Method: cross {#Vec3:cross}
------------------------------------

Makes a cross product of two `Vec3` instances. Creates a new `Vec3` and does not modify the original objects.
You can find more information about the cross product [here](http://en.wikipedia.org/wiki/Cross_product).

### Syntax:

	v1.cross(v2);

    Vec3.cross(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and make a cross product.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3),
      v2 = new Vec3(4, 5, 6);

  v1.cross(v2); //v1 and v2 are still the same but a new Vec3 was created with the result.
{% endhighlight %}

Create two `x`, `y`, `z` objects and make a cross product.

{% highlight js %}
  var v1 = [ 1, 2, 3 ],
      v2 = [ 4, 5, 6 ];

  //v1 and v2 are still the same but a new Vec3 with the result was created.
  var ans = Vec3.cross(v1, v2);
{% endhighlight %}


Vec3 Method: $cross {#Vec3:$cross}
------------------------------------

Makes a cross product of two `Vec3` instances. Modifies the original object.
You can find more information about the cross product [here](http://en.wikipedia.org/wiki/Cross_product).

### Syntax:

	v1.$cross(v2);

    Vec3.$cross(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and make a cross product.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3),
      v2 = new Vec3(4, 5, 6);

  v1.$cross(v2); //v1 contains now the result.
{% endhighlight %}

Create two `x`, `y`, `z` objects and make a cross product.

{% highlight js %}
  var v1 = [ 1, 2, 3 ],
      v2 = [ 4, 5, 6 ];

  //v1 contains now the result.
  var ans = Vec3.$cross(v1, v2);
{% endhighlight %}


Vec3 Method: distTo {#Vec3:distTo}
------------------------------------

Calculates the distance between two `Vec3`.

### Syntax:

	v1.distTo(v2);

    Vec3.distTo(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and calculate the distance.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3),
      v2 = new Vec3(4, 5, 6);

  v1.distTo(v2); //a real value with the distance is returned.
{% endhighlight %}

Create two `x`, `y`, `z` objects and calculate their distance.

{% highlight js %}
  var v1 = [ 1, 2, 3 ],
      v2 = [ 4, 5, 6 ];

  //a real number with the distance is returned.
  var ans = Vec3.distTo(v1, v2);
{% endhighlight %}


Vec3 Method: distToSq {#Vec3:distToSq}
------------------------------------

Calculates the squared distance between two `Vec3`.

### Syntax:

	v1.distToSq(v2);

    Vec3.distToSq(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and calculate the squared distance.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3),
      v2 = new Vec3(4, 5, 6);

  v1.distToSq(v2); //a real value with the squared distance is returned.
{% endhighlight %}

Create two `x`, `y`, `z` objects and calculate their squared distance.

{% highlight js %}
  var v1 = [ 1, 2, 3 ],
      v2 = [ 4, 5, 6 ];

  //a real number with the squared distance is returned.
  var ans = Vec3.distToSq(v1, v2);
{% endhighlight %}


Vec3 Method: norm {#Vec3:norm}
------------------------------------

Calculates the norm of `Vec3`.

### Syntax:

	v1.norm();

    Vec3.norm(v1);

### Examples:

Create a vector and calculate its norm.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3);

  vi.norm(); //returns the real valued norm.
{% endhighlight %}

Create an `x`, `y`, `z` object and calculate its norm.

{% highlight js %}
  var v1 = [ 1, 2, 3 ];

  //A real number with the norm is returned.
  var ans = Vec3.norm(v1);
{% endhighlight %}


Vec3 Method: normSq {#Vec3:normSq}
------------------------------------

Calculates the squared norm of `Vec3`.

### Syntax:

	v1.normSq();

    Vec3.normSq(v1);

### Examples:

Create a vector and calculate its squared norm.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3);

  vi.normSq(); //returns the real valued norm.
{% endhighlight %}

Create an `x`, `y`, `z` object and calculate its squared norm.

{% highlight js %}
  var v1 = [ 1, 2, 3 ];

  //A real number with the squared norm is returned.
  var ans = Vec3.normSq(v1);
{% endhighlight %}


Vec3 Method: dot {#Vec3:dot}
------------------------------------

Calculates the dot product between two `Vec3`. You can find more information about the
dot product [here](http://en.wikipedia.org/wiki/Dot_product).

### Syntax:

	v1.dot(v2);

    Vec3.dot(v1, v2);

### Arguments:

1. v2 - (*object*) A `Vec3` instance.

### Examples:

Create two vectors and calculate the dot product.

{% highlight js %}
  var v1 = new Vec3(1, 2, 3),
      v2 = new Vec3(4, 5, 6);

  v1.dot(v2); //a real value with the dot product is returned.
{% endhighlight %}

Create two `x`, `y`, `z` objects and calculate the dot product.

{% highlight js %}
  var v1 = [ 1, 2, 3 ],
      v2 = [ 4, 5, 6 ];

  //a real number with the dot product is returned.
  var ans = Vec3.dot(v1, v2);
{% endhighlight %}


Vec3 Method: clone {#Vec3:clone}
------------------------------------

Clones a vector.

### Syntax:

	v1.clone();

    Vec3.clone(v1);
