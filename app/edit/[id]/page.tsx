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

type SheetType = 'sticker' | 'question' | 'background' | 'template' | 'title' | null

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

// 右側縦ツールアイコン
const SIDE_TOOLS: { key: SheetType; svg: React.ReactNode }[] = [
  {
    key: 'sticker',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-4-4 4 4 0 0 1-4-4"/>
        <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01"/>
      </svg>
    ),
  },
  {
    key: 'template',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="3"/>
        <path d="M8 21h8M12 17v4M6 7h4M6 11h12"/>
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

const ACCENT = '#d946ef'

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [profile, setProfile]     = useState<Profile | null>(null)
  const [elements, setElements]   = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheet, setSheet]         = useState<SheetType>(null)
  const [customQ, setCustomQ]     = useState('')
  const [titleInput, setTitleInput] = useState('')
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: e }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('elements').select('*').eq('profile_id', id).order('z_index'),
      ])
      if (p) { setProfile(p); setTitleInput(p.title) }
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

  const saveTitle = async () => {
    if (!profile || !titleInput.trim()) return
    const title = titleInput.trim()
    setProfile(p => p ? { ...p, title } : p)
    setSheet(null)
    await supabase.from('profiles').update({ title }).eq('id', id)
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

  // ボトムバーの高さ（safe area含む）は固定 72px + safe area
  const BOTTOM_BAR = 72

  return (
    <div
      className="fixed inset-0 flex flex-col bg-black"
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      onDoubleClick={e => e.preventDefault()}
    >
      {/* ── キャンバスエリア（ボトムバー分を除いた領域）── */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="absolute inset-0">
          <ProfileCanvas
            background={profile.background}
            elements={elements}
            editMode
            contained
            selectedId={selectedId}
            onSelect={id => { setSelectedId(id); if (id === null) setSheet(null) }}
            onUpdate={handleUpdate}
          />
        </div>

        {/* 左上: 戻る */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-safe left-4 z-50 mt-3 w-11 h-11 flex items-center justify-center rounded-full bg-black/35 backdrop-blur-md text-white active:scale-90 transition-transform"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* 右側: 縦ツールアイコン */}
        <div className="absolute top-safe right-4 z-50 mt-3 flex flex-col items-center gap-3">
          {SIDE_TOOLS.map(({ key, svg }) => (
            <button
              key={key as string}
              onClick={() => { setSelectedId(null); setSheet(s => s === key ? null : key) }}
              className={`w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-90 ${
                sheet === key ? 'bg-white text-gray-900 shadow-lg' : 'bg-black/35 text-white'
              }`}
            >
              {svg}
            </button>
          ))}
        </div>

        {/* 削除バー（要素選択時）*/}
        <div
          className={`absolute left-0 right-0 z-50 flex justify-center transition-all duration-200 ${
            selectedEl ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{ bottom: 16 }}
        >
          <button
            onClick={deleteSelected}
            className="flex items-center gap-2 px-5 py-2.5 bg-black/50 backdrop-blur-xl rounded-full text-rose-400 text-sm font-bold active:scale-95"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6M9 6V4h6v2"/>
            </svg>
            削除
          </button>
        </div>
      </div>

      {/* ── ボトムバー ── */}
      <div
        className="shrink-0 bg-white pb-safe flex items-center px-4 gap-3"
        style={{ height: BOTTOM_BAR }}
      >
        {/* 左: サブアクション2つ */}
        <button
          onClick={() => setSheet(s => s === 'title' ? null : 'title')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold active:scale-95 transition-transform"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
          </svg>
          タイトル
        </button>

        <button
          onClick={() => window.open(`/p/${profile.slug}`, '_blank')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold active:scale-95 transition-transform"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          プレビュー
        </button>

        <div className="flex-1" />

        {/* 右: 保存ボタン（メインCTA）*/}
        <button
          onClick={share}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-white text-sm font-black active:scale-95 transition-all"
          style={{
            backgroundColor: copied ? '#10b981' : ACCENT,
            boxShadow: copied ? '0 4px 16px #10b98155' : `0 4px 16px ${ACCENT}55`,
          }}
        >
          {copied
            ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg> コピー済み</>
            : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> 保存・送る</>
          }
        </button>
      </div>

      {/* ── ボトムシート群 ── */}

      <BottomSheet open={sheet === 'title'} onClose={() => setSheet(null)} title="タイトルを変更">
        <div className="space-y-3 py-2">
          <input
            type="text"
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
            placeholder="プロフィール帳のタイトル"
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pink-300 transition-colors"
          />
          <button
            onClick={saveTitle}
            className="w-full py-3.5 text-white text-sm font-bold rounded-xl active:scale-95 transition-all"
            style={{ backgroundColor: ACCENT }}
          >
            保存
          </button>
        </div>
      </BottomSheet>

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
    </div>
  )
}
