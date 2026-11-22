// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../playwright/get-playwright-launch-options.mjs';

import {checkExternalAssetOutcome} from './external-asset-outcomes.mjs';

const revision = '9dc61cb3474ff9a51f58d3592f79d5c9e572056a';
const samples = ['MotionProperties', 'Materials_Restitution', 'Materials_Friction', 'Filtering'];
const {values} = parseArgs({options: {url: {type: 'string'}, output: {type: 'string'}}});
const base = new URL(values.url || 'http://127.0.0.1:5254/');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname))
  throw new Error('Local example server required');
const browser = await chromium.launch(
  getPlaywrightLaunchOptions({headless: true, backend: 'webgpu-core'})
);
const reports = [];
try {
  for (const sample of samples) {
    console.error(`Qualifying ${sample}`);
    const url = `https://raw.githubusercontent.com/eoineoineoin/glTF_Physics/${revision}/samples/${sample}/${sample}.glb`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Asset fetch failed: ${response.status} ${url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const context = await browser.newContext();
    try {
      await context.route('**/main.ts*', route =>
        route.fulfill({contentType: 'text/javascript', body: ''})
      );
      await context.route('**/qualification.glb', route =>
        route.fulfill({body: bytes, contentType: 'model/gltf-binary'})
      );
      const page = await context.newPage();
      await page.goto(base.href);
      const result = await page.evaluate(
        async ({root}) => {
          const [
            {load},
            {GLTFLoader, GLTFScenegraph},
            physics,
            {makeLegacyMeshGeometryResolver},
            {luma},
            {webgpuAdapter},
            {GPUCommandGraph}
          ] = await Promise.all([
            import(`${root}/node_modules/@loaders.gl/core/dist/index.js`),
            import(`${root}/node_modules/@loaders.gl/scene/dist/gltf/index.js`),
            import(`${root}/modules/engine/src/gltf/physics/index.ts`),
            import(`${root}/examples/gltf/physics/legacy-mesh-positions.ts`),
            import(`${root}/modules/core/src/index.ts`),
            import(`${root}/modules/core/src/webgpu/index.ts`),
            import(`${root}/modules/graph/src/gpu-core/gpu-command-graph.ts`)
          ]);
          const asset = await load('/qualification.glb', GLTFLoader);
          const scene = new GLTFScenegraph(asset);
          const description = physics.parseGLTFPhysics(asset.json, {
            resolveNodeMeshGeometry: physics.makeGLTFPhysicsMeshResolver(scene),
            resolveLegacyMeshGeometry: makeLegacyMeshGeometryResolver(scene)
          });
          const imported = {
            supported: description.supported,
            issues: description.issues,
            bodyCount: description.bodies.length,
            colliderCount: description.colliders.length
          };
          if (!description.supported) return {imported, qualified: false};
          const device = await luma.createDevice({
            type: 'webgpu',
            featureLevel: 'core',
            adapters: [webgpuAdapter]
          });
          const world = physics.createGLTFPhysicsWorld(description, {
            timeStep: 1 / 120,
            iterations: 32,
            sleepAfter: 0
          });
          const definition = new GPUCommandGraph(device);
          world.addToGraph(definition);
          let graph;
          try {
            graph = await definition.compileAsync();
            const initial = await world.readState();
            const checkpoints = [];
            for (let tick = 0; tick < 240; tick += 30) {
              const encoder = device.createCommandEncoder();
              for (let step = 0; step < 30; step++) graph.encode(encoder, {parameters: undefined});
              device.submit(encoder.finish());
              checkpoints.push({
                tick: tick + 30,
                state: await world.readState(),
                diagnostics: await world.readSimulationDiagnostics()
              });
            }
            return {
              imported,
              adapter: device.info,
              initial,
              checkpoints,
              bodies: description.bodies.map(body => ({
                name: asset.json.nodes[body.nodeIndex]?.name,
                mode: body.body.mode,
                mass: body.body.mass,
                nodeIndex: body.nodeIndex
              })),
              logicalBufferBytes:
                graph.stats.importedBufferBytes + graph.stats.physicalTransientBytes
            };
          } finally {
            graph?.destroy();
            world.destroy();
            device.destroy();
          }
        },
        {root: `/@fs${process.cwd()}`}
      );
      const provenance = {
        revision,
        url,
        sha256,
        byteLength: bytes.length,
        browserVersion: browser.version(),
        profile: 'legacy geometry.mesh opt-in'
      };
      const objectCount = result.imported.bodyCount;
      reports.push({
        stage: 'external-asset-import',
        fixture: sample,
        objectCount,
        ...provenance,
        ...result.imported,
        qualified:
          result.imported.supported && result.imported.issues.length === 0 && objectCount > 0
      });
      const failures = [];
      if (!result.checkpoints?.length) failures.push('missing simulation');
      let moved = false;
      for (const checkpoint of result.checkpoints || []) {
        if (!checkpoint.diagnostics.complete || checkpoint.diagnostics.steps !== checkpoint.tick)
          failures.push('incomplete simulation');
        checkpoint.state.forEach((state, index) => {
          if (
            !['position', 'orientation', 'velocity', 'angularVelocity'].every(key =>
              state[key].every(Number.isFinite)
            )
          )
            failures.push('nonfinite state');
          const displacement = Math.hypot(
            ...state.position.map((value, axis) => value - result.initial[index].position[axis])
          );
          if (result.bodies[index].mode === 'static' && displacement > 1e-5)
            failures.push('static body moved');
          if (displacement > 0.1) moved = true;
        });
      }
      if (!moved) failures.push('no simulated movement');
      if (result.checkpoints && !checkExternalAssetOutcome(sample, result))
        failures.push('unexpected fixture outcome');
      reports.push({
        stage: 'external-asset-behavior',
        fixture: sample,
        objectCount,
        ...provenance,
        ...result,
        failures,
        qualified: failures.length === 0
      });
      await writeFile(
        path.resolve(values.output || 'external-assets.json'),
        `${JSON.stringify(reports, null, 2)}\n`
      );
      console.error(`${sample}: ${failures.length ? failures.join(', ') : 'passed'}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (reports.some(report => !report.qualified)) process.exitCode = 2;
