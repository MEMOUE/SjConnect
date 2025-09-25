// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import authService, { type User, type LoginCredentials, type RegisterData } from '../services/auth'

export const useAuthStore = defineStore('auth', () => {
  // État
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  const setError = (err: string | null) => {
    error.value = err
  }

  const clearError = () => {
    error.value = null
  }

  const setUser = (userData: User | null) => {
    user.value = userData
    isAuthenticated.value = !!userData
    
    // Sauvegarder dans localStorage pour persistance
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('user')
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      isLoading.value = true
      clearError()
      
      const userData = await authService.login(credentials)
      setUser(userData)
      
      return userData
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Erreur de connexion'
      setError(errorMessage)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      isLoading.value = true
      clearError()
      
      const newUser = await authService.register(userData)
      setUser(newUser)
      
      return newUser
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Erreur lors de l\'inscription'
      setError(errorMessage)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      isLoading.value = true
      await authService.logout()
    } catch (err) {
      console.warn('Erreur lors de la déconnexion:', err)
    } finally {
      setUser(null)
      isLoading.value = false
    }
  }

  const checkAuth = async () => {
    try {
      isLoading.value = true
      
      // Vérifier si on a des données utilisateur en local
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        
        // Vérifier que la session est encore valide
        const isValid = await authService.refreshSession()
        if (isValid) {
          setUser(userData)
          return true
        } else {
          localStorage.removeItem('user')
        }
      }
      
      return false
    } catch (err) {
      console.warn('Erreur lors de la vérification d\'authentification:', err)
      localStorage.removeItem('user')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return {
    // État
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    register,
    logout,
    checkAuth,
    updateUser,
    setError,
    clearError
  }
})