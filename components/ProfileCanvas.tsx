'use client'

import { useRef, useCallback } from 'react'
import { CanvasElement, Background, PctPosition } from '@/types'
import TemplateCard from '@/components/TemplateCard'
import { TEMPLATES } from '@/lib/templates'

interface Props {
  background: Background
  elements: CanvasElement[]
  editMode?: boolean
  fullScreen?: boolean
  contained?: boolean
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onUpdate?: (id: string, pos: PctPosition, transform: { rotation: number; scale: number }) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onTapElement?: (id: string) => void
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

function QuestionCard({ question, answer, design, answerMode }: {
  question: string; answer: string; design: string; answerMode?: boolean
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
      outline: answerMode && !answer ? `2px dashed ${c.border}` : 'none',
    }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: c.label, marginBottom: 5, letterSpacing: '0.04em' }}>
        {question}
      </p>
      <p style={{
        fontSize: 13, fontWeight: 700, lineHeight: 1.4,
        color: answer ? '#111827' : '#9ca3af',
        wordBreak: 'break-all',
      }}>
        {answer || (answerMode ? 'タップして回答' : '—')}
      </p>
    </div>
  )
}

export default function ProfileCanvas({
  background, elements, editMode, fullScreen, contained,
  selectedId, onSelect, onUpdate, onDragStart, onDragEnd, onTapElement,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const elRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const dragging = useRef<{
    elId: string
    startClientX: number
    startClientY: number
    startXPct: number
    startYPct: number
    moved: boolean
  } | null>(null)

  const setRef = useCallback((id: string) => (node: HTMLDivElement | null) => {
    if (node) elRefs.current.set(id, node)
    else elRefs.current.delete(id)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent, el: CanvasElement) => {
    if (!editMode) return
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    onSelect?.(el.id)
    const p = el.position as PctPosition
    dragging.current = {
      elId: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXPct: p.xPct,
      startYPct: p.yPct,
      moved: false,
    }
  }, [editMode, onSelect])

  const handlePointerMove = useCallback((e: React.PointerEvent, elId: string) => {
    const d = dragging.current
    if (!d || d.elId !== elId) return
    const dx = e.clientX - d.startClientX
    const dy = e.clientY - d.startClientY

    if (!d.moved && Math.hypot(dx, dy) > 6) {
      d.moved = true
      onDragStart?.()
    }
    if (!d.moved) return

    const c = canvasRef.current
    if (!c) return
    const { width, height } = c.getBoundingClientRect()
    const newX = Math.max(0, Math.min(90, d.startXPct + (dx / width) * 100))
    const newY = Math.max(0, Math.min(95, d.startYPct + (dy / height) * 100))

    const dom = elRefs.current.get(elId)
    if (dom) { dom.style.left = `${newX}%`; dom.style.top = `${newY}%` }
  }, [onDragStart])

  const handlePointerUp = useCallback((e: React.PointerEvent, el: CanvasElement) => {
    const d = dragging.current
    if (!d || d.elId !== el.id) return

    if (d.moved) {
      const dom = elRefs.current.get(el.id)
      if (dom) {
        onUpdate?.(el.id, {
          xPct: parseFloat(dom.style.left),
          yPct: parseFloat(dom.style.top),
        }, el.transform)
      }
      onDragEnd?.()
    }
    dragging.current = null
  }, [onUpdate, onDragEnd])

  const handlePointerCancel = useCallback(() => {
    if (dragging.current?.moved) onDragEnd?.()
    dragging.current = null
  }, [onDragEnd])

  const outerStyle: React.CSSProperties = fullScreen
    ? { position: 'fixed', inset: 0 }
    : contained
    ? { position: 'relative', width: '100%', height: '100%' }
    : { position: 'relative', width: '100%', aspectRatio: '9/16' }

  const answerMode = !editMode && !!onTapElement

  return (
    <div style={outerStyle}>
      <div
        ref={canvasRef}
        className={fullScreen ? 'absolute inset-0' : 'absolute inset-0 overflow-hidden'}
        style={{
          ...getBgStyle(background),
          touchAction: editMode ? 'none' : 'auto',
          borderRadius: fullScreen ? 0 : 24,
        }}
        onClick={e => {
          if (editMode && e.target === canvasRef.current) onSelect?.(null)
        }}
      >
        {elements.map(el => {
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
                cursor: editMode ? 'grab' : (answerMode ? 'pointer' : 'default'),
                userSelect: 'none',
                touchAction: 'none',
                WebkitUserSelect: 'none',
              }}
              onPointerDown={editMode ? e => handlePointerDown(e, el) : undefined}
              onPointerMove={editMode ? e => handlePointerMove(e, el.id) : undefined}
              onPointerUp={editMode ? e => handlePointerUp(e, el) : undefined}
              onPointerCancel={editMode ? handlePointerCancel : undefined}
              onClick={e => {
                e.stopPropagation()
                if (answerMode) onTapElement!(el.id)
              }}
            >
              {el.type === 'sticker' && (
                <span style={{ fontSize: 52, lineHeight: 1, display: 'block', pointerEvents: 'none' }}>
                  {(el.content as { emoji: string }).emoji}
                </span>
              )}
              {el.type === 'question' && (
                <QuestionCard
                  question={(el.content as { question: string; answer: string }).question}
                  answer={(el.content as { question: string; answer: string }).answer}
                  design={el.style.design ?? 'pink'}
                  answerMode={answerMode}
                />
              )}
              {el.type === 'template_card' && (() => {
                const c = el.content as { templateId: string; answers: Record<string, string> }
                const tmpl = TEMPLATES.find(t => t.id === c.templateId)
                if (!tmpl) return null
                return (
                  <div style={{ pointerEvents: 'none', outline: answerMode ? '2px dashed rgba(168,85,247,0.4)' : 'none', borderRadius: 16 }}>
                    <TemplateCard template={tmpl} answers={c.answers} />
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
