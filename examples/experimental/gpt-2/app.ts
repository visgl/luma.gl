import {Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Computation, Model} from '@luma.gl/engine';

// These assets come from Karpathy's MIT-licensed llm.c starter pack, which packages
// GPT-2 124M weights and tokenizer artifacts compatible with llm.c-style binary headers.
const MODEL_URL =
  'https://huggingface.co/datasets/karpathy/llmc-starter-pack/resolve/main/gpt2_124M.bin';
const TOKENIZER_URL =
  'https://huggingface.co/datasets/karpathy/llmc-starter-pack/resolve/main/gpt2_tokenizer.bin';
const FILE_HEADER_BYTES = 256 * 4;
const MODEL_MAGIC = 20240326;
const MODEL_VERSION_FLOAT32 = 3;
const TOKENIZER_MAGIC = 20240328;
const TOKENIZER_VERSION = 2;
const PARAMETER_TENSOR_COUNT = 16;
const TOKEN_EMBEDDING_CHUNK_ROWS = 8192;
const DEFAULT_PROMPT = 'The future of WebGPU is';
const CONTEXT_TOKEN_OPTIONS = [16, 32, 64, 128, 256] as const;
const DEFAULT_CONTEXT_TOKENS = 256;
const MAX_CONTEXT_TOKENS = CONTEXT_TOKEN_OPTIONS[CONTEXT_TOKEN_OPTIONS.length - 1];
const DEFAULT_GENERATED_TOKENS = 16;
const DEFAULT_TEMPERATURE = 0.1;
const MINIMUM_TEMPERATURE = 0;
const MAXIMUM_TEMPERATURE = 2;
const TOP_TOKEN_COUNT = 8;
const DEBUG_SAMPLE_COUNT = 6;
const VISUALIZATION_COLUMN_COUNT = 640;
const VISUALIZATION_ROW_COUNT = 360;
const VISUALIZATION_CELL_COUNT = VISUALIZATION_COLUMN_COUNT * VISUALIZATION_ROW_COUNT;
const VISUALIZATION_ACTIVATION_PIXEL_BUDGET = 1024;
const VISUALIZATION_WEIGHT_PIXEL_BUDGET = 512;
const VISUALIZATION_EMBEDDING_PIXEL_BUDGET = 4096;
const VISUALIZATION_LOGIT_PIXEL_BUDGET = 4096;
const VISUALIZATION_SPAN_SEPARATOR_CELL_COUNT = 64;
const VISUALIZATION_MINIMUM_ZOOM = 1;
const VISUALIZATION_MAXIMUM_ZOOM = 64;
const VISUALIZATION_WHEEL_DELTA_PER_ZOOM_DOUBLING = 500;
const GPT2_PRETOKEN_PATTERN =
  /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;

const LAYER_NORM_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> inputData: array<f32>;
@group(0) @binding(1) var<storage, read> scaleData: array<f32>;
@group(0) @binding(2) var<storage, read> biasData: array<f32>;
@group(0) @binding(3) var<storage, read_write> outputData: array<f32>;
@group(0) @binding(4) var<storage, read> parameters: array<u32>;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let rowIndex = globalInvocationId.x;
  let rowCount = parameters[0];
  let channelCount = parameters[1];
  let inputOffset = parameters[2];
  let outputOffset = parameters[3];

  if (rowIndex >= rowCount) {
    return;
  }

  let rowInputOffset = inputOffset + rowIndex * channelCount;
  let rowOutputOffset = outputOffset + rowIndex * channelCount;
  var mean = 0.0;

  for (var channelIndex = 0u; channelIndex < channelCount; channelIndex = channelIndex + 1u) {
    mean = mean + inputData[rowInputOffset + channelIndex];
  }
  mean = mean / f32(channelCount);

  var variance = 0.0;
  for (var channelIndex = 0u; channelIndex < channelCount; channelIndex = channelIndex + 1u) {
    let centeredValue = inputData[rowInputOffset + channelIndex] - mean;
    variance = variance + centeredValue * centeredValue;
  }
  let inverseStandardDeviation = inverseSqrt(variance / f32(channelCount) + 0.00001);

  for (var channelIndex = 0u; channelIndex < channelCount; channelIndex = channelIndex + 1u) {
    let normalizedValue = (inputData[rowInputOffset + channelIndex] - mean) * inverseStandardDeviation;
    outputData[rowOutputOffset + channelIndex] = normalizedValue * scaleData[channelIndex] + biasData[channelIndex];
  }
}
`;

const MATRIX_MULTIPLY_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> inputData: array<f32>;
@group(0) @binding(1) var<storage, read> weightData: array<f32>;
@group(0) @binding(2) var<storage, read> biasData: array<f32>;
@group(0) @binding(3) var<storage, read_write> outputData: array<f32>;
@group(0) @binding(4) var<storage, read> parameters: array<u32>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let outputColumnIndex = globalInvocationId.x;
  let rowIndex = globalInvocationId.y;
  let rowCount = parameters[0];
  let inputColumnCount = parameters[1];
  let outputColumnCount = parameters[2];
  let inputOffset = parameters[3];
  let outputOffset = parameters[4];
  let hasBias = parameters[5];

  if (rowIndex >= rowCount || outputColumnIndex >= outputColumnCount) {
    return;
  }

  var accumulator = 0.0;
  if (hasBias == 1u) {
    accumulator = biasData[outputColumnIndex];
  }
  for (var inputColumnIndex = 0u; inputColumnIndex < inputColumnCount; inputColumnIndex = inputColumnIndex + 1u) {
    accumulator = accumulator +
      inputData[inputOffset + rowIndex * inputColumnCount + inputColumnIndex] *
      weightData[outputColumnIndex * inputColumnCount + inputColumnIndex];
  }

  outputData[outputOffset + rowIndex * outputColumnCount + outputColumnIndex] = accumulator;
}
`;

const ATTENTION_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> queryKeyValueData: array<f32>;
@group(0) @binding(1) var<storage, read_write> outputData: array<f32>;
@group(0) @binding(2) var<storage, read> parameters: array<u32>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let channelIndex = globalInvocationId.x;
  let tokenIndex = globalInvocationId.y;
  let sequenceLength = parameters[0];
  let channelCount = parameters[1];
  let headSize = parameters[2];

  if (tokenIndex >= sequenceLength || channelIndex >= channelCount) {
    return;
  }

  let headIndex = channelIndex / headSize;
  let channelWithinHead = channelIndex - headIndex * headSize;
  let queryOffset = tokenIndex * 3u * channelCount + headIndex * headSize;
  let scale = inverseSqrt(f32(headSize));

  var maximumValue = -10000.0;
  for (var previousTokenIndex = 0u; previousTokenIndex <= tokenIndex; previousTokenIndex = previousTokenIndex + 1u) {
    let keyOffset = previousTokenIndex * 3u * channelCount + channelCount + headIndex * headSize;
    var score = 0.0;
    for (var elementIndex = 0u; elementIndex < headSize; elementIndex = elementIndex + 1u) {
      score = score + queryKeyValueData[queryOffset + elementIndex] * queryKeyValueData[keyOffset + elementIndex];
    }
    score = score * scale;
    maximumValue = max(maximumValue, score);
  }

  var scoreSum = 0.0;
  for (var previousTokenIndex = 0u; previousTokenIndex <= tokenIndex; previousTokenIndex = previousTokenIndex + 1u) {
    let keyOffset = previousTokenIndex * 3u * channelCount + channelCount + headIndex * headSize;
    var score = 0.0;
    for (var elementIndex = 0u; elementIndex < headSize; elementIndex = elementIndex + 1u) {
      score = score + queryKeyValueData[queryOffset + elementIndex] * queryKeyValueData[keyOffset + elementIndex];
    }
    scoreSum = scoreSum + exp(score * scale - maximumValue);
  }

  var outputValue = 0.0;
  for (var previousTokenIndex = 0u; previousTokenIndex <= tokenIndex; previousTokenIndex = previousTokenIndex + 1u) {
    let keyOffset = previousTokenIndex * 3u * channelCount + channelCount + headIndex * headSize;
    let valueOffset = previousTokenIndex * 3u * channelCount + 2u * channelCount + headIndex * headSize;
    var score = 0.0;
    for (var elementIndex = 0u; elementIndex < headSize; elementIndex = elementIndex + 1u) {
      score = score + queryKeyValueData[queryOffset + elementIndex] * queryKeyValueData[keyOffset + elementIndex];
    }
    let attentionWeight = exp(score * scale - maximumValue) / scoreSum;
    outputValue = outputValue + attentionWeight * queryKeyValueData[valueOffset + channelWithinHead];
  }

  outputData[tokenIndex * channelCount + channelIndex] = outputValue;
}
`;

const RESIDUAL_ADD_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> leftData: array<f32>;
@group(0) @binding(1) var<storage, read> rightData: array<f32>;
@group(0) @binding(2) var<storage, read_write> outputData: array<f32>;
@group(0) @binding(3) var<storage, read> parameters: array<u32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let elementIndex = globalInvocationId.x;
  let elementCount = parameters[0];

  if (elementIndex >= elementCount) {
    return;
  }

  outputData[elementIndex] = leftData[elementIndex] + rightData[elementIndex];
}
`;

const GELU_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> inputData: array<f32>;
@group(0) @binding(1) var<storage, read_write> outputData: array<f32>;
@group(0) @binding(2) var<storage, read> parameters: array<u32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let elementIndex = globalInvocationId.x;
  let elementCount = parameters[0];

  if (elementIndex >= elementCount) {
    return;
  }

  let inputValue = inputData[elementIndex];
  let cubicValue = 0.044715 * inputValue * inputValue * inputValue;
  let tanhInput = clamp(0.7978845608028654 * (inputValue + cubicValue), -10.0, 10.0);
  outputData[elementIndex] = 0.5 * inputValue * (1.0 + tanh(tanhInput));
}
`;

const VISUALIZATION_SOURCE = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>
};

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
  @location(0) cellData: vec2<f32>
) -> VertexOutput {
  let columnCount = ${VISUALIZATION_COLUMN_COUNT}u;
  let rowCount = ${VISUALIZATION_ROW_COUNT}u;
  let columnIndex = instanceIndex % columnCount;
  let rowIndex = instanceIndex / columnCount;
  let cellWidth = 1.86 / f32(columnCount);
  let cellHeight = 1.72 / f32(rowCount);
  let center = vec2<f32>(
    -0.93 + (f32(columnIndex) + 0.5) * cellWidth,
    0.86 - (f32(rowIndex) + 0.5) * cellHeight
  );
  let halfSize = vec2<f32>(cellWidth * 0.5, cellHeight * 0.5);
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(-halfSize.x, -halfSize.y),
    vec2<f32>(halfSize.x, -halfSize.y),
    vec2<f32>(halfSize.x, halfSize.y),
    vec2<f32>(-halfSize.x, -halfSize.y),
    vec2<f32>(halfSize.x, halfSize.y),
    vec2<f32>(-halfSize.x, halfSize.y)
  );
  let intensity = clamp(cellData.x, 0.0, 1.0);
  let state = cellData.y;
  var color = vec3<f32>(0.025, 0.035, 0.055);

  if (state > 2.5) {
    color = mix(vec3<f32>(0.24, 0.0, 0.06), vec3<f32>(1.0, 0.04, 0.18), max(intensity, 0.35));
  } else if (state > 1.5) {
    color = mix(vec3<f32>(0.02, 0.12, 0.30), vec3<f32>(0.00, 0.78, 1.00), max(intensity, 0.08));
  } else if (state > 0.5) {
    color = mix(vec3<f32>(0.18, 0.10, 0.02), vec3<f32>(1.00, 0.82, 0.10), max(intensity, 0.08));
  } else if (state > 0.0) {
    color = vec3<f32>(0.06, 0.07, 0.09);
  }

  var output: VertexOutput;
  output.position = vec4<f32>(center + corners[vertexIndex], 0.0, 1.0);
  output.color = color;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(input.color, 1.0);
}
`;

type GPT2Config = {
  maxSequenceLength: number;
  vocabularySize: number;
  paddedVocabularySize: number;
  layerCount: number;
  headCount: number;
  channelCount: number;
  headSize: number;
};

type ParameterOffsets = {
  tokenEmbedding: number;
  positionEmbedding: number;
  layerNorm1Weight: number;
  layerNorm1Bias: number;
  queryKeyValueWeight: number;
  queryKeyValueBias: number;
  attentionProjectionWeight: number;
  attentionProjectionBias: number;
  layerNorm2Weight: number;
  layerNorm2Bias: number;
  feedForwardWeight: number;
  feedForwardBias: number;
  feedForwardProjectionWeight: number;
  feedForwardProjectionBias: number;
  finalLayerNormWeight: number;
  finalLayerNormBias: number;
};

type Tokenizer = {
  vocabularySize: number;
  endOfTextToken: number;
  tokenTable: string[];
  tokenBytesTable: Uint8Array[];
  tokenIdsByByteSequence: Map<string, number>;
  singleByteTokenByByte: Map<number, number>;
  mergedTokenCache: Map<string, number | null>;
};

type TokenEmbeddingChunk = {
  startRow: number;
  rowCount: number;
  buffer: Buffer;
};

type LayerWeights = {
  layerNorm1Weight: Buffer;
  layerNorm1Bias: Buffer;
  queryKeyValueWeight: Buffer;
  queryKeyValueBias: Buffer;
  attentionProjectionWeight: Buffer;
  attentionProjectionBias: Buffer;
  layerNorm2Weight: Buffer;
  layerNorm2Bias: Buffer;
  feedForwardWeight: Buffer;
  feedForwardBias: Buffer;
  feedForwardProjectionWeight: Buffer;
  feedForwardProjectionBias: Buffer;
};

type GPT2Model = {
  config: GPT2Config;
  parameterValues: Float32Array;
  parameterOffsets: ParameterOffsets;
  tokenizer: Tokenizer;
  tokenEmbeddingChunks: TokenEmbeddingChunk[];
  layers: LayerWeights[];
  finalLayerNormWeight: Buffer;
  finalLayerNormBias: Buffer;
  emptyBias: Buffer;
};

type GPUTensors = {
  residualA: Buffer;
  residualB: Buffer;
  normalized: Buffer;
  queryKeyValue: Buffer;
  attentionOutput: Buffer;
  feedForward: Buffer;
  feedForwardGelu: Buffer;
  logits: Buffer;
  computeParameters: Buffer;
};

type Kernels = {
  layerNorm: Computation;
  matrixMultiply: Computation;
  attention: Computation;
  residualAdd: Computation;
  gelu: Computation;
};

type TopToken = {
  token: number;
  text: string;
  logit: number;
  scaledLogitDelta: number;
  probability: number;
};

type NextTokenResult = {
  topTokens: TopToken[];
  rawTopTokens: TopToken[];
  selectedToken: TopToken;
  elapsedMilliseconds: number;
};

type GenerationLogitsStep = {
  generatedIndex: number;
  completionPrefixText: string;
  completionText: string;
  contextStartPosition: number;
  contextTokens: number[];
  topTokens: TopToken[];
  rawTopTokens: TopToken[];
  selectedToken: TopToken;
  elapsedMilliseconds: number;
  temperature: number;
};

type ValueStats = {
  count: number;
  finiteCount: number;
  nanCount: number;
  positiveInfinityCount: number;
  negativeInfinityCount: number;
  zeroCount: number;
  minimum: number;
  maximum: number;
  mean: number;
  absoluteMaximum: number;
  samples: number[];
  firstNonFiniteIndex: number | null;
};

type VisualizationSpan = {
  label: string;
  startCell: number;
  endCell: number;
  writtenCellCount: number;
  sourceValueCount: number;
  sourceColumnCount: number | null;
  contextTokens: number[] | null;
  contextStartPosition: number | null;
};

type VisualizationSpanOptions = {
  sourceColumnCount?: number;
  contextTokens?: number[];
  contextStartPosition?: number;
};

type VisualizationDragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startViewportColumn: number;
  startViewportRow: number;
  startViewportColumnCount: number;
  startViewportRowCount: number;
};

type VisualizationHoverEventHandlers = {
  mousemove: (event: MouseEvent) => void;
  wheel: (event: WheelEvent) => void;
  pointerdown: (event: PointerEvent) => void;
  pointermove: (event: PointerEvent) => void;
  pointerup: (event: PointerEvent) => void;
  pointercancel: (event: PointerEvent) => void;
  dblclick: (event: MouseEvent) => void;
  mouseleave: () => void;
};

type VisualizationSourceRange = {
  start: number;
  end: number;
};

export default class GPT2TransformerExample extends AnimationLoopTemplate {
  static title = 'WebGPU GPT-2 Transformer';

