---
layout: docs
title: Fx
categories: [Documentation]
---

Class: Fx {#Fx}
===========================

Fx is the module that provides effects and tweening functions, as well as wrappers for eficient timer based animations
like `animationTime` and `requestAnimationFrame` wrappers.


Fx Method: constructor {#Fx:constructor}
----------------------------------------------------

The main constructor function for the Fx class. Use this to create a new animation effect.

### Syntax:

	var fx = new LumaGL.Fx(options);

### Arguments:

1. options - (*object*) An object containing the following options:

### Options:

* duration - (*numer*, optional) The duration of the animation in milliseconds. Default's 1000.
* delay - (*numer*, optional) The delay before triggering the animation in milliseconds. Default's 0.
* transition - (*object*, optional) One of the tweening functions in Fx.Transitions (described below). Default's Fx.Transition.Quart.easeInOut.
* onCompute - (*function*) A callback for each step of the animation. The first parameter of the callback is *delta* a number between [0, 1].
* onComplete - (*function*) A callback executed when the animation is finished.

### Examples:

Creating a simple animation instance that transitions an objects height value from a value to another one. 
In this example we also use `LumaGL.Fx.compute` method to to linear interpolation (lerp). 

{% highlight js %}
  var obj = {}, from = 10, to = 20;

  var fx = new LumaGL.Fx({
    duration: 1500,
    transition: LumaGL.Fx.Transition.Back.easeOut,
    onCompute: function(delta) {
      obj.height = LumaGL.Fx.compute(from, to, delta);
    },
    onComplete: function() {
      alert("completed!");
    }
  });
{% endhighlight %}

Fx Method: start {#Fx:start}
------------------------------------

In order to trigger/start the animation we call the `start` method on the animation instance `fx`.

### Syntax:

	fx.start([options]);

### Arguments:

1. options - (*object*, optional) all the properties set in this object will be accessible through `this.opt` inside the `onCompute` and `onComplete` methods.

### Examples:

Creating a simple animation instance that transitions an objects height value from a value to another one. 
In this example we also use `LumaGL.Fx.compute` method to to linear interpolation (lerp). 

{% highlight js %}
  var obj = {};
  //create a Fx instance
  var fx = new LumaGL.Fx({
    duration: 1500,
    transition: LumaGL.Fx.Transition.Back.easeOut,
    onCompute: function(delta) {
      //access `from` and `to` from the options object
      var from = this.opt.from,
          to = this.opt.to;
      
      obj.height = LumaGL.Fx.compute(from, to, delta);
    },
    onComplete: function() {
      alert("completed!");
    }
  });

  //start the animation with custom `from` and `to` properties.
  fx.start({
    from: 10,
    to: 20
  });

{% endhighlight %}

Fx Method: step {#Fx:step}
------------------------------------

This method should be called at each frame to compute a new step for the animation. If the animation is over then this method 
will not have any effect on the `fx` instance.

### Syntax:

	fx.step();

### Examples:

Creating a simple animation instance that transitions an object's height from a value to another one. 
In this example we also use `LumaGL.Fx.compute` method to do linear interpolation (lerp). 

{% highlight js %}
  var obj = {};
  //create a Fx instance
  var fx = new LumaGL.Fx({
    duration: 1500,
    transition: LumaGL.Fx.Transition.Back.easeOut,
    onCompute: function(delta) {
      //access from and to from the options object
      var from = this.opt.from,
          to = this.opt.to;
      
      obj.height = LumaGL.Fx.compute(from, to, delta);
    },
    onComplete: function() {
      alert("completed!");
    }
  });
  
  //start the animation with custom `from` and `to` properties.
  fx.start({
    from: 10,
    to: 20
  });

  //call the animation at 60 frames per second
  setInterval(function() {
    fx.step();
  }, 1000 / 60);

{% endhighlight %}

### Notes:

When using `Fx.requestAnimationFrame` there's no need to use this
method, since an internal queue that calls animations steps is used
automatically. The only methods generally used are then the `Fx`
constructor and the `start` method.


Fx Method: compute {#Fx:compute}
------------------------------------

`Fx.compute` is a static method that performs a linear number interpolation (lerp) for a given delta value.

### Syntax:

	LumaGL.Fx.compute(from, to, delta);

### Examples:

Creating a simple animation instance that transitions an object's height from a value to another one. 
We use `LumaGL.Fx.compute` to interpolate between two number values.

{% highlight js %}
  var obj = {};
  //create a Fx instance
  var fx = new LumaGL.Fx({
    duration: 1500,
    transition: LumaGL.Fx.Transition.Back.easeOut,
    onCompute: function(delta) {
      //access from and to from the options object
      var from = this.opt.from,
          to = this.opt.to;
      
      obj.height = LumaGL.Fx.compute(from, to, delta);
    },
    onComplete: function() {
      alert("completed!");
    }
  });
{% endhighlight %}

Fx Method: animationTime {#Fx:animationTime}
------------------------------------

`Fx.animationTime` is a static method that performs (if possible) high performance interface to `Date.now` or `new Date.getTime()`. 
You can read more about `animationTime` [here](https://developer.mozilla.org/en/DOM/window.mozAnimationStartTime).

### Syntax:

	LumaGL.Fx.animationTime();

### Examples:

Log the number of milliseconds passed since the beginning of the interval.

{% highlight js %}
  var start = LumaGL.Fx.animationTime();
  setInterval(function() {
    console.log(LumaGL.Fx.animationTime() - start);
  }, 1000 / 60);
{% endhighlight %}

Fx Method: requestAnimationFrame {#Fx:requestAnimationFrame}
------------------------------------

`Fx.requestAnimationFrame` is a static method that receives a callback to be executed when the next frame for an animation is ready. 
In most cases this method is recommended over simple `setTimeout`s because of various reasons exposed in the [Mozilla]() and [Chrome]() articles. 
Since this is a cross-browser method, when `requestAnimationFrame` is not natively implemented in the browser the Framework will fallback to 
`setTimeout` instead.

### Syntax:

	LumaGL.Fx.requestAnimationFrame(callback);

### Arguments:

1. callback - (*function*) A callback function to be executed when the next frame is ready.

### Examples:

Log the number of milliseconds passed since the beginning of the animation.

{% highlight js %}
  var Fx = LumaGL.Fx,
      start = Fx.animationTime();
  
  Fx.requestAnimationFrame(function callback() {
    console.log(Fx.animationTime() - start);
    Fx.requestAnimationFrame(callback);
  });
{% endhighlight %}

Fx Object: Transition {#Fx:Transition}
------------------------------------

An object containing multiple easing functions. Each easing function (except for `linear`) has `easeIn`, `easeOut` and `easeInOut` properties. 
The easing and transition equations are slightly based on Robert Penner's equations. We've taken the same convention as in the MooTools JavaScript Framework 
http://mootools.net.  Copyright © 2006-2011 Valerio Proietti, http://mad4milk.net/.  MIT license http://mootools.net/license.txt.

### Syntax:

	LumaGL.Fx.Transition.Quart.easeInOut;

### Examples:

Create a new animation object that has a `Quart.easeInOut` transition.

{% highlight js %}
  var fx = new LumaGL.Fx({
    duration: 1500,
    transition: LumaGL.Fx.Transition.Back.easeOut,
    onCompute: function(delta) {
      obj.height = LumaGL.Fx.compute(from, to, delta);
    },
    onComplete: function() {
      alert("completed!");
    }
  });
{% endhighlight %}

The possible objects for transitions are described below.

Fx.Transition Method: linear {#Fx-Transition:linear}
------------------------------------------------------

Displays a linear transition.

Fx.Transition Method: Quad {#Fx-Transition:Quad}
--------------------------------------------------

Displays a quadratic transition. Must be used as Quad.easeIn or Quad.easeOut or Quad.easeInOut.

Fx.Transition Method: Cubic {#Fx-Transition:Cubic}
----------------------------------------------------

Displays a cubicular transition. Must be used as Cubic.easeIn or Cubic.easeOut or Cubic.easeInOut.


Fx.Transition Method: Quart {#Fx-Transition:Quart}
----------------------------------------------------

Displays a quartetic transition. Must be used as Quart.easeIn or Quart.easeOut or Quart.easeInOut.

Fx.Transition Method: Quint {#Fx-Transition:Quint}
----------------------------------------------------

Displays a quintic transition. Must be used as Quint.easeIn or Quint.easeOut or Quint.easeInOut

Fx.Transition Method: Pow {#Fx-Transition:Pow}
------------------------------------------------

- The default is `p^6`.

Fx.Transition Method: Expo {#Fx-Transition:Expo}
--------------------------------------------------

Displays a exponential transition. Must be used as Expo.easeIn or Expo.easeOut or Expo.easeInOut.



Fx.Transition Method: Circ {#Fx-Transition:Circ}
--------------------------------------------------

Displays a circular transition. Must be used as Circ.easeIn or Circ.easeOut or Circ.easeInOut.



Fx.Transition Method: Sine {#Fx-Transition:Sine}
--------------------------------------------------

Displays a sineousidal transition. Must be used as Sine.easeIn or Sine.easeOut or Sine.easeInOut.



Fx.Transition Method: Back {#Fx-Transition:Back}
--------------------------------------------------

Makes the transition go back, then all forth. Must be used as Back.easeIn or Back.easeOut or Back.easeInOut.



Fx.Transition Method: Bounce {#Fx-Transition:Bounce}
------------------------------------------------------

Makes the transition bouncy. Must be used as Bounce.easeIn or Bounce.easeOut or Bounce.easeInOut.



Fx.Transition Method: Elastic {#Fx-Transition:Elastic}
--------------------------------------------------------

Elastic curve. Must be used as Elastic.easeIn or Elastic.easeOut or Elastic.easeInOut

