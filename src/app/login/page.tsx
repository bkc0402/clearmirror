'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    // 역할 확인 후 리다이렉트
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const roleRedirect: Record<string, string> = {
      teacher: '/dashboard',
      admin: '/admin/students',
      student: '/dashboard',
      parent: '/dashboard',
    }

    router.push(roleRedirect[profile?.role ?? 'student'] ?? '/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap"
        rel="stylesheet"
      />
      <div style={{
        width: '100%',
        maxWidth: '380px',
        padding: '0 24px',
      }}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#e8e8f0',
            letterSpacing: '-0.5px',
            marginBottom: '8px',
          }}>
            명경지수
          </div>
          <div style={{
            fontSize: '12px',
            color: '#4a4a66',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}>
            clearmirror
          </div>
        </div>

        {/* 폼 */}
        <div style={{
          background: '#17171f',
          border: '1px solid #2a2a38',
          borderRadius: '16px',
          padding: '32px',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '700',
              color: '#8888aa',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="example@email.com"
              style={{
                width: '100%',
                background: '#1e1e28',
                border: '1.5px solid #2a2a38',
                borderRadius: '8px',
                padding: '11px 14px',
                color: '#e8e8f0',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '700',
              color: '#8888aa',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#1e1e28',
                border: '1.5px solid #2a2a38',
                borderRadius: '8px',
                padding: '11px 14px',
                color: '#e8e8f0',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(232,93,117,0.1)',
              border: '1px solid rgba(232,93,117,0.3)',
              color: '#e85d75',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              background: loading ? '#2a2a38' : '#7c6cf8',
              color: loading ? '#4a4a66' : 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '13px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#4a4a66',
          marginTop: '24px',
        }}>
          계정이 없으신가요? 선생님에게 문의하세요.
        </p>
      </div>
    </div>
  )
}
