'use client'

import { useRef, useCallback } from 'react'
import { VCardTemplate, VCardElement, CARD_W } from '@/lib/visual-card'

interface Props {
  template: VCardTemplate
  answers: Record<string, string>
  scale?: number
  // editor mode
  editMode?: boolean
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onMove?: (id: string, x: number, y: number) => void
  // answer mode
  answerMode?: boolean
  answerEditingId?: string | null
  onAnswerChange?: (fieldKey: string, value: string) => void
}

function ElView({
  el, answer, scale,
  editMode, isSelected,
  answerMode, isAnswerEditing,
  onPointerDown, onPointerMove, onPointerUp, onClick, onAnswerChange,
}: {
  el: VCardElement
  answer: string
  scale: number
  editMode?: boolean
  isSelected?: boolean
  answerMode?: boolean
  isAnswerEditing?: boolean
  onPointerDown?: (e: React.PointerEvent) => void
  onPointerMove?: (e: React.PointerEvent) => void
  onPointerUp?: (e: React.PointerEvent) => void
  onClick?: (e: React.MouseEvent) => void
  onAnswerChange?: (v: string) => void
}) {
  const selRing = isSelected ? '0 0 0 2px #6366f1' : undefined

  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.type === 'line' ? Math.max(el.strokeW, 1) : el.h,
    transform: el.rot ? `rotate(${el.rot}deg)` : undefined,
    transformOrigin: 'left center',
    boxShadow: selRing,
    boxSizing: 'border-box',
    cursor: editMode ? 'grab' : answerMode && el.type === 'field' ? 'pointer' : 'default',
    touchAction: 'none',
    userSelect: 'none',
  }

  if (el.type === 'rect') {
    return (
      <div
        style={{
          ...boxStyle,
          background: el.fill === 'transparent' || el.fill === 'none' ? 'transparent' : el.fill,
          border: el.stroke !== 'none' && el.stroke !== 'transparent'
            ? `${el.strokeW}px ${el.dash ? 'dashed' : 'solid'} ${el.stroke}` : 'none',
          borderRadius: 8,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onClick}
      />
    )
  }

  if (el.type === 'line') {
    return (
      <div
        style={{
          ...boxStyle,
          height: el.strokeW,
          background: el.stroke,
          ...(el.dash ? { backgroundImage: `repeating-linear-gradient(90deg, ${el.stroke} 0, ${el.stroke} 6px, transparent 6px, transparent 12px)`, background: 'none' } : {}),
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onClick}
      />
    )
  }

  if (el.type === 'label') {
    return (
      <div
        style={{
          ...boxStyle,
          fontSize: el.fontSize,
          fontWeight: el.fontBold ? 700 : 400,
          color: el.color,
          textAlign: el.align,
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          pointerEvents: editMode ? 'auto' : 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onClick}
      >
        {el.text || (editMode ? 'テキスト' : '')}
      </div>
    )
  }

  // field
  const showEdit = isAnswerEditing && answerMode
  return (
    <div
      style={{ ...boxStyle, display: 'flex', flexDirection: 'column', gap: 2 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onClick}
    >
      {el.text && (
        <p style={{ fontSize: Math.max(8, el.fontSize - 2), color: '#9ca3af', lineHeight: 1.2, pointerEvents: 'none' }}>
          {el.text}
        </p>
      )}
      <div style={{
        flex: 1,
        background: el.fill === 'transparent' ? '#f9fafb' : el.fill,
        border: `${el.strokeW}px ${el.dash ? 'dashed' : 'solid'} ${el.stroke}`,
        borderRadius: 6,
        padding: '3px 8px',
        display: 'flex',
        alignItems: 'center',
        outline: answerMode && !isAnswerEditing ? '1.5px dashed rgba(99,102,241,0.35)' : 'none',
      }}>
        {showEdit ? (
          <input
            autoFocus
            value={answer}
            placeholder={el.placeholder}
            onChange={e => onAnswerChange?.(e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{
              fontSize: el.fontSize, fontWeight: 600, color: '#111827',
              background: 'transparent', border: 'none', outline: 'none',
              width: '100%', padding: 0, fontFamily: 'inherit',
            }}
          />
        ) : (
          <p style={{
            fontSize: el.fontSize, fontWeight: 600,
            color: answer ? '#111827' : '#9ca3af',
            lineHeight: 1.4, wordBreak: 'break-all',
          }}>
            {answer || (answerMode ? (el.placeholder || 'タップして入力') : '—')}
          </p>
        )}
      </div>
    </div>
  )
}

export default function VisualCard({
  template, answers, scale = 1,
  editMode, selectedId, onSelect, onMove,
  answerMode, answerEditingId, onAnswerChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: string; sx: number; sy: number; ex: number; ey: number } | null>(null)

  const cardHeight = template.elements.reduce(
    (max, el) => Math.max(max, el.y + (el.type === 'line' ? el.strokeW : el.h) + 20),
    160
  )

  const onElPointerDown = useCallback((e: React.PointerEvent, el: VCardElement) => {
    if (!editMode) return
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    onSelect?.(el.id)
    dragRef.current = { id: el.id, sx: e.clientX, sy: e.clientY, ex: el.x, ey: el.y }
  }, [editMode, onSelect])

  const onElPointerMove = useCallback((e: React.PointerEvent, el: VCardElement) => {
    const d = dragRef.current
    if (!d || d.id !== el.id) return
    const dx = (e.clientX - d.sx) / scale
    const dy = (e.clientY - d.sy) / scale
    const nx = Math.max(0, Math.min(CARD_W - el.w, d.ex + dx))
    const ny = Math.max(0, Math.min(cardHeight - (el.type === 'line' ? el.strokeW : el.h), d.ey + dy))
    onMove?.(el.id, nx, ny)
  }, [scale, cardHeight, onMove])

  const onElPointerUp = useCallback(() => { dragRef.current = null }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: CARD_W,
        height: cardHeight,
        background: template.bg,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
        flexShrink: 0,
      }}
      onClick={e => { if (e.target === e.currentTarget) onSelect?.(null) }}
    >
      {template.elements.map(el => (
        <ElView
          key={el.id}
          el={el}
          answer={answers[el.fieldKey] ?? ''}
          scale={scale}
          editMode={editMode}
          isSelected={selectedId === el.id}
          answerMode={answerMode}
          isAnswerEditing={answerEditingId === el.id}
          onPointerDown={editMode ? e => onElPointerDown(e, el) : undefined}
          onPointerMove={editMode ? e => onElPointerMove(e, el) : undefined}
          onPointerUp={editMode ? onElPointerUp : undefined}
          onClick={answerMode ? e => { e.stopPropagation() } : undefined}
          onAnswerChange={v => onAnswerChange?.(el.fieldKey, v)}
        />
      ))}
    </div>
  )
}
