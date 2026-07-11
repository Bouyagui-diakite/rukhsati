import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import api, { getToken, setToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Au démarrage : si un jeton est présent, on récupère l'utilisateur courant.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }

    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // On déconnecte localement même si l'appel réseau échoue.
    }
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}

/** Portail d'accueil d'un utilisateur selon son rôle. */
export function homePathFor(user) {
  if (user?.role === 'operator') return '/operateur'
  if (user?.role === 'inspector') return '/inspecteur'
  return '/ministere'
}

/**
 * Protège une route : redirige vers /connexion si non authentifié, et vers
 * le portail approprié si le rôle n'est pas autorisé (`roles` optionnel).
 */
export function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">…</div>
  }

  if (!user) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user)} replace />
  }

  return children
}
