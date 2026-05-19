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

type ActiveTool = 'text' | 'stamp' | 'question' | 'shape'

const STAMPS = [
  '😊','😂','🥹','😍','😎','🥳','😭','😱',
  '🫶','❤️','💕','💖','✨','🌟','🔥','💫',
  '🎉','🎊','🌈','🦋','🌸','🌺','🍓','🍦',
  '☕','🎵','🎶','💎','👑','🌙','⭐','🐱',
  '🐶','🐰','🦊','🐸','🍀','🌻','🎀','🍡',
]

const SHAPES = [
  '★','☆','♥','♡','◆','◇','●','○',
  '■','□','▲','△','✦','✧','✿','❀',
  '☀','☁','⚡','♪','♫','✓','→','←',
]

function TextIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
    </svg>
  )
}
function StampIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/>
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/>
    </svg>
  )
}
function QuestionIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function ShapeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

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

  // input sheet state
  const [sheetOpen, setSheetOpen]     = useState(false)
  const [sheetHint, setSheetHint]     = useState<string | undefined>()
  const [pendingPos, setPendingPos]   = useState({ xPct: 30, yPct: 40 })

  const [inputText, setInputText]     = useState('')
  const [inputColor, setInputColor]   = useState('#111827')
  const [inputSize, setInputSize]     = useState(20)
  const [inputBold, setInputBold]     = useState(false)

  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [activeTool, setActiveTool]   = useState<ActiveTool | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [submitted, setSubmitted]     = useState(false)

  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const allElements: CanvasElement[] = [...elements, ...textEls.map(toCanvasElement)]
  const questionEls = elements.filter(el => el.type === 'question')

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

  const handleToolTap = (tool: ActiveTool) => {
    if (tool === 'text') {
      setActiveTool(null)
      openSheetFree()
    } else {
      setActiveTool(prev => prev === tool ? null : tool)
      setSelectedId(null)
    }
  }

  const addStamp = (text: string) => {
    const newEl: TextElementData = {
      id: uuidv4(),
      text,
      xPct: 10 + Math.random() * 70,
      yPct: 15 + Math.random() * 55,
      rotation: (Math.random() - 0.5) * 20,
      scale: 1,
      color: '#111827',
      fontSize: 36,
      fontBold: false,
    }
    setTextEls(prev => [...prev, newEl])
    setActiveTool(null)
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
    await supabase.from('responses').insert({
      profile_id: profile.id,
      answers: {
        v: 2,
        textElements: textEls,
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

  const TOOLS: { id: ActiveTool; label: string; icon: React.ReactNode }[] = [
    { id: 'text',     label: 'テキスト', icon: <TextIcon /> },
    { id: 'stamp',    label: 'スタンプ', icon: <StampIcon /> },
    { id: 'question', label: '質問',     icon: <QuestionIcon /> },
    { id: 'shape',    label: '図形',     icon: <ShapeIcon /> },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>

      {/* ヘッダー */}
      <div className="pt-safe shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-16" />
          <p className="text-white/50 text-sm font-semibold">{profile.title}</p>
          <button
            onClick={() => { setSelectedId(null); setActiveTool(null); setConfirmOpen(true) }}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-black active:scale-90 transition-transform disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #f472b6, #a855f7)',
              boxShadow: '0 4px 16px rgba(168,85,247,0.45)',
            }}
          >
            {submitting
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : '送る'}
          </button>
        </div>
      </div>

      {/* キャンバス */}
      <div className="shrink-0">
        <ProfileCanvas
          background={profile.background}
          elements={allElements}
          answerMode
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdate={updateTextEl}
          onTapQuestion={openSheetNearQuestion}
          onCanvasTap={() => { setSelectedId(null); setActiveTool(null) }}
        />
      </div>

      {/* 下部ツールバー */}
      <div
        className="shrink-0 bg-[#111827] border-t border-white/10"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="flex">
          {TOOLS.map(({ id, label, icon }) => {
            const isActive = activeTool === id
            return (
              <button
                key={id}
                onClick={() => handleToolTap(id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 active:scale-90 transition-transform"
              >
                <div style={{ color: isActive ? '#f472b6' : 'rgba(255,255,255,0.55)' }}>
                  {icon}
                </div>
                <span className="text-[10px] font-bold" style={{ color: isActive ? '#f472b6' : 'rgba(255,255,255,0.35)' }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* スタンプピッカー */}
      {activeTool === 'stamp' && (
        <div className="fixed inset-0 z-40 flex items-end" onClick={() => setActiveTool(null)}>
          <div
            className="w-full bg-[#1f2937] rounded-t-3xl"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <p className="px-5 py-2 text-xs font-black text-white/40">スタンプ</p>
            <div className="px-4 pb-2 grid grid-cols-8 gap-1">
              {STAMPS.map(s => (
                <button key={s} onClick={() => addStamp(s)}
                  className="text-2xl h-10 flex items-center justify-center active:scale-75 transition-transform">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 質問ピッカー */}
      {activeTool === 'question' && (
        <div className="fixed inset-0 z-40 flex items-end" onClick={() => setActiveTool(null)}>
          <div
            className="w-full bg-[#1f2937] rounded-t-3xl"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <p className="px-5 py-2 text-xs font-black text-white/40">質問に答える</p>
            {questionEls.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-white/30">質問がありません</p>
            ) : (
              <div className="px-4 pb-3 space-y-2 max-h-64 overflow-y-auto">
                {questionEls.map(el => (
                  <button
                    key={el.id}
                    onClick={() => { openSheetNearQuestion(el.id); setActiveTool(null) }}
                    className="w-full text-left px-4 py-3 rounded-2xl active:scale-[0.97] transition-transform"
                    style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
                  >
                    <p className="text-white text-sm font-bold">
                      {(el.content as { question: string }).question}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 図形ピッカー */}
      {activeTool === 'shape' && (
        <div className="fixed inset-0 z-40 flex items-end" onClick={() => setActiveTool(null)}>
          <div
            className="w-full bg-[#1f2937] rounded-t-3xl"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <p className="px-5 py-2 text-xs font-black text-white/40">図形</p>
            <div className="px-4 pb-2 grid grid-cols-8 gap-1">
              {SHAPES.map(s => (
                <button key={s} onClick={() => addStamp(s)}
                  className="text-xl h-10 flex items-center justify-center font-black text-white active:scale-75 transition-transform">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* テキスト選択ツールバー */}
      {selectedEl && (
        <TextStyleBar
          el={selectedEl}
          onUpdate={updateSelectedStyle}
          onDelete={deleteSelected}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* テキスト入力シート */}
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
