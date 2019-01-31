# Group

A `Group` is a subclass of `ScenegraphNode` that holds a list of `ScenegraphNode` children. Since . A `Group` can be a child of another `Group` and thus be used to create hierarchical scene graphs.


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


## Properties

`Model` extends the `ScenegraphNode` class and inherits the transformation matrix properties from that class.


### children : ScenegraphNode[]


## Methods


### constructor(props : Object)

Create an instance of `Group`.


### setProps(props : Object)

Updates properties.


### add(node : ScenegraphNode [, ...])

Add one or more `ScenegraphNode` objects to the `Group`.

`group.add(model);`

A variable argument list of [ScenegraphNode]() instances.


### remove(node: Node)

Removes an [ScenegraphNode](object-3d.html) object from the Group.

    group.remove(model);

* model - (*object*) The scene graph node to be removed.
