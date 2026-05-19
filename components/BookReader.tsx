'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Profile, CanvasElement } from '@/types'
import ProfileCanvas from '@/components/ProfileCanvas'
import { AnswerElementData } from '@/components/AnswerCanvas'

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

type AnimDir   = 'fwd' | 'bwd'
type AnimState = { dir: AnimDir; from: number; to: number } | null

const FLIP_MS = 300

const ORIGINS: Record<string, string> = {
  bookExitFwd:  'left center',
  bookEnterBwd: 'left center',
}

const TIMINGS: Record<string, string> = {
  bookExitFwd:  'ease-in',
  bookEnterBwd: 'ease-out',
}

function buildPageElements(elements: CanvasElement[], answers: Record<string, unknown>): CanvasElement[] {
  const isV2 = answers.v === 2

  const templateEls = isV2
    ? elements
    : elements.map(el => {
        if (el.type === 'question') {
          return { ...el, content: { ...(el.content as { question: string; answer: string }), answer: (answers[el.id] as string) ?? '' } }
        }
        if (el.type === 'template_card') {
          return { ...el, content: { ...(el.content as { templateId: string; answers: Record<string, string> }), answers: (answers[el.id] as Record<string, string>) ?? {} } }
        }
        return el
      })

  if (!isV2) return templateEls

  const answerEls = ((answers.answerElements ?? []) as AnswerElementData[]).map(a => ({
    id: a.id,
    profile_id: '',
    type: 'answer_text' as const,
    content: { text: a.text, questionId: a.questionId },
    style: { color: a.color, fontSize: String(a.fontSize), fontBold: String(a.fontBold) },
    position: { xPct: a.xPct, yPct: a.yPct },
    transform: { rotation: a.rotation, scale: a.scale },
    z_index: 50,
  }))

  return [...templateEls, ...answerEls]
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
    const t = setTimeout(() => {
      setPage(anim.to)
      setAnim(null)
    }, FLIP_MS)
    return () => clearTimeout(t)
  }, [anim])

  const goTo = useCallback((n: number) => {
    if (animating.current) return
    const target = Math.max(0, Math.min(responses.length - 1, n))
    if (target === page) return
    animating.current = true
    setAnim({ dir: target > page ? 'fwd' : 'bwd', from: page, to: target })
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

  const pages: PageEntry[] = anim
    ? anim.dir === 'fwd'
      ? [
          { index: anim.to,   zIndex: 0, key: String(anim.to) },
          { index: anim.from, zIndex: 1, key: String(anim.from), animName: 'bookExitFwd' },
        ]
      : [
          { index: anim.from, zIndex: 0, key: String(anim.from) },
          { index: anim.to,   zIndex: 1, key: `${anim.to}-enter`, animName: 'bookEnterBwd' },
        ]
    : [{ index: page, zIndex: 0, key: String(page) }]

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
    <div className="fixed inset-0 bg-[#0a0a0a] overflow-hidden">

      {/* ページエリア: タッチ操作・perspective はここ */}
      <div
        className="absolute inset-0 flex items-center"
        style={{ perspective: '1200px' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {pages.map(({ index, animName, zIndex, key }) => {
          const answered = buildPageElements(elements, responses[index].answers)
          const origin   = animName ? ORIGINS[animName] : 'center'
          const timing   = animName ? TIMINGS[animName] : 'linear'
          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex,
                display: 'flex',
                alignItems: 'center',
                transformOrigin: origin,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                animation: animName
                  ? `${animName} ${FLIP_MS}ms ${timing} forwards`
                  : undefined,
              }}
            >
              {/* 横幅=端末幅、高さ=9:16比率。ProfileCanvas のデフォルトモードがこの挙動 */}
              <ProfileCanvas
                background={profile.background}
                elements={answered}
                editMode={false}
              />
            </div>
          )
        })}
      </div>

      {/* ヘッダー: キャンバス上にオーバーレイ */}
      <div
        className="absolute top-0 left-0 right-0 pt-safe transition-opacity duration-300"
        style={{
          zIndex: 200,
          opacity: uiVisible ? 1 : 0,
          pointerEvents: uiVisible ? 'auto' : 'none',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 text-white active:scale-90 transition-transform shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-white text-sm font-black truncate drop-shadow">{profile.title}</p>
            <p className="text-white/60 text-xs drop-shadow">{page + 1} / {responses.length} ページ</p>
          </div>
          <div className="w-10 shrink-0" />
        </div>
      </div>

      {/* ページドット: 下にオーバーレイ */}
      {responses.length > 1 && (
        <div
          className="absolute bottom-0 left-0 right-0 pb-safe flex justify-center items-center gap-1.5 py-4 transition-opacity duration-300"
          style={{ zIndex: 200, opacity: uiVisible ? 1 : 0, pointerEvents: uiVisible ? 'auto' : 'none' }}
        >
          {responses.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === page ? 22 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === page ? 'white' : 'rgba(255,255,255,0.35)',
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
