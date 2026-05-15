'use client'

import { useRef, useState } from 'react'
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
  if (bg.type === 'solid') {
    return { backgroundColor: bg.color }
  }
  return {
    background: `linear-gradient(${bg.direction}, ${bg.from}, ${bg.to})`,
  }
}

export default function ProfileCanvas({ background, elements, onElementUpdate, onElementSelect, selectedId }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement | null>(null)
  const [targets, setTargets] = useState<Map<string, HTMLDivElement>>(new Map())

  const setElementRef = (id: string, el: HTMLDivElement | null) => {
    if (el) {
      setTargets(prev => new Map(prev).set(id, el))
      if (id === selectedId) targetRef.current = el
    }
  }

  const selectedElement = elements.find(e => e.id === selectedId)
  const selectedTarget = selectedId ? targets.get(selectedId) : null

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
            ref={(node) => setElementRef(el.id, node)}
            className="absolute cursor-grab active:cursor-grabbing"
            style={{
              left: el.position.x,
              top: el.position.y,
              transform: `rotate(${el.transform.rotation}deg) scale(${el.transform.scale})`,
              transformOrigin: 'center center',
              zIndex: el.z_index,
              outline: selectedId === el.id ? '2px solid #60a5fa' : 'none',
              outlineOffset: '4px',
              borderRadius: '4px',
            }}
            onClick={(e) => {
              e.stopPropagation()
              onElementSelect(el.id)
              if (targets.get(el.id)) targetRef.current = targets.get(el.id)!
            }}
          >
            {el.type === 'sticker' && (
              <span className="text-5xl leading-none select-none" style={{ fontSize: 56 }}>
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
                className="text-white font-bold text-xl select-none"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}
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
          container={canvasRef.current}
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
              { x: parseFloat(target.style.left), y: parseFloat(target.style.top) },
              selectedElement.transform
            )
          }}
          onRotate={({ target, rotation }) => {
            const scale = selectedElement.transform.scale
            target.style.transform = `rotate(${rotation}deg) scale(${scale})`
          }}
          onRotateEnd={({ target }) => {
            const match = target.style.transform.match(/rotate\(([-\d.]+)deg\)/)
            const rotation = match ? parseFloat(match[1]) : 0
            onElementUpdate(selectedElement.id, selectedElement.position, { ...selectedElement.transform, rotation })
          }}
          onScale={({ target, scale, drag }) => {
            const s = scale[0]
            const rotation = selectedElement.transform.rotation
            target.style.transform = `rotate(${rotation}deg) scale(${s})`
            target.style.left = `${drag.left}px`
            target.style.top = `${drag.top}px`
          }}
          onScaleEnd={({ target }) => {
            const match = target.style.transform.match(/scale\(([-\d.]+)\)/)
            const scale = match ? parseFloat(match[1]) : 1
            onElementUpdate(
              selectedElement.id,
              { x: parseFloat(target.style.left), y: parseFloat(target.style.top) },
              { ...selectedElement.transform, scale }
            )
          }}
        />
      )}
    </div>
  )
}
