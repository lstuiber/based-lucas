import type { WithingsMeasures } from '../types/withings'

export async function exchangeWithingsCode(code: string): Promise<{ access_token: string; userid: number }> {
  const res = await fetch('/api/withings/token', {
    method: 'POST',
    credentials: 'include',
    body: new URLSearchParams({ code }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Token exchange failed: ${res.status}`)
  }
  return res.json()
}

export async function refreshWithingsToken(): Promise<{ access_token: string }> {
  const res = await fetch('/api/withings/refresh', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  return res.json()
}

export async function fetchWithingsMeasures(accessToken: string): Promise<WithingsMeasures | null> {
  const res = await fetch('/api/withings/measures', {
    method: 'POST',
    body: new URLSearchParams({ accessToken }),
  })
  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}
