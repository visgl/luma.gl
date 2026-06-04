// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ArrowBatchesPanel,
  ArrowSchemaPanel,
  ArrowTablePanel,
  ColumnPanel,
  CustomPanel,
  PanelBox,
  PanelManager,
  TabbedPanel,
  type Panel
} from '@deck.gl-community/panels';
import * as arrow from 'apache-arrow';

const ARROW_EXAMPLE_PANEL_HOST_ID = 'arrow-example-panel-host';
const ARROW_EXAMPLE_PANEL_BOX_ID = 'arrow-example-panel-box';
const ARROW_EXAMPLE_CONTROLS_PANEL_ID = 'arrow-example-controls';
const ARROW_EXAMPLE_TABLES_PANEL_ID = 'arrow-example-tables';
const ARROW_EXAMPLE_PANEL_BOX_WIDTH_PX = 388;
const ARROW_EXAMPLE_TABLE_PREVIEW_ROW_LIMIT = 50;
const ARROW_EXAMPLE_TABLE_PREVIEW_NESTED_ITEM_LIMIT = 6;

export type ArrowExampleTableKind = 'source' | 'derived';

export type ArrowExampleTableEntry = {
  id: string;
  label: string;
  kind: ArrowExampleTableKind;
  table: arrow.Table;
  status?: string;
};

export type ArrowExampleLoadedTableStream = {
  setLoadedBatchCount: (loadedBatchCount: number) => void;
};

type BeginLoadedTableStreamProps = Omit<ArrowExampleTableEntry, 'table'> & {
  recordBatches: readonly arrow.RecordBatch[];
};

/** Returns the InfoBox host used by panel-managed Arrow example content. */
export function makeArrowExamplePanelHostHtml(): string {
  return `<div id="${ARROW_EXAMPLE_PANEL_HOST_ID}" data-arrow-example-panel-host=""></div>`;
}

/** Owns panel-managed controls plus CPU Arrow table inspection for one Arrow example. */
export class ArrowExamplePanelManager {
  private readonly controlsHtml: string;
  private readonly tableEntries = new Map<string, ArrowExampleTableEntry>();
  private readonly selectedBatchIndexByTableId = new Map<string, number>();
  private readonly activeStreamVersionByTableId = new Map<string, number>();
  private nextStreamVersion = 0;
  private hostElement: HTMLElement | null = null;
  private panelManager: PanelManager | null = null;

  constructor({controlsHtml}: {controlsHtml: string}) {
    this.controlsHtml = controlsHtml;
  }

  mount(): void {
    if (this.panelManager || typeof document === 'undefined') {
      return;
    }

    const hostElement = document.getElementById(ARROW_EXAMPLE_PANEL_HOST_ID);
    if (!(hostElement instanceof HTMLElement)) {
      return;
    }

    this.hostElement = hostElement;
    configurePanelHostElement(hostElement);
    this.panelManager = new PanelManager({parentElement: hostElement});
    this.render();
  }

  finalize(): void {
    this.panelManager?.finalize();
    this.panelManager = null;
    this.hostElement = null;
  }

  setTableEntries(tableEntries: readonly ArrowExampleTableEntry[]): void {
    this.tableEntries.clear();
    for (const tableEntry of tableEntries) {
      this.tableEntries.set(tableEntry.id, tableEntry);
    }
    this.pruneTableState();
    this.render();
  }

  upsertTableEntry(tableEntry: ArrowExampleTableEntry): void {
    this.tableEntries.set(tableEntry.id, tableEntry);
    this.clampSelectedBatchIndex(tableEntry);
    this.render();
  }

  removeTableEntry(tableId: string): void {
    if (!this.tableEntries.delete(tableId)) {
      return;
    }
    this.selectedBatchIndexByTableId.delete(tableId);
    this.activeStreamVersionByTableId.delete(tableId);
    this.render();
  }

