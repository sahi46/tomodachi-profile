'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CanvasElement, Profile } from '@/types'
import ProfileCanvas from '@/components/ProfileCanvas'
import BottomSheet from '@/components/BottomSheet'
import { TEMPLATES } from '@/lib/templates'

interface Props {
  profile: Profile
  elements: CanvasElement[]
}

type AnswerMap = Record<string, string | Record<string, string>>

export default function AnswerCanvas({ profile, elements }: Props) {
  const [answerMap, setAnswerMap]       = useState<AnswerMap>({})
  const [editingEl, setEditingEl]       = useState<CanvasElement | null>(null)
  const [singleAnswer, setSingleAnswer] = useState('')
  const [fieldAnswers, setFieldAnswers] = useState<Record<string, string>>({})
  const [sheet, setSheet]               = useState<'question' | 'template' | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(false)

  // 現在の回答を反映した要素リストを生成
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

    setEditingEl(el)
    if (el.type === 'question') {
      setSingleAnswer((answerMap[elId] as string) ?? '')
      setSheet('question')
    } else if (el.type === 'template_card') {
      setFieldAnswers((answerMap[elId] as Record<string, string>) ?? {})
      setSheet('template')
    }
  }, [elements, answerMap])

  const saveQuestion = () => {
    if (!editingEl) return
    setAnswerMap(prev => ({ ...prev, [editingEl.id]: singleAnswer }))
    setSheet(null); setEditingEl(null)
  }

  const saveTemplate = () => {
    if (!editingEl) return
    setAnswerMap(prev => ({ ...prev, [editingEl.id]: fieldAnswers }))
    setSheet(null); setEditingEl(null)
  }

  const submit = async () => {
    setSubmitting(true)
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

  const editingContent = editingEl?.content
  const questionLabel = editingEl?.type === 'question'
    ? (editingContent as { question: string }).question
    : ''
  const tmpl = editingEl?.type === 'template_card'
    ? TEMPLATES.find(t => t.id === (editingContent as { templateId: string }).templateId)
    : null

  return (
    <>
      <div className="bg-[#0a0a0a]" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
        {/* タイトル */}
        <div className="pt-safe px-4 pt-4 pb-2">
          <p className="text-white/50 text-sm font-semibold text-center">{profile.title}</p>
        </div>

        {/* キャンバス（横幅いっぱい）*/}
        <ProfileCanvas
          background={profile.background}
          elements={answeredElements}
          editMode={false}
          onTapElement={handleTapElement}
        />

        {/* 回答ガイド */}
        <p className="text-center text-white/25 text-xs py-3">
          カードをタップして回答しよう
        </p>

        {/* 送るボタン下部スペース確保 */}
        <div className="h-24" />
      </div>

      {/* 固定ボトム: 回答を送るボタン */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe px-4 py-3 bg-[#0a0a0a]/85 backdrop-blur-xl border-t border-white/8">
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full py-4 rounded-2xl text-white font-black text-base active:scale-95 transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #f472b6, #a855f7)' }}
        >
          {submitting ? '送信中...' : '📨 回答を送る'}
        </button>
      </div>

      {/* 質問カード回答シート */}
      <BottomSheet
        open={sheet === 'question'}
        onClose={() => { setSheet(null); setEditingEl(null) }}
        title={questionLabel}
      >
        <div className="space-y-3 py-2">
          <textarea
            autoFocus
            rows={3}
            placeholder="回答を入力..."
            value={singleAnswer}
            onChange={e => setSingleAnswer(e.target.value)}
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pink-300 resize-none transition-colors"
          />
          <button
            onClick={saveQuestion}
            className="w-full py-3.5 bg-gray-900 text-white text-sm font-bold rounded-xl active:scale-95"
          >
            保存
          </button>
        </div>
      </BottomSheet>

      {/* テンプレートカード回答シート */}
      <BottomSheet
        open={sheet === 'template'}
        onClose={() => { setSheet(null); setEditingEl(null) }}
        title={tmpl?.title ?? 'カードに回答'}
      >
        {tmpl && (
          <div className="space-y-3 py-2">
            {tmpl.fields.map(f => (
              <div key={f.key}>
                <p className="text-xs text-gray-500 font-semibold mb-1.5">
                  {f.prefix}{f.label}{f.suffix}
                </p>
                <input
                  type="text"
                  placeholder={f.placeholder ?? '入力してください'}
                  value={fieldAnswers[f.key] ?? ''}
                  onChange={e => setFieldAnswers(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pink-300 transition-colors"
                />
              </div>
            ))}
            <button
              onClick={saveTemplate}
              className="w-full py-3.5 bg-gray-900 text-white text-sm font-bold rounded-xl active:scale-95"
            >
              保存
            </button>
          </div>
        )}
      </BottomSheet>
    </>
  )
}
