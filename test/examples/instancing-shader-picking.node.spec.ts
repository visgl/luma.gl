// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

const INSTANCING_APPLICATION_PATH = path.join(process.cwd(), 'examples/showcase/instancing/app.ts');

function getGLSLSource(applicationSource: string, declarationName: string): string {
  const declaration = `const ${declarationName} = /* glsl */`;
  const declarationStart = applicationSource.indexOf(declaration);
  const shaderStart = applicationSource.indexOf('\n', declarationStart) + 1;
  const shaderEnd = applicationSource.indexOf('\n`;', shaderStart);

  expect(declarationStart, `${declarationName} must declare a GLSL template`).toBeGreaterThan(0);
  expect(shaderEnd, `${declarationName} must terminate its GLSL template`).toBeGreaterThan(
    shaderStart
  );

  return applicationSource.slice(shaderStart, shaderEnd);
}

describe('homepage instancing shader and picking portability', () => {
  test('declares the identical HDR application uniform block in both GLSL stages', () => {
    const applicationSource = readFileSync(INSTANCING_APPLICATION_PATH, 'utf8');
    const applicationUniforms = getGLSLSource(applicationSource, 'APP_UNIFORMS_GLSL');
    const vertexSource = getGLSLSource(applicationSource, 'VS_GLSL');
    const fragmentSource = getGLSLSource(applicationSource, 'FS_GLSL');
    const uniformInterpolation = '${APP_UNIFORMS_GLSL}';
    const applicationUniformPattern = /uniform\s+appUniforms\s*\{([\s\S]*?)\}\s*app\s*;/;

    expect(applicationUniforms).toMatch(applicationUniformPattern);
    expect(applicationUniforms).toContain('float highDynamicRange;');

    for (const shaderSource of [vertexSource, fragmentSource]) {
      expect(shaderSource.match(/\$\{APP_UNIFORMS_GLSL\}/g)).toHaveLength(1);

      const expandedShaderSource = shaderSource.replace(uniformInterpolation, applicationUniforms);
      const uniformDeclaration = expandedShaderSource.match(applicationUniformPattern);

      expect(uniformDeclaration).not.toBeNull();
      expect(uniformDeclaration![1]).toContain('float highDynamicRange;');
      expect(expandedShaderSource.indexOf(uniformDeclaration![0])).toBeLessThan(
        expandedShaderSource.indexOf('app.highDynamicRange')
      );
    }

    expect(fragmentSource).toContain('app.highDynamicRange');
    expect(fragmentSource).toContain('mix(fragColor.rgb, wideGamutColor, app.highDynamicRange)');
  });

  test('reserves integer attachment picking models for WebGPU and uses color picking on WebGL', () => {
    const applicationSource = readFileSync(INSTANCING_APPLICATION_PATH, 'utf8');
    const pickerStart = applicationSource.indexOf('this.picker = new PickingManager(device, {');
    const pickerEnd = applicationSource.indexOf('\n    });', pickerStart);
    const createPickingCubeStart = applicationSource.indexOf('createPickingCube(): Model | null {');
    const createPickingCubeEnd = applicationSource.indexOf('\n  private ', createPickingCubeStart);

    expect(pickerStart).toBeGreaterThan(0);
    expect(pickerEnd).toBeGreaterThan(pickerStart);
    expect(createPickingCubeStart).toBeGreaterThan(0);
    expect(createPickingCubeEnd).toBeGreaterThan(createPickingCubeStart);

    const pickerConfiguration = applicationSource.slice(pickerStart, pickerEnd);
    const createPickingCube = applicationSource.slice(createPickingCubeStart, createPickingCubeEnd);

    expect(pickerConfiguration).toMatch(
      /mode:\s*device\.type\s*===\s*'webgpu'\s*\?\s*'index'\s*:\s*'color'/
    );
    expect(createPickingCube).toMatch(
      /if\s*\(this\.device\.type\s*!==\s*'webgpu'\)\s*\{\s*return null;\s*\}/
    );
    expect(createPickingCube.indexOf('return null;')).toBeLessThan(
      createPickingCube.indexOf('this.cube.createPickingModel(')
    );
    expect(applicationSource).toContain(
      "modules: [dirlight, device.type === 'webgpu' ? indexPicking : colorPicking]"
    );
  });

  test('ends the picking pass before deferring and handling asynchronous GPU readback', () => {
    const applicationSource = readFileSync(INSTANCING_APPLICATION_PATH, 'utf8');
    const pickInstanceStart = applicationSource.indexOf(
      'pickInstance(mousePosition: number[] | null | undefined) {'
    );
    const pickInstanceEnd = applicationSource.indexOf(
      '\n  createCube(): InstancedCube {',
      pickInstanceStart
    );

    expect(pickInstanceStart).toBeGreaterThan(0);
    expect(pickInstanceEnd).toBeGreaterThan(pickInstanceStart);

    const pickInstance = applicationSource.slice(pickInstanceStart, pickInstanceEnd);
    const renderPassStart = pickInstance.indexOf('this.picker.beginRenderPass()');
    const renderPassEnd = pickInstance.indexOf('pickingPass.end()');
    const deferredReadback = pickInstance.indexOf('void Promise.resolve()');
    const updatePickInfo = pickInstance.indexOf('this.picker.updatePickInfo(');
    const readbackFailureHandler = pickInstance.indexOf('.catch(error => {');

    expect(pickInstance).toContain('this.picker.shouldPick(');
    expect(renderPassStart).toBeGreaterThan(0);
    expect(renderPassEnd).toBeGreaterThan(renderPassStart);
    expect(deferredReadback).toBeGreaterThan(renderPassEnd);
    expect(updatePickInfo).toBeGreaterThan(deferredReadback);
    expect(readbackFailureHandler).toBeGreaterThan(updatePickInfo);
    expect(pickInstance).toContain("log.error('Instancing pick readback failed', error)()");
  });
});