  beginLoadedTableStream({
    recordBatches,
    ...tableEntry
  }: BeginLoadedTableStreamProps): ArrowExampleLoadedTableStream {
    const streamVersion = ++this.nextStreamVersion;
    this.activeStreamVersionByTableId.set(tableEntry.id, streamVersion);
    const schema = recordBatches[0]?.schema ?? new arrow.Schema([]);
    const totalBatchCount = recordBatches.length;

    const setLoadedBatchCount = (loadedBatchCount: number): void => {
      if (this.activeStreamVersionByTableId.get(tableEntry.id) !== streamVersion) {
        return;
      }

      const effectiveLoadedBatchCount = Math.min(
        totalBatchCount,
        Math.max(0, Math.floor(loadedBatchCount))
      );
      this.upsertTableEntry({
        ...tableEntry,
        table: new arrow.Table(schema, recordBatches.slice(0, effectiveLoadedBatchCount)),
        status: `${effectiveLoadedBatchCount.toLocaleString()} / ${totalBatchCount.toLocaleString()} batches loaded`
      });
    };

    setLoadedBatchCount(0);
    return {setLoadedBatchCount};
  }

  refresh(): void {
    this.render();
  }

  private readonly renderControlsHtml = (rootElement: HTMLElement): (() => void) => {
    rootElement.innerHTML = this.controlsHtml;
    return () => rootElement.replaceChildren();
  };

  private render(): void {
    if (!this.panelManager || !this.hostElement) {
      return;
    }

    this.panelManager.setProps({
      components: [
        new PanelBox({
          id: ARROW_EXAMPLE_PANEL_BOX_ID,
          _container: this.hostElement as HTMLDivElement,
          widthPx: ARROW_EXAMPLE_PANEL_BOX_WIDTH_PX,
          collapsible: false,
          panel: new TabbedPanel({
            id: 'arrow-example-root-tabs',
            title: 'Arrow example',
            tabListLayout: 'wrap',
            panels: [
              new CustomPanel({
                id: ARROW_EXAMPLE_CONTROLS_PANEL_ID,
                title: 'Controls',
                onRenderHTML: this.renderControlsHtml
              }),
              this.makeTablesPanel()
            ]
          })
        })
      ]
    });
  }

  private makeTablesPanel(): Panel {
    const tableEntries = Array.from(this.tableEntries.values());
    if (tableEntries.length === 0) {
      return new CustomPanel({
        id: ARROW_EXAMPLE_TABLES_PANEL_ID,
        title: 'Tables',
        onRenderHTML: rootElement => {
          rootElement.innerHTML =
            '<p style="margin: 0; color: #475569; font: 500 12px/1.45 system-ui, sans-serif;">Waiting for Arrow table data.</p>';
        }
      });
    }

    const tablePanels = tableEntries.map(tableEntry => this.makeTablePanel(tableEntry));
    const tablePanel =
      tablePanels.length === 1
        ? tablePanels[0]
        : new TabbedPanel({
            id: 'arrow-example-table-tabs',
            title: 'Tables',
            tabListLayout: 'wrap',
            panels: tablePanels
          });

    return new ColumnPanel({
      id: ARROW_EXAMPLE_TABLES_PANEL_ID,
      title: 'Tables',
      panels: [tablePanel]
    });
  }

  private makeTablePanel(tableEntry: ArrowExampleTableEntry): Panel {
    const selectedBatchIndex = this.selectedBatchIndexByTableId.get(tableEntry.id);
    return new ColumnPanel({
      id: `${tableEntry.id}-panel`,
      title: tableEntry.label,
      panels: [
        new CustomPanel({
          id: `${tableEntry.id}-summary`,
          title: '',
          onRenderHTML: rootElement =>
            renderTableSummary(rootElement, tableEntry, selectedBatchIndex, {
              onResetBatchSelection: () => this.resetBatchSelection(tableEntry.id),
              onRefresh: () => this.refresh()
            })
        }),
        new ArrowBatchesPanel({
          id: `${tableEntry.id}-batches`,
          title: 'Batches',
          table: tableEntry.table,
          selectedBatchIndex,
          onBatchSelect: batchIndex => this.selectBatch(tableEntry.id, batchIndex)
        }),
        new ArrowTablePanel({
          id: `${tableEntry.id}-contents`,
          title: 'Contents',
          table: tableEntry.table,
          batchIndex: selectedBatchIndex ?? 'all',
          showRowIndex: true,
          maxRows: ARROW_EXAMPLE_TABLE_PREVIEW_ROW_LIMIT,
          maxNestedItems: ARROW_EXAMPLE_TABLE_PREVIEW_NESTED_ITEM_LIMIT
        }),
        new ArrowSchemaPanel({
          id: `${tableEntry.id}-schema`,
          title: 'Schema',
          schema: tableEntry.table.schema
        })
      ]
    });
  }

