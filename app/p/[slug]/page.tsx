import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProfileCanvas from '@/components/ProfileCanvas'

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

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-sm space-y-5">
        <h1 className="text-center text-white/50 text-sm font-semibold tracking-widest uppercase">
          {profile.title}
        </h1>
        <ProfileCanvas
          background={profile.background}
          elements={elements ?? []}
          editMode={false}
        />
        <p className="text-center text-white/15 text-xs pb-6">ともプロ</p>
      </div>
    </main>
  )
}
