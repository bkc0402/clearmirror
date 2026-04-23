import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const roleRedirect: Record<string, string> = {
    teacher: '/dashboard',
    admin: '/admin/students',
    student: '/dashboard',
    parent: '/dashboard',
  }

  redirect(roleRedirect[profile?.role ?? 'student'] ?? '/dashboard')
}
