'use client'

import { useRef, useCallback } from 'react'
import Moveable from 'react-moveable'
import { CanvasElement, Background } from '@/types'
import QuestionCard from './QuestionCard'

interface Props {
  background: Background
  elements: CanvasElement[]
  onElementUpdate: (id: string, position: { x: number; y: number }, transform: { rotation: number; scale: number }) => void
  onElementSelect: (id: string | null) => void
  selectedId: string | null
}

function getBackgroundStyle(bg: Background): React.CSSProperties {
  if (bg.type === 'solid') return { backgroundColor: bg.color }
  return { background: `linear-gradient(${bg.direction}, ${bg.from}, ${bg.to})` }
}

export default function ProfileCanvas({ background, elements, onElementUpdate, onElementSelect, selectedId }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  // useRefでMapを管理することで再レンダーを防ぐ
  const elRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const setRef = useCallback((id: string) => (node: HTMLDivElement | null) => {
    if (node) {
      elRefs.current.set(id, node)
    } else {
      elRefs.current.delete(id)
    }
  }, [])

  const selectedElement = elements.find(e => e.id === selectedId)
  const selectedTarget = selectedId ? elRefs.current.get(selectedId) ?? null : null

  return (
    <div className="relative flex-shrink-0" style={{ width: 390, height: 690 }}>
      <div
        ref={canvasRef}
        className="w-full h-full overflow-hidden rounded-3xl shadow-2xl relative select-none"
        style={getBackgroundStyle(background)}
        onClick={(e) => {
          if (e.target === canvasRef.current) onElementSelect(null)
        }}
      >
        {elements.map((el) => (
          <div
            key={el.id}
            ref={setRef(el.id)}
            className="absolute cursor-grab active:cursor-grabbing"
            style={{
              left: el.position.x,
              top: el.position.y,
              transform: `rotate(${el.transform.rotation}deg) scale(${el.transform.scale})`,
              transformOrigin: 'center center',
              zIndex: el.z_index,
              outline: selectedId === el.id ? '2px dashed #60a5fa' : 'none',
              outlineOffset: '4px',
              borderRadius: '4px',
            }}
            onClick={(e) => {
              e.stopPropagation()
              onElementSelect(el.id)
            }}
          >
            {el.type === 'sticker' && (
              <span style={{ fontSize: 56, lineHeight: 1, display: 'block', userSelect: 'none' }}>
                {(el.content as { emoji: string }).emoji}
              </span>
            )}
            {el.type === 'question' && (
              <QuestionCard
                question={(el.content as { question: string; answer: string }).question}
                answer={(el.content as { question: string; answer: string }).answer}
                style={el.style}
              />
            )}
            {el.type === 'text' && (
              <span
                className="font-bold text-xl"
                style={{ color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', userSelect: 'none' }}
              >
                {(el.content as { text: string }).text}
              </span>
            )}
          </div>
        ))}
      </div>

      {selectedTarget && selectedElement && (
        <Moveable
          target={selectedTarget}
          draggable
          rotatable
          scalable
          keepRatio
          throttleDrag={0}
          throttleRotate={0}
          throttleScale={0}
          onDrag={({ target, left, top }) => {
            target.style.left = `${left}px`
            target.style.top = `${top}px`
          }}
          onDragEnd={({ target }) => {
            onElementUpdate(
              selectedElement.id,
              { x: parseFloat(target.style.left || '0'), y: parseFloat(target.style.top || '0') },
              selectedElement.transform
            )
          }}
          onRotate={({ target, rotation }) => {
            target.style.transform = `rotate(${rotation}deg) scale(${selectedElement.transform.scale})`
          }}
          onRotateEnd={({ target }) => {
            const match = target.style.transform.match(/rotate\(([-\d.]+)deg\)/)
            const rotation = match ? parseFloat(match[1]) : 0
            onElementUpdate(
              selectedElement.id,
              selectedElement.position,
              { ...selectedElement.transform, rotation }
            )
          }}
          onScale={({ target, scale, drag }) => {
            target.style.transform = `rotate(${selectedElement.transform.rotation}deg) scale(${scale[0]})`
            target.style.left = `${drag.left}px`
            target.style.top = `${drag.top}px`
          }}
          onScaleEnd={({ target }) => {
            const match = target.style.transform.match(/scale\(([-\d.]+)\)/)
            const scale = match ? parseFloat(match[1]) : 1
            onElementUpdate(
              selectedElement.id,
              { x: parseFloat(target.style.left || '0'), y: parseFloat(target.style.top || '0') },
              { ...selectedElement.transform, scale }
            )
          }}
        />
      )}
    </div>
  )
}
