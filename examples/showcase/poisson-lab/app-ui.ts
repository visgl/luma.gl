// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {PoissonLabMetrics} from './poisson-lab-engine';

export type PoissonLabMode = 'beauty' | 'engineering';

export function makePoissonLabPanelHtml(metrics: PoissonLabMetrics): string {
  return `<div data-poisson-lab>
<style>
[data-poisson-lab]{font:12px/1.45 system-ui,sans-serif;color:#eaf7ff}.poisson-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px}.poisson-tabs button{padding:8px;border-radius:7px;border:1px solid #31566c;background:#102838;color:#dff5ff;cursor:pointer}.poisson-tabs button[data-active=true]{background:#194663;border-color:#6ecbff}.poisson-metric{display:flex;justify-content:space-between;gap:16px;padding:5px 0;border-bottom:1px solid #173344}.poisson-value{font-variant-numeric:tabular-nums;color:#9ee7ff}.poisson-note{margin-top:12px;color:#9eb8c7}.poisson-proof,.poisson-explainer{margin-top:12px;padding:10px;border:1px solid #31566c;border-radius:8px;background:#0b1e2a}.poisson-proof strong,.poisson-explainer strong{color:#b9f3ff}.poisson-equation{font:600 14px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:#dff8ff;margin:8px 0}.poisson-uses{margin:8px 0 0;padding-left:18px;color:#a9c8d8}
</style>
<div class="poisson-tabs"><button data-mode="beauty" data-active="true">Beauty</button><button data-mode="engineering">Engineering</button></div>
<div data-panel="beauty">
<div class="poisson-explainer"><strong>What is a Poisson solver?</strong><br/>It finds the field everywhere inside a region when you know two things: <em>what is creating or removing the field</em>, and <em>what the field must do at the boundaries</em>. The solution is the unique smooth equilibrium that satisfies both.</div>
<div class="poisson-equation">−Δu = f</div>
<p>Here <strong>u</strong> is the unknown field, <strong>f</strong> describes its sources and sinks, and <strong>Δ</strong> measures how strongly each point differs from its surroundings. Solving Poisson's equation means finding the globally consistent field whose local curvature matches those sources.</p>
<p>This same mathematical problem appears in <strong>steady heat flow</strong>, <strong>electrostatic potential</strong>, <strong>gravity</strong>, and the <strong>pressure solve used to make simulated fluids incompressible</strong>.</p>
<p>Poisson Lab converts that continuous equation into a sparse grid system, solves it on the GPU, and visualizes the resulting field. Orbit the solved potential surface; contours reveal equal-potential lines and gradient traces show the direction of steepest change.</p>
<p class="poisson-note">For verification, this preset has a known exact answer: <strong>u(x,y)=sin(πx)sin(πy)</strong>. That lets the demo test whether the solver is numerically right—not merely visually plausible.</p>
</div>
<div data-panel="engineering" hidden>
<div class="poisson-explainer"><strong>From PDE to sparse linear algebra</strong><br/>The five-point finite-difference stencil couples each interior grid point only to its four neighbors. Discretizing <strong>−Δu=f</strong> therefore produces a sparse symmetric positive-definite system <strong>Au=b</strong>, ideal for preconditioned conjugate gradient. The graph composes CSR SpMV, reductions, GPU scalars, Jacobi preconditioning and vector updates rather than hiding the solve in one monolithic shader.</div>
${metric('Grid',`${metrics.resolution} × ${metrics.resolution}`)}
${metric('Unknowns',metrics.unknowns.toLocaleString())}
${metric('CSR nonzeros',metrics.nonZeros.toLocaleString())}
${metric('Graph nodes',String(metrics.graphNodes))}
${metric('SpMV strategy',metrics.spmvStrategy)}
${metric('Preconditioner',metrics.preconditioner)}
${metric('Iterations',formatNullable(metrics.iterations))}
${metric('Relative residual',formatScientific(metrics.relativeResidual))}
${metric('Relative solution error',formatScientific(metrics.relativeError))}
<div class="poisson-proof"><strong>Correctness contract</strong><br/>Residual answers “did we solve the discrete linear system?” Solution error answers “does that solution agree with the known analytical PDE solution?” Both remain explicitly unavailable until measured from the real GPU solver. The showcase never substitutes simulated convergence metrics.</div>
</div></div>`;
}

export function bindPoissonLabPanel(root: HTMLElement, onMode: (mode: PoissonLabMode) => void): void {
  const buttons=[...root.querySelectorAll<HTMLButtonElement>('[data-mode]')];
  const panels=[...root.querySelectorAll<HTMLElement>('[data-panel]')];
  for(const button of buttons){button.onclick=()=>{const mode=button.dataset.mode as PoissonLabMode;for(const item of buttons)item.dataset.active=String(item===button);for(const panel of panels)panel.hidden=panel.dataset.panel!==mode;onMode(mode);};}
}

function metric(label:string,value:string):string{return `<div class="poisson-metric"><span>${label}</span><span class="poisson-value">${value}</span></div>`;}
function formatNullable(value:number|null):string{return value===null?'not yet published':String(value);}
function formatScientific(value:number|null):string{return value===null?'not yet measured':value.toExponential(3);}
