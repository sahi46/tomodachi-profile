export const GRID_COLS = 4
export const GRID_ROWS = 7

export type Background =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; direction: string }

export type ElementType = 'sticker' | 'question'

// 質問: グリッドの何列目・何行目か
export interface GridPosition {
  col: number
  row: number
}

// スタンプ: キャンバス幅・高さに対する割合 (0-100)
export interface PctPosition {
  xPct: number
  yPct: number
}

export interface ElementTransform {
  rotation: number
  scale: number
}

export interface CanvasElement {
  id: string
  profile_id: string
  type: ElementType
  content: { emoji: string } | { question: string; answer: string }
  style: Record<string, string>
  position: GridPosition | PctPosition
  transform: ElementTransform
  z_index: number
}

export interface Profile {
  id: string
  slug: string
  title: string
  background: Background
  created_at: string
  updated_at: string
}

// type guards
export const isGridPosition = (p: GridPosition | PctPosition): p is GridPosition =>
  'col' in p && 'row' in p

export const isPctPosition = (p: GridPosition | PctPosition): p is PctPosition =>
  'xPct' in p && 'yPct' in p
