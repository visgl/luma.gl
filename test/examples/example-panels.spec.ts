import {describe, expect, test, vi} from 'vitest';
import type {SettingsChangeDescriptor, SettingsSchema} from '@deck.gl-community/panels';
import * as arrow from 'apache-arrow';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getSettingDefinitions,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel,
  makeInlineSettingsSchema
} from '../../examples/example-panels';
import {
  ArrowExamplePanelManager,
  makeArrowExamplePanelHostHtml
} from '../../examples/arrow/arrow-example-panels';
import {
  getTextSpaceCrawlColorKind,
  setTextSpaceCrawlColorKind
} from '../../examples/text-space-crawl-color';
import {makeGltfSettingsSchema} from '../../examples/showcase/gltf/app';
import {
  flattenEffectSettings,
  makePostprocessingUniforms,
  unflattenEffectSettings,
  type EffectState
} from '../../examples/showcase/postprocessing/app';

const TEST_SETTINGS_SCHEMA: SettingsSchema = {
  title: 'Settings',
  sections: [
    {
      id: 'test',
      name: 'Test',
      initiallyCollapsed: false,
      settings: [
        {
          name: 'mode',
          label: 'Mode',
          type: 'select',
          persist: 'none',
          options: ['alpha', 'beta']
        }
      ]
    }
  ]
};

const MULTI_SELECT_SETTINGS_SCHEMA: SettingsSchema = {
  title: 'Settings',
  sections: [
    {
      id: 'test',
      name: 'Test',
      initiallyCollapsed: false,
      settings: [
        {
          name: 'mode',
          label: 'Mode',
          type: 'select',
          persist: 'none',
          options: ['alpha', 'beta']
        },
        {
          name: 'shape',
          label: 'Shape',
          type: 'select',
          persist: 'none',
          options: ['small', 'this-is-a-long-option-value']
        }
      ]
    }
  ]
};

