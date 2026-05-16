'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile, Background } from '@/types'

// レスポンス型
interface Response {
  id: string
  profile_id: string
  answers: Record<string, unknown>
  created_at: string
}

function ProfileThumb({ background }: { background: Background }) {
  const style: React.CSSProperties =
    background.type === 'solid'
      ? { backgroundColor: background.color }
      : { background: `linear-gradient(${background.direction}, ${background.from}, ${background.to})` }
  return <div className="absolute inset-0" style={style} />
}

const ACCENT = '#d946ef'

// タブ定義
const TABS = [
  {
    key: 'library',
    label: 'ライブラリ',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    key: 'created',
    label: 'つくった',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'せってい',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
]

export default function LibraryPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'library' | 'created' | 'settings'>('library')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [responses, setResponses] = useState<(Response & { profile: Profile })[]>([])
  const [loading, setLoading] = useState(false)

  // 作ったプロフIDをlocalStorageから取得
  const getMyIds = (): string[] => JSON.parse(localStorage.getItem('tomo_profile_ids') || '[]')

  useEffect(() => {
    const load = async () => {
      const ids = getMyIds()
      if (ids.length === 0) return

      // 作ったプロフを取得
      const { data: pData } = await supabase
        .from('profiles').select('*').in('id', ids).order('updated_at', { ascending: false })
      if (pData) setProfiles(pData)

      // もらった回答を取得
      const { data: rData } = await supabase
        .from('responses').select('*').in('profile_id', ids).order('created_at', { ascending: false })
      if (rData && pData) {
        const withProfile = rData.map(r => ({
          ...r,
          profile: pData.find(p => p.id === r.profile_id)!,
        })).filter(r => r.profile)
        setResponses(withProfile)
      }
    }
    load()
  }, [])

  const createProfile = async () => {
    setLoading(true)
    const slug = Math.random().toString(36).slice(2, 10)
    const { data } = await supabase.from('profiles').insert({
      slug,
      title: 'わたしのプロフィール',
      background: { type: 'gradient', from: '#ffd6e7', to: '#c9b8ff', direction: '135deg' },
    }).select().single()

    if (data) {
      const ids = getMyIds()
      localStorage.setItem('tomo_profile_ids', JSON.stringify([data.id, ...ids]))
      router.push(`/edit/${data.id}`)
    }
    setLoading(false)
  }

  // 回答のフォーマット日時
  const fmtDate = (s: string) => {
    const d = new Date(s)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ userSelect: 'none' }}>
      {/* ヘッダー */}
      <div className="pt-safe shrink-0" style={{ backgroundColor: ACCENT }}>
        <div className="px-5 pt-3 pb-4">
          <h1 className="text-white text-xl font-black tracking-tight">
            {activeTab === 'library' ? 'ライブラリ' : activeTab === 'created' ? 'つくった' : 'せってい'}
          </h1>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 100 }}>

        {/* ── ライブラリタブ: もらった回答を本形式で ── */}
        {activeTab === 'library' && (
          <div className="px-4 pt-4 space-y-3">
            {responses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 gap-2 text-gray-400">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <p className="text-sm font-medium">まだ回答が届いていません</p>
                <p className="text-xs">URLを友達に送って書いてもらおう</p>
              </div>
            ) : (
              responses.map(r => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 active:scale-[0.98] transition-transform cursor-pointer"
                  onClick={() => router.push(`/r/${r.id}`)}
                >
                  {/* サムネイル */}
                  <div
                    className="relative rounded-xl overflow-hidden shrink-0 shadow-sm"
                    style={{ width: 52, height: 92 }}
                  >
                    <ProfileThumb background={r.profile.background} />
                  </div>

                  {/* テキスト */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{r.profile.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(r.created_at)} に届いた</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.keys(r.answers).slice(0, 3).map(k => (
                        <span key={k} className="text-[10px] bg-purple-100 text-purple-600 rounded-full px-2 py-0.5 font-medium">
                          ✓ 回答あり
                        </span>
                      ))}
                    </div>
                  </div>

                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-300 shrink-0">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── つくったタブ: 雛形グリッド ── */}
        {activeTab === 'created' && (
          <div className="px-4 pt-4">
            {profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 gap-2 text-gray-400">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                </svg>
                <p className="text-sm font-medium">まだプロフィール帳がありません</p>
                <p className="text-xs">右下の + から作ってみよう</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/edit/${p.id}`)}
                    className="relative rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform bg-gray-100"
                    style={{ aspectRatio: '9/16' }}
                  >
                    <ProfileThumb background={p.background} />
                    <div
                      className="absolute bottom-0 left-0 right-0 p-2"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }}
                    >
                      <p className="text-white text-[8px] font-bold truncate">{p.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── せっていタブ ── */}
        {activeTab === 'settings' && (
          <div className="flex flex-col items-center justify-center h-52 text-gray-300">
            <p className="text-sm">近日公開</p>
          </div>
        )}
      </div>

      {/* FAB（つくったタブのみ表示）*/}
      {activeTab === 'created' && (
        <button
          onClick={createProfile}
          disabled={loading}
          className="fixed right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform disabled:opacity-60"
          style={{ bottom: 84, backgroundColor: ACCENT, boxShadow: `0 8px 24px ${ACCENT}55` }}
        >
          {loading
            ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          }
        </button>
      )}

      {/* ボトムタブバー（少し上に浮かせる）*/}
      <div
        className="fixed left-0 right-0 z-40 border-t"
        style={{
          bottom: 0,
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 6px)',
          backgroundColor: '#faf0ff',
          borderColor: '#f0d6ff',
        }}
      >
        <div className="flex justify-around pt-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className="flex flex-col items-center gap-0.5 px-5 py-1 transition-colors"
              style={{ color: activeTab === tab.key ? ACCENT : '#9ca3af' }}
            >
              {tab.icon(activeTab === tab.key)}
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
