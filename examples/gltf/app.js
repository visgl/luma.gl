import {GLTFParser} from '@loaders.gl/gltf';
import {AnimationLoop, setParameters, clear, GLTFInstantiator, log} from 'luma.gl';
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

    window.fetch(GLTF_URL).then(res => res.arrayBuffer()).then(data => {

      const gltfParser = new GLTFParser();
      const gltf = gltfParser.parse(data);

      const instantiator = new GLTFInstantiator(gl);
      const lumaScenes = instantiator.instantiate(gltf);

      log.info(4, "gltfParser: ", gltfParser)();
      log.info(4, "instantiator.instantiate(): ", lumaScenes)();

      lumaScenes[0].traverse(node => {
        log.info(4, "Using model: ", node)();
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

    const uView = new Matrix4().lookAt({eye: [0, 0.8, 1], center: [0, 0, 0], up: [0, 1, 0]}).rotateXYZ([0, tick * 0.01, 0]);
    const uProjection = new Matrix4().perspective({fov: radians(5), aspect, near: 0.01, far: 5000});

    models.forEach(model => {
      model.draw({
        uniforms: {
          uModel: model.matrix,
          uView,
          uProjection
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
