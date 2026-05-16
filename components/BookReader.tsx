'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Profile, CanvasElement } from '@/types'
import ProfileCanvas from '@/components/ProfileCanvas'

interface Response {
  id: string
  profile_id: string
  answers: Record<string, unknown>
  created_at: string
}

interface Props {
  profile: Profile
  elements: CanvasElement[]
  responses: Response[]
}

type AnimDir  = 'fwd' | 'bwd'
type AnimStep = 'exit' | 'enter'
type AnimState = { dir: AnimDir; step: AnimStep; from: number; to: number } | null

const PHASE_MS = 200

// transformOrigin per animation name
const ORIGINS: Record<string, string> = {
  bookExitFwd:  'left center',   // page folds away to the left (pivot = left edge)
  bookEnterFwd: 'right center',  // new page opens from the right (pivot = right edge)
  bookExitBwd:  'right center',  // page folds away to the right
  bookEnterBwd: 'left center',   // new page opens from the left
}

const fmtDate = (s: string) => {
  const d = new Date(s)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

function applyAnswers(elements: CanvasElement[], answers: Record<string, unknown>): CanvasElement[] {
  return elements.map(el => {
    if (el.type === 'question') {
      return { ...el, content: { ...(el.content as { question: string; answer: string }), answer: (answers[el.id] as string) ?? '' } }
    }
    if (el.type === 'template_card') {
      return { ...el, content: { ...(el.content as { templateId: string; answers: Record<string, string> }), answers: (answers[el.id] as Record<string, string>) ?? {} } }
    }
    return el
  })
}

export default function BookReader({ profile, elements, responses }: Props) {
  const router = useRouter()
  const [page, setPage]           = useState(0)
  const [anim, setAnim]           = useState<AnimState>(null)
  const [uiVisible, setUiVisible] = useState(true)

  const touchStartX    = useRef(0)
  const touchStartY    = useRef(0)
  const touchStartTime = useRef(0)
  const isHoriz        = useRef(false)
  const didSwipe       = useRef(false)
  const animating      = useRef(false)

  useEffect(() => {
    if (!anim) { animating.current = false; return }
    if (anim.step === 'exit') {
      const t = setTimeout(() => {
        setPage(anim.to)
        setAnim(prev => prev ? { ...prev, step: 'enter' } : null)
      }, PHASE_MS)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setAnim(null), PHASE_MS)
      return () => clearTimeout(t)
    }
  }, [anim])

  const goTo = useCallback((n: number) => {
    if (animating.current) return
    const target = Math.max(0, Math.min(responses.length - 1, n))
    if (target === page) return
    animating.current = true
    setAnim({ dir: target > page ? 'fwd' : 'bwd', step: 'exit', from: page, to: target })
  }, [page, responses.length])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current    = e.touches[0].clientX
    touchStartY.current    = e.touches[0].clientY
    touchStartTime.current = Date.now()
    isHoriz.current        = false
    didSwipe.current       = false
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (!isHoriz.current) {
      if (Math.abs(dy) > Math.abs(dx) + 4) return
      if (Math.abs(dx) > 6) { isHoriz.current = true; didSwipe.current = true }
    }
    if (isHoriz.current) e.preventDefault()
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx      = e.changedTouches[0].clientX - touchStartX.current
    const dy      = e.changedTouches[0].clientY - touchStartY.current
    const elapsed = Math.max(1, Date.now() - touchStartTime.current)
    const vel     = dx / elapsed

    if (!didSwipe.current && Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      setUiVisible(v => !v)
      return
    }

    if (dx < -50 || vel < -0.25) goTo(page + 1)
    else if (dx > 50 || vel > 0.25) goTo(page - 1)
  }

  type PageEntry = { index: number; animName?: string; zIndex: number; key: string }

  const pagesToRender = (): PageEntry[] => {
    if (!anim) return [{ index: page, zIndex: 0, key: String(page) }]
    if (anim.step === 'exit') {
      const exitAnim = anim.dir === 'fwd' ? 'bookExitFwd' : 'bookExitBwd'
      return [
        { index: anim.to,   zIndex: 0, key: String(anim.to) },
        { index: anim.from, zIndex: 1, key: String(anim.from), animName: exitAnim },
      ]
    }
    const enterAnim = anim.dir === 'fwd' ? 'bookEnterFwd' : 'bookEnterBwd'
    return [{ index: anim.to, zIndex: 0, key: `${anim.to}-enter`, animName: enterAnim }]
  }

  if (responses.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl">📭</span>
        <p className="text-white text-lg font-black">{profile.title}</p>
        <p className="text-white/40 text-sm">まだ回答が届いていません</p>
        <button onClick={() => router.back()} className="mt-4 px-6 py-2.5 bg-white/10 rounded-full text-white text-sm font-bold active:scale-95 transition-transform">
          ← 戻る
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div
        className="pt-safe shrink-0 transition-opacity duration-300"
        style={{ opacity: uiVisible ? 1 : 0, pointerEvents: uiVisible ? 'auto' : 'none' }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-90 transition-transform shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-white text-sm font-black truncate">{profile.title}</p>
            <p className="text-white/35 text-xs">{page + 1} / {responses.length} ページ</p>
          </div>
          <div className="w-10 shrink-0" />
        </div>
      </div>

      {/* ページエリア */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ perspective: '1200px' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {pagesToRender().map(({ index, animName, zIndex, key }) => {
          const answered = applyAnswers(elements, responses[index].answers)
          const origin   = animName ? ORIGINS[animName] : 'center'
          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex,
                transformOrigin: origin,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                animation: animName ? `${animName} ${PHASE_MS}ms linear forwards` : undefined,
              }}
            >
              {/* 日付テキスト */}
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, margin: '8px 0 6px', flexShrink: 0 }}>
                {fmtDate(responses[index].created_at)} に届いた回答
              </p>

              {/* キャンバスエリア: 残り高さを flex-1 で埋め、9:16 を維持して表示 */}
              <div style={{
                flex: 1,
                width: '100%',
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 12px 8px',
              }}>
                <div style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  aspectRatio: '9 / 16',
                  position: 'relative',
                }}>
                  <ProfileCanvas
                    background={profile.background}
                    elements={answered}
                    editMode={false}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ページドット */}
      {responses.length > 1 && (
        <div
          className="pb-safe shrink-0 flex justify-center items-center gap-1.5 py-3 transition-opacity duration-300"
          style={{ opacity: uiVisible ? 1 : 0, pointerEvents: uiVisible ? 'auto' : 'none' }}
        >
          {responses.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === page ? 22 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === page ? 'white' : 'rgba(255,255,255,0.2)',
                transition: 'width 200ms ease, background-color 200ms ease',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
