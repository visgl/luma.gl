---
layout: docs
title: Group - Scenegraph Grouping & Hierarchy
categories: [Documentation]
---

Group Method: add {#Group:add}
--------------------------------

Add an [Object3D](object-3d.html) object to the Group.

### Syntax:

    group.add(o[, ...]);

### Arguments:

A variable argument list of [Object3D](object-3d.html) instances.

### Examples:

Add a moon and a box models to the group. Taken from
[lesson 12]http://uber.github.io/luma.gl/examples/lessons/12/).
http://uber.github.io/luma.gl/examples/lessons/12/
{% highlight js %}
// Add objects to the group
group.add(moon, box);
{% endhighlight %}


Group Method: remove {#Group:remove}
-------------------------------------

Removes an [Object3D](object-3d.html) object from the Group.

### Syntax:

    group.remove(model);

### Arguments:

model - (*object*) The model to be removed.

### Examples:

Add a moon and a box models to the group. Then remove them.

{% highlight js %}
// Add objects to the group
group.add(moon, box);
// Remove the moon
group.remove(moon);
{% endhighlight %}

