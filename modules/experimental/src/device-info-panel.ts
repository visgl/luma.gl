// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, DeviceInfo} from '@luma.gl/core'
import type {WebGLDevice} from '@luma.gl/webgl'

export type DeviceInfoPanelOptions = {
  width?: string
  accentColor?: string
  showExtensionsList?: boolean
  showFeaturesList?: boolean
  theme?: 'light' | 'dark'
}

type ThemeName = NonNullable<DeviceInfoPanelOptions['theme']>

const WEBGPU_LOGO_LIGHT = 'https://www.w3.org/2023/02/webgpu-logos/webgpu-horizontal.svg'
const WEBGPU_LOGO_DARK =
  'https://www.w3.org/2023/02/webgpu-logos/webgpu-horizontal-responsive.svg'
const WEBGL_LOGO = 'https://www.logo.wine/a/logo/WebGL/WebGL-Logo.wine.svg'

const defaultThemeStyles = `
.luma-device-info-panel {
  --device-panel-bg: #f9fafb;
  --device-panel-text: #1b1b1b;
  --device-panel-border: #e5e7eb;
  --device-panel-card-bg: #ffffff;
  --device-panel-subtle-bg: #f3f4f6;
  --device-panel-muted: #6b7280;
  --device-panel-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  --device-panel-accent: #4b9dff;
  font-family: 'Inter, Arial, sans-serif';
  font-size: 14px;
  color: var(--device-panel-text);
  background: var(--device-panel-bg);
  border: 1px solid var(--device-panel-border);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--device-panel-shadow);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.luma-device-info-panel.luma-theme-dark {
  --device-panel-bg: #0f172a;
  --device-panel-text: #e5e7eb;
  --device-panel-border: #1f2937;
  --device-panel-card-bg: #111827;
  --device-panel-subtle-bg: #1f2937;
  --device-panel-muted: #9ca3af;
  --device-panel-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
  --device-panel-accent: #7dd3fc;
}

.luma-device-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.luma-device-info-title {
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.luma-device-info-header-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.luma-device-info-badges {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.luma-device-info-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--device-panel-subtle-bg);
  color: var(--device-panel-text);
  border-radius: 16px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid var(--device-panel-border);
}

.luma-device-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.luma-device-info-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 10px;
  background: var(--device-panel-card-bg);
  border-radius: 8px;
  border: 1px solid var(--device-panel-border);
}

.luma-device-info-row .label {
  font-weight: 600;
  color: var(--device-panel-muted);
}

.luma-device-info-row .value {
  color: var(--device-panel-text);
  text-align: right;
}

.luma-device-info-section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--device-panel-accent);
}

.luma-device-info-section-box {
  margin-top: 6px;
  background: var(--device-panel-card-bg);
  border: 1px solid var(--device-panel-border);
  border-radius: 8px;
  padding: 10px;
}

.luma-device-info-summary {
  font-weight: 600;
  margin: 0;
}

.luma-device-info-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 6px;
}

.luma-device-info-list li {
  background: var(--device-panel-subtle-bg);
  border: 1px solid var(--device-panel-border);
  border-radius: 6px;
  padding: 4px 6px;
  font-size: 12px;
}

.luma-device-info-list li.shader {
  background: rgba(75, 157, 255, 0.1);
  border-color: var(--device-panel-accent);
}

.luma-device-info-collapsible {
  margin-top: 6px;
}

.luma-device-info-collapsible summary {
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--device-panel-text);
  padding: 10px;
  background: var(--device-panel-card-bg);
  border: 1px solid var(--device-panel-border);
  border-radius: 8px;
}

.luma-device-info-collapsible summary::-webkit-details-marker {
  display: none;
}

.luma-device-info-collapsible .chevron {
  transition: transform 0.2s ease;
}

.luma-device-info-collapsible[open] .chevron {
  transform: rotate(90deg);
}

.luma-device-info-button {
  border: 1px solid var(--device-panel-border);
  border-radius: 6px;
  background: var(--device-panel-card-bg);
  color: var(--device-panel-text);
  padding: 6px 10px;
  font-weight: 600;
  cursor: pointer;
}

.luma-device-info-button:hover {
  border-color: var(--device-panel-accent);
}
`

