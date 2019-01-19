import {GLTFParser} from '@loaders.gl/gltf';
import GL from '@luma.gl/constants';
import {AnimationLoop, Framebuffer, Cube, setParameters, clear, GLTFInstantiator, Texture2D} from 'luma.gl';
import {Matrix4, radians} from 'math.gl';

// const GLTF_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/2CylinderEngine/glTF-Binary/2CylinderEngine.glb";
const GLTF_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb";

const INFO_HTML = `
<p>
  <b>glTF</b> rendering.
<p>
A luma.gl <code>glTF</code> renderer.
`;

export const animationLoopOptions = {

  onInitialize: ({gl}) => {
    const models = [];

    const gltfParser = new GLTFParser();
    fetch(GLTF_URL).then(res => res.arrayBuffer()).then(data => {
      gltfParser.parse(data);
      const instantiator = new GLTFInstantiator(gl, {
        getImage: index => {
          const img = gltfParser.getImage(index).image;
          const promise = new Promise(resolve => {
            img.onload = () => {
              resolve(new Texture2D(gl, { data: img, format: GL.RGB }));
            };
          });

          return promise;
        }
      });
      const scene = gltfParser.getScene(0);
      const lumaScene = instantiator.createScene(gltfParser.getScene(0));
      console.log("gltfParser.getScene(0) = ", scene);
      console.log("gltfParser = ", gltfParser);
      console.log("lumaScene = ", lumaScene);

      lumaScene.traverse(node => {
        console.log("N=", node);
        models.push(node);
      });
    });

    setParameters(gl, {
      depthTest: true
    });

    return {
      models
    };
  },

  onRender: ({gl, tick, width, height, aspect, models}) => {
    gl.viewport(0, 0, width, height);
    clear(gl, {color: [0, 0, 0, 1], depth: true});

    const camView = new Matrix4().lookAt({eye: [0, 0.8, 1], center: [0, 0, 0], up: [0, 1, 0]}).rotateXYZ([0, tick * 0.01, 0]);
    const camProj = new Matrix4().perspective({fov: radians(5), aspect, near: 0.01, far: 5000});

    models.forEach(model => {
      // console.log("RENDER", model);
      model.draw({
        uniforms: {
          uModel: model.matrix,
          uView: camView,
          uProjection: camProj
        }
      });
    })
  }
};

const animationLoop = new AnimationLoop(animationLoopOptions);

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  animationLoop.start();
}
