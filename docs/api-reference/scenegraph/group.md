# Group

## Usage

Add a moon and a box models to the group. Taken from
[lesson 12]http://uber.github.io/luma.gl/examples/lessons/12/).
http://uber.github.io/luma.gl/examples/lessons/12/
```js
// Add objects to the group
group.add(moon, box);
```

Add a moon and a box models to the group. Then remove them.

```js
// Add objects to the group
group.add(moon, box);
// Remove the moon
group.remove(moon);
```

## Methods

### add

Add an [Object3D](object-3d.html) object to the Group.

Syntax:

    group.add(o[, ...]);

Arguments:

A variable argument list of [Object3D](object-3d.html) instances.

Examples:

### remove

Removes an [Object3D](object-3d.html) object from the Group.

Syntax:

    group.remove(model);

Arguments:

* model - (*object*) The model to be removed.
