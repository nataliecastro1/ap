import { useState, useCallback } from 'react'
import type { User } from '../types'

const STORAGE_KEY = 'ap_user'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

interface UseAuthReturn {
  user:            User | null
  isAuthenticated: boolean
  login:           (email: string, password: string) => Promise<void>
  logout:          () => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(loadUser)

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })

    const json = await res.json()

    if (!res.ok) {
      throw new Error(json.detail ?? json.error ?? `Login failed (${res.status})`)
    }

    const u: User = {
      name:  json.name  ?? email.split('@')[0],
      email: json.email ?? email,
      token: json.token ?? json.access_token ?? '',
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return {
    user,
    isAuthenticated: user !== null,
    login,
    logout,
  }
}
