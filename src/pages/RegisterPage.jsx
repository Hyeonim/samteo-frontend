import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import './RegisterPage.css'

function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/register', form)
      login(res.token, { userId: res.userId, email: res.email, name: res.name, role: res.role })
      navigate('/')
    } catch (err) {
      if (err.message.includes('409')) {
        setError('이미 사용 중인 이메일입니다.')
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-logo">
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="12" fill="url(#regGrad)" />
            <defs>
              <linearGradient id="regGrad" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <rect x="8" y="10" width="24" height="5" rx="2.5" fill="white" opacity="0.95" />
            <rect x="8" y="18" width="24" height="5" rx="2.5" fill="white" opacity="0.85" />
            <rect x="8" y="26" width="24" height="5" rx="2.5" fill="white" opacity="0.75" />
          </svg>
          <div className="register-logo__text">
            <div className="register-logo__name">삼터</div>
            <div className="register-logo__sub">쉼터 · 일터 · 놀터</div>
          </div>
        </div>

        <h1 className="register-title">회원가입</h1>

        <form className="register-form" onSubmit={handleSubmit}>
          <input
            className="register-input"
            type="text"
            placeholder="이름"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="register-input"
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="register-input"
            type="password"
            placeholder="비밀번호 (8자 이상)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
          {error && <p className="register-error">{error}</p>}
          <button className="register-btn-submit" type="submit" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="register-login-link">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
