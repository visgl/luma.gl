/* eslint-disable no-var, max-statements, indent, no-multi-spaces */
import {GL, AnimationLoop, setParameters} from 'luma.gl';
import {loadImages} from 'luma.gl';
import {Sphere, Matrix4, Vec3, PerspectiveCamera} from 'luma.gl';

// loadProgram(gl, {
//   vs: '../../../src/shaderlib/spec-map.vs.glsl',
//   fs: '../../../src/shaderlib/spec-map.fs.glsl'
// }),

const animationLoop = new AnimationLoop({
  //.context(() => createGLContext({canvas: 'lesson05-canvas'}))
  onInitialize: ({gl}) => {

    setParameters({
      depthTest: true,
      depthFuncL: GL.LEQUAL
    });

    return loadImages(gl, {
      urls: ['earth.jpg', 'earth-specular.gif']
    })
    .then(results => {
      var tDiffuse = new Texture2D(gl, {
        image: results[0],
        mipmap: true,
        parameters: {
          [GL.MAG_FILTER]: GL.LINEAR,
          [GL.MIN_FILTER]: GL.LINEAR_MIPMAP_NEAREST
        }
      });
      var tSpecular = new Texture2D({
        image: results[1],
        mipmap: true,
        parameters: {
          [GL.MAG_FILTER]: GL.LINEAR,
          [GL.MIN_FILTER]: GL.LINEAR_MIPMAP_NEAREST
        }
      });

      var earth = new Sphere(gl, {
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
  },
  onFinalize: ({earth, tDiffuse, tSpecular}) => {
    earth.delete();
    tDiffuse.delete();
    tSpecular.delete();
  },
  onRenderFrame: ({gl, aspect, earth}) => {
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
  }
});

animationLoop.getInfo = () => {
  return `
<div id="controls">
  <input type="checkbox" id="color-map" checked /> Show color map<br/>
  <input type="checkbox" id="specular-map" checked /> Show specular map<br/>
  <input type="checkbox" id="lighting" checked /> Use lighting<br/>

  <h2>Point light:</h2>
  <table style="border: 0; padding: 10px;">
  <tr>
  <td><b>Location:</b>
  <td>X: <input type="text" id="lightPositionX" value="-10.0" />
  <td>Y: <input type="text" id="lightPositionY" value="4.0" />
  <td>Z: <input type="text" id="lightPositionZ" value="-20.0" />
  </tr>
  <tr>
  <td><b>Specular colour:</b>
  <td>R: <input type="text" id="specularR" value="5.0" />
  <td>G: <input type="text" id="specularG" value="5.0" />
  <td>B: <input type="text" id="specularB" value="5.0" />
  </tr>
  <tr>
  <td><b>Diffuse colour:</b>
  <td>R: <input type="text" id="diffuseR" value="0.8" />
  <td>G: <input type="text" id="diffuseG" value="0.8" />
  <td>B: <input type="text" id="diffuseB" value="0.8" />
  </tr>
  </table>

  <h2>Ambient light:</h2>
  <table style="border: 0; padding: 10px;">
  <tr>
  <td><b>Colour:</b>
  <td>R: <input type="text" id="ambientR" value="0.4" />
  <td>G: <input type="text" id="ambientG" value="0.4" />
  <td>B: <input type="text" id="ambientB" value="0.4" />
  </tr>
  </table>

  <br/>
  Galvanized texture courtesy of
  <a href="http://www.arroway-textures.com/">
    Arroway Textures
  </a>.<br/>
  Earth texture courtesy of the
  <a href="http://www.esa.int/esaEO/SEMGSY2IU7E_index_0.html">
    European Space Agency/Envisat
  </a>.<br/>
  <br/>

    <a href="http://learningwebgl.com/blog/?p=1658">&lt;&lt; Back to Lesson 15</a><br />
</div>
`;
};

function getSettings() {
  const $id = d => document.getElementById(d);

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

export default animationLoop;
