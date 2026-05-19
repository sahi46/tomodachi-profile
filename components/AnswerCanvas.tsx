'use client'

import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { CanvasElement, Profile, PctPosition } from '@/types'
import ProfileCanvas from '@/components/ProfileCanvas'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  profile: Profile
  elements: CanvasElement[]
}

// AnswerElement data stored in response
export interface AnswerElementData {
  id: string
  questionId: string
  text: string
  xPct: number
  yPct: number
  rotation: number
  scale: number
  color: string
  fontSize: number
  fontBold: boolean
}

const ANSWER_COLORS = [
  '#111827', '#374151',
  '#f472b6', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#f97316',
  '#ffffff', '#fce7f3',
]

const FONT_SIZES = [14, 16, 18, 20, 24, 28, 32, 40]

function toCanvasElement(a: AnswerElementData): CanvasElement {
  return {
    id: a.id,
    profile_id: '',
    type: 'answer_text',
    content: { text: a.text, questionId: a.questionId },
    style: { color: a.color, fontSize: String(a.fontSize), fontBold: String(a.fontBold) },
    position: { xPct: a.xPct, yPct: a.yPct },
    transform: { rotation: a.rotation, scale: a.scale },
    z_index: 50,
  }
}

export default function AnswerCanvas({ profile, elements }: Props) {
  // answer_text elements being placed on the canvas
  const [answerEls, setAnswerEls] = useState<AnswerElementData[]>([])

  // template_card/visual_card inline answer state (kept as-is)
  const [cardAnswerMap, setCardAnswerMap] = useState<Record<string, Record<string, string>>>({})
  const [cardEditingId, setCardEditingId] = useState<string | null>(null)

  // which question block is being answered right now
  const [activeQuestion, setActiveQuestion] = useState<CanvasElement | null>(null)

  // input state for the answer sheet
  const [inputText, setInputText]     = useState('')
  const [inputColor, setInputColor]   = useState('#111827')
  const [inputSize, setInputSize]     = useState(20)
  const [inputBold, setInputBold]     = useState(false)

  // selected answer_text element for styling
  const [selectedId, setSelectedId]   = useState<string | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [submitted, setSubmitted]     = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Combined elements for rendering: template + answer_text overlays
  const answeredTemplateEls: CanvasElement[] = elements.map(el => {
    if (el.type === 'template_card') {
      const c = el.content as { templateId: string; answers: Record<string, string> }
      return { ...el, content: { ...c, answers: cardAnswerMap[el.id] ?? {} } }
    }
    return el
  })

  const allElements: CanvasElement[] = [
    ...answeredTemplateEls,
    ...answerEls.map(toCanvasElement),
  ]

  const openQuestion = useCallback((elId: string) => {
    const el = elements.find(e => e.id === elId)
    if (!el || el.type !== 'question') return
    setActiveQuestion(el)
    setInputText('')
    setSelectedId(null)
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [elements])

  const confirmAnswer = () => {
    if (!activeQuestion || !inputText.trim()) return
    const q = activeQuestion.position as PctPosition
    const id = uuidv4()
    const newEl: AnswerElementData = {
      id,
      questionId: activeQuestion.id,
      text: inputText.trim(),
      xPct: Math.min(75, q.xPct + 8 + Math.random() * 10),
      yPct: Math.min(85, q.yPct + 10 + Math.random() * 8),
      rotation: (Math.random() - 0.5) * 8, // subtle tilt
      scale: 1,
      color: inputColor,
      fontSize: inputSize,
      fontBold: inputBold,
    }
    setAnswerEls(prev => [...prev, newEl])
    setSelectedId(id)
    setActiveQuestion(null)
    setInputText('')
  }

  const updateAnswerEl = useCallback((id: string, pos: PctPosition, transform: { rotation: number; scale: number }) => {
    setAnswerEls(prev => prev.map(a =>
      a.id === id ? { ...a, xPct: pos.xPct, yPct: pos.yPct, rotation: transform.rotation, scale: transform.scale } : a
    ))
  }, [])

  const selectedAnswer = answerEls.find(a => a.id === selectedId)

  const updateSelectedStyle = (patch: Partial<Pick<AnswerElementData, 'color' | 'fontSize' | 'fontBold'>>) => {
    if (!selectedId) return
    setAnswerEls(prev => prev.map(a => a.id === selectedId ? { ...a, ...patch } : a))
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setAnswerEls(prev => prev.filter(a => a.id !== selectedId))
    setSelectedId(null)
  }

  const submit = async () => {
    setSubmitting(true)
    setConfirmOpen(false)
    setSelectedId(null)
    setCardEditingId(null)

    const responsePayload = {
      v: 2,
      answerElements: answerEls,
      cardAnswers: cardAnswerMap,
    }
    await supabase.from('responses').insert({ profile_id: profile.id, answers: responsePayload })
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

  const questionHasAnswer = (elId: string) => answerEls.some(a => a.questionId === elId)

  return (
    <div className="min-h-screen bg-[#0a0a0a]" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* タイトル */}
      <div className="pt-safe px-4 pt-3 pb-1">
        <p className="text-white/50 text-sm font-semibold text-center">{profile.title}</p>
      </div>

      {/* キャンバス */}
      <div className="relative">
        <ProfileCanvas
          background={profile.background}
          elements={allElements.map(el =>
            el.type === 'question'
              ? { ...el, style: { ...el.style, _answered: questionHasAnswer(el.id) ? '1' : '0' } }
              : el
          )}
          answerMode
          selectedId={selectedId}
          onSelect={id => { setSelectedId(id); setCardEditingId(null) }}
          onUpdate={updateAnswerEl}
          onTapQuestion={id => { setSelectedId(null); openQuestion(id) }}
          onTapCard={id => setCardEditingId(prev => prev === id ? null : id)}
          answerEditingId={cardEditingId}
          onAnswerChange={(id, val) => {
            if (typeof val === 'object') setCardAnswerMap(prev => ({ ...prev, [id]: val as Record<string, string> }))
          }}
          onCanvasTap={() => { setSelectedId(null); setCardEditingId(null) }}
        />

        {/* 送信ボタン（右下） */}
        <div className="absolute bottom-4 right-4 z-20">
          <button
            onClick={() => { setSelectedId(null); setConfirmOpen(true) }}
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
                <path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/>
              </svg>
            )}
          </button>
        </div>

        {/* ガイド（非選択時） */}
        {!selectedId && !activeQuestion && (
          <p className="absolute bottom-5 left-0 right-14 text-center text-white/20 text-[10px] pointer-events-none">
            質問をタップして回答を書こう
          </p>
        )}
      </div>

      {/* ── 回答テキスト選択ツールバー ── */}
      {selectedAnswer && (
        <div
          className="fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100"
          style={{
            bottom: 0,
            paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <div className="px-4 pt-3 space-y-3">
            {/* header */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-gray-700">回答テキストを編集</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={deleteSelected}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-500 text-xs font-bold active:scale-90 transition-transform"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M9 6V4h6v2"/>
                  </svg>
                  削除
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 text-base font-bold flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* color row */}
            <div className="flex gap-2 items-center">
              <span className="text-[10px] font-bold text-gray-400 w-10 shrink-0">文字色</span>
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {ANSWER_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateSelectedStyle({ color: c })}
                    style={{
                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                      backgroundColor: c,
                      border: selectedAnswer.color === c ? '2.5px solid #6366f1' : '1.5px solid #e5e7eb',
                      boxShadow: selectedAnswer.color === c ? '0 0 0 1.5px #6366f1' : 'none',
                    }}
                    className="active:scale-90 transition-transform"
                  />
                ))}
              </div>
            </div>

            {/* size + bold row */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-gray-400 w-10 shrink-0">サイズ</span>
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {FONT_SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => updateSelectedStyle({ fontSize: s })}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-90 whitespace-nowrap"
                    style={{
                      backgroundColor: selectedAnswer.fontSize === s ? '#1f2937' : '#f3f4f6',
                      color: selectedAnswer.fontSize === s ? 'white' : '#374151',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={() => updateSelectedStyle({ fontBold: !selectedAnswer.fontBold })}
                className="px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-90 shrink-0"
                style={{
                  backgroundColor: selectedAnswer.fontBold ? '#1f2937' : '#f3f4f6',
                  color: selectedAnswer.fontBold ? 'white' : '#374151',
                }}
              >
                太字
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 回答入力シート ── */}
      {activeQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setActiveQuestion(null)}
        >
          <div
            className="w-full bg-white rounded-t-3xl"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* question label */}
            <div className="px-5 pb-3">
              <p className="text-xs text-gray-400 font-semibold">
                「{(activeQuestion.content as { question: string }).question}」への回答
              </p>
            </div>

            {/* text input */}
            <div className="px-4">
              <textarea
                ref={inputRef}
                rows={2}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="ここに書いてね..."
                className="w-full text-base bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-indigo-300 transition-colors resize-none"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            {/* color + size quick picks */}
            <div className="px-4 pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 w-10 shrink-0">色</span>
                <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {ANSWER_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setInputColor(c)}
                      style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        backgroundColor: c,
                        border: inputColor === c ? '2.5px solid #6366f1' : '1.5px solid #e5e7eb',
                        boxShadow: inputColor === c ? '0 0 0 1.5px #6366f1' : 'none',
                      }}
                      className="active:scale-90 transition-transform"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 w-10 shrink-0">サイズ</span>
                <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {FONT_SIZES.map(s => (
                    <button
                      key={s}
                      onClick={() => setInputSize(s)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-90 whitespace-nowrap"
                      style={{
                        backgroundColor: inputSize === s ? '#1f2937' : '#f3f4f6',
                        color: inputSize === s ? 'white' : '#374151',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setInputBold(b => !b)}
                  className="px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-90 shrink-0"
                  style={{
                    backgroundColor: inputBold ? '#1f2937' : '#f3f4f6',
                    color: inputBold ? 'white' : '#374151',
                  }}
                >
                  太字
                </button>
              </div>
            </div>

            {/* confirm button */}
            <div className="px-4 pt-4">
              <button
                onClick={confirmAnswer}
                disabled={!inputText.trim()}
                className="w-full py-4 rounded-2xl text-white font-black text-base active:scale-95 transition-all disabled:opacity-30"
                style={{
                  background: 'linear-gradient(135deg, #f472b6, #a855f7)',
                  boxShadow: inputText.trim() ? '0 6px 20px rgba(168,85,247,0.4)' : 'none',
                }}
              >
                ボードに追加 ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 確認モーダル */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-8"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirmOpen(false)}
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
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
