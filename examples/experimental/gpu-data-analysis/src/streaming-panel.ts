// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import type {GPUIncrementalBatch} from '@luma.gl/gpgpu/gpu-core';
import {StreamingAnalytics, type StreamingAnalyticsBatch} from './streaming-analytics';

/** A bounded live stream with visible cache accounting and explicit replacement/removal controls. */
export function mountStreamingPanel(root: HTMLElement, device: Device): () => void {
  const panel = document.createElement('section');
  panel.style.cssText =
    'margin:24px 0;padding:24px;border:1px solid #64748b;border-radius:12px;background:#101827;color:#e2e8f0;font:14px system-ui';
  panel.innerHTML = `
    <h2>Live streaming analytics</h2>
    <p>Every batch adds 256 observations. The live view retains six batches, without copying their source buffers.</p>
    <p>Sum, ten fixed histogram bins, four group counts, and the five largest values update together.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button data-action="append">Append batch</button>
      <button data-action="replace">Replace latest</button>
      <button data-action="remove">Remove oldest</button>
      <button data-action="repeat">Repeat unchanged</button>
      <button data-action="domain">Change histogram domain</button>
    </div>
    <p data-status role="status">Starting stream…</p>
    <div data-histogram style="display:flex;align-items:end;gap:6px;height:140px" aria-label="Live histogram"></div>
    <pre data-results style="white-space:pre-wrap"></pre>
  `;
  const footer = root.querySelector('footer');
  if (footer) footer.before(panel);
  else root.append(panel);
  const analytics = new StreamingAnalytics(device);
  const batches: GPUIncrementalBatch<StreamingAnalyticsBatch>[] = [];
  let sequence = 0;
  let destroyed = false;
  let busy = false;
  let narrowDomain = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const buttons = [...panel.querySelectorAll<HTMLButtonElement>('button')];
  const status = panel.querySelector<HTMLElement>('[data-status]')!;
  const histogram = panel.querySelector<HTMLElement>('[data-histogram]')!;
  const results = panel.querySelector<HTMLElement>('[data-results]')!;

  function createBatch(id: string, revision: number): GPUIncrementalBatch<StreamingAnalyticsBatch> {
    const firstRow = sequence++ * 256;
    const column = (values: Uint32Array) => ({
      format: 'uint32' as const,
      length: values.length,
      data: [
        new GPUData({
          buffer: device.createBuffer({data: values, usage: Buffer.STORAGE | Buffer.COPY_DST}),
          format: 'uint32' as const,
          length: values.length,
          ownsBuffer: true
        })
      ]
    });
    return {
      id,
      revision,
      data: {
        values: column(
          Uint32Array.from({length: 256}, (_, index) => (index * 37 + firstRow * 13) % 101)
        ),
        groups: column(Uint32Array.from({length: 256}, (_, index) => (index + sequence) % 4)),
        rowIds: column(Uint32Array.from({length: 256}, (_, index) => firstRow + index))
      }
    };
  }

  async function run(action: string): Promise<void> {
    if (destroyed || busy) return;
    busy = true;
    buttons.forEach(button => {
      button.disabled = true;
    });
    const retired: GPUIncrementalBatch<StreamingAnalyticsBatch>[] = [];
    try {
      if (action === 'append') {
        batches.push(createBatch(`batch-${sequence}`, 0));
        if (batches.length > 6) retired.push(batches.shift()!);
      } else if (action === 'replace' && batches.length) {
        const previous = batches.pop()!;
        retired.push(previous);
        batches.push(createBatch(previous.id, previous.revision + 1));
      } else if (action === 'remove' && batches.length) {
        retired.push(batches.shift()!);
      } else if (action === 'domain') {
        narrowDomain = !narrowDomain;
        analytics.setDomain(narrowDomain ? [0, 50] : [0, 100]);
      }
      const stats = analytics.update(batches);
      const read = async (data: GPUData<'uint32'>) => {
        const bytes = await data.buffer.readAsync();
        return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, data.length));
      };
      const [sum, bins, groups, topValues, topRows] = await Promise.all([
        read(analytics.outputs.sum),
        read(analytics.outputs.histogram),
        read(analytics.outputs.groups),
        read(analytics.outputs.topValues),
        read(analytics.outputs.topRows)
      ]);
      if (destroyed) return;
      status.textContent = `${batches.length} batches · computed ${stats.computedBatchIds.length} · reused ${stats.reusedBatchIds.length} · removed ${stats.removedBatchIds.length} · ${stats.batchNodeCount} batch commands · ${stats.mergeNodeCount} merge commands · ${stats.cachedByteLength} cached bytes`;
      histogram.replaceChildren(
        ...bins.map((count, index) => {
          const bar = document.createElement('div');
          bar.style.cssText = `flex:1;min-height:2px;height:${Math.max(2, (count / Math.max(1, ...bins)) * 100)}%;background:#38bdf8;text-align:center;color:#07111e`;
          bar.title = `Bin ${index}: ${count}`;
          bar.textContent = String(count);
          return bar;
        })
      );
      results.textContent = `Sum: ${sum[0]}\nGroup counts: ${groups.join(', ')}\nTop values: ${topValues.slice(0, analytics.topCount).join(', ')}\nStable row IDs: ${topRows.slice(0, analytics.topCount).join(', ')}\nHistogram domain: 0–${narrowDomain ? 50 : 100}\nInvalidation: ${stats.invalidation}`;
    } catch (error) {
      if (!destroyed) status.textContent = String(error);
    } finally {
      retired.forEach(destroyBatch);
      busy = false;
      buttons.forEach(button => {
        button.disabled = false;
      });
    }
  }
  const handleClick = (event: Event) => {
    const action = (event.currentTarget as HTMLButtonElement).dataset.action!;
    void run(action);
  };
  buttons.forEach(button => button.addEventListener('click', handleClick));
  async function stream(): Promise<void> {
    await run('append');
    if (!destroyed && sequence < 6) timer = setTimeout(() => void stream(), 900);
  }
  void stream();
  return () => {
    destroyed = true;
    clearTimeout(timer);
    buttons.forEach(button => button.removeEventListener('click', handleClick));
    analytics.destroy();
    batches.forEach(destroyBatch);
    panel.remove();
  };
}

function destroyBatch(batch: GPUIncrementalBatch<StreamingAnalyticsBatch>): void {
  for (const vector of Object.values(batch.data)) for (const data of vector.data) data.destroy();
}
