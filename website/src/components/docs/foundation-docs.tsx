import Link from '@docusaurus/Link';
import React, {type ReactNode, useState} from 'react';
import {FOUNDATION_ADJACENCIES} from './foundation-docs-catalog';
import {GPU_DOCUMENTATION_TERMS, GPUTerm, type GPUTermName} from './gpu-terms';
import {FOUNDATION_JOURNEY} from './foundation-journey-model';
import {
  CORE_RESOURCE_LIFECYCLE,
  ENGINE_CORE_MAPPINGS,
  assembleTeachingShader,
  orderTeachingShaderModules,
  type TeachingShaderModule
} from './foundation-teaching-models';

export type FoundationModuleId = 'core' | 'engine' | 'shadertools';

const MODULE_DETAILS = {
  core: {
    label: 'Core',
    purpose: 'Portable GPU resources, commands, passes, submission, presentation, and readback.',
    apiHref: '/docs/api-reference/generated/core',
    guideHref: '/docs/api-guide/gpu',
    cookbookHref: '/docs/api-guide/gpu/cookbook',
    concepts: ['Device and adapters', 'Resources and ownership', 'Layouts and bindings', 'Pipelines', 'Encoding and submission', 'Presentation and readback'],
    features: [
      {name: 'Portable adapters', outcome: 'Choose WebGPU or WebGL 2 without changing the application-facing device model.'},
      {name: 'Explicit resources', outcome: 'Control GPU memory, usage flags, ownership, updates, and destruction.'},
      {name: 'Layouts and bindings', outcome: 'Connect typed application data to shader-visible attributes, uniforms, textures, and storage.'},
      {name: 'Pipelines and passes', outcome: 'Compile reusable GPU state and encode bounded render or compute work.'},
      {name: 'Submission and presentation', outcome: 'Submit command buffers, present canvas frames, and read results back deliberately.'},
      {name: 'Capabilities and validation', outcome: 'Inspect backend limits and features before selecting an implementation path.'}
    ]
  },
  engine: {
    label: 'Engine',
    purpose: 'Reusable geometry, shader inputs, models, redraw state, interaction, animation, compute, and postprocessing.',
    apiHref: '/docs/api-reference/generated/engine',
    guideHref: '/docs/api-guide/engine',
    cookbookHref: '/docs/api-guide/engine/cookbook',
    concepts: ['Geometry', 'Shader inputs', 'Model', 'Redraw lifecycle', 'Picking and scenes', 'Animation, compute, and passes'],
    features: [
      {name: 'Geometry', outcome: 'Keep CPU attributes and shader-facing GPU layouts connected without hiding either side.'},
      {name: 'Model', outcome: 'Own the shaders, pipeline, bindings, geometry, and draw contract for one rendered object.'},
      {name: 'Shader inputs', outcome: 'Update module props and bindings through one structured interface.'},
      {name: 'Demand-driven redraw', outcome: 'Render when visible state changes instead of continuously burning GPU time.'},
      {name: 'Interaction and scenes', outcome: 'Compose picking, controls, hierarchy, and reusable scenegraph nodes.'},
      {name: 'Animation, compute, and passes', outcome: 'Add time-varying state, GPU transforms, and postprocessing with focused helpers.'}
    ]
  },
  shadertools: {
    label: 'Shadertools',
    purpose: 'Composable shader modules, dependencies, hooks, injections, plugins, passes, and portable assembly.',
    apiHref: '/docs/api-reference/generated/shadertools',
    guideHref: '/docs/api-guide/shaders',
    cookbookHref: '/docs/api-guide/shaders/cookbook',
    concepts: ['Modules and dependencies', 'Props and bindings', 'Hooks and injections', 'Assembly', 'Plugins and passes', 'Portability and catalogs'],
    features: [
      {name: 'Modules and dependencies', outcome: 'Package shader behavior once and assemble dependencies in deterministic order.'},
      {name: 'Typed props and bindings', outcome: 'Describe CPU-facing configuration and shader-visible resources together.'},
      {name: 'Hooks and injections', outcome: 'Extend stable shader contracts without copying whole shader programs.'},
      {name: 'Plugins', outcome: 'Bundle modules, bindings, and source changes into configurable rendering features.'},
      {name: 'Shader passes', outcome: 'Describe reusable fullscreen image operations for postprocessing workflows.'},
      {name: 'WGSL and GLSL paths', outcome: 'Share one feature model while supplying source for WebGPU and WebGL 2.'}
    ]
  }
} as const;

const TERMS: Record<FoundationModuleId, readonly GPUTermName[]> = {
  core: ['resource', 'ownership', 'binding', 'layout', 'pipeline', 'pass', 'encoder', 'submission'],
  engine: ['resource', 'binding', 'pipeline', 'pass', 'redraw', 'ownership'],
  shadertools: ['shader module', 'binding', 'hook', 'injection', 'plugin', 'pipeline']
};

