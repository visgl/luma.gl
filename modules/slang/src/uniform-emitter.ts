// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SlangType, Structure} from './ast';
import type {SlangTypeLayout} from './types';

/** WGSL uniform-only representations keep normal local/storage value types unchanged. */
export class UniformEmitter {
  private declarations = new Map<string, string>();
  constructor(
    private structures: Map<string, Structure>,
    private getValueTypeName: (type: SlangType) => string,
    private getLayout: (type: SlangType) => SlangTypeLayout
  ) {}

  private getKey(type: SlangType): string {
    return type.element
      ? `${type.name}_${this.getKey(type.element)}_${type.length ?? ''}`
      : type.name;
  }
  private getWrapper(type: SlangType): string {
    const key = `_slang_uniform_element_${this.getKey(type)}`;
    if (!this.declarations.has(key)) {
      const representation = this.getTypeName(type);
      const layout = this.getLayout(type);
      const alignment = Math.ceil(layout.alignment / 16) * 16;
      const size = Math.ceil(layout.size / alignment) * alignment;
      this.declarations.set(
        key,
        `struct ${key} { @align(${alignment}) @size(${size}) _slang_value: ${representation}, }`
      );
    }
    return key;
  }
  getTypeName(type: SlangType): string {
    if (type.name.startsWith('bool'))
      return this.getValueTypeName({name: type.name.replace('bool', 'uint')});
    if (type.name === 'array') {
      return `array<${this.getWrapper(type.element!)}, ${type.length}>`;
    }
    const matrix = /^float([2-4])x([2-4])$/.exec(type.name);
    if (matrix) return `array<${this.getWrapper({name: `float${matrix[2]}`})}, ${matrix[1]}>`;
    const structure = this.structures.get(type.name);
    if (!structure) return this.getValueTypeName(type);
    const key = `_slang_uniform_type_${type.name}`;
    if (!this.declarations.has(key)) {
      const layout = this.getLayout(type);
      const fields = structure.fields.map((field, index) => {
        const member = layout.members![index];
        return `  @align(${member.alignment}) @size(${member.size}) _slang_${field.name}: ${this.getTypeName(field.type)},`;
      });
      // Give even a flat struct its std140 rounded size when nested or copied as a whole.
      if (fields.length) {
        const last = layout.members![fields.length - 1];
        fields[fields.length - 1] = fields[fields.length - 1].replace(
          `@size(${last.size})`,
          `@size(${layout.size - last.offset})`
        );
        fields[0] = fields[0].replace(
          `@align(${layout.members![0].alignment})`,
          `@align(${layout.alignment})`
        );
      }
      this.declarations.set(key, `struct ${key} {\n${fields.join('\n')}\n}`);
    }
    return key;
  }
  readValue(type: SlangType, code: string): string {
    if (type.name.startsWith('bool')) {
      const vector = /bool([2-4])/.exec(type.name);
      return `(${code} != ${vector ? `vec${vector[1]}<u32>(0u)` : '0u'})`;
    }
    if (
      type.name !== 'array' &&
      !this.structures.has(type.name) &&
      !/^float[2-4]x[2-4]$/.test(type.name)
    )
      return code;
    const name = `_slang_read_uniform_${this.getKey(type)}`;
    if (!this.declarations.has(name)) {
      const parameterType = this.getTypeName(type);
      const valueType = this.getValueTypeName(type);
      let body: string;
      const structure = this.structures.get(type.name);
      if (structure) {
        const fields = structure.fields.map(field =>
          this.readValue(field.type, `_slang_value._slang_${field.name}`)
        );
        body = `return ${valueType}(${fields.join(', ')});`;
      } else if (type.name === 'array') {
        const element = this.readValue(type.element!, '_slang_value[_slang_index]._slang_value');
        body = `var _slang_result: ${valueType};\n  for (var _slang_index = 0u; _slang_index < ${type.length}u; _slang_index += 1u) { _slang_result[_slang_index] = ${element}; }\n  return _slang_result;`;
      } else {
        const matrix = /^float([2-4])x([2-4])$/.exec(type.name)!;
        const columns = Array.from(
          {length: Number(matrix[1])},
          (_, index) => `_slang_value[${index}]._slang_value`
        );
        body = `return ${valueType}(${columns.join(', ')});`;
      }
      this.declarations.set(
        name,
        `fn ${name}(_slang_value: ${parameterType}) -> ${valueType} {\n  ${body}\n}`
      );
    }
    return `${name}(${code})`;
  }
  getDeclarations(): string[] {
    return [...this.declarations.values()];
  }
}
