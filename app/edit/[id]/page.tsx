'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile, CanvasElement, Background } from '@/types'
import ProfileCanvas from '@/components/ProfileCanvas'
import BottomSheet from '@/components/BottomSheet'
import QuestionCard from '@/components/QuestionCard'
import { v4 as uuidv4 } from 'uuid'

type SheetType = 'sticker' | 'question' | 'background' | null

const EMOJI_LIST = ['😊', '🌸', '⭐', '💕', '🎀', '🌈', '🍓', '🐱', '🌙', '💫', '🦋', '🍀', '🎵', '💖', '🌺', '🐰', '✨', '🎠', '🍡', '🌻', '🎀', '🫶', '🥹', '💝', '🌷']

const QUESTION_PRESETS = [
  { question: '名前', design: 'pink' },
  { question: 'ニックネーム', design: 'purple' },
  { question: '誕生日', design: 'mint' },
  { question: '好きな食べ物', design: 'yellow' },
  { question: '嫌いな食べ物', design: 'pink' },
  { question: '趣味', design: 'purple' },
  { question: '好きな色', design: 'mint' },
  { question: '好きな音楽', design: 'yellow' },
  { question: '将来の夢', design: 'pink' },
  { question: 'ひとことメッセージ', design: 'purple' },
]

const GRADIENTS = [
  { from: '#ffb3d1', to: '#c4b5fd', direction: '135deg' },
  { from: '#fde68a', to: '#fb923c', direction: '135deg' },
  { from: '#6ee7f7', to: '#a78bfa', direction: '135deg' },
  { from: '#bbf7d0', to: '#34d399', direction: '135deg' },
  { from: '#fca5a5', to: '#f472b6', direction: '135deg' },
  { from: '#c7d2fe', to: '#818cf8', direction: '135deg' },
]

const SOLID_COLORS = ['#fce7f3', '#ede9fe', '#dbeafe', '#d1fae5', '#fef3c7', '#fee2e2', '#f0abfc', '#a5f3fc']

