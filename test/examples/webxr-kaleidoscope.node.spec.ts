// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';
import {applyXRSceneOffset} from '../../examples/experimental/webxr-kaleidoscope/app';

const APPLICATION_PATH = path.join(
  process.cwd(),
  'examples/experimental/webxr-kaleidoscope/app.ts'
);
const STANDALONE_PATH = path.join(
  process.cwd(),
  'examples/experimental/webxr-kaleidoscope/index.html'
);
const PACKAGE_PATH = path.join(
  process.cwd(),
  'examples/experimental/webxr-kaleidoscope/package.json'
);
const WEBSITE_EXAMPLES_PATH = path.join(process.cwd(), 'website/src/examples.tsx');
const WEBSITE_EXAMPLE_WRAPPER_PATH = path.join(
  process.cwd(),
  'website/src/react-luma/components/luma-example.tsx'
);
const WEBSITE_DEVICE_STORE_PATH = path.join(
  process.cwd(),
  'website/src/react-luma/store/device-store.tsx'
);
const EXAMPLE_METADATA_PATH = path.join(
  process.cwd(),
  'website/content/examples/experimental/webxr-kaleidoscope.mdx'
);

describe('immersive WebGPU and WebGL2 prism portal', () => {
  test('keeps valid native WGSL and portable GLSL rendering paths', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const shaderDeclaration = applicationSource.indexOf('const WGSL_SHADER = /* wgsl */');
    const shaderStart = applicationSource.indexOf('\n', shaderDeclaration) + 1;
    const shaderEnd = applicationSource.indexOf('\n`;', shaderStart);
    let bindingIndex = 0;

    expect(shaderDeclaration).toBeGreaterThan(0);
    expect(shaderEnd).toBeGreaterThan(shaderStart);

    const shaderSource = applicationSource
      .slice(shaderStart, shaderEnd)
      .replaceAll(/@binding\(auto\)/g, () => `@binding(${bindingIndex++})`);
    const reflectedShader = new WgslReflect(shaderSource);

    expect(reflectedShader.entry.vertex.map(entry => entry.name)).toEqual(['vertexMain']);
    expect(reflectedShader.entry.fragment.map(entry => entry.name)).toEqual(['fragmentMain']);
    expect(reflectedShader.uniforms.map(uniform => uniform.name)).toContain('app');
    expect(reflectedShader.textures.map(texture => texture.name)).toContain('cameraTexture');
    expect(reflectedShader.samplers.map(sampler => sampler.name)).toContain('cameraTextureSampler');
    expect(applicationSource).toContain('source: WGSL_SHADER');
    expect(applicationSource).toContain('vs: VS_GLSL');
    expect(applicationSource).toContain('fs: FS_GLSL');
    expect(applicationSource).toContain('source: CONTROLLER_RAY_WGSL_SHADER');
    expect(applicationSource).toContain('vs: CONTROLLER_RAY_VS_GLSL');
    expect(applicationSource).toContain('fs: CONTROLLER_RAY_FS_GLSL');
    expect(applicationSource).not.toContain('WebXR Kaleidoscope requires WebGL2');
  });

  test('creates a genuinely three-dimensional GPU-animated prism tunnel', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');

    expect(applicationSource).toMatch(/const PORTAL_RING_COUNT\s*=\s*(?:1[0-9]|[2-9][0-9]+)/);
    expect(applicationSource).toMatch(
      /const PARTICLE_COUNT\s*=\s*(?:[2-9][0-9]{2,}|[1-9][0-9]{3,})/
    );
    expect(applicationSource).toContain('appendPortalRings(positions, texCoords, shardAttributes)');
    expect(applicationSource).toContain(
      'appendHelicalRibbons(positions, texCoords, shardAttributes)'
    );
    expect(applicationSource).toContain(
      'appendFloatingPrisms(positions, texCoords, shardAttributes)'
    );
    expect(applicationSource).toContain('depthFactor * PORTAL_DEPTH');
    expect(applicationSource).toContain('shardData: {size: 4');
    expect(applicationSource).toContain('time: elapsedTimeMilliseconds');
    expect(applicationSource).toContain('new OrbitControls(canvas');
  });

  test('negotiates native WebGPU sessions without misrepresenting raw-camera support', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');

    expect(applicationSource).toContain("requiredFeatures: ['webgpu']");
    expect(applicationSource).toContain("'hand-tracking',");
    expect(applicationSource).toContain('mergeWebXRSessionInit');
    expect(applicationSource).toContain('getWebXRDOMOverlaySessionInit(domOverlayRoot)');
    expect(applicationSource).toContain('getWebXRDepthSensingSessionInit(AR_DEPTH_SENSING)');
    expect(applicationSource).toContain("...(deviceType === 'webgl' ? ['camera-access'] : [])");
    expect(applicationSource).toContain(
      "sessionMode === 'immersive-ar'\n          ? [...arOptionalFeatures, ...baseOptionalFeatures]"
    );
    expect(applicationSource).toContain('WebXRDOMOverlayManager');
    expect(applicationSource).toContain(
      'readonly webXRDOMOverlayManager = new WebXRDOMOverlayManager()'
    );
    expect(applicationSource).toContain('WebXRHandTrackingManager');
    expect(applicationSource).toContain(
      'readonly webXRHandTrackingManager = new WebXRHandTrackingManager()'
    );
    expect(applicationSource).toContain("'light-estimation',");
    expect(applicationSource).toContain("'mesh-detection',");
    expect(applicationSource).toContain("'plane-detection'");
    expect(applicationSource).toContain('WebXRLightEstimationManager');
    expect(applicationSource).toContain('WebXRMeshDetectionManager');
    expect(applicationSource).toContain('WebXRPlaneDetectionManager');
    expect(applicationSource).toContain('WebXRReferenceSpaceManager');
    expect(applicationSource).toContain('WebXRRenderStateManager');
    expect(applicationSource).toContain('WebXRSessionStateManager');
    expect(applicationSource).toContain('depthNear: 0.05');
    expect(applicationSource).toContain('depthFar: 100');
    expect(applicationSource).toContain("targetFrameRate: 'highest'");
    expect(applicationSource).toContain(
      'readonly webXRReferenceSpaceManager = new WebXRReferenceSpaceManager()'
    );
    expect(applicationSource).toContain(
      'this.webXRReferenceSpaceManager.setReferenceSpace(this.webXRManager.referenceSpace)'
    );
    expect(applicationSource).toContain('this.webXRRenderStateManager');
    expect(applicationSource).toContain('.setSession(session)');
    expect(applicationSource).toContain(
      'this.webXRHandTrackingManager.setSession(session, this.webXRManager.referenceSpace)'
    );
    expect(applicationSource).toContain('this.webXRSessionStateManager');
    expect(applicationSource).toContain('.setSession(session)');
    expect(applicationSource).toContain(
      'this.webXRDOMOverlayManager.setSession(session, {root: getDOMOverlayRoot()})'
    );
    expect(applicationSource).toContain('this.webXRDOMOverlayManager.clearSession()');
    expect(applicationSource).toContain('this.webXRHandTrackingManager.clearSession()');
    expect(applicationSource).toContain('this.webXRReferenceSpaceManager.clearReferenceSpace()');
    expect(applicationSource).toContain('this.webXRReferenceSpaceManager.destroy()');
    expect(applicationSource).toContain('this.webXRRenderStateManager.clearSession()');
    expect(applicationSource).toContain('this.webXRRenderStateManager.destroy()');
    expect(applicationSource).toContain('this.webXRSessionStateManager.clearSession()');
    expect(applicationSource).toContain('this.webXRSessionStateManager.destroy()');
    expect(applicationSource).toContain(
      "referenceSpaceTypes: ['bounded-floor', 'local-floor', 'local']"
    );
    expect(applicationSource).toContain('function getDOMOverlayRoot(): Element | null');
    expect(applicationSource).toContain("usagePreference: ['gpu-optimized', 'cpu-optimized']");
    expect(applicationSource).toContain(
      "dataFormatPreference: ['luminance-alpha', 'float32', 'unsigned-short']"
    );
    expect(applicationSource).toMatch(
      /sessionMode\s*===\s*'immersive-ar'\s*&&\s*this\.device\.type\s*===\s*'webgl'/
    );
    expect(applicationSource).toContain('!this.device.props.xrCompatible');
    expect(applicationSource).toContain("!('XRGPUBinding' in globalThis)");
    expect(applicationSource).toContain('Switch to WebGL2 for immersive fallback');
    expect(applicationSource).not.toMatch(/requiredFeatures:\s*\[[^\]]*['"]layers['"]/);
  });

  test('orders per-eye uploads before render passes and clears shared targets only once', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const renderMethodStart = applicationSource.indexOf('private renderXRFrame(');
    const renderMethodEnd = applicationSource.indexOf(
      '\n  private preparePortal(',
      renderMethodStart
    );
    const renderMethod = applicationSource.slice(renderMethodStart, renderMethodEnd);
    const previewMethodStart = applicationSource.indexOf('private renderPreviewFrame(');
    const previewMethodEnd = applicationSource.indexOf(
      '\n  private renderXRFrame(',
      previewMethodStart
    );
    const previewMethod = applicationSource.slice(previewMethodStart, previewMethodEnd);
    const prepareMethodStart = applicationSource.indexOf('private preparePortal(');
    const prepareMethodEnd = applicationSource.indexOf(
      '\n  private drawPortal(',
      prepareMethodStart
    );
    const prepareMethod = applicationSource.slice(prepareMethodStart, prepareMethodEnd);

    expect(renderMethodStart).toBeGreaterThan(0);
    expect(renderMethodEnd).toBeGreaterThan(renderMethodStart);
    expect(previewMethodStart).toBeGreaterThan(0);
    expect(previewMethodEnd).toBeGreaterThan(previewMethodStart);
    expect(previewMethod).toContain('const renderPass = device.beginRenderPass(');
    expect(previewMethod).toContain('this.drawPortal(renderPass)');
    expect(previewMethod).toContain('renderPass.end()');
    expect(renderMethod).toContain('view.framebuffer ?? frameState.framebuffer');
    expect(renderMethod).toContain('new Set<Framebuffer>()');
    expect(renderMethod).toContain('!renderedFramebuffers.has(framebuffer)');
    expect(renderMethod).toContain('renderedFramebuffers.add(framebuffer)');
    expect(renderMethod).toContain(
      'this.drawControllerTargets(renderPass, view, inputState, time)'
    );
    expect(renderMethod).toContain('this.drawHandJoints(renderPass, view, handState, time)');
    expect(renderMethod).toMatch(
      /this\.xrSessionMode\s*===\s*'immersive-ar'\s*\?\s*\[0,\s*0,\s*0,\s*0\]/
    );
    expect(renderMethod.indexOf('this.preparePortal({')).toBeLessThan(
      renderMethod.indexOf('this.device.beginRenderPass({')
    );
    expect(renderMethod).toContain('renderPass.setParameters({viewport: view.viewport})');
    expect(renderMethod.indexOf('this.device.beginRenderPass({')).toBeLessThan(
      renderMethod.indexOf('renderPass.setParameters({viewport: view.viewport})')
    );
    expect(
      renderMethod.indexOf('renderPass.setParameters({viewport: view.viewport})')
    ).toBeLessThan(renderMethod.indexOf('this.drawPortal(renderPass)'));
    expect(renderMethod.indexOf('this.drawPortal(renderPass)')).toBeLessThan(
      renderMethod.indexOf('this.drawControllerTargets(renderPass, view, inputState, time)')
    );
    expect(
      renderMethod.indexOf('this.drawControllerTargets(renderPass, view, inputState, time)')
    ).toBeLessThan(renderMethod.indexOf('this.drawHandJoints(renderPass, view, handState, time)'));
    expect(prepareMethod).toContain('this.uniformStore.setUniforms(');
    expect(prepareMethod).toContain('this.device.commandEncoder');
    expect(prepareMethod).toContain('this.model.predraw(this.device.commandEncoder)');
    expect(prepareMethod.indexOf('this.uniformStore.setUniforms(')).toBeLessThan(
      prepareMethod.indexOf('this.model.predraw(this.device.commandEncoder)')
    );
  });

  test('renders tracked-pointer controller rays from WebXR input snapshots', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const renderMethodStart = applicationSource.indexOf('private renderXRFrame(');
    const renderMethodEnd = applicationSource.indexOf(
      '\n  private preparePortal(',
      renderMethodStart
    );
    const renderMethod = applicationSource.slice(renderMethodStart, renderMethodEnd);
    const rayMethodStart = applicationSource.indexOf('private drawControllerTargets(');
    const rayMethodEnd = applicationSource.indexOf(
      '\n  private updateModelMatrix(',
      rayMethodStart
    );
    const rayMethod = applicationSource.slice(rayMethodStart, rayMethodEnd);

    expect(applicationSource).toContain('type WebXRInputState');
    expect(applicationSource).toContain('getWebXRBoundsState');
    expect(applicationSource).toContain('getWebXRGamepadState');
    expect(applicationSource).toContain('getWebXRInputRay');
    expect(applicationSource).toContain('getWebXRInputRayPlaneIntersection');
    expect(applicationSource).toContain('getWebXRLocomotionState');
    expect(applicationSource).toContain('getWebXRTeleportTranslation');
    expect(applicationSource).toContain('isPointInWebXRBounds');
    expect(applicationSource).toContain('pulseWebXRInputHaptics');
    expect(applicationSource).toContain('this.webXRManager.getInputState(xrFrame)');
    expect(applicationSource).toContain("id: 'immersive-prism-controller-rays'");
    expect(applicationSource).toContain("id: 'immersive-prism-controller-reticles'");
    expect(applicationSource).toContain("topology: 'line-list'");
    expect(applicationSource).toContain('new Float32Array([0, 0, 0, 0, 0, -3.2])');
    expect(applicationSource).toContain('function makeControllerReticleGeometry()');
    expect(applicationSource).toContain('const segmentCount = 32');
    expect(renderMethod).toContain('inputState: readonly WebXRInputState[]');
    expect(renderMethod).toContain('this._inputStateByInputSource.clear()');
    expect(renderMethod).toContain('this._inputStateByInputSource.set(input.inputSource, input)');
    expect(renderMethod).toContain('renderPass.end()');
    expect(rayMethodStart).toBeGreaterThan(0);
    expect(rayMethodEnd).toBeGreaterThan(rayMethodStart);
    expect(rayMethod).toContain('const inputRay = getWebXRInputRay(input)');
    expect(rayMethod).toContain('const gamepadState = getWebXRGamepadState(input)');
    expect(rayMethod).toContain('gamepadState?.primaryTrigger?.value || 0');
    expect(rayMethod).toContain("input.targetRayMode !== 'tracked-pointer'");
    expect(rayMethod).toContain('!inputRay');
    expect(rayMethod).toContain('this.controllerRayMatrix.copy(inputRay.matrix)');
    expect(rayMethod).toContain('multiplyRight(this.controllerRayMatrix.copy(inputRay.matrix))');
    expect(rayMethod).toContain('cameraMix: controllerActivation');
    expect(rayMethod).toContain('this.controllerRayModel.predraw(this.device.commandEncoder)');
    expect(rayMethod).toContain('this.controllerRayModel.draw(renderPass)');
    expect(rayMethod).toContain('getWebXRInputRayPlaneIntersection(inputRay, {maxDistance: 8})');
    expect(rayMethod).toContain(
      'this._floorHitByInputSource.set(input.inputSource, floorHit.point)'
    );
    expect(rayMethod).toContain(
      'this.controllerReticleMatrix.identity().translate(floorHit.point)'
    );
    expect(rayMethod).toContain('multiplyRight(this.controllerReticleMatrix)');
    expect(rayMethod).toContain('this.controllerReticleModel.predraw(this.device.commandEncoder)');
    expect(rayMethod).toContain('this.controllerReticleModel.draw(renderPass)');
  });

  test('renders tracked hand joints from WebXR hand snapshots', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const renderMethodStart = applicationSource.indexOf('private renderXRFrame(');
    const renderMethodEnd = applicationSource.indexOf(
      '\n  private preparePortal(',
      renderMethodStart
    );
    const renderMethod = applicationSource.slice(renderMethodStart, renderMethodEnd);
    const handMethodStart = applicationSource.indexOf('private drawHandJoints(');
    const handMethodEnd = applicationSource.indexOf(
      '\n  private updateModelMatrix(',
      handMethodStart
    );
    const handMethod = applicationSource.slice(handMethodStart, handMethodEnd);
    const clearMethodStart = applicationSource.indexOf('private _clearXRSession(');
    const clearMethod = applicationSource.slice(clearMethodStart);

    expect(applicationSource).toContain('type WebXRHandTrackingState');
    expect(applicationSource).toContain('getWebXRHandPinch');
    expect(applicationSource).toContain('this.webXRHandTrackingManager.getHandsState(');
    expect(applicationSource).toContain('(inputState || []).map(input => input.inputSource)');
    expect(applicationSource).toContain("id: 'immersive-prism-hand-joints'");
    expect(applicationSource).toContain('function makeHandJointGeometry()');
    expect(applicationSource).toMatch(
      /new Float32Array\(\[\s*-1,\s*0,\s*0,\s*1,\s*0,\s*0,\s*0,\s*-1,\s*0,\s*0,\s*1,\s*0,\s*0,\s*0,\s*-1,\s*0,\s*0,\s*1\s*\]\)/
    );
    expect(renderMethod).toContain('handState: readonly WebXRHandTrackingState[]');
    expect(renderMethod).toContain('this.drawHandJoints(renderPass, view, handState, time)');
    expect(handMethodStart).toBeGreaterThan(0);
    expect(handMethodEnd).toBeGreaterThan(handMethodStart);
    expect(handMethod).toContain('for (const hand of handState)');
    expect(handMethod).toContain('const pinchState = getWebXRHandPinch(hand)');
    expect(handMethod).toContain('pinchState?.pinchActive ? 1');
    expect(handMethod).toContain('for (const joint of hand.joints)');
    expect(handMethod).toContain('if (!joint.matrix)');
    expect(handMethod).toContain('Math.max(joint.radius ?? 0.008, 0.006) * 1.8');
    expect(handMethod).toContain('this.handJointMatrix.copy(joint.matrix)');
    expect(handMethod).toContain('multiplyRight(this.handJointMatrix)');
    expect(handMethod).toContain("hand.handedness === 'right' ? 0.45 : 0");
    expect(handMethod).toContain('this.handJointModel.predraw(this.device.commandEncoder)');
    expect(handMethod).toContain('this.handJointModel.draw(renderPass)');
    expect(clearMethod).toContain('this.webXRHandTrackingManager.clearSession()');
    expect(applicationSource).toContain('this.webXRHandTrackingManager.destroy()');
  });

  test('uses AR hit tests for placement while preserving fallback locomotion', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const renderMethodStart = applicationSource.indexOf('private renderXRFrame(');
    const renderMethodEnd = applicationSource.indexOf(
      '\n  private preparePortal(',
      renderMethodStart
    );
    const renderMethod = applicationSource.slice(renderMethodStart, renderMethodEnd);
    const enterMethodStart = applicationSource.indexOf('async enterXR(');
    const enterMethodEnd = applicationSource.indexOf('\n  async exitAR(', enterMethodStart);
    const enterMethod = applicationSource.slice(enterMethodStart, enterMethodEnd);
    const updateModelStart = applicationSource.indexOf('private updateModelMatrix(');
    const updateModelEnd = applicationSource.indexOf(
      '\n  private teleportToInputSource(',
      updateModelStart
    );
    const updateModelMethod = applicationSource.slice(updateModelStart, updateModelEnd);
    const clearMethodStart = applicationSource.indexOf('private _clearXRSession(');
    const clearMethod = applicationSource.slice(clearMethodStart);

    expect(applicationSource).toContain('WebXRHitTestManager');
    expect(applicationSource).toContain('type WebXRHitTestState');
    expect(applicationSource).toContain('readonly webXRHitTestManager = new WebXRHitTestManager()');
    expect(applicationSource).toContain('this.webXRHitTestManager.getHitTestState(xrFrame)');
    expect(enterMethod).toContain("sessionMode === 'immersive-ar'");
    expect(enterMethod).toContain('this.webXRHitTestManager');
    expect(enterMethod).toContain("entityTypes: ['plane', 'point', 'mesh']");
    expect(enterMethod).toContain('transientInput: {');
    expect(enterMethod).toContain("profile: 'generic-touchscreen'");
    expect(enterMethod).toContain('.catch(() => this.webXRHitTestManager.clearSession())');
    expect(renderMethod).toContain('hitTestState: WebXRHitTestState | null');
    expect(renderMethod).toContain(
      'this.updateModelMatrix(time, true, hitTestState, planeDetectionState, meshDetectionState)'
    );
    expect(updateModelMethod).toContain('const hitTestMatrix =');
    expect(updateModelMethod).toContain('hitTestState?.transientInput[0]?.results[0]?.matrix');
    expect(updateModelMethod).toContain('hitTestState?.hits[0]?.matrix');
    expect(updateModelMethod).toContain("this.xrSessionMode === 'immersive-ar' && hitTestMatrix");
    expect(updateModelMethod).toContain('this.modelMatrix.copy(hitTestMatrix)');
    expect(updateModelMethod).toContain('scale([0.54, 0.54, 0.54])');
    expect(clearMethod).toContain('this.webXRHitTestManager.clearSession()');
    expect(applicationSource).toContain('this.webXRHitTestManager.destroy()');
  });

  test('uses optional AR light estimation to modulate portal intensity', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const renderMethodStart = applicationSource.indexOf('private renderXRFrame(');
    const renderMethodEnd = applicationSource.indexOf(
      '\n  private preparePortal(',
      renderMethodStart
    );
    const renderMethod = applicationSource.slice(renderMethodStart, renderMethodEnd);
    const enterMethodStart = applicationSource.indexOf('async enterXR(');
    const enterMethodEnd = applicationSource.indexOf('\n  async exitAR(', enterMethodStart);
    const enterMethod = applicationSource.slice(enterMethodStart, enterMethodEnd);
    const clearMethodStart = applicationSource.indexOf('private _clearXRSession(');
    const clearMethod = applicationSource.slice(clearMethodStart);

    expect(applicationSource).toContain('type WebXRLightEstimationState');
    expect(applicationSource).toContain('WebXRLightEstimationManager');
    expect(applicationSource).toContain(
      'readonly webXRLightEstimationManager = new WebXRLightEstimationManager({'
    );
    expect(applicationSource).toContain("reflectionFormat: 'preferred'");
    expect(applicationSource).toContain('lightIntensity: number');
    expect(applicationSource).toContain("lightIntensity: 'f32'");
    expect(applicationSource).toContain('color *= app.lightIntensity');
    expect(applicationSource).toContain('function getXRLightIntensity(');
    expect(applicationSource).toContain('lightState.primaryLightIntensity');
    expect(applicationSource).toContain("'light-estimation',");
    expect(applicationSource).toContain(
      'this.webXRLightEstimationManager.getLightEstimationState(xrFrame)'
    );
    expect(enterMethod).toContain('this.webXRLightEstimationManager');
    expect(enterMethod).toContain('.setSession(session, this.webXRManager.referenceSpace)');
    expect(enterMethod).toContain('.catch(() => this.webXRLightEstimationManager.clearSession())');
    expect(renderMethod).toContain('lightEstimationState: WebXRLightEstimationState | null');
    expect(renderMethod).toContain('const lightIntensity = getXRLightIntensity(');
    expect(renderMethod).toContain('lightIntensity,');
    expect(clearMethod).toContain('this.webXRLightEstimationManager.clearSession()');
    expect(applicationSource).toContain('this.webXRLightEstimationManager.destroy()');
  });

  test('uses optional AR plane detection as placement fallback', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const renderMethodStart = applicationSource.indexOf('private renderXRFrame(');
    const renderMethodEnd = applicationSource.indexOf(
      '\n  private preparePortal(',
      renderMethodStart
    );
    const renderMethod = applicationSource.slice(renderMethodStart, renderMethodEnd);
    const enterMethodStart = applicationSource.indexOf('async enterXR(');
    const enterMethodEnd = applicationSource.indexOf('\n  async exitAR(', enterMethodStart);
    const enterMethod = applicationSource.slice(enterMethodStart, enterMethodEnd);
    const updateModelStart = applicationSource.indexOf('private updateModelMatrix(');
    const updateModelEnd = applicationSource.indexOf(
      '\n  private teleportToInputSource(',
      updateModelStart
    );
    const updateModelMethod = applicationSource.slice(updateModelStart, updateModelEnd);
    const clearMethodStart = applicationSource.indexOf('private _clearXRSession(');
    const clearMethod = applicationSource.slice(clearMethodStart);

    expect(applicationSource).toContain('type WebXRPlaneDetectionState');
    expect(applicationSource).toContain('WebXRPlaneDetectionManager');
    expect(applicationSource).toContain(
      'readonly webXRPlaneDetectionManager = new WebXRPlaneDetectionManager({'
    );
    expect(applicationSource).toContain("orientations: ['horizontal']");
    expect(applicationSource).toContain("'plane-detection'");
    expect(applicationSource).toContain(
      'this.webXRPlaneDetectionManager.getPlaneDetectionState(xrFrame)'
    );
    expect(enterMethod).toContain('this.webXRPlaneDetectionManager.setSession(');
    expect(enterMethod).toContain("orientations: ['horizontal']");
    expect(renderMethod).toContain('planeDetectionState: WebXRPlaneDetectionState | null');
    expect(renderMethod).toContain(
      'this.updateModelMatrix(time, true, hitTestState, planeDetectionState, meshDetectionState)'
    );
    expect(updateModelMethod).toContain("this.xrSessionMode === 'immersive-ar' && hitTestMatrix");
    expect(updateModelMethod).toContain(
      "this.xrSessionMode === 'immersive-ar' && planeDetectionState?.planes[0]"
    );
    expect(updateModelMethod).toContain(
      'this.modelMatrix.copy(planeDetectionState.planes[0].matrix)'
    );
    expect(clearMethod).toContain('this.webXRPlaneDetectionManager.clearSession()');
    expect(applicationSource).toContain('this.webXRPlaneDetectionManager.destroy()');
  });

  test('uses optional AR mesh detection as final placement fallback', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const renderMethodStart = applicationSource.indexOf('private renderXRFrame(');
    const renderMethodEnd = applicationSource.indexOf(
      '\n  private preparePortal(',
      renderMethodStart
    );
    const renderMethod = applicationSource.slice(renderMethodStart, renderMethodEnd);
    const enterMethodStart = applicationSource.indexOf('async enterXR(');
    const enterMethodEnd = applicationSource.indexOf('\n  async exitAR(', enterMethodStart);
    const enterMethod = applicationSource.slice(enterMethodStart, enterMethodEnd);
    const updateModelStart = applicationSource.indexOf('private updateModelMatrix(');
    const updateModelEnd = applicationSource.indexOf(
      '\n  private teleportToInputSource(',
      updateModelStart
    );
    const updateModelMethod = applicationSource.slice(updateModelStart, updateModelEnd);
    const clearMethodStart = applicationSource.indexOf('private _clearXRSession(');
    const clearMethod = applicationSource.slice(clearMethodStart);

    expect(applicationSource).toContain('type WebXRMeshDetectionState');
    expect(applicationSource).toContain('WebXRMeshDetectionManager');
    expect(applicationSource).toContain(
      'readonly webXRMeshDetectionManager = new WebXRMeshDetectionManager()'
    );
    expect(applicationSource).toContain("'mesh-detection',");
    expect(applicationSource).toContain("entityTypes: ['plane', 'point', 'mesh']");
    expect(applicationSource).toContain(
      'this.webXRMeshDetectionManager.getMeshDetectionState(xrFrame)'
    );
    expect(enterMethod).toContain('this.webXRMeshDetectionManager.setSession(');
    expect(renderMethod).toContain('meshDetectionState: WebXRMeshDetectionState | null');
    expect(renderMethod).toContain(
      'this.updateModelMatrix(time, true, hitTestState, planeDetectionState, meshDetectionState)'
    );
    expect(updateModelMethod).toContain("this.xrSessionMode === 'immersive-ar' && hitTestMatrix");
    expect(updateModelMethod).toContain(
      "this.xrSessionMode === 'immersive-ar' && planeDetectionState?.planes[0]"
    );
    expect(updateModelMethod).toContain(
      "this.xrSessionMode === 'immersive-ar' && meshDetectionState?.meshes[0]"
    );
    expect(updateModelMethod).toContain(
      'this.modelMatrix.copy(meshDetectionState.meshes[0].matrix)'
    );
    expect(clearMethod).toContain('this.webXRMeshDetectionManager.clearSession()');
    expect(applicationSource).toContain('this.webXRMeshDetectionManager.destroy()');
  });

  test('uses select for teleport candidates and squeeze or keyboard for exit', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const enterMethodStart = applicationSource.indexOf('async enterXR(');
    const enterMethodEnd = applicationSource.indexOf('\n  async exitAR(', enterMethodStart);
    const enterMethod = applicationSource.slice(enterMethodStart, enterMethodEnd);
    const updateModelStart = applicationSource.indexOf('private updateModelMatrix(');
    const updateModelEnd = applicationSource.indexOf(
      '\n  private teleportToInputSource(',
      updateModelStart
    );
    const updateModelMethod = applicationSource.slice(updateModelStart, updateModelEnd);
    const teleportMethodStart = applicationSource.indexOf('private teleportToInputSource(');
    const teleportMethodEnd = applicationSource.indexOf(
      '\n  private createCameraTexture(',
      teleportMethodStart
    );
    const teleportMethod = applicationSource.slice(teleportMethodStart, teleportMethodEnd);
    const locomotionMethodStart = applicationSource.indexOf('private updateXRLocomotion(');
    const locomotionMethodEnd = applicationSource.indexOf(
      '\n  private preparePortal(',
      locomotionMethodStart
    );
    const locomotionMethod = applicationSource.slice(locomotionMethodStart, locomotionMethodEnd);
    const clearMethodStart = applicationSource.indexOf('private _clearXRSession(');
    const clearMethod = applicationSource.slice(clearMethodStart);

    expect(applicationSource).toContain('readonly xrSceneOffset: [number, number, number]');
    expect(applicationSource).toContain('const XR_LOCOMOTION_SPEED = 1.4');
    expect(applicationSource).toContain(
      'private _lastXRLocomotionTimeMilliseconds: number | null = null'
    );
    expect(applicationSource).toContain('new Map<XRInputSource, [number, number, number]>()');
    expect(applicationSource).toContain('new Map<XRInputSource, WebXRInputState>()');
    expect(applicationSource).not.toContain(
      'private _xrSelectEndListener = () => void this.exitXR()'
    );
    expect(applicationSource).toContain('private _xrSqueezeEndListener = () => void this.exitXR()');
    expect(applicationSource).toContain(
      'this.teleportToInputSource((event as XRInputSourceEvent).inputSource)'
    );
    expect(enterMethod).toContain(
      "session.addEventListener('selectend', this._xrSelectEndListener)"
    );
    expect(enterMethod).toContain(
      "session.addEventListener('squeezeend', this._xrSqueezeEndListener)"
    );
    expect(applicationSource).toContain(
      'this.updateXRLocomotion(inputState || [], elapsedTimeMilliseconds)'
    );
    expect(locomotionMethodStart).toBeGreaterThan(0);
    expect(locomotionMethodEnd).toBeGreaterThan(locomotionMethodStart);
    expect(locomotionMethod).toContain("this.xrSessionMode !== 'immersive-vr'");
    expect(locomotionMethod).toContain('getWebXRLocomotionState(inputState');
    expect(locomotionMethod).toContain('deadzone: 0.22');
    expect(locomotionMethod).toContain('snapTurnThreshold: 0.86');
    expect(locomotionMethod).toContain('Math.min(0.05, Math.max(0,');
    expect(locomotionMethod).toContain('this.applyXRSceneOffset([');
    expect(updateModelMethod).toContain('translate(this.xrSceneOffset)');
    expect(teleportMethod).toContain('this._floorHitByInputSource.get(inputSource)');
    expect(teleportMethod).toContain('getWebXRBoundsState(this.webXRManager.referenceSpace)');
    expect(teleportMethod).toContain('!isPointInWebXRBounds(floorHit, boundsState.bounds)');
    expect(teleportMethod).toContain(
      'this.applyXRSceneOffset(getWebXRTeleportTranslation(floorHit))'
    );
    expect(teleportMethod).toContain('this._inputStateByInputSource.get(inputSource)');
    expect(teleportMethod).toContain(
      'void pulseWebXRInputHaptics(inputState, {intensity: 0.5, duration: 45})'
    );
    expect(teleportMethod).toContain('this._floorHitByInputSource.clear()');
    expect(clearMethod).toContain(
      "session?.removeEventListener('selectend', this._xrSelectEndListener)"
    );
    expect(clearMethod).toContain(
      "session?.removeEventListener('squeezeend', this._xrSqueezeEndListener)"
    );
    expect(clearMethod).toContain('this.xrSceneOffset[0] = 0');
    expect(clearMethod).toContain('this._lastXRLocomotionTimeMilliseconds = null');
    expect(clearMethod).toContain('this._floorHitByInputSource.clear()');
    expect(clearMethod).toContain('this._inputStateByInputSource.clear()');
    expect(applicationSource).toContain(
      "event.key === 'Escape' || event.key.toLowerCase() === 'q'"
    );

    const sceneOffset: [number, number, number] = [1, 2, 3];
    expect(applyXRSceneOffset(sceneOffset, [-0.5, 0, 1.25])).toBe(sceneOffset);
    expect(sceneOffset).toEqual([0.5, 2, 4.25]);
  });

  test('requests isolated XR-compatible website devices while preserving preview fallback', () => {
    const examplesSource = readFileSync(WEBSITE_EXAMPLES_PATH, 'utf8');
    const wrapperSource = readFileSync(WEBSITE_EXAMPLE_WRAPPER_PATH, 'utf8');
    const deviceStoreSource = readFileSync(WEBSITE_DEVICE_STORE_PATH, 'utf8');
    const exampleStart = examplesSource.indexOf('export const WebXRKaleidoscopeExample');
    const exampleEnd = examplesSource.indexOf('\nfunction isCameraPermissionBlocked', exampleStart);
    const exampleSource = examplesSource.slice(exampleStart, exampleEnd);

    expect(exampleStart).toBeGreaterThan(0);
    expect(exampleEnd).toBeGreaterThan(exampleStart);
    expect(exampleSource).toContain("devices={['webgpu', 'webgl2']}");
    expect(exampleSource).toMatch(/\s+xrCompatible(?:\s|=)/);
    expect(exampleSource).toContain('native stereo projection layers when supported');
    expect(exampleSource).toContain('choose WebGL2 for immersive fallback');
    expect(exampleSource).toContain('id="webxr-dom-overlay"');
    expect(wrapperSource).toContain('xrCompatible?: boolean');
    expect(wrapperSource).toContain('props.xrCompatible === true');
    expect(wrapperSource).toContain('continuing with desktop preview');
    expect(deviceStoreSource).toContain(':xr-compatible');
    expect(deviceStoreSource).toContain('{xrCompatible: true}');
  });

  test('advertises native WebGPU XR only when the active application device supports it', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const examplesSource = readFileSync(WEBSITE_EXAMPLES_PATH, 'utf8');
    const exampleStart = examplesSource.indexOf('export const WebXRKaleidoscopeExample');
    const exampleEnd = examplesSource.indexOf('\nfunction isCameraPermissionBlocked', exampleStart);
    const exampleSource = examplesSource.slice(exampleStart, exampleEnd);

    expect(applicationSource).toContain('static subscribeToCurrent(listener: () => void)');
    expect(applicationSource).toContain('AppAnimationLoopTemplate.setCurrent(this)');
    expect(applicationSource).toContain('AppAnimationLoopTemplate.setCurrent(null)');
    expect(applicationSource).toContain('private static notifyCurrentListeners(): void');
    expect(applicationSource).toContain('AppAnimationLoopTemplate.notifyCurrentListeners()');
    expect(exampleSource).toContain('useSyncExternalStore(');
    expect(exampleSource).toContain('WebXRKaleidoscopeApp.subscribeToCurrent');
    expect(exampleSource).toContain(
      'const activeXRMode = activeApplication?.xrSessionMode ?? null'
    );
    expect(exampleSource).toContain(
      'const isXRLive = Boolean(activeApplication?.xrSession && activeXRMode)'
    );
    expect(exampleSource).toContain('const effectiveDevice = activeApplication?.device');
    expect(exampleSource).toContain('selectedDevice?.type === effectiveDevice?.type');
    expect(exampleSource).toContain('effectiveDevice?.props.xrCompatible === true');
    expect(exampleSource).toMatch(
      /const backendDescription\s*=\s*usesWebGPU\s*\?\s*hasNativeWebGPUXR/
    );
    expect(exampleSource).toContain('const handleExitXR = async () =>');
    expect(exampleSource).toContain('await app.exitXR()');
    expect(exampleSource).toContain('Exit XR');
    expect(exampleSource).toContain('disabled={xrStatus ===');
    expect(exampleSource).toContain('isXRLive');
  });

  test('keeps standalone launch, sidebar, and backend metadata accurate', () => {
    const applicationSource = readFileSync(APPLICATION_PATH, 'utf8');
    const standaloneSource = readFileSync(STANDALONE_PATH, 'utf8');
    const metadataSource = readFileSync(EXAMPLE_METADATA_PATH, 'utf8');
    const packageSource = JSON.parse(readFileSync(PACKAGE_PATH, 'utf8')) as {
      dependencies: Record<string, string>;
    };

    expect(standaloneSource).toContain("import {luma} from '@luma.gl/core'");
    expect(standaloneSource).toContain("import {webgpuAdapter} from '@luma.gl/webgpu'");
    expect(standaloneSource).toContain("import {webgl2Adapter} from '@luma.gl/webgl'");
    expect(standaloneSource).toContain("luma.createDevice(makeDeviceProps('webgpu', true))");
    expect(standaloneSource).toContain(
      'makeAnimationLoop(AnimationLoopTemplate, {device: currentDevice})'
    );
    expect(standaloneSource).toContain("toggleSession('immersive-vr')");
    expect(standaloneSource).toContain("toggleSession('immersive-ar')");
    expect(standaloneSource).toContain('id="exit-xr"');
    expect(standaloneSource).toContain("function updateSessionControls(message = '')");
    expect(standaloneSource).toContain('exitXRButton.hidden = !isLive');
    expect(standaloneSource).toContain('enterVRButton.disabled = isLive');
    expect(standaloneSource).toContain('switchBackendButton.disabled = isLive');
    expect(standaloneSource).toContain("exitXRButton.addEventListener('click'");
    expect(standaloneSource).toContain('AnimationLoopTemplate.subscribeToCurrent');
    expect(standaloneSource).toContain('switch-backend');
    expect(standaloneSource).toContain('id="webxr-dom-overlay"');
    expect(standaloneSource).toContain('.portal-panel:xr-overlay');
    expect(applicationSource).toContain(
      'https://chromewebstore.google.com/detail/codex/hehggadaopoacecdllhhajmbjkdcmajg?pli=1'
    );
    expect(readFileSync(WEBSITE_EXAMPLES_PATH, 'utf8')).toContain(
      'https://chromewebstore.google.com/detail/codex/hehggadaopoacecdllhhajmbjkdcmajg?pli=1'
    );
    expect(metadataSource).toContain('backends: [webgpu, webgl2]');
    expect(metadataSource).toContain('Immersive Prism Portal');
    expect(packageSource.dependencies).toHaveProperty('@luma.gl/webgpu');
    expect(packageSource.dependencies).toHaveProperty('@luma.gl/webgl');
  });
});