  static info = `
    <section class="gpgpu-shell">
      <style>
        .gpgpu-shell {
          box-sizing: border-box;
          max-width: 1180px;
          height: 100dvh;
          overflow: hidden;
          color: #dbe7f3;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          letter-spacing: 0;
        }
        .gpgpu-workspace {
          display: grid;
          height: 100%;
          gap: 14px;
          grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.95fr);
          align-items: stretch;
        }
        .gpgpu-main-column {
          display: grid;
          gap: 14px;
          grid-template-rows: auto minmax(0, 1fr);
          min-height: 0;
          min-width: 0;
        }
        .gpgpu-output-column {
          display: grid;
          min-height: 0;
          min-width: 0;
        }
        .gpgpu-panel {
          border: 1px solid #294055;
          background: #09131f;
          color: #dbe7f3;
          padding: 18px;
        }
        .gpgpu-hero {
          display: grid;
          gap: 12px;
          background: #08111c;
          border-left: 4px solid #38bdf8;
          padding: 14px 16px;
        }
        .gpgpu-title-row,
        .gpgpu-prompt-row,
        .gpgpu-settings-row,
        .gpgpu-status-grid {
          display: grid;
          gap: 10px;
        }
        .gpgpu-title-row {
          grid-template-columns: minmax(0, 1fr);
        }
        .gpgpu-kicker {
          margin: 0 0 4px 0;
          color: #7dd3fc;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .gpgpu-title {
          margin: 0;
          color: #f8fafc;
          font-size: 22px;
          line-height: 1.1;
        }
        .gpgpu-copy {
          margin: 6px 0 0 0;
          max-width: 760px;
          color: #bfd0e0;
          font-size: 13px;
          line-height: 1.4;
        }
        .gpgpu-actions,
        .gpgpu-shortcuts,
        .gpgpu-toggle-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .gpgpu-actions {
          justify-content: flex-end;
          align-items: end;
        }
        .gpgpu-prompt-row {
          align-items: end;
          grid-template-columns: minmax(320px, 1fr) auto;
        }
        .gpgpu-settings-row {
          align-items: end;
          grid-template-columns: auto auto minmax(180px, 1fr);
        }
        .gpgpu-field,
        .gpgpu-field-row,
        .gpgpu-stack {
          display: grid;
          gap: 6px;
        }
        .gpgpu-setting {
          border: 1px solid #294055;
          border-radius: 8px;
          background: #0b1622;
          padding: 8px 10px;
        }
        .gpgpu-field-row {
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
        }
        .gpgpu-label {
          color: #e2edf7;
          font-size: 13px;
          font-weight: 700;
        }
        .gpgpu-input,
        .gpgpu-select {
          width: 100%;
          min-height: 36px;
          box-sizing: border-box;
          border: 1px solid #486174;
          background: #f8fafc;
          color: #09131f;
          font: inherit;
          padding: 7px 10px;
        }
        .gpgpu-number {
          width: 96px;
        }
        .gpgpu-button {
          min-height: 36px;
          border: 1px solid #567086;
          background: #142536;
          color: #edf6ff;
          cursor: pointer;
          font: inherit;
          font-weight: 650;
          padding: 7px 11px;
        }
        .gpgpu-setting .gpgpu-button {
          border-radius: 999px;
          font-size: 12px;
          min-height: 28px;
          padding: 4px 9px;
        }
        .gpgpu-setting .gpgpu-button[aria-pressed="true"] {
          background: #1f8f72;
          border-color: #67e8c4;
          color: #f0fdfa;
          box-shadow: inset 0 0 0 1px rgba(240, 253, 250, 0.18);
        }
        .gpgpu-setting .gpgpu-shortcuts {
          gap: 6px;
        }
        .gpgpu-setting .gpgpu-label {
          font-size: 12px;
        }
        .gpgpu-actions .gpgpu-button {
          border-radius: 999px;
          padding-inline: 16px;
        }
        .gpgpu-button:hover {
          background: #1a3248;
        }
        .gpgpu-button-primary {
          border-color: #38bdf8;
          background: #0f7498;
          color: #f8fafc;
        }
        .gpgpu-button-danger {
          border-color: #c08457;
          background: #5c3524;
        }
        .gpgpu-button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }
        .gpgpu-range {
          width: 100%;
          accent-color: #38bdf8;
        }
        .gpgpu-status-card,
        .gpgpu-download-card,
        .gpgpu-note {
          border: 1px solid #294055;
          background: #0d1a28;
          padding: 14px;
        }
        .gpgpu-output-card {
          display: grid;
          grid-template-rows: minmax(0, 1fr);
          min-height: 0;
          height: 100%;
        }
        .gpgpu-download-card {
          align-content: start;
        }
        .gpgpu-tab-shell {
          background: #0d1a28;
          border: 1px solid #294055;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          min-height: 0;
          padding: 14px;
        }
        .gpgpu-tab-shell[data-loading="true"] {
          grid-template-rows: minmax(0, 1fr);
          padding: 0;
        }
        .gpgpu-tab-shell[data-loading="true"] .gpgpu-tabs,
        .gpgpu-tab-shell[data-loading="true"] .gpgpu-tab-panels {
          display: none;
        }
        .gpgpu-loading-stage {
          display: none;
          min-height: 0;
        }
        .gpgpu-tab-shell[data-loading="true"] .gpgpu-loading-stage {
          display: grid;
        }
        .gpgpu-loading-stage .gpgpu-download-card {
          align-content: center;
          border: 0;
          display: grid;
          gap: 18px;
          height: 100%;
          min-height: 0;
          padding: 28px;
        }
        .gpgpu-loading-message {
          color: #edf6ff;
          font-size: 15px;
          font-weight: 650;
          line-height: 1.4;
        }
        .gpgpu-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .gpgpu-tab-button {
          background: #142536;
          border: 1px solid #567086;
          color: #dbe7f3;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          min-height: 34px;
          padding: 7px 11px;
        }
        .gpgpu-tab-button[aria-selected="true"] {
          background: #0f7498;
          border-color: #38bdf8;
          color: #f8fafc;
        }
        .gpgpu-tab-panels {
          min-height: 0;
        }
        .gpgpu-tab-panel {
          display: none;
          height: 100%;
          min-height: 0;
          overflow: auto;
        }
        .gpgpu-tab-panel[data-active="true"] {
          display: grid;
          gap: 12px;
          grid-template-rows: auto minmax(0, 1fr);
        }
        .gpgpu-stage-head {
          align-items: center;
          display: flex;
          gap: 10px;
          justify-content: space-between;
        }
        .gpgpu-stage-title {
          color: #f8fafc;
          font-size: 15px;
          font-weight: 750;
        }
        .gpgpu-stage-surface {
          background: #03070d;
          border: 1px solid #294055;
          display: grid;
          min-height: 0;
          overflow: hidden;
          position: relative;
        }
        .gpgpu-visualization-host {
          display: none;
          min-height: 0;
          width: 100%;
        }
        .gpgpu-visualization-host canvas {
          display: block !important;
          height: 100% !important;
          min-height: 0;
          width: 100% !important;
        }
        .gpgpu-device {
          color: #7dd3fc;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
          margin-bottom: 10px;
        }
        .gpgpu-output {
          color: #edf6ff;
          font-size: 14px;
          line-height: 1.55;
          margin: 0;
          overflow: auto;
          padding-right: 6px;
          white-space: pre-wrap;
        }
        .gpgpu-output-layout {
          display: grid;
          gap: 10px;
        }
        .gpgpu-output-section {
          background: #0b1622;
          border: 1px solid #294055;
          border-radius: 8px;
          padding: 10px 12px;
        }
        .gpgpu-output-section-title {
          color: #f8fafc;
          font-size: 13px;
          font-weight: 750;
          margin: 0 0 6px 0;
        }
        .gpgpu-output-pre {
          background: transparent !important;
          border: 0 !important;
          color: inherit !important;
          font: inherit;
          line-height: inherit;
          margin: 0;
          padding: 0 !important;
          white-space: pre-wrap;
        }
        .gpgpu-model-output {
          color: #9fd7b0;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.6;
        }
        .gpgpu-logits-pre {
          border: 1px solid #294055 !important;
          border-radius: 8px;
          padding: 8px !important;
        }
        .gpgpu-download-row {
          display: grid;
          gap: 6px;
        }
        .gpgpu-download-head {
          align-items: center;
          display: flex;
          gap: 8px;
          justify-content: space-between;
        }
        .gpgpu-spinner {
          animation: gpgpu-loading-spin 0.8s linear infinite;
          border: 2px solid #486174;
          border-radius: 999px;
          border-top-color: #f8fafc;
          display: inline-block;
          height: 12px;
          width: 12px;
        }
        .gpgpu-download-status {
          color: #c5d6e6;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
        }
        .gpgpu-progress {
          background: #162738;
          height: 8px;
          overflow: hidden;
        }
        .gpgpu-progress > div {
          height: 100%;
          width: 0%;
        }
        .gpgpu-model-bar {
          background: #38bdf8;
        }
        .gpgpu-tokenizer-bar {
          background: #34d399;
        }
        .gpgpu-note {
          color: #b8cadb;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          line-height: 1.45;
          margin: 0;
        }
        .gpgpu-details-body {
          border: 1px solid #294055;
          background: #07111c;
          color: #bfd0e0;
          font-size: 12px;
          line-height: 1.5;
          overflow: auto;
          padding: 12px 14px;
        }
        .gpgpu-debug {
          border: 1px solid #294055;
          background: #07111c;
          color: #dbe7f3;
          font-size: 11px;
          line-height: 1.4;
          height: 100%;
          margin: 0;
          min-height: 0;
          overflow: auto;
          padding: 10px;
          white-space: pre-wrap;
        }
        .gpgpu-toggle {
          align-items: center;
          color: #e2edf7;
          display: inline-flex;
          gap: 6px;
          font-size: 13px;
        }
        @keyframes gpgpu-loading-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .gpgpu-workspace {
            grid-template-columns: 1fr;
            overflow: auto;
          }
          .gpgpu-title-row,
          .gpgpu-prompt-row,
          .gpgpu-settings-row,
          .gpgpu-field-row {
            grid-template-columns: 1fr;
          }
          .gpgpu-actions {
            justify-content: flex-start;
          }
          .gpgpu-number {
            width: 100%;
          }
        }
      </style>
      <div class="gpgpu-workspace">
        <div class="gpgpu-main-column">
          <div class="gpgpu-panel gpgpu-hero">
            <div class="gpgpu-title-row">
              <div>
                <p class="gpgpu-kicker">WebGPU Compute Demo</p>
                <h2 class="gpgpu-title">GPT-2 124M next-token lab</h2>
                <p class="gpgpu-copy">
                  Load the llm.c checkpoint, inspect tensor activity, and sample continuations with
                  luma.gl compute shaders driving the dense projections and language-model head.
                </p>
              </div>
            </div>
            <div class="gpgpu-prompt-row">
              <label class="gpgpu-field">
                <span class="gpgpu-label">Prompt</span>
                <input id="gpgpu-prompt" class="gpgpu-input" value="${DEFAULT_PROMPT}" />
              </label>
              <div class="gpgpu-actions">
                <button id="gpgpu-generate" class="gpgpu-button gpgpu-button-primary" disabled>Generate</button>
                <button id="gpgpu-stop" class="gpgpu-button gpgpu-button-danger" disabled>Stop</button>
              </div>
            </div>
            <div class="gpgpu-settings-row">
              <div class="gpgpu-stack gpgpu-setting">
                <span class="gpgpu-label">Max new tokens</span>
                <div class="gpgpu-shortcuts" aria-label="Max new token shortcuts">
                  <button type="button" class="gpgpu-button" data-gpgpu-token-count="1" aria-label="Generate up to 1 new token">1</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-token-count="16" aria-label="Generate up to 16 new tokens">16</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-token-count="64" aria-label="Generate up to 64 new tokens">64</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-token-count="256" aria-label="Generate up to 256 new tokens">256</button>
                </div>
              </div>
              <div class="gpgpu-stack gpgpu-setting">
                <span class="gpgpu-label">Context window</span>
                <div class="gpgpu-shortcuts" aria-label="Context window shortcuts">
                  <button type="button" class="gpgpu-button" data-gpgpu-context-token-count="16" aria-label="Use a 16 token context window">16</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-context-token-count="32" aria-label="Use a 32 token context window">32</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-context-token-count="64" aria-label="Use a 64 token context window">64</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-context-token-count="128" aria-label="Use a 128 token context window">128</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-context-token-count="256" aria-label="Use a 256 token context window">256</button>
                </div>
              </div>
              <div class="gpgpu-stack gpgpu-setting">
                <label class="gpgpu-field">
                  <span class="gpgpu-label">Temperature <output id="gpgpu-temperature-value">${DEFAULT_TEMPERATURE.toFixed(2)}</output></span>
                  <input id="gpgpu-temperature" class="gpgpu-range" type="range" min="${MINIMUM_TEMPERATURE}" max="${MAXIMUM_TEMPERATURE}" step="0.05" value="${DEFAULT_TEMPERATURE}" />
                </label>
              </div>
            </div>
          </div>
          <div id="gpgpu-tab-shell" class="gpgpu-tab-shell" data-loading="true">
            <div id="gpgpu-loading-stage" class="gpgpu-loading-stage">
              <div id="gpgpu-loading" class="gpgpu-download-card">
                <div class="gpgpu-loading-message">
                  Loading GPT-2 124M model and tokenizer from Hugging Face...
                </div>
                <div class="gpgpu-download-row">
                  <div class="gpgpu-download-head">
                    <span style="display: inline-flex; align-items: center; gap: 8px;">
                      <span id="gpgpu-model-spinner" class="gpgpu-spinner" aria-hidden="true"></span>
                      <span>Model</span>
                    </span>
                    <span id="gpgpu-model-download-status" class="gpgpu-download-status">Waiting</span>
                  </div>
                  <div class="gpgpu-progress">
                    <div id="gpgpu-model-download-bar" class="gpgpu-model-bar"></div>
                  </div>
                </div>
                <div class="gpgpu-download-row">
                  <div class="gpgpu-download-head">
                    <span style="display: inline-flex; align-items: center; gap: 8px;">
                      <span id="gpgpu-tokenizer-spinner" class="gpgpu-spinner" aria-hidden="true"></span>
                      <span>Tokenizer</span>
                    </span>
                    <span id="gpgpu-tokenizer-download-status" class="gpgpu-download-status">Waiting</span>
                  </div>
                  <div class="gpgpu-progress">
                    <div id="gpgpu-tokenizer-download-bar" class="gpgpu-tokenizer-bar"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="gpgpu-tabs" role="tablist" aria-label="GPT-2 workspace views">
              <button type="button" class="gpgpu-tab-button" data-gpgpu-tab-target="tensor-atlas" role="tab" aria-selected="true">Tensor Atlas</button>
              <button type="button" class="gpgpu-tab-button" data-gpgpu-tab-target="about-demo" role="tab" aria-selected="false">About Demo</button>
              <button type="button" class="gpgpu-tab-button" data-gpgpu-tab-target="about-atlas" role="tab" aria-selected="false">About Atlas</button>
              <button type="button" class="gpgpu-tab-button" data-gpgpu-tab-target="debug-trace" role="tab" aria-selected="false">Debug Trace</button>
            </div>
            <div class="gpgpu-tab-panels">
              <section class="gpgpu-tab-panel" data-gpgpu-tab-panel="tensor-atlas" data-active="true" role="tabpanel">
                <div class="gpgpu-stage-head">
                  <div class="gpgpu-stage-title">Tensor atlas</div>
                  <div id="gpgpu-device" class="gpgpu-device">Device: initializing...</div>
                </div>
                <div class="gpgpu-stage-surface">
                  <div id="gpgpu-visualization-host" class="gpgpu-visualization-host"></div>
                </div>
                <div id="gpgpu-canvas-hover-readout" class="gpgpu-note">
                  Canvas hover: move over the atlas after a run to inspect the tensor span under the mouse. Scroll to zoom, drag to pan, double-click resets.
                </div>
              </section>
              <section class="gpgpu-tab-panel" data-gpgpu-tab-panel="about-demo" data-active="false" role="tabpanel">
                <div class="gpgpu-details-body">
          <p style="margin: 0 0 6px 0;">
            The prompt is tokenized with byte-level GPT-2 BPE, converted to token plus absolute position embeddings, and run through the selected sliding context window.
            Each transformer block applies layer norm, causal self-attention, a residual add, another layer norm, an MLP with GELU, and a final residual add.
          </p>
          <p style="margin: 0 0 6px 0;">
            WebGPU compute shaders run the tensor-heavy work: layer norms, QKV projections, attention, projection matrices, GELU, residual adds, and the final language-model head.
            The CPU still handles UI, tokenization, sampling, and reading back final logits.
          </p>
          <p style="margin: 0;">
            The final logits are unnormalized token scores. Temperature 0 picks the highest logit; temperatures above 0 convert logits to probabilities and sample from the distribution.
            The logits table shows raw logit, temperature-scaled delta from the best token, probability, and decoded token text.
            During generation, click any generated-token chip to inspect the logits that produced that token; the demo keeps the logits history for the current run.
          </p>
                </div>
              </section>
              <section class="gpgpu-tab-panel" data-gpgpu-tab-panel="about-atlas" data-active="false" role="tabpanel">
                <div class="gpgpu-details-body">
          <p style="margin: 0 0 6px 0;">
            The canvas is a dense tensor atlas. It uses ${VISUALIZATION_COLUMN_COUNT} by ${VISUALIZATION_ROW_COUNT} tiny cells, so the latest forward pass can show token embeddings, position embeddings, sampled matrix weights, activations, and logits across all layers.
            Read it left to right, top to bottom; new tensor spans are appended in the same order the model runs.
          </p>
          <p style="margin: 0 0 6px 0;">
            Each tiny cell is one sampled tensor value: yellow is positive, cyan is negative, dark gray is zero, and red is NaN or infinity.
            Small tensors are shown value-for-value; large matrices are sampled from the whole matrix so every layer and major multiply gets canvas space.
          </p>
          <p style="margin: 0 0 6px 0;">
            The first spans are the selected context token embeddings, position embeddings, and their sum. Then each GPT-2 block adds sampled parameter tensors for layer norm, QKV, attention projection, MLP, and output projection, followed by the activations produced by those WebGPU kernels.
            The final spans show the last layer norm and the language-model-head logits over the vocabulary.
          </p>
          <p style="margin: 0 0 6px 0;">
            Repeated horizontal textures usually mean a matrix is being sampled across rows and columns. Large yellow or cyan bands show strongly signed values; mixed blue/yellow noise means weights or activations are balanced around zero.
            Red is the important failure signal: it means a tensor readback saw NaN or infinity.
          </p>
          <p style="margin: 0;">
            Move the mouse over the canvas to see the tensor span, atlas cell, approximate sampled source index, sign, and intensity under the pointer.
            Context-token spans and the final logits span also show the actual token id and decoded token text under the mouse.
            Scroll on the canvas to zoom around the cursor, drag to pan the zoomed atlas, and double-click the canvas to reset to the full atlas.
            The canvas visualization and Debug Trace have separate controls. Enable Debug Trace to see the exact tensor names, stats, and pixel ranges that correspond to the atlas spans; keep it off for faster generation.
          </p>
                </div>
              </section>
              <section class="gpgpu-tab-panel" data-gpgpu-tab-panel="debug-trace" data-active="false" role="tabpanel">
                <div class="gpgpu-toggle-row">
                  <label class="gpgpu-toggle">
                    <input id="gpgpu-canvas-enabled" type="checkbox" checked />
                    <span>Canvas tensor visualization</span>
                  </label>
                  <label class="gpgpu-toggle">
                    <input id="gpgpu-debug-enabled" type="checkbox" />
                    <span>Debug Trace</span>
                  </label>
                </div>
                <pre id="gpgpu-debug" class="gpgpu-debug">Waiting for model load...</pre>
              </section>
            </div>
          </div>
        </div>
        <aside class="gpgpu-output-column">
          <div class="gpgpu-status-card gpgpu-output-card">
            <div id="gpgpu-output" class="gpgpu-output">
              <div class="gpgpu-output-layout">
                <section class="gpgpu-output-section">
                  <div class="gpgpu-output-section-title">Output</div>
                  <pre class="gpgpu-output-pre">Loading GPT-2 files...</pre>
                </section>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;

  private device: AnimationProps['device'] | null = null;
  private model: GPT2Model | null = null;
  private tensors: GPUTensors | null = null;
  private kernels: Kernels | null = null;
  private generationAbortController: AbortController | null = null;
  private debugLines: string[] = [];
  private visualizationModel: Model | null = null;
  private visualizationBuffer: Buffer | null = null;
  private visualizationValues = new Float32Array(VISUALIZATION_CELL_COUNT * 2);
  private displayedVisualizationValues = new Float32Array(VISUALIZATION_CELL_COUNT * 2);
  private renderedVisualizationValues = new Float32Array(VISUALIZATION_CELL_COUNT * 2);
  private visualizationSpans: VisualizationSpan[] = [];
  private displayedVisualizationSpans: VisualizationSpan[] = [];
  private visualizationWriteIndex = 0;
  private visualizationDirty = false;
  private isFinalized = false;
  private visualizationHoverCanvas: HTMLCanvasElement | null = null;
  private visualizationHoverTooltip: HTMLDivElement | null = null;
  private visualizationHoverEventHandlers: VisualizationHoverEventHandlers | null = null;
  private visualizationHoverSetupTimeout: number | null = null;
  private visualizationHoverCanvasCursor = '';
  private visualizationHoverCanvasTouchAction = '';
  private visualizationZoom = VISUALIZATION_MINIMUM_ZOOM;
  private visualizationViewportColumn = 0;
  private visualizationViewportRow = 0;
  private visualizationDragState: VisualizationDragState | null = null;
  private generationLogitsSteps: GenerationLogitsStep[] = [];
  private selectedGenerationLogitsStepIndex: number | null = null;

  override async onInitialize({device}: AnimationProps): Promise<void> {
    this.isFinalized = false;
    if (device.type !== 'webgpu') {
      throw new Error(`This example requires a WebGPU device. Received "${device.type}".`);
    }

    this.device = device;
    this.createVisualization(device);
    this.mountVisualizationCanvas();
    this.setupWorkspaceTabs();
    this.updateDeviceInfo(`Device: ${device.type} via luma.gl WebGPU compute`);
    this.writeOutput('');
    this.resetDownloadProgress();
    this.resetDebugLog('Model load');
    this.appendDebugLine(`Device type: ${device.type}`);
    this.appendDebugLine(`Device info: ${JSON.stringify(device.info, null, 2)}`);
    this.appendDebugLine(`Model URL: ${MODEL_URL}`);
    this.appendDebugLine(`Tokenizer URL: ${TOKENIZER_URL}`);

    try {
      this.kernels = this.createKernels(device);
      this.model = await this.loadModel(device);
      this.tensors = this.createTensors(device, this.model.config);
      this.setupGenerateButton();
      this.setupVisualizationHover();
      this.writeModelSummary(this.model);
    } catch (error) {
      this.writeOutput(this.formatError(error));
      throw error;
    }
  }

  override onRender({device}: AnimationProps): void {
    if (!this.visualizationModel) {
      return;
    }

    const renderPass = device.beginRenderPass({clearColor: [0.005, 0.007, 0.012, 1]});
    this.visualizationModel.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.generationAbortController?.abort();
    this.teardownVisualizationHover();
    this.destroyModel();
    this.destroyTensors();
    this.destroyKernels();
    this.visualizationModel?.destroy();
    this.visualizationBuffer?.destroy();
    this.visualizationModel = null;
    this.visualizationBuffer = null;
  }

  private async loadModel(device: AnimationProps['device']): Promise<GPT2Model> {
    const [modelArrayBuffer, tokenizerArrayBuffer] = await Promise.all([
      this.fetchArrayBuffer(MODEL_URL, 'model'),
      this.fetchArrayBuffer(TOKENIZER_URL, 'tokenizer')
    ]);
    this.showVisualizationStage();

    const {config, parameterValues, parameterOffsets} = this.parseModel(
      modelArrayBuffer,
      MODEL_URL
    );
    const tokenizer = this.parseTokenizer(tokenizerArrayBuffer, TOKENIZER_URL);
    const tokenEmbeddingChunks = this.createTokenEmbeddingChunks(
      device,
      config,
      parameterValues,
      parameterOffsets
    );
    const layers = this.createLayerWeights(device, config, parameterValues, parameterOffsets);
    const finalLayerNormWeight = this.createStorageBuffer(
      device,
      'final-layernorm-weight',
      parameterValues.subarray(
        parameterOffsets.finalLayerNormWeight,
        parameterOffsets.finalLayerNormWeight + config.channelCount
      )
    );
    const finalLayerNormBias = this.createStorageBuffer(
      device,
      'final-layernorm-bias',
      parameterValues.subarray(
        parameterOffsets.finalLayerNormBias,
        parameterOffsets.finalLayerNormBias + config.channelCount
      )
    );
    const emptyBias = this.createStorageBuffer(device, 'empty-bias', new Float32Array([0]));

    return {
      config,
      parameterValues,
      parameterOffsets,
      tokenizer,
      tokenEmbeddingChunks,
      layers,
      finalLayerNormWeight,
      finalLayerNormBias,
      emptyBias
    };
  }

  private parseModel(
    arrayBuffer: ArrayBuffer,
    url: string
  ): {
    config: GPT2Config;
    parameterValues: Float32Array;
    parameterOffsets: ParameterOffsets;
  } {
    this.assertMinimumAssetByteLength(arrayBuffer, FILE_HEADER_BYTES, 'model', url);

    const header = new Int32Array(arrayBuffer, 0, 256);
    if (header[0] !== MODEL_MAGIC) {
      throw new Error(`Unexpected model magic ${header[0]}; expected ${MODEL_MAGIC}.`);
    }
    if (header[1] !== MODEL_VERSION_FLOAT32) {
      throw new Error(
        `Expected llm.c fp32 model version ${MODEL_VERSION_FLOAT32}; received ${header[1]}.`
      );
    }

    const channelCount = header[6];
    const headCount = header[5];
    const config: GPT2Config = {
      maxSequenceLength: header[2],
      vocabularySize: header[3],
      layerCount: header[4],
      headCount,
      channelCount,
      paddedVocabularySize: header[7],
      headSize: channelCount / headCount
    };

    const parameterSizes = this.getParameterSizes(config);
    const parameterOffsets = this.getParameterOffsets(parameterSizes);
    const parameterCount = parameterSizes.reduce((total, size) => total + size, 0);
    this.assertMinimumAssetByteLength(
      arrayBuffer,
      FILE_HEADER_BYTES + parameterCount * Float32Array.BYTES_PER_ELEMENT,
      'model',
      url
    );
    const parameterValues = new Float32Array(arrayBuffer, FILE_HEADER_BYTES, parameterCount);

    return {config, parameterValues, parameterOffsets};
  }

  private parseTokenizer(arrayBuffer: ArrayBuffer, url: string): Tokenizer {
    this.assertMinimumAssetByteLength(arrayBuffer, FILE_HEADER_BYTES, 'tokenizer', url);

    const header = new Uint32Array(arrayBuffer, 0, 256);
    if (header[0] !== TOKENIZER_MAGIC) {
      throw new Error(`Unexpected tokenizer magic ${header[0]}; expected ${TOKENIZER_MAGIC}.`);
    }
    if (header[1] !== TOKENIZER_VERSION) {
      throw new Error(`Expected tokenizer version ${TOKENIZER_VERSION}; received ${header[1]}.`);
    }

    const vocabularySize = header[2];
    const endOfTextToken = header[3];
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder();
    const tokenTable: string[] = [];
    const tokenBytesTable: Uint8Array[] = [];
    let byteOffset = FILE_HEADER_BYTES;

    for (let tokenIndex = 0; tokenIndex < vocabularySize; tokenIndex++) {
      const tokenByteLength = bytes[byteOffset++];
      const tokenBytes = bytes.slice(byteOffset, byteOffset + tokenByteLength);
      tokenTable.push(decoder.decode(tokenBytes));
      tokenBytesTable.push(tokenBytes);
      byteOffset += tokenByteLength;
    }

    const tokenIdsByByteSequence = new Map<string, number>();
    const singleByteTokenByByte = new Map<number, number>();
    for (let tokenIndex = 0; tokenIndex < tokenBytesTable.length; tokenIndex++) {
      const tokenBytes = tokenBytesTable[tokenIndex];
      tokenIdsByByteSequence.set(this.getByteSequenceKey(tokenBytes), tokenIndex);
      if (tokenBytes.length === 1) {
        singleByteTokenByByte.set(tokenBytes[0], tokenIndex);
      }
    }

    return {
      vocabularySize,
      endOfTextToken,
      tokenTable,
      tokenBytesTable,
      tokenIdsByByteSequence,
      singleByteTokenByByte,
      mergedTokenCache: new Map()
    };
  }

  private getParameterSizes(config: GPT2Config): number[] {
    const paddedVocabularySize = config.paddedVocabularySize;
    const channelCount = config.channelCount;
    const maxSequenceLength = config.maxSequenceLength;
    const layerCount = config.layerCount;

    return [
      paddedVocabularySize * channelCount,
      maxSequenceLength * channelCount,
      layerCount * channelCount,
      layerCount * channelCount,
      layerCount * 3 * channelCount * channelCount,
      layerCount * 3 * channelCount,
      layerCount * channelCount * channelCount,
      layerCount * channelCount,
      layerCount * channelCount,
      layerCount * channelCount,
      layerCount * 4 * channelCount * channelCount,
      layerCount * 4 * channelCount,
      layerCount * channelCount * 4 * channelCount,
      layerCount * channelCount,
      channelCount,
      channelCount
    ];
  }

  private getParameterOffsets(parameterSizes: number[]): ParameterOffsets {
    if (parameterSizes.length !== PARAMETER_TENSOR_COUNT) {
      throw new Error(`Expected ${PARAMETER_TENSOR_COUNT} parameter tensors.`);
    }

    const offsets: number[] = [];
    let offset = 0;
    for (const size of parameterSizes) {
      offsets.push(offset);
      offset += size;
    }

    return {
      tokenEmbedding: offsets[0],
      positionEmbedding: offsets[1],
      layerNorm1Weight: offsets[2],
      layerNorm1Bias: offsets[3],
      queryKeyValueWeight: offsets[4],
      queryKeyValueBias: offsets[5],
      attentionProjectionWeight: offsets[6],
      attentionProjectionBias: offsets[7],
      layerNorm2Weight: offsets[8],
      layerNorm2Bias: offsets[9],
      feedForwardWeight: offsets[10],
      feedForwardBias: offsets[11],
      feedForwardProjectionWeight: offsets[12],
      feedForwardProjectionBias: offsets[13],
      finalLayerNormWeight: offsets[14],
      finalLayerNormBias: offsets[15]
    };
  }

  private createTokenEmbeddingChunks(
    device: AnimationProps['device'],
    config: GPT2Config,
    parameterValues: Float32Array,
    parameterOffsets: ParameterOffsets
  ): TokenEmbeddingChunk[] {
    const chunks: TokenEmbeddingChunk[] = [];

    for (
      let startRow = 0;
      startRow < config.paddedVocabularySize;
      startRow += TOKEN_EMBEDDING_CHUNK_ROWS
    ) {
      const rowCount = Math.min(TOKEN_EMBEDDING_CHUNK_ROWS, config.paddedVocabularySize - startRow);
      const start = parameterOffsets.tokenEmbedding + startRow * config.channelCount;
      const end = start + rowCount * config.channelCount;
      chunks.push({
        startRow,
        rowCount,
        buffer: this.createStorageBuffer(
          device,
          `token-embedding-${startRow}`,
          parameterValues.subarray(start, end)
        )
      });
    }

    return chunks;
  }

  private createLayerWeights(
    device: AnimationProps['device'],
    config: GPT2Config,
    parameterValues: Float32Array,
    parameterOffsets: ParameterOffsets
  ): LayerWeights[] {
    const layers: LayerWeights[] = [];
    const channelCount = config.channelCount;
    const layerNormSize = channelCount;
    const queryKeyValueWeightSize = 3 * channelCount * channelCount;
    const queryKeyValueBiasSize = 3 * channelCount;
    const attentionProjectionWeightSize = channelCount * channelCount;
    const attentionProjectionBiasSize = channelCount;
    const feedForwardWeightSize = 4 * channelCount * channelCount;
    const feedForwardBiasSize = 4 * channelCount;
    const feedForwardProjectionWeightSize = channelCount * 4 * channelCount;
    const feedForwardProjectionBiasSize = channelCount;

    for (let layerIndex = 0; layerIndex < config.layerCount; layerIndex++) {
      layers.push({
        layerNorm1Weight: this.createLayerBuffer(
          device,
          parameterValues,
          parameterOffsets.layerNorm1Weight,
          layerNormSize,
          layerIndex,
          'ln1-weight'
        ),
        layerNorm1Bias: this.createLayerBuffer(
          device,
          parameterValues,
          parameterOffsets.layerNorm1Bias,
          layerNormSize,
          layerIndex,
          'ln1-bias'
        ),
        queryKeyValueWeight: this.createLayerBuffer(
          device,
          parameterValues,
          parameterOffsets.queryKeyValueWeight,
          queryKeyValueWeightSize,
          layerIndex,
          'qkv-weight'
        ),
        queryKeyValueBias: this.createLayerBuffer(
          device,
          parameterValues,
          parameterOffsets.queryKeyValueBias,
          queryKeyValueBiasSize,
          layerIndex,
          'qkv-bias'
        ),
        attentionProjectionWeight: this.createLayerBuffer(
          device,
          parameterValues,
          parameterOffsets.attentionProjectionWeight,
          attentionProjectionWeightSize,
          layerIndex,
          'attention-projection-weight'
        ),
        attentionProjectionBias: this.createLayerBuffer(
          device,
          parameterValues,
          parameterOffsets.attentionProjectionBias,
          attentionProjectionBiasSize,
          layerIndex,
          'attention-projection-bias'
        ),
        layerNorm2Weight: this.createLayerBuffer(
          device,
          parameterValues,
          parameterOffsets.layerNorm2Weight,
          layerNormSize,
          layerIndex,
          'ln2-weight'
        ),
        layerNorm2Bias: this.createLayerBuffer(
          device,
          parameterValues,
          parameterOffsets.layerNorm2Bias,
          layerNormSize,
          layerIndex,
          'ln2-bias'
        ),
        feedForwardWeight: this.createLayerBuffer(
          device,
          parameterValues,
          parameterOffsets.feedForwardWeight,
          feedForwardWeightSize,
          layerIndex,
          'feed-forward-weight'
        ),
        feedForwardBias: this.createLayerBuffer(
          device,
          parameterValues,
          parameterOffsets.feedForwardBias,
          feedForwardBiasSize,
          layerIndex,
          'feed-forward-bias'
        ),
        feedForwardProjectionWeight: this.createLayerBuffer(
          device,
          parameterValues,
          parameterOffsets.feedForwardProjectionWeight,
          feedForwardProjectionWeightSize,
          layerIndex,
          'feed-forward-projection-weight'
        ),
        feedForwardProjectionBias: this.createLayerBuffer(
          device,
          parameterValues,
          parameterOffsets.feedForwardProjectionBias,
          feedForwardProjectionBiasSize,
          layerIndex,
          'feed-forward-projection-bias'
        )
      });
    }

    return layers;
  }

  private createLayerBuffer(
    device: AnimationProps['device'],
    parameterValues: Float32Array,
    baseOffset: number,
    layerSize: number,
    layerIndex: number,
    id: string
  ): Buffer {
    const start = baseOffset + layerIndex * layerSize;
    return this.createStorageBuffer(
      device,
      `layer-${layerIndex}-${id}`,
      parameterValues.subarray(start, start + layerSize)
    );
  }

  private createTensors(device: AnimationProps['device'], config: GPT2Config): GPUTensors {
    const contextElementCount = MAX_CONTEXT_TOKENS * config.channelCount;
    const feedForwardElementCount = MAX_CONTEXT_TOKENS * 4 * config.channelCount;
    const queryKeyValueElementCount = MAX_CONTEXT_TOKENS * 3 * config.channelCount;

    return {
      residualA: this.createEmptyStorageBuffer(device, 'residual-a', contextElementCount),
      residualB: this.createEmptyStorageBuffer(device, 'residual-b', contextElementCount),
      normalized: this.createEmptyStorageBuffer(device, 'normalized', contextElementCount),
      queryKeyValue: this.createEmptyStorageBuffer(
        device,
        'query-key-value',
        queryKeyValueElementCount
      ),
      attentionOutput: this.createEmptyStorageBuffer(
        device,
        'attention-output',
        contextElementCount
      ),
      feedForward: this.createEmptyStorageBuffer(device, 'feed-forward', feedForwardElementCount),
      feedForwardGelu: this.createEmptyStorageBuffer(
        device,
        'feed-forward-gelu',
        feedForwardElementCount
      ),
      logits: this.createEmptyStorageBuffer(device, 'logits', config.paddedVocabularySize),
      computeParameters: device.createBuffer({
        id: 'compute-parameters',
        byteLength: 16 * Uint32Array.BYTES_PER_ELEMENT,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      })
    };
  }

  private createKernels(device: AnimationProps['device']): Kernels {
    return {
      layerNorm: new Computation(device, {
        id: 'layernorm',
        source: LAYER_NORM_SOURCE,
        shaderLayout: {
          bindings: [
            {name: 'inputData', type: 'storage', group: 0, location: 0},
            {name: 'scaleData', type: 'storage', group: 0, location: 1},
            {name: 'biasData', type: 'storage', group: 0, location: 2},
            {name: 'outputData', type: 'storage', group: 0, location: 3},
            {name: 'parameters', type: 'storage', group: 0, location: 4}
          ]
        }
      }),
      matrixMultiply: new Computation(device, {
        id: 'matrix-multiply',
        source: MATRIX_MULTIPLY_SOURCE,
        shaderLayout: {
          bindings: [
            {name: 'inputData', type: 'storage', group: 0, location: 0},
            {name: 'weightData', type: 'storage', group: 0, location: 1},
            {name: 'biasData', type: 'storage', group: 0, location: 2},
            {name: 'outputData', type: 'storage', group: 0, location: 3},
            {name: 'parameters', type: 'storage', group: 0, location: 4}
          ]
        }
      }),
      attention: new Computation(device, {
        id: 'attention',
        source: ATTENTION_SOURCE,
        shaderLayout: {
          bindings: [
            {name: 'queryKeyValueData', type: 'storage', group: 0, location: 0},
            {name: 'outputData', type: 'storage', group: 0, location: 1},
            {name: 'parameters', type: 'storage', group: 0, location: 2}
          ]
        }
      }),
      residualAdd: new Computation(device, {
        id: 'residual-add',
        source: RESIDUAL_ADD_SOURCE,
        shaderLayout: {
          bindings: [
            {name: 'leftData', type: 'storage', group: 0, location: 0},
            {name: 'rightData', type: 'storage', group: 0, location: 1},
            {name: 'outputData', type: 'storage', group: 0, location: 2},
            {name: 'parameters', type: 'storage', group: 0, location: 3}
          ]
        }
      }),
      gelu: new Computation(device, {
        id: 'gelu',
        source: GELU_SOURCE,
        shaderLayout: {
          bindings: [
            {name: 'inputData', type: 'storage', group: 0, location: 0},
            {name: 'outputData', type: 'storage', group: 0, location: 1},
            {name: 'parameters', type: 'storage', group: 0, location: 2}
          ]
        }
      })
    };
  }

  private createStorageBuffer(
    device: AnimationProps['device'],
    id: string,
    data: Float32Array
  ): Buffer {
    return device.createBuffer({
      id,
      data,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
  }

  private createEmptyStorageBuffer(
    device: AnimationProps['device'],
    id: string,
    elementCount: number
  ): Buffer {
    return device.createBuffer({
      id,
      byteLength: elementCount * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
  }

  private createVisualization(device: AnimationProps['device']): void {
    this.visualizationValues.fill(0);
    this.renderedVisualizationValues.fill(0);
    this.visualizationBuffer = device.createBuffer({
      id: 'debug-visualization-data',
      data: this.renderedVisualizationValues,
      usage: Buffer.VERTEX | Buffer.COPY_DST
    });
    this.visualizationModel = new Model(device, {
      id: 'debug-visualization-model',
      source: VISUALIZATION_SOURCE,
      topology: 'triangle-list',
      vertexCount: 6,
      instanceCount: VISUALIZATION_CELL_COUNT,
      bufferLayout: [
        {
          name: 'visualizationData',
          byteStride: 2 * Float32Array.BYTES_PER_ELEMENT,
          stepMode: 'instance',
          attributes: [{attribute: 'cellData', format: 'float32x2', byteOffset: 0}]
        }
      ],
      attributes: {
        visualizationData: this.visualizationBuffer
      }
    });
  }

  private resetVisualization(upload = true): void {
    this.visualizationWriteIndex = 0;
    this.visualizationSpans = [];
    this.visualizationValues.fill(0);
    if (upload) {
      this.displayedVisualizationValues.set(this.visualizationValues);
      this.displayedVisualizationSpans = [];
      this.writeVisualizationRenderBuffer();
    }
    this.visualizationDirty = false;
  }

  private flushVisualization(): void {
    if (!this.visualizationDirty) {
      return;
    }

    this.displayedVisualizationValues.set(this.visualizationValues);
    this.displayedVisualizationSpans = this.visualizationSpans.slice();
    this.writeVisualizationRenderBuffer();
    this.visualizationDirty = false;
  }

  private writeVisualizationRenderBuffer(): void {
    if (!this.visualizationBuffer) {
      return;
    }

    if (
      this.visualizationZoom === VISUALIZATION_MINIMUM_ZOOM &&
      this.visualizationViewportColumn === 0 &&
      this.visualizationViewportRow === 0
    ) {
      this.renderedVisualizationValues.set(this.displayedVisualizationValues);
      this.visualizationBuffer.write(this.renderedVisualizationValues);
      return;
    }

    for (let screenCellIndex = 0; screenCellIndex < VISUALIZATION_CELL_COUNT; screenCellIndex++) {
      const sourceCellIndex = this.getVisualizationSourceCellIndexForScreenCell(screenCellIndex);
      const sourceValueOffset = sourceCellIndex * 2;
      const renderedValueOffset = screenCellIndex * 2;

      this.renderedVisualizationValues[renderedValueOffset] =
        this.displayedVisualizationValues[sourceValueOffset];
      this.renderedVisualizationValues[renderedValueOffset + 1] =
        this.displayedVisualizationValues[sourceValueOffset + 1];
    }

    this.visualizationBuffer.write(this.renderedVisualizationValues);
  }

  private getVisualizationViewportDimensions(zoom = this.visualizationZoom): {
    columnCount: number;
    rowCount: number;
  } {
    const clampedZoom = this.clampVisualizationZoom(zoom);
    return {
      columnCount: VISUALIZATION_COLUMN_COUNT / clampedZoom,
      rowCount: VISUALIZATION_ROW_COUNT / clampedZoom
    };
  }

  private clampVisualizationZoom(zoom: number): number {
    if (!Number.isFinite(zoom)) {
      return VISUALIZATION_MINIMUM_ZOOM;
    }

    return Math.max(VISUALIZATION_MINIMUM_ZOOM, Math.min(VISUALIZATION_MAXIMUM_ZOOM, zoom));
  }

  private clampVisualizationViewport(
    zoom: number,
    column: number,
    row: number
  ): {zoom: number; column: number; row: number} {
    const clampedZoom = this.clampVisualizationZoom(zoom);
    const {columnCount, rowCount} = this.getVisualizationViewportDimensions(clampedZoom);
    const maximumColumn = Math.max(0, VISUALIZATION_COLUMN_COUNT - columnCount);
    const maximumRow = Math.max(0, VISUALIZATION_ROW_COUNT - rowCount);

    return {
      zoom: clampedZoom,
      column: Math.max(0, Math.min(maximumColumn, Number.isFinite(column) ? column : 0)),
      row: Math.max(0, Math.min(maximumRow, Number.isFinite(row) ? row : 0))
    };
  }

  private setVisualizationViewport(zoom: number, column: number, row: number): void {
    const viewport = this.clampVisualizationViewport(zoom, column, row);
    this.visualizationZoom = viewport.zoom;
    this.visualizationViewportColumn = viewport.column;
    this.visualizationViewportRow = viewport.row;
    this.writeVisualizationRenderBuffer();
  }

  private resetVisualizationViewport(): void {
    this.setVisualizationViewport(VISUALIZATION_MINIMUM_ZOOM, 0, 0);
  }

  private clampGeneratedTokenCount(generatedTokenCount: number): number {
    if (!Number.isFinite(generatedTokenCount)) {
      return DEFAULT_GENERATED_TOKENS;
    }

    return Math.max(1, Math.trunc(generatedTokenCount));
  }

  private getRequestedGeneratedTokenCount(): number {
    const countElement = document.getElementById('gpgpu-token-count') as HTMLInputElement | null;
    if (countElement) {
      return this.clampGeneratedTokenCount(Number(countElement.value || DEFAULT_GENERATED_TOKENS));
    }

    const selectedButtonElement = document.querySelector<HTMLButtonElement>(
      '[data-gpgpu-token-count][aria-pressed="true"]'
    );
    return this.clampGeneratedTokenCount(
      Number(selectedButtonElement?.dataset.gpgpuTokenCount || DEFAULT_GENERATED_TOKENS)
    );
  }

  private clampContextTokenCount(contextTokenCount: number): number {
    if (!Number.isFinite(contextTokenCount)) {
      return DEFAULT_CONTEXT_TOKENS;
    }

    const normalizedContextTokenCount = Math.trunc(contextTokenCount);
    return (
      CONTEXT_TOKEN_OPTIONS.find(option => option === normalizedContextTokenCount) ??
      DEFAULT_CONTEXT_TOKENS
    );
  }

  private getRequestedContextTokenCount(): number {
    const contextElement = document.getElementById(
      'gpgpu-context-token-count'
    ) as HTMLSelectElement | null;
    if (contextElement) {
      return this.clampContextTokenCount(Number(contextElement.value || DEFAULT_CONTEXT_TOKENS));
    }

    const selectedButtonElement = document.querySelector<HTMLButtonElement>(
      '[data-gpgpu-context-token-count][aria-pressed="true"]'
    );
    return this.clampContextTokenCount(
      Number(selectedButtonElement?.dataset.gpgpuContextTokenCount || DEFAULT_CONTEXT_TOKENS)
    );
  }

  private writeGeneratedTokenCountControls(generatedTokenCount: number): void {
    const normalizedGeneratedTokenCount = this.clampGeneratedTokenCount(generatedTokenCount);
    const tokenCountButtonElements = document.querySelectorAll<HTMLButtonElement>(
      '[data-gpgpu-token-count]'
    );

    for (const tokenCountButtonElement of tokenCountButtonElements) {
      const buttonGeneratedTokenCount = this.clampGeneratedTokenCount(
        Number(tokenCountButtonElement.dataset.gpgpuTokenCount || DEFAULT_GENERATED_TOKENS)
      );
      tokenCountButtonElement.setAttribute(
        'aria-pressed',
        String(buttonGeneratedTokenCount === normalizedGeneratedTokenCount)
      );
    }
  }

  private writeContextControls(contextTokenCount: number): void {
    const normalizedContextTokenCount = this.clampContextTokenCount(contextTokenCount);
    const contextElement = document.getElementById(
      'gpgpu-context-token-count'
    ) as HTMLSelectElement | null;
    if (contextElement) {
      contextElement.value = String(normalizedContextTokenCount);
    }

    const contextButtonElements = document.querySelectorAll<HTMLButtonElement>(
      '[data-gpgpu-context-token-count]'
    );
    for (const contextButtonElement of contextButtonElements) {
      const buttonContextTokenCount = this.clampContextTokenCount(
        Number(contextButtonElement.dataset.gpgpuContextTokenCount || DEFAULT_CONTEXT_TOKENS)
      );
      contextButtonElement.setAttribute(
        'aria-pressed',
        String(buttonContextTokenCount === normalizedContextTokenCount)
      );
    }
  }

  private isCanvasVisualizationEnabled(): boolean {
    const canvasElement = document.getElementById(
      'gpgpu-canvas-enabled'
    ) as HTMLInputElement | null;
    return canvasElement?.checked ?? true;
  }

  private isDebugBoxEnabled(): boolean {
    const debugElement = document.getElementById('gpgpu-debug-enabled') as HTMLInputElement | null;
    return debugElement?.checked ?? false;
  }

  private isTensorInspectionEnabled(): boolean {
    return this.isCanvasVisualizationEnabled() || this.isDebugBoxEnabled();
  }

  private clampTemperature(temperature: number): number {
    if (!Number.isFinite(temperature)) {
      return DEFAULT_TEMPERATURE;
    }

    return Math.max(
      MINIMUM_TEMPERATURE,
      Math.min(MAXIMUM_TEMPERATURE, Math.round(temperature * 100) / 100)
    );
  }

  private getRequestedTemperature(): number {
    const temperatureElement = document.getElementById(
      'gpgpu-temperature'
    ) as HTMLInputElement | null;
    return this.clampTemperature(Number(temperatureElement?.value || DEFAULT_TEMPERATURE));
  }

  private writeTemperatureControls(temperature: number): void {
    const temperatureSliderElement = document.getElementById(
      'gpgpu-temperature'
    ) as HTMLInputElement | null;
    const temperatureValueElement = document.getElementById(
      'gpgpu-temperature-value'
    ) as HTMLOutputElement | null;
    const formattedTemperature = this.formatTemperature(temperature);

    if (temperatureSliderElement) {
      temperatureSliderElement.value = formattedTemperature;
    }
    if (temperatureValueElement) {
      temperatureValueElement.value = formattedTemperature;
      temperatureValueElement.textContent = formattedTemperature;
    }
  }

  private writeGenerationControls(isGenerating: boolean): void {
    const buttonElement = document.getElementById('gpgpu-generate') as HTMLButtonElement | null;
    const stopButtonElement = document.getElementById('gpgpu-stop') as HTMLButtonElement | null;

    if (buttonElement) {
      buttonElement.disabled = isGenerating;
    }
    if (stopButtonElement) {
      stopButtonElement.disabled = !isGenerating;
    }
  }

  private setupVisualizationHover(): void {
    if (this.isFinalized) {
      return;
    }

    const canvasElement = document.querySelector<HTMLCanvasElement>('canvas');
    if (!canvasElement) {
      if (this.visualizationHoverSetupTimeout === null) {
        this.visualizationHoverSetupTimeout = window.setTimeout(() => {
          this.visualizationHoverSetupTimeout = null;
          this.setupVisualizationHover();
        }, 100);
      }
      return;
    }

    if (this.visualizationHoverCanvas === canvasElement) {
      return;
    }

    this.teardownVisualizationHover();
    this.visualizationHoverCanvas = canvasElement;
    this.visualizationHoverTooltip = this.getOrCreateVisualizationHoverTooltip();
    this.visualizationHoverCanvasCursor = canvasElement.style.cursor;
    this.visualizationHoverCanvasTouchAction = canvasElement.style.touchAction;
    canvasElement.style.cursor = 'grab';
    canvasElement.style.touchAction = 'none';
    const visualizationHoverEventHandlers: VisualizationHoverEventHandlers = {
      mousemove: event => this.writeVisualizationHover(event, canvasElement),
      wheel: event => this.zoomVisualizationWithWheel(event, canvasElement),
      pointerdown: event => this.beginVisualizationDrag(event, canvasElement),
      pointermove: event => this.updateVisualizationDrag(event, canvasElement),
      pointerup: event => this.endVisualizationDrag(event),
      pointercancel: event => this.endVisualizationDrag(event),
      dblclick: event => {
        event.preventDefault();
        this.resetVisualizationViewport();
        this.writeVisualizationHover(event, canvasElement);
      },
      mouseleave: () => {
        if (!this.visualizationDragState) {
          this.clearVisualizationHover();
        }
      }
    };
    this.visualizationHoverEventHandlers = visualizationHoverEventHandlers;
    canvasElement.addEventListener('mousemove', visualizationHoverEventHandlers.mousemove);
    canvasElement.addEventListener('wheel', visualizationHoverEventHandlers.wheel, {
      passive: false
    });
    canvasElement.addEventListener('pointerdown', visualizationHoverEventHandlers.pointerdown);
    canvasElement.addEventListener('pointermove', visualizationHoverEventHandlers.pointermove);
    canvasElement.addEventListener('pointerup', visualizationHoverEventHandlers.pointerup);
    canvasElement.addEventListener('pointercancel', visualizationHoverEventHandlers.pointercancel);
    canvasElement.addEventListener('dblclick', visualizationHoverEventHandlers.dblclick);
    canvasElement.addEventListener('mouseleave', visualizationHoverEventHandlers.mouseleave);
    this.clearVisualizationHover();
  }

  private teardownVisualizationHover(): void {
    if (this.visualizationHoverSetupTimeout !== null) {
      window.clearTimeout(this.visualizationHoverSetupTimeout);
      this.visualizationHoverSetupTimeout = null;
    }

    const canvasElement = this.visualizationHoverCanvas;
    const visualizationHoverEventHandlers = this.visualizationHoverEventHandlers;
    if (canvasElement && visualizationHoverEventHandlers) {
      canvasElement.removeEventListener('mousemove', visualizationHoverEventHandlers.mousemove);
      canvasElement.removeEventListener('wheel', visualizationHoverEventHandlers.wheel);
      canvasElement.removeEventListener('pointerdown', visualizationHoverEventHandlers.pointerdown);
      canvasElement.removeEventListener('pointermove', visualizationHoverEventHandlers.pointermove);
      canvasElement.removeEventListener('pointerup', visualizationHoverEventHandlers.pointerup);
      canvasElement.removeEventListener(
        'pointercancel',
        visualizationHoverEventHandlers.pointercancel
      );
      canvasElement.removeEventListener('dblclick', visualizationHoverEventHandlers.dblclick);
      canvasElement.removeEventListener('mouseleave', visualizationHoverEventHandlers.mouseleave);
    }

    if (
      canvasElement &&
      this.visualizationDragState &&
      canvasElement.hasPointerCapture(this.visualizationDragState.pointerId)
    ) {
      canvasElement.releasePointerCapture(this.visualizationDragState.pointerId);
    }
    if (canvasElement) {
      canvasElement.style.cursor = this.visualizationHoverCanvasCursor;
      canvasElement.style.touchAction = this.visualizationHoverCanvasTouchAction;
    }

    this.visualizationDragState = null;
    this.visualizationHoverCanvas = null;
    this.visualizationHoverEventHandlers = null;
    this.visualizationHoverCanvasCursor = '';
    this.visualizationHoverCanvasTouchAction = '';
    this.visualizationHoverTooltip?.remove();
    this.visualizationHoverTooltip = null;
  }

  private beginVisualizationDrag(event: PointerEvent, canvasElement: HTMLCanvasElement): void {
    if (event.button !== 0) {
      return;
    }

    const screenLocation = this.getVisualizationScreenLocation(event, canvasElement);
    if (!screenLocation) {
      return;
    }

    const {columnCount, rowCount} = this.getVisualizationViewportDimensions();
    this.visualizationDragState = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startViewportColumn: this.visualizationViewportColumn,
      startViewportRow: this.visualizationViewportRow,
      startViewportColumnCount: columnCount,
      startViewportRowCount: rowCount
    };
    canvasElement.setPointerCapture(event.pointerId);
    canvasElement.style.cursor = 'grabbing';
    event.preventDefault();
  }

  private updateVisualizationDrag(event: PointerEvent, canvasElement: HTMLCanvasElement): void {
    const dragState = this.visualizationDragState;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const boundingRectangle = canvasElement.getBoundingClientRect();
    const horizontalDelta = event.clientX - dragState.startClientX;
    const verticalDelta = event.clientY - dragState.startClientY;
    const horizontalPanColumns =
      boundingRectangle.width > 0
        ? (-horizontalDelta / boundingRectangle.width) * dragState.startViewportColumnCount
        : 0;
    const verticalPanRows =
      boundingRectangle.height > 0
        ? (-verticalDelta / boundingRectangle.height) * dragState.startViewportRowCount
        : 0;

    this.setVisualizationViewport(
      this.visualizationZoom,
      dragState.startViewportColumn + horizontalPanColumns,
      dragState.startViewportRow + verticalPanRows
    );
    this.writeVisualizationHover(event, canvasElement);
    event.preventDefault();
  }

  private endVisualizationDrag(event: PointerEvent): void {
    const dragState = this.visualizationDragState;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    this.visualizationDragState = null;
    if (this.visualizationHoverCanvas?.hasPointerCapture(event.pointerId)) {
      this.visualizationHoverCanvas.releasePointerCapture(event.pointerId);
    }
    if (this.visualizationHoverCanvas) {
      this.visualizationHoverCanvas.style.cursor = 'grab';
    }
  }

  private zoomVisualizationWithWheel(event: WheelEvent, canvasElement: HTMLCanvasElement): void {
    const screenLocation = this.getVisualizationScreenLocation(event, canvasElement);
    if (!screenLocation) {
      return;
    }

    const {columnCount, rowCount} = this.getVisualizationViewportDimensions();
    const anchorColumn = this.visualizationViewportColumn + screenLocation.fractionX * columnCount;
    const anchorRow = this.visualizationViewportRow + screenLocation.fractionY * rowCount;
    const zoom = this.clampVisualizationZoom(
      this.visualizationZoom * 2 ** (-event.deltaY / VISUALIZATION_WHEEL_DELTA_PER_ZOOM_DOUBLING)
    );
    const nextViewportDimensions = this.getVisualizationViewportDimensions(zoom);

    this.setVisualizationViewport(
      zoom,
      anchorColumn - screenLocation.fractionX * nextViewportDimensions.columnCount,
      anchorRow - screenLocation.fractionY * nextViewportDimensions.rowCount
    );
    this.writeVisualizationHover(event, canvasElement);
    event.preventDefault();
  }

  private writeVisualizationHover(event: MouseEvent, canvasElement: HTMLCanvasElement): void {
    const cellIndex = this.getVisualizationCellIndex(event, canvasElement);
    if (cellIndex === null) {
      this.writeVisualizationHoverReadout('Canvas hover: outside tensor atlas.', event);
      return;
    }

    const spanMatch = this.getVisualizationSpanAtCell(cellIndex);
    const valueOffset = cellIndex * 2;
    const intensity = this.displayedVisualizationValues[valueOffset];
    const state = this.displayedVisualizationValues[valueOffset + 1];
    const valueState = this.formatVisualizationState(state);

    if (!spanMatch) {
      this.writeVisualizationHoverReadout(
        [
          'Canvas hover inspector',
          'Region: separator / unused atlas space',
          'What this means: blank space between tensor spans, or empty space after the visible tensors.',
          `Value color: ${valueState}.`
        ].join('\n'),
        event
      );
      return;
    }

    const sourceIndex = this.getVisualizationSourceIndex(spanMatch.span, spanMatch.cellOffset);
    const sourceRange = this.getVisualizationSourceRange(spanMatch.span, spanMatch.cellOffset);
    const tokenHoverText = this.formatVisualizationTokenHover(spanMatch.span, sourceRange);
    this.writeVisualizationHoverReadout(
      [
        'Canvas hover inspector',
        `Tensor span: ${spanMatch.span.label}`,
        `What this tensor is: ${this.describeVisualizationTensor(spanMatch.span.label)}`,
        `Atlas span: cells ${spanMatch.span.startCell}-${spanMatch.span.endCell}; this is where that tensor was packed into the dense canvas.`,
        `Sampled value: source value ${sourceIndex} of ${Math.max(0, spanMatch.span.sourceValueCount - 1)}${this.formatVisualizationSourceRange(sourceRange)}.`,
        tokenHoverText,
        `Value color: ${valueState}; brightness ${intensity.toFixed(3)} shows relative magnitude within this tensor.`
      ]
        .filter(Boolean)
        .join('\n'),
      event
    );
  }

  private clearVisualizationHover(): void {
    this.writeVisualizationHoverReadout(
      'Canvas hover: move over the atlas after a run to inspect the tensor span under the mouse. Scroll to zoom, drag to pan, double-click resets.'
    );
    this.hideVisualizationHoverTooltip();
  }

  private writeVisualizationHoverReadout(message: string, event?: MouseEvent): void {
    const readoutElement = document.getElementById('gpgpu-canvas-hover-readout');
    if (readoutElement) {
      readoutElement.style.whiteSpace = 'pre-wrap';
      readoutElement.textContent = message;
    }

    if (event) {
      this.showVisualizationHoverTooltip(message, event);
    }
  }

  private getOrCreateVisualizationHoverTooltip(): HTMLDivElement {
    const existingTooltip = document.getElementById(
      'gpgpu-canvas-hover-tooltip'
    ) as HTMLDivElement | null;
    if (existingTooltip) {
      return existingTooltip;
    }

    const tooltipElement = document.createElement('div');
    tooltipElement.id = 'gpgpu-canvas-hover-tooltip';
    tooltipElement.style.position = 'fixed';
    tooltipElement.style.zIndex = '9999';
    tooltipElement.style.display = 'none';
    tooltipElement.style.pointerEvents = 'none';
    tooltipElement.style.maxWidth = '520px';
    tooltipElement.style.padding = '6px 8px';
    tooltipElement.style.border = '1px solid rgba(255, 255, 255, 0.35)';
    tooltipElement.style.borderRadius = '4px';
    tooltipElement.style.background = 'rgba(5, 7, 12, 0.92)';
    tooltipElement.style.color = '#f9fafb';
    tooltipElement.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.35)';
    tooltipElement.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace';
    tooltipElement.style.fontSize = '11px';
    tooltipElement.style.lineHeight = '1.35';
    tooltipElement.style.whiteSpace = 'pre-wrap';
    document.body.appendChild(tooltipElement);

    return tooltipElement;
  }

  private showVisualizationHoverTooltip(message: string, event: MouseEvent): void {
    const tooltipElement =
      this.visualizationHoverTooltip || this.getOrCreateVisualizationHoverTooltip();
    this.visualizationHoverTooltip = tooltipElement;
    tooltipElement.textContent = message;
    tooltipElement.style.display = 'block';

    const horizontalPadding = 16;
    const verticalPadding = 16;
    const maximumLeft = Math.max(
      horizontalPadding,
      window.innerWidth - tooltipElement.offsetWidth - horizontalPadding
    );
    const maximumTop = Math.max(
      verticalPadding,
      window.innerHeight - tooltipElement.offsetHeight - verticalPadding
    );
    const left = Math.min(maximumLeft, Math.max(horizontalPadding, event.clientX + 14));
    const top = Math.min(maximumTop, Math.max(verticalPadding, event.clientY + 14));
    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.top = `${top}px`;
  }

  private hideVisualizationHoverTooltip(): void {
    if (this.visualizationHoverTooltip) {
      this.visualizationHoverTooltip.style.display = 'none';
    }
  }

  private getVisualizationCellIndex(
    event: MouseEvent,
    canvasElement: HTMLCanvasElement
  ): number | null {
    const screenLocation = this.getVisualizationScreenLocation(event, canvasElement);
    if (!screenLocation) {
      return null;
    }

    const screenCellIndex =
      screenLocation.rowIndex * VISUALIZATION_COLUMN_COUNT + screenLocation.columnIndex;
    return this.getVisualizationSourceCellIndexForScreenCell(screenCellIndex);
  }

  private getVisualizationScreenLocation(
    event: MouseEvent,
    canvasElement: HTMLCanvasElement
  ): {
    columnIndex: number;
    rowIndex: number;
    fractionX: number;
    fractionY: number;
  } | null {
    const boundingRectangle = canvasElement.getBoundingClientRect();
    if (boundingRectangle.width <= 0 || boundingRectangle.height <= 0) {
      return null;
    }

    const normalizedX = (event.clientX - boundingRectangle.left) / boundingRectangle.width;
    const normalizedY = (event.clientY - boundingRectangle.top) / boundingRectangle.height;
    const atlasX = (normalizedX - 0.035) / 0.93;
    const atlasY = (normalizedY - 0.07) / 0.86;

    if (atlasX < 0 || atlasX >= 1 || atlasY < 0 || atlasY >= 1) {
      return null;
    }

    const columnIndex = Math.min(
      VISUALIZATION_COLUMN_COUNT - 1,
      Math.max(0, Math.floor(atlasX * VISUALIZATION_COLUMN_COUNT))
    );
    const rowIndex = Math.min(
      VISUALIZATION_ROW_COUNT - 1,
      Math.max(0, Math.floor(atlasY * VISUALIZATION_ROW_COUNT))
    );

    return {
      columnIndex,
      rowIndex,
      fractionX: Math.max(0, Math.min(1, atlasX)),
      fractionY: Math.max(0, Math.min(1, atlasY))
    };
  }

  private getVisualizationSourceCellIndexForScreenCell(screenCellIndex: number): number {
    const screenColumnIndex = screenCellIndex % VISUALIZATION_COLUMN_COUNT;
    const screenRowIndex = Math.floor(screenCellIndex / VISUALIZATION_COLUMN_COUNT);
    const {columnCount, rowCount} = this.getVisualizationViewportDimensions();
    const sourceColumnIndex = Math.min(
      VISUALIZATION_COLUMN_COUNT - 1,
      Math.max(
        0,
        Math.floor(
          this.visualizationViewportColumn +
            ((screenColumnIndex + 0.5) * columnCount) / VISUALIZATION_COLUMN_COUNT
        )
      )
    );
    const sourceRowIndex = Math.min(
      VISUALIZATION_ROW_COUNT - 1,
      Math.max(
        0,
        Math.floor(
          this.visualizationViewportRow +
            ((screenRowIndex + 0.5) * rowCount) / VISUALIZATION_ROW_COUNT
        )
      )
    );

    return sourceRowIndex * VISUALIZATION_COLUMN_COUNT + sourceColumnIndex;
  }

  private getVisualizationSpanAtCell(
    cellIndex: number
  ): {span: VisualizationSpan; cellOffset: number} | null {
    for (const span of this.displayedVisualizationSpans) {
      if (!this.isCellInVisualizationSpan(cellIndex, span)) {
        continue;
      }

      return {
        span,
        cellOffset: this.getVisualizationCellOffset(cellIndex, span)
      };
    }

    return null;
  }

  private isCellInVisualizationSpan(cellIndex: number, span: VisualizationSpan): boolean {
    if (span.startCell <= span.endCell) {
      return cellIndex >= span.startCell && cellIndex <= span.endCell;
    }

    return cellIndex >= span.startCell || cellIndex <= span.endCell;
  }

  private getVisualizationCellOffset(cellIndex: number, span: VisualizationSpan): number {
    if (cellIndex >= span.startCell) {
      return cellIndex - span.startCell;
    }

    return VISUALIZATION_CELL_COUNT - span.startCell + cellIndex;
  }

  private getVisualizationSourceIndex(span: VisualizationSpan, cellOffset: number): number {
    if (span.writtenCellCount <= 1 || span.sourceValueCount <= 1) {
      return 0;
    }

    if (span.writtenCellCount === span.sourceValueCount) {
      return cellOffset;
    }

    return Math.floor((cellOffset * (span.sourceValueCount - 1)) / (span.writtenCellCount - 1));
  }

  private getVisualizationSourceRange(
    span: VisualizationSpan,
    cellOffset: number
  ): VisualizationSourceRange {
    const sourceIndex = this.getVisualizationSourceIndex(span, cellOffset);
    if (span.writtenCellCount <= 1 || span.sourceValueCount <= 1) {
      return {start: sourceIndex, end: sourceIndex};
    }
    if (span.writtenCellCount === span.sourceValueCount) {
      return {start: sourceIndex, end: sourceIndex};
    }

    const previousSourceIndex =
      cellOffset > 0 ? this.getVisualizationSourceIndex(span, cellOffset - 1) : 0;
    const nextSourceIndex =
      cellOffset < span.writtenCellCount - 1
        ? this.getVisualizationSourceIndex(span, cellOffset + 1)
        : span.sourceValueCount - 1;

    return {
      start: Math.max(0, Math.floor((previousSourceIndex + sourceIndex) / 2)),
      end: Math.min(span.sourceValueCount - 1, Math.ceil((sourceIndex + nextSourceIndex) / 2))
    };
  }

  private formatVisualizationSourceRange(sourceRange: VisualizationSourceRange): string {
    if (sourceRange.start === sourceRange.end) {
      return '';
    }

    return `; this pixel stands in for approximately source values ${sourceRange.start}-${sourceRange.end}`;
  }

  private formatVisualizationTokenHover(
    span: VisualizationSpan,
    sourceRange: VisualizationSourceRange
  ): string | null {
    if (!this.model) {
      return null;
    }

    const tokenizer = this.model.tokenizer;
    if (span.contextTokens && span.sourceColumnCount && span.contextStartPosition !== null) {
      const firstContextTokenIndex = Math.max(
        0,
        Math.floor(sourceRange.start / span.sourceColumnCount)
      );
      const lastContextTokenIndex = Math.min(
        span.contextTokens.length - 1,
        Math.floor(sourceRange.end / span.sourceColumnCount)
      );
      if (
        firstContextTokenIndex >= 0 &&
        firstContextTokenIndex < span.contextTokens.length &&
        lastContextTokenIndex >= firstContextTokenIndex
      ) {
        const tokenSummaries: string[] = [];
        for (
          let contextTokenIndex = firstContextTokenIndex;
          contextTokenIndex <= lastContextTokenIndex && tokenSummaries.length < 2;
          contextTokenIndex++
        ) {
          tokenSummaries.push(this.formatContextTokenSummary(span, contextTokenIndex));
        }
        const hiddenTokenCount =
          lastContextTokenIndex - firstContextTokenIndex + 1 - tokenSummaries.length;
        const tokenLabel = tokenSummaries.length === 1 ? 'Token' : 'Tokens';
        const suffix = hiddenTokenCount > 0 ? `, plus ${hiddenTokenCount} more token(s)` : '';
        return `${tokenLabel}: ${tokenSummaries.join(' and ')}${suffix}. ${this.formatVisualizationValueColumns(span, sourceRange)}.`;
      }
    }

    if (span.label === 'final.logits' && sourceRange.start < tokenizer.vocabularySize) {
      const firstToken = Math.max(0, sourceRange.start);
      const lastToken = Math.min(tokenizer.vocabularySize - 1, sourceRange.end);
      const tokenSummaries: string[] = [];
      for (let token = firstToken; token <= lastToken && tokenSummaries.length < 2; token++) {
        const tokenText = this.escapeTokenText(tokenizer.tokenTable[token] || '');
        tokenSummaries.push(`${token} "${tokenText}"`);
      }
      const hiddenTokenCount = lastToken - firstToken + 1 - tokenSummaries.length;
      const tokenLabel = tokenSummaries.length === 1 ? 'Vocabulary token' : 'Vocabulary tokens';
      const suffix = hiddenTokenCount > 0 ? `, plus ${hiddenTokenCount} more token(s)` : '';
      return `${tokenLabel}: ${tokenSummaries.join(' and ')}${suffix}.`;
    }

    return null;
  }

  private formatContextTokenSummary(span: VisualizationSpan, contextTokenIndex: number): string {
    if (!this.model || !span.contextTokens || span.contextStartPosition === null) {
      return '';
    }

    const token = span.contextTokens[contextTokenIndex];
    const tokenText = this.escapeTokenText(this.model.tokenizer.tokenTable[token] || '');
    return `context #${contextTokenIndex}, position ${span.contextStartPosition + contextTokenIndex}, token ${token} "${tokenText}"`;
  }

  private formatVisualizationValueColumns(
    span: VisualizationSpan,
    sourceRange: VisualizationSourceRange
  ): string {
    if (!span.sourceColumnCount) {
      return '';
    }

    const firstTokenIndex = Math.floor(sourceRange.start / span.sourceColumnCount);
    const lastTokenIndex = Math.floor(sourceRange.end / span.sourceColumnCount);
    const sourceColumnStart = sourceRange.start % span.sourceColumnCount;
    const sourceColumnEnd = sourceRange.end % span.sourceColumnCount;
    if (firstTokenIndex === lastTokenIndex) {
      const columnRange =
        sourceColumnStart === sourceColumnEnd
          ? `${sourceColumnStart}`
          : `${sourceColumnStart}-${sourceColumnEnd}`;
      return `Value column: ${columnRange} of ${span.sourceColumnCount - 1}`;
    }

    return `Value columns: ${sourceColumnStart} of token ${firstTokenIndex} through ${sourceColumnEnd} of token ${lastTokenIndex}`;
  }

  private describeVisualizationTensor(label: string): string {
    if (label === 'cpu.tokenEmbeddings.context') {
      return 'learned token embedding vectors for the prompt/context tokens before they enter the transformer.';
    }
    if (label === 'cpu.positionEmbeddings.context') {
      return 'learned position embedding vectors added to token embeddings so the model knows token order.';
    }
    if (label === 'cpu.initialResidual.token+position-embeddings') {
      return 'the initial residual stream after adding token embeddings and position embeddings.';
    }
    if (label === 'gpu.residualA.afterUpload') {
      return 'the initial residual stream after it has been uploaded into the WebGPU storage buffer.';
    }
    if (label === 'final.layerNorm') {
      return 'the final normalized residual stream before the vocabulary projection.';
    }
    if (label === 'final.logits') {
      return 'one score per vocabulary token; higher logits are more likely to be sampled next.';
    }
    if (/^layer\d+\.ln[12](\.weight|\.bias)?$/.test(label)) {
      return label.endsWith('.weight') || label.endsWith('.bias')
        ? 'learned layer-norm parameter values from the checkpoint.'
        : 'layer-normalized activations inside this transformer block.';
    }
    if (/^layer\d+\.qkv(\.weight|\.bias)?$/.test(label)) {
      return label.endsWith('.weight') || label.endsWith('.bias')
        ? 'learned query/key/value projection parameters for attention.'
        : 'query, key, and value activations produced for causal self-attention.';
    }
    if (/^layer\d+\.attentionProjection(\.weight|\.bias)?$/.test(label)) {
      return label.endsWith('.weight') || label.endsWith('.bias')
        ? 'learned output projection parameters after attention.'
        : 'attention output after projecting heads back into the residual width.';
    }
    if (/^layer\d+\.attention$/.test(label)) {
      return 'causal self-attention output, where each token attends only to earlier context tokens and itself.';
    }
    if (/^layer\d+\.residual[23]$/.test(label)) {
      return 'the residual stream after adding a block output back into the running token representation.';
    }
    if (/^layer\d+\.feedForward(\.weight|\.bias)?$/.test(label)) {
      return label.endsWith('.weight') || label.endsWith('.bias')
        ? 'learned first MLP projection parameters that expand the channel width.'
        : 'MLP hidden activations after the first feed-forward projection.';
    }
    if (/^layer\d+\.gelu$/.test(label)) {
      return 'MLP hidden activations after the GELU nonlinearity.';
    }
    if (/^layer\d+\.feedForwardProjection(\.weight|\.bias)?$/.test(label)) {
      return label.endsWith('.weight') || label.endsWith('.bias')
        ? 'learned second MLP projection parameters that shrink the hidden state back to residual width.'
        : 'MLP output projected back to the residual width.';
    }
    if (label.includes('.weight') || label.includes('.bias')) {
      return 'learned checkpoint parameter values sampled into the atlas.';
    }

    return 'sampled tensor values from the current WebGPU forward pass.';
  }

  private formatVisualizationState(state: number): string {
    if (state > 2.5) {
      return 'NaN/Inf';
    }
    if (state > 1.5) {
      return 'negative';
    }
    if (state > 0.5) {
      return 'positive';
    }
    if (state > 0) {
      return 'zero';
    }
    return 'empty';
  }

  private setupGenerateButton(): void {
    const buttonElement = document.getElementById('gpgpu-generate') as HTMLButtonElement | null;
    const stopButtonElement = document.getElementById('gpgpu-stop') as HTMLButtonElement | null;
    const promptElement = document.getElementById('gpgpu-prompt') as HTMLInputElement | null;
    const contextElement = document.getElementById(
      'gpgpu-context-token-count'
    ) as HTMLSelectElement | null;
    const canvasElement = document.getElementById(
      'gpgpu-canvas-enabled'
    ) as HTMLInputElement | null;
    const debugElement = document.getElementById('gpgpu-debug-enabled') as HTMLInputElement | null;
    const outputElement = document.getElementById('gpgpu-output');
    const temperatureSliderElement = document.getElementById(
      'gpgpu-temperature'
    ) as HTMLInputElement | null;
    if (!buttonElement) {
      return;
    }

    const updateSummary = () => {
      if (this.model) {
        this.writeModelSummary(this.model);
      }
    };
    this.writeTemperatureControls(this.getRequestedTemperature());
    this.writeGeneratedTokenCountControls(this.getRequestedGeneratedTokenCount());
    this.writeContextControls(this.getRequestedContextTokenCount());

    this.writeGenerationControls(false);
    buttonElement.onclick = () => {
      this.generateText().catch(error => {
        this.writeOutput(this.formatError(error));
        this.writeGenerationControls(false);
      });
    };
    if (stopButtonElement) {
      stopButtonElement.onclick = () => {
        this.generationAbortController?.abort();
        stopButtonElement.disabled = true;
        this.appendDebugLine('Stop requested; waiting for the current WebGPU pass to finish.');
        this.writeDebugOutputIfEnabled();
      };
    }
    outputElement?.addEventListener('click', event => {
      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) {
        return;
      }

      const logitButtonElement = eventTarget.closest<HTMLButtonElement>(
        'button[data-gpgpu-logit-step][data-gpgpu-logit-token]'
      );
      if (logitButtonElement) {
        const generationLogitsStepIndex = Number(logitButtonElement.dataset.gpgpuLogitStep);
        const token = Number(logitButtonElement.dataset.gpgpuLogitToken);
        this.selectGenerationLogitsStep(generationLogitsStepIndex);
        this.writePromptFromLogitChoice(generationLogitsStepIndex, token);
        return;
      }

      const completionButtonElement = eventTarget.closest<HTMLButtonElement>(
        'button[data-gpgpu-completion-step]'
      );
      if (completionButtonElement) {
        const generationLogitsStepIndex = Number(
          completionButtonElement.dataset.gpgpuCompletionStep
        );
        this.selectGenerationLogitsStep(generationLogitsStepIndex);
        this.writePromptFromCompletion(generationLogitsStepIndex);
        return;
      }

      const tokenButtonElement = eventTarget.closest<HTMLButtonElement>(
        'button[data-gpgpu-generation-step]'
      );
      if (!tokenButtonElement) {
        return;
      }

      const generationLogitsStepIndex = Number(tokenButtonElement.dataset.gpgpuGenerationStep);
      this.selectGenerationLogitsStep(generationLogitsStepIndex);
    });
    promptElement?.addEventListener('input', updateSummary);
    contextElement?.addEventListener('change', () => {
      this.writeContextControls(this.getRequestedContextTokenCount());
      updateSummary();
    });
    canvasElement?.addEventListener('change', () => {
      if (!this.isCanvasVisualizationEnabled()) {
        this.resetVisualization();
      }
      updateSummary();
    });
    debugElement?.addEventListener('change', () => {
      this.synchronizeDebugBox();
      updateSummary();
    });
    temperatureSliderElement?.addEventListener('input', () => {
      const temperature = this.clampTemperature(
        Number(temperatureSliderElement.value || DEFAULT_TEMPERATURE)
      );
      this.writeTemperatureControls(temperature);
      updateSummary();
    });

    const tokenCountButtonElements = document.querySelectorAll<HTMLButtonElement>(
      '[data-gpgpu-token-count]'
    );
    for (const tokenCountButtonElement of tokenCountButtonElements) {
      tokenCountButtonElement.onclick = () => {
        const generatedTokenCount = this.clampGeneratedTokenCount(
          Number(tokenCountButtonElement.dataset.gpgpuTokenCount || DEFAULT_GENERATED_TOKENS)
        );
        this.writeGeneratedTokenCountControls(generatedTokenCount);
        updateSummary();
      };
    }

    const contextButtonElements = document.querySelectorAll<HTMLButtonElement>(
      '[data-gpgpu-context-token-count]'
    );
    for (const contextButtonElement of contextButtonElements) {
      contextButtonElement.onclick = () => {
        const contextTokenCount = this.clampContextTokenCount(
          Number(contextButtonElement.dataset.gpgpuContextTokenCount || DEFAULT_CONTEXT_TOKENS)
        );
        this.writeContextControls(contextTokenCount);
        updateSummary();
      };
    }
  }

  private setupWorkspaceTabs(): void {
    const tabButtonElements =
      document.querySelectorAll<HTMLButtonElement>('[data-gpgpu-tab-target]');

    for (const tabButtonElement of tabButtonElements) {
      tabButtonElement.onclick = () => {
        const tabTarget = tabButtonElement.dataset.gpgpuTabTarget;
        if (tabTarget) {
          this.activateWorkspaceTab(tabTarget);
        }
      };
    }
  }

  private activateWorkspaceTab(tabTarget: string): void {
    const tabButtonElements =
      document.querySelectorAll<HTMLButtonElement>('[data-gpgpu-tab-target]');
    const tabPanelElements = document.querySelectorAll<HTMLElement>('[data-gpgpu-tab-panel]');

    for (const tabButtonElement of tabButtonElements) {
      const isActive = tabButtonElement.dataset.gpgpuTabTarget === tabTarget;
      tabButtonElement.setAttribute('aria-selected', String(isActive));
    }

    for (const tabPanelElement of tabPanelElements) {
      const isActive = tabPanelElement.dataset.gpgpuTabPanel === tabTarget;
      tabPanelElement.dataset.active = String(isActive);
    }
  }

  private async generateText(): Promise<void> {
    if (!this.device || !this.model || !this.tensors || !this.kernels) {
      return;
    }

    this.generationAbortController?.abort();
    this.generationAbortController = new AbortController();
    const signal = this.generationAbortController.signal;
    this.writeGenerationControls(true);
    const promptElement = document.getElementById('gpgpu-prompt') as HTMLInputElement | null;
    const prompt = promptElement?.value || DEFAULT_PROMPT;
    const maximumGeneratedTokenCount = this.getRequestedGeneratedTokenCount();
    const contextTokenCount = this.getRequestedContextTokenCount();
    const temperature = this.getRequestedTemperature();
    const canvasVisualizationEnabled = this.isCanvasVisualizationEnabled();
    const debugBoxEnabled = this.isDebugBoxEnabled();
    const tensorInspectionEnabled = this.isTensorInspectionEnabled();
    const promptTokens = this.encodePrompt(prompt, this.model.tokenizer);
    const endOfTextToken = this.model.tokenizer.endOfTextToken;
    const tokens = promptTokens.slice();
    this.generationLogitsSteps = [];
    this.selectedGenerationLogitsStepIndex = null;
    const generatedTokenTexts: string[] = [];
    let lastTopTokens: TopToken[] = [];
    let lastRawTopTokens: TopToken[] = [];
    let lastSelectedToken: TopToken | null = null;
    this.resetDebugLog('Generation', false);
    this.appendDebugLine(`Prompt: ${JSON.stringify(prompt)}`);
    this.appendDebugLine(
      this.formatTokenization('Prompt tokenization', promptTokens, this.model.tokenizer)
    );
    this.appendDebugLine(
      this.formatTokenization(
        'Initial context tokens',
        tokens.slice(-contextTokenCount),
        this.model.tokenizer
      )
    );
    this.appendDebugLine(`Max new tokens: ${maximumGeneratedTokenCount}`);
    this.appendDebugLine(`Context window: ${contextTokenCount}`);
    this.appendDebugLine(`Temperature: ${this.formatTemperature(temperature)}`);
    this.appendDebugLine(
      'Max new token count has no hard UI maximum; generation stops early on <|endoftext|> or Stop.'
    );

    this.writeOutput(
      [
        this.formatTokenization('Prompt tokenization', promptTokens, this.model.tokenizer),
        '',
        `Using up to the last ${contextTokenCount} token(s) as context.`,
        `GPU buffers support up to ${MAX_CONTEXT_TOKENS} context tokens.`,
        `Temperature: ${this.formatTemperature(temperature)}${this.formatSamplingMode(temperature)}`,
        `Canvas tensor visualization: ${canvasVisualizationEnabled ? 'enabled' : 'disabled'}`,
        `Canvas atlas: ${VISUALIZATION_COLUMN_COUNT} x ${VISUALIZATION_ROW_COUNT} cells`,
        `Debug Trace: ${debugBoxEnabled ? 'enabled' : 'disabled'}`,
        `Tensor stats readbacks: ${tensorInspectionEnabled ? 'enabled' : 'disabled'}`,
        'Max new token count has no hard UI maximum. Generation stops early on <|endoftext|> or Stop.',
        `Generating up to ${maximumGeneratedTokenCount} token(s)...`
      ].join('\n')
    );
    const startedAt = performance.now();
    let completedGeneratedTokenCount = 0;
    let stoppedOnEndOfText = false;

    try {
      for (let generatedIndex = 0; generatedIndex < maximumGeneratedTokenCount; generatedIndex++) {
        if (signal.aborted) {
          this.writeGenerationStopped(
            prompt,
            promptTokens,
            tokens,
            completedGeneratedTokenCount,
            maximumGeneratedTokenCount,
            performance.now() - startedAt,
            contextTokenCount,
            temperature,
            lastTopTokens,
            lastSelectedToken,
            lastRawTopTokens
          );
          return;
        }

        const contextTokens = tokens.slice(-contextTokenCount);
        const contextStartPosition = this.getContextStartPosition(
          tokens.length,
          contextTokens.length,
          this.model
        );
        const {topTokens, rawTopTokens, selectedToken, elapsedMilliseconds} =
          await this.runNextToken(
            contextTokens,
            contextStartPosition,
            generatedIndex + 1,
            temperature
          );
        if (signal.aborted) {
          this.writeGenerationStopped(
            prompt,
            promptTokens,
            tokens,
            completedGeneratedTokenCount,
            maximumGeneratedTokenCount,
            performance.now() - startedAt,
            contextTokenCount,
            temperature,
            lastTopTokens,
            lastSelectedToken,
            lastRawTopTokens
          );
          return;
        }

        lastTopTokens = topTokens;
        lastRawTopTokens = rawTopTokens;
        lastSelectedToken = selectedToken;
        const completionPrefixText = prompt + generatedTokenTexts.join('');
        const completionText = completionPrefixText + selectedToken.text;
        this.generationLogitsSteps.push({
          generatedIndex,
          completionPrefixText,
          completionText,
          contextStartPosition,
          contextTokens,
          topTokens,
          rawTopTokens,
          selectedToken,
          elapsedMilliseconds,
          temperature
        });
        this.selectedGenerationLogitsStepIndex = generatedIndex;
        generatedTokenTexts.push(selectedToken.text);
        tokens.push(selectedToken.token);
        completedGeneratedTokenCount++;
        this.writeGenerationProgress(
          prompt,
          promptTokens,
          tokens,
          topTokens,
          selectedToken,
          completedGeneratedTokenCount,
          maximumGeneratedTokenCount,
          contextTokenCount,
          temperature,
          elapsedMilliseconds
        );
        if (selectedToken.token === endOfTextToken) {
          stoppedOnEndOfText = true;
          this.appendDebugLine(
            `Stopped on <|endoftext|> after ${completedGeneratedTokenCount} token(s).`
          );
          break;
        }
        await new Promise(resolve => window.setTimeout(resolve, 0));
      }

      const elapsedMilliseconds = performance.now() - startedAt;
      const generationStatus = stoppedOnEndOfText
        ? `Stopped on <|endoftext|> after ${completedGeneratedTokenCount} token(s) in ${elapsedMilliseconds.toFixed(1)} ms (max ${maximumGeneratedTokenCount}).`
        : `Generated ${completedGeneratedTokenCount} token(s) in ${elapsedMilliseconds.toFixed(1)} ms (max ${maximumGeneratedTokenCount}).`;
      this.writeGenerationView(prompt, promptTokens, tokens, [
        generationStatus,
        `Context window: ${contextTokenCount} token(s)`,
        `Temperature: ${this.formatTemperature(temperature)}${this.formatSamplingMode(temperature)}`,
        `Canvas tensor visualization: ${canvasVisualizationEnabled ? 'enabled' : 'disabled'}`,
        `Canvas atlas: ${VISUALIZATION_COLUMN_COUNT} x ${VISUALIZATION_ROW_COUNT} cells`,
        `Debug Trace: ${debugBoxEnabled ? 'enabled' : 'disabled'}`,
        `Tensor stats readbacks: ${tensorInspectionEnabled ? 'enabled' : 'disabled'}`,
        'Sampling note: probabilities are computed from temperature-scaled logits. <|endoftext|> is not suppressed; if selected, it stops generation.',
        this.formatSelectedToken('Last selected token', lastSelectedToken),
        this.formatEndOfTextDiagnostic(lastRawTopTokens)
      ]);
    } finally {
      if (this.generationAbortController?.signal === signal) {
        this.generationAbortController = null;
        this.writeGenerationControls(false);
      }
    }
  }

  private async runNextToken(
    tokens: number[],
    contextStartPosition: number,
    generationStep: number,
    temperature: number
  ): Promise<NextTokenResult> {
    if (!this.device || !this.model || !this.tensors || !this.kernels) {
      throw new Error('Model is not initialized.');
    }

    const startedAt = performance.now();
    const debugBoxEnabled = this.isDebugBoxEnabled();
    const sequenceLength = Math.min(tokens.length, MAX_CONTEXT_TOKENS);
    const contextTokens = tokens.slice(-sequenceLength);
    const channelCount = this.model.config.channelCount;
    const createContextVisualizationSpanOptions = (
      sourceColumnCount: number
    ): VisualizationSpanOptions => ({
      sourceColumnCount,
      contextTokens,
      contextStartPosition
    });
    if (this.isCanvasVisualizationEnabled()) {
      this.resetVisualization(false);
    }
    const initialResidual = this.createInitialResidual(
      contextTokens,
      this.model,
      contextStartPosition
    );
    if (debugBoxEnabled) {
      this.appendDebugLine('');
      this.appendDebugLine(`=== Forward pass for generated token ${generationStep} ===`);
      this.appendDebugLine(`Context length: ${sequenceLength}`);
      this.appendDebugLine(
        `Context positions: ${contextStartPosition}-${contextStartPosition + sequenceLength - 1}`
      );
      this.appendDebugLine(
        this.formatTokenization('Forward context', contextTokens, this.model.tokenizer)
      );
    }
    if (this.isTensorInspectionEnabled()) {
      const tokenEmbeddingValues = this.createEmbeddingVisualizationValues(
        contextTokens,
        this.model,
        contextStartPosition,
        'token'
      );
      const tokenEmbeddingStats = this.getValueStats(tokenEmbeddingValues);
      const tokenEmbeddingVisualizationSpan = this.appendTensorVisualization(
        'cpu.tokenEmbeddings.context',
        tokenEmbeddingValues,
        tokenEmbeddingStats,
        VISUALIZATION_EMBEDDING_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(channelCount)
      );
      this.appendStatsLine(
        'cpu.tokenEmbeddings.context',
        tokenEmbeddingStats,
        tokenEmbeddingVisualizationSpan
      );

      const positionEmbeddingValues = this.createEmbeddingVisualizationValues(
        contextTokens,
        this.model,
        contextStartPosition,
        'position'
      );
      const positionEmbeddingStats = this.getValueStats(positionEmbeddingValues);
      const positionEmbeddingVisualizationSpan = this.appendTensorVisualization(
        'cpu.positionEmbeddings.context',
        positionEmbeddingValues,
        positionEmbeddingStats,
        VISUALIZATION_EMBEDDING_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(channelCount)
      );
      this.appendStatsLine(
        'cpu.positionEmbeddings.context',
        positionEmbeddingStats,
        positionEmbeddingVisualizationSpan
      );

      const initialResidualValues = initialResidual.subarray(
        0,
        sequenceLength * this.model.config.channelCount
      );
      const initialResidualStats = this.getValueStats(initialResidualValues);
      const initialResidualVisualizationSpan = this.appendTensorVisualization(
        'cpu.initialResidual.token+position-embeddings',
        initialResidualValues,
        initialResidualStats,
        VISUALIZATION_EMBEDDING_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(channelCount)
      );
      this.appendStatsLine(
        'cpu.initialResidual.token+position-embeddings',
        initialResidualStats,
        initialResidualVisualizationSpan
      );
    }
    this.tensors.residualA.write(initialResidual);
    await this.appendBufferStats(
      'gpu.residualA.afterUpload',
      this.tensors.residualA,
      sequenceLength * channelCount,
      VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
      createContextVisualizationSpanOptions(channelCount)
    );

    let residualInput = this.tensors.residualA;
    let residualOutput = this.tensors.residualB;

    for (let layerIndex = 0; layerIndex < this.model.config.layerCount; layerIndex++) {
      const layer = this.model.layers[layerIndex];
      this.appendDebugLine(`-- layer ${layerIndex} --`);
      this.appendLayerParameterVisualizations(layerIndex, this.model);
      this.dispatchLayerNorm(
        residualInput,
        layer.layerNorm1Weight,
        layer.layerNorm1Bias,
        this.tensors.normalized,
        sequenceLength
      );
      await this.appendBufferStats(
        `layer${layerIndex}.ln1`,
        this.tensors.normalized,
        sequenceLength * channelCount,
        VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(channelCount)
      );
      this.dispatchMatrixMultiply(
        this.tensors.normalized,
        layer.queryKeyValueWeight,
        layer.queryKeyValueBias,
        this.tensors.queryKeyValue,
        sequenceLength,
        channelCount,
        3 * channelCount,
        0,
        0,
        true
      );
      await this.appendBufferStats(
        `layer${layerIndex}.qkv`,
        this.tensors.queryKeyValue,
        sequenceLength * 3 * channelCount,
        VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(3 * channelCount)
      );
      this.dispatchAttention(sequenceLength);
      await this.appendBufferStats(
        `layer${layerIndex}.attention`,
        this.tensors.attentionOutput,
        sequenceLength * channelCount,
        VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(channelCount)
      );
      this.dispatchMatrixMultiply(
        this.tensors.attentionOutput,
        layer.attentionProjectionWeight,
        layer.attentionProjectionBias,
        this.tensors.normalized,
        sequenceLength,
        channelCount,
        channelCount,
        0,
        0,
        true
      );
      await this.appendBufferStats(
        `layer${layerIndex}.attentionProjection`,
        this.tensors.normalized,
        sequenceLength * channelCount,
        VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(channelCount)
      );
      this.dispatchResidualAdd(
        residualInput,
        this.tensors.normalized,
        residualOutput,
        sequenceLength
      );
      await this.appendBufferStats(
        `layer${layerIndex}.residual2`,
        residualOutput,
        sequenceLength * channelCount,
        VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(channelCount)
      );

      this.dispatchLayerNorm(
        residualOutput,
        layer.layerNorm2Weight,
        layer.layerNorm2Bias,
        this.tensors.normalized,
        sequenceLength
      );
      await this.appendBufferStats(
        `layer${layerIndex}.ln2`,
        this.tensors.normalized,
        sequenceLength * channelCount,
        VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(channelCount)
      );
      this.dispatchMatrixMultiply(
        this.tensors.normalized,
        layer.feedForwardWeight,
        layer.feedForwardBias,
        this.tensors.feedForward,
        sequenceLength,
        channelCount,
        4 * channelCount,
        0,
        0,
        true
      );
      await this.appendBufferStats(
        `layer${layerIndex}.feedForward`,
        this.tensors.feedForward,
        sequenceLength * 4 * channelCount,
        VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(4 * channelCount)
      );
      this.dispatchGelu(sequenceLength * 4 * channelCount);
      await this.appendBufferStats(
        `layer${layerIndex}.gelu`,
        this.tensors.feedForwardGelu,
        sequenceLength * 4 * channelCount,
        VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(4 * channelCount)
      );
      this.dispatchMatrixMultiply(
        this.tensors.feedForwardGelu,
        layer.feedForwardProjectionWeight,
        layer.feedForwardProjectionBias,
        this.tensors.normalized,
        sequenceLength,
        4 * channelCount,
        channelCount,
        0,
        0,
        true
      );
      await this.appendBufferStats(
        `layer${layerIndex}.feedForwardProjection`,
        this.tensors.normalized,
        sequenceLength * channelCount,
        VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(channelCount)
      );
      this.dispatchResidualAdd(
        residualOutput,
        this.tensors.normalized,
        residualInput,
        sequenceLength
      );
      await this.appendBufferStats(
        `layer${layerIndex}.residual3`,
        residualInput,
        sequenceLength * channelCount,
        VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
        createContextVisualizationSpanOptions(channelCount)
      );
    }

    this.dispatchLayerNorm(
      residualInput,
      this.model.finalLayerNormWeight,
      this.model.finalLayerNormBias,
      this.tensors.normalized,
      sequenceLength
    );
    await this.appendBufferStats(
      'final.layerNorm',
      this.tensors.normalized,
      sequenceLength * channelCount,
      VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
      createContextVisualizationSpanOptions(channelCount)
    );
    this.dispatchLanguageModelHead(sequenceLength);
    await this.appendBufferStats(
      'final.logits',
      this.tensors.logits,
      this.model.config.paddedVocabularySize,
      VISUALIZATION_LOGIT_PIXEL_BUDGET
    );
    this.flushVisualization();

    const logitsBytes = await this.tensors.logits.readAsync(
      0,
      this.model.config.paddedVocabularySize * Float32Array.BYTES_PER_ELEMENT
    );
    const logits = new Float32Array(
      logitsBytes.buffer,
      logitsBytes.byteOffset,
      logitsBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    const elapsedMilliseconds = performance.now() - startedAt;
    const topTokens = this.selectTopTokens(logits, this.model.tokenizer, {
      temperature
    });
    const rawTopTokens = topTokens;
    this.appendDebugLine(this.formatTopTokens('Top logits', topTokens));
    const selectedToken = this.selectNextToken(logits, this.model.tokenizer, temperature);
    this.appendDebugLine(this.formatSelectedToken('Selected token', selectedToken));

    return {
      topTokens,
      rawTopTokens,
      selectedToken,
      elapsedMilliseconds
    };
  }

  private getContextStartPosition(
    totalTokenCount: number,
    contextTokenCount: number,
    model: GPT2Model
  ): number {
    const unclampedStartPosition = Math.max(0, totalTokenCount - contextTokenCount);
    const maximumStartPosition = Math.max(0, model.config.maxSequenceLength - contextTokenCount);
    return Math.min(unclampedStartPosition, maximumStartPosition);
  }

  private createInitialResidual(
    tokens: number[],
    model: GPT2Model,
    contextStartPosition: number
  ): Float32Array {
    const {config, parameterValues, parameterOffsets} = model;
    const residual = new Float32Array(MAX_CONTEXT_TOKENS * config.channelCount);

    for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
      const token = tokens[tokenIndex];
      const positionIndex = contextStartPosition + tokenIndex;
      const tokenEmbeddingOffset = parameterOffsets.tokenEmbedding + token * config.channelCount;
      const positionEmbeddingOffset =
        parameterOffsets.positionEmbedding + positionIndex * config.channelCount;
      const outputOffset = tokenIndex * config.channelCount;

      for (let channelIndex = 0; channelIndex < config.channelCount; channelIndex++) {
        residual[outputOffset + channelIndex] =
          parameterValues[tokenEmbeddingOffset + channelIndex] +
          parameterValues[positionEmbeddingOffset + channelIndex];
      }
    }

    return residual;
  }

  private createEmbeddingVisualizationValues(
    tokens: number[],
    model: GPT2Model,
    contextStartPosition: number,
    embeddingType: 'token' | 'position'
  ): Float32Array {
    const {config, parameterValues, parameterOffsets} = model;
    const values = new Float32Array(tokens.length * config.channelCount);

    for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
      const token = tokens[tokenIndex];
      const positionIndex = contextStartPosition + tokenIndex;
      const sourceOffset =
        embeddingType === 'token'
          ? parameterOffsets.tokenEmbedding + token * config.channelCount
          : parameterOffsets.positionEmbedding + positionIndex * config.channelCount;
      const outputOffset = tokenIndex * config.channelCount;

      for (let channelIndex = 0; channelIndex < config.channelCount; channelIndex++) {
        values[outputOffset + channelIndex] = parameterValues[sourceOffset + channelIndex];
      }
    }

    return values;
  }

  private appendLayerParameterVisualizations(layerIndex: number, model: GPT2Model): void {
    if (!this.isCanvasVisualizationEnabled()) {
      return;
    }

    const {config, parameterValues, parameterOffsets} = model;
    const channelCount = config.channelCount;
    const queryKeyValueWeightSize = 3 * channelCount * channelCount;
    const queryKeyValueBiasSize = 3 * channelCount;
    const attentionProjectionWeightSize = channelCount * channelCount;
    const feedForwardWeightSize = 4 * channelCount * channelCount;
    const feedForwardBiasSize = 4 * channelCount;
    const feedForwardProjectionWeightSize = channelCount * 4 * channelCount;

    this.appendParameterVisualization(
      `layer${layerIndex}.ln1.weight`,
      parameterValues,
      parameterOffsets.layerNorm1Weight + layerIndex * channelCount,
      channelCount
    );
    this.appendParameterVisualization(
      `layer${layerIndex}.ln1.bias`,
      parameterValues,
      parameterOffsets.layerNorm1Bias + layerIndex * channelCount,
      channelCount
    );
    this.appendParameterVisualization(
      `layer${layerIndex}.qkv.weight`,
      parameterValues,
      parameterOffsets.queryKeyValueWeight + layerIndex * queryKeyValueWeightSize,
      queryKeyValueWeightSize
    );
    this.appendParameterVisualization(
      `layer${layerIndex}.qkv.bias`,
      parameterValues,
      parameterOffsets.queryKeyValueBias + layerIndex * queryKeyValueBiasSize,
      queryKeyValueBiasSize
    );
    this.appendParameterVisualization(
      `layer${layerIndex}.attentionProjection.weight`,
      parameterValues,
      parameterOffsets.attentionProjectionWeight + layerIndex * attentionProjectionWeightSize,
      attentionProjectionWeightSize
    );
    this.appendParameterVisualization(
      `layer${layerIndex}.attentionProjection.bias`,
      parameterValues,
      parameterOffsets.attentionProjectionBias + layerIndex * channelCount,
      channelCount
    );
    this.appendParameterVisualization(
      `layer${layerIndex}.ln2.weight`,
      parameterValues,
      parameterOffsets.layerNorm2Weight + layerIndex * channelCount,
      channelCount
    );
    this.appendParameterVisualization(
      `layer${layerIndex}.ln2.bias`,
      parameterValues,
      parameterOffsets.layerNorm2Bias + layerIndex * channelCount,
      channelCount
    );
    this.appendParameterVisualization(
      `layer${layerIndex}.feedForward.weight`,
      parameterValues,
      parameterOffsets.feedForwardWeight + layerIndex * feedForwardWeightSize,
      feedForwardWeightSize
    );
    this.appendParameterVisualization(
      `layer${layerIndex}.feedForward.bias`,
      parameterValues,
      parameterOffsets.feedForwardBias + layerIndex * feedForwardBiasSize,
      feedForwardBiasSize
    );
    this.appendParameterVisualization(
      `layer${layerIndex}.feedForwardProjection.weight`,
      parameterValues,
      parameterOffsets.feedForwardProjectionWeight + layerIndex * feedForwardProjectionWeightSize,
      feedForwardProjectionWeightSize
    );
    this.appendParameterVisualization(
      `layer${layerIndex}.feedForwardProjection.bias`,
      parameterValues,
      parameterOffsets.feedForwardProjectionBias + layerIndex * channelCount,
      channelCount
    );
  }

  private appendParameterVisualization(
    label: string,
    values: Float32Array,
    start: number,
    size: number
  ): void {
    const visualizationSpan = this.appendTensorVisualization(
      label,
      values.subarray(start, start + size),
      null,
      VISUALIZATION_WEIGHT_PIXEL_BUDGET
    );

    if (this.isDebugBoxEnabled() && visualizationSpan) {
      this.appendDebugLine(
        `sampled ${label}: pixels ${visualizationSpan.startCell}-${visualizationSpan.endCell} ${visualizationSpan.writtenCellCount}/${visualizationSpan.sourceValueCount}`
      );
    }
  }

  private dispatchLayerNorm(
    input: Buffer,
    scale: Buffer,
    bias: Buffer,
    output: Buffer,
    sequenceLength: number
  ): void {
    if (!this.device || !this.tensors || !this.kernels || !this.model) {
      return;
    }

    this.writeParameters([sequenceLength, this.model.config.channelCount, 0, 0]);
    this.kernels.layerNorm.setBindings({
      inputData: input,
      scaleData: scale,
      biasData: bias,
      outputData: output,
      parameters: this.tensors.computeParameters
    });
    this.dispatchComputation(this.kernels.layerNorm, sequenceLength);
  }

  private dispatchMatrixMultiply(
    input: Buffer,
    weight: Buffer,
    bias: Buffer,
    output: Buffer,
    rowCount: number,
    inputColumnCount: number,
    outputColumnCount: number,
    inputOffset: number,
    outputOffset: number,
    hasBias: boolean
  ): void {
    if (!this.tensors || !this.kernels) {
      return;
    }

    this.writeParameters([
      rowCount,
      inputColumnCount,
      outputColumnCount,
      inputOffset,
      outputOffset,
      hasBias ? 1 : 0
    ]);
    this.kernels.matrixMultiply.setBindings({
      inputData: input,
      weightData: weight,
      biasData: bias,
      outputData: output,
      parameters: this.tensors.computeParameters
    });
    this.dispatchComputation(
      this.kernels.matrixMultiply,
      Math.ceil(outputColumnCount / 8),
      Math.ceil(rowCount / 8)
    );
  }

  private dispatchAttention(sequenceLength: number): void {
    if (!this.tensors || !this.kernels || !this.model) {
      return;
    }

    this.writeParameters([
      sequenceLength,
      this.model.config.channelCount,
      this.model.config.headSize
    ]);
    this.kernels.attention.setBindings({
      queryKeyValueData: this.tensors.queryKeyValue,
      outputData: this.tensors.attentionOutput,
      parameters: this.tensors.computeParameters
    });
    this.dispatchComputation(
      this.kernels.attention,
      Math.ceil(this.model.config.channelCount / 8),
      Math.ceil(sequenceLength / 8)
    );
  }

  private dispatchResidualAdd(
    left: Buffer,
    right: Buffer,
    output: Buffer,
    sequenceLength: number
  ): void {
    if (!this.tensors || !this.kernels || !this.model) {
      return;
    }

    const elementCount = sequenceLength * this.model.config.channelCount;
    this.writeParameters([elementCount]);
    this.kernels.residualAdd.setBindings({
      leftData: left,
      rightData: right,
      outputData: output,
      parameters: this.tensors.computeParameters
    });
    this.dispatchComputation(this.kernels.residualAdd, Math.ceil(elementCount / 256));
  }

  private dispatchGelu(elementCount: number): void {
    if (!this.tensors || !this.kernels) {
      return;
    }

    this.writeParameters([elementCount]);
    this.kernels.gelu.setBindings({
      inputData: this.tensors.feedForward,
      outputData: this.tensors.feedForwardGelu,
      parameters: this.tensors.computeParameters
    });
    this.dispatchComputation(this.kernels.gelu, Math.ceil(elementCount / 256));
  }

  private dispatchLanguageModelHead(sequenceLength: number): void {
    if (!this.model || !this.tensors) {
      return;
    }

    const inputOffset = (sequenceLength - 1) * this.model.config.channelCount;
    for (const chunk of this.model.tokenEmbeddingChunks) {
      this.dispatchMatrixMultiply(
        this.tensors.normalized,
        chunk.buffer,
        this.model.emptyBias,
        this.tensors.logits,
        1,
        this.model.config.channelCount,
        chunk.rowCount,
        inputOffset,
        chunk.startRow,
        false
      );
    }
  }

  private dispatchComputation(computation: Computation, x: number, y?: number): void {
    if (!this.device) {
      return;
    }

    const computePass = this.device.beginComputePass({});
    computation.dispatch(computePass, x, y);
    computePass.end();
    this.device.submit();
  }

  private writeParameters(values: number[]): void {
    if (!this.tensors) {
      return;
    }

    const parameters = new Uint32Array(16);
    parameters.set(values);
    this.tensors.computeParameters.write(parameters);
  }

  private encodePrompt(prompt: string, tokenizer: Tokenizer): number[] {
    if (!prompt) {
      return [tokenizer.endOfTextToken];
    }

    const tokens: number[] = [];
    const endOfTextText = tokenizer.tokenTable[tokenizer.endOfTextToken] || '<|endoftext|>';
    const promptParts = prompt.split(endOfTextText);

    for (let promptPartIndex = 0; promptPartIndex < promptParts.length; promptPartIndex++) {
      const promptPart = promptParts[promptPartIndex];
      if (promptPart) {
        tokens.push(...this.encodeTextPromptPart(promptPart, tokenizer));
      }
      if (promptPartIndex < promptParts.length - 1) {
        tokens.push(tokenizer.endOfTextToken);
      }
    }

    return tokens.length ? tokens : [tokenizer.endOfTextToken];
  }

  private encodeTextPromptPart(promptPart: string, tokenizer: Tokenizer): number[] {
    const tokens: number[] = [];
    const textEncoder = new TextEncoder();
    const matches = Array.from(promptPart.matchAll(GPT2_PRETOKEN_PATTERN), match => match[0]);

    for (const match of matches.length > 0 ? matches : [promptPart]) {
      const byteTokens = Array.from(textEncoder.encode(match), byte => {
        const token = tokenizer.singleByteTokenByByte.get(byte);
        if (token === undefined) {
          throw new Error(`Tokenizer is missing a single-byte token for byte ${byte}.`);
        }
        return token;
      });
      tokens.push(...this.mergeBytePairTokens(byteTokens, tokenizer));
    }

    return tokens;
  }

  private mergeBytePairTokens(tokens: number[], tokenizer: Tokenizer): number[] {
    const mergedTokens = tokens.slice();

    while (mergedTokens.length > 1) {
      let bestPairIndex = -1;
      let bestMergedToken: number | null = null;

      for (let tokenIndex = 0; tokenIndex < mergedTokens.length - 1; tokenIndex++) {
        const mergedToken = this.getMergedToken(
          mergedTokens[tokenIndex],
          mergedTokens[tokenIndex + 1],
          tokenizer
        );
        if (
          mergedToken !== null &&
          mergedToken !== tokenizer.endOfTextToken &&
          (bestMergedToken === null || mergedToken < bestMergedToken)
        ) {
          bestPairIndex = tokenIndex;
          bestMergedToken = mergedToken;
        }
      }

      if (bestPairIndex === -1 || bestMergedToken === null) {
        break;
      }

      mergedTokens.splice(bestPairIndex, 2, bestMergedToken);
    }

    return mergedTokens;
  }

  private getMergedToken(
    leftToken: number,
    rightToken: number,
    tokenizer: Tokenizer
  ): number | null {
    const pairKey = `${leftToken},${rightToken}`;
    const cachedToken = tokenizer.mergedTokenCache.get(pairKey);
    if (cachedToken !== undefined) {
      return cachedToken;
    }

    const leftBytes = tokenizer.tokenBytesTable[leftToken];
    const rightBytes = tokenizer.tokenBytesTable[rightToken];
    if (!leftBytes || !rightBytes) {
      tokenizer.mergedTokenCache.set(pairKey, null);
      return null;
    }

    const bytes = new Uint8Array(leftBytes.length + rightBytes.length);
    bytes.set(leftBytes);
    bytes.set(rightBytes, leftBytes.length);
    const mergedToken =
      tokenizer.tokenIdsByByteSequence.get(this.getByteSequenceKey(bytes)) ?? null;
    tokenizer.mergedTokenCache.set(pairKey, mergedToken);
    return mergedToken;
  }

  private getByteSequenceKey(bytes: Uint8Array): string {
    return Array.from(bytes).join(',');
  }

  private selectTopTokens(
    logits: Float32Array,
    tokenizer: Tokenizer,
    options: {temperature: number}
  ): TopToken[] {
    const topTokens: TopToken[] = [];
    const maximumLogit = this.getMaximumLogit(logits, tokenizer.vocabularySize);
    const probabilityDenominator = this.getProbabilityDenominator(
      logits,
      tokenizer.vocabularySize,
      maximumLogit,
      options.temperature
    );

    for (let token = 0; token < tokenizer.vocabularySize; token++) {
      const logit = logits[token];
      if (!Number.isFinite(logit)) {
        continue;
      }

      const candidate = this.createScoredToken(
        token,
        logit,
        tokenizer,
        maximumLogit,
        probabilityDenominator,
        options.temperature
      );
      const insertionIndex = topTokens.findIndex(topToken => candidate.logit > topToken.logit);
      if (insertionIndex === -1) {
        if (topTokens.length < TOP_TOKEN_COUNT) {
          topTokens.push(candidate);
        }
      } else {
        topTokens.splice(insertionIndex, 0, candidate);
        topTokens.length = Math.min(topTokens.length, TOP_TOKEN_COUNT);
      }
    }

    return topTokens;
  }

  private selectNextToken(
    logits: Float32Array,
    tokenizer: Tokenizer,
    temperature: number
  ): TopToken {
    const topTokens = this.selectTopTokens(logits, tokenizer, {
      temperature
    });
    const fallbackToken =
      topTokens[0] ||
      this.createScoredToken(tokenizer.endOfTextToken, 0, tokenizer, 0, 1, MINIMUM_TEMPERATURE);

    if (temperature <= MINIMUM_TEMPERATURE) {
      return fallbackToken;
    }

    const maximumLogit = this.getMaximumLogit(logits, tokenizer.vocabularySize);
    const probabilityDenominator = this.getProbabilityDenominator(
      logits,
      tokenizer.vocabularySize,
      maximumLogit,
      temperature
    );
    if (!Number.isFinite(maximumLogit) || probabilityDenominator <= 0) {
      return fallbackToken;
    }

    let probabilityThreshold = Math.random() * probabilityDenominator;
    for (let token = 0; token < tokenizer.vocabularySize; token++) {
      const logit = logits[token];
      if (!Number.isFinite(logit)) {
        continue;
      }

      probabilityThreshold -= Math.exp((logit - maximumLogit) / temperature);
      if (probabilityThreshold <= 0) {
        return this.createScoredToken(
          token,
          logit,
          tokenizer,
          maximumLogit,
          probabilityDenominator,
          temperature
        );
      }
    }

    return fallbackToken;
  }

  private getMaximumLogit(logits: Float32Array, vocabularySize: number): number {
    let maximumLogit = Number.NEGATIVE_INFINITY;

    for (let token = 0; token < vocabularySize; token++) {
      const logit = logits[token];
      if (Number.isFinite(logit)) {
        maximumLogit = Math.max(maximumLogit, logit);
      }
    }

    return maximumLogit;
  }

  private getProbabilityDenominator(
    logits: Float32Array,
    vocabularySize: number,
    maximumLogit: number,
    temperature: number
  ): number {
    if (temperature <= MINIMUM_TEMPERATURE || !Number.isFinite(maximumLogit)) {
      return 1;
    }

    let probabilityDenominator = 0;
    for (let token = 0; token < vocabularySize; token++) {
      const logit = logits[token];
      if (Number.isFinite(logit)) {
        probabilityDenominator += Math.exp((logit - maximumLogit) / temperature);
      }
    }

    return probabilityDenominator;
  }

  private createScoredToken(
    token: number,
    logit: number,
    tokenizer: Tokenizer,
    maximumLogit: number,
    probabilityDenominator: number,
    temperature: number
  ): TopToken {
    const scaledLogitDelta =
      temperature <= MINIMUM_TEMPERATURE || !Number.isFinite(maximumLogit)
        ? logit - maximumLogit
        : (logit - maximumLogit) / temperature;
    const probability =
      temperature <= MINIMUM_TEMPERATURE
        ? logit === maximumLogit
          ? 1
          : 0
        : Math.exp(scaledLogitDelta) / probabilityDenominator;

    return {
      token,
      text: tokenizer.tokenTable[token] || '',
      logit,
      scaledLogitDelta,
      probability
    };
  }

  private writeGenerationProgress(
    prompt: string,
    promptTokens: number[],
    tokens: number[],
    topTokens: TopToken[],
    selectedToken: TopToken,
    generatedTokenCount: number,
    maximumGeneratedTokenCount: number,
    contextTokenCount: number,
    temperature: number,
    elapsedMilliseconds: number
  ): void {
    this.writeGenerationView(prompt, promptTokens, tokens, [
      `Step ${generatedTokenCount} / max ${maximumGeneratedTokenCount}: ${elapsedMilliseconds.toFixed(1)} ms`,
      `Context window: ${contextTokenCount} token(s)`,
      `Temperature: ${this.formatTemperature(temperature)}${this.formatSamplingMode(temperature)}`,
      `Canvas tensor visualization: ${this.isCanvasVisualizationEnabled() ? 'enabled' : 'disabled'}`,
      `Debug Trace: ${this.isDebugBoxEnabled() ? 'enabled' : 'disabled'}`,
      `Tensor stats readbacks: ${this.isTensorInspectionEnabled() ? 'enabled' : 'disabled'}`,
      'Sampling note: probabilities are computed from temperature-scaled logits. <|endoftext|> is not suppressed; if selected, it stops generation.',
      this.formatSelectedToken('Selected token', selectedToken),
      `Canvas atlas: ${VISUALIZATION_COLUMN_COUNT} x ${VISUALIZATION_ROW_COUNT} cells`,
      `Click a generated token below to inspect its saved logits. Currently showing token ${generatedTokenCount}.`,
      this.formatTopTokens('Latest top sampled logits', topTokens)
    ]);
  }

  private writeGenerationStopped(
    prompt: string,
    promptTokens: number[],
    tokens: number[],
    completedGeneratedTokenCount: number,
    maximumGeneratedTokenCount: number,
    elapsedMilliseconds: number,
    contextTokenCount: number,
    temperature: number,
    topTokens: TopToken[],
    selectedToken: TopToken | null,
    rawTopTokens: TopToken[]
  ): void {
    this.appendDebugLine(
      `Stopped after ${completedGeneratedTokenCount} of max ${maximumGeneratedTokenCount} token(s).`
    );
    this.writeGenerationView(prompt, promptTokens, tokens, [
      `Stopped after ${completedGeneratedTokenCount} of max ${maximumGeneratedTokenCount} token(s) in ${elapsedMilliseconds.toFixed(1)} ms.`,
      `Context window: ${contextTokenCount} token(s)`,
      `Temperature: ${this.formatTemperature(temperature)}${this.formatSamplingMode(temperature)}`,
      `Canvas tensor visualization: ${this.isCanvasVisualizationEnabled() ? 'enabled' : 'disabled'}`,
      `Debug Trace: ${this.isDebugBoxEnabled() ? 'enabled' : 'disabled'}`,
      `Tensor stats readbacks: ${this.isTensorInspectionEnabled() ? 'enabled' : 'disabled'}`,
      'Sampling note: probabilities are computed from temperature-scaled logits. <|endoftext|> is not suppressed; if selected, it stops generation.',
      this.formatSelectedToken('Last selected token', selectedToken),
      `Canvas atlas: ${VISUALIZATION_COLUMN_COUNT} x ${VISUALIZATION_ROW_COUNT} cells`,
      this.formatTopTokens('Last sampled logits', topTokens),
      this.formatEndOfTextDiagnostic(rawTopTokens)
    ]);
    this.writeDebugOutput(this.debugLines.join('\n'));
  }

  private writeGenerationView(
    prompt: string,
    promptTokens: number[],
    tokens: number[],
    statusLines: string[]
  ): void {
    const promptTokenization = this.model
      ? this.formatTokenization('Prompt tokenization', promptTokens, this.model.tokenizer)
      : '';
    const statusText = [
      promptTokenization,
      '',
      ...statusLines.filter(statusLine => statusLine.length > 0)
    ].join('\n');

    this.writeOutputHtml(
      [
        '<div class="gpgpu-output-layout">',
        '<section class="gpgpu-output-section">',
        '<div class="gpgpu-output-section-title">Output</div>',
        `<pre class="gpgpu-output-pre gpgpu-model-output">${this.escapeHtml(this.getGenerationText(prompt, tokens))}</pre>`,
        '</section>',
        '<section class="gpgpu-output-section">',
        this.formatGeneratedTokenButtonsHtml(),
        '</section>',
        '<section class="gpgpu-output-section">',
        '<div class="gpgpu-output-section-title">Run status</div>',
        `<pre class="gpgpu-output-pre">${this.escapeHtml(statusText)}</pre>`,
        '</section>',
        '<section class="gpgpu-output-section">',
        '<div class="gpgpu-output-section-title">Selected logits</div>',
        `<div id="gpgpu-selected-logits">${this.formatSelectedGenerationLogitsStepHtml()}</div>`,
        '</section>',
        '</div>'
      ].join('')
    );
  }

  private formatGeneratedTokenButtonsHtml(): string {
    if (this.generationLogitsSteps.length === 0) {
      return [
        '<div class="gpgpu-output-section-title">Generated tokens</div>',
        '<div style="white-space: normal;">',
        'None yet. Logits will appear after the first token is sampled.',
        '</div>'
      ].join('');
    }

    return [
      '<div class="gpgpu-output-section-title">Generated tokens</div>',
      '<div style="white-space: normal;">',
      '<div style="margin-bottom: 4px;">Click a token to inspect saved logits, or use a completion button to copy the output through that token into the prompt input.</div>',
      '<div style="display: flex; flex-wrap: wrap; gap: 4px;">',
      ...this.generationLogitsSteps.map(generationLogitsStep =>
        this.formatGeneratedTokenButtonHtml(generationLogitsStep)
      ),
      '</div>',
      '</div>'
    ].join('');
  }

  private formatGeneratedTokenButtonHtml(generationLogitsStep: GenerationLogitsStep): string {
    const selected = generationLogitsStep.generatedIndex === this.selectedGenerationLogitsStepIndex;
    const tokenText = this.escapeTokenText(generationLogitsStep.selectedToken.text) || '(empty)';
    const title = [
      `generated token ${generationLogitsStep.generatedIndex + 1}`,
      `token id ${generationLogitsStep.selectedToken.token}`,
      `raw logit ${this.formatLogit(generationLogitsStep.selectedToken.logit)}`,
      `probability ${this.formatProbability(generationLogitsStep.selectedToken.probability)}`
    ].join(', ');

    return [
      '<span style="display: inline-flex; gap: 2px;">',
      `<button type="button" data-gpgpu-generation-step="${generationLogitsStep.generatedIndex}" aria-pressed="${selected}" title="${this.escapeHtml(title)}" style="${this.getGeneratedTokenButtonStyle(selected)}">`,
      `<span style="opacity: 0.72;">#${generationLogitsStep.generatedIndex + 1}</span> `,
      `<span style="white-space: pre;">"${this.escapeHtml(tokenText)}"</span>`,
      '</button>',
      `<button type="button" data-gpgpu-completion-step="${generationLogitsStep.generatedIndex}" title="Copy completion through token ${generationLogitsStep.generatedIndex + 1} into the prompt input" style="${this.getUseCompletionButtonStyle()}">use</button>`,
      '</span>'
    ].join('');
  }

  private selectGenerationLogitsStep(generationLogitsStepIndex: number): void {
    if (
      !Number.isInteger(generationLogitsStepIndex) ||
      generationLogitsStepIndex < 0 ||
      generationLogitsStepIndex >= this.generationLogitsSteps.length
    ) {
      return;
    }

    this.selectedGenerationLogitsStepIndex = generationLogitsStepIndex;
    const logitsElement = document.getElementById('gpgpu-selected-logits');
    if (logitsElement) {
      logitsElement.innerHTML = this.formatSelectedGenerationLogitsStepHtml();
    }
    this.writeGeneratedTokenButtonStates();
  }

  private formatSelectedGenerationLogitsStepHtml(): string {
    const generationLogitsStep = this.getSelectedGenerationLogitsStep();

    if (!generationLogitsStep) {
      return [
        '<pre class="gpgpu-output-pre gpgpu-logits-pre">',
        'No generated-token logits yet.',
        '</pre>'
      ].join('');
    }

    const contextTokenization = this.model
      ? this.formatTokenization(
          'Context tokens used for this logits pass',
          generationLogitsStep.contextTokens,
          this.model.tokenizer
        )
      : '';
    const lines = [
      `Logits for generated token ${generationLogitsStep.generatedIndex + 1}: ${generationLogitsStep.selectedToken.token} "${this.escapeTokenText(generationLogitsStep.selectedToken.text)}"`,
      `Forward pass time: ${generationLogitsStep.elapsedMilliseconds.toFixed(1)} ms`,
      `Temperature: ${this.formatTemperature(generationLogitsStep.temperature)}${this.formatSamplingMode(generationLogitsStep.temperature)}`,
      `Context positions: ${generationLogitsStep.contextStartPosition}-${generationLogitsStep.contextStartPosition + generationLogitsStep.contextTokens.length - 1}`,
      'These logits are from the point before the selected token was appended to the context.',
      '',
      this.formatSelectedToken('Selected token', generationLogitsStep.selectedToken),
      this.formatTopTokens(
        'Top sampled logits at this token (<|endoftext|> allowed)',
        generationLogitsStep.topTokens
      ),
      '',
      contextTokenization
    ].join('\n');

    return [
      '<pre class="gpgpu-output-pre gpgpu-logits-pre">',
      this.escapeHtml(lines),
      '</pre>',
      this.formatLogitChoiceButtonsHtml(generationLogitsStep),
      '<div id="gpgpu-prompt-sync-status" style="margin-top: 6px; white-space: normal; font-size: 11px;"></div>'
    ].join('');
  }

  private formatLogitChoiceButtonsHtml(generationLogitsStep: GenerationLogitsStep): string {
    return [
      '<div style="margin-top: 8px; white-space: normal;">',
      '<div style="margin-bottom: 4px;"><strong>Pick a candidate logit:</strong> click one to copy this step prefix plus that token into the prompt input.</div>',
      '<div style="display: flex; flex-wrap: wrap; gap: 4px;">',
      ...generationLogitsStep.topTokens.map((topToken, index) =>
        this.formatLogitChoiceButtonHtml(generationLogitsStep, topToken, index)
      ),
      '</div>',
      '</div>'
    ].join('');
  }

  private formatLogitChoiceButtonHtml(
    generationLogitsStep: GenerationLogitsStep,
    topToken: TopToken,
    index: number
  ): string {
    const tokenText = this.escapeTokenText(topToken.text) || '(empty)';
    const title = [
      `rank ${index + 1}`,
      `token id ${topToken.token}`,
      `raw logit ${this.formatLogit(topToken.logit)}`,
      `probability ${this.formatProbability(topToken.probability)}`
    ].join(', ');

    return [
      `<button type="button" data-gpgpu-logit-step="${generationLogitsStep.generatedIndex}" data-gpgpu-logit-token="${topToken.token}" title="${this.escapeHtml(title)}" style="${this.getLogitChoiceButtonStyle()}">`,
      `<span style="opacity: 0.72;">${index + 1}.</span> `,
      `<span style="white-space: pre;">"${this.escapeHtml(tokenText)}"</span> `,
      `<span style="opacity: 0.72;">${this.escapeHtml(this.formatProbability(topToken.probability))}</span>`,
      '</button>'
    ].join('');
  }

  private getSelectedGenerationLogitsStep(): GenerationLogitsStep | null {
    if (this.selectedGenerationLogitsStepIndex === null) {
      return null;
    }

    return this.generationLogitsSteps[this.selectedGenerationLogitsStepIndex] || null;
  }

  private writePromptFromCompletion(generationLogitsStepIndex: number): void {
    const generationLogitsStep = this.generationLogitsSteps[generationLogitsStepIndex];
    if (!generationLogitsStep) {
      return;
    }

    this.writePromptValue(generationLogitsStep.completionText);
    this.writePromptSyncStatus(
      `Prompt input updated to the sampled completion through generated token ${generationLogitsStep.generatedIndex + 1}.`
    );
  }

  private writePromptFromLogitChoice(generationLogitsStepIndex: number, token: number): void {
    const generationLogitsStep = this.generationLogitsSteps[generationLogitsStepIndex];
    if (!generationLogitsStep || !this.model || !Number.isInteger(token)) {
      return;
    }

    const tokenText = this.model.tokenizer.tokenTable[token] || '';
    this.writePromptValue(generationLogitsStep.completionPrefixText + tokenText);
    this.writePromptSyncStatus(
      `Prompt input updated with token ${token} "${this.escapeTokenText(tokenText)}" at generated-token slot ${generationLogitsStep.generatedIndex + 1}.`
    );
  }

  private writePromptValue(prompt: string): void {
    const promptElement = document.getElementById('gpgpu-prompt') as HTMLInputElement | null;
    if (!promptElement) {
      return;
    }

    promptElement.value = prompt;
    promptElement.selectionStart = prompt.length;
    promptElement.selectionEnd = prompt.length;
  }

  private writePromptSyncStatus(message: string): void {
    const statusElement = document.getElementById('gpgpu-prompt-sync-status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  private writeGeneratedTokenButtonStates(): void {
    const tokenButtonElements = document.querySelectorAll<HTMLButtonElement>(
      'button[data-gpgpu-generation-step]'
    );

    for (const tokenButtonElement of tokenButtonElements) {
      const generationLogitsStepIndex = Number(tokenButtonElement.dataset.gpgpuGenerationStep);
      const selected = generationLogitsStepIndex === this.selectedGenerationLogitsStepIndex;
      tokenButtonElement.setAttribute('aria-pressed', String(selected));
      tokenButtonElement.setAttribute('style', this.getGeneratedTokenButtonStyle(selected));
    }
  }

  private getGeneratedTokenButtonStyle(selected: boolean): string {
    const selectedStyles =
      'background: #dbeafe; border-color: #2563eb; color: #111827; box-shadow: inset 0 0 0 1px #2563eb;';
    const defaultStyles = 'background: #ffffff; border-color: #b8b8b8; color: #111827;';
    return [
      'font: inherit;',
      'font-size: 11px;',
      'line-height: 1.2;',
      'border: 1px solid;',
      'border-radius: 5px;',
      'padding: 4px 6px;',
      'cursor: pointer;',
      selected ? selectedStyles : defaultStyles
    ].join(' ');
  }

  private getUseCompletionButtonStyle(): string {
    return [
      'font: inherit;',
      'font-size: 11px;',
      'line-height: 1.2;',
      'border: 1px solid #9ca3af;',
      'border-radius: 5px;',
      'padding: 4px 6px;',
      'cursor: pointer;',
      'background: #f3f4f6;',
      'color: #111827;'
    ].join(' ');
  }

  private getLogitChoiceButtonStyle(): string {
    return [
      'font: inherit;',
      'font-size: 11px;',
      'line-height: 1.2;',
      'border: 1px solid #94a3b8;',
      'border-radius: 5px;',
      'padding: 4px 6px;',
      'cursor: pointer;',
      'background: #f8fafc;',
      'color: #111827;'
    ].join(' ');
  }

  private formatTopTokens(title: string, topTokens: TopToken[]): string {
    return [
      `${title}:`,
      'token     raw logit   scaled d  probability  text',
      ...topTokens.map(topToken => {
        const text = this.escapeTokenText(topToken.text);
        return `${topToken.token.toString().padStart(5, ' ')} ${this.formatLogit(topToken.logit).padStart(11, ' ')} ${this.formatLogit(topToken.scaledLogitDelta).padStart(10, ' ')} ${this.formatProbability(topToken.probability).padStart(11, ' ')}  "${text}"`;
      })
    ].join('\n');
  }

  private formatSelectedToken(title: string, selectedToken: TopToken | null): string {
    if (!selectedToken) {
      return `${title}: none`;
    }

    const text = this.escapeTokenText(selectedToken.text);
    return `${title}: ${selectedToken.token} "${text}" raw=${this.formatLogit(selectedToken.logit)} scaledDelta=${this.formatLogit(selectedToken.scaledLogitDelta)} p=${this.formatProbability(selectedToken.probability)}`;
  }

  private formatEndOfTextDiagnostic(rawTopTokens: TopToken[]): string {
    const endOfTextRank = rawTopTokens.findIndex(topToken => topToken.text === '<|endoftext|>');

    if (endOfTextRank === -1) {
      return '';
    }

    const endOfTextToken = rawTopTokens[endOfTextRank];
    return `<|endoftext|> is allowed and appears in the shown top-${TOP_TOKEN_COUNT} at rank ${endOfTextRank + 1} with logit ${endOfTextToken.logit.toFixed(3)}.`;
  }

  private formatTemperature(temperature: number): string {
    return this.clampTemperature(temperature).toFixed(2);
  }

  private formatSamplingMode(temperature: number): string {
    return temperature <= MINIMUM_TEMPERATURE ? ' (greedy argmax)' : ' (stochastic sampling)';
  }

  private formatLogit(logit: number): string {
    return Number.isFinite(logit) ? logit.toFixed(3) : String(logit);
  }

  private formatProbability(probability: number): string {
    if (!Number.isFinite(probability)) {
      return String(probability);
    }

    if (probability < 0.0001 && probability > 0) {
      return probability.toExponential(2);
    }

    return `${(100 * probability).toFixed(3)}%`;
  }

  private getGenerationText(prompt: string, tokens: number[]): string {
    if (!this.model) {
      return prompt;
    }

    const decodedText = this.decodeTokens(tokens, this.model.tokenizer);
    return `Output:\n${decodedText}`;
  }

  private decodeTokens(tokens: number[], tokenizer: Tokenizer): string {
    const byteCount = tokens.reduce(
      (total, token) => total + (tokenizer.tokenBytesTable[token]?.length || 0),
      0
    );
    const bytes = new Uint8Array(byteCount);
    let byteOffset = 0;

    for (const token of tokens) {
      const tokenBytes = tokenizer.tokenBytesTable[token];
      if (!tokenBytes) {
        continue;
      }
      bytes.set(tokenBytes, byteOffset);
      byteOffset += tokenBytes.length;
    }

    return new TextDecoder().decode(bytes);
  }

  private escapeTokenText(text: string): string {
    return JSON.stringify(text).slice(1, -1);
  }

  private writeModelSummary(model: GPT2Model): void {
    const parameterCount = this.getParameterSizes(model.config).reduce(
      (total, size) => total + size,
      0
    );
    const promptElement = document.getElementById('gpgpu-prompt') as HTMLInputElement | null;
    const prompt = promptElement?.value || DEFAULT_PROMPT;
    const maximumGeneratedTokenCount = this.getRequestedGeneratedTokenCount();
    const contextTokenCount = this.getRequestedContextTokenCount();
    const temperature = this.getRequestedTemperature();
    const canvasVisualizationEnabled = this.isCanvasVisualizationEnabled();
    const debugBoxEnabled = this.isDebugBoxEnabled();
    const tensorInspectionEnabled = this.isTensorInspectionEnabled();
    const promptTokens = this.encodePrompt(prompt, model.tokenizer);
    if (canvasVisualizationEnabled) {
      this.resetVisualization();
    }
    const parameterSampleValues = model.parameterValues.subarray(
      0,
      Math.min(model.parameterValues.length, 200000)
    );
    const parameterStats = tensorInspectionEnabled
      ? this.getValueStats(parameterSampleValues)
      : null;
    const parameterVisualizationSpan =
      parameterStats && canvasVisualizationEnabled
        ? this.appendTensorVisualization(
            'parameters.fp32.sample',
            parameterSampleValues,
            parameterStats,
            VISUALIZATION_WEIGHT_PIXEL_BUDGET
          )
        : null;
    this.flushVisualization();
    this.writeOutput(
      [
        'Ready.',
        `Model: GPT-2 ${model.config.layerCount} layers, ${model.config.headCount} heads, ${model.config.channelCount} channels`,
        `Context window: ${contextTokenCount} tokens`,
        `Maximum GPU context allocation: ${MAX_CONTEXT_TOKENS} tokens`,
        `Parameters loaded: ${parameterCount.toLocaleString()} fp32 values`,
        `Tokenizer: ${model.tokenizer.vocabularySize.toLocaleString()} tokens`,
        `Max new tokens: ${maximumGeneratedTokenCount}`,
        `Temperature: ${this.formatTemperature(temperature)}${this.formatSamplingMode(temperature)}`,
        `Canvas tensor visualization: ${canvasVisualizationEnabled ? 'enabled' : 'disabled'}`,
        `Canvas atlas: ${VISUALIZATION_COLUMN_COUNT} x ${VISUALIZATION_ROW_COUNT} cells (${VISUALIZATION_CELL_COUNT.toLocaleString()} sampled values)`,
        `Debug Trace: ${debugBoxEnabled ? 'enabled' : 'disabled'}`,
        `Tensor stats readbacks: ${tensorInspectionEnabled ? 'enabled' : 'disabled'}`,
        '',
        this.formatTokenization('Prompt tokenization', promptTokens, model.tokenizer),
        '',
        'Prompt encoding: byte-level GPT-2 BPE reconstructed from the llm.c tokenizer table.'
      ].join('\n')
    );
    if (debugBoxEnabled && parameterStats !== null) {
      this.writeDebugOutput(
        [
          ...this.debugLines,
          '',
          '=== Model summary ===',
          `maxSequenceLength: ${model.config.maxSequenceLength}`,
          `vocabularySize: ${model.config.vocabularySize}`,
          `paddedVocabularySize: ${model.config.paddedVocabularySize}`,
          `layerCount: ${model.config.layerCount}`,
          `headCount: ${model.config.headCount}`,
          `channelCount: ${model.config.channelCount}`,
          `headSize: ${model.config.headSize}`,
          `contextWindow: ${contextTokenCount}`,
          `maximumGpuContextAllocation: ${MAX_CONTEXT_TOKENS}`,
          `temperature: ${this.formatTemperature(temperature)}${this.formatSamplingMode(temperature)}`,
          `tokenEmbeddingChunks: ${model.tokenEmbeddingChunks
            .map(chunk => `${chunk.startRow}-${chunk.startRow + chunk.rowCount - 1}`)
            .join(', ')}`,
          this.formatStatsLineWithPixels(
            'parameters.fp32.sample',
            parameterStats,
            parameterVisualizationSpan
          ),
          '',
          'Canvas legend: yellow=positive, cyan=negative, dark gray=zero, red=NaN/Inf.',
          'Pixel spans are filled in the same order as the debug stats below.',
          '',
          this.formatTokenization('Current prompt tokenization', promptTokens, model.tokenizer)
        ].join('\n')
      );
    } else {
      this.synchronizeDebugBox();
    }
  }

  private formatTokenization(title: string, tokens: number[], tokenizer: Tokenizer): string {
    return [
      `${title} (${tokens.length} token${tokens.length === 1 ? '' : 's'}):`,
      ...tokens.map((token, index) => {
        const text = this.escapeTokenText(tokenizer.tokenTable[token] || '');
        return `${index.toString().padStart(2, ' ')}  ${token.toString().padStart(5, ' ')}  "${text}"`;
      })
    ].join('\n');
  }

  private async appendBufferStats(
    label: string,
    buffer: Buffer,
    elementCount: number,
    visualizationPixelBudget = VISUALIZATION_ACTIVATION_PIXEL_BUDGET,
    visualizationSpanOptions: VisualizationSpanOptions = {}
  ): Promise<void> {
    if (!this.isTensorInspectionEnabled()) {
      return;
    }

    const bytes = await buffer.readAsync(0, elementCount * Float32Array.BYTES_PER_ELEMENT);
    const values = new Float32Array(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    const stats = this.getValueStats(values);
    const visualizationSpan = this.appendTensorVisualization(
      label,
      values,
      stats,
      visualizationPixelBudget,
      visualizationSpanOptions
    );
    this.appendStatsLine(label, stats, visualizationSpan);
  }

  private getValueStats(values: ArrayLike<number>): ValueStats {
    let finiteCount = 0;
    let nanCount = 0;
    let positiveInfinityCount = 0;
    let negativeInfinityCount = 0;
    let zeroCount = 0;
    let minimum = Number.POSITIVE_INFINITY;
    let maximum = Number.NEGATIVE_INFINITY;
    let sum = 0;
    let absoluteMaximum = 0;
    let firstNonFiniteIndex: number | null = null;
    const samples: number[] = [];

    for (let index = 0; index < values.length; index++) {
      const value = values[index];
      if (samples.length < DEBUG_SAMPLE_COUNT) {
        samples.push(value);
      }

      if (Number.isFinite(value)) {
        finiteCount++;
        sum += value;
        minimum = Math.min(minimum, value);
        maximum = Math.max(maximum, value);
        absoluteMaximum = Math.max(absoluteMaximum, Math.abs(value));
        if (value === 0) {
          zeroCount++;
        }
      } else {
        firstNonFiniteIndex ??= index;
        if (Number.isNaN(value)) {
          nanCount++;
        } else if (value === Number.POSITIVE_INFINITY) {
          positiveInfinityCount++;
        } else {
          negativeInfinityCount++;
        }
      }
    }

    return {
      count: values.length,
      finiteCount,
      nanCount,
      positiveInfinityCount,
      negativeInfinityCount,
      zeroCount,
      minimum: finiteCount ? minimum : Number.NaN,
      maximum: finiteCount ? maximum : Number.NaN,
      mean: finiteCount ? sum / finiteCount : Number.NaN,
      absoluteMaximum,
      samples,
      firstNonFiniteIndex
    };
  }

  private formatStatsLine(label: string, stats: ValueStats): string {
    const samples = stats.samples.map(value => this.formatDebugNumber(value)).join(', ');
    const firstNonFinite =
      stats.firstNonFiniteIndex === null ? '' : ` firstNonFinite=${stats.firstNonFiniteIndex}`;

    return `${label}: count=${stats.count} finite=${stats.finiteCount} nan=${stats.nanCount} +inf=${stats.positiveInfinityCount} -inf=${stats.negativeInfinityCount} zero=${stats.zeroCount} min=${this.formatDebugNumber(stats.minimum)} max=${this.formatDebugNumber(stats.maximum)} mean=${this.formatDebugNumber(stats.mean)} absMax=${this.formatDebugNumber(stats.absoluteMaximum)}${firstNonFinite} samples=[${samples}]`;
  }

  private appendStatsLine(
    label: string,
    stats: ValueStats,
    visualizationSpan: VisualizationSpan | null
  ): void {
    if (!this.isTensorInspectionEnabled()) {
      return;
    }

    if (this.isDebugBoxEnabled()) {
      this.appendDebugLine(this.formatStatsLineWithPixels(label, stats, visualizationSpan));
    }
  }

  private formatStatsLineWithPixels(
    label: string,
    stats: ValueStats,
    visualizationSpan: VisualizationSpan | null
  ): string {
    const pixelLabel =
      visualizationSpan === null
        ? 'pixels off'
        : `pixels ${visualizationSpan.startCell.toString().padStart(5, ' ')}-${visualizationSpan.endCell.toString().padStart(5, ' ')} ${visualizationSpan.writtenCellCount}/${visualizationSpan.sourceValueCount}`;
    return `${pixelLabel}  ${this.formatStatsLine(label, stats)}`;
  }

  private appendTensorVisualization(
    label: string,
    values: ArrayLike<number>,
    stats: ValueStats | null,
    maximumCellCount: number,
    options: VisualizationSpanOptions = {}
  ): VisualizationSpan | null {
    if (!this.isCanvasVisualizationEnabled() || values.length === 0 || maximumCellCount <= 0) {
      return null;
    }

    this.appendVisualizationSeparator();
    const remainingCellCount = VISUALIZATION_CELL_COUNT - this.visualizationWriteIndex;
    if (remainingCellCount <= 0) {
      return null;
    }
    const writtenCellCount = Math.min(values.length, maximumCellCount, remainingCellCount);
    if (writtenCellCount === 0) {
      return null;
    }

    const startCell = this.visualizationWriteIndex;
    const absoluteMaximum = Math.max(
      stats?.absoluteMaximum || this.getSampledAbsoluteMaximum(values, writtenCellCount),
      1e-12
    );

    for (let cellOffset = 0; cellOffset < writtenCellCount; cellOffset++) {
      const sourceIndex =
        writtenCellCount === values.length
          ? cellOffset
          : Math.floor((cellOffset * (values.length - 1)) / Math.max(1, writtenCellCount - 1));
      const value = values[sourceIndex];
      const cellIndex = this.visualizationWriteIndex + cellOffset;
      const valueOffset = cellIndex * 2;

      if (!Number.isFinite(value)) {
        this.visualizationValues[valueOffset] = 1;
        this.visualizationValues[valueOffset + 1] = 3;
      } else if (value === 0) {
        this.visualizationValues[valueOffset] = 0.05;
        this.visualizationValues[valueOffset + 1] = 0.25;
      } else {
        this.visualizationValues[valueOffset] = Math.max(
          0.04,
          Math.sqrt(Math.min(1, Math.abs(value) / absoluteMaximum))
        );
        this.visualizationValues[valueOffset + 1] = value > 0 ? 1 : 2;
      }
    }

    this.visualizationWriteIndex += writtenCellCount;
    const endCell = this.visualizationWriteIndex - 1;
    this.visualizationDirty = true;

    const visualizationSpan = {
      label,
      startCell,
      endCell,
      writtenCellCount,
      sourceValueCount: values.length,
      sourceColumnCount: options.sourceColumnCount ?? null,
      contextTokens: options.contextTokens ? options.contextTokens.slice() : null,
      contextStartPosition: options.contextStartPosition ?? null
    };
    this.visualizationSpans.push(visualizationSpan);

    return visualizationSpan;
  }

  private appendVisualizationSeparator(): void {
    if (
      this.visualizationWriteIndex === 0 ||
      this.visualizationWriteIndex >= VISUALIZATION_CELL_COUNT ||
      VISUALIZATION_SPAN_SEPARATOR_CELL_COUNT <= 0
    ) {
      return;
    }

    const currentColumnIndex = this.visualizationWriteIndex % VISUALIZATION_COLUMN_COUNT;
    if (
      currentColumnIndex > 0 &&
      currentColumnIndex + VISUALIZATION_SPAN_SEPARATOR_CELL_COUNT > VISUALIZATION_COLUMN_COUNT
    ) {
      this.visualizationWriteIndex = Math.min(
        VISUALIZATION_CELL_COUNT,
        this.visualizationWriteIndex + VISUALIZATION_COLUMN_COUNT - currentColumnIndex
      );
    }
    if (this.visualizationWriteIndex >= VISUALIZATION_CELL_COUNT) {
      return;
    }

    const separatorCellCount = Math.min(
      VISUALIZATION_SPAN_SEPARATOR_CELL_COUNT,
      VISUALIZATION_CELL_COUNT - this.visualizationWriteIndex
    );
    for (let cellOffset = 0; cellOffset < separatorCellCount; cellOffset++) {
      const cellIndex = this.visualizationWriteIndex + cellOffset;
      const valueOffset = cellIndex * 2;
      this.visualizationValues[valueOffset] = 0;
      this.visualizationValues[valueOffset + 1] = 0;
    }

    this.visualizationWriteIndex += separatorCellCount;
  }

  private getSampledAbsoluteMaximum(values: ArrayLike<number>, sampleCount: number): number {
    let absoluteMaximum = 0;
    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
      const sourceIndex =
        sampleCount === values.length
          ? sampleIndex
          : Math.floor((sampleIndex * (values.length - 1)) / Math.max(1, sampleCount - 1));
      const value = values[sourceIndex];
      if (Number.isFinite(value)) {
        absoluteMaximum = Math.max(absoluteMaximum, Math.abs(value));
      }
    }
    return absoluteMaximum;
  }

  private formatDebugNumber(value: number): string {
    if (Number.isNaN(value)) {
      return 'NaN';
    }
    if (value === Number.POSITIVE_INFINITY) {
      return '+Inf';
    }
    if (value === Number.NEGATIVE_INFINITY) {
      return '-Inf';
    }
    if (Math.abs(value) >= 1000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) {
      return value.toExponential(4);
    }
    return value.toFixed(5);
  }

  private resetDebugLog(title: string, uploadEmptyVisualization = true): void {
    this.debugLines = [`=== ${title} ===`, `time: ${new Date().toISOString()}`];
    this.resetVisualization(uploadEmptyVisualization);
    this.synchronizeDebugBox();
  }

  private appendDebugLine(line: string): void {
    if (!this.isDebugBoxEnabled()) {
      return;
    }

    this.debugLines.push(line);
    this.writeDebugOutput(this.debugLines.join('\n'));
  }

  private writeDebugOutputIfEnabled(): void {
    if (this.isDebugBoxEnabled()) {
      this.writeDebugOutput(this.debugLines.join('\n'));
    }
  }

  private synchronizeDebugBox(): void {
    if (this.isDebugBoxEnabled()) {
      this.activateWorkspaceTab('debug-trace');
      this.writeDebugOutput(this.debugLines.join('\n'));
      return;
    }

    this.writeDebugOutput(
      [
        'Debug Trace disabled.',
        `Canvas tensor visualization: ${this.isCanvasVisualizationEnabled() ? 'enabled' : 'disabled'}.`,
        `Canvas atlas: ${VISUALIZATION_COLUMN_COUNT} x ${VISUALIZATION_ROW_COUNT} cells.`,
        `Tensor stats readbacks: ${this.isTensorInspectionEnabled() ? 'enabled' : 'disabled'}.`,
        'Enable Debug Trace to stream the detailed text log.'
      ].join('\n')
    );
  }

  private writeDebugOutput(message: string): void {
    const outputElement = document.getElementById('gpgpu-debug');

    if (outputElement) {
      outputElement.textContent = message;
    }
  }

  private async fetchArrayBuffer(url: string, label: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${label} file ${url}: ${response.status} ${response.statusText}`
      );
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? Number(contentLength) : null;
    const hasKnownTotal = totalBytes !== null && Number.isFinite(totalBytes) && totalBytes > 0;
    this.updateDownloadProgress(label, 0, hasKnownTotal ? totalBytes : null, 'loading');

    if (!response.body) {
      const arrayBuffer = await response.arrayBuffer();
      this.updateDownloadProgress(
        label,
        arrayBuffer.byteLength,
        hasKnownTotal ? totalBytes : arrayBuffer.byteLength,
        'complete'
      );
      return arrayBuffer;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    const mergedBytes = hasKnownTotal ? new Uint8Array(totalBytes) : null;
    let loadedBytes = 0;

    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }

      if (mergedBytes) {
        mergedBytes.set(value, loadedBytes);
      } else {
        chunks.push(value);
      }
      loadedBytes += value.byteLength;
      this.updateDownloadProgress(label, loadedBytes, hasKnownTotal ? totalBytes : null, 'loading');
    }

    const arrayBuffer = mergedBytes
      ? loadedBytes === mergedBytes.byteLength
        ? mergedBytes.buffer
        : mergedBytes.slice(0, loadedBytes).buffer
      : this.concatenateDownloadChunks(chunks, loadedBytes);

    this.updateDownloadProgress(
      label,
      loadedBytes,
      hasKnownTotal ? totalBytes : loadedBytes,
      'complete'
    );
    return arrayBuffer;
  }

  private concatenateDownloadChunks(chunks: Uint8Array[], byteLength: number): ArrayBuffer {
    const bytes = new Uint8Array(byteLength);
    let byteOffset = 0;

    for (const chunk of chunks) {
      bytes.set(chunk, byteOffset);
      byteOffset += chunk.byteLength;
    }

    return bytes.buffer;
  }

  private resetDownloadProgress(): void {
    this.updateDownloadProgress('model', 0, null, 'waiting');
    this.updateDownloadProgress('tokenizer', 0, null, 'waiting');
  }

  private updateDownloadProgress(
    label: string,
    loadedBytes: number,
    totalBytes: number | null,
    state: 'waiting' | 'loading' | 'complete'
  ): void {
    const statusElement = document.getElementById(`gpgpu-${label}-download-status`);
    const progressBarElement = document.getElementById(`gpgpu-${label}-download-bar`);
    const spinnerElement = document.getElementById(`gpgpu-${label}-spinner`);
    const loadingElement = document.getElementById('gpgpu-loading');

    if (loadingElement) {
      loadingElement.style.display = 'grid';
    }

    if (spinnerElement) {
      spinnerElement.style.animationPlayState = state === 'complete' ? 'paused' : 'running';
      spinnerElement.style.opacity = state === 'complete' ? '0.45' : '1';
    }

    if (progressBarElement) {
      if (totalBytes && totalBytes > 0) {
        const progressPercentage = Math.min(100, (loadedBytes / totalBytes) * 100);
        progressBarElement.style.width = `${progressPercentage.toFixed(1)}%`;
      } else if (state === 'complete') {
        progressBarElement.style.width = '100%';
      } else {
        progressBarElement.style.width = loadedBytes > 0 ? '35%' : '0%';
      }
    }

    if (statusElement) {
      if (state === 'waiting') {
        statusElement.textContent = 'Waiting';
      } else if (totalBytes && totalBytes > 0) {
        const progressPercentage = Math.min(100, (loadedBytes / totalBytes) * 100);
        statusElement.textContent =
          state === 'complete'
            ? `${this.formatByteCount(totalBytes)} ready`
            : `${progressPercentage.toFixed(1)}% · ${this.formatByteCount(loadedBytes)} / ${this.formatByteCount(totalBytes)}`;
      } else {
        statusElement.textContent =
          state === 'complete'
            ? `${this.formatByteCount(loadedBytes)} ready`
            : `${this.formatByteCount(loadedBytes)} downloaded`;
      }
    }
  }

  private formatByteCount(byteCount: number): string {
    if (byteCount >= 1024 * 1024 * 1024) {
      return `${(byteCount / (1024 * 1024 * 1024)).toFixed(2)} GiB`;
    }
    if (byteCount >= 1024 * 1024) {
      return `${(byteCount / (1024 * 1024)).toFixed(1)} MiB`;
    }
    if (byteCount >= 1024) {
      return `${(byteCount / 1024).toFixed(1)} KiB`;
    }
    return `${byteCount} B`;
  }

  private assertMinimumAssetByteLength(
    arrayBuffer: ArrayBuffer,
    minimumByteLength: number,
    label: string,
    url: string
  ): void {
    if (arrayBuffer.byteLength >= minimumByteLength) {
      return;
    }

    throw new Error(
      `Fetched ${label} file ${url}, but it only contained ${arrayBuffer.byteLength} bytes. ` +
        `Expected at least ${minimumByteLength} bytes. Check that the hosted ${label} binary is ` +
        'reachable and complete.'
    );
  }

  private updateDeviceInfo(message: string): void {
    const statusElement = document.getElementById('gpgpu-device');

    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  private writeOutput(message: string): void {
    const outputElement = document.getElementById('gpgpu-output');

    if (outputElement) {
      outputElement.innerHTML = [
        '<div class="gpgpu-output-layout">',
        '<section class="gpgpu-output-section">',
        '<div class="gpgpu-output-section-title">Output</div>',
        `<pre class="gpgpu-output-pre">${this.escapeHtml(message)}</pre>`,
        '</section>',
        '</div>'
      ].join('');
    }
  }

  private writeOutputHtml(message: string): void {
    const outputElement = document.getElementById('gpgpu-output');

    if (outputElement) {
      outputElement.innerHTML = message;
    }
  }

  private escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, character => {
      switch (character) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        case "'":
          return '&#39;';
        default:
          return character;
      }
    });
  }

  private mountVisualizationCanvas(): void {
    const canvasElement = document.querySelector<HTMLCanvasElement>('canvas');
    const visualizationHostElement = document.getElementById('gpgpu-visualization-host');

    if (!canvasElement || !visualizationHostElement) {
      return;
    }

    visualizationHostElement.replaceChildren(canvasElement);
  }

  private showVisualizationStage(): void {
    const loadingElement = document.getElementById('gpgpu-loading');
    const loadingStageElement = document.getElementById('gpgpu-loading-stage');
    const tabShellElement = document.getElementById('gpgpu-tab-shell');
    const visualizationHostElement = document.getElementById('gpgpu-visualization-host');

    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    if (loadingStageElement) {
      loadingStageElement.style.display = 'none';
    }
    if (tabShellElement) {
      tabShellElement.dataset.loading = 'false';
    }
    if (visualizationHostElement) {
      visualizationHostElement.style.display = 'block';
    }
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? `Error: ${error.message}` : `Error: ${String(error)}`;
  }

  private destroyModel(): void {
    if (!this.model) {
      return;
    }

    for (const chunk of this.model.tokenEmbeddingChunks) {
      chunk.buffer.destroy();
    }
    for (const layer of this.model.layers) {
      layer.layerNorm1Weight.destroy();
      layer.layerNorm1Bias.destroy();
      layer.queryKeyValueWeight.destroy();
      layer.queryKeyValueBias.destroy();
      layer.attentionProjectionWeight.destroy();
      layer.attentionProjectionBias.destroy();
      layer.layerNorm2Weight.destroy();
      layer.layerNorm2Bias.destroy();
      layer.feedForwardWeight.destroy();
      layer.feedForwardBias.destroy();
      layer.feedForwardProjectionWeight.destroy();
      layer.feedForwardProjectionBias.destroy();
    }
    this.model.finalLayerNormWeight.destroy();
    this.model.finalLayerNormBias.destroy();
    this.model.emptyBias.destroy();
    this.model = null;
  }

  private destroyTensors(): void {
    this.tensors?.residualA.destroy();
    this.tensors?.residualB.destroy();
    this.tensors?.normalized.destroy();
    this.tensors?.queryKeyValue.destroy();
    this.tensors?.attentionOutput.destroy();
    this.tensors?.feedForward.destroy();
    this.tensors?.feedForwardGelu.destroy();
    this.tensors?.logits.destroy();
    this.tensors?.computeParameters.destroy();
    this.tensors = null;
  }

  private destroyKernels(): void {
    this.kernels?.layerNorm.destroy();
    this.kernels?.matrixMultiply.destroy();
    this.kernels?.attention.destroy();
    this.kernels?.residualAdd.destroy();
    this.kernels?.gelu.destroy();
    this.kernels = null;
  }
}
