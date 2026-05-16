'use client'

import { useRef, useCallback } from 'react'
import Moveable, { OnDragEnd, OnRotateEnd, OnScaleEnd } from 'react-moveable'
import {
  CanvasElement, Background,
  GRID_COLS, GRID_ROWS,
  isGridPosition, isPctPosition,
} from '@/types'

interface Props {
  background: Background
  elements: CanvasElement[]
  editMode?: boolean
  selectedStickerId?: string | null
  onStickerSelect?: (id: string | null) => void
  onStickerUpdate?: (id: string, xPct: number, yPct: number, rotation: number, scale: number) => void
  onQuestionTap?: (el: CanvasElement) => void
  onEmptyCellTap?: (col: number, row: number) => void
}

function getBgStyle(bg: Background): React.CSSProperties {
  if (bg.type === 'solid') return { backgroundColor: bg.color }
  return { background: `linear-gradient(${bg.direction}, ${bg.from}, ${bg.to})` }
}

const DESIGN_COLORS: Record<string, { bg: string; label: string; border: string }> = {
  pink:   { bg: '#fff0f5', label: '#f472b6', border: '#fbcfe8' },
  purple: { bg: '#f5f3ff', label: '#a78bfa', border: '#ddd6fe' },
  mint:   { bg: '#f0fdfa', label: '#2dd4bf', border: '#99f6e4' },
  yellow: { bg: '#fffbeb', label: '#fbbf24', border: '#fde68a' },
  blue:   { bg: '#eff6ff', label: '#60a5fa', border: '#bfdbfe' },
}

