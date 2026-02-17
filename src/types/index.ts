export type { Chain, MedicationSource, ScraperStatus } from '@prisma/client'
export type {
  Medication,
  Pharmacy,
  Price,
  User,
  Favorite,
  PriceAlert,
  ScraperRun,
} from '@prisma/client'

// API response shapes

export interface MedicationWithPrices {
  id: string
  genericName: string
  commercialName: string | null
  activePrinciple: string | null
  laboratory: string | null
  concentration: string | null
  presentation: string | null
  quantity: string | null
  prices: PriceWithPharmacy[]
}

export interface PriceWithPharmacy {
  id: string
  price: number
  inStock: boolean | null
  scrapedAt: Date
  pharmacy: {
    id: string
    chain: string
    name: string
    address: string
    commune: string
    region: string
    latitude: number | null
    longitude: number | null
  }
}

export interface SearchResult {
  medications: MedicationWithPrices[]
  total: number
  page: number
  pageSize: number
}
