import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  console.log('AUTH USER:', user?.id, 'ERROR:', authError?.message)
  
  if (!user) redirect('/login')

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*')
  
  const { data: textbooks, error: textbooksError } = await supabase
    .from('textbooks')
    .select('*')

  console.log('STUDENTS:', students?.length, 'ERROR:', studentsError?.message)
  console.log('TEXTBOOKS:', textbooks?.length, 'ERROR:', textbooksError?.message)

  return (
    <DashboardClient
      initialStudents={students ?? []}
      initialTextbooks={textbooks ?? []}
    />
  )
}
