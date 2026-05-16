'use client'

import { useRef, useCallback } from 'react'
import Moveable, { OnDragEnd, OnRotateEnd, OnScaleEnd } from 'react-moveable'
import { CanvasElement, Background, PctPosition } from '@/types'
import TemplateCard from '@/components/TemplateCard'
import { TEMPLATES } from '@/lib/templates'

interface Props {
  background: Background
  elements: CanvasElement[]
  editMode?: boolean
  fullScreen?: boolean          // editor: true → fixed inset-0, viewer: false → 9:16 card
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onUpdate?: (id: string, pos: PctPosition, transform: { rotation: number; scale: number }) => void
}

function getBgStyle(bg: Background): React.CSSProperties {
  if (bg.type === 'solid') return { backgroundColor: bg.color }
  return { background: `linear-gradient(${bg.direction}, ${bg.from}, ${bg.to})` }
}

const CARD_DESIGNS: Record<string, { border: string; label: string }> = {
  pink:   { border: '#f9a8d4', label: '#ec4899' },
  purple: { border: '#c4b5fd', label: '#8b5cf6' },
  mint:   { border: '#6ee7b7', label: '#10b981' },
  yellow: { border: '#fcd34d', label: '#f59e0b' },
  blue:   { border: '#93c5fd', label: '#3b82f6' },
}

function QuestionCard({ question, answer, design, editMode }: {
  question: string; answer: string; design: string; editMode?: boolean
}) {
  const c = CARD_DESIGNS[design] ?? CARD_DESIGNS.pink
  return (
    <div style={{
      width: 150,
      backgroundColor: 'rgba(255,255,255,0.93)',
      borderRadius: 14,
      borderLeft: `4px solid ${c.border}`,
      padding: '10px 12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      pointerEvents: 'none',
    }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: c.label, marginBottom: 5, letterSpacing: '0.04em' }}>
        {question}
      </p>
      <p style={{
        fontSize: 13, fontWeight: 700, lineHeight: 1.4,
        color: answer ? '#111827' : '#9ca3af',
        wordBreak: 'break-all',
      }}>
        {answer || (editMode ? 'タップして入力' : '—')}
      </p>
    </div>
  )
}

export default function ProfileCanvas({
  background, elements, editMode, fullScreen,
  selectedId, onSelect, onUpdate,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const elRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const setRef = useCallback((id: string) => (node: HTMLDivElement | null) => {
    if (node) elRefs.current.set(id, node)
    else elRefs.current.delete(id)
  }, [])

  const selectedEl = elements.find(e => e.id === selectedId)
  const selectedTarget = selectedId ? elRefs.current.get(selectedId) ?? null : null

  const pxToPct = useCallback((pxLeft: number, pxTop: number): PctPosition => {
    const c = canvasRef.current
    if (!c) return { xPct: 0, yPct: 0 }
    const { width, height } = c.getBoundingClientRect()
    return { xPct: (pxLeft / width) * 100, yPct: (pxTop / height) * 100 }
  }, [])

  const handleDragEnd = useCallback((e: OnDragEnd) => {
    if (!selectedEl) return
    onUpdate?.(selectedEl.id, pxToPct(parseFloat(e.target.style.left), parseFloat(e.target.style.top)), selectedEl.transform)
  }, [selectedEl, onUpdate, pxToPct])

  const handleRotateEnd = useCallback((e: OnRotateEnd) => {
    if (!selectedEl) return
    const match = e.target.style.transform.match(/rotate\(([-\d.]+)deg\)/)
    const rotation = match ? parseFloat(match[1]) : 0
    onUpdate?.(selectedEl.id, pxToPct(parseFloat(e.target.style.left || '0'), parseFloat(e.target.style.top || '0')), { ...selectedEl.transform, rotation })
  }, [selectedEl, onUpdate, pxToPct])

  const handleScaleEnd = useCallback((e: OnScaleEnd) => {
    if (!selectedEl) return
    const match = e.target.style.transform.match(/scale\(([-\d.]+)\)/)
    const scale = match ? parseFloat(match[1]) : 1
    onUpdate?.(selectedEl.id, pxToPct(parseFloat(e.target.style.left || '0'), parseFloat(e.target.style.top || '0')), { ...selectedEl.transform, scale })
  }, [selectedEl, onUpdate, pxToPct])

  // fullScreen: editorで使用 → fixed inset-0
  // normal:    公開ページで使用 → aspect-ratio 9/16
  const outerStyle: React.CSSProperties = fullScreen
    ? { position: 'fixed', inset: 0 }
    : { position: 'relative', width: '100%', aspectRatio: '9/16' }

  return (
    <div style={outerStyle}>
      <div
        ref={canvasRef}
        className={fullScreen ? 'absolute inset-0' : 'absolute inset-0 rounded-3xl overflow-hidden'}
        style={{ ...getBgStyle(background), touchAction: editMode ? 'none' : 'auto' }}
        onClick={(e) => { if (e.target === canvasRef.current) onSelect?.(null) }}
      >
        {elements.map((el) => {
          const p = el.position as PctPosition
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
                zIndex: el.z_index + (selectedId === el.id ? 100 : 0),
                cursor: editMode ? 'grab' : 'default',
                userSelect: 'none',
              }}
              onClick={(e) => { e.stopPropagation(); if (editMode) onSelect?.(el.id) }}
            >
              {el.type === 'sticker' && (
                <span style={{ fontSize: 52, lineHeight: 1, display: 'block' }}>
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
              {el.type === 'template_card' && (() => {
                const c = el.content as { templateId: string; answers: Record<string, string> }
                const tmpl = TEMPLATES.find(t => t.id === c.templateId)
                if (!tmpl) return null
                return <TemplateCard template={tmpl} answers={c.answers} editMode={editMode} />
              })()}
            </div>
          )
        })}
      </div>

      {editMode && selectedTarget && selectedEl && (
        <Moveable
          target={selectedTarget}
          draggable rotatable scalable keepRatio
          throttleDrag={0} throttleRotate={0} throttleScale={0}
          onDrag={({ target, left, top }) => { target.style.left = `${left}px`; target.style.top = `${top}px` }}
          onDragEnd={handleDragEnd}
          onRotate={({ target, rotation }) => { target.style.transform = `rotate(${rotation}deg) scale(${selectedEl.transform.scale})` }}
          onRotateEnd={handleRotateEnd}
          onScale={({ target, scale, drag }) => {
            target.style.transform = `rotate(${selectedEl.transform.rotation}deg) scale(${scale[0]})`
            target.style.left = `${drag.left}px`; target.style.top = `${drag.top}px`
          }}
          onScaleEnd={handleScaleEnd}
        />
      )}
    </div>
  )
}
