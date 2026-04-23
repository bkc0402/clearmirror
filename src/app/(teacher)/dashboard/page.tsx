import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
 
  if (!user) redirect('/login')

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*')
  
  const { data: textbooks, error: textbooksError } = await supabase
    .from('textbooks')
    .select('*')

  return (
    <DashboardClient
      initialStudents={students ?? []}
      initialTextbooks={textbooks ?? []}
    />
  )
}
