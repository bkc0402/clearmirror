import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
 
  if (!user) redirect('/login')

 const { data: students } = await supabase
  .from('students')
  .select('*')
  .neq('status', '완료')
  .neq('status', '중단')
  .order('lesson_time')

const { data: textbooks } = await supabase
  .from('textbooks')
  .select('*')
  .order('name')

  return (
    <DashboardClient
      initialStudents={students ?? []}
      initialTextbooks={textbooks ?? []}
    />
  )
}
