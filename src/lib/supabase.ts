import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Product = {
  id: string
  brand_name: string
  canonical_name: string
  format: string
  dsld_label_id: number
  product_url: string | null
  image_url: string | null
}

export type Label = {
  id: number
  brand_name: string
  full_name: string
  upc: string
  product_type: string
  off_market: number
  thumbnail: string | null
  search_text: string
}

export type Verification = {
  product_id: number
  usp_verified: boolean
  informed_sport: boolean
  informed_choice: boolean
  nsf_certified: boolean
  fda_flagged: boolean
  bscg: boolean
  ifos: boolean
  clean_label_project_certified: boolean
  non_gmo_certified: boolean
  gf_certified: boolean
  usda_organic_certified: boolean
  vegan_action_certified: boolean
}

export type ProductVariant = {
  id: string
  product_id: string
  gtin: string
  flavor: string | null
  size_qty: number | null
  size_unit: string | null
}