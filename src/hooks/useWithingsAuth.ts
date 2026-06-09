import { useState, useEffect, useRef } from 'react'
import { exchangeWithingsCode, refreshWithingsToken } from '../api/withings'

interface AuthState {
  accessToken: string | null
  loading: boolean
  error: string | null
}

export function useWithingsAuth(authCode: string | null): AuthState {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    loading: true,
    error: null,
  })
  const initiated = useRef(false)

  useEffect(() => {
    if (initiated.current) return
    initiated.current = true

    async function authenticate() {
      try {
        if (authCode) {
          const data = await exchangeWithingsCode(authCode)
          setState({ accessToken: data.access_token, loading: false, error: null })
        } else {
          const data = await refreshWithingsToken()
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
