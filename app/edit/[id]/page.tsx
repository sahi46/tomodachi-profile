'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile, CanvasElement, Background, GRID_COLS, GRID_ROWS, isGridPosition } from '@/types'
import ProfileCanvas from '@/components/ProfileCanvas'
import BottomSheet from '@/components/BottomSheet'
import { v4 as uuidv4 } from 'uuid'

type SheetType = 'sticker' | 'question' | 'background' | 'answer' | null

const EMOJI_LIST = [
  '😊','🌸','⭐','💕','🎀','🌈','🍓','🐱','🌙','💫',
  '🦋','🍀','🎵','💖','🌺','🐰','✨','🎠','🍡','🌻',
  '🫶','🥹','💝','🌷','🎪','🩷','🩵','🌟','🎶','🍭',
]

const QUESTION_PRESETS = [
  { q: '名前',           design: 'pink'   },
  { q: 'ニックネーム',  design: 'purple' },
  { q: '誕生日',        design: 'mint'   },
  { q: '血液型',        design: 'yellow' },
  { q: '好きな食べ物',  design: 'pink'   },
  { q: '嫌いな食べ物',  design: 'purple' },
  { q: '趣味',          design: 'mint'   },
  { q: '好きな色',      design: 'yellow' },
  { q: '好きな音楽',    design: 'blue'   },
  { q: '好きなアーティスト', design: 'pink' },
  { q: '好きな映画',    design: 'purple' },
  { q: '好きな季節',    design: 'mint'   },
  { q: 'マイブーム',    design: 'yellow' },
  { q: '将来の夢',      design: 'blue'   },
  { q: 'ひとこと',      design: 'pink'   },
]

