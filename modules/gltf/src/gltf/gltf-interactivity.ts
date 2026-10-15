// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Describe the interpreter's input locally until loaders.gl publishes its interactivity types.
type GLTFInteractivityValue = {
  type?: number;
  value?: unknown[];
  node?: number;
  socket?: string;
};
type GLTFInteractivityNode = {
  declaration: number;
  configuration?: Record<string, {value: unknown[]}>;
  values?: Record<string, GLTFInteractivityValue>;
  flows?: Record<string, {node: number; socket?: string}>;
};
type GLTFInteractivityGraph = {
  types?: {signature: string}[];
  events?: {id: string; values?: Record<string, {type: number; value?: unknown[]}>}[];
  variables?: {type?: number; value?: unknown[]}[];
  declarations?: {op: string; extension?: string}[];
  nodes?: GLTFInteractivityNode[];
};
type GLTFInteractivityExtension = {
  graph?: number;
  graphs: GLTFInteractivityGraph[];
};

export type GLTFInteractivityValueType = unknown[];
export type GLTFInteractivityPropertyAdapter = {
  get(pointer: string): GLTFInteractivityValueType | undefined;
  set(pointer: string, value: GLTFInteractivityValueType): boolean;
};
export type GLTFInteractivityOptions = {
  graph?: number;
  /** Receives custom events sent by the graph to its host. */
  onEvent?: (eventId: string, values: Record<string, unknown[]>) => void;
  /** Receives formatted graph diagnostics and their severity. */
  onLog?: (message: string, severity: number) => void;
  properties?: GLTFInteractivityPropertyAdapter;
  /** Maximum flow activations per dispatch, protecting against unbounded cycles. */
  maxSteps?: number;
};

const VALUE_OPS = new Set([
  'variable/get',
  'pointer/get',
  'math/and',
  'math/add',
  'math/sub',
  'math/mul',
  'math/div',
  'math/rem',
  'math/min',
  'math/max',
  'math/eq',
  'math/lt',
  'math/le',
  'math/gt',
  'math/ge',
  'math/select',
  'math/switch',
  'math/neg',
  'math/abs'
]);
const FLOW_OPS = new Set([
  'event/onStart',
  'event/onTick',
  'event/send',
  'debug/log',
  'flow/sequence',
  'flow/branch',
  'flow/switch',
  'variable/set',
  'pointer/set'
]);
function copy(value: unknown[]): unknown[] {
  return value.slice();
}
function components(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('KHR_interactivity: expected component array');
  return value;
}
function scalar(value: unknown[]): unknown {
  return value[0];
}
function number(value: unknown[]): number {
  const n = scalar(value);
  if (typeof n !== 'number') throw new Error('KHR_interactivity: expected numeric value');
  return n;
}

function getTypeDefaultValue(signature: string | undefined): unknown[] {
  if (signature === 'bool') return [false];
  if (signature === 'int') return [0];
  if (signature === 'ref') return [null];
  const dimensions = signature?.match(/^float(?:([234])(?:x([234]))?)?$/);
  if (dimensions && (!dimensions[2] || dimensions[1] === dimensions[2])) {
    return Array(Number(dimensions[1] ?? 1) * Number(dimensions[2] ?? 1)).fill(NaN);
  }
  throw new Error('KHR_interactivity: unsupported default value type');
}

/**
 * Deterministic, GPU-independent interpreter for a defined subset of KHR_interactivity.
 * Unsupported operations fail during construction; no graph is silently partially executed.
 * A renderer supplies the glTF Asset Object Model through the property adapter.
 */
export class GLTFInteractivity {
  readonly extension: GLTFInteractivityExtension;
  readonly graph: GLTFInteractivityGraph;
  readonly variables: unknown[][];
  readonly properties?: GLTFInteractivityPropertyAdapter;
  readonly maxSteps: number;
  private readonly onEvent: GLTFInteractivityOptions['onEvent'];
  private readonly onLog: GLTFInteractivityOptions['onLog'];
  private started = false;
  private startTime = 0;
  private lastTick: number | undefined;
  private readonly eventOutputs = new Map<number, Record<string, unknown[]>>();

