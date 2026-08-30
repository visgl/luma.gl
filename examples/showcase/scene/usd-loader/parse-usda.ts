import type {
  USDAssetPath,
  USDAttribute,
  USDPrim,
  USDStage,
  USDValue,
  USDVariant
} from './usd-types';

type USDToken = {
  value: string;
  line: number;
  kind: 'word' | 'number' | 'string' | 'asset' | 'path' | 'punctuation' | 'end';
};

type USDPrimContents = Pick<USDPrim, 'attributes' | 'metadata' | 'children' | 'variants'>;

const NUMBER_PATTERN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
const QUALIFIERS = new Set([
  'uniform',
  'varying',
  'custom',
  'prepend',
  'append',
  'add',
  'delete',
  'reorder'
]);

export function parseUSDA(source: string, url?: string): USDStage {
  if (!source.trimStart().startsWith('#usda')) {
    throw new Error('OpenUSD ASCII layers must begin with the #usda header.');
  }

  return new USDAParser(source, url).parse();
}

class USDAParser {
  private readonly tokenizer: USDTokenizer;
  private readonly url: string | undefined;

  constructor(source: string, url?: string) {
    this.tokenizer = new USDTokenizer(source);
    this.url = url;
  }

  parse(): USDStage {
    const metadata = this.tokenizer.match('(') ? this.parseMetadata(')') : {};
    const rootPrims: USDPrim[] = [];

    while (!this.tokenizer.isAtEnd()) {
      if (this.isPrimDeclaration()) {
        rootPrims.push(this.parsePrim(''));
      } else {
        this.tokenizer.read();
      }
    }

    return {
      format: 'usda',
      url: this.url,
      metadata,
      rootPrims,
      layers: this.url ? [this.url] : []
    };
  }

  private parsePrim(parentPath: string): USDPrim {
    const declaration = this.tokenizer.read();
    const specifier = declaration.value as USDPrim['specifier'];
    const firstToken = this.tokenizer.read();
    const hasExplicitType = this.tokenizer.peek().kind === 'string';
    const type = hasExplicitType ? firstToken.value : '';
    const name = hasExplicitType ? this.tokenizer.read().value : firstToken.value;
    const path = `${parentPath}/${name}`;
    const metadata = this.tokenizer.match('(') ? this.parseMetadata(')') : {};

    this.tokenizer.expect('{');
    const contents = this.parsePrimContents(path);

    return {
      name,
      path,
      sourceUrl: this.url,
      type,
      specifier,
      attributes: contents.attributes,
      metadata: {...metadata, ...contents.metadata},
      variants: contents.variants,
      children: contents.children
    };
  }

  private parsePrimContents(parentPath: string): USDPrimContents {
    const attributes: Record<string, USDAttribute> = {};
    const metadata: Record<string, USDValue> = {};
    const children: USDPrim[] = [];
    const variants: Record<string, Record<string, USDVariant>> = {};

    while (!this.tokenizer.isAtEnd() && !this.tokenizer.match('}')) {
      if (this.isPrimDeclaration()) {
        children.push(this.parsePrim(parentPath));
      } else if (this.tokenizer.peek().value === 'variantSet') {
        this.parseVariantSet(parentPath, variants);
      } else {
        const attribute = this.parseAttribute();
        if (attribute) {
          attributes[attribute.name] = attribute;
        }
      }
    }

    return {attributes, metadata, children, variants};
  }

  private parseVariantSet(
    parentPath: string,
    variants: Record<string, Record<string, USDVariant>>
  ): void {
    this.tokenizer.expect('variantSet');
    const variantSetName = this.tokenizer.read().value;
    this.tokenizer.expect('=');
    this.tokenizer.expect('{');
    const variantSet: Record<string, USDVariant> = {};

    while (!this.tokenizer.isAtEnd() && !this.tokenizer.match('}')) {
      const variantName = this.tokenizer.read().value;
      this.tokenizer.expect('{');
      const contents = this.parsePrimContents(parentPath);
      variantSet[variantName] = {
        attributes: contents.attributes,
        metadata: contents.metadata,
        children: contents.children
      };
    }

    variants[variantSetName] = variantSet;
  }

