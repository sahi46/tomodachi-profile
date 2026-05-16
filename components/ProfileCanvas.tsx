'use client'

import { useRef, useCallback } from 'react'
import Moveable, { OnDragEnd, OnRotateEnd, OnScaleEnd } from 'react-moveable'
import { CanvasElement, Background, PctPosition } from '@/types'

interface Props {
  background: Background
  elements: CanvasElement[]
  editMode?: boolean
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onUpdate?: (id: string, pos: PctPosition, transform: { rotation: number; scale: number }) => void
}

function getBgStyle(bg: Background): React.CSSProperties {
  if (bg.type === 'solid') return { backgroundColor: bg.color }
  return { background: `linear-gradient(${bg.direction}, ${bg.from}, ${bg.to})` }
}

const CARD_DESIGNS: Record<string, { border: string; label: string; bg: string }> = {
  pink:   { border: '#f9a8d4', label: '#ec4899', bg: 'rgba(255,255,255,0.93)' },
  purple: { border: '#c4b5fd', label: '#8b5cf6', bg: 'rgba(255,255,255,0.93)' },
  mint:   { border: '#6ee7b7', label: '#10b981', bg: 'rgba(255,255,255,0.93)' },
  yellow: { border: '#fcd34d', label: '#f59e0b', bg: 'rgba(255,255,255,0.93)' },
  blue:   { border: '#93c5fd', label: '#3b82f6', bg: 'rgba(255,255,255,0.93)' },
}

function QuestionCard({
  question, answer, design, editMode,
}: {
  question: string; answer: string; design: string; editMode?: boolean
}) {
  const c = CARD_DESIGNS[design] ?? CARD_DESIGNS.pink
  return (
    <div
      style={{
        width: 148,
        backgroundColor: c.bg,
        borderRadius: 14,
        borderLeft: `4px solid ${c.border}`,
        padding: '10px 12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
        pointerEvents: 'none',
      }}
    >
      <p style={{ fontSize: 9, fontWeight: 700, color: c.label, marginBottom: 5, letterSpacing: '0.03em' }}>
        {question}
      </p>
      <p style={{
        fontSize: 13,
        fontWeight: 700,
        color: answer ? '#111827' : '#d1d5db',
        lineHeight: 1.4,
        wordBreak: 'break-all',
      }}>
        {answer || (editMode ? 'タップして入力' : '—')}
      </p>
    </div>
  )
}

export default function ProfileCanvas({ background, elements, editMode, selectedId, onSelect, onUpdate }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const elRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const setRef = useCallback((id: string) => (node: HTMLDivElement | null) => {
    if (node) elRefs.current.set(id, node)
    else elRefs.current.delete(id)
  }, [])

  const selectedEl = elements.find(e => e.id === selectedId)
  const selectedTarget = selectedId ? elRefs.current.get(selectedId) ?? null : null

  const pxToPct = useCallback((pxLeft: number, pxTop: number): PctPosition => {
    const canvas = canvasRef.current
    if (!canvas) return { xPct: 0, yPct: 0 }
    const { width, height } = canvas.getBoundingClientRect()
    return { xPct: (pxLeft / width) * 100, yPct: (pxTop / height) * 100 }
  }, [])

  const handleDragEnd = useCallback((e: OnDragEnd) => {
    if (!selectedEl) return
    const pos = pxToPct(parseFloat(e.target.style.left), parseFloat(e.target.style.top))
    onUpdate?.(selectedEl.id, pos, selectedEl.transform)
  }, [selectedEl, onUpdate, pxToPct])

  const handleRotateEnd = useCallback((e: OnRotateEnd) => {
    if (!selectedEl) return
    const match = e.target.style.transform.match(/rotate\(([-\d.]+)deg\)/)
    const rotation = match ? parseFloat(match[1]) : 0
    const pos = pxToPct(parseFloat(e.target.style.left || '0'), parseFloat(e.target.style.top || '0'))
    onUpdate?.(selectedEl.id, pos, { ...selectedEl.transform, rotation })
  }, [selectedEl, onUpdate, pxToPct])

  const handleScaleEnd = useCallback((e: OnScaleEnd) => {
    if (!selectedEl) return
    const match = e.target.style.transform.match(/scale\(([-\d.]+)\)/)
    const scale = match ? parseFloat(match[1]) : 1
    const pos = pxToPct(parseFloat(e.target.style.left || '0'), parseFloat(e.target.style.top || '0'))
    onUpdate?.(selectedEl.id, pos, { ...selectedEl.transform, scale })
  }, [selectedEl, onUpdate, pxToPct])

  return (
    <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
      <div
        ref={canvasRef}
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{ ...getBgStyle(background), touchAction: 'none' }}
        onClick={(e) => { if (e.target === canvasRef.current) onSelect?.(null) }}
      >
        {elements.map((el) => {
          const p = el.position as PctPosition
          const isSelected = el.id === selectedId
          return (
            <div
              key={el.id}
              ref={setRef(el.id)}
              className="absolute"
              style={{
                left: `${p.xPct}%`,
                top: `${p.yPct}%`,
                transform: `rotate(${el.transform.rotation}deg) scale(${el.transform.scale})`,
                transformOrigin: 'top left',
                zIndex: el.z_index + (isSelected ? 100 : 0),
                cursor: editMode ? 'grab' : 'default',
                userSelect: 'none',
                // インスタ風: 選択中は輝く白のリング
                filter: isSelected ? 'drop-shadow(0 0 0 2px white)' : 'none',
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (editMode) onSelect?.(el.id)
              }}
            >
              {el.type === 'sticker' && (
                <span style={{ fontSize: 48, lineHeight: 1, display: 'block' }}>
                  {(el.content as { emoji: string }).emoji}
                </span>
              )}
              {el.type === 'question' && (
                <QuestionCard
                  question={(el.content as { question: string; answer: string }).question}
                  answer={(el.content as { question: string; answer: string }).answer}
                  design={el.style.design ?? 'pink'}
                  editMode={editMode}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Moveableはoverflow:hiddenの外に置く */}
      {editMode && selectedTarget && selectedEl && (
        <Moveable
          target={selectedTarget}
          draggable rotatable scalable keepRatio
          throttleDrag={0} throttleRotate={0} throttleScale={0}
          onDrag={({ target, left, top }) => {
            target.style.left = `${left}px`
            target.style.top = `${top}px`
          }}
          onDragEnd={handleDragEnd}
          onRotate={({ target, rotation }) => {
            target.style.transform = `rotate(${rotation}deg) scale(${selectedEl.transform.scale})`
          }}
          onRotateEnd={handleRotateEnd}
          onScale={({ target, scale, drag }) => {
            target.style.transform = `rotate(${selectedEl.transform.rotation}deg) scale(${scale[0]})`
            target.style.left = `${drag.left}px`
            target.style.top = `${drag.top}px`
          }}
          onScaleEnd={handleScaleEnd}
        />
      )}
    </div>
  )
}
