export type VCEType = 'label' | 'field' | 'rect' | 'line'

export interface VCardElement {
  id: string
  type: VCEType
  x: number      // card-px from left
  y: number      // card-px from top
  w: number      // card-px width
  h: number      // card-px height
  rot: number    // degrees
  // Shape
  fill: string
  stroke: string
  strokeW: number
  dash: boolean
  // Text
  text: string
  fontSize: number
  fontBold: boolean
  color: string
  align: 'left' | 'center' | 'right'
  // Field
  fieldKey: string
  placeholder: string
}

export const CARD_W = 240

export interface VCardTemplate {
  id: string
  title: string
  bg: string
  elements: VCardElement[]
}

export function newElement(type: VCEType, id: string): VCardElement {
  const base: VCardElement = {
    id, type, x: 20, y: 20, w: 100, h: 40, rot: 0,
    fill: 'transparent', stroke: '#d1d5db', strokeW: 1.5, dash: false,
    text: '', fontSize: 12, fontBold: false, color: '#374151', align: 'left',
    fieldKey: `field_${id}`, placeholder: 'タップして入力',
  }
  switch (type) {
    case 'label':
      return { ...base, text: 'テキスト', stroke: 'none', w: 140, h: 20, fontSize: 13, fontBold: true, color: '#111827' }
    case 'field':
      return { ...base, text: 'ラベル', fill: '#f9fafb', stroke: '#e5e7eb', strokeW: 1, w: 190, h: 38, fontSize: 11 }
    case 'rect':
      return { ...base, fill: '#fce7f3', stroke: '#f9a8d4', strokeW: 1.5, w: 150, h: 60 }
    case 'line':
      return { ...base, fill: 'none', stroke: '#9ca3af', strokeW: 1.5, w: 190, h: 1, rot: 0 }
  }
}

export const COLOR_PALETTE = [
  'transparent',
  '#ffffff', '#f9fafb', '#f3f4f6',
  '#fce7f3', '#fdf4ff', '#fffbeb', '#f0fdf4', '#eff6ff', '#fff7ed',
  '#000000', '#374151', '#6b7280',
  '#f472b6', '#a855f7', '#f59e0b', '#10b981', '#3b82f6', '#f97316',
  '#fbcfe8', '#e9d5ff', '#fde68a', '#a7f3d0', '#bfdbfe', '#fed7aa',
]

export const getVisualTemplates = (): VCardTemplate[] =>
  JSON.parse(localStorage.getItem('tomo_visual_templates') || '[]')

export const saveVisualTemplates = (list: VCardTemplate[]) =>
  localStorage.setItem('tomo_visual_templates', JSON.stringify(list))
