# Stencil Buffer


## Using Stencil Buffers

The stencil buffer API supports a number of features which makes it look somewhat complex at first glance, but the basic operations are turning on and off stencil testing.



### Typical usage

Enable stencil testing and set the actions to take whenever any of the tests succeed or fail:

```js
setParameters({
  stencilTest: true, // turn on stencil buffers
  stencilOp: [GL.KEEP, GL.KEEP, GL.REPLACE] // update the stencil buffer if both stencil and depth tests pass
  stencilFunc: [GL.ALWAYS, 1, 0xFF] // turn off stencil test: update the stencil buffer, regardless of current stencil value
  stencilMask: 0xFF // mask that enables writing of all bits
})

clear(GL_STENCIL_BUFFER_BIT)

// draw
```

```js
setParameters(gl, {
  glStencilFunc(GL_NOTEQUAL, 1, 0xFF);
  glStencilMask(0x00); // disable writing to the stencil buffer
  glDisable(GL_DEPTH_TEST);
})
```


### More advanced usage

* Multiple Stencil Buffers: By using the bit-planes in the stencil buffer one can manage 8 different stencil buffers, and clip to any combination of these buffers.
* Counting occlusions per fragment



### Creating stencil buffers

Stencil buffers are not created by default.


### Stencil Testing

The stencil test flag turns on both reading and writing to buffers.

```js
setParameters(gl, {stencilTest: true})
```

The stencil test by default is set to always pass. Typically an application wants the stencil buffer value to be compared against some other value.

```js
setParameters(gl, {stencilFunc: [GL.GEQUAL, 0xFF, 0xFF]})
```



### Stencil Writing

To write to the stencil buffer:

```js
setParameters(gl, {
  stencilOp: [stencilTestFails, depthTestFails, stencilAndDepthTestPass]
})
```

Initial values are `GL.KEEP` so nothing will be written to the stencil buffer unless the `stencilOp` is changed.

| Enum           | Operation |
| ---            | --- |
| `GL.KEEP`      | Don't modify the current value (default) |
| `GL.INVERT`    | Invert the current value |
| `GL.ZERO`      | Set it to zero |
| `GL.REPLACE`   | Replace with the masked fragment value |
| `GL.INCR`      | Increment the current value, saturating if it would overflow (max is typically 255) |
| `GL.INCR_WRAP` | Increment the current value, wrapping if it would overflow (256 => 0) |
| `GL.DECR`      | Decrement the current value, setting to zero if it would underflow |
| `GL.DECR_WRAP` | Decrement the current value, wrapping if it would underflow (0 => 256) |

1: Meaning that it stops at the maximum representable integer at the stencil buffer's bitdepth. For an 8-bit stencil buffer, that would be 255.


## Stencil mask

Where a 0 appears, the corresponding bit is write-protected. Initially, all bits are enabled for writing.

```js
setParameters(gl, {stencilMask: 0xFF})
```

