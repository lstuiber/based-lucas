import { useEffect, useState } from 'react'
import { getAuthStatus } from '../api/oura'

const REDIRECT_URI = 'http://localhost:5173/dashboard'
const SCOPES = ['daily', 'heartrate', 'personal']
const OURA_AUTH_URL =
  `https://cloud.ouraring.com/oauth/authorize?` +
  `client_id=${import.meta.env.VITE_oura_client_id}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=${SCOPES.join(' ')}`

export default function Home() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    getAuthStatus()
      .then(({ loggedIn }) => setLoggedIn(loggedIn))
      .catch(() => setLoggedIn(false))
  }, [])

  return (
    <div>
      {loggedIn === false && (
        <button onClick={() => { window.location.href = OURA_AUTH_URL }}>
          Connect Oura
        </button>
      )}
      {loggedIn === true && (
        <a href="/dashboard">Go to dashboard</a>
      )}
    </div>
  )
}
