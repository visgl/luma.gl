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

class DemoApp {
  constructor() {
    this.scenes = [];
    this.gl = null;
    this.loadedModelUrl = null;

    this.glOptions = {
      // TODO: Make gltf work with webgl2
      webgl2: false
    };

    this.mouse = {
      lastX: 0,
      lastY: 0
    };

    this.translate = 2;
    this.rotation = [0, 0];
    this.rotationStart = [0, 0];

    this.onInitialize = this.onInitialize.bind(this);
    this.onRender = this.onRender.bind(this);
  }

  loadGLTF(url) {
    window.fetch(url).then(res => res.arrayBuffer()).then(data => {

      const gltfParser = new GLTFParser();
      const gltf = gltfParser.parse(data);

      const instantiator = new GLTFInstantiator(this.gl);
      this.scenes = instantiator.instantiate(gltf);

      log.info(4, "gltfParser: ", gltfParser)();
      log.info(4, "instantiator.instantiate(): ", this.scenes)();

      this.scenes[0].traverse((node, {worldMatrix}) => {
        log.info(4, "Using model: ", node)();
      });
    });
  }

  onInitialize({gl, canvas}) {
    setParameters(gl, {
      depthTest: true
    });

    this.gl = gl;
    const modelSelector = document.getElementById("modelSelector");
    this.loadGLTF(GLTF_BASE_URL + modelSelector.value);

    modelSelector.onchange = event => {
      this.models = [];
      this.loadGLTF(GLTF_BASE_URL + modelSelector.value);
    };

    // Events
    canvas.onwheel = e => {
      this.translate += e.deltaY / 10;
      if (this.translate < 0.5) {
        this.translate = 0.5;
      }
      e.preventDefault();
    };
    canvas.onpointerdown = e => {
      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;

      this.rotationStart[0] = this.rotation[0];
      this.rotationStart[1] = this.rotation[1];

      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    canvas.onpointermove = e => {
      if (e.buttons) {
        const dX = e.clientX - this.mouse.lastX;
        const dY = e.clientY - this.mouse.lastY;

        this.rotation[0] = this.rotationStart[0] + dY / 100;
        this.rotation[1] = this.rotationStart[1] + dX / 100;
      }
    };
  }

  onRender({gl, tick, width, height, aspect}) {
    gl.viewport(0, 0, width, height);
    clear(gl, {color: [0, 0, 0, 1], depth: true});

    const [pitch, roll] = this.rotation;
    const cameraPos = [
      -this.translate * Math.sin(roll) * Math.cos(-pitch),
      -this.translate * Math.sin(-pitch),
      this.translate * Math.cos(roll) * Math.cos(-pitch)
    ];

    const uView = new Matrix4()
      .translate([0, 0, -this.translate])
      .rotateX(pitch)
      .rotateY(roll);

    const uProjection = new Matrix4().perspective({fov: radians(40), aspect, near: 0.1, far: 9000});

    if (!this.scenes.length) return;

    this.scenes[0].traverse((model, {worldMatrix}) => {
      // In glTF, meshes and primitives do no have their own matrix.
      const u_MVPMatrix = new Matrix4(uProjection).multiplyRight(uView).multiplyRight(worldMatrix);
      model.draw({
        uniforms: {
          u_Camera: cameraPos,
          u_MVPMatrix,
          u_ModelMatrix: worldMatrix,
          u_NormalMatrix: new Matrix4(worldMatrix).invert().transpose()
        }
      });
    });
  }
}

const animationLoop = new AnimationLoop(new DemoApp());

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  animationLoop.start();

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = animationLoop.getInfo();
  document.body.appendChild(infoDiv);
}
