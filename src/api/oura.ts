import type { DailySleep, DailyReadiness, DailyActivity, Averages } from '../types/oura'

export async function getAuthStatus(): Promise<{ loggedIn: boolean }> {
  const res = await fetch('/api/auth/status', { credentials: 'include' })
  if (!res.ok) return { loggedIn: false }
  return res.json()
}

export async function exchangeCode(code: string): Promise<{ access_token: string }> {
  const res = await fetch('/api/oura/token', {
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

export async function refreshAccessToken(): Promise<{ access_token: string }> {
  const res = await fetch('/api/refresh', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  return res.json()
}

async function fetchScore<T>(route: string, accessToken: string): Promise<T | null> {
  const res = await fetch(route, {
    method: 'POST',
    body: new URLSearchParams({ accessToken }),
  })
  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (!res.ok) throw new Error(`Fetch failed (${route}): ${res.status}`)
  return res.json()
}

export const fetchDailySleep = (accessToken: string) =>
  fetchScore<DailySleep>('/api/sleep', accessToken)

export const fetchDailyReadiness = (accessToken: string) =>
  fetchScore<DailyReadiness>('/api/readiness', accessToken)

export const fetchDailyActivity = (accessToken: string) =>
  fetchScore<DailyActivity>('/api/activity', accessToken)

async function fetchAvg(route: string, accessToken: string): Promise<Averages> {
  const res = await fetch(route, {
    method: 'POST',
    body: new URLSearchParams({ accessToken }),
  })
  if (!res.ok) throw new Error(`Fetch failed (${route}): ${res.status}`)
  return res.json()
}

export const fetchSleepAverages = (accessToken: string) =>
  fetchAvg('/api/sleep/averages', accessToken)

export const fetchReadinessAverages = (accessToken: string) =>
  fetchAvg('/api/readiness/averages', accessToken)

export const fetchActivityAverages = (accessToken: string) =>
  fetchAvg('/api/activity/averages', accessToken)
