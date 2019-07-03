# RFC: Data Management in luma.gl

* **Author**: Tarek Sherif
* **Date**: July, 2019
* **Status**: **Draft**


## Summary

This RFC specifies subsystem for managing data in luma.gl and creating gl resources from it.


## Background

It is currently difficult in luma.gl to know when buffers and textures can be re-used, since there is no mechanism for tracking the data they contain. This can lead to increased memory pressure and bandwidth usage due to resources being allocated to store redundant data. In a system like deck.gl, for example, this redundant resource creation could be due to multiple layers being created from the same data (where each layer would allocate its own gl resources) or multiple instances of the same layer each creating their own layer-specific geometry buffers or texture data. The deck.gl `TileLayer` uses a `TileCache` to avoid redundantly creating textures, and a similar mechanism could be applied more generally to avoid allocating textures and buffers if like resources with the same data have already been created.


## Overview

The proposed data manager would allow the application to register arbitrary named data sets, optionally providing accessors to parse particular views of the data. It would provide API methods to create buffers or textures from the
registered data, returning cached versions if they are available.


## Implementation

A `DataManager` class that supports the following methods:
- `addData(id, data, accessors)`: add a data set to the manager, optionally with accessors to create particular views.
- `getBuffer(dataId, viewId)`: create a buffer a data set view. On first called, create the buffer and cache it, subsequently return cached version and increment usage count.
- `getTexture(dataId, viewId)`: create a texture a data set view. On first called, create the texture and cache it, subsequently return cached version and increment usage count.
- `release(Buffer|Texture)`: indicate that a resource is no longer used. Decrements the usage count for the resource and deletes it if the usage count reaches 0.


## Example

```js
const dm = new DataManager(gl);

dm.addData('myTable', [
  {
    position: [0.4, 1.0],
    color: [255, 0, 255]
  },
  {
    position: [1.0, 2.0],
    color: [0, 255, 255]
  },
  {
    position: [-1.0, 3.0],
    color: [255, 0, 0]
  }
], {
  positions: (data) => {
    const result = new Float32Array(data.length * 2);
    for (let i = 0, len = data.length; i < len; ++i) {
      result.set(data[i].position, i * 2);
    }
    return result;
  },
  colors: (data) => {
    const result = new Uint8Array(data.length * 3);
    for (let i = 0, len = data.length; i < len; ++i) {
      result.set(data[i].color, i * 3);
    }
    return result;
  }
});

dm.addData('myImages', [
  image1,
  image2
], {
  image1: (data) => data[0],
  image2: (data) => data[1]
});

dm.addData('anotherImage', image3); // Accessors not provided because the only view is the entire data set

const positionBuffer = dm.getBuffer('myTable', 'positions');
const positionBuffer2 = dm.getBuffer('myTable', 'positions'); // Gets cached version of same buffer
const colorBuffer = dm.getBuffer('myTable', 'colors');
const texture1 = dm.getTexture('myImage', 'image1');
const texture2 = dm.getTexture('myImage', 'image2');
const texture3 = dm.getTexture('myImage', 'image2'); // Gets cached version of same texture
const texture4 = dm.getTexture('anotherImage');      // Omit view ID to use entire data set.

dm.release(positionBuffer);  // Still in memory, usage count decremented to 1
dm.release(positionBuffer2); // Delete buffer
dm.release(colorBuffer);
dm.release(texture1);
dm.release(texture2);  // Still in memory, usage count decremented to 1
dm.release(texture3);  // Delete texture
dm.release(texture4);

```
