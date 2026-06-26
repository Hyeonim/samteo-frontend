import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from '../components/common/LoadingScreen'

function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')))
      login(token, { userId: payload.sub, email: payload.email, name: payload.name, role: payload.role })
      navigate('/')
    } catch {
      navigate('/login')
    }
  }, [])

  return (
    <LoadingScreen variant="page" message="로그인 처리 중입니다" description="인증 정보를 확인하고 있습니다." />
  )
}

export default OAuthCallbackPage