  constructor(extension: GLTFInteractivityExtension, options: GLTFInteractivityOptions = {}) {
    this.extension = extension;
    const graphIndex = options.graph ?? extension.graph ?? 0;
    const graph = extension.graphs[graphIndex];
    if (!graph) throw new Error(`KHR_interactivity: graph ${graphIndex} does not exist`);
    this.graph = graph;
    this.properties = options.properties;
    this.onEvent = options.onEvent;
    this.onLog = options.onLog;
    this.maxSteps = options.maxSteps ?? 10000;
    if (!Number.isSafeInteger(this.maxSteps) || this.maxSteps < 1) {
      throw new Error('KHR_interactivity: maxSteps must be a positive safe integer');
    }
    this.variables = (graph.variables ?? []).map(variable => copy(variable.value ?? [0]));
    for (const [index, node] of (graph.nodes ?? []).entries()) {
      const op = this.getOperation(graphIndex, index);
      if (!VALUE_OPS.has(op) && !FLOW_OPS.has(op)) {
        throw new Error(`KHR_interactivity: unsupported operation ${op}`);
      }
      if (op === 'event/send') {
        const eventIndex = number(this.config(node, 'event'));
        if (!Number.isInteger(eventIndex) || !graph.events?.[eventIndex]) {
          throw new Error('KHR_interactivity: invalid custom event index');
        }
      }
      for (const target of Object.values(node.flows ?? {})) {
        if (!Number.isInteger(target.node) || !(graph.nodes ?? [])[target.node]) {
          throw new Error(`KHR_interactivity: invalid flow target ${target.node}`);
        }
      }
    }
  }

  get graphCount(): number {
    return this.extension.graphs.length;
  }

  getGraph(index: number): GLTFInteractivityGraph {
    const graph = this.extension.graphs[index];
    if (!graph) throw new Error(`KHR_interactivity: graph index ${index} is out of range`);
    return graph;
  }

  getOperation(graphIndex: number, nodeIndex: number): string {
    const graph = this.getGraph(graphIndex);
    const node = graph.nodes?.[nodeIndex];
    if (!node) throw new Error(`KHR_interactivity: node index ${nodeIndex} is out of range`);
    const declaration = graph.declarations?.[node.declaration];
    if (!declaration)
      throw new Error(`KHR_interactivity: declaration index ${node.declaration} is out of range`);
    return declaration.extension ? `${declaration.extension}:${declaration.op}` : declaration.op;
  }

  private op(index: number): string {
    const node = this.graph.nodes?.[index];
    const declaration = node && this.graph.declarations?.[node.declaration];
    if (!declaration) throw new Error(`KHR_interactivity: invalid declaration for node ${index}`);
    return declaration.extension ? `${declaration.extension}:${declaration.op}` : declaration.op;
  }

  private config(node: GLTFInteractivityNode, name: string): unknown[] {
    const value = node.configuration?.[name]?.value;
    if (!value) throw new Error(`KHR_interactivity: missing configuration ${name}`);
    return components(value);
  }

  private input(index: number, name: string, visiting: Set<number>): unknown[] {
    const value: GLTFInteractivityValue | undefined = this.graph.nodes?.[index]?.values?.[name];
    if (!value) throw new Error(`KHR_interactivity: missing input ${name} on node ${index}`);
    if (value.node !== undefined) {
      if (!value.socket) throw new Error('KHR_interactivity: connected input missing socket');
      return this.evaluate(value.node, value.socket, visiting);
    }
    if (!value.value) {
      return getTypeDefaultValue(
        value.type === undefined ? undefined : this.graph.types?.[value.type]?.signature
      );
    }
    return copy(components(value.value));
  }