function QuestionCard({ el, editMode, onTap }: {
  el: CanvasElement
  editMode?: boolean
  onTap?: () => void
}) {
  const content = el.content as { question: string; answer: string }
  const c = DESIGN_COLORS[el.style.design] ?? DESIGN_COLORS.pink

  return (
    <div
      onClick={editMode ? onTap : undefined}
      className="w-full h-full flex flex-col rounded-xl overflow-hidden"
      style={{
        backgroundColor: c.bg,
        border: `1.5px solid ${c.border}`,
        cursor: editMode ? 'pointer' : 'default',
        padding: '6% 8%',
      }}
    >
      <p
        className="font-bold leading-tight truncate"
        style={{ fontSize: '0.52rem', color: c.label, marginBottom: '4%' }}
      >
        {content.question}
      </p>
      <p
        className="font-semibold leading-tight"
        style={{
          fontSize: '0.62rem',
          color: content.answer ? '#1f2937' : '#d1d5db',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {content.answer || (editMode ? 'タップして入力' : '—')}
      </p>
    </div>
  )
}

function EmptyCell({ editMode, onTap }: { editMode?: boolean; onTap?: () => void }) {
  if (!editMode) return <div className="w-full h-full rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
  return (
    <div
      onClick={onTap}
      className="w-full h-full rounded-xl flex items-center justify-center"
      style={{
        border: '1.5px dashed rgba(255,255,255,0.4)',
        backgroundColor: 'rgba(255,255,255,0.08)',
        cursor: 'pointer',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', lineHeight: 1 }}>+</span>
    </div>
  )
}

export default function ProfileCanvas({
  background, elements, editMode,
  selectedStickerId, onStickerSelect, onStickerUpdate,
  onQuestionTap, onEmptyCellTap,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const stickerRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const setRef = useCallback((id: string) => (node: HTMLDivElement | null) => {
    if (node) stickerRefs.current.set(id, node)
    else stickerRefs.current.delete(id)
  }, [])

  const questions = elements.filter(e => e.type === 'question' && isGridPosition(e.position))
  const stickers = elements.filter(e => e.type === 'sticker' && isPctPosition(e.position))

  // グリッドマップ構築 "col_row" -> element
  const qMap = new Map(
    questions.map(q => {
      const p = q.position as { col: number; row: number }
      return [`${p.col}_${p.row}`, q]
    })
  )

  const selectedSticker = stickers.find(s => s.id === selectedStickerId)
  const selectedTarget = selectedStickerId ? stickerRefs.current.get(selectedStickerId) : null

  const handleDragEnd = useCallback((e: OnDragEnd) => {
    if (!canvasRef.current || !selectedSticker) return
    const { width, height } = canvasRef.current.getBoundingClientRect()
    const xPct = (parseFloat(e.target.style.left) / width) * 100
    const yPct = (parseFloat(e.target.style.top) / height) * 100
    onStickerUpdate?.(selectedSticker.id, xPct, yPct, selectedSticker.transform.rotation, selectedSticker.transform.scale)
  }, [selectedSticker, onStickerUpdate])

  const handleRotateEnd = useCallback((e: OnRotateEnd) => {
    if (!canvasRef.current || !selectedSticker) return
    const { width, height } = canvasRef.current.getBoundingClientRect()
    const match = e.target.style.transform.match(/rotate\(([-\d.]+)deg\)/)
    const rotation = match ? parseFloat(match[1]) : 0
    const xPct = (parseFloat(e.target.style.left || '0') / width) * 100
    const yPct = (parseFloat(e.target.style.top || '0') / height) * 100
    onStickerUpdate?.(selectedSticker.id, xPct, yPct, rotation, selectedSticker.transform.scale)
  }, [selectedSticker, onStickerUpdate])

  const handleScaleEnd = useCallback((e: OnScaleEnd) => {
    if (!canvasRef.current || !selectedSticker) return
    const { width, height } = canvasRef.current.getBoundingClientRect()
    const match = e.target.style.transform.match(/scale\(([-\d.]+)\)/)
    const scale = match ? parseFloat(match[1]) : 1
    const xPct = (parseFloat(e.target.style.left || '0') / width) * 100
    const yPct = (parseFloat(e.target.style.top || '0') / height) * 100
    onStickerUpdate?.(selectedSticker.id, xPct, yPct, selectedSticker.transform.rotation, scale)
  }, [selectedSticker, onStickerUpdate])

  return (
    // aspectRatio で端末幅に関係なくキャンバス縦横比を保持
    <div className="relative w-full" style={{ aspectRatio: '390 / 692' }}>
      <div
        ref={canvasRef}
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={getBgStyle(background)}
        onClick={(e) => {
          if (e.target === canvasRef.current) onStickerSelect?.(null)
        }}
      >
        {/* 質問グリッド層 (4列×7行) */}
        <div
          className="absolute inset-0"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
            gap: '1%',
            padding: '1.8%',
          }}
        >
          {Array.from({ length: GRID_ROWS }, (_, row) =>
            Array.from({ length: GRID_COLS }, (_, col) => {
              const el = qMap.get(`${col}_${row}`)
              return (
                <div key={`${col}_${row}`}>
                  {el
                    ? <QuestionCard el={el} editMode={editMode} onTap={() => onQuestionTap?.(el)} />
                    : <EmptyCell editMode={editMode} onTap={() => onEmptyCellTap?.(col, row)} />
                  }
                </div>
              )
            })
          )}
        </div>

        {/* スタンプ層 (グリッドの上に乗る) */}
        {stickers.map(s => {
          const p = s.position as { xPct: number; yPct: number }
          return (
            <div
              key={s.id}
              ref={setRef(s.id)}
              className="absolute"
              style={{
                left: `${p.xPct}%`,
                top: `${p.yPct}%`,
                transform: `rotate(${s.transform.rotation}deg) scale(${s.transform.scale})`,
                transformOrigin: 'center center',
                zIndex: 20 + s.z_index,
                cursor: editMode ? 'grab' : 'default',
                userSelect: 'none',
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (editMode) onStickerSelect?.(s.id)
              }}
            >
              <span style={{ fontSize: 44, lineHeight: 1, display: 'block' }}>
                {(s.content as { emoji: string }).emoji}
              </span>
            </div>
          )
        })}
      </div>

      {/* Moveable: canvasの外に置いてoverflow:hiddenの影響を避ける */}
      {editMode && selectedTarget && selectedSticker && (
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
            target.style.transform = `rotate(${rotation}deg) scale(${selectedSticker.transform.scale})`
          }}
          onRotateEnd={handleRotateEnd}
          onScale={({ target, scale, drag }) => {
            target.style.transform = `rotate(${selectedSticker.transform.rotation}deg) scale(${scale[0]})`
            target.style.left = `${drag.left}px`
            target.style.top = `${drag.top}px`
          }}
          onScaleEnd={handleScaleEnd}
        />
      )}
    </div>
  )
}