export function createDeviceInfoPanel(
  device: Device,
  options: DeviceInfoPanelOptions = {},
): HTMLElement {
  const theme: ThemeName = options.theme === 'dark' ? 'dark' : 'light'
  const accentColor = options.accentColor || (theme === 'dark' ? '#7dd3fc' : '#4b9dff')
  ensureDeviceInfoPanelStyles()

  const panel = document.createElement('div')
  panel.classList.add('luma-device-info-panel', `luma-theme-${theme}`)
  panel.style.width = options.width || '360px'
  panel.style.setProperty('--device-panel-accent', accentColor)

  const header = document.createElement('div')
  header.className = 'luma-device-info-header'

  const title = document.createElement('div')
  title.textContent = 'GPU Device Info'
  title.className = 'luma-device-info-title'

  const headerButtons = document.createElement('div')
  headerButtons.className = 'luma-device-info-header-buttons'

  const themeButton = document.createElement('button')
  themeButton.className = 'luma-device-info-button'
  themeButton.type = 'button'
  themeButton.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme'
  themeButton.addEventListener('click', () => {
    const nextTheme: ThemeName = panel.classList.contains('luma-theme-dark') ? 'light' : 'dark'
    applyTheme(panel, nextTheme, options.accentColor)
    updateBackendBadgeForTheme(panel, device.info, nextTheme)
    themeButton.textContent = nextTheme === 'dark' ? 'Light theme' : 'Dark theme'
  })

  headerButtons.appendChild(themeButton)

  const badges = document.createElement('div')
  badges.className = 'luma-device-info-badges'

  badges.appendChild(createBackendBadge(device.info, theme))
  badges.appendChild(createGpuTypeBadge(device.info.gpuType))
  const vendorBadge = createVendorBadge(device.info)
  if (vendorBadge) {
    badges.appendChild(vendorBadge)
  }

  header.appendChild(title)
  header.appendChild(headerButtons)
  panel.appendChild(header)
  panel.appendChild(badges)

  const infoGrid = document.createElement('div')
  infoGrid.className = 'luma-device-info-grid'

  const infoFields: Array<[string, string | number | boolean | undefined]> = [
    ['Type', device.info.type],
    ['Vendor', device.info.vendor],
    ['Renderer', device.info.renderer],
    ['Driver Version', device.info.version],
    ['GPU Family', device.info.gpu],
    ['GPU Type', device.info.gpuType],
    ['GPU Backend', device.info.gpuBackend],
    ['GPU Architecture', device.info.gpuArchitecture],
    ['Fallback Adapter', device.info.fallback],
    ['Shading Language', device.info.shadingLanguage],
    ['Shading Language Version', device.info.shadingLanguageVersion],
  ]

  for (const [label, value] of infoFields) {
    infoGrid.appendChild(createInfoRow(label, value ?? 'n/a'))
  }

  panel.appendChild(infoGrid)

  if (isWebGLDevice(device)) {
    const extensionSection = createExtensionSection(device, options)
    panel.appendChild(extensionSection)
  } else {
    const featureSection = createFeatureSection(device, options)
    panel.appendChild(featureSection)
  }

  return panel
}

function ensureDeviceInfoPanelStyles(): void {
  if (typeof document === 'undefined') {
    return
  }
  const styleId = 'luma-device-info-panel-styles'
  if (document.getElementById(styleId)) {
    return
  }
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = defaultThemeStyles
  document.head.appendChild(style)
}

function applyTheme(panel: HTMLElement, theme: ThemeName, customAccent?: string): void {
  panel.classList.remove('luma-theme-light', 'luma-theme-dark')
  panel.classList.add(`luma-theme-${theme}`)
  const fallbackAccent = theme === 'dark' ? '#7dd3fc' : '#4b9dff'
  panel.style.setProperty('--device-panel-accent', customAccent || fallbackAccent)
}

