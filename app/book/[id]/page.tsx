import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BookReader from '@/components/BookReader'
import { CanvasElement } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BookPage({ params }: Props) {
  const { id } = await params

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', id).single()
  if (!profile) notFound()

  const [{ data: elements }, { data: responses }] = await Promise.all([
    supabase.from('elements').select('*').eq('profile_id', id).order('z_index'),
    supabase.from('responses').select('*').eq('profile_id', id).order('created_at', { ascending: false }),
  ])

  return (
    <BookReader
      profile={profile}
      elements={(elements ?? []) as CanvasElement[]}
      responses={responses ?? []}
    />
  )
}
