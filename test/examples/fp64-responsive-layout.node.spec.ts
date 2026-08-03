// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, test} from 'vitest';
import FP64App from '../../examples/experimental/fp64/app';

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
});