const GRADIENTS = [
  { from: '#ffd6e7', to: '#c9b8ff', dir: '135deg' },
  { from: '#ffecd2', to: '#fcb69f', dir: '135deg' },
  { from: '#a8edea', to: '#fed6e3', dir: '135deg' },
  { from: '#d4fc79', to: '#96e6a1', dir: '135deg' },
  { from: '#fbc2eb', to: '#a6c1ee', dir: '135deg' },
  { from: '#fddb92', to: '#d1fdff', dir: '135deg' },
]
const SOLIDS = ['#fff0f5','#f5f3ff','#ecfeff','#f0fdf4','#fffbeb','#fff7ed','#e0e7ff','#fce7f3']

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [profile, setProfile]           = useState<Profile | null>(null)
  const [elements, setElements]         = useState<CanvasElement[]>([])
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)
  const [sheet, setSheet]               = useState<SheetType>(null)
  const [editingEl, setEditingEl]       = useState<CanvasElement | null>(null)
  const [pendingSlot, setPendingSlot]   = useState<{ col: number; row: number } | null>(null)
  const [answerText, setAnswerText]     = useState('')
  const [customQ, setCustomQ]           = useState('')
  const [copied, setCopied]             = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: e }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('elements').select('*').eq('profile_id', id).order('z_index'),
      ])
      if (p) setProfile(p)
      if (e) setElements(e)
    }
    load()
  }, [id])

  // 次の空きスロットを探す
  const nextEmptySlot = useCallback((): { col: number; row: number } | null => {
    const occupied = new Set(
      elements
        .filter(e => e.type === 'question' && isGridPosition(e.position))
        .map(e => { const p = e.position as { col: number; row: number }; return `${p.col}_${p.row}` })
    )
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (!occupied.has(`${col}_${row}`)) return { col, row }
      }
    }
    return null
  }, [elements])

  const addQuestion = async (question: string, design: string, slot?: { col: number; row: number }) => {
    const pos = slot ?? nextEmptySlot()
    if (!pos) { alert('グリッドが満杯です'); return }
    const el: CanvasElement = {
      id: uuidv4(),
      profile_id: id,
      type: 'question',
      content: { question, answer: '' },
      style: { design },
      position: pos,
      transform: { rotation: 0, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
    setSheet(null)
    setPendingSlot(null)
    // 追加直後に回答入力へ
    setEditingEl(el)
    setAnswerText('')
    setSheet('answer')
    await supabase.from('elements').upsert(el)
  }

  const addSticker = async (emoji: string) => {
    const el: CanvasElement = {
      id: uuidv4(),
      profile_id: id,
      type: 'sticker',
      content: { emoji },
      style: {},
      position: { xPct: 20 + Math.random() * 60, yPct: 15 + Math.random() * 60 },
      transform: { rotation: Math.random() * 20 - 10, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
    setSheet(null)
    await supabase.from('elements').upsert(el)
  }

  const updateBackground = async (bg: Background) => {
    if (!profile) return
    setProfile(p => p ? { ...p, background: bg } : p)
    setSheet(null)
    await supabase.from('profiles').update({ background: bg }).eq('id', id)
  }

  const saveAnswer = async () => {
    if (!editingEl) return
    const updated = { ...editingEl, content: { ...(editingEl.content as { question: string; answer: string }), answer: answerText } }
    setElements(prev => prev.map(e => e.id === editingEl.id ? updated : e))
    setSheet(null)
    setEditingEl(null)
    await supabase.from('elements').update({ content: updated.content }).eq('id', editingEl.id)
  }

  const deleteElement = async (elId: string) => {
    setElements(prev => prev.filter(e => e.id !== elId))
    setSelectedStickerId(null)
    setSheet(null)
    setEditingEl(null)
    await supabase.from('elements').delete().eq('id', elId)
  }

  const handleStickerUpdate = useCallback(async (
    elId: string, xPct: number, yPct: number, rotation: number, scale: number
  ) => {
    const position = { xPct, yPct }
    const transform = { rotation, scale }
    setElements(prev => prev.map(e => e.id === elId ? { ...e, position, transform } : e))
    await supabase.from('elements').update({ position, transform }).eq('id', elId)
  }, [])

  const share = async () => {
    if (!profile) return
    const url = `${window.location.origin}/p/${profile.slug}`
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 rounded-full border-[3px] border-gray-200 border-t-pink-400 animate-spin" />
      </div>
    )
  }

  const editingContent = editingEl?.content as { question: string; answer: string } | undefined

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">

      {/* ── ヘッダー ── */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-white/60 text-sm hover:text-white transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M5 12l7-7M5 12l7 7"/></svg>
          戻る
        </button>

        <button
          onClick={share}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              コピー済み
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/></svg>
              シェア
            </>
          )}
        </button>
      </header>

      {/* ── キャンバス ── */}
      <div className="flex-1 flex items-start justify-center px-4 pb-2 overflow-hidden">
        <div className="w-full max-w-sm">
          <ProfileCanvas
            background={profile.background}
            elements={elements}
            editMode
            selectedStickerId={selectedStickerId}
            onStickerSelect={setSelectedStickerId}
            onStickerUpdate={handleStickerUpdate}
            onQuestionTap={(el) => {
              setEditingEl(el)
              setAnswerText((el.content as { question: string; answer: string }).answer ?? '')
              setSheet('answer')
            }}
            onEmptyCellTap={(col, row) => {
              setPendingSlot({ col, row })
              setSheet('question')
            }}
          />
        </div>
      </div>

      {/* 選択中スタンプのアクション */}
      {selectedStickerId && (
        <div className="flex justify-center pb-2">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5">
            <span className="text-white/70 text-xs">ドラッグで移動・回転</span>
            <div className="w-px h-4 bg-white/20" />
            <button
              onClick={() => deleteElement(selectedStickerId)}
              className="flex items-center gap-1 text-rose-400 text-xs font-bold"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              削除
            </button>
          </div>
        </div>
      )}

      {/* ── ボトムツールバー ── */}
      <div className="shrink-0 border-t border-white/5 bg-[#111]">
        <div className="grid grid-cols-3 divide-x divide-white/5">
          {[
            { key: 'sticker',     icon: '✦', label: 'スタンプ' },
            { key: 'question',    icon: '✎', label: '質問'     },
            { key: 'background',  icon: '◈', label: '背景'     },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => { setSelectedStickerId(null); setSheet(s => s === key ? null : key as SheetType) }}
              className={`flex flex-col items-center gap-1.5 py-4 transition-colors ${
                sheet === key ? 'text-pink-400' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span className="text-base font-bold leading-none">{icon}</span>
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── スタンプシート ── */}
      <BottomSheet open={sheet === 'sticker'} onClose={() => setSheet(null)} title="スタンプを追加">
        <div className="grid grid-cols-6 gap-2 py-2">
          {EMOJI_LIST.map((emoji, i) => (
            <button
              key={i}
              onClick={() => addSticker(emoji)}
              className="h-12 w-full flex items-center justify-center text-3xl rounded-2xl hover:bg-gray-100 active:scale-90 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* ── 質問シート ── */}
      <BottomSheet open={sheet === 'question'} onClose={() => { setSheet(null); setPendingSlot(null) }} title="質問を追加">
        <div className="space-y-4 py-2">
          {pendingSlot && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
              グリッド位置 ({pendingSlot.col + 1}列目 / {pendingSlot.row + 1}行目) に追加
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="質問を自由入力..."
              value={customQ}
              onChange={e => setCustomQ(e.target.value)}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pink-300 transition-colors"
            />
            <button
              onClick={() => { if (customQ.trim()) addQuestion(customQ.trim(), 'pink', pendingSlot ?? undefined) }}
              disabled={!customQ.trim()}
              className="px-4 py-3 bg-pink-400 text-white text-sm font-bold rounded-xl disabled:opacity-40 active:scale-95 transition-all"
            >
              追加
            </button>
          </div>
          <p className="text-[11px] text-gray-400 font-semibold px-1">よく使う質問</p>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_PRESETS.map(({ q, design }) => (
              <button
                key={q}
                onClick={() => addQuestion(q, design, pendingSlot ?? undefined)}
                className="text-left text-sm bg-gray-50 rounded-xl px-4 py-3 font-medium text-gray-700 active:scale-95 transition-transform hover:bg-gray-100"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* ── 背景シート ── */}
      <BottomSheet open={sheet === 'background'} onClose={() => setSheet(null)} title="背景を変更">
        <div className="space-y-5 py-2">
          <div>
            <p className="text-[11px] text-gray-400 font-semibold mb-3">グラデーション</p>
            <div className="grid grid-cols-3 gap-3">
              {GRADIENTS.map((g, i) => (
                <button
                  key={i}
                  onClick={() => updateBackground({ type: 'gradient', from: g.from, to: g.to, direction: g.dir })}
                  className="h-16 rounded-2xl active:scale-95 transition-transform shadow-sm"
                  style={{ background: `linear-gradient(${g.dir}, ${g.from}, ${g.to})` }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-semibold mb-3">単色</p>
            <div className="grid grid-cols-4 gap-3">
              {SOLIDS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => updateBackground({ type: 'solid', color: c })}
                  className="h-12 rounded-xl active:scale-95 transition-transform shadow-sm border border-gray-100"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* ── 回答入力シート ── */}
      <BottomSheet
        open={sheet === 'answer'}
        onClose={() => { setSheet(null); setEditingEl(null) }}
        title={editingContent?.question ?? '回答を入力'}
      >
        <div className="space-y-4 py-2">
          <textarea
            autoFocus
            placeholder="ここに入力..."
            value={answerText}
            onChange={e => setAnswerText(e.target.value)}
            rows={3}
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pink-300 resize-none transition-colors"
          />
          <div className="flex gap-2">
            {editingEl && (
              <button
                onClick={() => deleteElement(editingEl.id)}
                className="px-4 py-3 bg-gray-100 text-gray-500 text-sm font-semibold rounded-xl active:scale-95"
              >
                削除
              </button>
            )}
            <button
              onClick={saveAnswer}
              className="flex-1 py-3 bg-pink-400 text-white text-sm font-bold rounded-xl active:scale-95 transition-all"
            >
              保存
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
