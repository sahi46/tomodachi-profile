import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AnswerCanvas from '@/components/AnswerCanvas'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('slug', slug).single()

  if (!profile) notFound()

  const { data: elements } = await supabase
    .from('elements').select('*').eq('profile_id', profile.id).order('z_index')

  return <AnswerCanvas profile={profile} elements={elements ?? []} />
}
