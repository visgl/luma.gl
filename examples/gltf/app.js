import {GLTFParser} from '@loaders.gl/gltf';
import {AnimationLoop, setParameters, clear, GLTFInstantiator, log} from 'luma.gl';
import {Matrix4, radians} from 'math.gl';
import document from 'global/document';

const GLTF_BASE_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/";

const INFO_HTML = `
<p><b>glTF</b> rendering.</p>
<p>A luma.gl <code>glTF</code> renderer.</p>
<div>
  Model
  <select id="modelSelector">
    <option value="Avocado/glTF-Binary/Avocado.glb">Avocado</option>
    <option value="AnimatedMorphCube/glTF-Binary/AnimatedMorphCube.glb">AnimatedMorphCube</option> 
    <option value="DamagedHelmet/glTF-Binary/DamagedHelmet.glb">DamagedHelmet</option>
    <option value="TextureCoordinateTest/glTF-Binary/TextureCoordinateTest.glb">TextureCoordinateTest</option>
    <option value="VertexColorTest/glTF-Binary/VertexColorTest.glb">VertexColorTest</option>
    <option value="BoxVertexColors/glTF-Binary/BoxVertexColors.glb">BoxVertexColors</option>
    <option value="Box/glTF-Binary/Box.glb">Box</option>
    <option value="BoxTexturedNonPowerOfTwo/glTF-Binary/BoxTexturedNonPowerOfTwo.glb">BoxTexturedNonPowerOfTwo</option>
    <option value="InterpolationTest/glTF-Binary/InterpolationTest.glb">InterpolationTest</option>
    <option value="BoxInterleaved/glTF-Binary/BoxInterleaved.glb">BoxInterleaved</option>
    <option value="BoomBox/glTF-Binary/BoomBox.glb">BoomBox</option>
    <option value="Buggy/glTF-Binary/Buggy.glb">Buggy</option>
    <option value="CesiumMan/glTF-Binary/CesiumMan.glb">CesiumMan</option>
    <option value="AlphaBlendModeTest/glTF-Binary/AlphaBlendModeTest.glb">AlphaBlendModeTest</option>
    <option value="Duck/glTF-Binary/Duck.glb">Duck</option>
    <option value="MorphPrimitivesTest/glTF-Binary/MorphPrimitivesTest.glb">MorphPrimitivesTest</option>
    <option value="MorphPrimitivesTest/glTF-Draco/MorphPrimitivesTest.glb">MorphPrimitivesTest</option>
    <option value="2CylinderEngine/glTF-Binary/2CylinderEngine.glb">CylinderEngine</option>
    <option value="Lantern/glTF-Binary/Lantern.glb">Lantern</option>
    <option value="MultiUVTest/glTF-Binary/MultiUVTest.glb">MultiUVTest</option>
    <option value="WaterBottle/glTF-Binary/WaterBottle.glb">WaterBottle</option>
    <option value="BrainStem/glTF-Binary/BrainStem.glb">BrainStem</option>
    <option value="BarramundiFish/glTF-Binary/BarramundiFish.glb">BarramundiFish</option>
    <option value="NormalTangentMirrorTest/glTF-Binary/NormalTangentMirrorTest.glb">NormalTangentMirrorTest</option>
    <option value="ReciprocatingSaw/glTF-Binary/ReciprocatingSaw.glb">ReciprocatingSaw</option>
    <option value="UnlitTest/glTF-Binary/UnlitTest.glb">UnlitTest</option>
    <option value="MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb">MetalRoughSpheres</option>
    <option value="TextureSettingsTest/glTF-Binary/TextureSettingsTest.glb">TextureSettingsTest</option>
    <option value="BoxAnimated/glTF-Binary/BoxAnimated.glb">BoxAnimated</option>
    <option value="VC/glTF-Binary/VC.glb">VC</option>
    <option value="AntiqueCamera/glTF-Binary/AntiqueCamera.glb">AntiqueCamera</option>
    <option value="OrientationTest/glTF-Binary/OrientationTest.glb">OrientationTest</option>
    <option value="CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb">CesiumMilkTruck</option>
    <option value="AnimatedMorphSphere/glTF-Binary/AnimatedMorphSphere.glb">AnimatedMorphSphere</option>
    <option value="RiggedSimple/glTF-Binary/RiggedSimple.glb">RiggedSimple</option>
    <option value="Corset/glTF-Binary/Corset.glb">Corset</option>
    <option value="RiggedFigure/glTF-Binary/RiggedFigure.glb">RiggedFigure</option>
    <option value="GearboxAssy/glTF-Binary/GearboxAssy.glb">GearboxAssy</option>
    <option value="NormalTangentTest/glTF-Binary/NormalTangentTest.glb">NormalTangentTest</option>
    <option value="SpecGlossVsMetalRough/glTF-Binary/SpecGlossVsMetalRough.glb">SpecGlossVsMetalRough</option>
    <option value="Monster/glTF-Binary/Monster.glb">Monster</option>
    <option value="BoxTextured/glTF-Binary/BoxTextured.glb">BoxTextured</option>
  </select>
  <br>
</div>
`;

export const animationLoopOptions = {
  models: [],
  gl: null,
  loadedModelUrl: null,

  loadGLTF: url => {
    window.fetch(url).then(res => res.arrayBuffer()).then(data => {

      const gltfParser = new GLTFParser();
      const gltf = gltfParser.parse(data);

      const instantiator = new GLTFInstantiator(animationLoopOptions.gl);
      const lumaScenes = instantiator.instantiate(gltf);

      log.info(4, "gltfParser: ", gltfParser)();
      log.info(4, "instantiator.instantiate(): ", lumaScenes)();

      animationLoopOptions.models = [];

      lumaScenes[0].traverse(node => {
        log.info(4, "Using model: ", node)();
        animationLoopOptions.models.push(node);
      });
    });
  },

  onInitialize: ({gl}) => {

    setParameters(gl, {
      depthTest: true
    });

    animationLoopOptions.gl = gl;
    const modelSelector = document.getElementById("modelSelector");
    animationLoopOptions.loadGLTF(GLTF_BASE_URL + modelSelector.value);

    modelSelector.onchange = event => {
      animationLoopOptions.models = [];
      animationLoopOptions.loadGLTF(GLTF_BASE_URL + modelSelector.value);
    };
  },

  onRender: ({gl, tick, width, height, aspect, models}) => {
    gl.viewport(0, 0, width, height);
    clear(gl, {color: [0, 0, 0, 1], depth: true});

    const uView = new Matrix4().lookAt({eye: [0, 2, 2], center: [0, 0, 0], up: [0, 1, 0]}).rotateXYZ([0, tick * 0.01, 0]);
    const uProjection = new Matrix4().perspective({fov: radians(25), aspect, near: 0.1, far: 5000});

    animationLoopOptions.models.forEach(model => {
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

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = animationLoop.getInfo();
  document.body.appendChild(infoDiv);
}