describe('ExampleSettingsPanelManager', () => {
  test('registers descriptors and forwards structured changes', () => {
    const changes: SettingsChangeDescriptor[][] = [];
    const settingsPanel = new ExampleSettingsPanelManager({
      id: 'test-settings',
      schema: TEST_SETTINGS_SCHEMA,
      settings: {mode: 'alpha'},
      onSettingsChange: (_settings, changedSettings) => {
        changes.push(changedSettings || []);
      }
    });

    expect(getSettingDefinitions(TEST_SETTINGS_SCHEMA).get('mode')?.label).toBe('Mode');

    settingsPanel.setSettingValue('mode', 'beta');

    expect(changes).toEqual([
      [
        expect.objectContaining({
          type: 'setting',
          name: 'mode',
          previousValue: 'alpha',
          nextValue: 'beta'
        })
      ]
    ]);
    settingsPanel.finalize();
  });

  test('uses programmatic settings sync as the next change baseline', () => {
    const changes: SettingsChangeDescriptor[][] = [];
    const settingsPanel = new ExampleSettingsPanelManager({
      id: 'test-settings',
      schema: TEST_SETTINGS_SCHEMA,
      settings: {mode: 'alpha'},
      onSettingsChange: (_settings, changedSettings) => {
        changes.push(changedSettings || []);
      }
    });

    settingsPanel.setSettings({mode: 'beta'});
    settingsPanel.setSettingValue('mode', 'alpha');

    expect(changes[0]?.[0]).toEqual(
      expect.objectContaining({name: 'mode', previousValue: 'beta', nextValue: 'alpha'})
    );
    settingsPanel.finalize();
  });

  test('supports descriptor-aware local storage compatibility reads', () => {
    const storage = makeMemoryStorage({'test-settings': '{"mode":"beta"}'});
    const settingsPanel = new ExampleSettingsPanelManager({
      id: 'test-settings',
      schema: {
        ...TEST_SETTINGS_SCHEMA,
        sections: [
          {
            ...TEST_SETTINGS_SCHEMA.sections[0],
            settings: [
              {
                ...TEST_SETTINGS_SCHEMA.sections[0].settings[0],
                persist: 'local-storage'
              }
            ]
          }
        ]
      },
      settings: {mode: 'alpha'},
      localStorageConfig: {storageKey: 'test-settings', getStorage: () => storage}
    });

    expect(settingsPanel.getSettingsWithLocalStorage({mode: 'alpha'})).toEqual({mode: 'beta'});
    settingsPanel.finalize();
  });

  test('renders grouped schemas as one inline settings section', () => {
    expect(makeInlineSettingsSchema(TEST_SETTINGS_SCHEMA)).toEqual({
      title: 'Settings',
      sections: [
        {
          id: 'settings',
          name: '',
          initiallyCollapsed: false,
          settings: TEST_SETTINGS_SCHEMA.sections[0].settings
        }
      ]
    });
  });

  test('puts Arrow model settings before other flattened settings', () => {
    const inlineSchema = makeInlineSettingsSchema({
      title: 'Settings',
      sections: [
        {
          id: 'data',
          name: 'Data',
          settings: TEST_SETTINGS_SCHEMA.sections[0].settings
        },
        {
          id: 'renderer',
          name: 'Renderer',
          settings: [
            {
              name: 'modelKind',
              label: 'Model',
              type: 'select',
              persist: 'none',
              options: ['attribute', 'storage']
            }
          ]
        }
      ]
    });

    expect(inlineSchema.sections[0].settings.map(setting => setting.name)).toEqual([
      'modelKind',
      'mode'
    ]);
  });

  test('closes other dropdowns and lets open menus exceed the trigger width', async () => {
    document.body.innerHTML = makeExamplePanelHostHtml();
    const settingsPanel = new ExampleSettingsPanelManager({
      id: 'test-settings',
      schema: MULTI_SELECT_SETTINGS_SCHEMA,
      settings: {mode: 'alpha', shape: 'small'}
    });
    const panelManager = new ExamplePanelManager({panel: settingsPanel.makePanel()});
    panelManager.mount();

    try {
      const modeButton = getRequiredButton(document, '#settings-panel-input-mode');
      const shapeButton = getRequiredButton(document, '#settings-panel-input-shape');
      const modeLabel = getRequiredElement<HTMLLabelElement>(
        document,
        '[data-setting-row-for="mode"] > label'
      );
      const modeRoot = modeButton.parentElement;
      if (!modeRoot) {
        throw new Error('Expected mode select root');
      }
      vi.spyOn(modeRoot, 'getBoundingClientRect').mockReturnValue({
        bottom: 40,
        height: 32,
        left: 32,
        right: 152,
        top: 8,
        width: 120,
        x: 32,
        y: 8,
        toJSON: () => ({})
      } as DOMRect);

      modeLabel.click();
      await Promise.resolve();
      expect(document.body.querySelector('[role="listbox"]')).toBeNull();

      modeButton.click();
      await Promise.resolve();

      const modeListbox = getRequiredElement<HTMLDivElement>(
        document.body,
        '#settings-panel-input-mode-listbox'
      );
      expect(modeListbox.style.width).toBe('max-content');
      expect(modeListbox.style.minWidth).toBe('120px');
      expect(
        getRequiredElement<HTMLSpanElement>(modeListbox, 'button[role="option"] > span').style
          .textOverflow
      ).toBe('');

      shapeButton.dispatchEvent(new Event('pointerdown', {bubbles: true}));
      await Promise.resolve();
      expect(document.body.querySelector('#settings-panel-input-mode-listbox')).toBeNull();

      modeButton.click();
      await Promise.resolve();
      shapeButton.click();
      await Promise.resolve();
      expect(document.body.querySelectorAll('[role="listbox"]')).toHaveLength(1);
      expect(document.body.querySelector('#settings-panel-input-shape-listbox')).toBeTruthy();

      document.body.dispatchEvent(new Event('pointerdown', {bubbles: true}));
      await Promise.resolve();
      expect(document.body.querySelector('[role="listbox"]')).toBeNull();
    } finally {
      panelManager.finalize();
      settingsPanel.finalize();
      document.body.replaceChildren();
    }
  });
});

