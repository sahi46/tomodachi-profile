// キャンバス内の全要素は % 座標で管理（端末幅が変わっても比率は同じ）
export interface PctPosition {
  xPct: number  // 0-100 (キャンバス幅に対する%)
  yPct: number  // 0-100 (キャンバス高さに対する%)
}

export interface ElementTransform {
  rotation: number
  scale: number
}

export type ElementType = 'sticker' | 'question' | 'template_card' | 'visual_card'

import { VCardTemplate } from '@/lib/visual-card'

export interface CanvasElement {
  id: string
  profile_id: string
  type: ElementType
  content: { emoji: string } | { question: string; answer: string } | { templateId: string; answers: Record<string, string> } | { template: VCardTemplate; answers: Record<string, string> }
  style: Record<string, string>
  position: PctPosition
  transform: ElementTransform
  z_index: number
}

export type Background =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; direction: string }

export interface Profile {
  id: string
  slug: string
  title: string
  background: Background
  created_at: string
  updated_at: string
}
