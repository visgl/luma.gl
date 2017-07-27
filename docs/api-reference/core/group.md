# Group

Holds a list of `Object3d`s. Since `Group` is a subclass of `Object3D` you can place groups inside groups and create hierarchical scene graphs.

## Usage

Add a moon and a box models to the group.
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

    group.add(o[, ...]);

A variable argument list of [Object3D](object-3d.html) instances.

Examples:

### remove

Removes an [Object3D](object-3d.html) object from the Group.

    group.remove(model);

* model - (*object*) The model to be removed.
