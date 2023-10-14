# luma.gl CHANGELOG

## 8.6.0-dev.0

## v8.5.21

- Fix GLTF model defines (#1807)

## v8.5.20

- Fix cssToDeviceRatio when auto resize is disabled (#1746)

## v8.5.19

- Add getBounds() to ScenegraphNode (#1735)

## v8.5.18

- fix(resource): allocate/deallocate memory fix (#1665)
- chore: Disable texture transform tests failing on CI (#1670)
- [docs] update doc version badges (#1663)

## v8.5.17

- chore(webgl): separate mem stats another way (#1660)

## v8.5.16

- chore(gltf-material-parser.d.ts): add delete method (#1650)
- chore: Upgrade to probe.gl@3.5.0 (#1653)

## v8.5.15

- chore(webgl): separate memory stats by canvas id (#1651)

## v8.5.14

- Add @types/offscreencanvas dependency (#1649)

## v8.5.13

- Export GLTFAnimator for deck.gl (#1647)

## v8.5.12

- fix(minification): constructor name issue (#1631)
- chore(texture): change compressed textures memory calculation (#1640)

## v8.5.11

- Replace global from probe.gl/env with globalThis (#1643)
- Cleanup generated textures (#1639)

## v8.5.10

- Revert remove overly broad platform defines (#1496)

## v8.5.9

- Revert Improve context state tracking (#1513)

## v8.5.8

- Improve context state tracking (#1513)
- Fix outdated parameter cache (#1510)

## v8.5.7

- chore(webgl): get rid of circular references (#1499)

## v8.5.6

- Remove overly broad platform defines (#1496)
- Fix animation frame scheduling and cancellation (#1495)

## v8.5.5

- Work around fp32 compile error in Safari 15 (#1491)

## v8.5.4

- Fix transpilation of array variables (#1485)

## v8.5.3

- Fix transpiling minified shader (#1482)

## v8.5.2

- Bump probe.gl and loaders.gl (#1479)

## v8.5.1

- chore: bump loaders.gl and probe.gl (#1478)
- bump: math.gl@3.5.0 (#1477)

## v8.5.0

- Bump dependencies to beta (#1476)
- Transpile gl_FragColor in fragment shader from ES 1.00 to 3.00 (#1475)
- Fix constants bundle namespace (#1469)

## v8.5.0-alpha.2

- Shadertools: add magnify effect (#1464)
- gltf: support compressed textures (#1461)
- gltf: export GLTFMaterialParser (#1462)
- chore(typescript): minor typescript changes (#1459)

## v8.5.0-alpha.1

- Change build targets (#1455)
- Bump loaders dependency to 3.0.0-alpha (#1456)

## v8.4.4

- Fix isWebGL check on non-instrumented context (#1454)

## v8.4.3

- exposed webgl context state from animation loop (#1453)

## v8.4.2

- feat(shadertools): GLSL transpilation improvements (#1451)

## v8.4.1

- Fix peerDependencies of packages (#1447)
- Fix shader module injection order (#1449)

## v8.4.0

- Fix video texture error when video is still loading (#1443)
- do not set Texture data until the first frame of a video is loaded (#1445)

## v8.4.0-beta.2

- Callbacks for onContextLost / onContextRestored events (#1441)
- Fix AnimationLoop drawing buffer resize (#1442)

## v8.4.0-beta.1

- Improved engine typings (#1438)
- chore(webgl): typescript typing improvements (#1437)
- feat(webgl): typings (#1436)
- webgl: texture - support compressed textures (#1434)
- feature(engine): typescript typings (#1433)
- feat(experimental): typescript typings (#1429)
- chore: Supporting updates for typescript (#1430)
- chore: Use `@math.gl/core` instead of `math.gl` (#1432)
- feat(gltools): typescript typings (#1428)
- chore(shadertools): Remove duplicates (#1427)
- Docs: Make clear that count is derived from the length of points array (#1424)
- feat(shadertools): typescript typings (#1426)
- Fix shader compilation test failures (#1423)
- Make sure animationLoop's onError catches context creation errors (#1419)

## v8.4.0-alpha.1

- Texture supports continuous update from HTMLVideoElement (#1418)

## v8.3.0

## v8.3.0-beta.1

- Support for PBR material.unlit (#1405)
- webgl: Add typescript types (#1403)

## v8.2.0

- Fix bug when a model is deleted multiple times (#1390)

## v8.2.0-beta.1

- gltf: Remove DracoLoader import (#1386)
- bump math.gl and loaders.gl (#1388)

## v8.1.3

- Fix peerDependencies (#1384)

## v8.1.2

- Picking module: normalize highlight color (#1379)
- Add onError prop to AnimationLoop (#1377)

## v8.1.1

- Fix error handling in createGLContext (#1375)

## v8.1.0

- Bump deps (#1372)

## v8.1.0-beta.3

- Limit shader variable hoisting to injected declararions (#1371)

## v8.1.0-beta.2

- Use 32-bit indices in SphereGeometry if there are enough vertices (#1369)
- Bump deps (#1365)

## v8.1.0-beta.1

- Assemble shader variables to top of source (#1363)
- GPU Accelerated Point In Polygon Test (#1360)
- RFC: GPU Accelerated Polygon Clipping (#1350)
- Update ocular-gatsby and tweak website (#1357)
- Upgrade website to the latest gatsby-theme-ocular (#1351)
- Fix model and program logging (#1355)
- Allow size and offset to be set when constructing buffer (#1354)

## v8.1.0-alpha.2

- Delete VAO when vertex array is deleted (#1353)
- Fix SphereGeometry indices (#1352)
- Fix broken link (#1346)

## v8.1.0-alpha.1

- Only use texture LOD in GLTF if supported. (#1347)
- Fix transpilation (#1344)
- Full shader transpilation (#1342)
- [Chore]: Skip draw when when rendering 0 primitives (#1340)
- Fix overwriting of page load promise (#1338)
- VAO polyfill (#1334)

## v8.0.0-beta.4

- Bump math.gl and probe.gl to the latest production versions (#1320)

## v8.0.0-beta.3

- Small optimizations to texture checks and program updates (#1317)
- Bump loaders.gl to 2.0-beta (#1318)

## v8.0.0-beta.2

- Export fp64-arithmetic shader module (#1309)
- Upgrade probe.gl (#1310)

## v8.0.0-beta.1

- Reduce core to modules used by deck.gl (#1303)

## v8.0.0-alpha.11

- Reduce core to modules used by deck.gl (#1303)
- Rename addons to experimental (#1302)
- Set parameters assert (#1301)

## v8.0.0-alpha.10

- New module injection api (#1300)
- Move context creation/query functions to gltools (#1299)

## v8.0.0-alpha.7

- ClipSpace, getParameters, resolveModules fixes (#1297)

## v8.0.0-alpha.6

- Remove unpackFlipY option from Texture (#1295)
- Shadertools cleanup (#1296)
- (more-luma-cleanup) Small optimizations (#1294)
- Simplify and optimize state tracking (#1293)
- DevicePixelRatio: Handle invalid client sizes and remove custom width/height support. (#1290)

## v8.0.0-alpha.5

- Fix deps, simplify materials (#1292)

## v8.0.0-alpha.3

- Fix deps, simplify materials (#1292)

## v8.0.0-alpha.3

- Update docs and examples (#1291)

## v8.0.0-alpha.2

- Module refactor (#1288)
- Fix usage with rollup (#1266)
- Optimizations (#1283)
- Used device pixel ratio in picogl stress test
- PicoGL port of stress test for comparison (#1284)
- Update RFC and change status to approved (#1282)
- Transform Fix: elmentCount update, feedback buffer creation (#1281)
- Remove docs for removed classes (#1280)
- Remove core/multipass, main, wip folder (#1278)
- Remove CameraNode, Lights, Materials (#1279)
- Model cleanup (#1276)
- Prettier
- Tweak stress test
- Prettier
- Simplify stress test
- Improve startup time of stress test app
- Stress test (#1271)

## v7.4.0-alpha.2

- DevicePixelRatio: Cache canvas size to avoid expensive setting on each frame (#1269)
- WebGL Features: add caching (#1270)

## v7.4.0-alpha.1

- Add attribute picking to the picking module (#1268)

## v7.3.0

- Update links
- Fix inlined version in published package (#1262)

## v7.3.0-beta.3

- Bump to latest probe version (#1260)

## v7.3.0-beta.3

- Update checking support for rendering to float textures (#1257)
- What's new typo
- Fix hashing of injects (#1253)
- ProgramManager example (#1254)
- Program sharing perf in what's new (#1255)
- Add new Transform test case (#1246)

## v7.3.0-beta.2

- Bump probe.gl version (#1245)
- Don't set VertexArrayObject.isDefaultArray (#1247)

## v7.3.0-beta.1

- Cleanup VAO fix and test (#1243)
- Fix loaders.gl link in docs (#1242)
- Do to clear the VertexArray elements buffer when unbind… (#1238)
- Fix getting started button on gatsby site (#1241)

## v7.3.0-alpha.9

- Bump math.gl, loaders.gl and probe.gl versions (#1240)
- Updated examples link in npm start command (#1237)
- ensure assembleShader always sets the GLSL version (#1206)
- Handle cases when canvas is not defined (#1236)
- Make sure getModuleUniforms is updated on program change. (#1235)

## v7.3.0-alpha.8

- Tranform Refactor: fix regressions (#1234)
- Add support for specifying custom device pixel ratio. (#1155)
- bump math.gl version (#1233)
- Upgrade ocular gatsby to 1.0.0 and fix glTF example (#1231)
- Transform refactor (#1221)
- dev-tools: Bump to 0.0.29 (#1232)

## v7.3.0-alpha.7

- Transform: Fix update of Buffers and elementCount. (#1224)
- point docs to release branch (#1229)
- update website fonts (#1227)
- Fix Framebuffer isSupported test (#1228)

## v7.3.0-alpha.6

- Program manager updates (#1226)
- RFC: Transform Refactor (#1219)
- Remove program diffing from program manager (#1225)

## v7.3.0-alpha.5

- Program manager updates (#1226)
- RFC: Transform Refactor (#1219)
- Remove program diffing from program manager (#1225)

## v7.3.0-alpha.5

- Fix double program release in base model (#1223)

## v7.3.0-alpha.4

- Program manager fixes (#1222)

## v7.3.0-alpha.3

- Fix program manager default module insertion (#1220)
- Ensure timeline handles are always truthy. (#1217)
- Program manager hooks (#1216)
- Avoid crashes in debug log on very small buffers (#1214)
- webgl: Avoid crashing debug log if attribute is null (#1213)

## v7.3.0-alpha.2

- Implement program manager (#1199)
- Add log to detect un-supported features (#1212)
- Add EXT_float_blend to feature table (#1210)
- babel-plugin-inline-webgl-constants@1.01

## v7.3.0-alpha.1

- Add Timeline.isFinished method (#1200)
- Fix resource leaks in Framebuffer and multipass classes (#1202)
- Gltf tests (#1204)
- add DOUBLE to gl constants (#1207)

## v7.2.0

- Bump loaders.gl to 1.2.0 (#1198)
- Doc: update urls to point to 7.2-release branch (#1197)
- Docs: update release badges (#1196)
- Bump luma version in examples (#1195)
- BaseModel: add back clear method (#1194)
- Fix gatsby website home page (#1192)
- Bump ocular-gatsby@1.0.0-alpha.46 (#1191)

## v7.2.0-beta.1

- webgl-state-tracker tests (#1187)
- Remove diffImagePixels from gpgpu (#1186)

## v7.2.0-alpha.6

- Transform: fix resource leak (#1188)
- Clean up model classes (#1185)
- AnimationLoopProxy tests (#1184)
- Allow animation loop to run with headless gl (#1183)
- remove addEvents from addons (#1180

## v7.2.0-alpha.5

- Transform : Texture API Changes (custom FS and fix clear) (#1182)
- Fixed Broken Link (#1177)
- Remove addEvents from examples (#1179)

## v7.2.0-alpha.4

- fix lighting module color format (#1174)
- Core: Add unit tests (transfromutils and multipass)
- Improve shadertools test coverage (#1172)
- Geometry bug fixes & tests (#1171)
- Clean up shader module tests (#1170)
- Debug module tests & bug fixes (#1169)

## v7.2.0-alpha.3

- New getDefaultShaderModules API (#1168)
- Fxaa (#1164)
- Add unit tests for all Scenegraph classes (#1166)
- add tests for dev-modules (#1167)
- Update coverage configs (#1165)
- support uniform texture and matrix array (#1162)
- fix texture2D type/dataFormat inference (#1159)
- remove Texture class's hasFloatTexture property (#1161)

## v7.2.0-alpha.2

- Support ImageBitmap in Texture (#1153)
- Fix injected declarations (#1152)

## v7.2.0-alpha.1

- Fix mipmap generation (#1148)
- Upgrade ocular-dev-tools (#1145)
- Ugly hack to fix headless.gl depency issue without breakages (#1143)

## v7.1.0

- Fix deprecation and texture in lesson 16 (#1141)
- Fix mouse controls for gltf example on safari (#1138)
- What's new fixes (#1142)
- fix website issues (#1140)
- Pare down what's new (#1139)
- Update dependencies, doc links for 7.1 (#1137)
- Add animation example to website (#1133)
- Fix dependencies
- Documentation for v7.1 (#1132)
- Fix image loading paths in gatsby website examples (#1122)

## v7.1.0-alpha.6

- Consolidate injection APIs (#1130)
- Fix deprecated Buffer API usage (#1131)

## v7.1.0-alpha.5

- glfx API audit and documentation (#1128)
- Update ocular version
- Fix table contents height styling (#1125)
- Fix gltf-animator in example, fix timeline doc, add option to disable tangents (#1126)
- Fix yarn build command in gatsby website. (#1120)
- Remove out of date entries and cleanup table of contents config for ocular-gatsby site. (#1119)
- rename modules folder to shader-modules (#1118)

## v7.1.0-alpha.4

- Implementation of shader module code injection (#1110)
- Fix dependency versions (#1116)
- Upgrade browser testing setup (#1117)
- Bump ocular-gatsby (#1115)

## v7.1.0-alpha.2

- Keyframes implementation (#1113)
- Fix for chromium GLSL compiler issue (#1114)
- Fix setMatrix in scenegraph node (#1111)
- refactor convolution pass to shader module (#1109)
- move shader modules from glfx to effects (#1107)
- Framebuffer set buffers fix (#1102)
- effects module RFC (#1103)
- Update RFC status
- Update RFC docs
- Shader Module Injection RFC (#1096)
- change current shader modules and passes to be experimental (#1106)
- Final key frame RFC fixes
- Key frame management rfc (#1100)
- Fix glfx example (#1104)
- Migrate build badge from travis-ci.org to travis-ci.com. (#1098)
- Fix dependencies

## v7.1.0-alpha.1

- Implementation of Timeline RFC (#1093)
- Check for navigator before accessing (#1095)

# 7.0 Pre-releases

## v7.0.0-rc.2

- Fix gltf loader (#1066)

## v7.0.0-beta.8

- Fix isWebGL2 methods. (#1053)

## v7.0.0-beta.7

- Get rid of accessor warnings that are always triggered. (#1051)
- Vertex count for constant attribute geos with no indices (#1052)
- Update doc table of contents to fix and remove links to missing/changed docs. (#1049)
- Fix texture3d example (#1050)
- Add missing thumbnail images for website examples - dof, gltf, persistence. (#1047)
- Add Display to AnimationLoop (#1043)
- Fix vr-display (#1045)
- WIP: Make DisplayAnimationLoop smaller (#1041)
- Rename `core/src/core` to `core/src/lib` (#1040)
- Geometries allow attributes to added/overridden (#1038)
- Add `examples` folder to lint/prettier target, run prettier, fix issues (#1039)
- Remove attribute (#1019)
- Implementation: VR Display (#1032)
- Fix Histopyramid Unit tests, eanble Transform Unit test. (#1037)

## v7.0.0-beta.6

- don't need enable lighting flag with only material (#1035)

## v7.0.0-beta.5 - Apr 4, 2019

- Model handles geometry with constant attributes (#1034)
- glTF Loader: Allow to async return after all resources are loaded (#1029)
- Gatsby update (#1030)

## v7.0.0-beta.4 - Apr 3, 2019

- Fix attribute handling for matrices (#1033)
- docs (#1031)
- New golden image
- Fix lessons (#1028)
- Add managedResources to ModelNode (#1022)

## v7.0.0-beta.3 - Apr 2, 2019

- Fix overly strict peer dependencies (#1026)

## v7.0.0-beta.2 - Apr 2, 2019

- move @luma.gl/core to peerDependencies (#1023)

## v7.0.0-beta.1 - Apr 1, 2019

- s/onInitailize/onInitialize (#1020)
- Delete old buffers when auto-created in Model (#1016)
- scenegraph-node delete() (#1014)
- Export gouraud lighting module (#1018)
- bump
- Ib/restore debug context (#1015)
- Initial round of fixes (#1013)
- Create GLTFScenegraphLoader and change example to use it (#1012)

## v7.0.0-alpha.20 - Mar 28, 2019

- glTF geometries (#1003)
- Clean up root (#1001)

## v7.0.0-alpha.19 - Mar 27, 2019

- Remove geometry scenegraph nodes (#1010)
- Restore model id (#1011)
- Remove redraw flag handling (#1006)
- reduce default phong material specular color (#1008)
- Fix transform feedback example (#1009)
- Move glTF instantiator to modules/addons (#1007)
- Add some test plumbing for coverage (#986)
- Models don't create buffers (#1005)

## v7.0.0-alpha.18 - Mar 15, 2019

- WebVR VRAnimationLoop (#941)
- Add CubeTexture LOD support (#987)
- Doc and example fixes (#1004)
- Remove old websites (#1002)
- Remove unused/unfinished classes (#1000)
- Remove imports of external assert (#999)
- Break out @luma.gl/webgl module (#983)
- Fixes for the new linter rules (#995)
- Add lint rules for imports (#993)
- Update imports to @luma.gl/core (#992)
- Break out scenegraph module (with glTF code) (#982)
- Update website to latest ocular-gatsby (#991)
- Update examples (#990)
- Track GPU memory usage (#984)
- Update Scenegraph docs (#988)

## v7.0.0-alpha.17 - Mar 15, 2019

- remove duplicated uniforms (#989)
- Proposal: Unified lights array (#948)

## v7.0.0-alpha.16 - Mar 15, 2019

- Fix TextureCube using promises as data (#926)
- glTF/PBR: Add ability to switch between IBL and Regular Lights (#985)
- Remove Attribute refactor related deprecation warnings in luma.gl tests and examples (#975)
- Add new @luma.gl/addons module (#981)
- integrate shadertools lighting with phong-lighting (#949)
- Convert PBR to use Standard Light parameters, Part 3 (#944)
- Convert PBR to use Standard Light parameters, Part 2 (#943)
- Convert PBR to use Standard Light parameters, Part 1 (#939)
- Separate out code that prepares lighting uniforms
- New StatsWidget API for examples (#980)
- Texture3D (#978)
- Add needsRedraw reasons to waitForRender and toDataURL (#974)

## v7.0.0-alpha.15 - Mar 12, 2019

- Fix bug in snapshot test runner (#968)
- Move waitForRender resolve into core render loop. Use for toDataURL (#971)
- WebGL2 Polyfill Cleanup (#970)
- Feature cleanup (#963)
- Fix perf test (#966)
- Fix bad merge in examples/gltf from PR.952 (#967)
- fix start-local in examples (#965)
- Add firstFrame() method to AnimationLoop (#930)
- touch up table of contents (#917)
- Doc reorg/partial cleanup for glTF/materials/lights (#952)
- Move tests for each module into `modules/<submodule>/test` (#960)
- Replace dev scripts with ocular-dev-tools (#956)

## v7.0.0-alpha.14 - Mar 11, 2019

- Ensure that externally created contexts are polyfilled, tracked (#954)
- Add support for mat attribute types (#959)
- Add draco glTF compression support (#957)
- Move wip code out of /src (#955)
- Stats update (#953)
- Expose glTF API as function call (#951)
- Query cleanup (#950)
- Fix WebGL 2 timer polyfills (#946)
- glTF: Handle alpha mask and blend (#945)
- Don't create no-op Promises for queries (#942)

## v7.0.0-alpha.13 - Mar 1, 2019

- new default material parameters (#940)
- Capturing canvas contents (#937)
- Use glTF loader 0.7.2 to load Embedded and Multi-File glTF files (#938)
- Frame timers (#934)
- glTF: Basic Animation support (#932)
- glTF demo app: load model index dynamically (#935)
- Don't perserve the drawing buffer (#931)
- [test-utils] Add performance test (#923)
- bug fixes for AnimationLoop start/stop functionality (#924)
- Test-utils bug fixes (#925)
- glTF Snapshot Tests (#913)
- glTF: Make PBR work with GLSL 3.0 (WebGL 2.0) (#916)
- [test-utils] Refactor TestRenderer (#922)

## v7.0.0-alpha.12 - Feb 20, 2019

- use "lightSources" in module parameters (#920)
- glTF: Add PBR debug options and ability to drag-and-drop GLB files (#914)
- [test-utils] Support async onInitialized in TestRenderer (#919)
- Expose program readiness when using async textures (#918)
- changes to support gatsby example homepage
- glTF: Add CubeTexture from environment (#902)
- Add test-utils submodule (1/2) (#910)
- fix TextureCube binding, add example to demonstrate (#901)
- modify blending of highlight color and object color (#912)

## v7.0.0-alpha.11 - Feb 13, 2019

- Add headless browser test (#904)
- New @luma.gl/effects module (#892)

## v7.0.0-alpha.10 - Feb 12, 2019

- add missing deps to modules/core/package.json

## v7.0.0-alpha.9 - Feb 11, 2019

- fix issue in modules/main/package.json

## v7.0.0-alpha.8 - Feb 11, 2019

- New @luma.gl/webgl-state-tracker module (#888)
- Integrate GLTF example in website
- Squash+Merge glTF feature branch (#877)
- Rename main module to @luma.gl/core. Add luma.gl module for backwards compatiblity (#889)
- Remove unused IO submodule (in favor of loaders.gl) (#890)
- New submodule @luma.gl/webgl2-polyfills (#883)
- Consolidate webgl code (prep for submodule) (#884)
- Update examples to use Async Textures (#880)
- Async Textures (#876)
- Create custom eslint rule to detect wrong probe.gl logger usage (#873)

## v7.0.0-alpha.7 - Jan 16, 2019

- add new lighting glsl API and better check for lighting_uEnabled. (#856)

## v7.0.0-alpha.6 - Jan 16, 2019

- Fix parameter forwarding in loadTextures (#853)

## v7.0.0-alpha.5 - Jan 16, 2019

- disable lighting by default (#852)
- Forward shadertools exports (temporarily) to avoid breaking deck.gl (#851)
- Add tests for missing attribute components (#850)
- Move shadertools to separate module (#847)

## v7.0.0-alpha.4 - Jan 14, 2019

- Attribute enhancements (#846)
- lighting docs (#841)
- Add tests for dev-modules; fix glsl-remove-comments bug (#844)
- Gatsby-based website (#830)
- Transform: rename buffer params (#843)
- Fix deprecated constant export (#840)

## v7.0.0-alpha.3 - Jan 7, 2019

- restrict scope of glsl comment remove plugin (#839)
- phong lighting module and new lighting classes (#836)
- Update copy-blit funciton names, unify parameter naming in all methods. (#829)
- Transform: Add offset/size support for feedback buffers. (#834)
- Prepare GPGPU module for publishing, move histopyramid methods. (#828)
- Update copy-and-blit.md
- update test dependency
- Move Framebuffer copy utitlity methods into global scope (#816)
- add pre-push to enable auto testing for push action
- Fix website build (#826)
- Remove old (duplicate) files (#825)
- Fix a crash (#824)
- Move makeDebugContext to `@luma.gl/debug` (#822)
- Create separate module for WebGL constants (#819)
- Histopyramid: Traversal (#814)
- Prepare dev modules for publish (#820)
- Move API Tracing to debug module (#818)
- Move shader module test util into debug submodule (#817)

## 7.0.0-alpha.2 - Dec 17, 2018

- Transform: fix Inject option (#812)
- Add reference to Histopyramid paper (#811)
- Merge pull request #808 from wentsul/handle-null-webgl-context
- retore stub after test completion
- Add utility methods for Histopyramid generation based on Transform (#803)
- blend auto-highlight color and original color when an object is picked (#799)
- Update polyfillContext extension initialization to non-iterable returned from getSupportedExtensions
- New RFCs (#804)
- Transform Texture functionality enhancements (#802)
- Add support for copyTexSubImage2D, misc fixes (#801)
- IE browser WA: disable adding draw_buffers extension to shader source (#794)

## 7.0.0-alpha.1 - Nov 29, 2018

- add shortcut for uniform parse (#796)
- Dof example (#769)
- Add plugin to strip GLSL comments (#792)
- move custom babel plugin to dev-modules (#791)
- Fix inline version in published builds (#790)

## 6.2.0-alpha.1 - Sep 25

- Transform: user parameters for viewport (#738)
- Part- 2 Transform: Texture support: add source destination texture support (#729)
- Add Khronos PBR Reference example (#737)
- Upgrade outdated lint, fix issues, introduce tree-shaking linter plugin (#736)
- Bump dependencies to take advantage of @babel/runtime (#735)
- Transform: remove assert on sourceBuffer (#733)
- Add babel runtime (#732)
- Part-1: Transform texture support: add shader and texture utility methods (#728)
- upgrade glsl-transpiler (#730)
- Minor fixes (#723)
- Fix browser script (#720)
- Add debug example (#726)
- Add Debugger Module (#722)
- Set up lerna (#721)
- RFC: Module Structure (#725)
- Fix build (#719)
- fix luma.gl bad links
- glfx: image processing shaders packaged as luma.gl modules, plus example (#717)
- Fix isWebGL2 (defeat GL constant inlining) (#716)
- ShaderModulePass (#712)
- Fix PLYLoader (#714)
- Use babel 7 config file (#713)
- Restore test coverage (#711)
- loaders.gl: Add DRACO decompression support (#661)
- loaders.gl: Exclude `fs` in browsers (#709)
- Merge pull request #708 from uber/xx/loaders.gl
- resolve comments
- remove unnecessary dependencies
- add loader .babelrc to fix es5 compile
- loaders.gl: GLTFInstantiator, initial plumbing (#707)
- Initial GLTFParser (#703)
- Disable `sideEffects` field to fix minified builds (#701)
- loaders.gl: Test reorganization (#699)
- loaders.gl@0.3.4
- loaders.gl@0.3.4
- loaders.gl@0.3.2
- loaders.gl@0.3.1

## 6.1.0 - Sep 6

## 6.1.0-alpha.3 - Aug 7

- picking shader module: Add Transform based unit tests (#636)
- Animation fixes (#637)
- Fix: re-register existing shader module if ignoreMultipleRegistrations = true (#639)
- RFC: WebGL1 support for Transform (#635)
- Update GPGPU roadmap doc (#634)
- Rename export: \_Transform to Transform (#624)
- FP64: Unit tests using `Transform` (#631)

## 6.1.0-alpha.2 - Aug 1

- Fix scripts for new module structure (#633)
- Fix test-fast script

## 6.1.0-alpha.1 - July 31

- Bump math.gl to 2.1.0-alpha (#629)
- Improve bundle size metrics (#627)
- POC: Multipass Rendering System (#616)
- Babel plugin to inline GLSL constants (DIST SIZE) (#561)
- Introduce `modules` directory structure (#625)
- Shader Module fp64: add const uniforms used in shader WAs (#622)
- Add roadmap documents (#619)
- Correct MDN link for blendFuncSeparate in docs (#617)

## 6.0.0 - July 18

- Update attribute docs (#613)
- Update luma.gl version to ^6.0.0 in examples (#614)

## 6.0.0-rc.1 - July 17

- Fix NPOT warnings (#611)
- deck.gl v6 cleanup (#605)
- Fix Transform demo link (#608)
- Fix: set constant attributes every time VertexArray is bound (#604)
- Update URLs to point to 6.0-release branch (#603)

## 6.0.0-beta.3 - July 12

- Fix: convert boolean uniforms to Numbers (#602)

## 6.0.0-beta.2 - July 11

- Fix multi-model render bug (#600)
- Update whats-new doc (#595)
- Fix: Uniform setting (#594)

## 6.0.0-beta.1 - July 3

- Buffer: add getElementCount (#592)
- Fix example (#593)
- Buffer: Remove reference to data (#588)
- Transform: Improve swap buffers (#586)

## 6.0.0-alpha.7 - June 27

- Fix shader injection (#587)
- Transform updates (#585)

## 6.0.0-alpha.6 - June 27

- Fix constant attribute bug (#584)

## 6.0.0-alpha.5 - June 27

- Fix buffer reuse (#582)

## 6.0.0-alpha.4 - June 27

- `unbindModels` param in `Model.transform` and `Transform.run` (#581)
- VertexArray.unbindBuffers(). Constant attribute logging, (#579)
- Fix ocular website (#580)
- various bug minor fixes (#578)
- Uniform animation (experimental) (#575

## 6.0.0-alpha.3 - June 25

- Fixes for deck.gl (#577)

## 6.0.0-alpha.2 - June 25

- Upgrade to math.gl@2.0.0
- Model, AnimationLoop - Code reorganization (#574)
- VertexArray #3: Move attribute handling to VertexArray (#557)
- Minor code/example cleanup for 6.0 (#571)
- Doc refresh for 6.0 (partial) (#570)
- Additional Transform and TransformFeedback cleanup (#569)
- Shader injection system (per RFC) (#546)
- Transform class - light refresh (#567)
- VertexArray #2: Add Accessor and ProgramConfiguration helper classes (#560)
- Ocular based website: initial directory (#564)
- Adopt new underscore convention for experimental exports (#563)
- Make polyfills for webgl1 optional (Dist Size Reduction) (#554)
- Update code to import GL from luma.gl/constants (#556)
- Code cleanup (#559)
- Doc Improvements (#558)

## 6.0.0-alpha.1 - June 13

- Fix log when using External buffer (#551)
- Code reorganization (#552)
- Update Picking Module to use GLSL 300 syntax (#549)
- Shader injection RFC cleanup (#547)
- Fix unit tests (#545)
- Update RFC catalog (#544)
- Developer Guide Improvements (#543)
- GLSL transpilation (GLSL 3.00 <-> GLSL 1.00) (#542)
- Shadertools doc refresh (#528)
- Clarify error message (#541)
- AnimationLoop improvements, QuasiCrystals example (#530)
- Remove old deprecated functionality for v6.0 - First pass (#539)
- Add Khronos VertexArrayObject polyfill (#536)
- Refactor Shadertools to enable new features to be added (#533)
- New RFCs for v6.0 (#534)
- Preparations to make shadertools independently publishable (#532)
- Add GLSL 3.00 vs 1.00 reference (#527)
- Move shadertools files into submodule structure (#529)
- Remove GL_ES define (#526)

## 5.3.0-alpha.4 - May 21

- Port fp64 utils from deck.gl (#518)
- Allow non-buffer supplied to Transform's sourceBuffers (#519)

## 5.3.0-alpha.3 - May 16

- Add Attribute class (#514)

## 5.3.0-alpha.2 - May 14

- Fix some docs typos (#512)
- Collect WebGL context code into one directory (#511)
- add verticalAxis opt to TruncatedConGeometry (#491)
- Initial draft of offscreen rendering RFC (#510)
- Add off screen rendering example (PR 2/2) (#454)
- update what's new release date

## 5.3.0-alpha.1 - April 23

- Add discard too picking.js fragment shader (#509)

## 5.2.0-beta.2 - April 16

- Upgrade math.gl and probe.gl to official (non-alpha) versions
- VertexArray: move private methods to end of class (#498)
- Fix browser test of Framebuffer.blit (#497)
- fix markdown file for webgl-lessons
- fix examples and controls
- fix webpack file for example 14 and 15
- fix a typo in README (#489)
- Delete duplicate file (#486)

## 5.2.0-alpha.12 - April 2

- Fixes to electron support, debug mode and AnimationLoop (#483)
- PickingModule: picking_filterColor method (#464)
- Add AnimationLoopProxy class (#453)
- Clean up debug mode (#481)

## 5.2.0-alpha.11 - April 1

- babel 7

## 5.2.0-alpha.10 - Mar 29

- Integrate test-browser with "git commit" (#468)
- Fix Uniform Buffer binding (#473)

## 5.2.0-alpha.9 - Mar 27

- Allow null uniforms (#472)
- Add metrics collection (#466)

## 5.2.0-alpha.8 - Mar 26

- Do not delete Program objects while being cached. (#467)
- WebGL2 : Add asynchronous mode for readPixels using PBOs. (#450)

## 5.2.0-alpha.7 - Mar 22

- Don't throw on missing headless-gl.

## 5.2.0-alpha.6 - Mar 22

- Temporarily disable babel minify until issues are resolved

## 5.2.0-alpha.5 - Mar 22

- Fix babel-minify breakage in uniform verification

## 5.2.0-alpha.4 - Mar 21

- Publish minified luma.gl

## 5.2.0-alpha.3 - Mar 21

- esnext distribution
- math.gl 1.1.0

## 5.2.0-alpha.3 - Mar 3

- Update TF demo to use new Transform class (#433)
- Transform: Add updateBuffers method (#418)
- Fixed crash caused by wrong utils folder path (#431)

## 5.2.0-alpha.2 - Feb 27

- Fix exports (#428)
- Create pull_request_template.md
- Update issue_template.md
- Create issue_template.md
- Add the right blog link in roadmap.md (#427)
- Fix a crash: model.geometry is optional (#424)
- Fix array uniform setting (#422)

## 5.2.0-alpha.1 - Feb 26

- Fix a crash when Model object created without geometry. (#419)
- New method AnimationLoop.setProps to avoid breaking apps (#414)
- update math version

## 5.1.0 - Feb 14

## 5.0.0 - Dec 21

- Update links to point to 5.0-release branch
- Do not mark `needsRedraw` unless something changed (#376)
- Add deprecation check to shader modules (#377)
- Fix `model.render` inconsistencies (#375)
- Fix generic attribute support (#374)

## 5.0.0-beta.1 - Dec 18

- Remove deprecated API (#373)

## 4.1.0-beta.2 - Dec 12

- Enable Intel Tan shader WA for default GPU (#368)
- Improve perf of uniform setters (#370)
- Remove deprecated api usage (#367)

## 4.1.0-beta.1 - Nov 30

- Add buildkite (#356)
- Cleanup: remove un-used picking code (#366)
- Picking: Remove PICKING_NULL_COLOR, use 'null' (#365)
- Remove packages/math and add math.gl (#363)
- Use probe.gl for bench (#362)
- Program: Enhancements to attribute/uniform locations map setup. (#361)
- Fix AnimationLoop stop method (#360)

## 4.1.0-alpha.9 - Nov 20

- 4.1 API Audit (picking module, useDevicePixels) (#355)
- ShaderCache: Add support for Program objets. (#352)
- Add version during transpilation (#354)
- Make fp64 tests work under `tape` (#351)
- Remove context in logging. Fix formatting in shader errors (#348)

## 4.1.0-alpha.8 - Oct 29

- Fix the fp64 platform define (#344)
- Disable picking uniform warnings for now. (#342)

## 4.1.0-alpha.7 - Oct 12

- Fix duplicate console warnings (#341)

## 4.1.0-alpha.6 - Oct 11

- Add moduleSettings parameter to Model.draw (#337)
- Fix performance regression in picking flow (#339)
- Copy enhanced Picking module from deck.gl (#338)
- Fix browser test for TransformFeedback (#336)

## 4.1.0-alpha.5 - Oct 3

- Fix example framebuffer usage and conditionally add shader extension (#330)
- Fix `TransformFeedback.isSupported` bug (#333)
- Fix priority of missing uniforms log (#334)

## 4.1.0-alpha.4 - Oct 2

- Framebuffer binding fixes (#323)
- Shadowmap example, Delete unused files (#325)
- Prevent animation loop from creating unused framebuffer (#326)

## 4.1.0-alpha.3 - Sep 27

- Fix Framebuffer.clear (#321)
- Add context management support for framebuffer binding. (#319)
- Fix buffer.getData default parameters and target setting. (#317)
- Hook up website links for example "lesson 12" and "lesson 13" (#312)
- Add "lesson 13" example about fragment lighting and multiple programs (#311)
- Miscellaneous fixes: GLSL error reporting, BlendMinMax test, 'cross origin' image load
- Add "lesson 12" example about point lighting (#310)
- Add "math.gl" dependency for website (#309)
- fix fp64 test (#298)
- Lesson 11 example for creating textured and lighted sphere (#305)
- Keep version directive at the beginning of the shader during assembly. (#306)
- fix compiling warnings caused by deprecated APIs
- Make example work with Safari without using "var"
- Lesson 10 for loading a game world
- Wire up ShaderCache in Model class to avoid re-compilaiton of same shaders. (#301)

## 4.1.0-alpha.2 - Aug 28

Debug improvements

- wrap uniform/attribute tables in group (more compact log level 2)
- remove rendering model end log (unnecessary line)
- sort uniforms in table - first local uniforms, then module uniforms
- title of model (layer) in table - more prominent, don't waste row
- unify middle columns in attribute table (location and type/size/vert column)
- reduce #lines of log from queryTimer (model.js) - enabled for all when seer is active

## 4.1.0-alpha.1 - Aug 10

- Add SphericalCoordinates and export Euler (#295)

## 4.0.1

- Wire up ShaderCache in Model class to avoid re-compilaiton of same shader (#301)

## 4.0.0-beta.6

- Call assembleShaders always (#270)
- Remove invalid assert on GL.POINTS (#268)
- Fix the WebGL context creation issue on Safari (#267)

## 4.0.0-beta.5

- Fix Shader Module dependency ordering (#266)
- API Audit - change 'settings' to 'parameters' (#264)
- Remove duplicate docs for faature management (#265)

## 4.0.0-beta.4

- Parameters: draw(`settings`) renamed to `parameters`
- Shader Modules: Move fp32 and fp64 from deck.gl
- WEBSITE: Remove/Retitle examples

## 4.0.0-beta.3

- Export feature detection functions (#260)
- Improve shadertools docs (#258)

## 4.0.0-beta.2

- FIX: Shader error parsing, shadertools export fix
- Changes to Picking module & fix Picking example (#256)
- math library fixes (#253)
- Matrix docs (#254)
- Fix picking color encoding. (#252)
- Fix picking module & add FB unit tests. (#251)

## 4.0.0-beta.1

- Canvas and Drawing Buffer API fixes
- Reduce size of gl-matrix dependencies
- Support v3 texture parameters
- Shader Module System cleanup and use in some examples
- Webpack configuration consolidation

- WEBSITE: Shippable docs
- WEBSITE: SIZE and MULTIPLE CANVAS fixes
- WEBSITE: Restore Shadowmap and Particles Examples
- WEBSITE: Shader Module System - use in some examples
- WEBSITE: Webpack configuration consolidation
- WEBSITE: Framework links

## 4.0.0-alpha.14

- v4 Capability Management API finalization
- New Shader Module refactor
- Query objects enabled + unit tests
- NPOT workaround for texture-2d object
  INTERNAL
- Add webgl-util readme
- Canvas resize/context creation moved to webgl-utils
- getParameter polyfill consolidated in webgl-utils
- Move non-working examples to wip folder
- Rename demo folder to website

## 4.0.0-alpha.13

- Un-deprecate `scenegraph` module (except `Scene`), merge with `core` module.
- `shadertools` module no longer experimental
- webgl2 uniform support

## 4.0.0-alpha.12

- FIX: Seer integration

## 4.0.0-alpha.11

- State and Parameter support
- Many fixes to examples

## 4.0.0-alpha.10

- FIX: Framebuffer resize & add unit test (#200)
- Add the pixel parameter back in texture class for compatibility with v3 (#198)
- FIX: 'npm run build' for demos (#195)
- FIX: Lesson 08 (#196)
- FIX: Lesson 07 (#194)

## 4.0.0-alpha.9

- FIX: Some leftover export fix and storage mode fix (#192)

## 4.0.0-alpha.8

- FIX: Remove duplicate export that fails tests in other repos (#191)

## 4.0.0-alpha.7

- FIX: Fix the texture storage mode settings (#189)
- FIX: examples/lessons (#188)
- Transform feedback fixes (#187)
- FIX: Example updates and fixes for textures (#186)
- Size improvements to transpiled code (dist)
- Tree-shaking improvements - carefully avoid dependencies that defeat tree shaking (#185)

## 4.0.0-alpha.6

- Fix framebuffer creation error AGAIN (#183)
- NEW: `UniformBufferLayout` class

## 4.0.0-alpha.4

- Remove null params given to Float32Array constructor (#176)
- Fix framebuffer creation error (#177)

## 4.0.0-alpha.3

- bump seer
- remove duplicate info from readme

## 4.0.0-alpha.2

- Reorgnize files (#168)
- Transform feedback improvement (#165)
- WebGL2 updates (#160)
- Buffer refactor (#156)
- Fix examples (#161, #149, #172, #173)
- Adding new docs for WebGL2 (#159)
- Demo site creation (#158)
- Docs cleanup and updates (#157, #169, #170)
- seer integration
- Add coverage support (#155)

## 4.0.0-alpha.1

- Refactor WebGL classes using new `Resource` base class
- `Resource.getParameters` for ease of debugging
- Fix FramebufferObject export
- GL state and limit management (#146)
- Fix shader file name (#151)
- Refactor many classes in the webgl folder (#136, #154)
- Check compilation and linking status only with debug WebGL context (#144)
- Add benchmarking scaffolding and a benchmark test for Program constructor (#142)
- Docs update (#137)

# Official releases

## v3

Theme: Pure ES6 Codebase/Build tooling improvements

### 3.0.2

- Check compilation and linking status only when debug WebGL context is used to improve performance (#144)

### 3.0.1

- Add CORS setting to allow loading image from a different domain

## 3.0.0

Codebase/Build tooling improvements

- Replace wildcard exports with named exports in index.js
- ES6 Conformant code base: stage-2 extensions removed
- Webpack based build
- Multiple examples now work standalone
- Experimental tree-shaking support: dist and dist-es6 directories
- Dependency removal, including removal of `autobind-decorator` dependency
- Changed precommit hook from `husky` to `pre-commit`
- `shader-modules`, `shader-tools`, `shaders` shader module system added to `/experimental`
- `probe` moved to `/experimental`
- `webgl` folder now contains both webgl1 and webgl2 classes

Feature Improvements

- Performance query using EXT_disjoint_timer_query #121

Breaking Changes:

- BREAKING CHANGE: Move node IO (loadImage etc) out of main src tree
  and into `packages`. This allows luma.gl to drop a number of big dependencies.
  The node IO code may be published as a separate module later.

### 2.10.4

- FIX: Fix for glGetDebugInfo regression on Intel processors.

### 2.10.3

- FIX: Fix for glGetDebugInfo regression under Node in 2.10.2.
- FIX: Add "experimental.js" to exported "files" in package.json.

### 2.10.2

- FEATURE: Introduce experimental ShaderCache
- FIX: for glGetDebugInfo under Firefox (WEBGL_debug_renderer_info issue)
- CHANGE: Removes glslify as a dependency, apps that depend on glslify
  must add it to their own package.json.

### 2.10.1

- FIX: glslify path.

### 2.10.0

- Introduce new gl-matrix based math library.
- Move old math lib to deprecated folder.
- Move FBO to deprecated folder.
- Examples converted to ES6. AnimationLoop class updates.
- Add back persistence example
- WebGL type and constant cleanup
- Fix glTypeToArray and use clamped arrays by default

### 2.9.1 GLSL shader compiler error handling

- FIX: GLSL shader compiler error parsing

### 2.9.0 TimerQuery, WebGL Extension doc, fix crash on Travis CI

- Support EXT_disjoint_timer_query
- Document luma.gl use of WebGL extensions.
- Fix: context creation crash when WEBGL_debug_info extension was undefined
- Add

### 2.8.0 Debug log improvements, import fix

- Debug logs now print unused attributes more compactly, number formatting
  improved.
- FIX: io import issue in 2.7.0

### 2.7.0 - Add ability to import luma without io

- import "luma.gl/luma" will import luma without io functions
- import "luma.gl/io" will import luma io functions only
- omitting io functions significantly reduces dependencies

### 2.6.0 - "64 bit" camera projection matrix

- Add 64 bit matrix to Luma.gl Camera
- Updated linter rules

### 2.5.4 - FIX: Luma global initialization

- Makes the luma object available in console for debugging.
- Makes optional headless support more reliable.

### 2.5.3 - FIX: Linux rendering issues

- Add missing call to getAttribLocation.
- Some polish on luma's built-in attribute/uniform logging

### 2.5.2 - FIX: document.navigator override

- More gentle override, carefully restoring the variable.

### 2.5.1 - FIX: make deprecated AttributeManager.add updateMap work again

- Attribute manager changes

### 2.5.0 - Node.js/AttributeManager/Renderer/Program.render()/Examples

- Ensure luma.gl does not fail under node until createGLContext is called.

- Program.render() now takes a map of uniforms,
  reducing need to "set" uniforms before render.

- AttributeManager improvements

  - add logging/instrumentation hooks, to help apps profile attribute updates.
  - Pass AttributeManager.update() parameters through to the individual
    attribute updater funcs, enabling app to generate shared attributes
    independently of layers for additional performance gains.
  - Add JSDoc to all public methods and basic test cases.

- New experimental Renderer class - `requestAnimationFrame` replacement.

- Improvement/fixes to examples

### 2.4.2 - FIX: redraw flag management

- Fix redrawFlag names

### 2.4.1 - FIX: headless mode

- Add headless.js to exported files

### 2.4.0 - Improve change detection

- Redraw flag management improvements

### 2.3.0 - Decoupled headless-gl dependency

- It is now necessary to import luma.gl through `luma.gl/headless` to get
  headless integration.
  When using the basic `luma.gl` import, the app no longer needs to
  have `gl` as a dependency.
  This should simplify build and setup for applications that don't use
  headless-gl.

### 2.2.0

- Fixed a doc mistake

### 2.1.0 - Copy of 2.0.0 release

- Published mainly to ensure 2.0.4-0 does not get included by
  semver wildcards.

### 2.0.4-0 - Misnamed beta release

- Don't use. This was a misnamed beta release.

### 2.0.0 - Major API refactoring

### 1.0.1 - Initial release.

# Prereleases

Note: Unfortunately 3.0.0-beta6 was published without beta tag and takes
precedence when using wildcard installs.

### 3.0.0-beta.9

- FIX: Additional fix for regression in geometry constructor

### 3.0.0-beta.8

- FIX: Regression in geometry constructor (support deprecated mode)
- FIX: Initialization of global and startup logging
- FIX: Ensure framebuffer resize logging is not visible by default

### 3.0.0-beta.7

- Bump version to avoid confusion with older incorrectly numbered beta versions
- Replace wildcard exports with named exports in index.js
- Remove all Work In Progress Examples - Focus on working code
- Multiple examples now work standalone

### 3.0.0-beta.3

- ES6 Conformant code base: stage-2 extensions removed
- Experimental tree-shaking support: dist and dist-es6 directories
- Webpack based build

### 3.0.0-beta1 - 3.0.0-beta6 obsolete, folded into master

### 3.0.0-alpha.4

- Performance query using EXT_disjoint_timer_query #121

### 3.0.0-alpha.3

- Changed from `husky` to `pre-commit`
- Removed `autobind-decorator` dependency

### 3.0.0-alpha2

- `shader-modules`, `shader-tools`, `shaders` shader module system added to `/experimental`
- `probe` moved to `/experimental`
- `webgl` folder now contains both webgl1 and webgl2 classes

### 3.0.0-alpha1

- BREAKING CHANGE: Move node IO (loadImage etc) out of main src tree
  and into `packages`. This allows luma.gl to drop a number of big dependencies.
  The node IO code may be published as a separate module later.