  private parseAttribute(): USDAttribute | null {
    const firstToken = this.tokenizer.read();
    if (firstToken.kind === 'end') {
      return null;
    }

    const declarationTokens = [firstToken];
    while (!this.tokenizer.isAtEnd() && this.tokenizer.peek().line === firstToken.line) {
      const nextToken = this.tokenizer.peek();
      if (nextToken.value === '=') {
        this.tokenizer.read();
        break;
      }
      if (nextToken.value === '{' || nextToken.value === '}') {
        return null;
      }
      declarationTokens.push(this.tokenizer.read());
    }

    const hasAssignment = this.tokenizer.previousValue === '=';
    if (!hasAssignment) {
      return null;
    }

    const significantTokens = declarationTokens.filter(token => !QUALIFIERS.has(token.value));
    if (significantTokens.length === 0) {
      return null;
    }

    const name = significantTokens[significantTokens.length - 1].value;
    const type = significantTokens
      .slice(0, -1)
      .map(token => token.value)
      .join('');
    const value = this.parseValue();
    const metadata = this.tokenizer.match('(') ? this.parseMetadata(')') : {};

    return {name, type, value, metadata};
  }

  private parseMetadata(terminator: ')' | '}'): Record<string, USDValue> {
    const metadata: Record<string, USDValue> = {};

    while (!this.tokenizer.isAtEnd() && !this.tokenizer.match(terminator)) {
      this.tokenizer.match(',');
      if (this.tokenizer.peek().value === terminator) {
        this.tokenizer.read();
        break;
      }

      const firstToken = this.tokenizer.read();
      const declarationTokens = [firstToken];
      while (!this.tokenizer.isAtEnd() && this.tokenizer.peek().line === firstToken.line) {
        if (this.tokenizer.peek().value === '=' || this.tokenizer.peek().value === ':') {
          this.tokenizer.read();
          break;
        }
        if (this.tokenizer.peek().value === terminator) {
          break;
        }
        declarationTokens.push(this.tokenizer.read());
      }

      if (this.tokenizer.previousValue !== '=' && this.tokenizer.previousValue !== ':') {
        continue;
      }

      const name = declarationTokens[declarationTokens.length - 1].value;
      metadata[name] = this.parseValue();
      this.tokenizer.match(',');
    }

    return metadata;
  }

  private parseValue(): USDValue {
    const token = this.tokenizer.read();

    if (token.value === '[') {
      return this.parseList(']');
    }
    if (token.value === '(') {
      return this.parseList(')');
    }
    if (token.value === '{') {
      return this.parseMetadata('}');
    }
    if (token.kind === 'asset') {
      const reference: USDAssetPath = {assetPath: token.value};
      if (this.tokenizer.peek().kind === 'path' && this.tokenizer.peek().line === token.line) {
        reference.primPath = this.tokenizer.read().value;
      }
      return reference;
    }
    if (token.kind === 'path') {
      return {path: token.value};
    }
    if (token.kind === 'number') {
      return Number(token.value);
    }
    if (token.value === 'true') {
      return true;
    }
    if (token.value === 'false') {
      return false;
    }
    if (token.value === 'None' || token.value === 'null') {
      return null;
    }

    return token.value;
  }

  private parseList(terminator: ']' | ')'): USDValue[] {
    const values: USDValue[] = [];
    while (!this.tokenizer.isAtEnd() && !this.tokenizer.match(terminator)) {
      if (this.tokenizer.match(',')) {
        continue;
      }
      values.push(this.parseValue());
      this.tokenizer.match(',');
    }
    return values;
  }

  private isPrimDeclaration(): boolean {
    const value = this.tokenizer.peek().value;
    return value === 'def' || value === 'over' || value === 'class';
  }
}

