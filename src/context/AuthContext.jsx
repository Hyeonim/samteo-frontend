import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)
export const AUTH_EXPIRED_EVENT = 'samteo:auth-expired'

function decodeTokenPayload(token) {
  try {
    const encoded = token.split('.')[1]
    if (!encoded) return null
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
      .padEnd(Math.ceil(encoded.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

function tokenExpiresAt(token) {
  const expiration = Number(decodeTokenPayload(token)?.exp)
  return Number.isFinite(expiration) ? expiration * 1000 : null
}

function clearStoredAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

function readStoredAuth() {
  const token = localStorage.getItem('token')
  const saved = localStorage.getItem('user')
  if (!token || !saved) return { user: null, expiresAt: null, expired: false }

  const expiresAt = tokenExpiresAt(token)
  if (!expiresAt || expiresAt <= Date.now()) {
    clearStoredAuth()
    return { user: null, expiresAt: null, expired: true }
  }

  try {
    return { user: JSON.parse(saved), expiresAt, expired: false }
  } catch {
    clearStoredAuth()
    return { user: null, expiresAt: null, expired: false }
  }
}

export function AuthProvider({ children }) {
  const [initialAuth] = useState(readStoredAuth)
  const [user, setUser] = useState(initialAuth.user)
  const [expiresAt, setExpiresAt] = useState(initialAuth.expiresAt)
  const [sessionExpired, setSessionExpired] = useState(initialAuth.expired)

  const expireSession = useCallback(() => {
    clearStoredAuth()
    setUser(null)
    setExpiresAt(null)
    setSessionExpired(true)
  }, [])

  const login = useCallback((token, userData) => {
    const nextExpiresAt = tokenExpiresAt(token)
    if (!nextExpiresAt || nextExpiresAt <= Date.now()) {
      expireSession()
      return false
    }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setExpiresAt(nextExpiresAt)
    setSessionExpired(false)
    return true
  }, [expireSession])

  const logout = useCallback(() => {
    clearStoredAuth()
    setUser(null)
    setExpiresAt(null)
    setSessionExpired(false)
  }, [])

  const acknowledgeSessionExpired = useCallback(() => {
    setSessionExpired(false)
  }, [])

  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(userData || {}) }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }, [])

  useEffect(() => {
    if (!expiresAt) return undefined
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) {
      expireSession()
      return undefined
    }
    const timer = window.setTimeout(expireSession, remaining)
    return () => window.clearTimeout(timer)
  }, [expiresAt, expireSession])

  useEffect(() => {
    const handleExpired = () => expireSession()
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired)
  }, [expireSession])

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      isLoggedIn: !!user,
      sessionExpired,
      acknowledgeSessionExpired,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
