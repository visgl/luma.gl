// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React from 'react';
import type {Device} from '@luma.gl/core';
import type {FP64BenchmarkMode, FP64ComputeBenchmarkResult} from './fp64-compute-benchmark';

export function makeFP64ExampleLayout(props: {
  benchmarkError: string | null;
  benchmarkResults: FP64ComputeBenchmarkResult[] | null;
  canvasHeight: number;
  canvasRefs: readonly React.RefObject<HTMLCanvasElement>[];
  canvasWidth: number;
  device: Device | null;
  initializationError: string | null;
  isAutoZooming: boolean;
  isBenchmarkRunning: boolean;
  isReady: boolean;
  onRunBenchmark: () => Promise<void>;
  onToggleAutoZoom: () => void;
  settingsHostId: string;
  visualizations: Array<{
    canvasRef: React.RefObject<HTMLCanvasElement>;
    description: string;
    kind: string;
    overlayLines: string[];
    title: string;
  }>;
}): React.ReactNode {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        minWidth: 0,
        padding: 20,
        width: '100%'
      }}
    >
      {props.initializationError ? (
        <p style={{color: '#b00020', margin: 0}}>{props.initializationError}</p>
      ) : null}
      <div id={props.settingsHostId} />
      <button
        onClick={props.onToggleAutoZoom}
        style={{alignSelf: 'flex-start', padding: '7px 12px'}}
        type="button"
      >
        {props.isAutoZooming ? 'Stop automatic zoom' : 'Start automatic zoom'}
      </button>
      <div
        style={{
          display: 'grid',
          // Keep the precision views side by side so their zoomed regions can be compared directly.
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 20,
          alignItems: 'stretch',
          minWidth: 0
        }}
      >
        {props.visualizations.map(visualization => (
          <div
            data-fp64-visualization={visualization.kind}
            key={visualization.kind}
            style={{display: 'grid', gridTemplateRows: 'auto 1fr', gap: 12, minWidth: 0}}
          >
            <ExamplePaneCanvas
              canvasHeight={props.canvasHeight}
              canvasRef={visualization.canvasRef}
              canvasWidth={props.canvasWidth}
              isReady={props.isReady}
              overlayLines={visualization.overlayLines}
            />
            <ExamplePaneCopy description={visualization.description} title={visualization.title} />
          </div>
        ))}
      </div>
      <FP64BenchmarkPanel
        device={props.device}
        error={props.benchmarkError}
        isRunning={props.isBenchmarkRunning}
        onRun={props.onRunBenchmark}
        results={props.benchmarkResults}
      />
    </div>
  );
}

function ExamplePaneCopy(props: {description: string; title: string}): React.ReactNode {
  const {description, title} = props;

  return (
    <div
      style={{
        minWidth: 0,
        width: '100%'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          paddingBottom: 2
        }}
      >
        <h3 style={{marginTop: 0, marginBottom: 6}}>{title}</h3>
        <p style={{margin: 0, lineHeight: 1.45}}>{description}</p>
      </div>
    </div>
  );
}

