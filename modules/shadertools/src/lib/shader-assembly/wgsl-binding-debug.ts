// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

type ShaderBindingAssignment = {
  moduleName: string;
  name: string;
  group: number;
  location: number;
};

const WGSL_BINDING_DEBUG_REGEXES = [
  /@binding\(\s*(\d+)\s*\)\s*@group\(\s*(\d+)\s*\)\s*var(?:<([^>]+)>)?\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);/g,
  /@group\(\s*(\d+)\s*\)\s*@binding\(\s*(\d+)\s*\)\s*var(?:<([^>]+)>)?\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);/g
] as const;

/** One debug row describing a WGSL binding in the assembled shader source. */
export type ShaderBindingDebugRow = {
  /** Binding name as declared in WGSL. */
  name: string;
  /** Bind-group index. */
  group: number;
  /** Binding slot within the bind group. */
  binding: number;
  /** Resource kind inferred from the WGSL declaration. */
  kind:
    | 'uniform'
    | 'storage'
    | 'read-only-storage'
    | 'texture'
    | 'sampler'
    | 'storage-texture'
    | 'unknown';
  /** Whether the binding came from application WGSL or a shader module. */
  owner: 'application' | 'module';
  /** Shader module name when the binding was contributed by a module. */
  moduleName?: string;
  /** Full WGSL resource type text from the declaration. */
  resourceType?: string;
  /** WGSL access mode when cheaply available. */
  access?: string;
  /** Texture view dimension when cheaply available. */
  viewDimension?: string;
  /** Texture sample type when cheaply available. */
  sampleType?: string;
  /** Sampler kind when cheaply available. */
  samplerKind?: string;
  /** Whether the texture is multisampled when cheaply available. */
  multisampled?: boolean;
};

/** Builds a stable, table-friendly binding summary from assembled WGSL source. */
export function getShaderBindingDebugRowsFromWGSL(
  source: string,
  bindingAssignments: ShaderBindingAssignment[] = []
): ShaderBindingDebugRow[] {
  const assignmentMap = new Map<string, string>();
  for (const bindingAssignment of bindingAssignments) {
    assignmentMap.set(
      getBindingAssignmentKey(bindingAssignment.name, bindingAssignment.group, bindingAssignment.location),
      bindingAssignment.moduleName
    );
  }

  const rows: ShaderBindingDebugRow[] = [];
  for (const regex of WGSL_BINDING_DEBUG_REGEXES) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source))) {
      const isBindingFirst = regex === WGSL_BINDING_DEBUG_REGEXES[0];
      const binding = Number(match[isBindingFirst ? 1 : 2]);
      const group = Number(match[isBindingFirst ? 2 : 1]);
      const accessDeclaration = match[3]?.trim();
      const name = match[4];
      const resourceType = match[5].trim();
      const moduleName = assignmentMap.get(getBindingAssignmentKey(name, group, binding));

      rows.push(
        normalizeShaderBindingDebugRow({
          name,
          group,
          binding,
          owner: moduleName ? 'module' : 'application',
          moduleName,
          accessDeclaration,
          resourceType
        })
      );
    }
  }

  return rows.sort((left, right) => {
    if (left.group !== right.group) {
      return left.group - right.group;
    }
    if (left.binding !== right.binding) {
      return left.binding - right.binding;
    }
    return left.name.localeCompare(right.name);
  });
}

function normalizeShaderBindingDebugRow(row: {
  name: string;
  group: number;
  binding: number;
  owner: 'application' | 'module';
  moduleName?: string;
  accessDeclaration?: string;
  resourceType: string;
}): ShaderBindingDebugRow {
  const baseRow: ShaderBindingDebugRow = {
    name: row.name,
    group: row.group,
    binding: row.binding,
    owner: row.owner,
    kind: 'unknown',
    moduleName: row.moduleName,
    resourceType: row.resourceType
  };

  if (row.accessDeclaration) {
    const access = row.accessDeclaration.split(',').map(value => value.trim());
    if (access[0] === 'uniform') {
      return {...baseRow, kind: 'uniform', access: 'uniform'};
    }
    if (access[0] === 'storage') {
      const storageAccess = access[1] || 'read_write';
      return {
        ...baseRow,
        kind: storageAccess === 'read' ? 'read-only-storage' : 'storage',
        access: storageAccess
      };
    }
  }

  if (row.resourceType === 'sampler' || row.resourceType === 'sampler_comparison') {
    return {
      ...baseRow,
      kind: 'sampler',
      samplerKind: row.resourceType === 'sampler_comparison' ? 'comparison' : 'filtering'
    };
  }

  if (row.resourceType.startsWith('texture_storage_')) {
    return {
      ...baseRow,
      kind: 'storage-texture',
      access: getStorageTextureAccess(row.resourceType),
      viewDimension: getTextureViewDimension(row.resourceType)
    };
  }

  if (row.resourceType.startsWith('texture_')) {
    return {
      ...baseRow,
      kind: 'texture',
      viewDimension: getTextureViewDimension(row.resourceType),
      sampleType: getTextureSampleType(row.resourceType),
      multisampled: row.resourceType.startsWith('texture_multisampled_')
    };
  }

  return baseRow;
}

function getBindingAssignmentKey(name: string, group: number, binding: number): string {
  return `${group}:${binding}:${name}`;
}

function getTextureViewDimension(resourceType: string): string | undefined {
  if (resourceType.includes('cube_array')) {
    return 'cube-array';
  }
  if (resourceType.includes('2d_array')) {
    return '2d-array';
  }
  if (resourceType.includes('cube')) {
    return 'cube';
  }
  if (resourceType.includes('3d')) {
    return '3d';
  }
  if (resourceType.includes('2d')) {
    return '2d';
  }
  if (resourceType.includes('1d')) {
    return '1d';
  }
  return undefined;
}

function getTextureSampleType(resourceType: string): string | undefined {
  if (resourceType.startsWith('texture_depth_')) {
    return 'depth';
  }
  if (resourceType.includes('<i32>')) {
    return 'sint';
  }
  if (resourceType.includes('<u32>')) {
    return 'uint';
  }
  if (resourceType.includes('<f32>')) {
    return 'float';
  }
  return undefined;
}

function getStorageTextureAccess(resourceType: string): string | undefined {
  const match = /,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(resourceType);
  return match?.[1];
}
