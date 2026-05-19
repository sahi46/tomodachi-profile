'use client'

import { useRef, useCallback } from 'react'
import { CanvasElement, Background, PctPosition } from '@/types'
import TemplateCard from '@/components/TemplateCard'
import VisualCard from '@/components/VisualCard'
import { TEMPLATES, Template } from '@/lib/templates'
import { VCardTemplate } from '@/lib/visual-card'

interface Props {
  background: Background
  elements: CanvasElement[]
  editMode?: boolean
  answerMode?: boolean
  fullScreen?: boolean
  contained?: boolean
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onUpdate?: (id: string, pos: PctPosition, transform: { rotation: number; scale: number }) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  // question block tap (answer mode only)
  onTapQuestion?: (id: string) => void
  // template_card/visual_card inline answer (keep for structured cards)
  onTapCard?: (id: string) => void
  answerEditingId?: string | null
  onAnswerChange?: (id: string, value: string | Record<string, string>) => void
  onCanvasTap?: () => void
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

// ── QuestionBlock: pure decoration, no input ever ────────────────
function QuestionBlock({ question, design, answerMode, answered }: {
  question: string; design: string; answerMode?: boolean; answered?: boolean
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
      outline: answerMode && !answered ? `2px dashed ${c.border}` : 'none',
      outlineOffset: 2,
    }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: c.label, letterSpacing: '0.04em' }}>
        {question}
      </p>
      {answerMode && !answered && (
        <p style={{ fontSize: 9, color: 'rgba(0,0,0,0.3)', marginTop: 4, fontStyle: 'italic' }}>
          タップして回答 →
        </p>
      )}
    </div>
  )
}

// ── AnswerText: free-floating styled text ────────────────────────
function AnswerTextEl({ text, color, fontSize, fontBold }: {
  text: string; color: string; fontSize: number; fontBold: boolean
}) {
  return (
    <p style={{
      fontSize,
      color,
      fontWeight: fontBold ? 700 : 600,
      lineHeight: 1.3,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      maxWidth: 220,
      textShadow: color === '#ffffff' ? '0 1px 6px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.12)',
      pointerEvents: 'none',
      userSelect: 'none',
    }}>
      {text}
    </p>
  )
}

// ── pointer tracking types ──────────────────────────────────────
type ActivePointer = { elId: string; x: number; y: number }
type DragState = {
  elId: string
  startClientX: number; startClientY: number
  startXPct: number; startYPct: number
  moved: boolean
}
type GestureState = {
  elId: string
  p1: number; p2: number
  startDist: number; startAngle: number
  startScale: number; startRotation: number
  currentScale: number; currentRotation: number
}