function ExamplePaneCanvas(props: {
  canvasHeight: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasWidth: number;
  isReady: boolean;
  overlayLines: string[];
}): React.ReactNode {
  const {canvasHeight, canvasRef, canvasWidth, isReady, overlayLines} = props;

  return (
    <div
      style={{
        minWidth: 0,
        width: '100%',
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          boxSizing: 'border-box',
          display: 'block',
          width: '100%',
          height: 'auto',
          aspectRatio: `${canvasWidth} / ${canvasHeight}`,
          border: '1px solid #1f192c',
          background: '#000',
          opacity: isReady ? 1 : 0.5
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 6,
          right: 6,
          bottom: 6,
          boxSizing: 'border-box',
          maxWidth: 'calc(100% - 12px)',
          padding: '5px 7px',
          background: 'rgba(0, 0, 0, 0.52)',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: 10,
          lineHeight: 1.25,
          borderRadius: 5,
          overflowWrap: 'anywhere',
          pointerEvents: 'none'
        }}
      >
        {overlayLines.map(line => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function FP64BenchmarkPanel(props: {
  device: Device | null;
  error: string | null;
  isRunning: boolean;
  onRun: () => Promise<void>;
  results: FP64ComputeBenchmarkResult[] | null;
}): React.ReactNode {
  const {device, error, isRunning, onRun, results} = props;
  const isWebGPU = device?.type === 'webgpu';
  const automaticSelection =
    isWebGPU && device.info.gpu === 'apple' ? 'Metal-safe integer' : 'classic';

  return (
    <section
      style={{
        border: '1px solid #d7d2df',
        borderRadius: 10,
        padding: 16,
        minWidth: 0
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap'
        }}
      >
        <div style={{maxWidth: 760}}>
          <h3 style={{margin: '0 0 6px'}}>FP64 compute benchmark</h3>
          <p style={{margin: 0, lineHeight: 1.45}}>
            Runs dependent add, multiply, divide, and square-root recurrences across 8,192 GPU
            lanes. Results compare native float32, automatic selection, classic, hybrid, and
            integer-controlled double-single arithmetic. The Mandelbrot animation pauses while the
            benchmark runs.
          </p>
        </div>
        <button
          disabled={!isWebGPU || isRunning}
          onClick={() => void onRun()}
          style={{padding: '8px 14px', whiteSpace: 'nowrap'}}
          type="button"
        >
          {isRunning ? 'Running benchmark…' : 'Run WebGPU benchmark'}
        </button>
      </div>
      <p
        style={{
          margin: '12px 0 0',
          fontFamily: 'monospace',
          fontSize: 12,
          overflowWrap: 'anywhere'
        }}
      >
        {device
          ? `device = ${getBenchmarkDeviceLabel(device)} · automatic = ${automaticSelection}`
          : 'device = initializing'}
      </p>
      {!isWebGPU ? (
        <p style={{margin: '10px 0 0'}}>This benchmark is available on WebGPU devices only.</p>
      ) : null}
      {error ? <p style={{color: '#b00020', margin: '10px 0 0'}}>{error}</p> : null}
      {results ? <FP64BenchmarkResultsTable results={results} /> : null}
    </section>
  );
}

function FP64BenchmarkResultsTable(props: {
  results: FP64ComputeBenchmarkResult[];
}): React.ReactNode {
  return (
    <div style={{overflowX: 'auto', marginTop: 16}}>
      <table style={{borderCollapse: 'collapse', fontSize: 13, width: '100%'}}>
        <thead>
          <tr>
            {[
              'Operation',
              'Arithmetic path',
              'Runtime',
              'Throughput',
              'Max relative error',
              'Timer'
            ].map(heading => (
              <th
                key={heading}
                style={{borderBottom: '1px solid #a9a2b5', padding: '7px 9px', textAlign: 'left'}}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.results.map(result => (
            <tr key={`${result.operation}-${result.mode}`}>
              <td style={BENCHMARK_CELL_STYLE}>{result.operation}</td>
              <td style={BENCHMARK_CELL_STYLE}>{formatBenchmarkMode(result.mode)}</td>
              {result.error !== undefined ? (
                <td colSpan={4} style={{...BENCHMARK_CELL_STYLE, color: '#b00020'}}>
                  {result.error}
                </td>
              ) : (
                <>
                  <td style={BENCHMARK_CELL_STYLE}>
                    {formatBenchmarkRuntime(result.runtimeMilliseconds)}
                  </td>
                  <td style={BENCHMARK_CELL_STYLE}>
                    {result.throughputMillionIterationsPerSecond.toFixed(2)} M iter/s
                  </td>
                  <td style={BENCHMARK_CELL_STYLE}>
                    {formatBenchmarkError(result.maximumRelativeError)}
                  </td>
                  <td style={BENCHMARK_CELL_STYLE}>{result.timing}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{fontSize: 12, lineHeight: 1.4, margin: '10px 0 0'}}>
        Timed work uses three dispatches of 8,192 lanes × 32 dependent iterations. Accuracy is
        checked once after timing against JavaScript number arithmetic; no performance threshold is
        enforced.
      </p>
    </div>
  );
}

const BENCHMARK_CELL_STYLE: React.CSSProperties = {
  borderBottom: '1px solid #e4e0e8',
  padding: '7px 9px',
  textAlign: 'left',
  whiteSpace: 'nowrap'
};

function getBenchmarkDeviceLabel(device: Device): string {
  const adapter = device.info.renderer || device.info.vendor || device.info.gpu;
  const backend = device.info.gpuBackend || device.type;
  return `${adapter} (${backend})`;
}

function formatBenchmarkMode(mode: FP64BenchmarkMode): string {
  switch (mode) {
    case 'automatic':
      return 'FP64 automatic';
    case 'classic':
      return 'FP64 classic';
    case 'hybrid':
      return 'FP64 hybrid';
    case 'integer':
      return 'FP64 integer';
    case 'float32':
      return 'native float32';
  }
}

function formatBenchmarkRuntime(runtimeMilliseconds: number): string {
  return runtimeMilliseconds < 1
    ? `${runtimeMilliseconds.toFixed(3)} ms`
    : `${runtimeMilliseconds.toFixed(2)} ms`;
}

function formatBenchmarkError(relativeError: number): string {
  return relativeError === 0 ? '0' : relativeError.toExponential(2);
}
