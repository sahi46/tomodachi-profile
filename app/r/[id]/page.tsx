import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProfileCanvas from '@/components/ProfileCanvas'
import { CanvasElement } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ResponseViewPage({ params }: Props) {
  const { id } = await params

  const { data: response } = await supabase
    .from('responses').select('*').eq('id', id).single()
  if (!response) notFound()

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', response.profile_id).single()
  if (!profile) notFound()

  const { data: elements } = await supabase
    .from('elements').select('*').eq('profile_id', profile.id).order('z_index')

  const answers = response.answers as Record<string, unknown>

  // 回答を要素に反映
  const answeredElements: CanvasElement[] = (elements ?? []).map((el: CanvasElement) => {
    if (el.type === 'question') {
      return { ...el, content: { ...(el.content as { question: string; answer: string }), answer: (answers[el.id] as string) ?? '' } }
    }
    if (el.type === 'template_card') {
      return { ...el, content: { ...(el.content as { templateId: string; answers: Record<string, string> }), answers: (answers[el.id] as Record<string, string>) ?? {} } }
    }
    return el
  })

  const fmtDate = (s: string) => {
    const d = new Date(s)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="pt-safe px-4 pt-4 pb-2">
        <p className="text-white/40 text-xs text-center">
          {profile.title} · {fmtDate(response.created_at)} に届いた回答
        </p>
      </div>

      <ProfileCanvas
        background={profile.background}
        elements={answeredElements}
        editMode={false}
      />

      <p className="text-center text-white/15 text-xs py-6">ともプロ</p>
    </main>
  )
}
