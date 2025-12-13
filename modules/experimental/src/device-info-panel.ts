// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, DeviceFeature, DeviceInfo} from '@luma.gl/core'
import type {WebGLDevice} from '@luma.gl/webgl'

export type DeviceInfoPanelOptions = {
  width?: string
  accentColor?: string
  showExtensionsList?: boolean
  showFeaturesList?: boolean
}

export function createDeviceInfoPanel(
  device: Device,
  options: DeviceInfoPanelOptions = {}
): HTMLElement {
  const accentColor = options.accentColor || '#4b9dff'
  const panel = document.createElement('div')
  Object.assign(panel.style, {
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: '14px',
    color: '#1b1b1b',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    width: options.width || '360px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  })

  const header = document.createElement('div')
  Object.assign(header.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px'
  })

  const title = document.createElement('div')
  title.textContent = 'GPU Device Info'
  Object.assign(title.style, {
    fontSize: '16px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  })

  const badges = document.createElement('div')
  Object.assign(badges.style, {
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  })

  badges.appendChild(createBackendBadge(device.info, accentColor))
  badges.appendChild(createGpuTypeBadge(device.info.gpuType))
  const vendorBadge = createVendorBadge(device.info)
  if (vendorBadge) {
    badges.appendChild(vendorBadge)
  }

  header.appendChild(title)
  header.appendChild(badges)
  panel.appendChild(header)

  const infoGrid = document.createElement('div')
  Object.assign(infoGrid.style, {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '6px'
  })

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
    ['Shading Language Version', device.info.shadingLanguageVersion]
  ]

  for (const [label, value] of infoFields) {
    infoGrid.appendChild(createInfoRow(label, value ?? 'n/a'))
  }

  panel.appendChild(infoGrid)

  if (isWebGLDevice(device)) {
    const extensionSection = createExtensionSection(device, accentColor, options)
    panel.appendChild(extensionSection)
  } else {
    const featureSection = createFeatureSection(device, accentColor, options)
    panel.appendChild(featureSection)
  }

  return panel
}

function createInfoRow(label: string, value: string | number | boolean): HTMLElement {
  const row = document.createElement('div')
  Object.assign(row.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '6px 10px',
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #eceff1'
  })

  const labelElement = document.createElement('div')
  labelElement.textContent = label
  Object.assign(labelElement.style, {
    fontWeight: '600',
    color: '#374151'
  })

  const valueElement = document.createElement('div')
  valueElement.textContent = String(value)
  Object.assign(valueElement.style, {
    color: '#111827',
    textAlign: 'right'
  })

  row.appendChild(labelElement)
  row.appendChild(valueElement)
  return row
}

function createSectionHeader(title: string, accentColor: string): HTMLElement {
  const header = document.createElement('div')
  header.textContent = title
  Object.assign(header.style, {
    fontSize: '15px',
    fontWeight: '700',
    color: accentColor
  })
  return header
}

function createBadge(text: string, background: string, title: string, svg?: SVGElement): HTMLElement {
  const badge = document.createElement('div')
  badge.title = title
  Object.assign(badge.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    background,
    color: '#0b1a2d',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '700',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)'
  })

  if (svg) {
    badge.appendChild(svg)
  }

  const textNode = document.createElement('span')
  textNode.textContent = text
  badge.appendChild(textNode)
  return badge
}

function createBackendBadge(info: DeviceInfo, accentColor: string): HTMLElement {
  const isWebGPU = info.type === 'webgpu'
  const isWebGL = info.type === 'webgl'
  const title = isWebGPU ? 'WebGPU device' : isWebGL ? 'WebGL2 device' : 'Unknown backend'
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '20')
  svg.setAttribute('height', '20')
  svg.setAttribute('viewBox', '0 0 20 20')
  const rect = document.createElementNS(svg.namespaceURI, 'rect')
  rect.setAttribute('x', '1')
  rect.setAttribute('y', '1')
  rect.setAttribute('width', '18')
  rect.setAttribute('height', '18')
  rect.setAttribute('rx', '4')
  rect.setAttribute('fill', isWebGPU ? '#2a5bff' : isWebGL ? '#7ac143' : '#d1d5db')
  svg.appendChild(rect)
  const label = document.createElementNS(svg.namespaceURI, 'text')
  label.setAttribute('x', '10')
  label.setAttribute('y', '13')
  label.setAttribute('text-anchor', 'middle')
  label.setAttribute('font-size', '9')
  label.setAttribute('fill', '#fff')
  label.textContent = isWebGPU ? 'GPU' : isWebGL ? 'GL2' : '?'
  svg.appendChild(label)
  const titleElement = document.createElementNS(svg.namespaceURI, 'title')
  titleElement.textContent = title
  svg.appendChild(titleElement)
  return createBadge(isWebGPU ? 'WebGPU' : isWebGL ? 'WebGL2' : 'Unknown', accentColor, title, svg)
}