  private selectBatch(tableId: string, batchIndex: number): void {
    const tableEntry = this.tableEntries.get(tableId);
    if (!tableEntry || batchIndex < 0 || batchIndex >= tableEntry.table.batches.length) {
      return;
    }
    this.selectedBatchIndexByTableId.set(tableId, batchIndex);
    this.render();
  }

  private resetBatchSelection(tableId: string): void {
    if (!this.selectedBatchIndexByTableId.delete(tableId)) {
      return;
    }
    this.render();
  }

  private clampSelectedBatchIndex(tableEntry: ArrowExampleTableEntry): void {
    const selectedBatchIndex = this.selectedBatchIndexByTableId.get(tableEntry.id);
    if (selectedBatchIndex !== undefined && selectedBatchIndex >= tableEntry.table.batches.length) {
      this.selectedBatchIndexByTableId.delete(tableEntry.id);
    }
  }

  private pruneTableState(): void {
    for (const tableId of this.selectedBatchIndexByTableId.keys()) {
      if (!this.tableEntries.has(tableId)) {
        this.selectedBatchIndexByTableId.delete(tableId);
      }
    }
    for (const tableId of this.activeStreamVersionByTableId.keys()) {
      if (!this.tableEntries.has(tableId)) {
        this.activeStreamVersionByTableId.delete(tableId);
      }
    }
    for (const tableEntry of this.tableEntries.values()) {
      this.clampSelectedBatchIndex(tableEntry);
    }
  }
}

function configurePanelHostElement(hostElement: HTMLElement): void {
  hostElement.style.minWidth = '0';
  hostElement.style.setProperty('--menu-backdrop-filter', 'unset');
  hostElement.style.setProperty('--menu-background', 'transparent');
  hostElement.style.setProperty('--menu-border', 'none');
  hostElement.style.setProperty('--menu-shadow', 'none');
}

function renderTableSummary(
  rootElement: HTMLElement,
  tableEntry: ArrowExampleTableEntry,
  selectedBatchIndex: number | undefined,
  handlers: {
    onRefresh: () => void;
    onResetBatchSelection: () => void;
  }
): () => void {
  const kindLabel = tableEntry.kind === 'derived' ? 'Derived CPU Arrow' : 'Source CPU Arrow';
  const status = tableEntry.status ? `<span>${escapeHtml(tableEntry.status)}</span>` : '';
  const batchSelection =
    selectedBatchIndex === undefined
      ? 'Showing all loaded rows'
      : `Showing batch ${selectedBatchIndex.toLocaleString()}`;
  rootElement.innerHTML = `\
<div style="display: grid; gap: 8px; color: #334155; font: 500 12px/1.45 system-ui, sans-serif;">
  <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
    <span style="padding: 2px 6px; border-radius: 999px; background: #e2e8f0; color: #0f172a; font-weight: 700;">${escapeHtml(kindLabel)}</span>
    <span>${escapeHtml(batchSelection)}</span>
    ${status}
  </div>
  <div style="display: flex; flex-wrap: wrap; gap: 6px;">
    <button type="button" data-arrow-example-table-refresh="" style="${getActionButtonStyle()}">Refresh preview</button>
    ${
      selectedBatchIndex === undefined
        ? ''
        : `<button type="button" data-arrow-example-table-all-rows="" style="${getActionButtonStyle()}">All loaded rows</button>`
    }
  </div>
</div>`;

  const refreshButton = rootElement.querySelector<HTMLButtonElement>(
    '[data-arrow-example-table-refresh]'
  );
  const allRowsButton = rootElement.querySelector<HTMLButtonElement>(
    '[data-arrow-example-table-all-rows]'
  );
  refreshButton?.addEventListener('click', handlers.onRefresh);
  allRowsButton?.addEventListener('click', handlers.onResetBatchSelection);

  return () => {
    refreshButton?.removeEventListener('click', handlers.onRefresh);
    allRowsButton?.removeEventListener('click', handlers.onResetBatchSelection);
    rootElement.replaceChildren();
  };
}

function getActionButtonStyle(): string {
  return [
    'min-height: 28px',
    'padding: 0 8px',
    'border: 1px solid #cbd5e1',
    'border-radius: 6px',
    'background: #fff',
    'color: #0f172a',
    'cursor: pointer',
    'font: 600 12px/1 system-ui, sans-serif'
  ].join('; ');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => {
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