export function FoundationTerminology({module}: {module: FoundationModuleId}): ReactNode {
  return (
    <dl className="foundation-term-grid">
      {TERMS[module].map(term => (
        <div key={term}>
          <dt><GPUTerm term={term} /></dt>
          <dd>{GPU_DOCUMENTATION_TERMS[term]}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FoundationFeatureCard({module}: {module: FoundationModuleId}): ReactNode {
  const details = MODULE_DETAILS[module];
  return (
    <div className="foundation-feature-card">
      {details.features.map(feature => (
        <div key={feature.name}>
          <strong>{feature.name}</strong>
          <span>{feature.outcome}</span>
        </div>
      ))}
    </div>
  );
}

export function CoreResourceLifecycle(): ReactNode {
  return <ol className="foundation-stage-strip">{CORE_RESOURCE_LIFECYCLE.map(stage => <li key={stage}>{stage}</li>)}</ol>;
}

export function EngineCoreMapping(): ReactNode {
  return <table><thead><tr><th>Engine concept</th><th>Core work it manages</th></tr></thead><tbody>{ENGINE_CORE_MAPPINGS.map(mapping => <tr key={mapping.engine}><th>{mapping.engine}</th><td>{mapping.core}</td></tr>)}</tbody></table>;
}

const BASE_TEACHING_MODULES: readonly TeachingShaderModule[] = [
  {name: 'color', source: 'fn applyColor(base: vec3<f32>) -> vec3<f32> { return base; }'},
  {name: 'lighting', dependencies: ['color'], source: 'fn shade(base: vec3<f32>) -> vec3<f32> { return applyColor(base) * 0.85; }'}
];

/** Small source inspector that makes shader dependency ordering and assembly concrete. */
export function ShaderAssemblyInspector(): ReactNode {
  const [includeLighting, setIncludeLighting] = useState(true);
  const modules = includeLighting ? BASE_TEACHING_MODULES : BASE_TEACHING_MODULES.slice(0, 1);
  const order = orderTeachingShaderModules(modules).map(module => module.name).join(' → ');
  return (
    <section className="shader-assembly-inspector" aria-label="Shader assembly inspector">
      <label>
        <input type="checkbox" checked={includeLighting} onChange={event => setIncludeLighting(event.target.checked)} />
        Include lighting module
      </label>
      <dl>
        <div><dt>Dependencies</dt><dd>{order}</dd></div>
        <div><dt>Hook</dt><dd><code>fragmentColor(baseColor)</code></dd></div>
        <div><dt>Injection</dt><dd>{includeLighting ? 'lighting::shade' : 'none'}</dd></div>
        <div><dt>Uniforms</dt><dd>{includeLighting ? 'lighting.intensity' : 'none'}</dd></div>
      </dl>
      <details><summary>Assembled teaching source</summary><pre><code>{assembleTeachingShader(modules)}</code></pre></details>
    </section>
  );
}

export function FoundationReadingPath({module}: {module: FoundationModuleId}): ReactNode {
  const details = MODULE_DETAILS[module];
  return (
    <ol className="foundation-reading-path">
      <li><Link to={details.guideHref}>Learn the workflow</Link><span>Build the mental model before choosing classes.</span></li>
      <li><Link to={details.cookbookHref}>Copy a focused recipe</Link><span>Start from a complete, small task.</span></li>
      <li><Link to={details.apiHref}>Check the complete API</Link><span>Confirm exact types, defaults, and ownership.</span></li>
    </ol>
  );
}

export function FoundationAPIIndex({module}: {module: FoundationModuleId}): ReactNode {
  const details = MODULE_DETAILS[module];
  return (
    <div className="foundation-api-index">
      <p>{details.purpose}</p>
      <ul>
        {details.concepts.map(concept => <li key={concept}>{concept}</li>)}
      </ul>
      <p>
        The <Link to={details.apiHref}>generated {details.label} API index</Link> is the exhaustive,
        source-linked inventory of every public value and TypeScript export. The curated pages explain
        how the related families fit together.
      </p>
    </div>
  );
}

export function FoundationAdjacency({current}: {current: FoundationModuleId}): ReactNode {
  return (
    <div className="foundation-adjacency" aria-label="Related luma.gl layers">
      {FOUNDATION_ADJACENCIES.map(layer => (
        <Link key={layer.id} className={layer.id === current ? 'is-current' : undefined} to={layer.href}>
          {layer.label}
        </Link>
      ))}
    </div>
  );
}

export function FoundationJourney(): ReactNode {
  const [selectedIdentifier, setSelectedIdentifier] = useState<(typeof FOUNDATION_JOURNEY)[number]['id']>('engine');
  const selected = FOUNDATION_JOURNEY.find(layer => layer.id === selectedIdentifier) ?? FOUNDATION_JOURNEY[1];
  return (
    <section className="foundation-journey" aria-label="How luma.gl layers fit together">
      <div role="tablist" aria-label="luma.gl layers">
        {FOUNDATION_JOURNEY.map(layer => (
          <button
            key={layer.id}
            type="button"
            role="tab"
            aria-selected={layer.id === selectedIdentifier}
            onClick={() => setSelectedIdentifier(layer.id)}
          >
            {layer.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        <strong>{selected.summary}</strong>
        <p>{selected.detail}</p>
      </div>
    </section>
  );
}

export function DocumentationContract({
  rows,
  title
}: {
  rows: readonly {label: string; value: ReactNode}[];
  title: string;
}): ReactNode {
  return (
    <aside className="documentation-contract" aria-label={`${title} contract`}>
      <strong>{title}</strong>
      <dl>
        {rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
      </dl>
    </aside>
  );
}