  private pointer(index: number, visiting: Set<number>): string {
    const node = this.graph.nodes![index];
    const template = scalar(this.config(node, 'pointer'));
    if (typeof template !== 'string' || !template.startsWith('/')) {
      throw new Error('KHR_interactivity: invalid pointer template');
    }
    return template.replace(/\[([^\]]+)\]|\{([^}]+)\}/g, (_match, integerName, refName) => {
      const name = integerName ?? refName;
      const value = scalar(this.input(index, name, visiting));
      if (!Number.isSafeInteger(value) || (value as number) < 0) {
        throw new Error('KHR_interactivity: invalid pointer parameter');
      }
      return String(value);
    });
  }

  /** Evaluate a pure value socket. Values are component arrays as defined by the extension. */
  evaluate(index: number, socket = 'value', visiting = new Set<number>()): unknown[] {
    const node = this.graph.nodes?.[index];
    if (!node) throw new Error(`KHR_interactivity: invalid node ${index}`);
    if (visiting.has(index)) throw new Error('KHR_interactivity: cyclic value dependency');
    visiting.add(index);
    try {
      const op = this.op(index);
      const eventValue = this.eventOutputs.get(index)?.[socket];
      if (eventValue) return copy(eventValue);
      if (op === 'variable/get') {
        const id = number(this.config(node, 'variable'));
        const value = this.variables[id];
        if (!value) throw new Error('KHR_interactivity: invalid variable index');
        return copy(value);
      }
      if (op === 'pointer/get') {
        const value = this.properties?.get(this.pointer(index, visiting));
        return socket === 'isValid' ? [value !== undefined] : copy(value ?? [0]);
      }
      if (socket !== 'value')
        throw new Error(`KHR_interactivity: unsupported output socket ${socket}`);
      const a = () => this.input(index, 'a', visiting);
      const b = () => this.input(index, 'b', visiting);
      const binary = (fn: (x: number, y: number) => number): unknown[] => {
        const x = a().map(Number);
        const y = b().map(Number);
        if (x.length !== y.length)
          throw new Error('KHR_interactivity: mismatched component lengths');
        return x.map((v, i) => fn(v, y[i]));
      };
      switch (op) {
        case 'math/and': {
          const left = scalar(a());
          const right = scalar(b());
          if (typeof left === 'boolean' && typeof right === 'boolean') return [left && right];
          if (typeof left === 'number' && typeof right === 'number') return [left & right];
          throw new Error('KHR_interactivity: incompatible AND arguments');
        }
        case 'math/add':
          return binary((x, y) => x + y);
        case 'math/sub':
          return binary((x, y) => x - y);
        case 'math/mul':
          return binary((x, y) => x * y);
        case 'math/div':
          return binary((x, y) => x / y);
        case 'math/rem':
          return binary((x, y) => x % y);
        case 'math/min':
          return binary(Math.min);
        case 'math/max':
          return binary(Math.max);
        case 'math/neg':
          return a().map(x => -Number(x));
        case 'math/abs':
          return a().map(x => Math.abs(Number(x)));
        case 'math/eq':
          return [JSON.stringify(a()) === JSON.stringify(b())];
        case 'math/lt':
          return [number(a()) < number(b())];
        case 'math/le':
          return [number(a()) <= number(b())];
        case 'math/gt':
          return [number(a()) > number(b())];
        case 'math/ge':
          return [number(a()) >= number(b())];
        case 'math/select':
          return this.input(
            index,
            Boolean(scalar(this.input(index, 'condition', visiting))) ? 'a' : 'b',
            visiting
          );
        case 'math/switch': {
          const selection = number(this.input(index, 'selection', visiting));
          const cases = this.config(node, 'cases');
          return this.input(
            index,
            cases.includes(selection) ? String(selection) : 'default',
            visiting
          );
        }
        default:
          throw new Error(`KHR_interactivity: ${op} is not a value operation`);
      }
    } finally {
      visiting.delete(index);
    }
  }

  /** Dispatch a lifecycle event, executing connected flows in deterministic depth-first order. */
  private dispatch(op: string, outputs: Record<string, unknown[]>): void {
    let steps = 0;
    const execute = (index: number, inputSocket: string): void => {
      if (++steps > this.maxSteps) throw new Error('KHR_interactivity: flow step limit exceeded');
      const node = this.graph.nodes![index];
      const operation = this.op(index);
      if (inputSocket !== 'in')
        throw new Error(`KHR_interactivity: unsupported input flow ${inputSocket}`);
      const visiting = new Set<number>();
      const follow = (socket: string): void => {
        const target = node.flows?.[socket];
        if (target) execute(target.node, target.socket ?? 'in');
      };
      switch (operation) {
        case 'flow/sequence':
          for (const key of Object.keys(node.flows ?? {}).sort()) follow(key);
          break;
        case 'flow/branch':
          follow(Boolean(scalar(this.input(index, 'condition', visiting))) ? 'true' : 'false');
          break;
        case 'flow/switch': {
          const selection = number(this.input(index, 'selection', visiting));
          const cases = this.config(node, 'cases');
          follow(cases.includes(selection) ? String(selection) : 'default');
          break;
        }
        case 'variable/set': {
          const ids = this.config(node, 'variables').map(Number);
          const values = ids.map(id => this.input(index, String(id), visiting));
          ids.forEach((id, i) => {
            if (!this.variables[id]) throw new Error('KHR_interactivity: invalid variable index');
            this.variables[id] = copy(values[i]);
          });
          follow('out');
          break;
        }
        case 'event/send': {
          const eventIndex = number(this.config(node, 'event'));
          const event = this.graph.events![eventIndex];
          const values = Object.fromEntries(
            Object.entries(event.values ?? {}).map(([name, declaration]) => [
              name,
              node.values?.[name]
                ? this.input(index, name, visiting)
                : declaration.value
                  ? copy(declaration.value)
                  : getTypeDefaultValue(this.graph.types?.[declaration.type]?.signature)
            ])
          );
          this.onEvent?.(event.id, values);
          follow('out');
          break;
        }
        case 'debug/log': {
          const severity = node.configuration?.['severity']?.value[0];
          const template = node.configuration?.['message']?.value[0];
          const tokens =
            typeof template === 'string' ? template.match(/\{\{|\}\}|\{[^{}]+\}|[^{}]+/g) : null;
          const validTemplate =
            typeof template === 'string' && (tokens ?? []).join('') === template;
          const message = validTemplate
            ? (tokens ?? [])
                .map(token => {
                  if (token === '{{') return '{';
                  if (token === '}}') return '}';
                  if (token.startsWith('{'))
                    return JSON.stringify(this.input(index, token.slice(1, -1), visiting));
                  return token;
                })
                .join('')
            : '';
          this.onLog?.(
            message,
            typeof severity === 'number' && severity === (severity | 0) ? severity : 0
          );
          follow('out');
          break;
        }
        case 'pointer/set': {
          const pointer = this.pointer(index, visiting);
          const value = this.input(index, 'value', visiting);
          follow(this.properties?.set(pointer, value) ? 'out' : 'err');
          break;
        }
        default:
          throw new Error(`KHR_interactivity: ${operation} is not an executable flow operation`);
      }
    };
    const nodes = this.graph.nodes ?? [];
    for (let index = 0; index < nodes.length; index++) {
      if (this.op(index) === op) {
        this.eventOutputs.set(index, outputs);
        const target = nodes[index].flows?.['out'];
        if (target) execute(target.node, target.socket ?? 'in');
      }
    }
  }

  /** Call once after the glTF asset is ready. */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.dispatch('event/onStart', {event: [null]});
  }

  /** Tick with elapsed seconds; the first tick has timeSinceStart=0 and delta=NaN. */
  tick(timeSeconds: number): void {
    if (!Number.isFinite(timeSeconds)) throw new Error('KHR_interactivity: invalid tick time');
    this.start();
    if (this.lastTick !== undefined && timeSeconds < this.lastTick) {
      throw new Error('KHR_interactivity: tick time must be monotonic');
    }
    if (this.lastTick === undefined) this.startTime = timeSeconds;
    const delta = this.lastTick === undefined ? NaN : timeSeconds - this.lastTick;
    this.lastTick = timeSeconds;
    this.dispatch('event/onTick', {
      timeSinceStart: [timeSeconds - this.startTime],
      timeSinceLastTick: [delta],
      event: [null]
    });
  }
}
