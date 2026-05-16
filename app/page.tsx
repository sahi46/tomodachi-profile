'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile, Background } from '@/types'
import BottomSheet from '@/components/BottomSheet'
import TemplateCard from '@/components/TemplateCard'
import { Template, TEMPLATE_THEMES } from '@/lib/templates'
import { STICKER_PACKS, StickerPack } from '@/lib/stickers'
import { TEMPLATE_PACKS, TemplatePack } from '@/lib/template-packs'

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


const EMOJI_LIST = [
  '😊','🌸','⭐','💕','🎀','🌈','🍓','🐱','🌙','💫',
  '🦋','🍀','🎵','💖','🌺','🐰','✨','🎠','🍡','🌻',
  '🫶','🥹','💝','🌷','🎪','🩷','🩵','🌟','🎶','🍭',
  '🐻','🌝','🎂','🌊','🦄','🍉','🎸','🪷','🫧','🧸',
]

type TabKey = 'library' | 'created' | 'parts' | 'settings'

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
    key: 'created',
    label: 'つくった',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.6} strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    key: 'parts',
    label: 'パーツ',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.6} strokeLinecap="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 19.1l-6.2 3.3 2.4-7.4L2 9.4h7.6z"/>
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

const getTemplateIds = (): string[] => JSON.parse(localStorage.getItem('tomo_profile_ids') || '[]')
const getBookIds     = (): string[] => JSON.parse(localStorage.getItem('tomo_book_ids')    || '[]')
const getCustomStickers    = (): string[]   => JSON.parse(localStorage.getItem('tomo_custom_stickers')    || '[]')
const getCustomTemplates   = (): Template[] => JSON.parse(localStorage.getItem('tomo_custom_templates')   || '[]')
const getDownloadedPackIds      = (): string[] => JSON.parse(localStorage.getItem('tomo_downloaded_packs')       || '[]')
const getDownloadedTmplPackIds  = (): string[] => JSON.parse(localStorage.getItem('tomo_downloaded_tmpl_packs') || '[]')

