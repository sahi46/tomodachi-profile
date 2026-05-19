'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile, CanvasElement, Background, PctPosition } from '@/types'
import ProfileCanvas from '@/components/ProfileCanvas'
import BottomSheet from '@/components/BottomSheet'
import TemplateCard from '@/components/TemplateCard'
import VisualCard from '@/components/VisualCard'
import { TEMPLATES, Template, TEMPLATE_THEMES } from '@/lib/templates'
import { STICKER_PACKS } from '@/lib/stickers'
import { TEMPLATE_PACKS } from '@/lib/template-packs'
import { VCardTemplate, getVisualTemplates } from '@/lib/visual-card'
import { v4 as uuidv4 } from 'uuid'

type SheetType = 'sticker' | 'background' | 'template' | 'title' | null

const getCustomStickers    = (): string[]   => JSON.parse(typeof localStorage !== 'undefined' ? localStorage.getItem('tomo_custom_stickers')   ?? '[]' : '[]')
const getCustomTemplates   = (): Template[] => JSON.parse(typeof localStorage !== 'undefined' ? localStorage.getItem('tomo_custom_templates')  ?? '[]' : '[]')
const getDownloadedPackIds     = (): string[] => JSON.parse(typeof localStorage !== 'undefined' ? localStorage.getItem('tomo_downloaded_packs')       ?? '[]' : '[]')
const getDownloadedTmplPackIds = (): string[] => JSON.parse(typeof localStorage !== 'undefined' ? localStorage.getItem('tomo_downloaded_tmpl_packs') ?? '[]' : '[]')

