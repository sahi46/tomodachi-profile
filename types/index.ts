export type Background =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; direction: string }

export type ElementType = 'sticker' | 'question' | 'text'

export interface StickerContent {
  emoji: string
}

export interface QuestionContent {
  question: string
  answer: string
}

export interface TextContent {
  text: string
}

export type ElementContent = StickerContent | QuestionContent | TextContent

export interface ElementTransform {
  rotation: number
  scale: number
}

export interface ElementPosition {
  x: number
  y: number
}

export interface CanvasElement {
  id: string
  profile_id: string
  type: ElementType
  content: ElementContent
  style: Record<string, string>
  position: ElementPosition
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
