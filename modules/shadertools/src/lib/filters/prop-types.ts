export type PropType = {
  type?: string;
  max?: number;
  min?: number;
  value?: any;
} | number;

export type PropDef = {
  type: string;
  value: any;
  max?: number;
  min?: number;
  private?: boolean;
  validate?(value: any, propDef: PropDef): boolean;
};

const TYPE_DEFINITIONS: Record<string, {validate: (value: unknown, propType: PropType) => boolean}> = {
  number: {
    validate(value: unknown, propType: PropType) {
      return (
        Number.isFinite(value) &&
        typeof propType === 'object' &&
        (!('max' in propType) || value <= propType.max) &&
        (!('min' in propType) || value >= propType.min)
      );
    }
  },
  array: {
    validate(value: unknown, propType: PropType) {
      return Array.isArray(value) || ArrayBuffer.isView(value);
    }
  }
};



export function parsePropTypes(propDefs: Record<string, PropType>): Record<string, PropDef> {
  const propTypes: Record<string, PropDef> = {};
  for (const [name, propDef] of Object.entries(propDefs)) {
    propTypes[name] = parsePropType(propDef);
  }
  return propTypes;
}

/**
 * Parses one property definition entry. Either contains:
 * - a valid prop type object ({type, ...})
 * - or just a default value, in which case type and name inference is used
 */
function parsePropType(propDef: PropType): PropDef {
  let type = getTypeOf(propDef);
  if (type !== 'object') {
    return {type, value: propDef, ...TYPE_DEFINITIONS[type]};
  }
  if (typeof propDef === 'object') {
    if (!propDef) {
      return {type: 'object', value: null};
    }
    if ('type' in propDef) {
    // @ts-expect-error
    return {...propDef, ...TYPE_DEFINITIONS[propDef.type]};
    }
    if (!('value' in propDef)) {
      // If no type and value this object is likely the value
      return {type: 'object', value: propDef};
    }
    type = getTypeOf(propDef.value);
    // @ts-expect-error
    return {type, ...propDef, ...TYPE_DEFINITIONS[type]};
  }
}

// improved version of javascript typeof that can distinguish arrays and null values
function getTypeOf(value: unknown): string {
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return 'array';
  }
  return typeof value;
}
