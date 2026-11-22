// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React, {useEffect, useRef, useState} from 'react';
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {webgl2Adapter} from '@luma.gl/core/webgl';
import {createAtlas} from '../../../../examples/api/buffer-atlas/app';

/** Mounts the selected buffer example and manages its canvas device. */
export function BufferAtlas({kind}: {kind: 'river' | 'canyon'}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRedraw = useRef<(() => void) | null>(null);
  const atlasRef = useRef<ReturnType<typeof createAtlas> | null>(null);
  const [value, setValue] = useState(0);
  const [error, setError] = useState('');
  const [selection, setSelection] = useState(0);
  const [backend, setBackend] = useState<'best-available' | 'webgpu' | 'webgl'>('best-available');
  useEffect(() => {
    const canvas = canvasRef.current!;
    let disposed = false;
    let frame = 0;
    let cleanup = () => {};
    setError('');
    luma
      .createDevice({
        type: backend,
        adapters: [webgpuAdapter, webgl2Adapter],
        createCanvasContext: {canvas, autoResize: false, useDevicePixels: false},
        webgl: {stencil: true, antialias: false}
      })
      .then(device => {
        if (disposed) {
          device.destroy();
          return;
        }
        cleanup = () => device.destroy();
        const atlas = createAtlas(device, kind);
        atlasRef.current = atlas;
        setSelection(0);
        setValue(kind === 'river' ? atlas.lenses[0][0] : 0);
        cleanup = () => {
          atlas.destroy();
          device.destroy();
        };
        const draw = (time: number) => {
          try {
            const drawn = atlas.render(time / 1000);
            if (kind === 'river' || !drawn) frame = requestAnimationFrame(draw);
          } catch (reason) {
            setError(String(reason));
          }
        };
        requestRedraw.current = () => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(draw);
        };
        draw(0);
      })
      .catch(reason => {
        if (!disposed) setError(String(reason));
      });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      atlasRef.current = null;
      requestRedraw.current = null;
      cleanup();
    };
  }, [kind, backend]);
  /** Moves the selected river lens in scene units or rotates the canyon relief. */
  function update(value: number) {
    setValue(value);
    const atlas = atlasRef.current;
    if (!atlas) return;
    if (kind === 'river') atlas.lenses[selection][0] = value;
    else {
      atlas.setAngle(value * 0.65);
      requestRedraw.current?.();
    }
  }
  return (
    <figure>
      <label>
        Backend{' '}
        <select
          value={backend}
          onChange={event => setBackend(event.target.value as typeof backend)}
        >
          <option value="best-available">Automatic</option>
          <option value="webgpu">WebGPU</option>
          <option value="webgl">WebGL2</option>
        </select>
      </label>
      <canvas
        key={backend}
        ref={canvasRef}
        width={640}
        height={400}
        aria-label={
          kind === 'river' ? 'River and culvert survey lenses' : 'Captured canyon depth relief'
        }
        style={{width: '100%', height: 'auto', touchAction: 'none'}}
        onPointerDown={event => {
          const canvas = event.currentTarget;
          canvas.setPointerCapture(event.pointerId);
          if (kind === 'river' && atlasRef.current) {
            const bounds = canvas.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 1.6;
            const y = 0.5 - (event.clientY - bounds.top) / bounds.height;
            const distance = atlasRef.current.lenses.map(lens =>
              Math.hypot(lens[0] - x, lens[1] - y)
            );
            const index = distance[0] <= distance[1] ? 0 : 1;
            setSelection(index);
            setValue(atlasRef.current.lenses[index][0]);
          }
        }}
        onPointerMove={event => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
          if (kind === 'river' && atlasRef.current) {
            const lens = atlasRef.current.lenses[selection];
            lens[0] = horizontal * 1.6;
            lens[1] = 0.5 - (event.clientY - bounds.top) / bounds.height;
            setValue(lens[0]);
          } else {
            update(Math.max(-1, Math.min(1, horizontal * 2)));
          }
        }}
      />
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <figcaption>
          {kind === 'river' ? (
            <label>
              Survey lens{' '}
              <select
                value={selection}
                onChange={event => {
                  const index = Number(event.target.value);
                  setSelection(index);
                  setValue(atlasRef.current?.lenses[index][0] ?? 0);
                }}
              >
                <option value="0">Historical river</option>
                <option value="1">Modern culverts</option>
              </select>
            </label>
          ) : null}
          <label>
            {kind === 'river' ? ' Lens position ' : ' Relief angle '}
            <input
              type="range"
              min={kind === 'river' ? -0.8 : -1}
              max={kind === 'river' ? 0.8 : 1}
              step=".01"
              value={value}
              onChange={event => update(Number(event.target.value))}
            />
          </label>
          {kind === 'canyon' && <button onClick={() => update(0)}>Return to photograph</button>}
        </figcaption>
      )}
    </figure>
  );
}
