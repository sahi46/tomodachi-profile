'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile, CanvasElement, Background, PctPosition } from '@/types'
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
  { q: '名前',              design: 'pink'   },
  { q: 'ニックネーム',     design: 'purple' },
  { q: '誕生日',           design: 'mint'   },
  { q: '血液型',           design: 'yellow' },
  { q: '好きな食べ物',     design: 'pink'   },
  { q: '嫌いな食べ物',     design: 'purple' },
  { q: '趣味',             design: 'mint'   },
  { q: '好きな色',         design: 'yellow' },
  { q: '好きな音楽',       design: 'blue'   },
  { q: '好きなアーティスト', design: 'pink' },
  { q: 'マイブーム',       design: 'purple' },
  { q: '将来の夢',         design: 'mint'   },
  { q: 'ひとこと',         design: 'yellow' },
]

const GRADIENTS = [
  { from: '#ffd6e7', to: '#c9b8ff', dir: '135deg' },
  { from: '#ffecd2', to: '#fcb69f', dir: '135deg' },
  { from: '#a8edea', to: '#fed6e3', dir: '135deg' },
  { from: '#d4fc79', to: '#96e6a1', dir: '135deg' },
  { from: '#fbc2eb', to: '#a6c1ee', dir: '135deg' },
  { from: '#fddb92', to: '#d1fdff', dir: '135deg' },
]
const SOLIDS = ['#fff0f5','#f5f3ff','#ecfeff','#f0fdf4','#fffbeb','#e0e7ff','#fce7f3','#fef9c3']

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [profile, setProfile]     = useState<Profile | null>(null)
  const [elements, setElements]   = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheet, setSheet]         = useState<SheetType>(null)
  const [editingEl, setEditingEl] = useState<CanvasElement | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [customQ, setCustomQ]     = useState('')
  const [copied, setCopied]       = useState(false)

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

  const selectedEl = elements.find(e => e.id === selectedId)

  const addSticker = async (emoji: string) => {
    const el: CanvasElement = {
      id: uuidv4(),
      profile_id: id,
      type: 'sticker',
      content: { emoji },
      style: {},
      position: { xPct: 30 + Math.random() * 30, yPct: 25 + Math.random() * 40 },
      transform: { rotation: Math.random() * 20 - 10, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
    setSelectedId(el.id)
    setSheet(null)
    await supabase.from('elements').upsert(el)
  }

  const addQuestion = async (question: string, design: string) => {
    const el: CanvasElement = {
      id: uuidv4(),
      profile_id: id,
      type: 'question',
      content: { question, answer: '' },
      style: { design },
      position: { xPct: 10 + Math.random() * 40, yPct: 20 + Math.random() * 50 },
      transform: { rotation: Math.random() * 8 - 4, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
    setSelectedId(el.id)
    setSheet(null)
    // 追加直後に回答入力
    setEditingEl(el)
    setAnswerText('')
    setTimeout(() => setSheet('answer'), 100)
    await supabase.from('elements').upsert(el)
  }

  const updateBackground = async (bg: Background) => {
    if (!profile) return
    setProfile(p => p ? { ...p, background: bg } : p)
    setSheet(null)
    await supabase.from('profiles').update({ background: bg }).eq('id', id)
  }

  const handleUpdate = useCallback(async (
    elId: string, pos: PctPosition, transform: { rotation: number; scale: number }
  ) => {
    setElements(prev => prev.map(e => e.id === elId ? { ...e, position: pos, transform } : e))
    await supabase.from('elements').update({ position: pos, transform }).eq('id', elId)
  }, [])

  const deleteSelected = async () => {
    if (!selectedId) return
    setElements(prev => prev.filter(e => e.id !== selectedId))
    await supabase.from('elements').delete().eq('id', selectedId)
    setSelectedId(null)
  }

  const openAnswerEdit = () => {
    if (!selectedEl || selectedEl.type !== 'question') return
    setEditingEl(selectedEl)
    setAnswerText((selectedEl.content as { question: string; answer: string }).answer ?? '')
    setSheet('answer')
  }

  const saveAnswer = async () => {
    if (!editingEl) return
    const content = { ...(editingEl.content as { question: string; answer: string }), answer: answerText }
    setElements(prev => prev.map(e => e.id === editingEl.id ? { ...e, content } : e))
    setSheet(null)
    setEditingEl(null)
    await supabase.from('elements').update({ content }).eq('id', editingEl.id)
  }

  const share = async () => {
    if (!profile) return
    const url = `${window.location.origin}/p/${profile.slug}`
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 rounded-full border-[3px] border-white/10 border-t-white/60 animate-spin" />
      </div>
    )
  }

  const editingContent = editingEl?.content as { question: string; answer: string } | undefined

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* ── ヘッダー ── */}
      <header className="flex items-center justify-between px-5 pt-safe pb-3 shrink-0">
        <button
          onClick={() => router.push('/')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white/70"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M5 12l7-7M5 12l7 7"/></svg>
        </button>

        <button
          onClick={share}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
            copied ? 'bg-emerald-500 text-white' : 'bg-white text-gray-900'
          }`}
        >
          {copied
            ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>コピー済み</>
            : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/></svg>シェア</>
          }
        </button>
      </header>

      {/* ── キャンバス ── */}
      <div className="flex-1 flex items-start justify-center px-3 pb-2 overflow-y-auto">
        <div className="w-full max-w-sm">
          <ProfileCanvas
            background={profile.background}
            elements={elements}
            editMode
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdate={handleUpdate}
          />
        </div>
      </div>

      {/* ── 選択中コンテキストバー ── */}
      <div
        className={`flex justify-center pb-2 transition-all duration-200 ${selectedEl ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-2xl px-3 py-2.5">
          {selectedEl?.type === 'question' && (
            <button
              onClick={openAnswerEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-gray-800 text-xs font-bold"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              回答を入力
            </button>
          )}
          <div className="w-px h-5 bg-white/20" />
          <button
            onClick={deleteSelected}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-rose-400 text-xs font-bold"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            削除
          </button>
        </div>
      </div>

      {/* ── ボトムツールバー ── */}
      <div className="shrink-0 bg-[#111] border-t border-white/5">
        <div className="grid grid-cols-3">
          {[
            { key: 'sticker',    label: 'スタンプ', icon: <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4-2.43z" fill="currentColor"/> },
            { key: 'question',   label: '質問カード', icon: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></> },
            { key: 'background', label: '背景', icon: <><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setSelectedId(null); setSheet(s => s === key ? null : key as SheetType) }}
              className={`flex flex-col items-center gap-1.5 py-4 transition-colors ${
                sheet === key ? 'text-pink-400' : 'text-white/35 hover:text-white/60'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {icon}
              </svg>
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── スタンプシート ── */}
      <BottomSheet open={sheet === 'sticker'} onClose={() => setSheet(null)} title="スタンプ">
        <div className="grid grid-cols-6 gap-1 py-2">
          {EMOJI_LIST.map((emoji, i) => (
            <button key={i} onClick={() => addSticker(emoji)}
              className="h-12 flex items-center justify-center text-3xl rounded-xl active:scale-90 active:bg-gray-100 transition-all">
              {emoji}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* ── 質問シート ── */}
      <BottomSheet open={sheet === 'question'} onClose={() => setSheet(null)} title="質問カード">
        <div className="space-y-3 py-2">
          <div className="flex gap-2">
            <input type="text" placeholder="質問を自由入力..." value={customQ}
              onChange={e => setCustomQ(e.target.value)}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pink-300 transition-colors" />
            <button onClick={() => { if (customQ.trim()) { addQuestion(customQ.trim(), 'pink'); setCustomQ('') } }}
              disabled={!customQ.trim()}
              className="px-4 bg-pink-400 text-white text-sm font-bold rounded-xl disabled:opacity-30 active:scale-95">
              追加
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_PRESETS.map(({ q, design }) => (
              <button key={q} onClick={() => addQuestion(q, design)}
                className="text-left text-sm bg-gray-50 rounded-xl px-4 py-3 font-medium text-gray-700 active:scale-95 active:bg-gray-100 transition-all">
                {q}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* ── 背景シート ── */}
      <BottomSheet open={sheet === 'background'} onClose={() => setSheet(null)} title="背景">
        <div className="space-y-5 py-2">
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-3">グラデーション</p>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENTS.map((g, i) => (
                <button key={i} onClick={() => updateBackground({ type: 'gradient', from: g.from, to: g.to, direction: g.dir })}
                  className="h-16 rounded-2xl active:scale-95 transition-transform"
                  style={{ background: `linear-gradient(${g.dir}, ${g.from}, ${g.to})` }} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-3">単色</p>
            <div className="grid grid-cols-4 gap-2">
              {SOLIDS.map((c, i) => (
                <button key={i} onClick={() => updateBackground({ type: 'solid', color: c })}
                  className="h-12 rounded-xl active:scale-95 transition-transform border border-gray-100"
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* ── 回答入力シート ── */}
      <BottomSheet
        open={sheet === 'answer'}
        onClose={() => { setSheet(null); setEditingEl(null) }}
        title={editingContent?.question ?? '回答'}
      >
        <div className="space-y-3 py-2">
          <textarea autoFocus rows={3} placeholder="回答を入力..." value={answerText}
            onChange={e => setAnswerText(e.target.value)}
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pink-300 resize-none transition-colors" />
          <button onClick={saveAnswer}
            className="w-full py-3.5 bg-gray-900 text-white text-sm font-bold rounded-xl active:scale-95 transition-all">
            保存
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
