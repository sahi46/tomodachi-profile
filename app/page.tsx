'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const createProfile = async () => {
    setLoading(true)
    const slug = uuidv4().slice(0, 8)
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        slug,
        title: 'わたしのプロフィール',
        background: { type: 'gradient', from: '#ffb3d1', to: '#c4b5fd', direction: '135deg' },
      })
      .select()
      .single()

    if (error || !data) {
      alert('エラーが発生しました')
      setLoading(false)
      return
    }
    router.push(`/edit/${data.id}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-white">
      {/* 背景デコ */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-pink-100 opacity-60" />
        <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full bg-purple-100 opacity-60" />
        <div className="absolute top-1/2 left-[-40px] w-40 h-40 rounded-full bg-yellow-100 opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center max-w-sm w-full">
        {/* ロゴ */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center shadow-xl shadow-pink-200">
            <span className="text-4xl">📖</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">ともプロ</h1>
            <p className="text-sm text-gray-400 mt-1">ともだちプロフィール帳</p>
          </div>
        </div>

        {/* プレビューカード */}
        <div className="w-full bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-5 border border-pink-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-lg">✏️</div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-700">自由にデコれる</p>
              <p className="text-xs text-gray-400">スタンプ・質問カードを好きな場所に</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-300 flex items-center justify-center text-lg">🔗</div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-700">URLで共有</p>
              <p className="text-xs text-gray-400">リンクを送るだけで友達が見れる</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-300 to-blue-300 flex items-center justify-center text-lg">💌</div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-700">友達に送れる</p>
              <p className="text-xs text-gray-400">LINE・Instagramでシェアしよう</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={createProfile}
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-pink-200 active:scale-95 transition-all duration-150 disabled:opacity-70"
        >
          {loading ? '作成中...' : 'プロフィール帳を作る ✨'}
        </button>

        <p className="text-xs text-gray-300">無料・登録不要</p>
      </div>
    </main>
  )
}
