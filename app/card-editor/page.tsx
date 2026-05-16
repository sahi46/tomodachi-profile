'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  VCardTemplate, VCardElement, VCEType, CARD_W,
  newElement, COLOR_PALETTE, getVisualTemplates, saveVisualTemplates,
} from '@/lib/visual-card'
import VisualCard from '@/components/VisualCard'
import { v4 as uuidv4 } from 'uuid'

const ACCENT = '#d946ef'

// ── Property Tabs ─────────────────────────────────────────────────
type PropTab = 'content' | 'fill' | 'stroke' | 'text' | 'size'

const PROP_TABS: Record<VCEType, { key: PropTab; label: string }[]> = {
  label:  [{ key: 'content', label: 'テキスト' }, { key: 'text', label: '文字' }, { key: 'size', label: 'サイズ' }],
  field:  [{ key: 'content', label: '項目' }, { key: 'fill', label: '塗り' }, { key: 'stroke', label: '枠線' }, { key: 'size', label: 'サイズ' }],
  rect:   [{ key: 'fill', label: '塗り' }, { key: 'stroke', label: '線' }, { key: 'size', label: 'サイズ' }],
  line:   [{ key: 'stroke', label: '線' }, { key: 'size', label: 'サイズ' }],
}

const BG_COLORS = ['#ffffff', '#f8fafc', '#fff0f5', '#fdf4ff', '#fffbeb', '#f0fdf4', '#eff6ff', '#fff7ed', '#1a1a2e', '#111827']

function ColorSwatch({ color, selected, onSelect, size = 28 }: {
  color: string; selected: boolean; onSelect: () => void; size?: number
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: size, height: size, borderRadius: size / 3.5, flexShrink: 0,
        backgroundColor: color === 'transparent' || color === 'none' ? undefined : color,
        backgroundImage: color === 'transparent' || color === 'none'
          ? 'linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%)'
          : undefined,
        backgroundSize: color === 'transparent' || color === 'none' ? '8px 8px' : undefined,
        backgroundPosition: color === 'transparent' || color === 'none' ? '0 0,4px 4px' : undefined,
        border: selected ? '2.5px solid #6366f1' : '1.5px solid #e5e7eb',
        boxShadow: selected ? '0 0 0 1.5px #6366f1' : 'none',
        cursor: 'pointer',
        outline: 'none',
      }}
      className="active:scale-90 transition-transform"
    />
  )
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
      style={{
        backgroundColor: active ? '#1f2937' : '#f3f4f6',
        color: active ? 'white' : '#374151',
      }}
    >
      {label}
    </button>
  )
}

function NumRow({ onMinus, onPlus, label }: { onMinus: () => void; onPlus: () => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 flex-1">{label}</span>
      <button onClick={onMinus} className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 font-black text-base flex items-center justify-center active:bg-gray-200 transition-colors">−</button>
      <button onClick={onPlus}  className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 font-black text-base flex items-center justify-center active:bg-gray-200 transition-colors">＋</button>
    </div>
  )
}

