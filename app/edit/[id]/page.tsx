'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile, CanvasElement, Background, PctPosition } from '@/types'
import ProfileCanvas from '@/components/ProfileCanvas'
import BottomSheet from '@/components/BottomSheet'
import TemplateCard from '@/components/TemplateCard'
import { TEMPLATES, Template } from '@/lib/templates'
import { v4 as uuidv4 } from 'uuid'

type SheetType = 'sticker' | 'question' | 'background' | 'template' | null

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
  { from: '#1a1a2e', to: '#16213e', dir: '160deg' },
  { from: '#ffd6e7', to: '#c9b8ff', dir: '135deg' },
  { from: '#ffecd2', to: '#fcb69f', dir: '135deg' },
  { from: '#a8edea', to: '#fed6e3', dir: '135deg' },
  { from: '#d4fc79', to: '#96e6a1', dir: '135deg' },
  { from: '#0f0c29', to: '#302b63', dir: '135deg' },
]
const SOLIDS = ['#000000','#1a1a2e','#fff0f5','#f5f3ff','#ecfeff','#f0fdf4','#fffbeb','#e0e7ff']

// 右側縦ツールアイコン（インスタストーリーズ風）
const SIDE_TOOLS = [
  {
    key: 'sticker',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-4-4 4 4 0 0 1-4-4"/>
        <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01"/>
      </svg>
    ),
  },
  {
    key: 'template',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="3"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M6 7h4M6 11h12"/>
      </svg>
    ),
  },
  {
    key: 'question',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="4"/>
        <path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3M12 17h.01"/>
      </svg>
    ),
  },
  {
    key: 'background',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="13" cy="13" r="8"/>
        <path d="M5 5a8 8 0 0 1 8 0"/>
        <path d="M2 12h3M19 12h3M12 2v3M12 19v3"/>
        <circle cx="13" cy="13" r="3"/>
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
      transform: { rotation: 0, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
    setSelectedId(el.id)
    setSheet(null)
    await supabase.from('elements').upsert(el)
  }

  const addTemplateCard = async (tmpl: Template) => {
    const el: CanvasElement = {
      id: uuidv4(), profile_id: id, type: 'template_card',
      content: { templateId: tmpl.id, answers: {} },
      style: {},
      position: { xPct: Math.max(2, 50 - (tmpl.width / 4)), yPct: 15 + Math.random() * 25 },
      transform: { rotation: 0, scale: 1 },
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
      transform: { rotation: 0, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
    setSelectedId(el.id)
    setSheet(null)
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

  return (
    <>
      {/* ── フルスクリーンキャンバス ── */}
      <ProfileCanvas
        background={profile.background}
        elements={elements}
        editMode
        fullScreen
        selectedId={selectedId}
        onSelect={id => { setSelectedId(id); if (id === null) setSheet(null) }}
        onUpdate={handleUpdate}
      />

      {/* ── オーバーレイ UI（全部 fixed）── */}

      {/* 左上: 戻る */}
      <button
        onClick={() => router.push('/')}
        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        className="fixed top-safe left-4 z-50 mt-3 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white active:scale-90 transition-transform"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>

      {/* 右側: 縦並びツール（インスタ風）*/}
      <div
        className="fixed top-safe right-4 z-50 mt-3 flex flex-col items-center gap-3"
        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        {SIDE_TOOLS.map(({ key, svg }) => (
          <button
            key={key}
            onClick={() => { setSelectedId(null); setSheet(s => s === key ? null : key as SheetType) }}
            className={`w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-90 ${
              sheet === key ? 'bg-white text-gray-900 shadow-lg' : 'bg-black/40 text-white'
            }`}
          >
            {svg}
          </button>
        ))}
      </div>

      {/* 選択中: 削除バー（キャンバス下端に浮かせる）*/}
      <div
        className={`fixed z-50 left-0 right-0 flex justify-center transition-all duration-200 ${
          selectedEl ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ bottom: 100, WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        <button
          onClick={deleteSelected}
          className="flex items-center gap-2 px-5 py-2.5 bg-black/55 backdrop-blur-xl rounded-full text-rose-400 text-sm font-bold active:scale-95"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
          削除
        </button>
      </div>

      {/* 下部: シェアバー（インスタ風、キャンバス外）*/}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-black/70 backdrop-blur-xl"
        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={share}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-colors ${
              copied ? 'bg-emerald-500 text-white' : 'bg-white/15 text-white border border-white/20'
            }`}
          >
            {copied
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg> URLをコピーしました</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/></svg> 友達に送る</>
            }
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

      <BottomSheet open={sheet === 'template'} onClose={() => setSheet(null)} title="テンプレートカード">
        <div className="grid grid-cols-2 gap-3 py-2">
          {TEMPLATES.map(tmpl => (
            <button
              key={tmpl.id}
              onClick={() => addTemplateCard(tmpl)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 active:scale-95 transition-all"
            >
              <div className="pointer-events-none overflow-hidden w-full" style={{ height: 90 }}>
                <div style={{ transform: 'scale(0.52)', transformOrigin: 'top left', width: '192%' }}>
                  <TemplateCard template={tmpl} answers={{}} />
                </div>
              </div>
              <p className="text-xs font-bold text-gray-700">{tmpl.title}</p>
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
    </>
  )
}
