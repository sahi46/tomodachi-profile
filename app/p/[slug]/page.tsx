import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProfileCanvas from '@/components/ProfileCanvas'

interface Props {
  params: Promise<{ slug: string }>
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
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-start py-8 px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-white/80 font-bold text-base tracking-wide">{profile.title}</h1>
        </div>

        <ProfileCanvas
          background={profile.background}
          elements={elements ?? []}
          editMode={false}
        />

        <p className="text-center text-white/20 text-xs pb-4">
          ともプロ で作られました
        </p>
      </div>
    </main>
  )
}
