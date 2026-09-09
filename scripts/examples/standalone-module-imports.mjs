// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Converts top-level ESM imports into conditional-friendly dynamic imports. */
export function transformStaticImports(source) {
  return source.replace(
    /(^[ \t]*)import\s+(.+?)\s+from\s+(["'])([^"']+)\3;?[ \t]*$/gm,
    (statement, indentation, bindings, quote, moduleSource) =>
      makeDynamicImport(indentation, bindings, `${quote}${moduleSource}${quote}`)
  );
}

function makeDynamicImport(indentation, bindings, moduleSource) {
  const namespaceImport = bindings.match(/^\*\s+as\s+([$\w]+)$/);
  if (namespaceImport) {
    return `${indentation}const ${namespaceImport[1]} = await import(${moduleSource});`;
  }

  const defaultAndNamespaceImport = bindings.match(/^([$\w]+)\s*,\s*\*\s+as\s+([$\w]+)$/);
  if (defaultAndNamespaceImport) {
    const [, defaultBinding, namespaceBinding] = defaultAndNamespaceImport;
    return `${indentation}const ${namespaceBinding} = await import(${moduleSource});
${indentation}const {default: ${defaultBinding}} = ${namespaceBinding};`;
  }

  const defaultAndNamedImport = bindings.match(/^([$\w]+)\s*,\s*(\{.*\})$/);
  if (defaultAndNamedImport) {
    const [, defaultBinding, namedBindings] = defaultAndNamedImport;
    return `${indentation}const {default: ${defaultBinding}, ${normalizeNamedBindings(namedBindings)}} = await import(${moduleSource});`;
  }

  if (bindings.startsWith('{')) {
    return `${indentation}const {${normalizeNamedBindings(bindings)}} = await import(${moduleSource});`;
  }

  return `${indentation}const {default: ${bindings}} = await import(${moduleSource});`;
}

function normalizeNamedBindings(bindings) {
  return bindings
    .replace(/^\{\s*|\s*\}$/g, '')
    .replace(/([$\w]+)\s+as\s+([$\w]+)/g, '$1: $2');
}
