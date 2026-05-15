'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile, CanvasElement, Background } from '@/types'
import ProfileCanvas from '@/components/ProfileCanvas'
import EditorToolbar from '@/components/EditorToolbar'
import { v4 as uuidv4 } from 'uuid'

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', id).single()
      const { data: e } = await supabase.from('elements').select('*').eq('profile_id', id).order('z_index')
      if (p) setProfile(p)
      if (e) setElements(e)
    }
    load()
  }, [id])

  const saveElement = useCallback(async (el: CanvasElement) => {
    await supabase.from('elements').upsert(el)
  }, [])

  const addSticker = async (emoji: string) => {
    const el: CanvasElement = {
      id: uuidv4(),
      profile_id: id,
      type: 'sticker',
      content: { emoji },
      style: {},
      position: { x: 120 + Math.random() * 100, y: 200 + Math.random() * 100 },
      transform: { rotation: Math.random() * 20 - 10, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
    await saveElement(el)
  }

  const addQuestion = async (question: string, design: string) => {
    const el: CanvasElement = {
      id: uuidv4(),
      profile_id: id,
      type: 'question',
      content: { question, answer: '' },
      style: { design },
      position: { x: 80 + Math.random() * 60, y: 150 + Math.random() * 200 },
      transform: { rotation: Math.random() * 6 - 3, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
    await saveElement(el)
  }

  const updateBackground = async (bg: Background) => {
    if (!profile) return
    const updated = { ...profile, background: bg }
    setProfile(updated)
    await supabase.from('profiles').update({ background: bg }).eq('id', id)
  }

  const handleElementUpdate = useCallback(async (
    elId: string,
    position: { x: number; y: number },
    transform: { rotation: number; scale: number }
  ) => {
    setElements(prev =>
      prev.map(e => e.id === elId ? { ...e, position, transform } : e)
    )
    await supabase.from('elements').update({ position, transform }).eq('id', elId)
  }, [])

  const deleteSelected = async () => {
    if (!selectedId) return
    setElements(prev => prev.filter(e => e.id !== selectedId))
    await supabase.from('elements').delete().eq('id', selectedId)
    setSelectedId(null)
  }

  const handleShare = async () => {
    if (!profile) return
    setSaving(true)
    const url = `${window.location.origin}/p/${profile.slug}`
    setShareUrl(url)
    await navigator.clipboard.writeText(url).catch(() => {})
    setSaving(false)
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <p className="text-pink-400 text-lg font-semibold animate-pulse">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600">
          ← 戻る
        </button>
        <h1 className="font-bold text-gray-700 flex-1">✏️ プロフィール編集</h1>
      </header>

      {shareUrl && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-green-700 text-sm font-semibold">URLをコピーしました！</p>
            <p className="text-green-600 text-xs mt-0.5">{shareUrl}</p>
          </div>
          <button onClick={() => setShareUrl(null)} className="text-green-400 text-lg">×</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
          <ProfileCanvas
            background={profile.background}
            elements={elements}
            onElementUpdate={handleElementUpdate}
            onElementSelect={setSelectedId}
            selectedId={selectedId}
          />
        </div>

        <div className="w-72 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
          <EditorToolbar
            background={profile.background}
            onAddSticker={addSticker}
            onAddQuestion={addQuestion}
            onBackgroundChange={updateBackground}
            onDeleteSelected={deleteSelected}
            hasSelected={!!selectedId}
            onShare={handleShare}
          />
        </div>
      </div>

      {selectedId && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-4 py-2 rounded-full">
          ドラッグで移動・ハンドルで回転・拡大
        </div>
      )}
    </div>
  )
}
