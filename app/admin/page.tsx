'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Template, TEMPLATE_THEMES } from '@/lib/templates'
import TemplateCard from '@/components/TemplateCard'

type AdminTab = 'stickers' | 'templates'

interface StickerPackRow {
  id: string
  name: string
  preview: string
  stickers: string[]
  sort_order: number
}

interface TemplatePackRow {
  id: string
  name: string
  preview: string
  templates: Template[]
  sort_order: number
}

const EMPTY_SP: StickerPackRow     = { id: '', name: '', preview: '', stickers: [], sort_order: 0 }
const EMPTY_TP: TemplatePackRow    = { id: '', name: '', preview: '', templates: [], sort_order: 0 }

export default function AdminPage() {
  const [tab, setTab]               = useState<AdminTab>('stickers')
  const [stickerPacks, setStickerPacks]   = useState<StickerPackRow[]>([])
  const [templatePacks, setTemplatePacks] = useState<TemplatePackRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)

  // Sticker pack editor
  const [editSP,   setEditSP]   = useState<StickerPackRow | null>(null)
  const [isNewSP,  setIsNewSP]  = useState(false)
  const [spText,   setSpText]   = useState('')

  // Template pack editor
  const [editTP,   setEditTP]   = useState<TemplatePackRow | null>(null)
  const [isNewTP,  setIsNewTP]  = useState(false)

  // Card editor (within template pack)
  const [cardEditIdx,    setCardEditIdx]    = useState<number | null>(null)
  const [cardTitle,      setCardTitle]      = useState('')
  const [cardThemeIdx,   setCardThemeIdx]   = useState(0)
  const [cardFields,     setCardFields]     = useState<string[]>(['', '', '', ''])

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const [{ data: sp }, { data: tp }] = await Promise.all([
      supabase.from('sticker_packs').select('*').order('sort_order'),
      supabase.from('template_card_packs').select('*').order('sort_order'),
    ])
    if (sp) setStickerPacks(sp as StickerPackRow[])
    if (tp) setTemplatePacks(tp as unknown as TemplatePackRow[])
    setLoading(false)
  }

  // ── Sticker pack CRUD ──────────────────────────────────────

  const openNewSP = () => { setEditSP({ ...EMPTY_SP }); setIsNewSP(true); setSpText('') }
  const openEditSP = (p: StickerPackRow) => { setEditSP({ ...p }); setIsNewSP(false); setSpText(p.stickers.join(' ')) }

  const saveSP = async () => {
    if (!editSP?.id.trim() || !editSP.name.trim()) return
    setSaving(true)
    const stickers = spText.split(/[\s,，]+/).filter(s => s.trim())
    const row = { ...editSP, stickers, id: editSP.id.trim() }
    if (isNewSP) {
      const { error } = await supabase.from('sticker_packs').insert(row)
      if (!error) { setStickerPacks(p => [...p, row]); setEditSP(null) }
      else alert('エラー: ' + error.message)
    } else {
      const { error } = await supabase.from('sticker_packs').update(row).eq('id', row.id)
      if (!error) { setStickerPacks(p => p.map(x => x.id === row.id ? row : x)); setEditSP(null) }
      else alert('エラー: ' + error.message)
    }
    setSaving(false)
  }

  const deleteSP = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('sticker_packs').delete().eq('id', id)
    setStickerPacks(p => p.filter(x => x.id !== id))
    if (editSP?.id === id) setEditSP(null)
  }

  // ── Template pack CRUD ─────────────────────────────────────

  const openNewTP = () => { setEditTP({ ...EMPTY_TP }); setIsNewTP(true); setCardEditIdx(null) }
  const openEditTP = (p: TemplatePackRow) => { setEditTP({ ...p, templates: [...p.templates] }); setIsNewTP(false); setCardEditIdx(null) }

  const saveTP = async () => {
    if (!editTP?.id.trim() || !editTP.name.trim()) return
    setSaving(true)
    const row = { ...editTP, id: editTP.id.trim() }
    if (isNewTP) {
      const { error } = await supabase.from('template_card_packs').insert(row)
      if (!error) { setTemplatePacks(p => [...p, row]); setEditTP(null) }
      else alert('エラー: ' + error.message)
    } else {
      const { error } = await supabase.from('template_card_packs').update(row).eq('id', row.id)
      if (!error) { setTemplatePacks(p => p.map(x => x.id === row.id ? row : x)); setEditTP(null) }
      else alert('エラー: ' + error.message)
    }
    setSaving(false)
  }

  const deleteTP = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('template_card_packs').delete().eq('id', id)
    setTemplatePacks(p => p.filter(x => x.id !== id))
    if (editTP?.id === id) setEditTP(null)
  }

  // ── Card editor ────────────────────────────────────────────

  const openNewCard = () => {
    setCardTitle(''); setCardThemeIdx(0); setCardFields(['', '', '', '']); setCardEditIdx(-1)
  }

  const openEditCard = (card: Template, idx: number) => {
    setCardTitle(card.title)
    const ti = TEMPLATE_THEMES.findIndex(t => t.color === card.colors.title)
    setCardThemeIdx(ti >= 0 ? ti : 0)
    const labels = card.fields.map(f => f.label)
    while (labels.length < 4) labels.push('')
    setCardFields(labels)
    setCardEditIdx(idx)
  }

  const saveCard = () => {
    if (!editTP || !cardTitle.trim()) return
    const validFields = cardFields.filter(f => f.trim())
    if (!validFields.length) return
    const theme = TEMPLATE_THEMES[cardThemeIdx]
    const card: Template = {
      id: cardEditIdx !== null && cardEditIdx >= 0 ? editTP.templates[cardEditIdx].id : `card_${Date.now()}`,
      title: cardTitle.trim(),
      style: theme.style,
      colors: theme.colors,
      width: 220,
      fields: validFields.map((label, i) => ({ key: `f${i}`, label })),
    }
    const templates = [...editTP.templates]
    if (cardEditIdx !== null && cardEditIdx >= 0) templates[cardEditIdx] = card
    else templates.push(card)
    setEditTP({ ...editTP, templates })
    setCardEditIdx(null)
  }

  const removeCard = (idx: number) => {
    if (!editTP) return
    setEditTP({ ...editTP, templates: editTP.templates.filter((_, i) => i !== idx) })
    if (cardEditIdx === idx) setCardEditIdx(null)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-600 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 pt-safe">
        <div className="py-4">
          <h1 className="text-lg font-black">管理者ページ</h1>
          <p className="text-xs text-gray-400 mt-0.5">スタンプ・テンプレカードの管理</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        {(['stickers', 'templates'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === t ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}
          >
            {t === 'stickers' ? 'スタンプ' : 'テンプレカード'}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-4 pb-16">

        {/* ── Sticker Packs ── */}
        {tab === 'stickers' && (
          <>
            <button onClick={openNewSP} className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-bold active:opacity-80">
              ＋ 新規スタンプパック
            </button>

            {editSP && (
              <div className="bg-white rounded-2xl p-4 space-y-3 border border-gray-200 shadow-sm">
                <p className="text-sm font-black text-gray-800">{isNewSP ? '新規作成' : '編集'}</p>

                <Field label="ID（英数字・変更不可）">
                  <input value={editSP.id} onChange={e => setEditSP({ ...editSP, id: e.target.value })}
                    readOnly={!isNewSP} placeholder="例: animals"
                    className={`${inp} ${!isNewSP ? 'opacity-40 cursor-default' : ''}`} />
                </Field>
                <Field label="パック名">
                  <input value={editSP.name} onChange={e => setEditSP({ ...editSP, name: e.target.value })}
                    placeholder="例: どうぶつ" className={inp} />
                </Field>
                <Field label="プレビュー絵文字">
                  <input value={editSP.preview} onChange={e => setEditSP({ ...editSP, preview: e.target.value })}
                    placeholder="例: 🐰" className={inp} />
                </Field>
                <Field label="スタンプ（スペース or カンマ区切り）">
                  <textarea value={spText} onChange={e => setSpText(e.target.value)}
                    placeholder="🐰 🐇 🐱 🐮 🐷 🐸 ..."
                    className={`${inp} resize-none`} rows={3} />
                  <div className="grid grid-cols-8 gap-1 mt-2">
                    {spText.split(/[\s,，]+/).filter(s => s.trim()).map((e, i) => (
                      <div key={i} className="h-9 flex items-center justify-center text-xl rounded-lg bg-gray-50">{e}</div>
                    ))}
                  </div>
                </Field>
                <Field label="表示順">
                  <input type="number" value={editSP.sort_order}
                    onChange={e => setEditSP({ ...editSP, sort_order: parseInt(e.target.value) || 0 })}
                    className={inp} />
                </Field>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditSP(null)} className={btnSec}>キャンセル</button>
                  <button onClick={saveSP} disabled={saving} className={btnPri}>{saving ? '保存中...' : '保存'}</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {stickerPacks.map(pack => (
                <div key={pack.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{pack.preview}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{pack.name}</p>
                      <p className="text-xs text-gray-400">{pack.stickers.length}個 · order {pack.sort_order}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEditSP(pack)} className={btnSm}>編集</button>
                      <button onClick={() => deleteSP(pack.id)} className={btnSmDanger}>削除</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-8 gap-1 mt-3">
                    {pack.stickers.map((e, i) => (
                      <div key={i} className="h-9 flex items-center justify-center text-xl rounded-lg bg-gray-50">{e}</div>
                    ))}
                  </div>
                </div>
              ))}
              {!stickerPacks.length && <EmptyState text="まだパックがありません" />}
            </div>
          </>
        )}

        {/* ── Template Card Packs ── */}
        {tab === 'templates' && (
          <>
            <button onClick={openNewTP} className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-bold active:opacity-80">
              ＋ 新規テンプレカードパック
            </button>

            {editTP && (
              <div className="bg-white rounded-2xl p-4 space-y-4 border border-gray-200 shadow-sm">
                <p className="text-sm font-black text-gray-800">{isNewTP ? '新規作成' : '編集'}: {editTP.name || '(無題)'}</p>

                <Field label="ID（英数字・変更不可）">
                  <input value={editTP.id} onChange={e => setEditTP({ ...editTP, id: e.target.value })}
                    readOnly={!isNewTP} placeholder="例: profile"
                    className={`${inp} ${!isNewTP ? 'opacity-40 cursor-default' : ''}`} />
                </Field>
                <Field label="パック名">
                  <input value={editTP.name} onChange={e => setEditTP({ ...editTP, name: e.target.value })}
                    placeholder="例: プロフィール" className={inp} />
                </Field>
                <Field label="プレビュー絵文字">
                  <input value={editTP.preview} onChange={e => setEditTP({ ...editTP, preview: e.target.value })}
                    placeholder="例: ✿" className={inp} />
                </Field>
                <Field label="表示順">
                  <input type="number" value={editTP.sort_order}
                    onChange={e => setEditTP({ ...editTP, sort_order: parseInt(e.target.value) || 0 })}
                    className={inp} />
                </Field>

                {/* Cards in this pack */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-bold">カード（{editTP.templates.length}枚）</p>
                    <button onClick={openNewCard} className="text-xs font-bold text-gray-700 active:opacity-60">＋ カード追加</button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {editTP.templates.map((card, idx) => (
                      <div key={card.id} className="relative">
                        <button onClick={() => openEditCard(card, idx)}
                          className="w-full flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-gray-50 border border-gray-200 active:bg-gray-100">
                          <div className="pointer-events-none overflow-hidden w-full" style={{ height: 70 }}>
                            <div style={{ transform: 'scale(0.44)', transformOrigin: 'top left', width: '227%' }}>
                              <TemplateCard template={card} answers={{}} />
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-gray-600 truncate w-full text-center">{card.title}</p>
                        </button>
                        <button onClick={() => removeCard(idx)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-100 text-rose-400 text-[10px] flex items-center justify-center active:bg-rose-200">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Inline card editor */}
                  {cardEditIdx !== null && (
                    <div className="bg-gray-50 rounded-xl p-3 space-y-3 border border-gray-200">
                      <p className="text-xs font-bold text-gray-600">
                        {cardEditIdx >= 0 ? 'カードを編集' : 'カードを追加'}
                      </p>
                      <input value={cardTitle} onChange={e => setCardTitle(e.target.value)}
                        placeholder="カードタイトル"
                        className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 transition-colors" />

                      <div>
                        <p className="text-xs text-gray-400 mb-2">テーマ</p>
                        <div className="flex gap-2">
                          {TEMPLATE_THEMES.map((theme, i) => (
                            <button key={i} onClick={() => setCardThemeIdx(i)}
                              className="w-8 h-8 rounded-full shrink-0 active:scale-90 transition-all"
                              style={{
                                backgroundColor: theme.color,
                                boxShadow: i === cardThemeIdx ? `0 0 0 2px white, 0 0 0 4px ${theme.color}` : 'none',
                              }} />
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs text-gray-400">項目</p>
                          {cardFields.length < 6 && (
                            <button onClick={() => setCardFields([...cardFields, ''])} className="text-xs font-bold text-gray-600">＋ 追加</button>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {cardFields.map((f, i) => (
                            <div key={i} className="flex gap-1.5">
                              <input value={f} onChange={e => { const n = [...cardFields]; n[i] = e.target.value; setCardFields(n) }}
                                placeholder={`項目 ${i + 1}`}
                                className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-gray-400 transition-colors" />
                              {cardFields.length > 1 && (
                                <button onClick={() => setCardFields(cardFields.filter((_, j) => j !== i))}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-400 text-base active:text-rose-400">×</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => setCardEditIdx(null)} className={btnSec}>キャンセル</button>
                        <button onClick={saveCard} className={btnPri}>保存</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setEditTP(null); setCardEditIdx(null) }} className={btnSec}>キャンセル</button>
                  <button onClick={saveTP} disabled={saving} className={btnPri}>{saving ? '保存中...' : '保存'}</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {templatePacks.map(pack => (
                <div key={pack.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{pack.preview}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{pack.name}</p>
                      <p className="text-xs text-gray-400">{pack.templates.length}枚 · order {pack.sort_order}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEditTP(pack)} className={btnSm}>編集</button>
                      <button onClick={() => deleteTP(pack.id)} className={btnSmDanger}>削除</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {pack.templates.map(tmpl => (
                      <div key={tmpl.id} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-gray-50">
                        <div className="pointer-events-none overflow-hidden w-full" style={{ height: 70 }}>
                          <div style={{ transform: 'scale(0.44)', transformOrigin: 'top left', width: '227%' }}>
                            <TemplateCard template={tmpl} answers={{}} />
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-gray-600 truncate w-full text-center">{tmpl.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!templatePacks.length && <EmptyState text="まだパックがありません" />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Shared micro-components ──────────────────────────────────

const inp = 'w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 transition-colors mt-1'
const btnPri = 'flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold active:opacity-80 disabled:opacity-40 transition-opacity'
const btnSec = 'flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold active:opacity-80'
const btnSm  = 'px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold active:opacity-80'
const btnSmDanger = 'px-3 py-1.5 rounded-lg bg-rose-50 text-rose-500 text-xs font-bold active:opacity-80'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-semibold">{label}</p>
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-center text-sm text-gray-400 py-8">{text}</p>
}