describe('ArrowExamplePanelManager', () => {
  test('renders description, settings, and tables tabs', () => {
    document.body.innerHTML = makeArrowExamplePanelHostHtml();
    const panelManager = new ArrowExamplePanelManager({
      descriptionHtml: '<p>Description</p>',
      settingsPanel: makeHtmlCustomPanel({
        id: 'test-arrow-settings',
        title: 'Settings',
        html: '<p>Settings</p>'
      })
    });

    panelManager.mount();

    expect(
      Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
        .map(tabElement => tabElement.textContent?.trim())
        .filter(tabLabel => ['Description', 'Settings', 'Tables'].includes(tabLabel || ''))
    ).toEqual(['Description', 'Settings', 'Tables']);
    expect(document.body.textContent).toContain('Description');

    panelManager.setTableEntries([
      {
        id: 'test-table',
        label: 'Loaded point source',
        kind: 'source',
        table: arrow.tableFromArrays({value: [1, 2]})
      }
    ]);

    expect(document.body.textContent).not.toContain('Refresh preview');
    expect(document.querySelector('[data-arrow-example-table-refresh]')).toBeNull();

    panelManager.finalize();
    document.body.replaceChildren();
  });
});

describe('text 3D crawl color compatibility', () => {
  test('keeps the existing crawlColor URL and localStorage behavior', () => {
    const storage = makeMemoryStorage();
    const replaceStateCalls: string[] = [];
    const currentWindow = {
      location: {pathname: '/examples/experimental/text-space-crawl', search: '', hash: '#demo'},
      localStorage: storage,
      history: {
        replaceState: (_state: unknown, _title: string, url: string) => {
          replaceStateCalls.push(url);
        }
      }
    } as Pick<Window, 'history' | 'localStorage' | 'location'>;

    setTextSpaceCrawlColorKind('yellow', currentWindow);

    expect(storage.getItem('text-space-crawl-color')).toBe('yellow');
    expect(replaceStateCalls).toEqual([
      '/examples/experimental/text-space-crawl?crawlColor=yellow#demo'
    ]);
    currentWindow.location.search = '?crawlColor=yellow';
    expect(getTextSpaceCrawlColorKind(currentWindow)).toBe('yellow');
  });
});

describe('postprocessing effect settings', () => {
  test('flattens and restores vector settings as scalar panel settings', () => {
    const effectState: EffectState = {
      amount: 0.5,
      center: [0.25, 0.75, 1, 0]
    };

    const flattenedSettings = flattenEffectSettings('warp', effectState);
    const restoredEffectState = unflattenEffectSettings('warp', flattenedSettings, effectState);

    expect(flattenedSettings).toEqual({
      warp__amount: 0.5,
      warp__center__0: 0.25,
      warp__center__1: 0.75,
      warp__center__2: 1,
      warp__center__3: 0
    });
    expect(restoredEffectState).toEqual(effectState);
  });

  test('passes selected effect settings as per-draw shader uniforms', () => {
    const effectState: EffectState = {amount: 0.5};
    const shaderPass = {name: 'warp', passes: [{sampler: true}]} as const;

    expect(
      makePostprocessingUniforms('warpExport', {warpExport: effectState}, {warpExport: shaderPass})
    ).toEqual({warp: effectState});
  });
});

describe('glTF controls', () => {
  test('keeps the model selector in the settings schema', () => {
    expect(getSettingDefinitions(makeGltfSettingsSchema()).get('modelValue')).toEqual(
      expect.objectContaining({
        label: 'Model',
        options: [{label: 'Loading models...', value: 'loading-models'}]
      })
    );
  });
});

function makeMemoryStorage(initialValues: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initialValues));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => Array.from(values.keys())[index] ?? null,
    removeItem: key => values.delete(key),
    setItem: (key, value) => values.set(key, value)
  };
}

function getRequiredButton(root: ParentNode, selector: string): HTMLButtonElement {
  return getRequiredElement<HTMLButtonElement>(root, selector);
}

function getRequiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Expected element matching selector: ${selector}`);
  }
  return element;
}
