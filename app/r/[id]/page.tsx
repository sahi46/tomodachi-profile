import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProfileCanvas from '@/components/ProfileCanvas'
import { CanvasElement } from '@/types'
import { AnswerElementData } from '@/components/AnswerCanvas'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  params: Promise<{ id: string }>
}

function buildAnswerElements(answers: Record<string, unknown>): CanvasElement[] {
  // v2 format
  if (answers.v === 2) {
    const els = (answers.answerElements ?? []) as AnswerElementData[]
    return els.map(a => ({
      id: a.id,
      profile_id: '',
      type: 'answer_text' as const,
      content: { text: a.text, questionId: a.questionId },
      style: { color: a.color, fontSize: String(a.fontSize), fontBold: String(a.fontBold) },
      position: { xPct: a.xPct, yPct: a.yPct },
      transform: { rotation: a.rotation, scale: a.scale },
      z_index: 50,
    }))
  }

  // v1 legacy: inject answers back into question elements (handled at call site)
  return []
}

function applyLegacyAnswers(elements: CanvasElement[], answers: Record<string, unknown>): CanvasElement[] {
  return elements.map(el => {
    if (el.type === 'question') {
      return { ...el, content: { ...(el.content as { question: string; answer: string }), answer: (answers[el.id] as string) ?? '' } }
    }
    if (el.type === 'template_card') {
      return { ...el, content: { ...(el.content as { templateId: string; answers: Record<string, string> }), answers: (answers[el.id] as Record<string, string>) ?? {} } }
    }
    return el
  })
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
  const isV2 = answers.v === 2

  const templateEls = isV2
    ? (elements ?? []) as CanvasElement[]
    : applyLegacyAnswers((elements ?? []) as CanvasElement[], answers)

  const answerEls = buildAnswerElements(answers)
  const allElements = [...templateEls, ...answerEls]

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
        elements={allElements}
        editMode={false}
      />

      <p className="text-center text-white/15 text-xs py-6">ともプロ</p>
    </main>
  )
}
