/* eslint-disable no-var, max-statements */
/* global LumaGL */
/* eslint-disable no-var, max-statements, indent, no-multi-spaces */
const {GL, AnimationLoop, createGLContext, loadImages, loadProgram} = LumaGL;
const {Sphere, Matrix4, Vec3, PerspectiveCamera} = LumaGL;

export const animation = new AnimationLoop()
.context(() => createGLContext({canvas: 'lesson05-canvas'}))
.init(({gl}) => {
  gl.enable(GL.DEPTH_TEST);
  gl.depthFunc(GL.LEQUAL);

  return Promise.all([
    loadProgram(gl, {
      vs: '../../../src/shaderlib/spec-map.vs.glsl',
      fs: '../../../src/shaderlib/spec-map.fs.glsl'
    }),
    loadImages(gl, {
      urls: ['earth.jpg', 'earth-specular.gif']
    })
  ])
  .then(results => {
    var program = results[0];

    var tDiffuse = new Texture2D({
      image: results[1][0],
      generateMipmap: true,
      parameters: {
        [GL.MAG_FILTER]: GL.LINEAR,
        [GL.MIN_FILTER]: GL.LINEAR_MIPMAP_NEAREST
      }
    });
    var tSpecular = new Texture2D({
      image: results[1][1],
      generateMipmap: true,
      parameters: {
        [GL.MAG_FILTER]: GL.LINEAR,
        [GL.MIN_FILTER]: GL.LINEAR_MIPMAP_NEAREST
      }
    });

    var earth = new Sphere({
      nlat: 30,
      nlong: 30,
      radius: 2,
      program,
      uniforms: {
        shininess: 32,
        hasTexture1: true,
        sampler1: tDiffuse,
        hasTexture2: true,
        sampler2: tSpecular
      },
      attributes: {
        colors: {size: 4, value: new Float32Array([1, 1, 1, 1])}
      }
    });

    return {earth};
  });
})
.frame(({gl, aspect, earth}) => {
  earth.setUniforms({
    enableSpecularMap: specularMap.checked,
    enableColorMap: colorMap.checked
  });

  var camera = new PerspectiveCamera({aspect, position: new Vec3(0, 0, -6)});

  // Update position
  earth.setRotation(new Vec3(Math.PI, tick * 0.01, 0.1));
  earth.updateMatrix();

  // render objects
  earth.render(camera.getUniforms());
})
.finalize(({earth, tDiffuse, tSpecular}) => {
  earth.delete();
  tDiffuse.delete();
  tSpecular.delete();
});

function $id(d) {
  return document.getElementById(d);
}

function getSettings() {
  var specularMap = $id('specular-map');
  const colorMap = $id('color-map');
  // get light config from forms
  const lighting = $id('lighting');
  const ambient = {
    r: $id('ambientR'),
    g: $id('ambientG'),
    b: $id('ambientB')
  };
  const point = {
    x: $id('lightPositionX'),
    y: $id('lightPositionY'),
    z: $id('lightPositionZ'),

    sr: $id('specularR'),
    sg: $id('specularG'),
    sb: $id('specularB'),

    dr: $id('diffuseR'),
    dg: $id('diffuseG'),
    db: $id('diffuseB')
  };

  // Setup lighting
  var lights = scene.config.lights;
  lights.enable = lighting.checked;
  lights.ambient = {
    r: Number(ambient.r.value),
    g: Number(ambient.g.value),
    b: Number(ambient.b.value)
  };
  lights.points = {
    diffuse: {
      r: Number(point.dr.value),
      g: Number(point.dg.value),
      b: Number(point.db.value)
    },
    specular: {
      r: Number(point.sr.value),
      g: Number(point.sg.value),
      b: Number(point.sb.value)
    },
    position: {
      x: Number(point.x.value),
      y: Number(point.y.value),
      z: Number(point.z.value)
    }
  };
}