const EMOJI_LIST = [
  '😊','🌸','⭐','💕','🎀','🌈','🍓','🐱','🌙','💫',
  '🦋','🍀','🎵','💖','🌺','🐰','✨','🎠','🍡','🌻',
  '🫶','🥹','💝','🌷','🎪','🩷','🩵','🌟','🎶','🍭',
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

const SIDE_TOOLS: { key: SheetType; svg: React.ReactNode }[] = [
  {
    key: 'sticker',
    svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-4-4 4 4 0 0 1-4-4"/>
      <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01"/>
    </svg>,
  },
  {
    key: 'template',
    svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="2" y="3" width="20" height="14" rx="3"/>
      <path d="M8 21h8M12 17v4M6 7h4M6 11h12"/>
    </svg>,
  },
  {
    key: 'background',
    svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="8"/>
      <line x1="12" y1="16" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="8" y2="12"/>
      <line x1="16" y1="12" x2="22" y2="12"/>
    </svg>,
  },
]

const ACCENT = '#d946ef'

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [profile, setProfile]       = useState<Profile | null>(null)
  const [elements, setElements]     = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheet, setSheet]           = useState<SheetType>(null)
  const [myStickers,        setMyStickers]        = useState<string[]>([])
  const [myTemplates,       setMyTemplates]       = useState<Template[]>([])
  const [myVisualTemplates, setMyVisualTemplates] = useState<VCardTemplate[]>([])
  const [downloadedPackIds,     setDownloadedPackIds]     = useState<string[]>([])
  const [downloadedTmplPackIds, setDownloadedTmplPackIds] = useState<string[]>([])
  const [shopStickerPacks,      setShopStickerPacks]      = useState(STICKER_PACKS)
  const [shopTemplatePacks,     setShopTemplatePacks]     = useState(TEMPLATE_PACKS)
  const [titleInput, setTitleInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [saved, setSaved]           = useState(false)

  useEffect(() => {
    setMyStickers(getCustomStickers())
    setMyTemplates(getCustomTemplates())
    setMyVisualTemplates(getVisualTemplates())
    setDownloadedPackIds(getDownloadedPackIds())
    setDownloadedTmplPackIds(getDownloadedTmplPackIds())
    Promise.all([
      supabase.from('sticker_packs').select('*').order('sort_order'),
      supabase.from('template_card_packs').select('*').order('sort_order'),
    ]).then(([{ data: spData }, { data: tpData }]) => {
      if (spData?.length) setShopStickerPacks(spData as unknown as typeof STICKER_PACKS)
      if (tpData?.length) setShopTemplatePacks(tpData as unknown as typeof TEMPLATE_PACKS)
    })
  }, [])

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
    setSelectedId(el.id); setSheet(null)
    await supabase.from('elements').upsert(el)
  }

  const addTemplateCard = async (tmpl: Template) => {
    const el: CanvasElement = {
      id: uuidv4(), profile_id: id, type: 'template_card',
      content: {
        templateId: tmpl.id,
        answers: {},
        ...((tmpl.id.startsWith('custom_') || tmpl.id.startsWith('pk_')) ? { templateData: tmpl } : {}),
      }, style: {},
      position: { xPct: Math.max(2, 50 - (tmpl.width / 4)), yPct: 15 + Math.random() * 25 },
      transform: { rotation: 0, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
    setSelectedId(el.id); setSheet(null)
    await supabase.from('elements').upsert(el)
  }

  const addVisualCard = async (tmpl: VCardTemplate) => {
    const el: CanvasElement = {
      id: uuidv4(), profile_id: id, type: 'visual_card',
      content: { template: tmpl, answers: {} }, style: {},
      position: { xPct: 5 + Math.random() * 20, yPct: 15 + Math.random() * 25 },
      transform: { rotation: 0, scale: 1 },
      z_index: elements.length,
    }
    setElements(prev => [...prev, el])
    setSelectedId(el.id); setSheet(null)
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

  const handleTransformChange = useCallback(async (elId: string, transform: { rotation: number; scale: number }) => {
    setElements(prev => prev.map(e => e.id === elId ? { ...e, transform } : e))
    await supabase.from('elements').update({ transform }).eq('id', elId)
  }, [])

  const rotateSelected = (delta: number) => {
    if (!selectedEl) return
    const raw = selectedEl.transform.rotation + delta
    const rot = ((raw % 360) + 360) % 360
    handleTransformChange(selectedEl.id, { ...selectedEl.transform, rotation: rot > 180 ? rot - 360 : rot })
  }

  const scaleSelected = (factor: number) => {
    if (!selectedEl) return
    const s = parseFloat(Math.max(0.3, Math.min(3, selectedEl.transform.scale * factor)).toFixed(2))
    handleTransformChange(selectedEl.id, { ...selectedEl.transform, scale: s })
  }

  const deleteSelected = async () => {
    if (!selectedId) return
    setElements(prev => prev.filter(e => e.id !== selectedId))
    await supabase.from('elements').delete().eq('id', selectedId)
    setSelectedId(null)
  }

  const handleBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/')
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(handleBack, 700)
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-white/10 border-t-white/50 animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      {/* トップバー */}
      <div className="pt-safe shrink-0 bg-black/90 backdrop-blur-md border-b border-white/8">
        <div className="flex items-center gap-2 px-3 py-2">
          {/* 戻る */}
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-90 transition-transform shrink-0"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          {/* タイトル（タップで編集） */}
          <button
            onClick={() => setSheet(s => s === 'title' ? null : 'title')}
            className="flex-1 min-w-0 text-left flex items-center gap-1.5 active:opacity-70 transition-opacity"
          >
            <span className="text-white font-bold text-sm truncate">{profile.title}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.2" strokeLinecap="round" className="shrink-0">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
            </svg>
          </button>

          {/* 保存 */}
          <button
            onClick={handleSave}
            disabled={saved}
            className="px-5 py-2 rounded-full text-white text-sm font-black active:scale-95 transition-all shrink-0"
            style={{
              backgroundColor: saved ? '#10b981' : ACCENT,
              boxShadow: saved ? '0 4px 12px #10b98155' : `0 4px 12px ${ACCENT}55`,
            }}
          >
            {saved ? '✓' : '保存'}
          </button>
        </div>
      </div>

      {/* キャンバスエリア */}
      <div
        className="flex-1 min-h-0 relative overflow-hidden"
        style={{ touchAction: sheet ? 'auto' : 'none', overscrollBehavior: 'none' }}
      >
        <div className="absolute inset-0">
          <ProfileCanvas
            background={profile.background}
            elements={elements}
            editMode
            contained
            selectedId={selectedId}
            onSelect={eid => { setSelectedId(eid); if (eid === null) setSheet(null) }}
            onUpdate={handleUpdate}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
          />
        </div>

        {/* 右側ツールアイコン */}
        <div className={`absolute top-3 right-4 z-50 flex flex-col items-center gap-3 transition-opacity duration-150 ${isDragging ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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

        {/* 要素コントロールバー（選択時） */}
        <div
          className={`absolute left-0 right-0 z-50 flex justify-center items-center gap-2 transition-all duration-200 ${
            selectedEl && !isDragging ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{ bottom: 14 }}
        >
          <button onClick={() => rotateSelected(-15)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-xl text-white active:scale-90 transition-transform">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
          <button onClick={() => rotateSelected(15)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-xl text-white active:scale-90 transition-transform">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
          </button>
          <button onClick={() => scaleSelected(0.85)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-xl text-white active:scale-90 transition-transform text-lg font-bold">−</button>
          <button onClick={() => scaleSelected(1.18)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-xl text-white active:scale-90 transition-transform text-lg font-bold">+</button>
          <div className="w-px h-6 bg-white/20" />
          <button
            onClick={deleteSelected}
            className="flex items-center gap-1.5 px-4 py-2 bg-black/50 backdrop-blur-xl rounded-full text-rose-400 text-sm font-bold active:scale-95 transition-transform"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6M9 6V4h6v2"/>
            </svg>
            削除
          </button>
        </div>
      </div>

      {/* BottomSheets */}
      <BottomSheet open={sheet === 'title'} onClose={() => setSheet(null)} title="タイトルを変更">
        <div className="space-y-3 py-2">
          <input
            type="text" value={titleInput} onChange={e => setTitleInput(e.target.value)}
            placeholder="プロフィール帳のタイトル"
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pink-300 transition-colors"
          />
          <button onClick={saveTitle} className="w-full py-3.5 text-white text-sm font-bold rounded-xl active:scale-95" style={{ backgroundColor: ACCENT }}>
            保存
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'sticker'} onClose={() => setSheet(null)} title="スタンプ">
        <div className="space-y-4 py-2">
          {myStickers.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-2">マイスタンプ</p>
              <div className="grid grid-cols-6 gap-1">
                {myStickers.map((emoji, i) => (
                  <button key={i} onClick={() => addSticker(emoji)} className="h-12 flex items-center justify-center text-3xl rounded-xl active:scale-90 active:bg-pink-50 transition-all">
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="h-px bg-gray-100 mt-3" />
            </div>
          )}
          {downloadedPackIds.map(packId => {
            const pack = shopStickerPacks.find(p => p.id === packId)
            if (!pack) return null
            return (
              <div key={packId}>
                <p className="text-xs text-gray-400 font-semibold mb-2">{pack.name}</p>
                <div className="grid grid-cols-6 gap-1">
                  {pack.stickers.map((emoji, i) => (
                    <button key={i} onClick={() => addSticker(emoji)} className="h-12 flex items-center justify-center text-3xl rounded-xl active:scale-90 active:bg-gray-100 transition-all">
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="h-px bg-gray-100 mt-3" />
              </div>
            )
          })}
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-2">すべて</p>
            <div className="grid grid-cols-6 gap-1">
              {EMOJI_LIST.map((emoji, i) => (
                <button key={i} onClick={() => addSticker(emoji)} className="h-12 flex items-center justify-center text-3xl rounded-xl active:scale-90 active:bg-gray-100 transition-all">
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'template'} onClose={() => setSheet(null)} title="テンプレートカード">
        <div className="space-y-5 py-2">
          {myVisualTemplates.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-2">🎨 ビジュアルカード</p>
              <div className="grid grid-cols-2 gap-3">
                {myVisualTemplates.map(tmpl => (
                  <button key={tmpl.id} onClick={() => addVisualCard(tmpl)} className="flex flex-col items-center gap-2 p-2 rounded-2xl bg-gray-50 active:scale-95 transition-all overflow-hidden">
                    <div className="pointer-events-none overflow-hidden w-full rounded-xl" style={{ height: 100 }}>
                      <VisualCard template={tmpl} answers={{}} scale={0.52} />
                    </div>
                    <p className="text-xs font-bold text-gray-700 truncate w-full text-center">{tmpl.title}</p>
                  </button>
                ))}
              </div>
              <div className="h-px bg-gray-100 mt-4" />
            </div>
          )}
          {myTemplates.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-2">✏️ マイカード</p>
              <div className="grid grid-cols-2 gap-3">
                {myTemplates.map(tmpl => (
                  <button key={tmpl.id} onClick={() => addTemplateCard(tmpl)} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 active:scale-95 transition-all">
                    <div className="pointer-events-none overflow-hidden w-full" style={{ height: 90 }}>
                      <div style={{ transform: 'scale(0.52)', transformOrigin: 'top left', width: '192%' }}>
                        <TemplateCard template={tmpl} answers={{}} />
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-700 truncate w-full text-center">{tmpl.title}</p>
                  </button>
                ))}
              </div>
              <div className="h-px bg-gray-100 mt-4" />
            </div>
          )}
          {downloadedTmplPackIds.map(packId => {
            const pack = shopTemplatePacks.find(p => p.id === packId)
            if (!pack) return null
            return (
              <div key={packId}>
                <p className="text-xs text-gray-400 font-semibold mb-2">{pack.preview} {pack.name}</p>
                <div className="grid grid-cols-2 gap-3">
                  {pack.templates.map(tmpl => (
                    <button key={tmpl.id} onClick={() => addTemplateCard(tmpl)} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 active:scale-95 transition-all">
                      <div className="pointer-events-none overflow-hidden w-full" style={{ height: 90 }}>
                        <div style={{ transform: 'scale(0.52)', transformOrigin: 'top left', width: '192%' }}>
                          <TemplateCard template={tmpl} answers={{}} />
                        </div>
                      </div>
                      <p className="text-xs font-bold text-gray-700 truncate w-full text-center">{tmpl.title}</p>
                    </button>
                  ))}
                </div>
                <div className="h-px bg-gray-100 mt-4" />
              </div>
            )
          })}
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-2">すべて</p>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map(tmpl => (
                <button key={tmpl.id} onClick={() => addTemplateCard(tmpl)} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 active:scale-95 transition-all">
                  <div className="pointer-events-none overflow-hidden w-full" style={{ height: 90 }}>
                    <div style={{ transform: 'scale(0.52)', transformOrigin: 'top left', width: '192%' }}>
                      <TemplateCard template={tmpl} answers={{}} />
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-700">{tmpl.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'background'} onClose={() => setSheet(null)} title="背景">
        <div className="space-y-4 py-2">
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
