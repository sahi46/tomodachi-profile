'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CanvasElement, Profile } from '@/types'
import ProfileCanvas from '@/components/ProfileCanvas'

interface Props {
  profile: Profile
  elements: CanvasElement[]
}

type AnswerMap = Record<string, string | Record<string, string>>

export default function AnswerCanvas({ profile, elements }: Props) {
  const [answerMap, setAnswerMap]             = useState<AnswerMap>({})
  const [answerEditingId, setAnswerEditingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen]         = useState(false)
  const [submitting, setSubmitting]           = useState(false)
  const [submitted, setSubmitted]             = useState(false)

  const answeredElements: CanvasElement[] = elements.map(el => {
    if (el.type === 'question') {
      return { ...el, content: { ...(el.content as { question: string; answer: string }), answer: (answerMap[el.id] as string) ?? '' } }
    }
    if (el.type === 'template_card') {
      return { ...el, content: { ...(el.content as { templateId: string; answers: Record<string, string> }), answers: (answerMap[el.id] as Record<string, string>) ?? {} } }
    }
    return el
  })

  const handleTapElement = useCallback((elId: string) => {
    const el = elements.find(e => e.id === elId)
    if (!el || el.type === 'sticker') return
    setAnswerEditingId(prev => prev === elId ? null : elId)
  }, [elements])

  const handleAnswerChange = useCallback((id: string, value: string | Record<string, string>) => {
    setAnswerMap(prev => ({ ...prev, [id]: value }))
  }, [])

  const submit = async () => {
    setSubmitting(true)
    setConfirmOpen(false)
    setAnswerEditingId(null)
    await supabase.from('responses').insert({ profile_id: profile.id, answers: answerMap })
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-6xl">💌</span>
        <p className="text-white text-xl font-black">回答を送りました！</p>
        <p className="text-white/40 text-sm">ありがとうございました</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* タイトル */}
      <div className="pt-safe px-4 pt-3 pb-1">
        <p className="text-white/50 text-sm font-semibold text-center">{profile.title}</p>
      </div>

      {/* キャンバス + 送信ボタンオーバーレイ */}
      <div className="relative">
        <ProfileCanvas
          background={profile.background}
          elements={answeredElements}
          editMode={false}
          onTapElement={handleTapElement}
          onCanvasTap={() => setAnswerEditingId(null)}
          answerEditingId={answerEditingId}
          onAnswerChange={handleAnswerChange}
        />

        {/* 送信 / 完了 ボタン（キャンバス右下オーバーレイ）*/}
        <div className="absolute bottom-4 right-4 z-10">
          {answerEditingId ? (
            <button
              onClick={() => setAnswerEditingId(null)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-white text-sm font-black active:scale-90 transition-transform shadow-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 6px 20px rgba(99,102,241,0.5)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              完了
            </button>
          ) : (
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className="w-13 h-13 flex items-center justify-center rounded-full active:scale-90 transition-transform shadow-xl disabled:opacity-50"
              style={{
                width: 52, height: 52,
                background: 'linear-gradient(135deg, #f472b6, #a855f7)',
                boxShadow: '0 6px 24px rgba(168,85,247,0.55)',
              }}
            >
              {submitting ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13"/>
                  <path d="M22 2L15 22l-4-9-9-4 20-7z"/>
                </svg>
              )}
            </button>
          )}
        </div>

        {/* ガイドテキスト（編集中は非表示） */}
        {!answerEditingId && (
          <p className="absolute bottom-5 left-0 right-14 text-center text-white/20 text-[10px] pointer-events-none">
            カードをタップして回答しよう
          </p>
        )}
      </div>

      {/* 確認モーダル */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-8"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <span className="text-4xl">📨</span>
              <p className="text-gray-900 font-black text-lg mt-3">回答を送りますか？</p>
              <p className="text-gray-400 text-sm mt-1">送信後は変更できません</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={submit}
                className="w-full py-4 rounded-2xl text-white font-black text-base active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(135deg, #f472b6, #a855f7)' }}
              >
                送る
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="w-full py-3 rounded-2xl text-gray-500 font-bold text-sm bg-gray-100 active:scale-95 transition-transform"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
