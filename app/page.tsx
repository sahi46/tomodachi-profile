'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile, Background } from '@/types'
import BottomSheet from '@/components/BottomSheet'

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

type TabKey = 'library' | 'settings'

const TABS: Array<{ key: TabKey; label: string; icon: (a: boolean) => React.ReactNode }> = [
  {
    key: 'library',
    label: 'ライブラリ',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.6} strokeLinecap="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'せってい',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.6} strokeLinecap="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
]

const getBookIds = (): string[] => JSON.parse(localStorage.getItem('tomo_book_ids') || '[]')

export default function LibraryPage() {
  const router = useRouter()
  const [activeTab, setActiveTab]                   = useState<TabKey>('library')
  const [books, setBooks]                           = useState<Profile[]>([])
  const [systemTemplates, setSystemTemplates]       = useState<Profile[]>([])
  const [responses, setResponses]                   = useState<Response[]>([])
  const [loading, setLoading]                       = useState(false)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [menuCopied, setMenuCopied]                 = useState(false)

  const [longPressMenu, setLongPressMenu] = useState<{ profile: Profile } | null>(null)
  const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lpFired = useRef(false)
  const lpStart = useRef({ x: 0, y: 0 })

  const onLongPressStart = (e: React.PointerEvent, profile: Profile) => {
    lpFired.current = false
    lpStart.current = { x: e.clientX, y: e.clientY }
    lpTimer.current = setTimeout(() => {
      lpFired.current = true
      setLongPressMenu({ profile })
      if (navigator.vibrate) navigator.vibrate(40)
    }, 500)
  }
  const onLongPressMove = (e: React.PointerEvent) => {
    if (Math.hypot(e.clientX - lpStart.current.x, e.clientY - lpStart.current.y) > 8) {
      clearTimeout(lpTimer.current!); lpTimer.current = null
    }
  }
  const onLongPressEnd = () => { clearTimeout(lpTimer.current!); lpTimer.current = null }
  const onCardClick = (action: () => void) => {
    if (lpFired.current) { lpFired.current = false; return }
    action()
  }

  const deleteBook = (profile: Profile) => {
    const ids = getBookIds().filter(id => id !== profile.id)
    localStorage.setItem('tomo_book_ids', JSON.stringify(ids))
    setBooks(prev => prev.filter(p => p.id !== profile.id))
    setLongPressMenu(null)
  }

  useEffect(() => {
    const load = async () => {
      const bookIds = getBookIds()

      const [{ data: sysData }, bookResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('is_system', true).order('created_at', { ascending: false }),
        bookIds.length > 0
          ? supabase.from('profiles').select('*').in('id', bookIds)
          : Promise.resolve({ data: [] as Profile[] }),
      ])

      if (sysData) setSystemTemplates(sysData)
      if (bookResult.data) {
        const d = bookResult.data as Profile[]
        setBooks(bookIds.map(id => d.find(p => p.id === id)!).filter(Boolean))
      }

      if (bookIds.length > 0) {
        const { data: rData } = await supabase
          .from('responses').select('*').in('profile_id', bookIds).order('created_at', { ascending: false })
        if (rData) setResponses(rData)
      }
    }
    load()
  }, [])

  const responseCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of responses) counts[r.profile_id] = (counts[r.profile_id] ?? 0) + 1
    return counts
  }, [responses])

  const selectTemplate = async (template: Profile) => {
    setLoading(true)
    setTemplatePickerOpen(false)
    const slug = Math.random().toString(36).slice(2, 10)
    const { data: newProfile } = await supabase.from('profiles').insert({
      slug,
      title: template.title,
      background: template.background,
    }).select().single()
    if (!newProfile) { setLoading(false); return }
    const { data: sourceElements } = await supabase
      .from('elements').select('*').eq('profile_id', template.id)
    if (sourceElements?.length) {
      const newElements = sourceElements.map((el: Record<string, unknown>) => ({
        ...el,
        id: crypto.randomUUID(),
        profile_id: newProfile.id,
      }))
      await supabase.from('elements').insert(newElements)
    }
    const ids = getBookIds()
    localStorage.setItem('tomo_book_ids', JSON.stringify([newProfile.id, ...ids]))
    setBooks(prev => [newProfile, ...prev])
    router.push(`/edit/${newProfile.id}`)
    setLoading(false)
  }

  const tabTitle: Record<TabKey, string> = { library: 'ライブラリ', settings: 'せってい' }

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ userSelect: 'none' }}>
      {/* ヘッダー */}
      <div className="pt-safe shrink-0" style={{ backgroundColor: ACCENT }}>
        <div className="px-5 pt-3 pb-4">
          <h1 className="text-white text-xl font-black tracking-tight">{tabTitle[activeTab]}</h1>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 120 }}>

        {/* ── ライブラリタブ ── */}
        {activeTab === 'library' && (
          <div className="px-4 pt-4">
            {books.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400 px-6 text-center">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <p className="text-sm font-medium">まだ本がありません</p>
                <p className="text-xs leading-relaxed">右下の + でテンプレートを選んで<br />プロフィール本を作ってみよう</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {books.map(p => {
                  const count = responseCounts[p.id] ?? 0
                  return (
                    <button
                      key={p.id}
                      onPointerDown={e => onLongPressStart(e, p)}
                      onPointerMove={onLongPressMove}
                      onPointerUp={onLongPressEnd}
                      onPointerCancel={onLongPressEnd}
                      onClick={() => onCardClick(() => router.push(`/book/${p.id}`))}
                      className="relative rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform bg-gray-100"
                      style={{ aspectRatio: '9/16' }}
                    >
                      <ProfileThumb background={p.background} />
                      {count > 0 && (
                        <div className="absolute top-2 right-2 min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5" style={{ backgroundColor: ACCENT }}>
                          <span className="text-white text-[10px] font-black">{count}</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}>
                        <p className="text-white text-[8px] font-bold truncate">{p.title}</p>
                        <p className="text-white/60 text-[7px]">{count > 0 ? `${count}ページ` : '0ページ'}</p>
                      </div>
                    </button>
                  )
                })}
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

      {/* FAB */}
      {activeTab === 'library' && (
        <button
          onClick={() => setTemplatePickerOpen(true)}
          disabled={loading}
          className="fixed right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform disabled:opacity-60"
          style={{ bottom: 100, backgroundColor: ACCENT, boxShadow: `0 8px 24px ${ACCENT}55` }}
        >
          {loading
            ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          }
        </button>
      )}

      {/* ボトムタブバー */}
      <div
        className="fixed left-0 right-0 z-40 border-t"
        style={{
          bottom: 0,
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          backgroundColor: '#faf0ff',
          borderColor: '#f0d6ff',
        }}
      >
        <div className="flex justify-around pt-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex flex-col items-center gap-0.5 px-4 py-1 transition-colors"
              style={{ color: activeTab === tab.key ? ACCENT : '#9ca3af' }}
            >
              {tab.icon(activeTab === tab.key)}
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* テンプレート選択シート */}
      <BottomSheet open={templatePickerOpen} onClose={() => setTemplatePickerOpen(false)} title="テンプレートを選ぶ">
        {systemTemplates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-400 text-center">
            <p className="text-sm font-medium">テンプレートがありません</p>
            <p className="text-xs">管理者がテンプレートを準備中です</p>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {systemTemplates.map(p => (
              <button
                key={p.id}
                onClick={() => selectTemplate(p)}
                className="w-full flex items-center gap-3 bg-gray-50 rounded-2xl p-3 active:scale-[0.98] transition-transform text-left"
              >
                <div className="relative rounded-xl overflow-hidden shrink-0 shadow-sm" style={{ width: 36, height: 64 }}>
                  <ProfileThumb background={p.background} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{p.title}</p>
                </div>
                <span className="text-xs font-black px-3 py-1.5 rounded-full text-white shrink-0" style={{ backgroundColor: ACCENT }}>
                  選ぶ
                </span>
              </button>
            ))}
          </div>
        )}
      </BottomSheet>

      {/* 長押しメニュー */}
      {longPressMenu && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-end"
          onClick={() => setLongPressMenu(null)}
        >
          <div className="w-full bg-white rounded-t-3xl pb-safe" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <p className="text-xs text-gray-400 text-center py-2 font-medium">{longPressMenu.profile.title}</p>
            <div className="px-4 space-y-2 pb-4">
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/p/${longPressMenu.profile.slug}`
                  await navigator.clipboard.writeText(url).catch(() => {})
                  setMenuCopied(true)
                  setTimeout(() => { setMenuCopied(false); setLongPressMenu(null) }, 1200)
                }}
                className="w-full py-4 font-bold text-base rounded-2xl active:scale-95 transition-all"
                style={{ backgroundColor: menuCopied ? '#10b981' : ACCENT, color: 'white' }}
              >
                {menuCopied ? '✓ URLをコピーしました' : 'シェア（URLをコピー）'}
              </button>
              <button
                onClick={() => deleteBook(longPressMenu.profile)}
                className="w-full py-4 text-rose-500 font-bold text-base rounded-2xl bg-rose-50 active:scale-95 transition-transform"
              >
                削除
              </button>
              <button
                onClick={() => { setLongPressMenu(null); setMenuCopied(false) }}
                className="w-full py-3.5 text-gray-500 font-bold text-base rounded-2xl bg-gray-100 active:scale-95 transition-transform"
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
