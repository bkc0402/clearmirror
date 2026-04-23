export type Role = 'student' | 'teacher' | 'admin' | 'parent'

export type Profile = {
  id: string
  role: Role
  name: string
  created_at: string
}

export type StudentStatus = '진행 중' | '완료' | '중단'

export type Student = {
  id: string
  profile_id: string | null
  name: string
  grade: string
  school: string | null
  status: StudentStatus
  lesson_days: string[]
  lesson_time: string | null
  homework_schedule: string | null
  started_at: string | null
  created_at: string
}

export type StudentProfile = {
  student_id: string
  survey_student: Record<string, unknown> | null
  survey_student_at: string | null
  survey_parent: Record<string, unknown> | null
  survey_parent_at: string | null
  career_goals: string | null
  admission_strategy: string | null
  personality_notes: string | null
  updated_at: string | null
  updated_by: string | null
}

export type Textbook = {
  id: string
  name: string
  type: 'textbook' | 'exam'
  exam_year: number | null
  exam_month: number | null
  exam_org: string | null
  total_pages: number | null
  total_items: number | null
  created_at: string
}

export type Question = {
  id: string
  textbook_id: string
  work_id: string | null
  section_type: string | null
  section_num: number | null
  item_num: number | null
  page: number | null
  question_type: string | null
  answer: string
  is_objective: boolean
  tags: string[] | null
}

export type LessonType = '정규수업' | '보강' | '추가수업'
export type LessonStatus = '예정' | '완료' | '취소'

export type Lesson = {
  id: string
  student_id: string
  lesson_date: string
  lesson_time: string | null
  lesson_type: LessonType
  status: LessonStatus
  progress_note: string | null
  attitude_note: string | null
  event_note: string | null
  created_at: string
}

export type AssignmentStatus = '과제부과' | '수행중' | '수행완료' | '수업완료'
export type AssignType = 'textbook' | 'exam' | 'other'

export type Assignment = {
  id: string
  student_id: string
  lesson_id: string | null
  textbook_id: string
  assign_type: AssignType
  start_page: number | null
  end_page: number | null
  start_item: number | null
  end_item: number | null
  custom_note: string | null
  status: AssignmentStatus
  assigned_at: string
  completed_at: string | null
  created_at: string
}

export type StudentAnswer = {
  id: string
  student_id: string
  question_id: string
  assignment_id: string | null
  answer: string
  is_correct: boolean | null
  tried_at: string
}

export type Score = {
  id: string
  student_id: string
  score_type: '내신' | '모의고사' | '수능'
  subject: string | null
  grade_year: number | null
  grade_term: string | null
  exam_month: number | null
  raw_score: number | null
  standard_score: number | null
  percentile: number | null
  grade: number | null
  created_at: string
}
