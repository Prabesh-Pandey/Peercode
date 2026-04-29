// src/context/AuthContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react'
import { api } from '../api'

// ─── State shape ─────────────────────────────────────────────────────────────
// { user: null | { id, username, name, email, avatarUrl }, loading: true|false }

const initialState = { user: null, loading: true }

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { user: action.payload, loading: false }
    case 'CLEAR_USER':
      return { user: null, loading: false }
    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // On mount, check if a valid session already exists
  useEffect(() => {
    api.get('/auth/me')
      .then((user) => dispatch({ type: 'SET_USER', payload: user }))
      .catch(() => dispatch({ type: 'CLEAR_USER' }))
  }, [])

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {})
    dispatch({ type: 'CLEAR_USER' })
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ ...state, dispatch, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
