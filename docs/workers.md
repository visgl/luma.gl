--- 
layout: docs 
title: Workers 
categories: [Documentation]
---

Script: Workers {#Workers}
===============================

When there's no possibility to pass in the computations into the GPU the best way to gain some performance is by using multi-threading on the client side. 
Even if we're using just one [Worker](https://developer.mozilla.org/En/DOM/Worker) we separate the UI thread from 
the execution thread making calculations in a much simple execution context and in most cases we can do faster calculations. The workers script has utility 
methods for dealing with web workers and coordinate groups of web workers with the map-reduce paradigm.


Class: WorkerGroup {#WorkerGroup}
==================================

Coordinates groups of web workers.


WorkerGroup Method: constructor {#WorkerGroup:constructor}
-----------------------------------------------------------

Creates a group of web workers out of the same script.

### Syntax:

	var workerGroup = new PhiloGL.WorkerGroup(scriptName, n);

### Arguments:

1. scriptName - (*string*) A string with the name/path of the script to be used as web worker.
2. n - (*number*) The number of Web Workers to be created.

### Examples:

Create a group of workers to divide as an octree the space of marching cubes calculations. More information 
about that can be found [here](http://blog.thejit.org/2010/12/10/animating-isosurfaces-with-webgl-and-workers/).

{% highlight js %}
  //initialize workers
  var workerGroup = new WorkerGroup('WorkerMarchingCube.js', nWorkers);
{% endhighlight %}


WorkerGroup Method: map {#WorkerGroup:map}
--------------------------------------------

Map different configuration objects into each worker. Just like using `map` as an `Array` method.

### Syntax:

	workerGroup.map(callback);

### Arguments:

1. callback - (*function*) A callback function to be executed for each worker. The first formal parameter of the function is the current index.

### Examples:

Divide the calculation space into an octree providing each worker with the grid dimensions of an philogl. The entire application can be seen 
[here](https://github.com/philogb/Playground/blob/master/Isosurface/Metaballs/cubes.js).

{% highlight js %}
  workerGroup.map(function(nb) {
    var idx = nb % den,
        idy = ((nb / den) >> 0) % den,
        idz = ((nb / den / den) >> 0) % den;
    var o = {
      grid: {
        x: {
          from: xfrom + idx * nx,
          to: xfrom + idx * nx + nx,
          step: xstep
        },
        y: {
          from: yfrom + idy * ny,
          to: yfrom + idy * ny + ny,
          step: ystep
        },
        z: {
          from: zfrom + idz * nz,
          to: zfrom + idz * nz + nz,
          step: zstep
        }
      },
      isolevel: 10,
      balls: balls.ballsArray
    };
    return o;
  });
{% endhighlight %}


WorkerGroup Method: reduce {#WorkerGroup:reduce}
-------------------------------------------------

Collect all the information each worker responded and merge it into a new object/value.

### Syntax:

	workerGroup.reduce(options);

### Arguments:

1. options - (*object*) An object with the following properties.

### Options:

* reduceFn - (*function*) The callback to be called each time we want to reduce two elements. The function gets two parameters, the acumulated value as first parameter 
and the new value responded by a worker as second parameter.
* intialValue - (*mixed*, optional) The initialValue to be merged.
* onComplete - (*function*) A callback to be executed when call the merging stage is done. The first formal parameter of the onComplete callback is the acumulated result.

### Examples:

Reduce all calculations from each philogl into a single object. More information [here](https://github.com/philogb/Playground/blob/master/Isosurface/Metaballs/cubes.js).

{% highlight js %}
var indexAcum = 0, initialValue = {
  vertices: [],
  normals: [],
  indices: []
};

workerGroup.reduce({
  reduceFn: function (x, y) {
    var l = y.vertices.length /3;
    x.vertices = x.vertices.concat(y.vertices);
    x.normals = x.normals.concat(y.normals);
    while (l--) {
      x.indices.push(indexAcum++);
    }
    return x;
  },
  initialValue: initialValue,
  onComplete: complete
});
{% endhighlight %}