class USDTokenizer {
  private readonly source: string;
  private offset = 0;
  private line = 1;
  private bufferedToken: USDToken | null = null;
  previousValue = '';

  constructor(source: string) {
    this.source = source;
  }

  peek(): USDToken {
    this.bufferedToken ||= this.readToken();
    return this.bufferedToken;
  }

  read(): USDToken {
    const token = this.peek();
    this.bufferedToken = null;
    this.previousValue = token.value;
    return token;
  }

  match(value: string): boolean {
    if (this.peek().value !== value) {
      return false;
    }
    this.read();
    return true;
  }

  expect(value: string): void {
    const token = this.read();
    if (token.value !== value) {
      throw new Error(`Expected "${value}" at USDA line ${token.line}, received "${token.value}".`);
    }
  }

  isAtEnd(): boolean {
    return this.peek().kind === 'end';
  }

  private readToken(): USDToken {
    this.skipIgnoredText();
    const line = this.line;
    const character = this.source[this.offset];

    if (character === undefined) {
      return {value: '', line, kind: 'end'};
    }
    if ('{}[](),='.includes(character)) {
      this.offset++;
      return {value: character, line, kind: 'punctuation'};
    }
    if (character === '"' || character === "'") {
      return {value: this.readQuotedString(character), line, kind: 'string'};
    }
    if (character === '@') {
      return {value: this.readDelimitedValue('@'), line, kind: 'asset'};
    }
    if (character === '<') {
      return {value: this.readDelimitedValue('>'), line, kind: 'path'};
    }

    const numericMatch = this.source.slice(this.offset).match(NUMBER_PATTERN);
    if (numericMatch) {
      this.offset += numericMatch[0].length;
      return {value: numericMatch[0], line, kind: 'number'};
    }

    const startOffset = this.offset;
    while (this.offset < this.source.length) {
      const nextCharacter = this.source[this.offset];
      if (/\s/.test(nextCharacter) || '{}[](),=@<>'.includes(nextCharacter)) {
        break;
      }
      this.offset++;
    }

    if (this.offset === startOffset) {
      this.offset++;
    }

    return {value: this.source.slice(startOffset, this.offset), line, kind: 'word'};
  }

  private skipIgnoredText(): void {
    while (this.offset < this.source.length) {
      const character = this.source[this.offset];
      if (character === '\n') {
        this.line++;
        this.offset++;
      } else if (/\s/.test(character)) {
        this.offset++;
      } else if (character === '#') {
        while (this.offset < this.source.length && this.source[this.offset] !== '\n') {
          this.offset++;
        }
      } else if (character === '/' && this.source[this.offset + 1] === '*') {
        this.offset += 2;
        while (this.offset < this.source.length && !this.source.startsWith('*/', this.offset)) {
          if (this.source[this.offset] === '\n') {
            this.line++;
          }
          this.offset++;
        }
        this.offset += 2;
      } else if (this.source.startsWith('"""', this.offset)) {
        this.offset += 3;
        while (this.offset < this.source.length && !this.source.startsWith('"""', this.offset)) {
          if (this.source[this.offset] === '\n') {
            this.line++;
          }
          this.offset++;
        }
        this.offset += 3;
      } else {
        break;
      }
    }
  }

  private readQuotedString(delimiter: string): string {
    this.offset++;
    let value = '';
    while (this.offset < this.source.length) {
      const character = this.source[this.offset++];
      if (character === delimiter) {
        break;
      }
      if (character === '\\' && this.offset < this.source.length) {
        const escapedCharacter = this.source[this.offset++];
        value += escapedCharacter === 'n' ? '\n' : escapedCharacter;
      } else {
        value += character;
      }
    }
    return value;
  }

  private readDelimitedValue(delimiter: '@' | '>'): string {
    this.offset++;
    const startOffset = this.offset;
    while (this.offset < this.source.length && this.source[this.offset] !== delimiter) {
      this.offset++;
    }
    const value = this.source.slice(startOffset, this.offset);
    this.offset++;
    return value;
  }
}
