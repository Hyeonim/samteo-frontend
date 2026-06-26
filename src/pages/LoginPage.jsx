import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import './LoginPage.css'

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI || 'http://localhost:8080/login/oauth2/code/kakao'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:8080/login/oauth2/code/google'
const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID
const NAVER_REDIRECT_URI = import.meta.env.VITE_NAVER_REDIRECT_URI || 'http://localhost:8080/login/oauth2/code/naver'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleKakaoLogin = () => {
    if (!KAKAO_CLIENT_ID) {
      setError('카카오 로그인 설정이 비어 있습니다. 프론트엔드의 .env.local 파일에 VITE_KAKAO_CLIENT_ID를 설정해 주세요.')
      return
    }

    const kakaoAuthUrl =
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=${KAKAO_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
      `&response_type=code`
    window.location.href = kakaoAuthUrl
  }

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('구글 로그인 설정이 비어 있습니다. 프론트엔드의 .env.local 파일에 VITE_GOOGLE_CLIENT_ID를 설정해 주세요.')
      return
    }

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}`
    window.location.href = googleAuthUrl
  }

  const handleNaverLogin = () => {
    if (!NAVER_CLIENT_ID) {
      setError('네이버 로그인 설정이 비어 있습니다. 프론트엔드의 .env.local 파일에 VITE_NAVER_CLIENT_ID를 설정해 주세요.')
      return
    }

    const state = crypto.randomUUID()
    sessionStorage.setItem('naver_oauth_state', state)
    const naverAuthUrl =
      `https://nid.naver.com/oauth2.0/authorize` +
      `?response_type=code` +
      `&client_id=${NAVER_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(NAVER_REDIRECT_URI)}` +
      `&state=${encodeURIComponent(state)}`
    window.location.href = naverAuthUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', form)
      login(res.token, { userId: res.userId, email: res.email, name: res.name, role: res.role })
      navigate('/')
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="12" fill="url(#loginGrad)" />
            <defs>
              <linearGradient id="loginGrad" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <rect x="8" y="10" width="24" height="5" rx="2.5" fill="white" opacity="0.95" />
            <rect x="8" y="18" width="24" height="5" rx="2.5" fill="white" opacity="0.85" />
            <rect x="8" y="26" width="24" height="5" rx="2.5" fill="white" opacity="0.75" />
          </svg>
          <div className="login-logo__text">
            <div className="login-logo__name">삼터</div>
            <div className="login-logo__sub">쉼터 · 일터 · 놀터</div>
          </div>
        </div>

        <h1 className="login-title">로그인</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            className="login-input"
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="login-input"
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button className="login-btn-submit" type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-divider"><span>또는</span></div>

        <div className="social-login-group">
          <button className="social-btn kakao" onClick={handleKakaoLogin} type="button">
            <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C6.477 3 2 6.477 2 10.938c0 2.837 1.754 5.332 4.395 6.797l-1.12 4.09a.375.375 0 0 0 .545.42l4.734-3.134A11.75 11.75 0 0 0 12 19.5c5.523 0 10-3.813 10-8.562S17.523 3 12 3Z" fill="#3C1E1E" />
            </svg>
            카카오로 시작하기
          </button>
          <button className="social-btn google" onClick={handleGoogleLogin} type="button">
            <span className="social-google-mark" aria-hidden="true">G</span>
            구글로 시작하기
          </button>
          <button className="social-btn naver" onClick={handleNaverLogin} type="button">
            <span className="social-naver-mark" aria-hidden="true">N</span>
            네이버로 시작하기
          </button>
        </div>

        <p className="login-register-link">
          계정이 없으신가요? <Link to="/register">회원가입</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
