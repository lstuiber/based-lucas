# Withings Integration

Body composition data from Withings smart scales via the Withings API.

## OAuth2 Setup

**Authorize URL:** `https://account.withings.com/oauth2_user/authorize2`  
**Token URL:** `https://wbsapi.withings.net/v2/oauth2`  
**Scope:** `user.metrics`  
**Redirect URI:** `http://localhost:5173/`  
**State param:** `withings` (used to distinguish from Oura OAuth callback on the same route)

## Environment Variables

| Variable | Used by | Description |
|---|---|---|
| `VITE_withings_client_id` | Frontend | Client ID for OAuth authorize URL |
| `withings_client_id` | Backend | Client ID for token exchange |
| `withings_secret` | Backend | Client secret — never expose to frontend |

Register your app at [developer.withings.com](https://developer.withings.com) and set the redirect URI to `http://localhost:5173/`.

## Frontend Code

| File | Purpose |
|---|---|
| `src/hooks/useWithingsAuth.ts` | OAuth2 hook — exchanges code or refreshes token |
| `src/api/withings.ts` | API call functions |
| `src/types/withings.ts` | `WithingsMeasures` type |
| `src/components/WithingsTile.tsx` | Dashboard tile |

## API Endpoints

| Frontend call | Backend route | Withings API |
|---|---|---|
| `exchangeWithingsCode(code)` | `POST /api/withings/token` | `POST https://wbsapi.withings.net/v2/oauth2` |
| `refreshWithingsToken()` | `POST /api/withings/refresh` | `POST https://wbsapi.withings.net/v2/oauth2` |
| `fetchWithingsMeasures(token)` | `POST /api/withings/measures` | `GET https://wbsapi.withings.net/measure?action=getmeas` |

## Measure Types Fetched

| Withings type | API unit | Returned as | Field |
|---|---|---|---|
| 1 | kg | lbs | `weight` |
| 76 | kg | lbs | `muscle` |
| 8 | kg | lbs | `fat` |
| 77 | kg (hydration mass) | % body water | `water` |

Raw values are decoded with `real_value = measure.value × 10^measure.unit` (SI units).

Weight, muscle, and fat are converted to lbs (`kg × 2.20462`).

Water is expressed as a percentage to match the Withings app display: `(hydration_kg / weight_kg) × 100`. The API returns hydration as a mass in kg; the percentage is derived on the backend.

## Token Storage

Same pattern as Oura:
- **Refresh token:** stored in `withingsRefreshToken` httpOnly cookie (server-side only)
- **Access token:** lives in JS memory, never persisted
