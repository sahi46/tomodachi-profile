'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const router = useRouter()

  const createProfile = async () => {
    const slug = uuidv4().slice(0, 8)

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        slug,
        title: 'わたしのプロフィール',
        background: { type: 'gradient', from: '#FFB6C1', to: '#FFD1DC', direction: '135deg' },
      })
      .select()
      .single()

    if (error) {
      alert('エラーが発生しました: ' + error.message)
      return
    }

    router.push(`/edit/${data.id}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      <div className="text-center space-y-8 px-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-pink-400 tracking-wide">
            ともだちプロフィール帳
          </h1>
          <p className="text-gray-500 text-lg">
            自分だけのプロフィール帳を作って友達に送ろう
          </p>
        </div>

        <div className="flex flex-col gap-3 items-center text-sm text-gray-400">
          <span>✏️ 自由にデコれる</span>
          <span>🔗 URLで共有できる</span>
          <span>💌 友達に送れる</span>
        </div>

        <button
          onClick={createProfile}
          className="bg-pink-400 hover:bg-pink-500 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          プロフィール帳を作る ✨
        </button>
      </div>
    </main>
  )
}
