'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Student, Assignment, Textbook } from '@/types'

const DAY_MAP: Record<string, number> = { 일:0, 월:1, 화:2, 수:3, 목:4, 금:5, 토:6 }

function getNextLesson(days: string[], time: string | null): string {
  const today = new Date()
  const todayDay = today.getDay()
  const dayNums = days.map(d => DAY_MAP[d]).sort((a, b) => a - b)
  let nextDay = dayNums.find(d => d > todayDay)
  if (nextDay === undefined) nextDay = dayNums[0]
  const diff = nextDay > todayDay ? nextDay - todayDay : 7 - todayDay + nextDay
  const next = new Date(today)
  next.setDate(today.getDate() + diff)
  const m = next.getMonth() + 1
  const d = next.getDate()
  const dayNames = ['일','월','화','수','목','금','토']
  return `${m}/${d}(${dayNames[next.getDay()]}) ${time ?? ''}`
}

function formatToday(): string {
  const d = new Date()
  return `${d.getMonth()+1}/${d.getDate()}`
}

const STATUS_ORDER: Assignment['status'][] = ['과제부과','수행중','수행완료','수업완료']

export default function TeacherDashboard() {
  const supabase = createClient()
  const [students, setStudents] = useState<Student[]>([])
  const [textbooks, setTextbooks] = useState<Textbook[]>([])
  const [selected, setSelected] = useState<Student | null>(null)
  const [history, setHistory] = useState<Assignment[]>([])
  const [assignType, setAssignType] = useState<'textbook'|'exam'>('textbook')
  const [form, setForm] = useState({
    prevTextbook: '', prevStart: '', prevEnd: '',
    newTextbook: '', newStart: '', newEnd: '',
    prevExam: '', prevExamStart: '', prevExamEnd: '',
    newExam: '', newExamStart: '', newExamEnd: '',
    nextDate: '', nextType: '정규수업',
  })
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingAssign, setPendingAssign] = useState<Partial<Assignment> | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from('students').select('*').eq('status', '진행 중').order('lesson_time'),
        supabase.from('textbooks').select('*').order('name'),
      ])
      setStudents(s ?? [])
      setTextbooks(t ?? [])
    }
    load()
  }, [])

  async function selectStudent(s: Student) {
    setSelected(s)
    setMessage('')
    setPendingAssign(null)
    setForm(f => ({
      ...f,
      nextDate: getNextLesson(s.lesson_days ?? [], s.lesson_time),
    }))
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('student_id', s.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setHistory(data ?? [])
  }

  function generateMessage() {
    if (!selected) return
    const tbMap: Record<string, string> = {}
    textbooks.forEach(t => { tbMap[t.id] = t.name })
    const lines: string[] = [`[${selected.name}] ${formatToday()} 수업 과제 안내`, '']

    if (assignType === 'textbook') {
      const prev = tbMap[form.prevTextbook]
      if (prev && form.prevStart && form.prevEnd) {
        lines.push(`📚 교재: ${prev}`)
        lines.push(`✅ 수행 완료: ${form.prevStart}~${form.prevEnd}p`)
      }
      const next = tbMap[form.newTextbook]
      if (!next || !form.newStart || !form.newEnd) return
      if (!prev) lines.push(`📚 교재: ${next}`)
      lines.push(`✏️ 과제: ${form.newStart}~${form.newEnd}p 풀어오기`)
      setPendingAssign({
        student_id: selected.id,
        textbook_id: form.newTextbook,
        assign_type: 'textbook',
        start_page: parseInt(form.newStart),
        end_page: parseInt(form.newEnd),
      })
    } else {
      const prev = tbMap[form.prevExam]
      if (prev && form.prevExamStart && form.prevExamEnd) {
        lines.push(`📝 기출: ${prev}`)
        lines.push(`✅ 수행 완료: ${form.prevExamStart}~${form.prevExamEnd}번`)
      }
      const next = tbMap[form.newExam]
      if (!next || !form.newExamStart || !form.newExamEnd) return
      if (!prev) lines.push(`📝 기출: ${next}`)
      lines.push(`✏️ 과제: ${form.newExamStart}~${form.newExamEnd}번`)
      setPendingAssign({
        student_id: selected.id,
        textbook_id: form.newExam,
        assign_type: 'exam',
        start_item: parseInt(form.newExamStart),
        end_item: parseInt(form.newExamEnd),
      })
    }

    lines.push('')
    if (form.nextDate) lines.push(`⏭ 다음 수업: ${form.nextDate} ${form.nextType}`)
    setMessage(lines.join('\n'))
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function saveAssignment() {
    if (!pendingAssign) return
    setSaving(true)
    await supabase.from('assignments').insert(pendingAssign)
    setSaving(false)
    if (selected) selectStudent(selected)
  }

  async function cycleStatus(id: string, current: Assignment['status']) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
    await supabase.from('assignments').update({ status: next }).eq('id', id)
    if (selected) selectStudent(selected)
  }

  const tbMap: Record<string, string> = {}
  textbooks.forEach(t => { tbMap[t.id] = t.name })
  const exams = textbooks.filter(t => t.type === 'exam')

  const s = {
    page: { background: 'var(--bg)', minHeight: '100vh' },
    header: { background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky' as const, top: 0, zIndex: 100 },
    logo: { fontSize: '15px', fontWeight: 700, color: 'var(--text)' },
    accent: { color: 'var(--accent)' },
    app: { maxWidth: '900px', margin: '0 auto', padding: '24px 16px', display: 'grid', gap: '20px' },
    card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' },
    cardHeader: { padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' },
    badge: { background: 'var(--accent)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', fontFamily: 'var(--mono)' },
    title: { fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text2)', textTransform: 'uppercase' as const },
    body: { padding: '20px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '10px' },
    sBtn: (sel: boolean) => ({
      background: sel ? 'rgba(124,108,248,0.1)' : 'var(--surface2)',
      border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: '10px', padding: '14px 12px', cursor: 'pointer', textAlign: 'left' as const,
    }),
    label: { fontSize: '11px', fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.5px', textTransform: 'uppercase' as const, display: 'block', marginBottom: '6px' },
    input: { background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box' as const },
    select: { background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '13px', width: '100%', outline: 'none' },
    tab: (active: boolean) => ({ flex: 1, padding: '10px', background: active ? 'rgba(124,108,248,0.12)' : 'var(--surface2)', border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'center' as const, fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : 'var(--text2)' }),
    btnPrimary: { width: '100%', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' },
    btnCopy: (copied: boolean) => ({ width: '100%', background: copied ? 'var(--accent)' : 'var(--accent2)', color: copied ? 'white' : 'var(--bg)', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '12px' }),
    preview: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px', fontSize: '13px', lineHeight: 1.9, whiteSpace: 'pre-wrap' as const, minHeight: '160px', color: message ? 'var(--text)' : 'var(--text3)', display: 'flex', alignItems: message ? 'flex-start' : 'center', justifyContent: message ? 'flex-start' : 'center' },
    statusBadge: (s: string) => {
      const map: Record<string, [string, string]> = {
        '과제부과': ['rgba(245,166,35,0.15)', 'var(--warn)'],
        '수행중': ['rgba(86,207,178,0.07)', 'var(--accent2)'],
        '수행완료': ['rgba(86,207,178,0.15)', 'var(--accent2)'],
        '수업완료': ['rgba(124,108,248,0.1)', 'var(--accent)'],
      }
      const [bg, color] = map[s] ?? ['var(--surface2)', 'var(--text2)']
      return { background: bg, color, fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' as const }
    },
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.logo}>최비경 <span style={s.accent}>국어</span> 과외</div>
        <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
          {students.length}명 · {new Date().toLocaleDateString('ko-KR')}
        </div>
      </header>

      <div style={s.app}>
        {/* STEP 1 */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.badge}>01</span>
            <span style={s.title}>학생 선택</span>
          </div>
          <div style={s.body}>
            <div style={s.grid}>
              {students.map(st => (
                <button key={st.id} style={s.sBtn(selected?.id === st.id)} onClick={() => selectStudent(st)}>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{st.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{st.grade} · {st.school?.replace(/고등학교|중학교/, '')}</div>
                  <div style={{ fontSize: '11px', color: 'var(--accent2)', marginTop: '4px', fontFamily: 'var(--mono)' }}>
                    {(st.lesson_days ?? []).join('/')} {st.lesson_time}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 2 */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.badge}>02</span>
            <span style={s.title}>과제 입력</span>
          </div>
          <div style={s.body}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button style={s.tab(assignType === 'textbook')} onClick={() => setAssignType('textbook')}>📚 교재형</button>
              <button style={s.tab(assignType === 'exam')} onClick={() => setAssignType('exam')}>📝 기출형</button>
            </div>

            {assignType === 'textbook' ? (
              <>
                <div style={{ background: 'rgba(86,207,178,0.06)', border: '1px solid rgba(86,207,178,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent2)', marginBottom: '10px' }}>✅ 완료된 범위 (선택)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><label style={s.label}>교재</label>
                      <select style={s.select} value={form.prevTextbook} onChange={e => setForm(f => ({...f, prevTextbook: e.target.value}))}>
                        <option value="">선택...</option>
                        {textbooks.filter(t => t.type === 'textbook').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div><label style={s.label}>완료 페이지</label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input style={s.input} type="number" placeholder="시작" value={form.prevStart} onChange={e => setForm(f => ({...f, prevStart: e.target.value}))} />
                        <span style={{ color: 'var(--text3)' }}>~</span>
                        <input style={s.input} type="number" placeholder="종료" value={form.prevEnd} onChange={e => setForm(f => ({...f, prevEnd: e.target.value}))} />
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div><label style={s.label}>과제 교재</label>
                    <select style={s.select} value={form.newTextbook} onChange={e => setForm(f => ({...f, newTextbook: e.target.value}))}>
                      <option value="">선택...</option>
                      {textbooks.filter(t => t.type === 'textbook').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div><label style={s.label}>과제 페이지</label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input style={s.input} type="number" placeholder="시작" value={form.newStart} onChange={e => setForm(f => ({...f, newStart: e.target.value}))} />
                      <span style={{ color: 'var(--text3)' }}>~</span>
                      <input style={s.input} type="number" placeholder="종료" value={form.newEnd} onChange={e => setForm(f => ({...f, newEnd: e.target.value}))} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: 'rgba(86,207,178,0.06)', border: '1px solid rgba(86,207,178,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent2)', marginBottom: '10px' }}>✅ 완료된 기출 (선택)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><label style={s.label}>시험 회차</label>
                      <select style={s.select} value={form.prevExam} onChange={e => setForm(f => ({...f, prevExam: e.target.value}))}>
                        <option value="">선택...</option>
                        {exams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div><label style={s.label}>완료 문항</label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input style={s.input} type="number" placeholder="시작" value={form.prevExamStart} onChange={e => setForm(f => ({...f, prevExamStart: e.target.value}))} />
                        <span style={{ color: 'var(--text3)' }}>~</span>
                        <input style={s.input} type="number" placeholder="종료" value={form.prevExamEnd} onChange={e => setForm(f => ({...f, prevExamEnd: e.target.value}))} />
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div><label style={s.label}>과제 회차</label>
                    <select style={s.select} value={form.newExam} onChange={e => setForm(f => ({...f, newExam: e.target.value}))}>
                      <option value="">선택...</option>
                      {exams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div><label style={s.label}>과제 문항</label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input style={s.input} type="number" placeholder="시작" value={form.newExamStart} onChange={e => setForm(f => ({...f, newExamStart: e.target.value}))} />
                      <span style={{ color: 'var(--text3)' }}>~</span>
                      <input style={s.input} type="number" placeholder="종료" value={form.newExamEnd} onChange={e => setForm(f => ({...f, newExamEnd: e.target.value}))} />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={s.label}>다음 수업일</label>
                  <input style={s.input} type="text" placeholder="예: 3/22(일)" value={form.nextDate} onChange={e => setForm(f => ({...f, nextDate: e.target.value}))} />
                </div>
                <div><label style={s.label}>수업 유형</label>
                  <select style={s.select} value={form.nextType} onChange={e => setForm(f => ({...f, nextType: e.target.value}))}>
                    <option>정규수업</option>
                    <option>보강</option>
                    <option>추가수업</option>
                  </select>
                </div>
              </div>
            </div>

            <button style={s.btnPrimary} onClick={generateMessage}>메시지 생성하기</button>
          </div>
        </div>

        {/* STEP 3 */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.badge}>03</span>
            <span style={s.title}>카카오 메시지 미리보기</span>
          </div>
          <div style={s.body}>
            <div style={s.preview}>
              {message || '학생을 선택하고 과제를 입력하면\n메시지가 자동 생성됩니다'}
            </div>
            {message && (
              <>
                <button style={s.btnCopy(copied)} onClick={copyMessage}>
                  {copied ? '✅ 복사됨!' : '📋 메시지 복사'}
                </button>
                <button style={{ ...s.btnPrimary, marginTop: '8px', opacity: saving ? 0.6 : 1 }} onClick={saveAssignment} disabled={saving}>
                  {saving ? '저장 중...' : '💾 과제 저장'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 과제 이력 */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={{ ...s.badge, background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }}>📋</span>
            <span style={s.title}>최근 과제 이력</span>
          </div>
          <div style={s.body}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '24px' }}>
                {selected ? '과제 이력이 없습니다' : '학생을 선택하면 이력이 표시됩니다'}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {history.map(a => (
                  <div key={a.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{tbMap[a.textbook_id] ?? a.textbook_id}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>
                        {a.assign_type === 'textbook' ? `${a.start_page}~${a.end_page}p` : `${a.start_item}~${a.end_item}번`}
                        {' · '}{new Date(a.assigned_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={s.statusBadge(a.status)}>{a.status}</span>
                      <button
                        style={{ background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--text2)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}
                        onClick={() => cycleStatus(a.id, a.status)}
                      >
                        변경
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
