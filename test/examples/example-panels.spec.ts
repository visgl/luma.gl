import {describe, expect, test, vi} from 'vitest';
import type {SettingsChangeDescriptor, SettingsSchema} from '@deck.gl-community/panels';
import * as arrow from 'apache-arrow';
import {
  configurePanelHostElement,
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getSettingDefinitions,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel,
  makeInlineSettingsSchema
} from '../../examples/example-panels';
import {applyExampleTheme, EXAMPLE_THEME_TOKENS} from '../../examples/example-theme';
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
  getEffectResolutionScale,
  makePostprocessingUniforms,
  reorderEffectPassNames,
  unflattenEffectSettings,
  updateEffectPassNames,
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
  test('applies the shared cinematic semantic visual tokens', () => {
    const hostElement = document.createElement('div');

    applyExampleTheme(hostElement, 'cinematic');

    expect(hostElement.style.getPropertyValue('--luma-example-surface')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.surface
    );
    expect(hostElement.style.getPropertyValue('--luma-example-surface-raised')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.surfaceRaised
    );
    expect(hostElement.style.getPropertyValue('--luma-example-border')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.border
    );
    expect(hostElement.style.getPropertyValue('--luma-example-text')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.text
    );
    expect(hostElement.style.getPropertyValue('--luma-example-text-muted')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.textMuted
    );
    expect(hostElement.style.getPropertyValue('--luma-example-accent')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.accent
    );
    expect(hostElement.style.getPropertyValue('--luma-example-radius')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.radius
    );
    expect(hostElement.style.getPropertyValue('--luma-example-shadow')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.shadow
    );
    expect(hostElement.style.getPropertyValue('--luma-example-backdrop')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.backdrop
    );
  });

  test('replaces cinematic visual tokens with the light appearance', () => {
    const hostElement = document.createElement('div');

    applyExampleTheme(hostElement, 'cinematic');
    applyExampleTheme(hostElement, 'light');

    expect(hostElement.style.getPropertyValue('--luma-example-surface')).toBe(
      EXAMPLE_THEME_TOKENS.light.surface
    );
    expect(hostElement.style.getPropertyValue('--luma-example-surface-raised')).toBe(
      EXAMPLE_THEME_TOKENS.light.surfaceRaised
    );
    expect(hostElement.style.getPropertyValue('--luma-example-border')).toBe(
      EXAMPLE_THEME_TOKENS.light.border
    );
    expect(hostElement.style.getPropertyValue('--luma-example-text')).toBe(
      EXAMPLE_THEME_TOKENS.light.text
    );
    expect(hostElement.style.getPropertyValue('--luma-example-text-muted')).toBe(
      EXAMPLE_THEME_TOKENS.light.textMuted
    );
    expect(hostElement.style.getPropertyValue('--luma-example-accent')).toBe(
      EXAMPLE_THEME_TOKENS.light.accent
    );
    expect(hostElement.style.getPropertyValue('--luma-example-radius')).toBe(
      EXAMPLE_THEME_TOKENS.light.radius
    );
    expect(hostElement.style.getPropertyValue('--luma-example-shadow')).toBe(
      EXAMPLE_THEME_TOKENS.light.shadow
    );
    expect(hostElement.style.getPropertyValue('--luma-example-backdrop')).toBe(
      EXAMPLE_THEME_TOKENS.light.backdrop
    );
  });

  test('configures the shared cinematic card appearance for panel content', () => {
    const hostElement = document.createElement('div');

    configurePanelHostElement(hostElement, 'cinematic');

    expect(hostElement.dataset.examplePanelHost).toBe('');
    expect(hostElement.dataset.examplePanelAppearance).toBe('cinematic');
    expect(hostElement.style.getPropertyValue('--menu-background')).toBe('rgb(8, 15, 27)');
    expect(hostElement.style.getPropertyValue('--menu-shadow')).toBe('none');
    expect(hostElement.style.getPropertyValue('--luma-example-surface')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.surface
    );
    expect(hostElement.style.getPropertyValue('--luma-example-accent')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.accent
    );

    const cardElement = document.createElement('section');
    const inheritedHostElement = document.createElement('div');
    cardElement.dataset.infoBoxAppearance = 'cinematic';
    cardElement.appendChild(inheritedHostElement);
    configurePanelHostElement(inheritedHostElement);

    expect(inheritedHostElement.dataset.examplePanelAppearance).toBe('cinematic');
    expect(inheritedHostElement.style.getPropertyValue('--luma-example-surface')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.surface
    );
    expect(inheritedHostElement.style.getPropertyValue('--luma-example-backdrop')).toBe(
      EXAMPLE_THEME_TOKENS.cinematic.backdrop
    );
  });

  test('inherits the light appearance and preserves the panel framework background', () => {
    const cardElement = document.createElement('section');
    const hostElement = document.createElement('div');
    cardElement.dataset.infoBoxAppearance = 'light';
    cardElement.appendChild(hostElement);

    configurePanelHostElement(hostElement);

    expect(hostElement.dataset.examplePanelAppearance).toBe('light');
    expect(hostElement.style.getPropertyValue('--luma-example-surface')).toBe(
      EXAMPLE_THEME_TOKENS.light.surface
    );
    expect(hostElement.style.getPropertyValue('--luma-example-text')).toBe(
      EXAMPLE_THEME_TOKENS.light.text
    );
    expect(hostElement.style.getPropertyValue('--menu-background')).toBe('rgb(255, 255, 255)');
  });

  test('leaves unthemed hosts available for inherited semantic visual tokens', () => {
    const hostElement = document.createElement('div');

    configurePanelHostElement(hostElement);

    expect(hostElement.dataset.examplePanelAppearance).toBe('inherit');
    expect(hostElement.style.getPropertyValue('--luma-example-surface')).toBe('');
    expect(hostElement.style.getPropertyValue('--luma-example-accent')).toBe('');
    expect(hostElement.style.getPropertyValue('--menu-background')).toBe('transparent');
  });

  test.each([
    'cinematic',
    'light'
  ] as const)('clears stale %s tokens when returning to inherited appearance', appearance => {
    const ancestorElement = document.createElement('section');
    const hostElement = document.createElement('div');
    ancestorElement.style.setProperty('--luma-example-surface', 'rgb(19, 41, 61)');
    ancestorElement.style.setProperty('--luma-example-accent', 'rgb(203, 157, 93)');
    ancestorElement.appendChild(hostElement);
    document.body.appendChild(ancestorElement);

    try {
      configurePanelHostElement(hostElement, appearance);
      expect(hostElement.style.getPropertyValue('--luma-example-surface')).toBe(
        EXAMPLE_THEME_TOKENS[appearance].surface
      );

      configurePanelHostElement(hostElement, 'inherit');

      for (const customProperty of [
        '--luma-example-surface',
        '--luma-example-surface-raised',
        '--luma-example-border',
        '--luma-example-text',
        '--luma-example-text-muted',
        '--luma-example-accent',
        '--luma-example-radius',
        '--luma-example-shadow',
        '--luma-example-backdrop'
      ]) {
        expect(hostElement.style.getPropertyValue(customProperty)).toBe('');
      }
      expect(hostElement.dataset.examplePanelAppearance).toBe('inherit');
      expect(hostElement.style.getPropertyValue('--menu-background')).toBe('transparent');
      expect(getComputedStyle(hostElement).getPropertyValue('--luma-example-surface').trim()).toBe(
        'rgb(19, 41, 61)'
      );
      expect(getComputedStyle(hostElement).getPropertyValue('--luma-example-accent').trim()).toBe(
        'rgb(203, 157, 93)'
      );
    } finally {
      ancestorElement.remove();
    }
  });

  test.each([
    'cinematic',
    'light'
  ] as const)('renders shared source code with the inherited %s visual theme', async appearance => {
    const exampleWindow = window as Window & {website?: boolean};
    const previousWebsiteState = exampleWindow.website;
    const previousUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const fetchMock = vi
      .spyOn(window, 'fetch')
      .mockResolvedValue(new Response('export const sourceTheme = true;'));
    let panelManager: ExamplePanelManager | null = null;

    exampleWindow.website = true;
    window.history.pushState(null, '', '/examples/showcase/persistence');
    document.body.innerHTML = `<section data-info-box-appearance="${appearance}">${makeExamplePanelHostHtml()}</section>`;

    try {
      panelManager = new ExamplePanelManager({
        panel: makeExampleTabbedPanel({
          id: 'themed-source-tabs',
          title: 'Themed example source',
          panels: [
            makeHtmlCustomPanel({
              id: 'themed-overview',
              title: 'Overview',
              html: '<p>Overview</p>'
            })
          ]
        })
      });
      panelManager.mount();

      const sourceButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
        button => button.textContent?.trim() === 'Source'
      );
      if (!sourceButton) {
        throw new Error('Expected the shared source panel tab.');
      }
      sourceButton.click();

      await vi.waitFor(() => {
        const sourceViewer = document.querySelector<HTMLElement>('[data-example-source-viewer]');
        expect(sourceViewer?.textContent).toContain('export const sourceTheme = true;');
        expect(sourceViewer?.style.background).toContain('var(--luma-example-surface');
        expect(sourceViewer?.style.color).toContain('var(--luma-example-text');
        expect(sourceViewer && getComputedStyle(sourceViewer).backgroundColor).toBe(
          EXAMPLE_THEME_TOKENS[appearance].surface
        );
        expect(sourceViewer && getComputedStyle(sourceViewer).color).toBe(
          EXAMPLE_THEME_TOKENS[appearance].text
        );
      });
    } finally {
      panelManager?.finalize();
      fetchMock.mockRestore();
      document.body.replaceChildren();
      window.history.replaceState(null, '', previousUrl);
      if (previousWebsiteState === undefined) {
        delete exampleWindow.website;
      } else {
        exampleWindow.website = previousWebsiteState;
      }
    }
  });

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

  test('preserves named effect sections as independently collapsible accordions', async () => {
    document.body.innerHTML = makeExamplePanelHostHtml();
    const settingsPanel = new ExampleSettingsPanelManager({
      id: 'effect-settings',
      sectionPresentation: 'accordion',
      schema: {
        title: 'Rendering Effects',
        sections: [
          {
            id: 'lighting',
            name: 'Clustered Deferred Lighting',
            description: 'Hundreds of local lights.',
            initiallyCollapsed: false,
            settings: TEST_SETTINGS_SCHEMA.sections[0].settings
          },
          {
            id: 'reflections',
            name: 'Screen-space Reflections · SSR',
            description: 'Temporally stabilized glossy reflections.',
            initiallyCollapsed: true,
            settings: [
              {
                name: 'reflectionsEnabled',
                label: 'Enable Reflections',
                type: 'boolean',
                persist: 'none'
              }
            ]
          }
        ]
      },
      settings: {mode: 'alpha', reflectionsEnabled: true}
    });
    const panelManager = new ExamplePanelManager({panel: settingsPanel.makePanel()});
    panelManager.mount();

    try {
      const sectionButtons = Array.from(
        document.body.querySelectorAll('button[aria-expanded]')
      ).filter(
        button =>
          button.textContent?.includes('Clustered Deferred Lighting') ||
          button.textContent?.includes('Screen-space Reflections · SSR')
      );
      expect(sectionButtons.map(button => button.textContent)).toEqual([
        expect.stringContaining('Clustered Deferred Lighting'),
        expect.stringContaining('Screen-space Reflections · SSR')
      ]);
      expect(sectionButtons[0].getAttribute('aria-expanded')).toBe('true');
      expect(sectionButtons[1].getAttribute('aria-expanded')).toBe('false');
      const selectButton = document.body.querySelector(
        '[data-setting-row-for="mode"] button[aria-haspopup="listbox"]'
      );
      expect(selectButton).toBeTruthy();
      expect(selectButton?.matches("button[aria-expanded]:not([aria-haspopup='listbox'])")).toBe(
        false
      );
      expect(document.body.querySelector('[data-setting-row-for="reflectionsEnabled"]')).toBeNull();

      sectionButtons[1].dispatchEvent(new MouseEvent('click', {bubbles: true}));
      await Promise.resolve();

      expect(sectionButtons[1].getAttribute('aria-expanded')).toBe('true');
      expect(
        document.body.querySelector('[data-setting-row-for="reflectionsEnabled"]')
      ).toBeTruthy();
      expect(sectionButtons[0].getAttribute('aria-expanded')).toBe('true');
    } finally {
      panelManager.finalize();
      settingsPanel.finalize();
      document.body.replaceChildren();
    }
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
  test('renders empty and inexpensive effect stacks at native resolution', () => {
    expect(getEffectResolutionScale([])).toBe(1);
    expect(getEffectResolutionScale(['bloom', 'vignette'])).toBe(1);
  });

  test('restores native resolution when expensive preset effects are removed', () => {
    const dreamZoomPassNames = ['zoomBlur', 'vignette'];
    const graphicInkPassNames = ['brightnessContrast', 'ink'];

    expect(getEffectResolutionScale(dreamZoomPassNames)).toBe(0.65);
    expect(
      getEffectResolutionScale(updateEffectPassNames(dreamZoomPassNames, 'zoomBlur', false))
    ).toBe(1);
    expect(getEffectResolutionScale(graphicInkPassNames)).toBe(0.75);
    expect(getEffectResolutionScale(updateEffectPassNames(graphicInkPassNames, 'ink', false))).toBe(
      1
    );
  });

  test('adapts resolution as expensive effects are added and removed', () => {
    const inexpensivePassNames = ['vignette'];
    const inkPassNames = updateEffectPassNames(inexpensivePassNames, 'ink', true);
    const zoomPassNames = updateEffectPassNames(inkPassNames, 'zoomBlur', true);

    expect(getEffectResolutionScale(inkPassNames)).toBe(0.75);
    expect(getEffectResolutionScale(zoomPassNames)).toBe(0.65);
    expect(getEffectResolutionScale(updateEffectPassNames(zoomPassNames, 'zoomBlur', false))).toBe(
      0.75
    );
    expect(getEffectResolutionScale(updateEffectPassNames(['ink'], 'ink', false))).toBe(1);
  });

  test('adds effects to the stack only once', () => {
    const activePassNames = ['bloom', 'vignette'];

    expect(updateEffectPassNames(activePassNames, 'sepia', true)).toEqual([
      'bloom',
      'vignette',
      'sepia'
    ]);
    expect(updateEffectPassNames(activePassNames, 'bloom', true)).toEqual(['bloom', 'vignette']);
    expect(activePassNames).toEqual(['bloom', 'vignette']);
  });

  test('removes effects without changing the remaining stack order', () => {
    const activePassNames = ['bloom', 'vignette', 'sepia'];

    expect(updateEffectPassNames(activePassNames, 'vignette', false)).toEqual(['bloom', 'sepia']);
    expect(updateEffectPassNames(activePassNames, 'noise', false)).toEqual([
      'bloom',
      'vignette',
      'sepia'
    ]);
    expect(activePassNames).toEqual(['bloom', 'vignette', 'sepia']);
  });

  test('moves active effects earlier and later in the stack', () => {
    const activePassNames = ['bloom', 'vignette', 'sepia'];

    expect(reorderEffectPassNames(activePassNames, 'vignette', -1)).toEqual([
      'vignette',
      'bloom',
      'sepia'
    ]);
    expect(reorderEffectPassNames(activePassNames, 'vignette', 1)).toEqual([
      'bloom',
      'sepia',
      'vignette'
    ]);
    expect(activePassNames).toEqual(['bloom', 'vignette', 'sepia']);
  });

  test('keeps effects within the stack bounds when reordering', () => {
    const activePassNames = ['bloom', 'vignette', 'sepia'];

    expect(reorderEffectPassNames(activePassNames, 'bloom', -1)).toEqual(activePassNames);
    expect(reorderEffectPassNames(activePassNames, 'sepia', 1)).toEqual(activePassNames);
    expect(reorderEffectPassNames(activePassNames, 'noise', -1)).toEqual(activePassNames);
  });

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
