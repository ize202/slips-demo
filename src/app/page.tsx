'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, BarChart, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TrustScore } from '@/components/TrustScore'
import Link from 'next/link'

type SearchResult = {
  id: number
  brand_name: string
  full_name: string
  image_url: string | null
  product_url: string | null
  trust_score: number
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [queryTime, setQueryTime] = useState<number | null>(null)

  const searchProducts = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    const startTime = performance.now()

    try {
      // First get the labels
      const { data: labels, error: labelsError } = await supabase
        .from('labels')
        .select('id, brand_name, full_name')
        .ilike('search_text', `%${term}%`)
        .limit(20)

      if (labelsError) {
        console.error('Search error:', labelsError)
        setResults([])
        setQueryTime(performance.now() - startTime)
        return
      }

      if (!labels || labels.length === 0) {
        setResults([])
        setQueryTime(performance.now() - startTime)
        return
      }

      const labelIds = labels.map(l => l.id)

      // Get products for these labels
      const { data: products } = await supabase
        .from('products')
        .select('dsld_label_id, image_url, product_url')
        .in('dsld_label_id', labelIds)

      // Get verifications for these labels
      const { data: verifications } = await supabase
        .from('verification')
        .select(`
          product_id,
          usp_verified,
          informed_sport,
          informed_choice,
          nsf_certified,
          fda_flagged,
          bscg,
          ifos
        `)
        .in('product_id', labelIds)

      // Combine the data
      const results = labels.map((label) => {
        const product = products?.find(p => p.dsld_label_id === label.id)
        const verification = verifications?.find(v => v.product_id === label.id)

        const certCount = verification ? [
          verification.usp_verified,
          verification.informed_sport,
          verification.informed_choice,
          verification.nsf_certified,
          verification.bscg,
          verification.ifos
        ].filter(Boolean).length : 0

        const trustScore = Math.min(100, Math.max(0, 
          50 + (certCount * 10) - (verification?.fda_flagged ? 50 : 0)
        ))

        return {
          id: label.id,
          brand_name: label.brand_name,
          full_name: label.full_name,
          image_url: product?.image_url || null,
          product_url: product?.product_url || null,
          trust_score: trustScore
        }
      })

      setResults(results)
      setQueryTime(performance.now() - startTime)
    } catch (error: any) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchProducts(searchTerm)
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm, searchProducts])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Slips Demo</h1>
          <p className="text-gray-600">Test database performance and search functionality</p>
        </div>

        <div className="flex gap-4 justify-center mb-8">
          <Link href="/scan" className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Package size={20} />
            Barcode Scanner
          </Link>
          <Link href="/metrics" className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            <BarChart size={20} />
            Performance Metrics
          </Link>
        </div>

        <div className="relative max-w-2xl mx-auto mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search supplements by brand or product name..."
            className="w-full pl-10 pr-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {queryTime !== null && (
          <div className="text-center text-sm text-gray-500 mb-4">
            Query time: {queryTime.toFixed(2)}ms
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-4">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.full_name}
                    className="w-20 h-20 object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                    <Package className="text-gray-400" size={32} />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product.brand_name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.full_name}</p>
                  <TrustScore score={product.trust_score} size="sm" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {searchTerm && !loading && results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found for "{searchTerm}"
          </div>
        )}
      </div>
    </main>
  )
}