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
  { from: '#1a1a2e', to: '#16213e', dir: '160deg' },  // ダークネイビー
  { from: '#ffd6e7', to: '#c9b8ff', dir: '135deg' },  // ピンク→パープル
  { from: '#ffecd2', to: '#fcb69f', dir: '135deg' },  // ピーチ
  { from: '#a8edea', to: '#fed6e3', dir: '135deg' },  // ミント→ピンク
  { from: '#d4fc79', to: '#96e6a1', dir: '135deg' },  // グリーン
  { from: '#0f0c29', to: '#302b63', dir: '135deg' },  // ディープパープル
]
const SOLIDS = ['#000000','#1a1a2e','#fff0f5','#f5f3ff','#ecfeff','#f0fdf4','#fffbeb','#e0e7ff']

// 右サイドツールアイコン定義
const SIDE_TOOLS = [
  {
    key: 'sticker',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-4-4 4 4 0 0 1-4-4"/>
        <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01"/>
      </svg>
    ),
  },
  {
    key: 'question',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="4"/>
        <path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3M12 17h.01"/>
      </svg>
    ),
  },
  {
    key: 'background',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="4"/>
        <line x1="12" y1="2" x2="12" y2="8"/>
        <line x1="12" y1="16" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="8" y2="12"/>
        <line x1="16" y1="12" x2="22" y2="12"/>
      </svg>
    ),
  },
]

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [profile, setProfile]       = useState<Profile | null>(null)
  const [elements, setElements]     = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheet, setSheet]           = useState<SheetType>(null)
  const [editingEl, setEditingEl]   = useState<CanvasElement | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [customQ, setCustomQ]       = useState('')
  const [copied, setCopied]         = useState(false)

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
      id: uuidv4(), profile_id: id, type: 'sticker',
      content: { emoji }, style: {},
      position: { xPct: 30 + Math.random() * 30, yPct: 25 + Math.random() * 35 },
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
      id: uuidv4(), profile_id: id, type: 'question',
      content: { question, answer: '' },
      style: { design },
      position: { xPct: 8 + Math.random() * 35, yPct: 20 + Math.random() * 45 },
      transform: { rotation: Math.random() * 8 - 4, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
    setSelectedId(el.id)
    setSheet(null)
    setEditingEl(el)
    setAnswerText('')
    setTimeout(() => setSheet('answer'), 80)
    await supabase.from('elements').upsert(el)
  }

  const updateBackground = async (bg: Background) => {
    if (!profile) return
    setProfile(p => p ? { ...p, background: bg } : p)
    setSheet(null)
    await supabase.from('profiles').update({ background: bg }).eq('id', id)
  }

  const handleUpdate = useCallback(async (elId: string, pos: PctPosition, transform: { rotation: number; scale: number }) => {
    setElements(prev => prev.map(e => e.id === elId ? { ...e, position: pos, transform } : e))
    await supabase.from('elements').update({ position: pos, transform }).eq('id', elId)
  }, [])

  const deleteSelected = async () => {
    if (!selectedId) return
    setElements(prev => prev.filter(e => e.id !== selectedId))
    await supabase.from('elements').delete().eq('id', selectedId)
    setSelectedId(null)
  }

  const openAnswer = () => {
    if (!selectedEl || selectedEl.type !== 'question') return
    setEditingEl(selectedEl)
    setAnswerText((selectedEl.content as { question: string; answer: string }).answer ?? '')
    setSheet('answer')
  }

  const saveAnswer = async () => {
    if (!editingEl) return
    const content = { ...(editingEl.content as { question: string; answer: string }), answer: answerText }
    setElements(prev => prev.map(e => e.id === editingEl.id ? { ...e, content } : e))
    setSheet(null); setEditingEl(null)
    await supabase.from('elements').update({ content }).eq('id', editingEl.id)
  }

  const share = async () => {
    if (!profile) return
    await navigator.clipboard.writeText(`${window.location.origin}/p/${profile.slug}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-white/10 border-t-white/50 animate-spin" />
      </div>
    )
  }

  const editingContent = editingEl?.content as { question: string; answer: string } | undefined

  return (
    <>
      {/* ── キャンバス（フルスクリーン背景）── */}
      <ProfileCanvas
        background={profile.background}
        elements={elements}
        editMode fullScreen
        selectedId={selectedId}
        onSelect={setSelectedId}
        onUpdate={handleUpdate}
      />

      {/* ── UI オーバーレイ（全部 fixed で浮かせる）── */}

      {/* 左上: 戻るボタン */}
      <button
        onClick={() => router.push('/')}
        className="fixed top-safe left-4 z-50 mt-3 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>

      {/* 右上: シェアボタン + ツールアイコン縦並び */}
      <div className="fixed top-safe right-4 z-50 mt-3 flex flex-col items-center gap-3">
        {/* シェア */}
        <button
          onClick={share}
          className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md text-sm font-black transition-colors ${
            copied ? 'bg-emerald-500 text-white' : 'bg-black/40 text-white'
          }`}
        >
          {copied
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/></svg>
          }
        </button>

        {/* 区切り */}
        <div className="w-px h-3" />

        {/* ツールアイコン */}
        {SIDE_TOOLS.map(({ key, svg }) => (
          <button
            key={key}
            onClick={() => { setSelectedId(null); setSheet(s => s === key ? null : key as SheetType) }}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-colors ${
              sheet === key
                ? 'bg-white text-gray-900'
                : 'bg-black/40 text-white'
            }`}
          >
            {svg}
          </button>
        ))}
      </div>

      {/* 選択中コンテキストバー（下部フローティング）*/}
      <div
        className={`fixed bottom-16 left-0 right-0 z-50 flex justify-center transition-all duration-200 ${
          selectedEl ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl rounded-2xl px-3 py-2.5">
          {selectedEl?.type === 'question' && (
            <button
              onClick={openAnswer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-gray-900 text-xs font-bold active:scale-95"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
              回答を入力
            </button>
          )}
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={deleteSelected}
            className="flex items-center gap-1 px-3 py-1.5 text-rose-400 text-xs font-bold active:scale-95"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
            削除
          </button>
        </div>
      </div>

      {/* ── ボトムシート群 ── */}

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

      <BottomSheet open={sheet === 'question'} onClose={() => setSheet(null)} title="質問カード">
        <div className="space-y-3 py-2">
          <div className="flex gap-2">
            <input type="text" placeholder="質問を自由入力..." value={customQ}
              onChange={e => setCustomQ(e.target.value)}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pink-300 transition-colors" />
            <button
              onClick={() => { if (customQ.trim()) { addQuestion(customQ.trim(), 'pink'); setCustomQ('') } }}
              disabled={!customQ.trim()}
              className="px-4 bg-gray-900 text-white text-sm font-bold rounded-xl disabled:opacity-30 active:scale-95">
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

      <BottomSheet open={sheet === 'background'} onClose={() => setSheet(null)} title="背景">
        <div className="space-y-4 py-2">
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-3">グラデーション</p>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENTS.map((g, i) => (
                <button key={i}
                  onClick={() => updateBackground({ type: 'gradient', from: g.from, to: g.to, direction: g.dir })}
                  className="h-16 rounded-2xl active:scale-95 transition-transform"
                  style={{ background: `linear-gradient(${g.dir}, ${g.from}, ${g.to})` }} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-3">単色</p>
            <div className="grid grid-cols-4 gap-2">
              {SOLIDS.map((c, i) => (
                <button key={i}
                  onClick={() => updateBackground({ type: 'solid', color: c })}
                  className="h-12 rounded-xl active:scale-95 transition-transform border border-gray-200"
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

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
    </>
  )
}
