'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile, Background } from '@/types'

function ProfileThumb({ background }: { background: Background }) {
  const style: React.CSSProperties =
    background.type === 'solid'
      ? { backgroundColor: background.color }
      : { background: `linear-gradient(${background.direction}, ${background.from}, ${background.to})` }
  return <div className="absolute inset-0" style={style} />
}

export default function AdminPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Profile[]>([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_system', true)
      .order('created_at', { ascending: false })
    if (data) setTemplates(data)
    setLoading(false)
  }

  const createTemplate = async () => {
    setCreating(true)
    const slug = Math.random().toString(36).slice(2, 10)
    const { data } = await supabase.from('profiles').insert({
      slug,
      title: '新しいテンプレート',
      background: { type: 'gradient', from: '#ffd6e7', to: '#c9b8ff', direction: '135deg' },
      is_system: true,
    }).select().single()
    if (data) {
      router.push(`/edit/${data.id}`)
    } else {
      setCreating(false)
    }
  }

  const deleteTemplate = async (profile: Profile) => {
    if (!confirm(`「${profile.title}」を削除しますか？`)) return
    await supabase.from('elements').delete().eq('profile_id', profile.id)
    await supabase.from('profiles').delete().eq('id', profile.id)
    setTemplates(prev => prev.filter(p => p.id !== profile.id))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-600 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white px-4 pt-safe">
        <div className="py-4">
          <h1 className="text-lg font-black">管理者ページ</h1>
          <p className="text-xs text-gray-400 mt-0.5">システムテンプレートの管理</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-16">
        <button
          onClick={createTemplate}
          disabled={creating}
          className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-bold active:opacity-80 disabled:opacity-40"
        >
          {creating ? '作成中...' : '＋ 新規テンプレート'}
        </button>

        {templates.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">テンプレートがありません</p>
        ) : (
          <div className="space-y-2">
            {templates.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center gap-3">
                <div className="relative rounded-xl overflow-hidden shrink-0" style={{ width: 36, height: 64 }}>
                  <ProfileThumb background={p.background} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{p.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">/p/{p.slug}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/edit/${p.id}`)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold active:opacity-80"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteTemplate(p)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-500 text-xs font-bold active:opacity-80"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