export default function LibraryPage() {
  const router = useRouter()
  const [activeTab, setActiveTab]       = useState<TabKey>('library')
  const [templates, setTemplates]       = useState<Profile[]>([])
  const [books, setBooks]               = useState<Profile[]>([])
  const [responses, setResponses]       = useState<Response[]>([])
  const [loading, setLoading]           = useState(false)

  // ライブラリ用シート
  const [pickerOpen, setPickerOpen]     = useState(false)
  const [shareProfile, setShareProfile] = useState<Profile | null>(null)
  const [urlCopied, setUrlCopied]       = useState(false)
  const [menuCopied, setMenuCopied]     = useState(false)

  // 長押し削除メニュー
  const [longPressMenu, setLongPressMenu] = useState<{ profile: Profile; type: 'template' | 'book' } | null>(null)
  const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lpFired = useRef(false)
  const lpStart = useRef({ x: 0, y: 0 })

  // パーツ
  const [customStickers,    setCustomStickers]    = useState<string[]>([])
  const [emojiSheetOpen,    setEmojiSheetOpen]    = useState(false)
  const [customTemplates,   setCustomTemplates]   = useState<Template[]>([])
  const [tmplSheetOpen,     setTmplSheetOpen]     = useState(false)
  const [tmplTitle,         setTmplTitle]         = useState('')
  const [tmplThemeIdx,      setTmplThemeIdx]      = useState(0)
  const [tmplFields,        setTmplFields]        = useState<string[]>(['', '', '', ''])
  const [downloadedPackIds,     setDownloadedPackIds]     = useState<string[]>([])
  const [shopOpen,              setShopOpen]              = useState(false)
  const [shopDetail,            setShopDetail]            = useState<StickerPack | null>(null)
  const [downloadedTmplPackIds, setDownloadedTmplPackIds] = useState<string[]>([])
  const [tmplShopOpen,          setTmplShopOpen]          = useState(false)
  const [tmplShopDetail,        setTmplShopDetail]        = useState<TemplatePack | null>(null)
  const [shopStickerPacks,      setShopStickerPacks]      = useState<StickerPack[]>(STICKER_PACKS)
  const [shopTemplatePacks,     setShopTemplatePacks]     = useState<TemplatePack[]>(TEMPLATE_PACKS)

  const onLongPressStart = (e: React.PointerEvent, profile: Profile, type: 'template' | 'book') => {
    lpFired.current = false
    lpStart.current = { x: e.clientX, y: e.clientY }
    lpTimer.current = setTimeout(() => {
      lpFired.current = true
      setLongPressMenu({ profile, type })
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

  const deleteTemplate = (profile: Profile) => {
    const ids = getTemplateIds().filter(id => id !== profile.id)
    localStorage.setItem('tomo_profile_ids', JSON.stringify(ids))
    setTemplates(prev => prev.filter(p => p.id !== profile.id))
    setLongPressMenu(null)
  }
  const deleteBook = (profile: Profile) => {
    const ids = getBookIds().filter(id => id !== profile.id)
    localStorage.setItem('tomo_book_ids', JSON.stringify(ids))
    setBooks(prev => prev.filter(p => p.id !== profile.id))
    setLongPressMenu(null)
  }

  useEffect(() => {
    setCustomStickers(getCustomStickers())
    setCustomTemplates(getCustomTemplates())
    setDownloadedPackIds(getDownloadedPackIds())
    setDownloadedTmplPackIds(getDownloadedTmplPackIds())

    const load = async () => {
      const templateIds = getTemplateIds()
      const bookIds     = getBookIds()
      const allIds      = [...new Set([...templateIds, ...bookIds])]
      if (allIds.length === 0) return

      const { data: pData } = await supabase.from('profiles').select('*').in('id', allIds)
      if (pData) {
        setTemplates(templateIds.map(id => pData.find(p => p.id === id)!).filter(Boolean))
        setBooks(bookIds.map(id => pData.find(p => p.id === id)!).filter(Boolean))
      }

      if (bookIds.length > 0) {
        const { data: rData } = await supabase
          .from('responses').select('*').in('profile_id', bookIds).order('created_at', { ascending: false })
        if (rData) setResponses(rData)
      }

      const [{ data: spData }, { data: tpData }] = await Promise.all([
        supabase.from('sticker_packs').select('*').order('sort_order'),
        supabase.from('template_card_packs').select('*').order('sort_order'),
      ])
      if (spData?.length) setShopStickerPacks(spData as unknown as StickerPack[])
      if (tpData?.length) setShopTemplatePacks(tpData as unknown as TemplatePack[])
    }
    load()
  }, [])

  const responseCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of responses) counts[r.profile_id] = (counts[r.profile_id] ?? 0) + 1
    return counts
  }, [responses])

  const publishAsBook = (p: Profile) => {
    const ids = getBookIds()
    if (!ids.includes(p.id)) {
      localStorage.setItem('tomo_book_ids', JSON.stringify([p.id, ...ids]))
      setBooks(prev => [p, ...prev])
    }
    setPickerOpen(false)
    setShareProfile(p)
  }

  const copyShareUrl = async () => {
    if (!shareProfile) return
    const url = `${window.location.origin}/p/${shareProfile.slug}`
    await navigator.clipboard.writeText(url).catch(() => {})
    setUrlCopied(true)
    setTimeout(() => setUrlCopied(false), 2000)
  }

  const createTemplate = async () => {
    setLoading(true)
    const slug = Math.random().toString(36).slice(2, 10)
    const { data } = await supabase.from('profiles').insert({
      slug,
      title: 'わたしのプロフィール',
      background: { type: 'gradient', from: '#ffd6e7', to: '#c9b8ff', direction: '135deg' },
    }).select().single()
    if (data) {
      const ids = getTemplateIds()
      localStorage.setItem('tomo_profile_ids', JSON.stringify([data.id, ...ids]))
      router.push(`/edit/${data.id}`)
    }
    setLoading(false)
  }

  // パーツ操作
  const addCustomSticker = (emoji: string) => {
    const prev = getCustomStickers()
    if (prev.includes(emoji)) return
    const next = [emoji, ...prev]
    localStorage.setItem('tomo_custom_stickers', JSON.stringify(next))
    setCustomStickers(next)
    setEmojiSheetOpen(false)
  }

  const removeCustomSticker = (emoji: string) => {
    const next = getCustomStickers().filter(e => e !== emoji)
    localStorage.setItem('tomo_custom_stickers', JSON.stringify(next))
    setCustomStickers(next)
  }

  const downloadPack = (packId: string) => {
    const ids = getDownloadedPackIds()
    if (ids.includes(packId)) return
    const next = [...ids, packId]
    localStorage.setItem('tomo_downloaded_packs', JSON.stringify(next))
    setDownloadedPackIds(next)
  }

  const removePack = (packId: string) => {
    const next = getDownloadedPackIds().filter(id => id !== packId)
    localStorage.setItem('tomo_downloaded_packs', JSON.stringify(next))
    setDownloadedPackIds(next)
  }

  const downloadTmplPack = (packId: string) => {
    const ids = getDownloadedTmplPackIds()
    if (ids.includes(packId)) return
    const next = [...ids, packId]
    localStorage.setItem('tomo_downloaded_tmpl_packs', JSON.stringify(next))
    setDownloadedTmplPackIds(next)
  }

  const removeTmplPack = (packId: string) => {
    const next = getDownloadedTmplPackIds().filter(id => id !== packId)
    localStorage.setItem('tomo_downloaded_tmpl_packs', JSON.stringify(next))
    setDownloadedTmplPackIds(next)
  }

  const closeTmplSheet = () => {
    setTmplSheetOpen(false)
    setTmplTitle('')
    setTmplThemeIdx(0)
    setTmplFields(['', '', '', ''])
  }

  const saveCustomTemplate = () => {
    const validFields = tmplFields.filter(f => f.trim())
    if (!tmplTitle.trim() || validFields.length === 0) return
    const theme = TEMPLATE_THEMES[tmplThemeIdx]
    const tmpl: Template = {
      id: `custom_${Date.now()}`,
      title: tmplTitle.trim(),
      style: theme.style,
      colors: theme.colors,
      width: 220,
      fields: validFields.map((label, i) => ({ key: `f${i}`, label })),
    }
    const next = [tmpl, ...getCustomTemplates()]
    localStorage.setItem('tomo_custom_templates', JSON.stringify(next))
    setCustomTemplates(next)
    closeTmplSheet()
  }

  const removeCustomTemplate = (id: string) => {
    const next = getCustomTemplates().filter(t => t.id !== id)
    localStorage.setItem('tomo_custom_templates', JSON.stringify(next))
    setCustomTemplates(next)
  }

  const tabTitle = { library: 'ライブラリ', created: 'つくった', parts: 'パーツ', settings: 'せってい' }

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
                <p className="text-xs leading-relaxed">右下の + で雛形を選んでシェアすると<br />ここに本が追加されます</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {books.map(p => {
                  const count = responseCounts[p.id] ?? 0
                  return (
                    <button
                      key={p.id}
                      onPointerDown={e => onLongPressStart(e, p, 'book')}
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
                        <p className="text-white/60 text-[7px]">{count > 0 ? `${count}件の回答` : '回答なし'}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── つくったタブ ── */}
        {activeTab === 'created' && (
          <div className="px-4 pt-4">
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 gap-2 text-gray-400">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                </svg>
                <p className="text-sm font-medium">まだ雛形がありません</p>
                <p className="text-xs">右下の + から作ってみよう</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {templates.map(p => (
                  <button
                    key={p.id}
                    onPointerDown={e => onLongPressStart(e, p, 'template')}
                    onPointerMove={onLongPressMove}
                    onPointerUp={onLongPressEnd}
                    onPointerCancel={onLongPressEnd}
                    onClick={() => onCardClick(() => router.push(`/edit/${p.id}`))}
                    className="relative rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform bg-gray-100"
                    style={{ aspectRatio: '9/16' }}
                  >
                    <ProfileThumb background={p.background} />
                    <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }}>
                      <p className="text-white text-[8px] font-bold truncate">{p.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── パーツタブ ── */}
        {activeTab === 'parts' && (
          <div className="px-4 pt-4 space-y-6">

            {/* スタンプセクション */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-black text-gray-800">スタンプ</p>
                <button
                  onClick={() => setShopOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs font-bold active:scale-95 transition-transform"
                  style={{ backgroundColor: ACCENT }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  ショップ
                </button>
              </div>

              {/* ダウンロード済みパック */}
              {downloadedPackIds.length === 0 && customStickers.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-gray-300">
                  <span className="text-4xl">🛍️</span>
                  <p className="text-xs">ショップからパックを追加しよう</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {downloadedPackIds.map(packId => {
                    const pack = STICKER_PACKS.find(p => p.id === packId)
                    if (!pack) return null
                    return (
                      <div key={packId}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-gray-500">{pack.name}</p>
                          <button
                            onClick={() => removePack(packId)}
                            className="text-[10px] text-gray-400 active:text-rose-400 transition-colors"
                          >
                            削除
                          </button>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {pack.stickers.map((emoji, i) => (
                            <div key={i} className="h-12 flex items-center justify-center text-2xl rounded-xl bg-gray-50">
                              {emoji}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {/* マイスタンプ（個別追加） */}
                  {customStickers.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-500">マイスタンプ</p>
                        <button
                          onClick={() => setEmojiSheetOpen(true)}
                          className="text-[10px] font-bold active:opacity-60 transition-opacity"
                          style={{ color: ACCENT }}
                        >
                          + 追加
                        </button>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {customStickers.map((emoji, i) => (
                          <div key={i} className="relative">
                            <div className="h-12 flex items-center justify-center text-2xl rounded-xl bg-gray-50">
                              {emoji}
                            </div>
                            <button
                              onClick={() => removeCustomSticker(emoji)}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-300 text-gray-600 text-[10px] flex items-center justify-center leading-none active:bg-rose-200 active:text-rose-600 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* マイスタンプが空でもダウンロード済みある場合の追加ボタン */}
              {(downloadedPackIds.length > 0 || customStickers.length > 0) && customStickers.length === 0 && (
                <button
                  onClick={() => setEmojiSheetOpen(true)}
                  className="mt-3 text-xs font-bold active:opacity-60 transition-opacity"
                  style={{ color: ACCENT }}
                >
                  + 個別に追加
                </button>
              )}
            </div>

            {/* テンプレカードセクション */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-black text-gray-800">テンプレカード</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTmplShopOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-transform border"
                    style={{ borderColor: ACCENT, color: ACCENT }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    ショップ
                  </button>
                  <button
                    onClick={() => setTmplSheetOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs font-bold active:scale-95 transition-transform"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                    作成
                  </button>
                </div>
              </div>

              {downloadedTmplPackIds.length === 0 && customTemplates.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-gray-300">
                  <span className="text-4xl">🃏</span>
                  <p className="text-xs">ショップからパックを追加しよう</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* ダウンロード済みパック */}
                  {downloadedTmplPackIds.map(packId => {
                    const pack = TEMPLATE_PACKS.find(p => p.id === packId)
                    if (!pack) return null
                    return (
                      <div key={packId}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-gray-500">{pack.preview} {pack.name}</p>
                          <button
                            onClick={() => removeTmplPack(packId)}
                            className="text-[10px] text-gray-400 active:text-rose-400 transition-colors"
                          >
                            削除
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {pack.templates.map(tmpl => (
                            <div key={tmpl.id} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50">
                              <div className="pointer-events-none overflow-hidden w-full" style={{ height: 90 }}>
                                <div style={{ transform: 'scale(0.52)', transformOrigin: 'top left', width: '192%' }}>
                                  <TemplateCard template={tmpl} answers={{}} />
                                </div>
                              </div>
                              <p className="text-xs font-bold text-gray-700 truncate w-full text-center">{tmpl.title}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {/* マイカード（自作） */}
                  {customTemplates.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2">✏️ マイカード</p>
                      <div className="grid grid-cols-2 gap-3">
                        {customTemplates.map(tmpl => (
                          <div key={tmpl.id} className="relative">
                            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50">
                              <div className="pointer-events-none overflow-hidden w-full" style={{ height: 90 }}>
                                <div style={{ transform: 'scale(0.52)', transformOrigin: 'top left', width: '192%' }}>
                                  <TemplateCard template={tmpl} answers={{}} />
                                </div>
                              </div>
                              <p className="text-xs font-bold text-gray-700 truncate w-full text-center">{tmpl.title}</p>
                            </div>
                            <button
                              onClick={() => removeCustomTemplate(tmpl.id)}
                              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gray-300 text-gray-600 text-[10px] flex items-center justify-center leading-none active:bg-rose-200 active:text-rose-600 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── せっていタブ ── */}
        {activeTab === 'settings' && (
          <div className="flex flex-col items-center justify-center h-52 text-gray-300">
            <p className="text-sm">近日公開</p>
          </div>
        )}
      </div>

      {/* FAB (ライブラリ・つくったのみ表示) */}
      {(activeTab === 'library' || activeTab === 'created') && (
        <button
          onClick={activeTab === 'library' ? () => setPickerOpen(true) : createTemplate}
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

      {/* テンプレカードショップシート */}
      <BottomSheet
        open={tmplShopOpen && !tmplShopDetail}
        onClose={() => setTmplShopOpen(false)}
        title="テンプレカードショップ"
      >
        <div className="space-y-3 py-2">
          {shopTemplatePacks.map(pack => {
            const downloaded = downloadedTmplPackIds.includes(pack.id)
            return (
              <div
                key={pack.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setTmplShopDetail(pack)}
              >
                <span className="text-3xl shrink-0">{pack.preview}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{pack.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pack.templates.length}枚のカード</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); downloaded ? removeTmplPack(pack.id) : downloadTmplPack(pack.id) }}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold active:scale-90 transition-all"
                  style={downloaded
                    ? { backgroundColor: '#e5e7eb', color: '#6b7280' }
                    : { backgroundColor: ACCENT, color: 'white' }
                  }
                >
                  {downloaded ? '追加済み' : '追加'}
                </button>
              </div>
            )
          })}
        </div>
      </BottomSheet>

      {/* テンプレカードパック詳細シート */}
      <BottomSheet
        open={!!tmplShopDetail}
        onClose={() => setTmplShopDetail(null)}
        title={tmplShopDetail ? `${tmplShopDetail.preview} ${tmplShopDetail.name}` : ''}
      >
        {tmplShopDetail && (
          <div className="py-2">
            <div className="grid grid-cols-2 gap-3 mb-5">
              {tmplShopDetail.templates.map(tmpl => (
                <div key={tmpl.id} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50">
                  <div className="pointer-events-none overflow-hidden w-full" style={{ height: 90 }}>
                    <div style={{ transform: 'scale(0.52)', transformOrigin: 'top left', width: '192%' }}>
                      <TemplateCard template={tmpl} answers={{}} />
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-700 truncate w-full text-center">{tmpl.title}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const downloaded = downloadedTmplPackIds.includes(tmplShopDetail.id)
                if (downloaded) removeTmplPack(tmplShopDetail.id)
                else downloadTmplPack(tmplShopDetail.id)
              }}
              className="w-full py-4 rounded-2xl text-white font-black text-base active:scale-95 transition-all"
              style={{
                backgroundColor: downloadedTmplPackIds.includes(tmplShopDetail.id) ? '#6b7280' : ACCENT,
              }}
            >
              {downloadedTmplPackIds.includes(tmplShopDetail.id) ? '削除する' : '追加する'}
            </button>
          </div>
        )}
      </BottomSheet>

      {/* テンプレカード作成シート */}
      <BottomSheet open={tmplSheetOpen} onClose={closeTmplSheet} title="テンプレカードを作成">
        <div className="space-y-5 py-2">
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-2">タイトル</p>
            <input
              type="text" value={tmplTitle} onChange={e => setTmplTitle(e.target.value)}
              placeholder="カードのタイトルを入力"
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pink-300 transition-colors"
            />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-3">テーマ</p>
            <div className="flex gap-3">
              {TEMPLATE_THEMES.map((theme, i) => (
                <button
                  key={i}
                  onClick={() => setTmplThemeIdx(i)}
                  className="w-10 h-10 rounded-full shrink-0 active:scale-90 transition-all"
                  style={{
                    backgroundColor: theme.color,
                    boxShadow: i === tmplThemeIdx ? `0 0 0 3px white, 0 0 0 5px ${theme.color}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-semibold">項目</p>
              {tmplFields.length < 6 && (
                <button
                  onClick={() => setTmplFields([...tmplFields, ''])}
                  className="text-xs font-bold active:opacity-60 transition-opacity"
                  style={{ color: ACCENT }}
                >
                  + 追加
                </button>
              )}
            </div>
            <div className="space-y-2">
              {tmplFields.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text" value={f}
                    onChange={e => { const next = [...tmplFields]; next[i] = e.target.value; setTmplFields(next) }}
                    placeholder={`項目 ${i + 1}`}
                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-pink-300 transition-colors"
                  />
                  {tmplFields.length > 1 && (
                    <button
                      onClick={() => setTmplFields(tmplFields.filter((_, j) => j !== i))}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 active:bg-rose-50 active:text-rose-400 transition-colors text-base"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={saveCustomTemplate}
            disabled={!tmplTitle.trim() || tmplFields.filter(f => f.trim()).length === 0}
            className="w-full py-4 rounded-2xl text-white font-black text-base active:scale-95 transition-all disabled:opacity-30"
            style={{ backgroundColor: ACCENT }}
          >
            作成する
          </button>
        </div>
      </BottomSheet>

      {/* ショップシート */}
      <BottomSheet
        open={shopOpen && !shopDetail}
        onClose={() => setShopOpen(false)}
        title="スタンプショップ"
      >
        <div className="space-y-3 py-2">
          {shopStickerPacks.map(pack => {
            const downloaded = downloadedPackIds.includes(pack.id)
            return (
              <div
                key={pack.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setShopDetail(pack)}
              >
                <span className="text-3xl shrink-0">{pack.preview}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{pack.name}</p>
                  <div className="flex gap-1 mt-1">
                    {pack.stickers.slice(0, 6).map((e, i) => (
                      <span key={i} className="text-base">{e}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); downloaded ? removePack(pack.id) : downloadPack(pack.id) }}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold active:scale-90 transition-all"
                  style={downloaded
                    ? { backgroundColor: '#e5e7eb', color: '#6b7280' }
                    : { backgroundColor: ACCENT, color: 'white' }
                  }
                >
                  {downloaded ? '追加済み' : '追加'}
                </button>
              </div>
            )
          })}
        </div>
      </BottomSheet>

      {/* パック詳細シート */}
      <BottomSheet
        open={!!shopDetail}
        onClose={() => setShopDetail(null)}
        title={shopDetail ? `${shopDetail.name} パック` : ''}
      >
        {shopDetail && (
          <div className="py-2">
            <div className="grid grid-cols-6 gap-2 mb-5">
              {shopDetail.stickers.map((emoji, i) => (
                <div key={i} className="h-12 flex items-center justify-center text-2xl rounded-xl bg-gray-50">
                  {emoji}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const downloaded = downloadedPackIds.includes(shopDetail.id)
                if (downloaded) removePack(shopDetail.id)
                else downloadPack(shopDetail.id)
              }}
              className="w-full py-4 rounded-2xl text-white font-black text-base active:scale-95 transition-all"
              style={{
                backgroundColor: downloadedPackIds.includes(shopDetail.id) ? '#6b7280' : ACCENT,
              }}
            >
              {downloadedPackIds.includes(shopDetail.id) ? '削除する' : '追加する'}
            </button>
          </div>
        )}
      </BottomSheet>

      {/* スタンプ選択シート */}
      <BottomSheet open={emojiSheetOpen} onClose={() => setEmojiSheetOpen(false)} title="スタンプを選ぶ">
        <div className="grid grid-cols-6 gap-1 py-2">
          {EMOJI_LIST.map((emoji, i) => (
            <button
              key={i}
              onClick={() => addCustomSticker(emoji)}
              className="h-12 flex items-center justify-center text-3xl rounded-xl active:scale-90 active:bg-gray-100 transition-all relative"
            >
              {emoji}
              {customStickers.includes(emoji) && (
                <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-pink-400 flex items-center justify-center">
                  <svg width="6" height="6" viewBox="0 0 10 10" fill="white"><path d="M2 5l2.5 2.5L8 3"/></svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 雛形ピッカーシート */}
      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="雛形を選んでシェア">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-400 text-center">
            <p className="text-sm font-medium">雛形がありません</p>
            <p className="text-xs">「つくった」タブでまず雛形を作ってね</p>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {templates.map(p => (
              <button
                key={p.id}
                onClick={() => publishAsBook(p)}
                className="w-full flex items-center gap-3 bg-gray-50 rounded-2xl p-3 active:scale-[0.98] transition-transform text-left"
              >
                <div className="relative rounded-xl overflow-hidden shrink-0 shadow-sm" style={{ width: 36, height: 64 }}>
                  <ProfileThumb background={p.background} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{p.title}</p>
                </div>
                <span className="text-xs font-black px-3 py-1.5 rounded-full text-white shrink-0" style={{ backgroundColor: ACCENT }}>
                  シェア
                </span>
              </button>
            ))}
          </div>
        )}
      </BottomSheet>

      {/* シェアURLシート */}
      <BottomSheet open={!!shareProfile} onClose={() => { setShareProfile(null); setUrlCopied(false) }} title="シェア">
        {shareProfile && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-500 text-center">このURLを友達に送ってね</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-600 font-mono break-all">
              {typeof window !== 'undefined' ? `${window.location.origin}/p/${shareProfile.slug}` : ''}
            </div>
            <button
              onClick={copyShareUrl}
              className="w-full py-4 rounded-2xl text-white font-black text-base active:scale-95 transition-all"
              style={{ backgroundColor: urlCopied ? '#10b981' : ACCENT }}
            >
              {urlCopied ? '✓ コピーしました' : 'URLをコピー'}
            </button>
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
                onClick={() => longPressMenu.type === 'template' ? deleteTemplate(longPressMenu.profile) : deleteBook(longPressMenu.profile)}
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
