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

const TOOLS: { type: VCEType; label: string; svg: React.ReactNode }[] = [
  {
    type: 'label',
    label: 'テキスト',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>,
  },
  {
    type: 'field',
    label: '入力欄',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h.01M7 12h10M7 15h6"/></svg>,
  },
  {
    type: 'rect',
    label: '図形',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>,
  },
  {
    type: 'line',
    label: '線',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18"/></svg>,
  },
]

const BG_COLORS = ['#ffffff', '#fff0f5', '#fdf4ff', '#fffbeb', '#f0fdf4', '#eff6ff', '#fff7ed', '#f8fafc']

function ColorSwatch({ color, selected, onSelect }: { color: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
        backgroundColor: color === 'transparent' || color === 'none' ? undefined : color,
        backgroundImage: color === 'transparent' || color === 'none'
          ? 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%), linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%)'
          : undefined,
        backgroundSize: color === 'transparent' || color === 'none' ? '8px 8px' : undefined,
        backgroundPosition: color === 'transparent' || color === 'none' ? '0 0, 4px 4px' : undefined,
        border: selected ? '2px solid #6366f1' : '1.5px solid #e5e7eb',
        boxShadow: selected ? '0 0 0 1px #6366f1' : undefined,
        cursor: 'pointer',
      }}
      className="active:scale-90 transition-transform"
    />
  )
}

