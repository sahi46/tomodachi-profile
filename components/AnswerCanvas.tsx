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

// TextElement stored in response — no questionId, just free canvas data
export interface TextElementData {
  id: string
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

function toCanvasElement(t: TextElementData): CanvasElement {
  return {
    id: t.id,
    profile_id: '',
    type: 'text_element',
    content: { text: t.text },
    style: { color: t.color, fontSize: String(t.fontSize), fontBold: String(t.fontBold) },
    position: { xPct: t.xPct, yPct: t.yPct },
    transform: { rotation: t.rotation, scale: t.scale },
    z_index: 50,
  }
}

// ── Input Sheet ──────────────────────────────────────────────────
function TextInputSheet({
  hint,
  inputText, setInputText,
  inputColor, setInputColor,
  inputSize, setInputSize,
  inputBold, setInputBold,
  onConfirm, onDismiss,
  inputRef,
}: {
  hint?: string
  inputText: string; setInputText: (v: string) => void
  inputColor: string; setInputColor: (v: string) => void
  inputSize: number; setInputSize: (v: number) => void
  inputBold: boolean; setInputBold: (v: boolean) => void
  onConfirm: () => void; onDismiss: () => void
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onDismiss}
    >
      <div
        className="w-full bg-white rounded-t-3xl"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {hint && (
          <p className="px-5 pb-2 text-xs text-gray-400 font-semibold">{hint}</p>
        )}

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

        <div className="px-4 pt-3 space-y-2">
          {/* color */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 w-8 shrink-0">色</span>
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

          {/* size + bold */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 w-8 shrink-0">大きさ</span>
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
              onClick={() => setInputBold(!inputBold)}
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

        <div className="px-4 pt-4">
          <button
            onClick={onConfirm}
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
  )
}

// ── Style Toolbar (when text element selected) ───────────────────
function TextStyleBar({
  el,
  onUpdate,
  onDelete,
  onClose,
}: {
  el: TextElementData
  onUpdate: (patch: Partial<TextElementData>) => void
  onDelete: () => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100"
      style={{
        bottom: 0,
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
      }}
    >
      <div className="px-4 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-gray-700">テキストを編集</p>
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-500 text-xs font-bold active:scale-90 transition-transform"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M9 6V4h6v2"/>
              </svg>
              削除
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 text-base font-bold flex items-center justify-center active:bg-gray-200 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 w-8 shrink-0">色</span>
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {ANSWER_COLORS.map(c => (
              <button
                key={c}
                onClick={() => onUpdate({ color: c })}
                style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  backgroundColor: c,
                  border: el.color === c ? '2.5px solid #6366f1' : '1.5px solid #e5e7eb',
                  boxShadow: el.color === c ? '0 0 0 1.5px #6366f1' : 'none',
                }}
                className="active:scale-90 transition-transform"
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 w-8 shrink-0">大きさ</span>
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {FONT_SIZES.map(s => (
              <button
                key={s}
                onClick={() => onUpdate({ fontSize: s })}
                className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-90 whitespace-nowrap"
                style={{
                  backgroundColor: el.fontSize === s ? '#1f2937' : '#f3f4f6',
                  color: el.fontSize === s ? 'white' : '#374151',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => onUpdate({ fontBold: !el.fontBold })}
            className="px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-90 shrink-0"
            style={{
              backgroundColor: el.fontBold ? '#1f2937' : '#f3f4f6',
              color: el.fontBold ? 'white' : '#374151',
            }}
          >
            太字
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export default function AnswerCanvas({ profile, elements }: Props) {
  const [textEls, setTextEls]         = useState<TextElementData[]>([])
  const [cardAnswerMap, setCardAnswerMap] = useState<Record<string, Record<string, string>>>({})
  const [cardEditingId, setCardEditingId] = useState<string | null>(null)

  // input sheet state
  const [sheetOpen, setSheetOpen]     = useState(false)
  const [sheetHint, setSheetHint]     = useState<string | undefined>()
  const [pendingPos, setPendingPos]   = useState({ xPct: 30, yPct: 40 })

  const [inputText, setInputText]     = useState('')
  const [inputColor, setInputColor]   = useState('#111827')
  const [inputSize, setInputSize]     = useState(20)
  const [inputBold, setInputBold]     = useState(false)

  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [submitted, setSubmitted]     = useState(false)

  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  // combine template elements with text elements
  const allElements: CanvasElement[] = [
    ...elements.map(el => {
      if (el.type === 'template_card') {
        const c = el.content as { templateId: string; answers: Record<string, string> }
        return { ...el, content: { ...c, answers: cardAnswerMap[el.id] ?? {} } }
      }
      return el
    }),
    ...textEls.map(toCanvasElement),
  ]

  // tap a QuestionBlock → open text sheet nearby
  const openSheetNearQuestion = useCallback((elId: string) => {
    const el = elements.find(e => e.id === elId)
    if (!el) return
    const q = el.content as { question: string }
    setPendingPos({
      xPct: Math.min(75, (el.position as PctPosition).xPct + 8 + Math.random() * 10),
      yPct: Math.min(85, (el.position as PctPosition).yPct + 12 + Math.random() * 8),
    })
    setSheetHint(`「${q.question}」について`)
    setInputText('')
    setSelectedId(null)
    setSheetOpen(true)
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [elements])

  // "文字を追加" button — no hint, random position
  const openSheetFree = () => {
    setPendingPos({
      xPct: 15 + Math.random() * 50,
      yPct: 20 + Math.random() * 45,
    })
    setSheetHint(undefined)
    setInputText('')
    setSelectedId(null)
    setSheetOpen(true)
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  const confirmText = () => {
    if (!inputText.trim()) return
    const newEl: TextElementData = {
      id: uuidv4(),
      text: inputText.trim(),
      ...pendingPos,
      rotation: (Math.random() - 0.5) * 10,
      scale: 1,
      color: inputColor,
      fontSize: inputSize,
      fontBold: inputBold,
    }
    setTextEls(prev => [...prev, newEl])
    setSelectedId(newEl.id)
    setSheetOpen(false)
    setInputText('')
  }

  const updateTextEl = useCallback((id: string, pos: PctPosition, transform: { rotation: number; scale: number }) => {
    setTextEls(prev => prev.map(t =>
      t.id === id ? { ...t, xPct: pos.xPct, yPct: pos.yPct, rotation: transform.rotation, scale: transform.scale } : t
    ))
  }, [])

  const selectedEl = textEls.find(t => t.id === selectedId)

  const updateSelectedStyle = (patch: Partial<TextElementData>) => {
    if (!selectedId) return
    setTextEls(prev => prev.map(t => t.id === selectedId ? { ...t, ...patch } : t))
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setTextEls(prev => prev.filter(t => t.id !== selectedId))
    setSelectedId(null)
  }

  const submit = async () => {
    setSubmitting(true)
    setConfirmOpen(false)
    setSelectedId(null)
    setCardEditingId(null)
    await supabase.from('responses').insert({
      profile_id: profile.id,
      answers: {
        v: 2,
        textElements: textEls,
        cardAnswers: cardAnswerMap,
      },
    })
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
      <div className="pt-safe px-4 pt-3 pb-1">
        <p className="text-white/50 text-sm font-semibold text-center">{profile.title}</p>
      </div>

      <div className="relative">
        <ProfileCanvas
          background={profile.background}
          elements={allElements}
          answerMode
          selectedId={selectedId}
          onSelect={id => { setSelectedId(id); setCardEditingId(null) }}
          onUpdate={updateTextEl}
          onTapQuestion={openSheetNearQuestion}
          onTapCard={id => setCardEditingId(prev => prev === id ? null : id)}
          answerEditingId={cardEditingId}
          onAnswerChange={(id, val) => {
            if (typeof val === 'object') setCardAnswerMap(prev => ({ ...prev, [id]: val as Record<string, string> }))
          }}
          onCanvasTap={() => { setSelectedId(null); setCardEditingId(null) }}
        />

        {/* 文字を追加ボタン（左下） */}
        {!selectedId && !sheetOpen && (
          <button
            onClick={openSheetFree}
            className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-white text-sm font-black active:scale-90 transition-transform"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
            </svg>
            文字を追加
          </button>
        )}

        {/* 送信ボタン（右下） */}
        <div className="absolute bottom-4 right-4 z-20">
          <button
            onClick={() => { setSelectedId(null); setConfirmOpen(true) }}
            disabled={submitting}
            className="flex items-center justify-center rounded-full active:scale-90 transition-transform shadow-xl disabled:opacity-50"
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

        {!selectedId && !sheetOpen && (
          <p className="absolute bottom-5 left-0 right-0 text-center text-white/20 text-[10px] pointer-events-none">
            質問をタップ、または「文字を追加」で書き込もう
          </p>
        )}
      </div>

      {/* TextElement 選択ツールバー */}
      {selectedEl && (
        <TextStyleBar
          el={selectedEl}
          onUpdate={updateSelectedStyle}
          onDelete={deleteSelected}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* 入力シート */}
      {sheetOpen && (
        <TextInputSheet
          hint={sheetHint}
          inputText={inputText} setInputText={setInputText}
          inputColor={inputColor} setInputColor={setInputColor}
          inputSize={inputSize} setInputSize={setInputSize}
          inputBold={inputBold} setInputBold={setInputBold}
          onConfirm={confirmText}
          onDismiss={() => setSheetOpen(false)}
          inputRef={inputRef}
        />
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
