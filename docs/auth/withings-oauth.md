# Withings OAuth2 Flow

Same cookie-based pattern as Oura. Both flows land on `/` (Dashboard) — distinguished by `?state=withings` in the redirect.

## Flow 1: First-Time Login

```
1. User clicks "Connect Withings" in the dashboard tile
2. Browser redirects to Withings authorize URL (state=withings, scope=user.metrics)
3. User approves → Withings redirects to /?code=ABC&state=withings
4. Dashboard reads state=withings → passes code to useWithingsAuth
5. useWithingsAuth calls exchangeWithingsCode(code) → POST /api/withings/token
6. Backend POSTs to https://wbsapi.withings.net/v2/oauth2 (action=requesttoken)
7. Withings returns { status:0, body: { access_token, refresh_token, ... } }
8. Backend stores refresh_token in httpOnly cookie (withingsRefreshToken)
9. Returns access_token to frontend
10. Dashboard clears URL params, fetches body composition data
```

## Flow 2: Return Visit

```
1. No ?code in URL
2. useWithingsAuth calls refreshWithingsToken() → POST /api/withings/refresh
3. Backend uses withingsRefreshToken cookie to get new access_token
4. Returns access_token to frontend
5. Dashboard fetches body composition with new token
```

## Flow 3: Access Token Expires Mid-Session

```
1. fetchWithingsMeasures returns 401
2. Dashboard catches UNAUTHORIZED, calls refreshWithingsToken()
3. Retries fetchWithingsMeasures with new token
```

## Flow 4: No Refresh Token (Not Connected)

```
1. POST /api/withings/refresh returns 401 (no cookie)
2. useWithingsAuth sets error state
3. WithingsTile renders "Connect Withings" button
```

## Key Difference from Oura

Withings token endpoint wraps the response: `{ status: 0, body: { access_token, refresh_token } }`.  
Backend checks both HTTP status and `data.status === 0` before treating the request as successful.
