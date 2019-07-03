# RFC: Data Management

* **Author**: Tarek Sherif
* **Date**: July, 2019
* **Status**: **Draft**


## Summary

This RFC specifies subsystem for managing data in luma.gl and creating gl resources from it.


## Background

Buffer and texture management in luma.gl is currently done in an ad hoc manner, with the application required to build these resources from data and to decide when and how they can be re-used. In deck.gl this has lead to the complexity of the `AttributeManager` that creates buffers from input data and manages their lifecycles.

The lack of a global mechanism for managing data resources also has performance implications in that buffers and textures can be allocated to store redundant data. In deck.gl this might occur due to multiple layers being created from the same data (where each layer would allocate its own gl resources) or multiple instances of the same layer each creating their own layer-specific geometry buffers or texture data. The deck.gl `TileLayer` uses a `TileCache` to avoid redundantly creating textures, and a similar mechanism could be applied more generally to avoid allocating textures and buffers if like resources with the same data have already been created anywhere in the application.


## Overview

The proposed data manager would allow the application to register arbitrary named data sets, optionally providing accessors to parse particular views of the data. It would provide API methods to create buffers or textures from the registered data, returning cached versions if they are available.


## Implementation

A `DataManager` class that supports the following methods:
- `addData(id, data)`: add a data set to the manager.
- `getBuffer(dataId|size)`: if `dataId` is provided, create a buffer from a data set, if `size` is provided create an empty buffer of the given size. On first call, create the buffer and cache it, subsequently return cached version and increment usage count.
- `getResizedBuffer(buffer, size)`: create a buffer of the given size with starting data copied from the given `buffer`. On first call, create the buffer and cache it, subsequently return cached version and increment usage count.
- `getUpdatedBuffer(buffer, dataId, offset)`: create a copy of the given buffer, data from the data set inserted at the given `offset`. On first call, create the buffer and cache it, subsequently return cached version and increment usage count.
- `getCopiedBuffer(srcBuffer, dstBuffer, srcOffset, dstOffset, bytes)`: create copy of `dstBuffer`, with `bytes` bytes of data copied from `srcBuffer` at `srcOffset` to `dstOffset`. On first call, create the buffer and cache it, subsequently return cached version and increment usage count.
- `getTexture(dataId)`: create a texture from a data set. On first call, create the texture and cache it, subsequently return cached version and increment usage count.
- `release(buffer|texture)`: indicate that a resource is no longer used. Decrements the usage count for the resource and deletes it if the usage count reaches 0.


## Example

```js
const dm = new DataManager(gl);

dm.addData('myPositions', floatArray);
dm.addData('myColors', byteArray);
dm.addData('positionUpdate', updateArray);
dm.addData('myImage', image);

const positionBuffer = dm.getBuffer('myPositions');
const positionBuffer2 = dm.getBuffer('myPositions'); // Gets cached version of same buffer
const colorBuffer = dm.getBuffer('myColors');
const emptyBuffer = dm.getBuffer(256);  // Create and cache an empty buffer of 256 bytes
const resizedBuffer = dm.getResizedBuffer(positionBuffer, 1024);  // Create and cache a new 1024-byte buffer beginning with the contents of positionBuffer
const updatedBuffer = dm.getUpdatedBuffer(positionBuffer, 'positionUpdate', 64);  // Create a new copy of positionBuffer with positionUpdate data inserted starting at byte 64
const copiedBuffer = dm.getCopiedBuffer(positionBuffer, emptyBuffer, 64, 128, 32); // Copy 32 bytes starting from byte 64 in positionBuffer to a copy of emptyBuffer starting at byte 128

const texture1 = dm.getTexture('myImage');
const texture2 = dm.getTexture('myImage'); // Gets cached version of same texture

dm.release(positionBuffer);  // Still in memory, usage count decremented to 1
dm.release(positionBuffer2); // Delete buffer
dm.release(colorBuffer);
dm.release(emptyBuffer);
dm.release(resizeBuffer);
dm.release(updatedBuffer);
dm.release(copiedBuffer);
dm.release(texture1);  // Still in memory, usage count decremented to 1
dm.release(texture2);  // Delete texture

```