// ── Property Drawer Content ────────────────────────────────────────
function PropContent({ el, tab, onUpdate }: {
  el: VCardElement
  tab: PropTab
  onUpdate: (p: Partial<VCardElement>) => void
}) {
  if (tab === 'content') {
    return (
      <div className="space-y-3 px-4 pb-4">
        {(el.type === 'label' || el.type === 'field') && (
          <div>
            <p className="text-[10px] text-gray-400 font-semibold mb-1.5">
              {el.type === 'label' ? 'テキスト内容' : 'ラベル（質問文）'}
            </p>
            <input
              value={el.text}
              onChange={e => onUpdate({ text: e.target.value })}
              placeholder={el.type === 'label' ? 'テキストを入力' : '例：名前、好きな食べ物'}
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-300 transition-colors"
            />
          </div>
        )}
        {el.type === 'field' && (
          <div>
            <p className="text-[10px] text-gray-400 font-semibold mb-1.5">プレースホルダー</p>
            <input
              value={el.placeholder}
              onChange={e => onUpdate({ placeholder: e.target.value })}
              placeholder="タップして入力"
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-300 transition-colors"
            />
          </div>
        )}
      </div>
    )
  }

  if (tab === 'fill') {
    return (
      <div className="px-4 pb-4">
        <p className="text-[10px] text-gray-400 font-semibold mb-2">塗りつぶし色</p>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PALETTE.map(c => (
            <ColorSwatch key={c} color={c} selected={el.fill === c} onSelect={() => onUpdate({ fill: c })} />
          ))}
        </div>
      </div>
    )
  }

  if (tab === 'stroke') {
    return (
      <div className="px-4 pb-4 space-y-3">
        <div>
          <p className="text-[10px] text-gray-400 font-semibold mb-2">線の色</p>
          <div className="flex gap-2 flex-wrap">
            {COLOR_PALETTE.slice(1).map(c => (
              <ColorSwatch key={c} color={c} selected={el.stroke === c} onSelect={() => onUpdate({ stroke: c })} />
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <NumRow label="太さ" onMinus={() => onUpdate({ strokeW: Math.max(0.5, el.strokeW - 0.5) })} onPlus={() => onUpdate({ strokeW: el.strokeW + 0.5 })} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Chip label="実線" active={!el.dash} onPress={() => onUpdate({ dash: false })} />
          <Chip label="点線" active={el.dash}  onPress={() => onUpdate({ dash: true })} />
          {el.type === 'line' && (
            <>
              <Chip label="横"   active={el.rot === 0}  onPress={() => onUpdate({ rot: 0 })} />
              <Chip label="縦"   active={el.rot === 90} onPress={() => onUpdate({ rot: 90 })} />
              <Chip label="斜め" active={el.rot === 45} onPress={() => onUpdate({ rot: 45 })} />
            </>
          )}
        </div>
      </div>
    )
  }

  if (tab === 'text') {
    const TEXT_COLORS = ['#111827','#374151','#6b7280','#9ca3af','#ffffff','#f472b6','#a855f7','#3b82f6','#10b981','#f59e0b','#f97316']
    return (
      <div className="px-4 pb-4 space-y-3">
        <div>
          <p className="text-[10px] text-gray-400 font-semibold mb-2">文字色</p>
          <div className="flex gap-2 flex-wrap">
            {TEXT_COLORS.map(c => (
              <ColorSwatch key={c} color={c} selected={el.color === c} onSelect={() => onUpdate({ color: c })} />
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Chip label="細字"   active={!el.fontBold}            onPress={() => onUpdate({ fontBold: false })} />
          <Chip label="太字"   active={el.fontBold}             onPress={() => onUpdate({ fontBold: true })} />
          {el.type === 'label' && (
            <>
              <Chip label="左揃え" active={el.align === 'left'}   onPress={() => onUpdate({ align: 'left' })} />
              <Chip label="中央"   active={el.align === 'center'} onPress={() => onUpdate({ align: 'center' })} />
              <Chip label="右揃え" active={el.align === 'right'}  onPress={() => onUpdate({ align: 'right' })} />
            </>
          )}
        </div>
        <NumRow label="文字サイズ" onMinus={() => onUpdate({ fontSize: Math.max(7, el.fontSize - 1) })} onPlus={() => onUpdate({ fontSize: el.fontSize + 1 })} />
      </div>
    )
  }

  if (tab === 'size') {
    return (
      <div className="px-4 pb-4 space-y-3">
        <NumRow label="幅" onMinus={() => onUpdate({ w: Math.max(20, el.w - 10) })} onPlus={() => onUpdate({ w: Math.min(CARD_W - el.x, el.w + 10) })} />
        {el.type !== 'line' && (
          <NumRow label="高さ" onMinus={() => onUpdate({ h: Math.max(12, el.h - 8) })} onPlus={() => onUpdate({ h: el.h + 8 })} />
        )}
        <NumRow label="X 位置" onMinus={() => onUpdate({ x: Math.max(0, el.x - 8) })} onPlus={() => onUpdate({ x: Math.min(CARD_W - el.w, el.x + 8) })} />
        <NumRow label="Y 位置" onMinus={() => onUpdate({ y: Math.max(0, el.y - 8) })} onPlus={() => onUpdate({ y: el.y + 8 })} />
      </div>
    )
  }

  return null
}

// ── Main Editor ────────────────────────────────────────────────────
function CardEditorInner() {
  const router     = useRouter()
  const params     = useSearchParams()
  const templateId = params.get('id')

  const [template, setTemplate] = useState<VCardTemplate>({
    id: uuidv4(), title: 'マイカード', bg: '#ffffff', elements: [],
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [propTab, setPropTab]       = useState<PropTab>('content')
  const [saved, setSaved]           = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale]           = useState(1)

  useEffect(() => {
    if (templateId) {
      const found = getVisualTemplates().find(t => t.id === templateId)
      if (found) setTemplate(found)
    }
  }, [templateId])

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth - 48
        setScale(Math.min(w / CARD_W, 1.8))
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const selectedEl = template.elements.find(e => e.id === selectedId) ?? null

  // Reset tab when switching elements
  useEffect(() => {
    if (selectedEl) {
      const tabs = PROP_TABS[selectedEl.type]
      if (!tabs.find(t => t.key === propTab)) setPropTab(tabs[0].key)
    }
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  const addElement = (type: VCEType, overrides?: Partial<VCardElement>) => {
    const el = { ...newElement(type, uuidv4()), ...overrides }
    const offset = template.elements.length * 8
    el.x = Math.min(el.x + (offset % 40), CARD_W - el.w - 4)
    el.y = Math.min(el.y + offset, 180)
    setTemplate(t => ({ ...t, elements: [...t.elements, el] }))
    setSelectedId(el.id)
    const tabs = PROP_TABS[type]
    setPropTab(tabs[0].key)
  }

  const updateEl = useCallback((id: string, patch: Partial<VCardElement>) => {
    setTemplate(t => ({ ...t, elements: t.elements.map(e => e.id === id ? { ...e, ...patch } : e) }))
  }, [])

  const deleteEl = () => {
    if (!selectedId) return
    setTemplate(t => ({ ...t, elements: t.elements.filter(e => e.id !== selectedId) }))
    setSelectedId(null)
  }

  const handleSave = () => {
    const all = getVisualTemplates()
    const idx = all.findIndex(t => t.id === template.id)
    if (idx >= 0) all[idx] = template
    else all.unshift(template)
    saveVisualTemplates(all)
    setSaved(true)
    setTimeout(() => router.back(), 700)
  }

  const cardH = template.elements.reduce(
    (max, el) => Math.max(max, el.y + (el.type === 'line' ? el.strokeW : el.h) + 20), 160
  )

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#f1f5f9' }}>

      {/* ── Top bar ── */}
      <div className="pt-safe shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 active:scale-90 transition-transform shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
          <input
            value={template.title}
            onChange={e => setTemplate(t => ({ ...t, title: e.target.value }))}
            className="flex-1 min-w-0 bg-transparent text-gray-900 font-bold text-sm outline-none placeholder:text-gray-300"
            placeholder="カードのタイトル"
          />
          <button
            onClick={handleSave}
            disabled={saved}
            className="px-5 py-2 rounded-full text-white text-sm font-black active:scale-95 transition-all shrink-0"
            style={{
              backgroundColor: saved ? '#10b981' : ACCENT,
              boxShadow: saved ? '0 4px 12px #10b98155' : `0 4px 12px ${ACCENT}44`,
            }}
          >
            {saved ? '✓' : '保存'}
          </button>
        </div>
      </div>

      {/* ── Canvas (board) ── */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        style={{ touchAction: selectedEl ? 'none' : 'pan-y' }}
        onClick={e => { if (e.target === e.currentTarget) setSelectedId(null) }}
      >
        {/* dot grid bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative flex justify-center py-10 px-6">
          {/* Card shadow wrapper */}
          <div
            style={{
              width: CARD_W * scale,
              height: cardH * scale,
              borderRadius: 16 * scale,
              boxShadow: '0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.08)',
              flexShrink: 0,
            }}
            onClick={e => e.stopPropagation()}
          >
            <VisualCard
              template={template}
              answers={{}}
              scale={scale}
              editMode
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={(id, x, y) => updateEl(id, { x, y })}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom Panel ── */}
      <div
        className="shrink-0 bg-white"
        style={{ borderTop: '1px solid #e2e8f0', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
      >
        {selectedEl ? (
          /* ── PROPERTY DRAWER ── */
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
              <span className="text-sm font-black text-gray-800 flex-1">
                {{ label: 'テキスト', field: '入力欄', rect: '図形', line: '線' }[selectedEl.type]}
              </span>
              <button
                onClick={deleteEl}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-500 text-xs font-bold active:bg-rose-100 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M9 6V4h6v2"/>
                </svg>
                削除
              </button>
              <button
                onClick={() => setSelectedId(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors text-base font-bold"
              >
                ×
              </button>
            </div>

            {/* Tab strip */}
            <div className="flex gap-1 px-3 pt-2 pb-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {PROP_TABS[selectedEl.type].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setPropTab(tab.key)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95"
                  style={{
                    backgroundColor: propTab === tab.key ? ACCENT : '#f3f4f6',
                    color: propTab === tab.key ? 'white' : '#6b7280',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="overflow-y-auto" style={{ maxHeight: 180 }}>
              <PropContent
                el={selectedEl}
                tab={propTab}
                onUpdate={p => updateEl(selectedEl.id, p)}
              />
            </div>
          </div>
        ) : (
          /* ── TOOL GROUPS ── */
          <div className="px-4 pt-3 pb-safe-or-3 space-y-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>

            {/* Background */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 shrink-0 w-8">背景</span>
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {BG_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setTemplate(t => ({ ...t, bg: c }))}
                    style={{
                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                      backgroundColor: c,
                      border: template.bg === c ? '2.5px solid #6366f1' : '1.5px solid #e5e7eb',
                      boxShadow: template.bg === c ? '0 0 0 1.5px #6366f1' : 'none',
                    }}
                    className="active:scale-90 transition-transform"
                  />
                ))}
              </div>
            </div>

            {/* テキスト / 入力欄 */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 shrink-0 w-8">文字</span>
              <div className="flex gap-2">
                <ToolBtn
                  label="テキスト"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>}
                  onPress={() => addElement('label')}
                />
                <ToolBtn
                  label="入力欄"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 12h10M7 9h4"/></svg>}
                  onPress={() => addElement('field')}
                />
              </div>
            </div>

            {/* 図形 */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 shrink-0 w-8">図形</span>
              <div className="flex gap-2">
                <ToolBtn
                  label="塗り"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>}
                  onPress={() => addElement('rect', { fill: '#fce7f3', stroke: '#f9a8d4' })}
                />
                <ToolBtn
                  label="枠線"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>}
                  onPress={() => addElement('rect', { fill: 'transparent', stroke: '#9ca3af' })}
                />
                <ToolBtn
                  label="点線枠"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>}
                  onPress={() => addElement('rect', { fill: 'transparent', stroke: '#9ca3af', dash: true })}
                />
              </div>
            </div>

            {/* 線 */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 shrink-0 w-8">線</span>
              <div className="flex gap-2">
                <ToolBtn
                  label="横"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12h18"/></svg>}
                  onPress={() => addElement('line', { rot: 0, dash: false })}
                />
                <ToolBtn
                  label="縦"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 3v18"/></svg>}
                  onPress={() => addElement('line', { rot: 90, dash: false })}
                />
                <ToolBtn
                  label="斜め"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 19L19 5"/></svg>}
                  onPress={() => addElement('line', { rot: 45, dash: false })}
                />
                <ToolBtn
                  label="点線"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 2"><path d="M3 12h18"/></svg>}
                  onPress={() => addElement('line', { rot: 0, dash: true })}
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

// Small tool button
function ToolBtn({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl bg-gray-50 active:bg-gray-100 active:scale-95 transition-all"
      style={{ minWidth: 52 }}
    >
      {icon}
      <span className="text-[9px] font-bold text-gray-500">{label}</span>
    </button>
  )
}

export default function CardEditorPage() {
  return (
    <Suspense>
      <CardEditorInner />
    </Suspense>
  )
}
