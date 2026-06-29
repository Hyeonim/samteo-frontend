import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userApi } from '../api/userApi'
import LoadingScreen from '../components/common/LoadingScreen'

function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, isLoggedIn } = useAuth()

  useEffect(() => {
    async function completeOAuth() {
      const linkToken = searchParams.get('linkToken')
      if (linkToken) {
        if (isLoggedIn) {
          try {
            const linked = await userApi.linkOAuthIdentity(linkToken)
            login(linked.token, {
              userId: linked.userId,
              email: linked.email,
              name: linked.name,
              role: linked.role,
            })
            navigate('/mypage', { replace: true, state: { oauthLinked: true } })
          } catch {
            navigate('/mypage', { replace: true, state: { oauthLinkFailed: true } })
          }
          return
        }

        sessionStorage.setItem('oauth_link_token', linkToken)
        const provider = searchParams.get('provider') || '새 로그인 방식'
        navigate('/login', {
          replace: true,
          state: {
            oauthLinkMessage: `같은 이메일의 기존 계정이 있습니다. 기존 로그인 방식으로 인증하면 ${provider} 계정이 연결됩니다.`,
          },
        })
        return
      }

      const token = searchParams.get('token')
      if (!token) {
        navigate('/login')
        return
      }

      try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')))
      login(token, { userId: payload.sub, email: payload.email, name: payload.name, role: payload.role })

      const pendingLinkToken = sessionStorage.getItem('oauth_link_token')
      if (pendingLinkToken) {
        const linked = await userApi.linkOAuthIdentity(pendingLinkToken)
        sessionStorage.removeItem('oauth_link_token')
        login(linked.token, {
          userId: linked.userId,
          email: linked.email,
          name: linked.name,
          role: linked.role,
        })
      }

      const returnTo = sessionStorage.getItem('auth_return_to') || '/'
      sessionStorage.removeItem('auth_return_to')
      navigate(returnTo, { replace: true })
      } catch {
        navigate('/login', { state: { oauthLinkMessage: '로그인 방식 연결을 완료하지 못했습니다. 다시 시도해 주세요.' } })
      }
    }

    completeOAuth()
  }, [isLoggedIn, login, navigate, searchParams])

  return (
    <LoadingScreen variant="page" message="로그인 처리 중입니다" description="인증 정보를 확인하고 있습니다." />
  )
}

export default OAuthCallbackPage
