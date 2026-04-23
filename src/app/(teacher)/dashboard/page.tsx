import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 서버에서 직접 데이터 조회 (세션 확실히 있음)
  const [{ data: students }, { data: textbooks }] = await Promise.all([
    supabase.from('students').select('*').neq('status', '완료').neq('status', '중단').order('lesson_time'),
    supabase.from('textbooks').select('*').order('name'),
  ])

  return (
    <DashboardClient
      initialStudents={students ?? []}
      initialTextbooks={textbooks ?? []}
    />
  )
}
