import axios from 'axios'

const TOKEN_KEY = 'rk_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// Instance partagée : /api est proxifié vers le backend par Vite (voir vite.config.js).
const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Langue courante → le backend renvoie ses messages (validation) dans la
  // bonne langue (voir middleware SetLocale).
  config.headers['X-Locale'] = localStorage.getItem('lang') || 'fr'
  return config
})

// Un 401 signifie session expirée/invalide : on purge le jeton et on renvoie
// vers la connexion. On laisse l'appelant gérer les autres erreurs (422…).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null)
      if (!window.location.pathname.startsWith('/connexion')) {
        window.location.assign('/connexion')
      }
    }
    return Promise.reject(error)
  },
)

export default api
