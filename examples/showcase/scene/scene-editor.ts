import {ANARI_SCENE_JSON_SCHEMA} from '@luma.gl/scene/schemas';
import {findNodeAtLocation, parseTree} from 'jsonc-parser';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JSONWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

type SchemaIssue = {
  message: string;
  path: readonly PropertyKey[];
};

const MODEL_URI = monaco.Uri.parse('inmemory://anari/scene.json');
const MARKER_OWNER = 'anari-scene';

Object.assign(globalThis, {
  MonacoEnvironment: {
    getWorker(_workerIdentifier: string, label: string): Worker {
      return label === 'json' ? new JSONWorker() : new EditorWorker();
    }
  }
});

monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  allowComments: false,
  schemaValidation: 'error',
  schemas: [
    {
      uri: ANARI_SCENE_JSON_SCHEMA.$id,
      fileMatch: [MODEL_URI.toString()],
      schema: ANARI_SCENE_JSON_SCHEMA
    }
  ]
});

monaco.editor.defineTheme('anari-scene-lab', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    {token: 'string.key.json', foreground: 'A6B7FF'},
    {token: 'string.value.json', foreground: 'B8E5B4'},
    {token: 'number.json', foreground: 'F2CB89'},
    {token: 'keyword.json', foreground: 'C7A8FF'},
    {token: 'delimiter.bracket.json', foreground: 'ADB6D7'}
  ],
  colors: {
    'editor.background': '#0D101A',
    'editor.foreground': '#CED7FF',
    'editorLineNumber.foreground': '#69718E',
    'editorLineNumber.activeForeground': '#A6B7FF',
    'editorCursor.foreground': '#C8B5FF',
    'editor.selectionBackground': '#6555A67A',
    'editor.lineHighlightBackground': '#FFFFFF08',
    'editorError.foreground': '#FF778F',
    'editorWarning.foreground': '#F2CB89',
    'editorWidget.background': '#121627',
    'editorWidget.border': '#8774DF45',
    'editorSuggestWidget.background': '#121627',
    'editorSuggestWidget.selectedBackground': '#8774DF33'
  }
});

export class ANARISceneEditor {
  private readonly sourceElement: HTMLTextAreaElement;
  private readonly container: HTMLDivElement;
  private readonly model: monaco.editor.ITextModel;
  private readonly editor: monaco.editor.IStandaloneCodeEditor;
  private readonly subscriptions: monaco.IDisposable[] = [];
  private updating = false;

  constructor(sourceElement: HTMLTextAreaElement, container: HTMLDivElement) {
    this.sourceElement = sourceElement;
    this.container = container;
    this.model =
      monaco.editor.getModel(MODEL_URI) || monaco.editor.createModel('', 'json', MODEL_URI);
    this.editor = monaco.editor.create(container, {
      model: this.model,
      theme: 'anari-scene-lab',
      automaticLayout: true,
      fontFamily: 'SFMono-Regular, Cascadia Code, JetBrains Mono, Consolas, monospace',
      fontSize: 11,
      lineHeight: 19,
      minimap: {enabled: false},
      scrollBeyondLastLine: false,
      padding: {top: 16, bottom: 16},
      lineNumbersMinChars: 3,
      glyphMargin: true,
      folding: true,
      renderValidationDecorations: 'on',
      quickSuggestions: {strings: true, comments: false, other: true},
      suggestOnTriggerCharacters: true,
      tabSize: 2,
      accessibilitySupport: 'auto',
      ariaLabel: 'ANARI scene JSON editor'
    });
    container.dataset['schema'] = ANARI_SCENE_JSON_SCHEMA.$id;
    container.dataset['markers'] = '0';
  }

  get value(): string {
    return this.model.getValue();
  }

  set value(value: string) {
    this.updating = true;
    this.model.setValue(value);
    this.sourceElement.value = value;
    this.updating = false;
    this.clearIssues();
  }

  get lineCount(): number {
    return this.model.getLineCount();
  }

  onChange(callback: () => void): void {
    this.subscriptions.push(
      this.model.onDidChangeContent(() => {
        this.sourceElement.value = this.model.getValue();
        if (!this.updating) {
          callback();
        }
      })
    );
  }

  onApply(callback: () => void): void {
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, callback);
  }

  setIssues(issues: readonly SchemaIssue[]): void {
    const syntaxTree = parseTree(this.value);
    const markers: monaco.editor.IMarkerData[] = issues.map(issue => {
      const path = issue.path.filter(
        (segment): segment is string | number =>
          typeof segment === 'string' || typeof segment === 'number'
      );
      const node = syntaxTree ? findNodeAtLocation(syntaxTree, path) || syntaxTree : undefined;
      const startPosition = this.model.getPositionAt(node?.offset || 0);
      const endPosition = this.model.getPositionAt((node?.offset || 0) + (node?.length || 1));
      return {
        severity: monaco.MarkerSeverity.Error,
        message: issue.message,
        source: 'ANARI schema',
        startLineNumber: startPosition.lineNumber,
        startColumn: startPosition.column,
        endLineNumber: endPosition.lineNumber,
        endColumn: endPosition.column
      };
    });
    monaco.editor.setModelMarkers(this.model, MARKER_OWNER, markers);
    this.container.dataset['markers'] = String(markers.length);
  }

  clearIssues(): void {
    monaco.editor.setModelMarkers(this.model, MARKER_OWNER, []);
    this.container.dataset['markers'] = '0';
  }

  dispose(): void {
    for (const subscription of this.subscriptions) {
      subscription.dispose();
    }
    this.editor.dispose();
    this.model.dispose();
  }
}
