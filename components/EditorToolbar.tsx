'use client'

import { useState } from 'react'
import { Background } from '@/types'

const EMOJI_LIST = ['😊', '🌸', '⭐', '💕', '🎀', '🌈', '🍓', '🐱', '🌙', '💫', '🦋', '🍀', '🎵', '💖', '🌺', '🐰', '✨', '🎠', '🍡', '🌻']

const QUESTION_PRESETS = [
  { question: '名前', design: 'pink' },
  { question: '誕生日', design: 'purple' },
  { question: '好きな食べ物', design: 'mint' },
  { question: '趣味', design: 'yellow' },
  { question: '好きな色', design: 'pink' },
  { question: '好きな音楽', design: 'purple' },
  { question: '将来の夢', design: 'mint' },
  { question: 'ひとことメッセージ', design: 'yellow' },
]

const GRADIENTS = [
  { from: '#FFB6C1', to: '#FFD1DC', direction: '135deg', label: 'ピンク' },
  { from: '#C8A2C8', to: '#E8C8E8', direction: '135deg', label: 'ラベンダー' },
  { from: '#B0E0E6', to: '#87CEEB', direction: '135deg', label: 'スカイ' },
  { from: '#98FB98', to: '#C8FFC8', direction: '135deg', label: 'ミント' },
  { from: '#FFE4B5', to: '#FFDAB9', direction: '135deg', label: 'ピーチ' },
  { from: '#DDA0DD', to: '#EE82EE', direction: '135deg', label: 'パープル' },
]

const SOLID_COLORS = ['#FFB6C1', '#C8A2C8', '#B0E0E6', '#98FB98', '#FFE4B5', '#FFEAA7', '#FD79A8', '#A29BFE']

interface Props {
  background: Background
  onAddSticker: (emoji: string) => void
  onAddQuestion: (question: string, design: string) => void
  onBackgroundChange: (bg: Background) => void
  onDeleteSelected: () => void
  hasSelected: boolean
  onShare: () => void
}

type Tab = 'sticker' | 'question' | 'background'

export default function EditorToolbar({
  background,
  onAddSticker,
  onAddQuestion,
  onBackgroundChange,
  onDeleteSelected,
  hasSelected,
  onShare,
}: Props) {
  const [tab, setTab] = useState<Tab>('sticker')
  const [customQuestion, setCustomQuestion] = useState('')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'sticker', label: '✨ スタンプ' },
    { key: 'question', label: '💬 質問' },
    { key: 'background', label: '🎨 背景' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
        <span className="font-bold text-gray-700">デコる</span>
        <div className="flex gap-2">
          {hasSelected && (
            <button
              onClick={onDeleteSelected}
              className="bg-red-100 text-red-500 text-xs font-bold py-1 px-3 rounded-full hover:bg-red-200 transition"
            >
              削除
            </button>
          )}
          <button
            onClick={onShare}
            className="bg-pink-400 text-white text-xs font-bold py-1 px-4 rounded-full hover:bg-pink-500 transition"
          >
            シェア 🔗
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-xs py-2 font-semibold transition ${
              tab === t.key ? 'text-pink-500 border-b-2 border-pink-400' : 'text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'sticker' && (
          <div className="grid grid-cols-5 gap-3">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onAddSticker(emoji)}
                className="text-3xl hover:scale-125 transition-transform active:scale-95 h-12 w-12 flex items-center justify-center rounded-xl hover:bg-pink-50"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {tab === 'question' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="質問を入力..."
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                className="flex-1 text-sm border border-pink-200 rounded-xl px-3 py-2 outline-none focus:border-pink-400"
              />
              <button
                onClick={() => {
                  if (customQuestion.trim()) {
                    onAddQuestion(customQuestion.trim(), 'pink')
                    setCustomQuestion('')
                  }
                }}
                className="bg-pink-400 text-white text-sm font-bold px-3 py-2 rounded-xl hover:bg-pink-500"
              >
                追加
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-semibold">よく使う質問</p>
              {QUESTION_PRESETS.map((q) => (
                <button
                  key={q.question}
                  onClick={() => onAddQuestion(q.question, q.design)}
                  className="w-full text-left text-sm bg-white border border-gray-100 rounded-xl px-4 py-2 hover:border-pink-300 hover:bg-pink-50 transition"
                >
                  {q.question}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'background' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-2">グラデーション</p>
              <div className="grid grid-cols-3 gap-2">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => onBackgroundChange({ type: 'gradient', from: g.from, to: g.to, direction: g.direction })}
                    className="h-14 rounded-xl shadow-sm hover:scale-105 transition-transform"
                    style={{ background: `linear-gradient(${g.direction}, ${g.from}, ${g.to})` }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-2">単色</p>
              <div className="grid grid-cols-4 gap-2">
                {SOLID_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onBackgroundChange({ type: 'solid', color: c })}
                    className="h-10 rounded-xl shadow-sm hover:scale-105 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
