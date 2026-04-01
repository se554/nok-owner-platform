import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ChatInterface from '@/components/chat/ChatInterface'

interface Props {
  params: Promise<{ propertyId: string }>
}

export default async function ChatPage({ params }: Props) {
  const { propertyId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = createServiceClient()

  const { data: owner } = await serviceSupabase
    .from('owners')
    .select('id, name')
    .eq('supabase_user_id', user.id)
    .single()

  if (!owner) redirect('/login')

  const { data: property } = await serviceSupabase
    .from('properties')
    .select('id, name, city')
    .eq('id', propertyId)
    .eq('owner_id', owner.id)
    .single()

  if (!property) notFound()

  // Load last 20 chat messages for this property
  const { data: history } = await serviceSupabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('property_id', propertyId)
    .eq('owner_id', owner.id)
    .order('created_at', { ascending: true })
    .limit(20)

  const initialMessages = (history ?? []).map(m => ({
    id: crypto.randomUUID(),
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✦</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Asistente NOK</h1>
            <p className="text-xs text-gray-400">{property.name}</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
            En línea
          </span>
        </div>
      </div>

      {/* Chat */}
      <ChatInterface
        propertyId={propertyId}
        ownerName={owner.name}
        initialMessages={initialMessages}
      />
    </div>
  )
}
