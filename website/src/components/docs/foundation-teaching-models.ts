export const CORE_RESOURCE_LIFECYCLE = ['declare usage', 'create', 'upload', 'encode', 'submit', 'reuse', 'destroy'] as const;

export const ENGINE_CORE_MAPPINGS = [
  {engine: 'Geometry', core: 'Buffer data + BufferLayout'},
  {engine: 'ShaderInputs', core: 'Bindings + uniform/storage buffers'},
  {engine: 'Model', core: 'Shaders + RenderPipeline + VertexArray'},
  {engine: 'model.draw(pass)', core: 'Pass bindings + draw command'},
  {engine: 'needsRedraw()', core: 'Whether another submission is necessary'}
] as const;

export type TeachingShaderModule = {name: string; source: string; dependencies?: readonly string[]};

/** Deterministically orders a small teaching module graph and rejects cycles or missing modules. */
export function orderTeachingShaderModules(modules: readonly TeachingShaderModule[]): TeachingShaderModule[] {
  const modulesByName = new Map(modules.map(module => [module.name, module]));
  const ordered: TeachingShaderModule[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (name: string): void => {
    if (visited.has(name)) return;
    if (visiting.has(name)) throw new Error(`Circular teaching shader dependency: ${name}`);
    const module = modulesByName.get(name);
    if (!module) throw new Error(`Missing teaching shader dependency: ${name}`);
    visiting.add(name);
    for (const dependency of module.dependencies ?? []) visit(dependency);
    visiting.delete(name);
    visited.add(name);
    ordered.push(module);
  };
  for (const module of modules) visit(module.name);
  return ordered;
}

export function assembleTeachingShader(modules: readonly TeachingShaderModule[]): string {
  return orderTeachingShaderModules(modules)
    .map(module => `// module: ${module.name}\n${module.source}`)
    .join('\n\n');
}
