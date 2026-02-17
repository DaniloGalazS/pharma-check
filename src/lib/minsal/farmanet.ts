/**
 * PRO-55: MINSAL Farmanet API Client
 *
 * FHIR-based REST API for Chilean pharmacy locations and on-duty shifts.
 * Docs: https://devportal.minsal.cl/
 * Auth: OAuth 2 — register at credenciales-devportal.minsal.cl
 */

const BASE_URL = 'https://midas.minsal.cl/farmacia_v2/WS'

export interface FarmanetPharmacy {
  id: string
  nombre: string
  direccion: string
  comuna: string
  region: string
  telefono?: string
  latitud?: number
  longitud?: number
  local_id: string
  local_nombre: string
  funcionamiento_hora_apertura?: string
  funcionamiento_hora_cierre?: string
}

export interface FarmanetToken {
  access_token: string
  expires_in: number
  token_type: string
}

/** Exchange client credentials for an OAuth 2 access token */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.MINSAL_CLIENT_ID
  const clientSecret = process.env.MINSAL_CLIENT_SECRET
  const tokenUrl = process.env.MINSAL_TOKEN_URL ?? 'https://midas.minsal.cl/auth/token'

  if (!clientId || !clientSecret) {
    throw new Error('Missing MINSAL_CLIENT_ID or MINSAL_CLIENT_SECRET env vars')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    throw new Error(`Farmanet token error: ${res.status} ${await res.text()}`)
  }

  const data: FarmanetToken = await res.json()
  return data.access_token
}

async function farmanetGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error(`Farmanet API error ${res.status} on ${path}: ${await res.text()}`)
  }

  return res.json() as Promise<T>
}

/** Fetch all pharmacy locations from Farmanet */
export async function fetchFarmanetLocations(): Promise<FarmanetPharmacy[]> {
  const token = await getAccessToken()
  // Endpoint returns paginated FHIR Bundle; collect all pages
  const results: FarmanetPharmacy[] = []
  let page = 1
  const pageSize = 100

  while (true) {
    const data = await farmanetGet<FarmanetPharmacy[]>(
      `/farmacias?page=${page}&size=${pageSize}`,
      token
    )
    if (!data || data.length === 0) break
    results.push(...data)
    if (data.length < pageSize) break
    page++
  }

  return results
}

/** Fetch pharmacies currently on duty (turno) */
export async function fetchOnDutyPharmacies(): Promise<FarmanetPharmacy[]> {
  const token = await getAccessToken()
  return farmanetGet<FarmanetPharmacy[]>('/turno', token)
}
