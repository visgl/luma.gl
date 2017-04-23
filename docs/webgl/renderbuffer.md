---
layout: docs
title: Renderbuffer
categories: [Documentation]
---

# Renderbuffer

From [OpenGL Wiki](https://www.opengl.org/wiki/Renderbuffer_Object):

Renderbuffer Objects are OpenGL Objects that contain images.
They are created and used specifically with Framebuffer Objects.
They are optimized for use as render targets, while Textures may not be,
and are the logical choice when you do not need to sample
(i.e. in a post-pass shader) from the produced image.
If you need to resample (such as when reading depth back in a second shader
pass), use Textures instead.
Renderbuffer objects also natively accommodate Multisampling (MSAA).

Notes:
* Renderbuffers cannot be accessed by Shaders in any way. The only way to work
  with a renderbuffer, besides creating it, is to attach it to a Framebuffer.
* The luma.gl Framebuffer class can autocreate Renderbuffers for you.
* Multisampling is only available in WebGL2