export default function ProfileCanvas({
  background, elements, editMode, answerMode, fullScreen, contained,
  selectedId, onSelect, onUpdate, onDragStart, onDragEnd,
  onTapQuestion, onTapCard, answerEditingId, onAnswerChange, onCanvasTap,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const elRefs    = useRef<Map<string, HTMLDivElement>>(new Map())

  const activePointers = useRef<Map<number, ActivePointer>>(new Map())
  const drag    = useRef<DragState | null>(null)
  const gesture = useRef<GestureState | null>(null)
  const dragMoved = useRef(false) // survives pointer-up for onClick check

  const setRef = useCallback((id: string) => (node: HTMLDivElement | null) => {
    if (node) elRefs.current.set(id, node)
    else elRefs.current.delete(id)
  }, [])

  // An element participates in drag/gesture if:
  // - edit mode (all elements)
  // - answer mode AND it's an answer_text element
  const isDraggable = (el: CanvasElement) =>
    editMode === true || (answerMode === true && el.type === 'answer_text')

  const handlePointerDown = useCallback((e: React.PointerEvent, el: CanvasElement) => {
    if (!isDraggable(el)) return
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    onSelect?.(el.id)
    dragMoved.current = false

    activePointers.current.set(e.pointerId, { elId: el.id, x: e.clientX, y: e.clientY })

    const sameEl = [...activePointers.current.entries()].filter(([, v]) => v.elId === el.id)

    if (sameEl.length >= 2) {
      if (drag.current?.moved) onDragEnd?.()
      drag.current = null

      const [id1, v1] = sameEl[sameEl.length - 2]
      const [id2, v2] = sameEl[sameEl.length - 1]
      const dx = v2.x - v1.x, dy = v2.y - v1.y
      gesture.current = {
        elId: el.id, p1: id1, p2: id2,
        startDist:       Math.hypot(dx, dy),
        startAngle:      Math.atan2(dy, dx) * 180 / Math.PI,
        startScale:      el.transform.scale,
        startRotation:   el.transform.rotation,
        currentScale:    el.transform.scale,
        currentRotation: el.transform.rotation,
      }
    } else {
      gesture.current = null
      drag.current = {
        elId: el.id,
        startClientX: e.clientX, startClientY: e.clientY,
        startXPct: (el.position as PctPosition).xPct,
        startYPct: (el.position as PctPosition).yPct,
        moved: false,
      }
    }
  }, [editMode, answerMode, onSelect, onDragEnd]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePointerMove = useCallback((e: React.PointerEvent, elId: string) => {
    const ap = activePointers.current.get(e.pointerId)
    if (ap && ap.elId === elId) {
      activePointers.current.set(e.pointerId, { ...ap, x: e.clientX, y: e.clientY })
    }

    const g = gesture.current
    if (g && g.elId === elId) {
      const p1 = activePointers.current.get(g.p1)
      const p2 = activePointers.current.get(g.p2)
      if (!p1 || !p2) return
      const dx = p2.x - p1.x, dy = p2.y - p1.y
      const dist  = Math.hypot(dx, dy)
      const angle = Math.atan2(dy, dx) * 180 / Math.PI
      g.currentScale    = Math.max(0.3, Math.min(3, g.startScale * (dist / g.startDist)))
      g.currentRotation = g.startRotation + (angle - g.startAngle)
      const dom = elRefs.current.get(elId)
      if (dom) dom.style.transform = `rotate(${g.currentRotation}deg) scale(${g.currentScale})`
      return
    }

    const d = drag.current
    if (!d || d.elId !== elId) return
    const dx = e.clientX - d.startClientX
    const dy = e.clientY - d.startClientY
    if (!d.moved && Math.hypot(dx, dy) > 6) {
      d.moved = true
      dragMoved.current = true
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
    const g = gesture.current
    if (g && g.elId === el.id && (e.pointerId === g.p1 || e.pointerId === g.p2)) {
      onUpdate?.(el.id, el.position as PctPosition, {
        rotation: parseFloat(g.currentRotation.toFixed(2)),
        scale:    parseFloat(g.currentScale.toFixed(3)),
      })
      gesture.current = null
      activePointers.current.delete(e.pointerId)
      return
    }
    activePointers.current.delete(e.pointerId)

    const d = drag.current
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
    drag.current = null
  }, [onUpdate, onDragEnd])

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId)
    if (drag.current?.moved) onDragEnd?.()
    drag.current = null
    gesture.current = null
  }, [onDragEnd])

  const outerStyle: React.CSSProperties = fullScreen
    ? { position: 'fixed', inset: 0 }
    : contained
    ? { position: 'relative', width: '100%', height: '100%' }
    : { position: 'relative', width: '100%', aspectRatio: '9/16' }

  return (
    <div style={outerStyle}>
      <div
        ref={canvasRef}
        className={fullScreen ? 'absolute inset-0' : 'absolute inset-0 overflow-hidden'}
        style={{
          ...getBgStyle(background),
          touchAction: (editMode || answerMode) ? 'none' : 'auto',
          borderRadius: fullScreen ? 0 : 24,
        }}
        onClick={e => {
          if ((editMode || answerMode) && e.target === canvasRef.current) {
            onSelect?.(null)
            onCanvasTap?.()
          }
        }}
      >
        {elements.map(el => {
          const p = el.position as PctPosition
          const isThisEditing = answerEditingId === el.id
          const draggable = isDraggable(el)
          const isSelected = selectedId === el.id

          return (
            <div
              key={el.id}
              ref={setRef(el.id)}
              className="absolute"
              style={{
                left: `${p.xPct}%`,
                top:  `${p.yPct}%`,
                transform: `rotate(${el.transform.rotation}deg) scale(${el.transform.scale})`,
                transformOrigin: 'center',
                zIndex: el.z_index + (isSelected ? 100 : 0) + (isThisEditing ? 200 : 0),
                cursor: draggable ? (isSelected ? 'grabbing' : 'grab') : (answerMode && el.type === 'question' ? 'pointer' : 'default'),
                userSelect: 'none',
                touchAction: 'none',
                WebkitUserSelect: 'none',
                // Selection ring for answer_text in answer mode
                outline: (answerMode && el.type === 'answer_text' && isSelected)
                  ? '2px solid rgba(99,102,241,0.8)' : 'none',
                borderRadius: 4,
              }}
              onPointerDown={draggable ? e => handlePointerDown(e, el) : undefined}
              onPointerMove={draggable ? e => handlePointerMove(e, el.id) : undefined}
              onPointerUp={draggable ? e => handlePointerUp(e, el) : undefined}
              onPointerCancel={draggable ? e => handlePointerCancel(e) : undefined}
              onClick={e => {
                e.stopPropagation()
                if (dragMoved.current) return // was a drag, not a tap
                if (answerMode) {
                  if (el.type === 'question') { onTapQuestion?.(el.id); return }
                  if (el.type === 'template_card' || el.type === 'visual_card') { onTapCard?.(el.id); return }
                  if (el.type === 'answer_text') { onSelect?.(isSelected ? null : el.id); return }
                }
              }}
            >
              {/* ── Sticker ── */}
              {el.type === 'sticker' && (
                <span style={{ fontSize: 52, lineHeight: 1, display: 'block', pointerEvents: 'none' }}>
                  {(el.content as { emoji: string }).emoji}
                </span>
              )}

              {/* ── QuestionBlock (decoration only) ── */}
              {el.type === 'question' && (
                <QuestionBlock
                  question={(el.content as { question: string }).question}
                  design={el.style.design ?? 'pink'}
                  answerMode={answerMode}
                  answered={false}
                />
              )}

              {/* ── AnswerText ── */}
              {el.type === 'answer_text' && (
                <AnswerTextEl
                  text={(el.content as { text: string }).text}
                  color={el.style.color ?? '#111827'}
                  fontSize={parseInt(el.style.fontSize ?? '20')}
                  fontBold={el.style.fontBold === 'true'}
                />
              )}

              {/* ── TemplateCard ── */}
              {el.type === 'template_card' && (() => {
                const c = el.content as { templateId: string; templateData?: Template; answers: Record<string, string> }
                const tmpl = TEMPLATES.find(t => t.id === c.templateId) ?? c.templateData
                if (!tmpl) return null
                return (
                  <div style={{ outline: answerMode && !isThisEditing ? '2px dashed rgba(168,85,247,0.4)' : 'none', borderRadius: 16 }}>
                    <TemplateCard
                      template={tmpl}
                      answers={c.answers}
                      isEditing={isThisEditing}
                      onAnswerChange={(key, val) => {
                        const prev = c.answers ?? {}
                        onAnswerChange?.(el.id, { ...prev, [key]: val })
                      }}
                    />
                  </div>
                )
              })()}

              {/* ── VisualCard ── */}
              {el.type === 'visual_card' && (() => {
                const c = el.content as { template: VCardTemplate; answers: Record<string, string> }
                if (!c.template) return null
                return (
                  <div style={{ outline: answerMode && !isThisEditing ? '2px dashed rgba(99,102,241,0.4)' : 'none', borderRadius: 16 }}>
                    <VisualCard
                      template={c.template}
                      answers={c.answers ?? {}}
                      scale={0.5}
                      answerMode={answerMode}
                      answerEditingId={isThisEditing ? '__all__' : null}
                      onAnswerChange={(key, val) => {
                        const prev = c.answers ?? {}
                        onAnswerChange?.(el.id, { ...prev, [key]: val })
                      }}
                    />
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
