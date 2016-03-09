---
layout: docs
title: Overview
categories: [Documentation]
---

# Luma.GL
=========

Overview

WebGL Classes
=============

At it's core, luma.gl provides JavaScript class abstractions that wrap
core WebGL object types, with the intention of making these WebGL objects
easier to work with in JavaScript.

* These classes provide an API that closely matches the operations
  supported by the underlying WebGL object, while reducing the boilerplate
  often required by low-level webgl methods(such as long, often repeated
  argument lists, or the multiple WebGL calls that are often
  necessary to select and set up things before doing an actual operation).

* These classes also add a level of parameter checking that helps catch a
  number of common JavaScript coding mistakes. As an example, setting uniforms
  to illegal values generates a clear error message rather than just silently
  failing to render.

* Implements error handling by carefully checking WebGL return values and
  throwing exceptions taking care to extract helpful information into
  the error message.
  As an example, a failed shader compilation will throw an Error with a
  message indicating the problematic line inline in the shader GLSL source.


The WebGL classes are
|========|========|
| luma.gl class | WebGL object |
|========|========|
| Program  | WebGLProgram |
| Buffer  | WebGLBuffer |
| Texture  | WebGLTexture |
| FrameBuffer | WebGLFrameBuffer |

## WebGLContext
createGLContext();
hasExtension();
getExtension();


## Render Loop
==============

Currently managed by the Fx addon.


