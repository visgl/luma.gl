// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, test} from 'vitest';
import FP64App, {
  formatFP64RenderTiming,
  getVisualizationDefines,
  makeFP64SettingsSchema
} from '../../examples/experimental/fp64/app';
import {requiresFP64ArithmeticUniform} from '../../examples/experimental/fp64/fp64-compute-benchmark';

describe('FP64 example responsive layout', () => {
  test('keeps each precision description paired with its canvas when the panes stack', () => {
    const markup = renderToStaticMarkup(React.createElement(FP64App));
    const singlePrecisionPane = markup.indexOf('data-fp64-visualization="fp32"');
    const singlePrecisionCanvas = markup.indexOf('<canvas', singlePrecisionPane);
    const doublePrecisionPane = markup.indexOf('data-fp64-visualization="fp64"');
    const doublePrecisionCanvas = markup.indexOf('<canvas', doublePrecisionPane);

    expect(markup).toContain(
      'grid-template-columns:repeat(auto-fit, minmax(min(100%, 320px), 1fr))'
    );
    expect(markup.match(/grid-template-rows:1fr auto/g)?.length).toBe(2);
    expect(singlePrecisionPane).toBeGreaterThanOrEqual(0);
    expect(singlePrecisionCanvas).toBeGreaterThan(singlePrecisionPane);
    expect(doublePrecisionPane).toBeGreaterThan(singlePrecisionCanvas);
    expect(doublePrecisionCanvas).toBeGreaterThan(doublePrecisionPane);
  });

  test('contains bordered canvases, telemetry overlays, and benchmark metadata', () => {
    const markup = renderToStaticMarkup(React.createElement(FP64App));

    expect(markup).toContain('box-sizing:border-box;display:block;width:100%');
    expect(markup).toContain('left:12px;right:12px;bottom:12px;box-sizing:border-box');
    expect(markup).toContain('max-width:calc(100% - 24px)');
    expect(markup.match(/overflow-wrap:anywhere/g)?.length).toBeGreaterThanOrEqual(3);
  });

  test('offers an explicit WebGL2 backend for standalone rendering', () => {
    const settings = makeFP64SettingsSchema().sections.flatMap(section => section.settings);
    const backendSetting = settings.find(setting => setting.name === 'selectedBackend');
    const arithmeticSetting = settings.find(setting => setting.name === 'selectedArithmeticMode');
    const zoomSetting = settings.find(setting => setting.name === 'zoomDepth');
    const renderWidthSetting = settings.find(setting => setting.name === 'renderWidth');

    expect(backendSetting?.options).toContainEqual({label: 'WebGL2', value: 'webgl'});
    expect(arithmeticSetting?.options).toEqual([
      {label: 'Classic · fast', value: 'classic'},
      {label: 'Hybrid · balanced', value: 'hybrid'},
      {label: 'Integer · reliable', value: 'integer'}
    ]);
    expect(zoomSetting).toEqual(
      expect.objectContaining({type: 'number', min: 0, step: 0.1, sliderDebounceMs: 0})
    );
    expect(renderWidthSetting).toEqual(
      expect.objectContaining({type: 'number', min: 160, max: 640, step: 20})
    );
    expect(makeFP64SettingsSchema(false).sections[0].settings).not.toContainEqual(
      expect.objectContaining({name: 'selectedBackend'})
    );
  });

  test('formats render time as an explicitly labeled FPS-equivalent', () => {
    expect(formatFP64RenderTiming({milliseconds: 4, source: 'GPU completion'})).toBe(
      'fp64 GPU completion = 4.00 ms · 250.0 FPS-equivalent'
    );
    expect(formatFP64RenderTiming({milliseconds: 0.25, source: 'CPU encode'})).toBe(
      'fp64 CPU encode = 0.250 ms · 4000.0 FPS-equivalent'
    );
  });

  test('binds the fp64 module uniform for every benchmark path that reads it', () => {
    expect(requiresFP64ArithmeticUniform('hybrid', 'divide', 'apple')).toBe(true);
    expect(requiresFP64ArithmeticUniform('hybrid', 'multiply', 'apple')).toBe(false);
    expect(requiresFP64ArithmeticUniform('automatic', 'divide', 'apple')).toBe(false);
    expect(requiresFP64ArithmeticUniform('automatic', 'divide', 'nvidia')).toBe(true);
    expect(requiresFP64ArithmeticUniform('classic', 'add', 'nvidia')).toBe(false);
  });

  test('selects explicit FP64 arithmetic modes on WebGPU', () => {
    const appleWebGPUDevice = {info: {gpu: 'apple' as const}, type: 'webgpu' as const};
    const otherWebGPUDevice = {info: {gpu: 'nvidia' as const}, type: 'webgpu' as const};
    const webGLDevice = {info: {gpu: 'apple' as const}, type: 'webgl' as const};

    expect(getVisualizationDefines(appleWebGPUDevice, 'fp32', 'hybrid')).toEqual({});
    expect(getVisualizationDefines(appleWebGPUDevice, 'fp64', 'hybrid')).toEqual({
      LUMA_FP64_HYBRID_ARITHMETIC: true,
      LUMA_FP64_INTEGER_ARITHMETIC: false
    });
    expect(getVisualizationDefines(otherWebGPUDevice, 'fp64', 'classic')).toEqual({
      LUMA_FP64_HYBRID_ARITHMETIC: false,
      LUMA_FP64_INTEGER_ARITHMETIC: false
    });
    expect(getVisualizationDefines(otherWebGPUDevice, 'fp64', 'integer')).toEqual({
      LUMA_FP64_HYBRID_ARITHMETIC: false,
      LUMA_FP64_INTEGER_ARITHMETIC: true
    });
    expect(getVisualizationDefines(webGLDevice, 'fp64', 'integer')).toEqual({});
  });
});
