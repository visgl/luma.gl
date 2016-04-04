/* Generate script that can be used in browser without browserify */

/* global window */
import 'babel-polyfill';
import * as LumaGL from './index';
import Fx from './addons/fx';
import WorkerGroup from './addons/workers';

// Export all LumaGL objects as members of global LumaGL variable
if (typeof window !== 'undefined') {
  window.LumaGL = {
    hasWebGL: LumaGL.hasWebGL,
    createGLContext: LumaGL.createGLContext,
    loadTextures: LumaGL.loadTextures,
    Model: LumaGL.Model,
    Cone: LumaGL.Cone,
    Cube: LumaGL.Cube,
    Cylinder: LumaGL.Cylinder,
    IcoSphere: LumaGL.IcoSphere,
    Plane: LumaGL.Plane,
    Sphere: LumaGL.Sphere,
    TruncatedCone: LumaGL.TruncatedCone,
    Framebuffer: LumaGL.Framebuffer,
    Texture2D: LumaGL.Texture2D,
    TextureCube: LumaGL.TextureCube,
    Buffer: LumaGL.Buffer,
    Events: LumaGL.Events,
    Mat4: LumaGL.Mat4,
    Vec3: LumaGL.Vec3,
    Shaders: LumaGL.Shaders,
    PerspectiveCamera: LumaGL.PerspectiveCamera,
    OrthoCamera: LumaGL.OrthoCamera,
    Scene: LumaGL.Scene,
    Program: LumaGL.Program,
    saveBitmap: LumaGL.saveBitmap,
    Media: {
      Image: LumaGL.Img
    },
    IO: {
      XHR: LumaGL.XHR
    },
    // Add-ons
    WorkerGroup: WorkerGroup,
    Fx: Fx
  };
}