function PropertyPanel({
  el, onUpdate, onDelete,
}: {
  el: VCardElement
  onUpdate: (patch: Partial<VCardElement>) => void
  onDelete: () => void
}) {
  const Section = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-2 flex-wrap">{children}</div>
  )

  const NumBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold active:bg-gray-200 transition-colors"
    >
      {label}
    </button>
  )

  const Toggle = ({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
      style={{ backgroundColor: active ? '#1f2937' : '#f3f4f6', color: active ? 'white' : '#374151' }}
    >
      {label}
    </button>
  )

  return (
    <div className="px-4 py-3 space-y-3 overflow-y-auto" style={{ maxHeight: 260 }}>

      {/* Text / Label */}
      {(el.type === 'label' || el.type === 'field') && (
        <div>
          <p className="text-[10px] text-gray-400 font-semibold mb-1.5">
            {el.type === 'label' ? 'テキスト内容' : 'ラベル（質問文）'}
          </p>
          <input
            value={el.text}
            onChange={e => onUpdate({ text: e.target.value })}
            placeholder={el.type === 'label' ? 'テキスト' : '例: 名前'}
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-300 transition-colors"
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
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-300 transition-colors"
          />
        </div>
      )}

      {/* Size */}
      <div>
        <p className="text-[10px] text-gray-400 font-semibold mb-1.5">サイズ</p>
        <Section>
          <NumBtn label="幅 −" onClick={() => onUpdate({ w: Math.max(20, el.w - 10) })} />
          <NumBtn label="幅 +" onClick={() => onUpdate({ w: Math.min(CARD_W - el.x, el.w + 10) })} />
          {el.type !== 'line' && (
            <>
              <NumBtn label="高 −" onClick={() => onUpdate({ h: Math.max(16, el.h - 10) })} />
              <NumBtn label="高 +" onClick={() => onUpdate({ h: el.h + 10 }) } />
            </>
          )}
          {el.type === 'line' && (
            <>
              <Toggle label="横線" active={el.rot === 0} onToggle={() => onUpdate({ rot: 0 })} />
              <Toggle label="縦線" active={el.rot === 90} onToggle={() => onUpdate({ rot: 90 })} />
            </>
          )}
        </Section>
      </div>

      {/* Fill color */}
      {(el.type === 'rect' || el.type === 'field') && (
        <div>
          <p className="text-[10px] text-gray-400 font-semibold mb-1.5">塗りつぶし</p>
          <div className="flex gap-1.5 flex-wrap">
            {COLOR_PALETTE.map(c => (
              <ColorSwatch key={c} color={c} selected={el.fill === c} onSelect={() => onUpdate({ fill: c })} />
            ))}
          </div>
        </div>
      )}

      {/* Stroke color */}
      {el.type !== 'label' && (
        <div>
          <p className="text-[10px] text-gray-400 font-semibold mb-1.5">線の色</p>
          <div className="flex gap-1.5 flex-wrap">
            {COLOR_PALETTE.slice(1).map(c => (
              <ColorSwatch key={c} color={c} selected={el.stroke === c} onSelect={() => onUpdate({ stroke: c })} />
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <NumBtn label="太さ −" onClick={() => onUpdate({ strokeW: Math.max(0.5, el.strokeW - 0.5) })} />
            <NumBtn label="太さ +" onClick={() => onUpdate({ strokeW: el.strokeW + 0.5 })} />
            <Toggle label="点線" active={el.dash} onToggle={() => onUpdate({ dash: !el.dash })} />
          </div>
        </div>
      )}

      {/* Text color / size */}
      {(el.type === 'label' || el.type === 'field') && (
        <div>
          <p className="text-[10px] text-gray-400 font-semibold mb-1.5">文字</p>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {['#111827','#374151','#6b7280','#f472b6','#a855f7','#3b82f6','#10b981','#f59e0b','#f97316','#ffffff'].map(c => (
              <ColorSwatch key={c} color={c} selected={el.color === c} onSelect={() => onUpdate({ color: c })} />
            ))}
          </div>
          <Section>
            <NumBtn label="小" onClick={() => onUpdate({ fontSize: Math.max(8, el.fontSize - 1) })} />
            <NumBtn label="大" onClick={() => onUpdate({ fontSize: el.fontSize + 1 })} />
            <Toggle label="太字" active={el.fontBold} onToggle={() => onUpdate({ fontBold: !el.fontBold })} />
            {el.type === 'label' && (
              <>
                <Toggle label="左" active={el.align === 'left'} onToggle={() => onUpdate({ align: 'left' })} />
                <Toggle label="中" active={el.align === 'center'} onToggle={() => onUpdate({ align: 'center' })} />
                <Toggle label="右" active={el.align === 'right'} onToggle={() => onUpdate({ align: 'right' })} />
              </>
            )}
          </Section>
        </div>
      )}

      {/* Delete */}
      <button
        onClick={onDelete}
        className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-500 text-sm font-bold active:bg-rose-100 transition-colors"
      >
        削除
      </button>
    </div>
  )
}

function CardEditorInner() {
  const router = useRouter()
  const params = useSearchParams()
  const templateId = params.get('id')

  const [template, setTemplate] = useState<VCardTemplate>({
    id: uuidv4(),
    title: 'マイカード',
    bg: '#ffffff',
    elements: [],
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bgPickerOpen, setBgPickerOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (templateId) {
      const all = getVisualTemplates()
      const found = all.find(t => t.id === templateId)
      if (found) setTemplate(found)
    }
  }, [templateId])

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth - 32
        setScale(Math.min(w / CARD_W, 1.6))
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const selectedEl = template.elements.find(e => e.id === selectedId) ?? null

  const addElement = (type: VCEType) => {
    const el = newElement(type, uuidv4())
    // Offset position to avoid stacking
    const offset = template.elements.length * 6
    el.x = Math.min(el.x + offset, CARD_W - el.w - 10)
    el.y = Math.min(el.y + offset + 30, 200)
    setTemplate(t => ({ ...t, elements: [...t.elements, el] }))
    setSelectedId(el.id)
  }

  const updateEl = useCallback((id: string, patch: Partial<VCardElement>) => {
    setTemplate(t => ({
      ...t,
      elements: t.elements.map(e => e.id === id ? { ...e, ...patch } : e),
    }))
  }, [])

  const onMove = useCallback((id: string, x: number, y: number) => {
    updateEl(id, { x, y })
  }, [updateEl])

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

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      {/* Top bar */}
      <div className="pt-safe shrink-0 bg-black/90 backdrop-blur-md border-b border-white/8">
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-90 transition-transform shrink-0"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          <input
            value={template.title}
            onChange={e => setTemplate(t => ({ ...t, title: e.target.value }))}
            className="flex-1 min-w-0 bg-transparent text-white font-bold text-sm outline-none placeholder:text-white/30"
            placeholder="カードのタイトル"
          />

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

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto relative"
        style={{ touchAction: selectedId ? 'none' : 'pan-y' }}
        onClick={e => { if (e.target === e.currentTarget) setSelectedId(null) }}
      >
        {/* Bg color button */}
        <div className="absolute top-3 left-4 z-10">
          <button
            onClick={() => setBgPickerOpen(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-bold active:scale-90 transition-transform"
          >
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, backgroundColor: template.bg, border: '1px solid rgba(255,255,255,0.3)' }} />
            背景
          </button>
          {bgPickerOpen && (
            <div className="mt-2 p-2 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl flex gap-1.5 flex-wrap" style={{ width: 176 }}>
              {BG_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => { setTemplate(t => ({ ...t, bg: c })); setBgPickerOpen(false) }}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: c,
                    border: template.bg === c ? '2px solid #6366f1' : '1.5px solid #e5e7eb',
                  }}
                  className="active:scale-90 transition-transform"
                />
              ))}
            </div>
          )}
        </div>

        {/* Right tools */}
        <div className="absolute top-3 right-4 z-10 flex flex-col gap-2">
          {TOOLS.map(tool => (
            <button
              key={tool.type}
              onClick={() => addElement(tool.type)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white active:scale-90 transition-transform"
              title={tool.label}
            >
              {tool.svg}
            </button>
          ))}
        </div>

        {/* Card canvas */}
        <div className="flex justify-center py-8 px-4">
          <div style={{ width: CARD_W * scale, height: 'auto' }}>
            <VisualCard
              template={template}
              answers={{}}
              scale={scale}
              editMode
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={onMove}
            />
          </div>
        </div>
      </div>

      {/* Property panel */}
      {selectedEl ? (
        <div className="shrink-0 border-t border-gray-200 bg-white">
          <div className="flex justify-between items-center px-4 pt-2 pb-1">
            <p className="text-xs font-bold text-gray-500 capitalize">
              {{ label: 'テキスト', field: '入力欄', rect: '図形', line: '線' }[selectedEl.type]}
            </p>
            <button onClick={() => setSelectedId(null)} className="text-gray-400 text-lg leading-none active:text-gray-600">×</button>
          </div>
          <PropertyPanel
            el={selectedEl}
            onUpdate={patch => updateEl(selectedEl.id, patch)}
            onDelete={deleteEl}
          />
        </div>
      ) : (
        <div className="shrink-0 border-t border-gray-800/50 bg-black/80 px-4 py-3">
          <div className="flex gap-2 justify-center">
            {TOOLS.map(tool => (
              <button
                key={tool.type}
                onClick={() => addElement(tool.type)}
                className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl bg-white/10 text-white active:bg-white/20 transition-colors"
              >
                {tool.svg}
                <span className="text-[9px] font-semibold">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CardEditorPage() {
  return (
    <Suspense>
      <CardEditorInner />
    </Suspense>
  )
}