function createInfoRow(label: string, value: string | number | boolean): HTMLElement {
  const row = document.createElement('div')
  row.className = 'luma-device-info-row'

  const labelElement = document.createElement('div')
  labelElement.textContent = label
  labelElement.className = 'label'

  const valueElement = document.createElement('div')
  valueElement.textContent = String(value)
  valueElement.className = 'value'

  row.appendChild(labelElement)
  row.appendChild(valueElement)
  return row
}

function createSectionHeader(title: string): HTMLElement {
  const header = document.createElement('div')
  header.textContent = title
  header.className = 'luma-device-info-section-title'
  return header
}

function createBadge(text: string, title: string, icon?: Element): HTMLElement {
  const badge = document.createElement('div')
  badge.title = title
  badge.className = 'luma-device-info-badge'

  if (icon) {
    badge.appendChild(icon)
  }

  const textNode = document.createElement('span')
  textNode.textContent = text
  badge.appendChild(textNode)
  return badge
}

function createBackendBadge(info: DeviceInfo, theme: ThemeName): HTMLElement {
  const isWebGPU = info.type === 'webgpu'
  const isWebGL = info.type === 'webgl'
  const title = isWebGPU ? 'WebGPU device' : isWebGL ? 'WebGL2 device' : 'Unknown backend'
  const label = isWebGPU ? 'WebGPU' : isWebGL ? 'WebGL2' : 'Unknown'
  const logo = document.createElement('img')
  logo.alt = label
  logo.width = 82
  logo.height = 24
  logo.loading = 'lazy'
  logo.dataset.deviceBackendLogo = 'true'
  logo.dataset.deviceBackendType = isWebGPU ? 'webgpu' : isWebGL ? 'webgl' : 'unknown'
  logo.src = getBackendLogoSource(logo.dataset.deviceBackendType, theme)

  return createBadge(label, title, logo)
}

function getBackendLogoSource(type: string | undefined, theme: ThemeName): string {
  if (type === 'webgpu') {
    return theme === 'dark' ? WEBGPU_LOGO_DARK : WEBGPU_LOGO_LIGHT
  }
  if (type === 'webgl') {
    return WEBGL_LOGO
  }
  return WEBGL_LOGO
}

function updateBackendBadgeForTheme(panel: HTMLElement, info: DeviceInfo, theme: ThemeName): void {
  const logo = panel.querySelector<HTMLImageElement>('[data-device-backend-logo]')
  if (!logo) {
    return
  }
  const type = info.type === 'webgpu' ? 'webgpu' : info.type === 'webgl' ? 'webgl' : 'unknown'
  logo.dataset.deviceBackendType = type
  logo.src = getBackendLogoSource(type, theme)
}

function createGpuTypeBadge(gpuType: DeviceInfo['gpuType']): HTMLElement {
  let background = 'var(--device-panel-subtle-bg)'
  let text = 'Integrated GPU'
  let title = 'Integrated or shared memory GPU'
  if (gpuType === 'discrete') {
    background = 'rgba(230, 55, 70, 0.12)'
    text = 'Discrete GPU'
    title = 'Dedicated graphics hardware'
  } else if (gpuType === 'cpu') {
    background = 'rgba(254, 243, 199, 0.6)'
    text = 'Software GPU'
    title = 'Software renderer or CPU fallback'
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '18')
  svg.setAttribute('height', '18')
  svg.setAttribute('viewBox', '0 0 24 24')
  const circle = document.createElementNS(svg.namespaceURI, 'circle')
  circle.setAttribute('cx', '12')
  circle.setAttribute('cy', '12')
  circle.setAttribute('r', '9')
  circle.setAttribute('fill', '#0f172a')
  svg.appendChild(circle)
  const inner = document.createElementNS(svg.namespaceURI, 'path')
  inner.setAttribute('fill', '#fff')
  inner.setAttribute('d', 'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8z')
  svg.appendChild(inner)
  const titleElement = document.createElementNS(svg.namespaceURI, 'title')
  titleElement.textContent = title
  svg.appendChild(titleElement)

  const badge = createBadge(text, title, svg)
  badge.style.background = background
  return badge
}