function createGpuTypeBadge(gpuType: DeviceInfo['gpuType']): HTMLElement {
  let background = '#e0e7ff'
  let text = 'Integrated GPU'
  let title = 'Integrated or shared memory GPU'
  if (gpuType === 'discrete') {
    background = '#fee2e2'
    text = 'Discrete GPU'
    title = 'Dedicated graphics hardware'
  } else if (gpuType === 'cpu') {
    background = '#fef3c7'
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
  return createBadge(text, background, title, svg)
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
    software: {label: 'Software', color: '#6b7280', svg: createSoftwareSvg}
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
  return createBadge(vendorInfo.label, `${vendorInfo.color}20`, `${vendorInfo.label} vendor`, svg)
}

function createExtensionSection(
  device: WebGLDevice,
  accentColor: string,
  options: DeviceInfoPanelOptions
): HTMLElement {
  const section = document.createElement('div')
  section.appendChild(createSectionHeader('WebGL Extensions', accentColor))
  const extensions = device.gl?.getSupportedExtensions?.() || []
  const listContainer = document.createElement('div')
  Object.assign(listContainer.style, {
    marginTop: '6px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px',
    maxHeight: '180px',
    overflow: 'auto'
  })

  const summary = document.createElement('div')
  summary.textContent = `${extensions.length} extensions available`
  Object.assign(summary.style, {
    fontWeight: '600',
    marginBottom: '6px'
  })
  listContainer.appendChild(summary)

  if (options.showExtensionsList !== false) {
    const list = document.createElement('ul')
    Object.assign(list.style, {
      listStyle: 'none',
      padding: '0',
      margin: '0',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '4px'
    })
    for (const extension of extensions) {
      const item = document.createElement('li')
      item.textContent = extension
      Object.assign(item.style, {
        background: '#f3f4f6',
        borderRadius: '6px',
        padding: '4px 6px',
        fontSize: '12px'
      })
      list.appendChild(item)
    }
    listContainer.appendChild(list)
  }

  section.appendChild(listContainer)
  return section
}

function createFeatureSection(
  device: Device,
  accentColor: string,
  options: DeviceInfoPanelOptions
): HTMLElement {
  const section = document.createElement('div')
  section.appendChild(createSectionHeader('Features', accentColor))

  const featureList = Array.from((device.features as unknown as Iterable<DeviceFeature>) || [])
  const shaderFeatures = featureList.filter(feature => feature.toLowerCase().includes('shader'))

  const listContainer = document.createElement('div')
  Object.assign(listContainer.style, {
    marginTop: '6px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px'
  })

  const summary = document.createElement('div')
  summary.textContent = `${featureList.length} features, ${shaderFeatures.length} shader-related`
  Object.assign(summary.style, {
    fontWeight: '600',
    marginBottom: '6px'
  })
  listContainer.appendChild(summary)

  if (options.showFeaturesList !== false && featureList.length > 0) {
    const list = document.createElement('ul')
    Object.assign(list.style, {
      listStyle: 'none',
      padding: '0',
      margin: '0',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '4px'
    })
    for (const feature of featureList) {
      const item = document.createElement('li')
      item.textContent = feature
      Object.assign(item.style, {
        background: shaderFeatures.includes(feature) ? '#eef2ff' : '#f3f4f6',
        borderRadius: '6px',
        padding: '4px 6px',
        fontSize: '12px',
        border: shaderFeatures.includes(feature) ? `1px solid ${accentColor}` : '1px solid #e5e7eb'
      })
      list.appendChild(item)
    }
    listContainer.appendChild(list)
  }

  section.appendChild(listContainer)
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
    'M3 7c3-2 7-3 11-2 3 1 5 3 7 6-2 3-4 5-7 6-4 1-8 0-11-2l2-2c2 1 4 1 7 1 2-1 4-2 5-3-1-2-3-3-5-3-2 0-4 0-6 1l-2-2z'
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
    'M16.5 2c0 1-0.8 2.2-1.6 3-0.7 0.7-1.9 1.4-2.9 1.3-0.1-1 0.5-2.2 1.3-3.1C14 2.5 15.3 2 16.5 2zM19 15c-0.4 0.9-0.6 1.3-1.1 2-0.7 1-1.7 2.1-2.9 2.1-1 0-1.3-0.7-2.8-0.7s-1.8 0.7-2.9 0.7c-1.2 0-2.1-1-2.9-2-1.4-1.8-2.5-5-1-7.3 0.9-1.4 2.5-2.2 4-2.2 1.1 0 2 0.7 2.8 0.7s1.9-0.8 3.3-0.7c0.6 0 2.3 0.2 3.4 1.7-0.1 0.1-2 1.2-2 3.4 0 2.7 2.6 3.5 2.7 3.5z'
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
    'M4 10c0-3 2.5-5 6-5 3 0 5 1.4 6 3V5h3v9c0 3-2.5 5-6 5-3 0-6-2-6-5h3c0 1.3 1.3 2.5 3 2.5 1.8 0 3-1.2 3-2.5s-1.2-2.5-3-2.5c-3.5 0-6-2-6-5z'
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
