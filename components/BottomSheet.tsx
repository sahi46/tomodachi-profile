'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, title, children }: Props) {
  const sheetRef    = useRef<HTMLDivElement>(null)
  const startY      = useRef(0)
  const startTime   = useRef(0)
  const isDragging  = useRef(false)
  const [dragY, setDragY]         = useState(0)
  const [dragging, setDragging]   = useState(false)

  // outside-touch close
  useEffect(() => {
    if (!open) return
    const handler = (e: TouchEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('touchstart', handler)
    return () => document.removeEventListener('touchstart', handler)
  }, [open, onClose])

  // body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setDragY(0); setDragging(false); isDragging.current = false
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    startY.current    = e.clientY
    startTime.current = Date.now()
    isDragging.current = true
    setDragging(true)
  }

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const delta = Math.max(0, e.clientY - startY.current)
    setDragY(delta)
  }

  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    isDragging.current = false
    setDragging(false)
    const delta    = e.clientY - startY.current
    const elapsed  = Math.max(1, Date.now() - startTime.current)
    const velocity = delta / elapsed // px/ms
    if (delta > 100 || (velocity > 0.4 && delta > 30)) {
      setDragY(0)
      onClose()
    } else {
      setDragY(0)
    }
  }

  const sheetTransform = open ? `translateY(${dragY}px)` : 'translateY(100%)'
  const sheetTransition = dragging ? 'none' : 'transform 300ms ease-out'

  return (
    <>
      {/* オーバーレイ */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        onTouchMove={e => e.preventDefault()}
      />

      {/* シート */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
        style={{ maxHeight: '75vh', transform: sheetTransform, transition: sheetTransition }}
      >
        {/* ハンドル（スワイプで閉じる） */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* タイトル */}
        <div className="flex items-center justify-between px-5 py-2">
          <h3 className="font-bold text-gray-800 text-base">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm">
            ✕
          </button>
        </div>

        {/* コンテンツ */}
        <div
          className="overflow-y-auto px-4 pb-8"
          style={{
            maxHeight: 'calc(75vh - 80px)',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
          }}
        >
          {children}
        </div>
      </div>
    </>
  )
}
