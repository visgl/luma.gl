# Signal Room

A WebGPU-only example for `@luma.gl/graph/gpu-timeseries`: three linked charts with
3,145,728 synthetic observations, spike-preserving envelopes, explicit gaps and source-ID inspection.

Run from the repository root:

```sh
yarn vite examples/experimental/gpu-timeseries --config examples/experimental/gpu-timeseries/vite.config.ts
```

Or open `/examples/experimental/gpu-timeseries` in the website.

Expand the **Signal Room** infobox and select **Controls**. Use **1. Inspect incident** to zoom all channels to a correlated burst. Toggle the display to see
how choosing one sample per bin loses spikes. **3. Inspect missing data** shows empty and partially missing
bins. Drag or scroll to zoom, use the Zoom and Pan sliders, and click a chart to read one 40-byte GPU bin.
The render path binds GPU summaries directly; it does not download points per frame.

Source generation and initial upload happen on the CPU. Each channel keeps three source buffers.
Range changes execute one reset and three reduction passes per channel; unchanged ranges reuse the
existing results. Fixed 1,024-bin outputs occupy 40 KiB per channel. This is a visible-range scan,
not a precomputed multiresolution index. No timing numbers or speedup are simulated.

The **GPU Graph** tab uses the shared graph inspector to show compiled reduction nodes, memory, and CPU encoding measurements. It updates when the visible range changes; GPU timings are read asynchronously when timestamp queries are supported, with at most one readback in flight. All timing columns use milliseconds.
