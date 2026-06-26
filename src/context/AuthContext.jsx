import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    const saved = localStorage.getItem('user')
    if (token && saved) {
      try { return JSON.parse(saved) } catch { return null }
    }
    return null
  })

  const login = useCallback((token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(userData || {}) }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
