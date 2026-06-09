import { useState, useEffect, useRef } from 'react'
import { exchangeCode, refreshAccessToken } from '../api/oura'

interface AuthState {
  accessToken: string | null
  loading: boolean
  error: string | null
}

export function useOuraAuth(authCode: string | null): AuthState {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    loading: true,
    error: null,
  })
  // Prevent double-invoke in React Strict Mode from spending a one-time auth code twice
  const initiated = useRef(false)

  useEffect(() => {
    if (initiated.current) return
    initiated.current = true

    async function authenticate() {
      try {
        if (authCode) {
          const data = await exchangeCode(authCode)
          setState({ accessToken: data.access_token, loading: false, error: null })
        } else {
          const data = await refreshAccessToken()
          setState({ accessToken: data.access_token, loading: false, error: null })
        }
      } catch (e) {
        setState({ accessToken: null, loading: false, error: (e as Error).message })
      }
    }

    authenticate()
  }, [authCode])

  return state
}
