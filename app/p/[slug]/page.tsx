import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Background, CanvasElement } from '@/types'
import QuestionCard from '@/components/QuestionCard'

interface Props {
  params: Promise<{ slug: string }>
}

function getBackgroundStyle(bg: Background): React.CSSProperties {
  if (bg.type === 'solid') return { backgroundColor: bg.color }
  return { background: `linear-gradient(${bg.direction}, ${bg.from}, ${bg.to})` }
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!profile) notFound()

  const { data: elements } = await supabase
    .from('elements')
    .select('*')
    .eq('profile_id', profile.id)
    .order('z_index')

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold text-gray-600">{profile.title}</h1>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl shadow-2xl"
        style={{ width: 390, height: 690, ...getBackgroundStyle(profile.background) }}
      >
        {(elements ?? []).map((el: CanvasElement) => (
          <div
            key={el.id}
            className="absolute"
            style={{
              left: el.position.x,
              top: el.position.y,
              transform: `rotate(${el.transform.rotation}deg) scale(${el.transform.scale})`,
              transformOrigin: 'center center',
              zIndex: el.z_index,
            }}
          >
            {el.type === 'sticker' && (
              <span style={{ fontSize: 56, lineHeight: 1 }}>
                {(el.content as { emoji: string }).emoji}
              </span>
            )}
            {el.type === 'question' && (
              <QuestionCard
                question={(el.content as { question: string; answer: string }).question}
                answer={(el.content as { question: string; answer: string }).answer}
                style={el.style}
              />
            )}
            {el.type === 'text' && (
              <span
                className="text-white font-bold text-xl"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}
              >
                {(el.content as { text: string }).text}
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        ともだちプロフィール帳 で作られました ✨
      </p>
    </main>
  )
}