function getBgStyle(bg: Background): React.CSSProperties {
  if (bg.type === 'solid') return { backgroundColor: bg.color }
  return { background: `linear-gradient(${bg.direction}, ${bg.from}, ${bg.to})` }
}

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetType>(null)
  const [customQuestion, setCustomQuestion] = useState('')
  const [copied, setCopied] = useState(false)

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

  const addSticker = async (emoji: string) => {
    const el: CanvasElement = {
      id: uuidv4(),
      profile_id: id,
      type: 'sticker',
      content: { emoji },
      style: {},
      position: { x: 100 + Math.random() * 150, y: 180 + Math.random() * 200 },
      transform: { rotation: Math.random() * 20 - 10, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
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
      position: { x: 70 + Math.random() * 80, y: 120 + Math.random() * 250 },
      transform: { rotation: Math.random() * 6 - 3, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
    setSheet(null)
    await supabase.from('elements').upsert(el)
  }

  const updateBackground = async (bg: Background) => {
    if (!profile) return
    setProfile(p => p ? { ...p, background: bg } : p)
    await supabase.from('profiles').update({ background: bg }).eq('id', id)
  }

  const handleElementUpdate = useCallback(async (
    elId: string,
    position: { x: number; y: number },
    transform: { rotation: number; scale: number }
  ) => {
    setElements(prev => prev.map(e => e.id === elId ? { ...e, position, transform } : e))
    await supabase.from('elements').update({ position, transform }).eq('id', elId)
  }, [id])

  const deleteSelected = async () => {
    if (!selectedId) return
    setElements(prev => prev.filter(e => e.id !== selectedId))
    await supabase.from('elements').delete().eq('id', selectedId)
    setSelectedId(null)
  }

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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-pink-300 border-t-pink-500 animate-spin" />
          <p className="text-sm text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col" style={{ userSelect: 'none' }}>

      {/* トップバー */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-30">
        <button
          onClick={() => router.push('/')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white text-sm"
        >
          ←
        </button>
        <span className="text-white text-sm font-bold opacity-80">編集中</span>
        <button
          onClick={share}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${copied ? 'bg-green-400 text-white' : 'bg-white text-gray-800'}`}
        >
          {copied ? 'コピー済み ✓' : 'シェア 🔗'}
        </button>
      </div>

      {/* キャンバスエリア */}
      <div className="flex-1 flex items-center justify-center pt-16 pb-24 px-4 overflow-hidden">
        <div className="relative" style={{ transform: 'scale(0.9)', transformOrigin: 'center top' }}>
          <ProfileCanvas
            background={profile.background}
            elements={elements}
            onElementUpdate={handleElementUpdate}
            onElementSelect={setSelectedId}
            selectedId={selectedId}
          />
        </div>
      </div>

      {/* 選択中バナー */}
      {selectedId && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 mt-2">
          <span className="text-white text-xs">ドラッグ・ピンチで操作</span>
          <button
            onClick={deleteSelected}
            className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold"
          >
            削除
          </button>
        </div>
      )}

      {/* ボトムツールバー */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-black/60 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-around px-4 py-3 pb-safe">
          <button
            onClick={() => setSheet(s => s === 'sticker' ? null : 'sticker')}
            className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all ${sheet === 'sticker' ? 'bg-white/20' : ''}`}
          >
            <span className="text-2xl">✨</span>
            <span className="text-white text-xs font-bold">スタンプ</span>
          </button>
          <button
            onClick={() => setSheet(s => s === 'question' ? null : 'question')}
            className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all ${sheet === 'question' ? 'bg-white/20' : ''}`}
          >
            <span className="text-2xl">💬</span>
            <span className="text-white text-xs font-bold">質問</span>
          </button>
          <button
            onClick={() => setSheet(s => s === 'background' ? null : 'background')}
            className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all ${sheet === 'background' ? 'bg-white/20' : ''}`}
          >
            <span className="text-2xl">🎨</span>
            <span className="text-white text-xs font-bold">背景</span>
          </button>
        </div>
      </div>

      {/* スタンプシート */}
      <BottomSheet open={sheet === 'sticker'} onClose={() => setSheet(null)} title="スタンプを追加">
        <div className="grid grid-cols-6 gap-3 py-2">
          {EMOJI_LIST.map((emoji, i) => (
            <button
              key={i}
              onClick={() => addSticker(emoji)}
              className="text-3xl h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-pink-50 active:scale-90 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 質問シート */}
      <BottomSheet open={sheet === 'question'} onClose={() => setSheet(null)} title="質問カードを追加">
        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="質問を自由入力..."
              value={customQuestion}
              onChange={e => setCustomQuestion(e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pink-400 bg-gray-50"
            />
            <button
              onClick={() => { if (customQuestion.trim()) addQuestion(customQuestion.trim(), 'pink') }}
              className="bg-pink-400 text-white text-sm font-bold px-4 rounded-xl active:scale-95"
            >
              追加
            </button>
          </div>
          <p className="text-xs text-gray-400 font-bold px-1">よく使う質問</p>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_PRESETS.map(q => (
              <button
                key={q.question}
                onClick={() => addQuestion(q.question, q.design)}
                className="text-left text-sm bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 font-semibold text-gray-700 active:scale-95 transition-transform"
              >
                {q.question}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* 背景シート */}
      <BottomSheet open={sheet === 'background'} onClose={() => setSheet(null)} title="背景を変更">
        <div className="space-y-5 py-2">
          <div>
            <p className="text-xs text-gray-400 font-bold mb-3 px-1">グラデーション</p>
            <div className="grid grid-cols-3 gap-3">
              {GRADIENTS.map((g, i) => (
                <button
                  key={i}
                  onClick={() => { updateBackground({ type: 'gradient', from: g.from, to: g.to, direction: g.direction }); setSheet(null) }}
                  className="h-16 rounded-2xl shadow-sm active:scale-95 transition-transform"
                  style={{ background: `linear-gradient(${g.direction}, ${g.from}, ${g.to})` }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold mb-3 px-1">単色</p>
            <div className="grid grid-cols-4 gap-3">
              {SOLID_COLORS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => { updateBackground({ type: 'solid', color: c }); setSheet(null) }}
                  className="h-12 rounded-2xl shadow-sm active:scale-95 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
