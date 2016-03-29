// media has utility functions for image, video and audio manipulation (and
// maybe others like device, etc).

/* eslint-disable */ // TODO - this file needs cleanup
import {Program} from './webgl';
import {Plane} from './objects';
import {PerspectiveCamera} from './camera';
import Scene from './scenegraph';
import {splat} from './utils';

// length given a 45 fov angle, and 0.2 distance to camera
const length = 0.16568542494923805;
const camera = new PerspectiveCamera({
  fov: 45,
  aspect: 1,
  near: 0.1,
  far: 500,
  position: [0, 0, 0.2]
});

// TODO/rye: temporarily renaming this Img until we decide on a name that
// doesn't shadow the builtin Image class.

export default class Img {

  // post process an image by setting it to a texture with a specified fragment
  // and vertex shader.
  static postProcess(opt) {
    const plane =
      new Plane({type: 'x,y', xlen: length, ylen: length, offset: 0});

    const program = app.program instanceof Program ?
      app.program :
      app.program[opt.program];
    var textures = opt.fromTexture ? splat(opt.fromTexture) : [],
        framebuffer = opt.toFrameBuffer,
        screen = !!opt.toScreen,
        width = opt.width || app.canvas.width,
        height = opt.height || app.canvas.height,
        x = opt.viewportX || 0,
        y = opt.viewportY || 0;

    camera.aspect = opt.aspectRatio ?
      opt.aspectRatio : Math.max(height / width, width / height);
    camera.update();

    const scene = new Scene(app, program, camera);

    scene.program = program;

    plane.textures = textures;
    plane.program = program;

    if (!scene.models.length) {
      scene.add(plane);
    }

    if (framebuffer) {
      // create framebuffer
      if (!(framebuffer in app.frameBufferMemo)) {
        app.setFrameBuffer(framebuffer, {
          width: width,
          height: height,
          bindToTexture: {
            parameters: [{
              name: 'TEXTURE_MAG_FILTER',
              value: 'LINEAR'
            }, {
              name: 'TEXTURE_MIN_FILTER',
              value: 'LINEAR',
              generateMipmap: false
            }]
          },
          bindToRenderBuffer: false
        });
      }
      program.use();
      app.setFrameBuffer(framebuffer, true);
      gl.viewport(x, y, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      program.setUniforms(opt.uniforms || {});
      scene.renderToTexture(framebuffer);
      app.setFrameBuffer(framebuffer, false);
    }

    if (screen) {
      program.use();
      gl.viewport(x, y, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      program.setUniforms(opt.uniforms || {});
      scene.render();
    }

    return this;
  }

}
