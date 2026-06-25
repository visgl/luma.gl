// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeGeoArrowExampleData, type GeoArrowExampleData} from './geoarrow-data';
import type {GeoArrowRenderer} from './geoarrow-renderer';
import {GeoArrowControlPanel} from './control-panel';
import {ArrowExamplePanelManager} from '../arrow-example-panels';

/** Owns the mixed-geometry Arrow source and inspection panels. */
export class GeoArrowSource {
  readonly controlPanel = new GeoArrowControlPanel();
  readonly panels = new ArrowExamplePanelManager({
    descriptionPanel: () => this.controlPanel.makeDescriptionPanel()
  });

  constructor(private readonly onSourceChange: (data: GeoArrowExampleData) => Promise<void>) {}

  async initialize(): Promise<void> {
    this.panels.mount();
    this.controlPanel.initialize();
    await this.onSourceChange(makeGeoArrowExampleData());
  }

  setRendererResult(renderer: GeoArrowRenderer, data: GeoArrowExampleData): void {
    const tables = renderer.getInspectionTables();
    this.panels.setTableEntries([
      {id: 'geoarrow-source', label: 'Mixed geometry source', kind: 'source', table: data.table},
      {id: 'geoarrow-points', label: 'Point rows', kind: 'derived', table: tables.pointTable},
      {id: 'geoarrow-lines', label: 'Line rows', kind: 'derived', table: tables.lineTable},
      {id: 'geoarrow-polygons', label: 'Polygon rows', kind: 'derived', table: tables.polygonTable}
    ]);
    this.controlPanel.setMetrics(renderer.getMetrics(), data.arrowByteLength);
  }

  finalize(): void {
    this.panels.finalize();
  }
}