function createVendorBadge(info: DeviceInfo): HTMLElement | null {
  const vendor = info.gpu?.toLowerCase() || info.vendor?.toLowerCase()
  if (!vendor) {
    return null
  }

  const knownVendors: Record<string, {label: string; color: string; svg: () => SVGElement}> = {
    nvidia: {label: 'NVIDIA', color: '#76b900', svg: createNvidiaSvg},
    amd: {label: 'AMD', color: '#e63746', svg: createAmdSvg},
    apple: {label: 'Apple', color: '#111827', svg: createAppleSvg},
    intel: {label: 'Intel', color: '#0071c5', svg: createIntelSvg},
    software: {label: 'Software', color: '#6b7280', svg: createSoftwareSvg},
  }

  const match = Object.keys(knownVendors).find(key => vendor.includes(key))
  if (!match) {
    return null
  }

  const vendorInfo = knownVendors[match]
  const svg = vendorInfo.svg()
  const titleElement = document.createElementNS(svg.namespaceURI, 'title')
  titleElement.textContent = `${vendorInfo.label} GPU`
  svg.appendChild(titleElement)

  const badge = createBadge(vendorInfo.label, `${vendorInfo.label} vendor`, svg)
  badge.style.background = `${vendorInfo.color}20`
  badge.style.borderColor = `${vendorInfo.color}60`
  return badge
}

function createExtensionSection(
  device: WebGLDevice,
  options: DeviceInfoPanelOptions,
): HTMLElement {
  const section = document.createElement('div')
  section.appendChild(createSectionHeader('WebGL Extensions'))
  const extensions = device.gl?.getSupportedExtensions?.() || []

  const collapsible = document.createElement('details')
  collapsible.className = 'luma-device-info-collapsible'
  collapsible.open = false

  const summary = document.createElement('summary')
  summary.className = 'luma-device-info-section-box'
  const summaryText = document.createElement('p')
  summaryText.className = 'luma-device-info-summary'
  summaryText.textContent = `${extensions.length} extensions available`
  const chevron = document.createElement('span')
  chevron.className = 'chevron'
  chevron.textContent = '›'
  summary.appendChild(summaryText)
  summary.appendChild(chevron)
  collapsible.appendChild(summary)

  if (options.showExtensionsList !== false && extensions.length > 0) {
    const listBox = document.createElement('div')
    listBox.className = 'luma-device-info-section-box'
    const list = document.createElement('ul')
    list.className = 'luma-device-info-list'
    for (const extension of extensions) {
      const item = document.createElement('li')
      item.textContent = extension
      list.appendChild(item)
    }
    listBox.appendChild(list)
    collapsible.appendChild(listBox)
  }

  section.appendChild(collapsible)
  return section
}

function createFeatureSection(
  device: Device,
  options: DeviceInfoPanelOptions,
): HTMLElement {
  const section = document.createElement('div')
  section.appendChild(createSectionHeader('Features'))

  const featureList = Array.from(device.features ?? [])
  const shaderFeatures = featureList.filter(feature => feature.toLowerCase().includes('shader'))

  const collapsible = document.createElement('details')
  collapsible.className = 'luma-device-info-collapsible'
  collapsible.open = false

  const summary = document.createElement('summary')
  summary.className = 'luma-device-info-section-box'
  const summaryText = document.createElement('p')
  summaryText.className = 'luma-device-info-summary'
  summaryText.textContent = `${featureList.length} features, ${shaderFeatures.length} shader-related`
  const chevron = document.createElement('span')
  chevron.className = 'chevron'
  chevron.textContent = '›'
  summary.appendChild(summaryText)
  summary.appendChild(chevron)
  collapsible.appendChild(summary)

  if (options.showFeaturesList !== false && featureList.length > 0) {
    const listBox = document.createElement('div')
    listBox.className = 'luma-device-info-section-box'
    const list = document.createElement('ul')
    list.className = 'luma-device-info-list'
    for (const feature of featureList) {
      const item = document.createElement('li')
      item.textContent = feature
      if (shaderFeatures.includes(feature)) {
        item.classList.add('shader')
      }
      list.appendChild(item)
    }
    listBox.appendChild(list)
    collapsible.appendChild(listBox)
  }

  section.appendChild(collapsible)
  return section
}

