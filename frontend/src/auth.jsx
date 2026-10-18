import { createContext, useContext, useState } from 'react'
import { authApi, session } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => session.get())

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password })
    session.set(data)
    setUser(data)
  }

  const logout = () => {
    session.clear()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
