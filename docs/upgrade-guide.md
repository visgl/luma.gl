# Upgrade Guide

## Upgrading from V3 to V4

A number of deprecated features have been removed in luma.gl V4.

## math

The deprecated math library (`Vec3`, `Mat4`, `Quat`) has now been removed.

The new Math library is based on `gl-matrix` and uses Array subclassing so that objects are directly usable with luma.gl.

Note that luma.gl now works directly with JavaScript arrays (a `Vector3` is just a 3 element array) and you can use any math library as long as you convert objects to arrays before passing data to luma.gl.

