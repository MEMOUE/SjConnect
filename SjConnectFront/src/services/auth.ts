// src/services/auth.ts
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}

// Configuration d'axios pour l'authentification
export const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Important pour les sessions Django
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token CSRF
authClient.interceptors.request.use(async (config) => {
  // Récupérer le token CSRF pour Django
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    try {
      const csrfResponse = await axios.get(`${API_BASE_URL}/api/csrf/`, { withCredentials: true })
      const csrfToken = csrfResponse.data.csrfToken
      config.headers['X-CSRFToken'] = csrfToken
    } catch (error) {
      console.warn('Impossible de récupérer le token CSRF:', error)
    }
  }
  return config
})

// Service d'authentification
class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await authClient.post('/api/auth/login/', credentials)
    return response.data.user
  }

  async register(userData: RegisterData): Promise<User> {
    const response = await authClient.post('/api/auth/register/', userData)
    return response.data.user
  }

  async logout(): Promise<void> {
    await authClient.post('/api/auth/logout/')
  }

  async getCurrentUser(): Promise<User> {
    const response = await authClient.get('/api/auth/user/')
    return response.data
  }

  async refreshSession(): Promise<boolean> {
    try {
      await this.getCurrentUser()
      return true
    } catch {
      return false
    }
  }
}

export const authService = new AuthService()
export default authService