function createNvidiaSvg(): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '18')
  svg.setAttribute('height', '18')
  svg.setAttribute('viewBox', '0 0 24 24')
  const path = document.createElementNS(svg.namespaceURI, 'path')
  path.setAttribute(
    'd',
    'M3 7c3-2 7-3 11-2 3 1 5 3 7 6-2 3-4 5-7 6-4 1-8 0-11-2l2-2c2 1 4 1 7 1 2-1 4-2 5-3-1-2-3-3-5-3-2 0-4 0-6 1l-2-2z',
  )
  path.setAttribute('fill', '#76b900')
  svg.appendChild(path)
  return svg
}

function createAmdSvg(): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '18')
  svg.setAttribute('height', '18')
  svg.setAttribute('viewBox', '0 0 24 24')
  const path = document.createElementNS(svg.namespaceURI, 'path')
  path.setAttribute('d', 'M3 3h8l3 3-3 3H6v8l-3 3V3zm8 8h7l3 3-3 3h-7v-6z')
  path.setAttribute('fill', '#e63746')
  svg.appendChild(path)
  return svg
}

function createAppleSvg(): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '18')
  svg.setAttribute('height', '18')
  svg.setAttribute('viewBox', '0 0 24 24')
  const path = document.createElementNS(svg.namespaceURI, 'path')
  path.setAttribute(
    'd',
    'M16.5 2c0 1-0.8 2.2-1.6 3-0.7 0.7-1.9 1.4-2.9 1.3-0.1-1 0.5-2.2 1.3-3.1C14 2.5 15.3 2 16.5 2zM19 15c-0.4 0.9-0.6 1.3-1.1 2-0.7 1-1.7 2.1-2.9 2.1-1 0-1.3-0.7-2.8-0.7s-1.8 0.7-2.9 0.7c-1.2 0-2.1-1-2.9-2-1.4-1.8-2.5-5-1-7.3 0.9-1.4 2.5-2.2 4-2.2 1.1 0 2 0.7 2.8 0.7s1.9-0.8 3.3-0.7c0.6 0 2.3 0.2 3.4 1.7-0.1 0.1-2 1.2-2 3.4 0 2.7 2.6 3.5 2.7 3.5z',
  )
  path.setAttribute('fill', '#111827')
  svg.appendChild(path)
  return svg
}

function createIntelSvg(): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '18')
  svg.setAttribute('height', '18')
  svg.setAttribute('viewBox', '0 0 24 24')
  const path = document.createElementNS(svg.namespaceURI, 'path')
  path.setAttribute(
    'd',
    'M4 10c0-3 2.5-5 6-5 3 0 5 1.4 6 3V5h3v9c0 3-2.5 5-6 5-3 0-6-2-6-5h3c0 1.3 1.3 2.5 3 2.5 1.8 0 3-1.2 3-2.5s-1.2-2.5-3-2.5c-3.5 0-6-2-6-5z',
  )
  path.setAttribute('fill', '#0071c5')
  svg.appendChild(path)
  return svg
}

function createSoftwareSvg(): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '18')
  svg.setAttribute('height', '18')
  svg.setAttribute('viewBox', '0 0 24 24')
  const path = document.createElementNS(svg.namespaceURI, 'path')
  path.setAttribute('d', 'M3 4h18v4H3V4zm0 6h18v10H3V10zm4 2v2h4v-2H7zm0 4v2h8v-2H7z')
  path.setAttribute('fill', '#6b7280')
  svg.appendChild(path)
  return svg
}

function isWebGLDevice(device: Device): device is WebGLDevice {
  return device?.info?.type === 'webgl'
}
